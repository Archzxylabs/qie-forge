// B06: scoped transaction evidence tests (PRD FR-007, FR-009, FR-021, §14.4, §14.5).
// All chain interactions run against injected mock transports; no network is contacted
// and no mocked result is ever presented as live network evidence.
import test from 'node:test';
import assert from 'node:assert/strict';
import { cp, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildRelease } from '../scripts/lib/release.mjs';
import { ACTION_KINDS, observeTransaction, REPORT_SCHEMA_VERSION } from '../scripts/lib/transaction-diagnostic.mjs';
import { dispatchTransport, errorResponse, failingTransport, jsonResponse, rawResponse } from './support/mock-rpc.mjs';
import { projectRoot, schemaRoot, fixtureProject, temporaryDirectory } from './support/fixtures.mjs';
import { runNodeResult } from './support/process.mjs';
import { loadValidators } from '../scripts/lib/schemas.mjs';

const NOW = '2026-10-19T04:00:00Z';
const URL_MAINNET = 'https://rpc1mainnet.qie.digital/';
const URL_TESTNET = 'https://rpc1testnet.qie.digital/';
const TX = `0x${'ab'.repeat(32)}`;
const OTHER_TX = `0x${'cd'.repeat(32)}`;
const BLOCK_HASH = `0x${'cc'.repeat(32)}`;
const EXPECTED = '0x1111111111111111111111111111111111111111';
const OTHER = '0x2222222222222222222222222222222222222222';
const CODE = '0x6080604052';

const packaged = JSON.parse(await readFile(new URL('../skills/qie-networks/data/network-claims.json', import.meta.url), 'utf8'));
const validate = await loadValidators(schemaRoot);

const receipt = (overrides = {}) => ({
  transactionHash: TX, blockHash: BLOCK_HASH, blockNumber: '0x64',
  to: null, contractAddress: EXPECTED, status: '0x1', ...overrides,
});
const callReceipt = (overrides = {}) => receipt({ to: OTHER, contractAddress: null, ...overrides });

const deployOptions = (transportOverrides = {}, overrides = {}) => ({
  networkId: 'qie-mainnet', txHash: TX, rpcUrl: URL_MAINNET, expectedChainId: null,
  snapshot: packaged, now: NOW,
  expectedAction: { kind: 'DEPLOY_DIRECT', expectedContractAddress: EXPECTED, expectedPostcondition: 'runtime-code-present' },
  ...overrides,
});
const genericOptions = (expectedTo = OTHER, overrides = {}) => ({
  networkId: 'qie-mainnet', txHash: TX, rpcUrl: URL_MAINNET, expectedChainId: null,
  snapshot: packaged, now: NOW, expectedAction: { kind: 'GENERIC_TX', expectedTo }, ...overrides,
});

// Every negative fixture returns { report, calls } and asserts a stable error class;
// none may ever produce APPLICATION_VERIFIED.
const NEGATIVE_FIXTURES = [
  {
    id: 'neg-01 wrong chain on a mainnet-labelled task',
    make: () => {
      const transport = dispatchTransport({ eth_chainId: jsonResponse('0x1') });
      return { transport, run: () => observeTransaction(deployOptions(null, { transport })) };
    },
    expect: { errorCode: 'WRONG_CHAIN', applicationOutcome: 'UNKNOWN', calls: 1 },
  },
  {
    id: 'neg-02 receipt lookup unavailable (RPC error)',
    make: () => {
      const transport = dispatchTransport({
        eth_chainId: jsonResponse('0x7c6'),
        eth_getTransactionReceipt: async () => rawResponse(500, 'oops'),
      });
      return { transport, run: () => observeTransaction(deployOptions(null, { transport })) };
    },
    expect: { errorCode: 'RPC_UNAVAILABLE', applicationOutcome: 'UNKNOWN', calls: 2 },
  },
  {
    id: 'neg-03 receipt lookup rate-limited',
    make: () => {
      const transport = dispatchTransport({
        eth_chainId: jsonResponse('0x7c6'),
        eth_getTransactionReceipt: async () => rawResponse(429, 'slow down'),
      });
      return { transport, run: () => observeTransaction(deployOptions(null, { transport })) };
    },
    expect: { errorCode: 'RPC_RATE_LIMITED', applicationOutcome: 'UNKNOWN', calls: 2 },
  },
  {
    id: 'neg-04 fabricated transaction (no receipt)',
    make: () => {
      const transport = dispatchTransport({ eth_chainId: jsonResponse('0x7c6'), eth_getTransactionReceipt: jsonResponse(null) });
      return { transport, run: () => observeTransaction(deployOptions(null, { transport })) };
    },
    expect: { errorCode: 'TX_NOT_FOUND', applicationOutcome: 'UNKNOWN', calls: 2 },
    assert: (report) => {
      assert.equal(report.checks.inclusion, 'UNKNOWN');
      assert.match(report.warnings.join(' '), /fabricated or noncanonical hash never counts as inclusion/);
    },
  },
  {
    id: 'neg-05 pending transaction (no block yet)',
    make: () => {
      const transport = dispatchTransport({
        eth_chainId: jsonResponse('0x7c6'),
        eth_getTransactionReceipt: jsonResponse(receipt({ blockHash: null, blockNumber: null, contractAddress: null })),
      });
      return { transport, run: () => observeTransaction(deployOptions(null, { transport })) };
    },
    expect: { errorCode: 'TX_PENDING', applicationOutcome: 'PENDING', calls: 2 },
    assert: (report) => assert.equal(report.checks.inclusion, 'UNKNOWN'),
  },
  {
    id: 'neg-06 reverted creation',
    make: () => {
      const transport = dispatchTransport({
        eth_chainId: jsonResponse('0x7c6'),
        eth_getTransactionReceipt: jsonResponse(receipt({ status: '0x0' })),
        eth_getCode: jsonResponse('0x'),
      });
      return { transport, run: () => observeTransaction(deployOptions(null, { transport })) };
    },
    expect: { errorCode: 'TX_REVERTED', applicationOutcome: 'APPLICATION_FAILED', calls: 3 },
    assert: (report) => {
      assert.equal(report.checks.execution, 'FAIL');
      assert.equal(report.checks.applicationEffect, 'FAIL');
      assert.match(report.warnings.join(' '), /empty-code response/);
    },
  },
  {
    id: 'neg-07 receipt created a different contract than expected',
    make: () => {
      const transport = dispatchTransport({
        eth_chainId: jsonResponse('0x7c6'),
        eth_getTransactionReceipt: jsonResponse(receipt({ contractAddress: OTHER })),
      });
      return { transport, run: () => observeTransaction(deployOptions(null, { transport })) };
    },
    expect: { errorCode: 'ADDRESS_UNVERIFIED', applicationOutcome: 'APPLICATION_FAILED', calls: 2 },
    assert: (report) => assert.equal(report.checks.identityLinkage, 'FAIL'),
  },
  {
    id: 'neg-08 receipt carries no created-contract address',
    make: () => {
      const transport = dispatchTransport({
        eth_chainId: jsonResponse('0x7c6'),
        eth_getTransactionReceipt: jsonResponse(callReceipt()),
      });
      return { transport, run: () => observeTransaction(deployOptions(null, { transport })) };
    },
    expect: { errorCode: 'ADDRESS_UNVERIFIED', applicationOutcome: 'APPLICATION_FAILED', calls: 2 },
    assert: (report) => assert.equal(report.checks.identityLinkage, 'FAIL'),
  },
  {
    id: 'neg-09 valid empty code at the expected contract',
    make: () => {
      const transport = dispatchTransport({
        eth_chainId: jsonResponse('0x7c6'),
        eth_getTransactionReceipt: jsonResponse(receipt()),
        eth_getCode: jsonResponse('0x'),
      });
      return { transport, run: () => observeTransaction(deployOptions(null, { transport })) };
    },
    expect: { errorCode: 'CONTRACT_NO_CODE', applicationOutcome: 'APPLICATION_FAILED', calls: 3 },
    assert: (report) => {
      assert.equal(report.observed.codePresent, false);
      assert.match(report.warnings.join(' '), /empty-code response/);
    },
  },
  {
    id: 'neg-10 eth_getCode returned malformed bytecode',
    make: () => {
      const transport = dispatchTransport({
        eth_chainId: jsonResponse('0x7c6'),
        eth_getTransactionReceipt: jsonResponse(receipt()),
        eth_getCode: jsonResponse('runtime-code!'),
      });
      return { transport, run: () => observeTransaction(deployOptions(null, { transport })) };
    },
    expect: { errorCode: 'RPC_MALFORMED', applicationOutcome: 'UNKNOWN', calls: 3 },
    assert: (report) => {
      assert.equal(report.checks.identityLinkage, 'UNKNOWN');
      assert.equal(report.observed.codePresent, null);
    },
  },
  {
    id: 'neg-11 eth_getCode returned odd-length bytecode',
    make: () => {
      const transport = dispatchTransport({
        eth_chainId: jsonResponse('0x7c6'),
        eth_getTransactionReceipt: jsonResponse(receipt()),
        eth_getCode: jsonResponse('0x123'),
      });
      return { transport, run: () => observeTransaction(deployOptions(null, { transport })) };
    },
    expect: { errorCode: 'RPC_MALFORMED', applicationOutcome: 'UNKNOWN', calls: 3 },
  },
  {
    id: 'neg-12 receipt block hash is not a hash',
    make: () => {
      const transport = dispatchTransport({
        eth_chainId: jsonResponse('0x7c6'),
        eth_getTransactionReceipt: jsonResponse(receipt({ blockHash: 'oops-not-a-hash' })),
      });
      return { transport, run: () => observeTransaction(deployOptions(null, { transport })) };
    },
    expect: { errorCode: 'RPC_MALFORMED', applicationOutcome: 'UNKNOWN', calls: 2 },
    assert: (report) => {
      assert.equal(report.checks.inclusion, 'UNKNOWN');
      assert.equal(report.checks.execution, 'NOT_RUN');
      assert.equal(report.observed.receiptStatus, 'NOT_RUN');
      assert.match(report.warnings.join(' '), /malformed evidence \(block hash\)/);
    },
  },
  {
    id: 'neg-13 receipt block number is not a quantity',
    make: () => {
      const transport = dispatchTransport({
        eth_chainId: jsonResponse('0x7c6'),
        eth_getTransactionReceipt: jsonResponse(receipt({ blockNumber: 'oops-not-a-quantity' })),
      });
      return { transport, run: () => observeTransaction(deployOptions(null, { transport })) };
    },
    expect: { errorCode: 'RPC_MALFORMED', applicationOutcome: 'UNKNOWN', calls: 2 },
  },
  {
    id: 'neg-14 receipt status is not a canonical execution status',
    make: () => {
      const transport = dispatchTransport({
        eth_chainId: jsonResponse('0x7c6'),
        eth_getTransactionReceipt: jsonResponse(receipt({ status: '0x2' })),
      });
      return { transport, run: () => observeTransaction(deployOptions(null, { transport })) };
    },
    expect: { errorCode: 'RPC_MALFORMED', applicationOutcome: 'UNKNOWN', calls: 2 },
  },
  {
    id: 'neg-15 receipt does not echo the requested transaction hash',
    make: () => {
      const transport = dispatchTransport({
        eth_chainId: jsonResponse('0x7c6'),
        eth_getTransactionReceipt: jsonResponse(receipt({ transactionHash: OTHER_TX })),
      });
      return { transport, run: () => observeTransaction(deployOptions(null, { transport })) };
    },
    expect: { errorCode: 'RPC_MALFORMED', applicationOutcome: 'UNKNOWN', calls: 2 },
    assert: (report) => assert.match(report.warnings.join(' '), /does not echo the requested transaction hash/),
  },
  {
    id: 'neg-16 receipt claims both a call target and a created contract',
    make: () => {
      const transport = dispatchTransport({
        eth_chainId: jsonResponse('0x7c6'),
        eth_getTransactionReceipt: jsonResponse(receipt({ to: OTHER, contractAddress: EXPECTED })),
      });
      return { transport, run: () => observeTransaction(deployOptions(null, { transport })) };
    },
    expect: { errorCode: 'RPC_MALFORMED', applicationOutcome: 'UNKNOWN', calls: 2 },
    assert: (report) => assert.match(report.warnings.join(' '), /both a call target and a created contract/),
  },
  {
    id: 'neg-17 receipt target is not the expected target',
    make: () => {
      const transport = dispatchTransport({
        eth_chainId: jsonResponse('0x7c6'),
        eth_getTransactionReceipt: jsonResponse(callReceipt()),
      });
      return { transport, run: () => observeTransaction(genericOptions(EXPECTED, { transport })) };
    },
    expect: { errorCode: 'ADDRESS_UNVERIFIED', applicationOutcome: 'APPLICATION_FAILED', calls: 2 },
    assert: (report) => assert.equal(report.checks.identityLinkage, 'FAIL'),
  },
  {
    id: 'neg-18 unbound generic receipt asserts only generic facts',
    make: () => {
      const transport = dispatchTransport({
        eth_chainId: jsonResponse('0x7c6'),
        eth_getTransactionReceipt: jsonResponse(callReceipt()),
      });
      return { transport, run: () => observeTransaction(genericOptions(null, { transport })) };
    },
    expect: { applicationOutcome: 'UNKNOWN', calls: 2 },
    assert: (report) => {
      assert.equal(report.checks.identityLinkage, 'NOT_RUN');
      assert.equal(report.checks.applicationEffect, 'NOT_RUN');
      assert.match(report.warnings.join(' '), /only generic receipt facts/);
    },
  },
  {
    id: 'neg-19 unsupported chain snapshot method',
    make: () => {
      const transport = dispatchTransport({ eth_chainId: async () => errorResponse(-32601, 'method not found') });
      return { transport, run: () => observeTransaction(deployOptions(null, { transport })) };
    },
    expect: { errorCode: 'UNSUPPORTED_PROVIDER', applicationOutcome: 'UNKNOWN', calls: 1 },
  },
  {
    id: 'neg-20 malformed chain quantity',
    make: () => {
      const transport = dispatchTransport({ eth_chainId: jsonResponse('1990') });
      return { transport, run: () => observeTransaction(deployOptions(null, { transport })) };
    },
    expect: { errorCode: 'RPC_MALFORMED', applicationOutcome: 'UNKNOWN', calls: 1 },
  },
  {
    id: 'neg-21 transport failure instead of chain data',
    make: () => {
      const transport = dispatchTransport({
        eth_chainId: async () => { throw new Error('NETWORK_DISABLED_BY_TEST'); },
      });
      return { transport, run: () => observeTransaction(deployOptions(null, { transport })) };
    },
    expect: { errorCode: 'RPC_UNAVAILABLE', applicationOutcome: 'UNKNOWN', calls: 1 },
  },
];

for (const fixture of NEGATIVE_FIXTURES) {
  test(`negative fixture: ${fixture.id}`, async () => {
    const { transport, run } = fixture.make();
    const report = await run();
    assert.notEqual(report.applicationOutcome, 'APPLICATION_VERIFIED', 'a negative fixture can never verify the application');
    assert.equal(report.schemaVersion, REPORT_SCHEMA_VERSION);
    assert.doesNotThrow(() => validate('evidence-report', report), 'the negative report still satisfies the schema contract');
    if (fixture.expect.errorCode !== undefined) assert.equal(report.errorCode, fixture.expect.errorCode);
    if (fixture.expect.applicationOutcome !== undefined) assert.equal(report.applicationOutcome, fixture.expect.applicationOutcome);
    if (fixture.expect.calls !== undefined) assert.equal(transport.calls.length, fixture.expect.calls);
    if (fixture.assert) fixture.assert(report);
  });
}

test('at least twelve negative-path fixtures are frozen in this suite', () => {
  assert.ok(NEGATIVE_FIXTURES.length >= 12, `expected ≥12 negative fixtures, found ${NEGATIVE_FIXTURES.length}`);
});

test('A fully scoped deployment passes every check yet stays UNKNOWN with a limited report', async () => {
  const transport = dispatchTransport({
    eth_chainId: jsonResponse('0x7c6'),
    eth_getTransactionReceipt: jsonResponse(receipt()),
    eth_getCode: jsonResponse(CODE),
  });
  const report = await observeTransaction(deployOptions(null, { transport }));
  assert.equal(report.checks.inclusion, 'PASS');
  assert.equal(report.checks.execution, 'PASS');
  assert.equal(report.checks.identityLinkage, 'PASS');
  assert.equal(report.checks.applicationEffect, 'PASS');
  assert.equal(report.checks.finality, 'UNKNOWN');
  assert.equal(report.applicationOutcome, 'UNKNOWN');
  assert.equal(report.limitedObservation, 'CONFIRMED_AT_BLOCK');
  assert.equal(report.observed.receiptBlockNumber, 100);
  assert.equal(report.observed.codePresent, true);
  assert.equal(report.generatedAt, NOW);
  assert.equal(transport.calls.length, 3);
  assert.match(report.warnings.join(' '), /latest block, not pinned to the inclusion block/);
  assert.doesNotThrow(() => validate('evidence-report', report));
});

test('A bound generic receipt passes receipt facts without any application claim', async () => {
  const report = await observeTransaction(genericOptions(OTHER, {
    transport: dispatchTransport({ eth_chainId: jsonResponse('0x7c6'), eth_getTransactionReceipt: jsonResponse(callReceipt()) }),
  }));
  assert.equal(report.checks.inclusion, 'PASS');
  assert.equal(report.checks.execution, 'PASS');
  assert.equal(report.checks.identityLinkage, 'PASS');
  assert.equal(report.checks.applicationEffect, 'NOT_RUN');
  assert.equal(report.applicationOutcome, 'UNKNOWN');
  assert.equal(report.limitedObservation, null);
  assert.match(report.warnings.join(' '), /no application effect was requested or verified/);
  assert.doesNotThrow(() => validate('evidence-report', report));
});

test('A MINT request is refused explicitly without any network call', async () => {
  const transport = dispatchTransport({ eth_chainId: jsonResponse('0x7c6') });
  const report = await observeTransaction(deployOptions(null, {
    transport,
    expectedAction: { kind: 'MINT', expectedContractAddress: EXPECTED },
  }));
  assert.equal(report.applicationOutcome, 'NOT_RUN');
  assert.equal(transport.calls.length, 0, 'a refused action never contacts the chain');
  assert.match(report.warnings.join(' '), /no outcome may be inferred from a generic receipt/);
  assert.doesNotThrow(() => validate('evidence-report', report));
});

test('Network labels are bound to the packaged canonical chain IDs (F-02)', async () => {
  await assert.rejects(
    observeTransaction(deployOptions(null, { networkId: 'qie-testnet', expectedChainId: 1990 })),
    /expectedChainId 1990 does not match the packaged chain ID 1983/,
  );
  // A testnet-labelled task pointed at a mainnet chain reply must stop, not inspect mainnet data.
  const transport = dispatchTransport({ eth_chainId: jsonResponse('0x7c6') });
  const report = await observeTransaction(deployOptions(null, { networkId: 'qie-testnet', transport }));
  assert.equal(report.errorCode, 'WRONG_CHAIN');
  assert.equal(report.expectedChainId, 1983);
  assert.equal(report.observed.chainId, 1990);
  assert.equal(report.checks.inclusion, 'NOT_RUN', 'no receipt is inspected off the selected chain');
  assert.equal(transport.calls.length, 1);
  assert.doesNotThrow(() => validate('evidence-report', report));
  // A consistent testnet binding proceeds on the canonical value.
  const okReport = await observeTransaction(genericOptions(OTHER, {
    networkId: 'qie-testnet', rpcUrl: URL_TESTNET,
    transport: dispatchTransport({ eth_chainId: jsonResponse('0x7bf'), eth_getTransactionReceipt: jsonResponse(callReceipt()) }),
  }));
  assert.equal(okReport.expectedChainId, 1983);
  assert.equal(okReport.observed.chainId, 1983);
});

test('Usage errors throw before any report or network call', async () => {
  const base = { networkId: 'qie-mainnet', txHash: TX, rpcUrl: URL_MAINNET, snapshot: packaged, now: NOW, expectedAction: { kind: 'GENERIC_TX' } };
  const cases = [
    ['unknown network', { ...base, networkId: 'qie-native' }, /Choose qie-mainnet/],
    ['non-https endpoint', { ...base, rpcUrl: 'http://insecure.example/' }, /https/],
    ['malformed tx hash', { ...base, txHash: '0x1234' }, /32-byte/],
    ['unknown action kind', { ...base, expectedAction: { kind: 'TRANSFER' } }, /kind/],
    ['deploy without expected contract', { ...base, expectedAction: { kind: 'DEPLOY_DIRECT' } }, /requires expectedContractAddress/],
    ['deploy with an expected call target', { ...base, expectedAction: { kind: 'DEPLOY_DIRECT', expectedContractAddress: EXPECTED, expectedTo: OTHER } }, /does not take expectedTo/],
    ['deploy with an unsupported postcondition', { ...base, expectedAction: { kind: 'DEPLOY_DIRECT', expectedContractAddress: EXPECTED, expectedPostcondition: 'mint-event' } }, /runtime-code-present/],
    ['generic with an expected contract', { ...base, expectedAction: { kind: 'GENERIC_TX', expectedContractAddress: EXPECTED } }, /does not take expectedContractAddress/],
    ['generic with a postcondition', { ...base, expectedAction: { kind: 'GENERIC_TX', expectedPostcondition: 'runtime-code-present' } }, /generic receipt facts/],
    ['malformed expected contract', { ...base, expectedAction: { kind: 'DEPLOY_DIRECT', expectedContractAddress: '0xnot-hex' } }, /address/],
    ['chain ID disagreeing with the packaged mapping', { ...base, expectedChainId: 1983 }, /must agree/],
    ['snapshot without the selected network', { ...base, snapshot: { claims: [] } }, /Packaged network records are missing/],
  ];
  for (const [name, options, pattern] of cases) {
    await assert.rejects(observeTransaction(options), pattern, name);
  }
});

test('The report channel structurally forbids APPLICATION_VERIFIED without passing finality', async () => {
  const transport = dispatchTransport({
    eth_chainId: jsonResponse('0x7c6'),
    eth_getTransactionReceipt: jsonResponse(receipt()),
    eth_getCode: jsonResponse(CODE),
  });
  const report = await observeTransaction(deployOptions(null, { transport }));
  const forged = structuredClone(report);
  forged.applicationOutcome = 'APPLICATION_VERIFIED';
  assert.throws(() => validate('evidence-report', forged), /evidence-report/, 'the schema rejects a forged VERIFIED outcome');
  const forgedFinality = structuredClone(forged);
  forgedFinality.checks.finality = 'PASS';
  assert.throws(() => validate('evidence-report', forgedFinality), /evidence-report/, 'finality is frozen to UNKNOWN in this schema version');
});

test('Action kinds are exactly the documented set', () => {
  assert.deepEqual(ACTION_KINDS, ['GENERIC_TX', 'DEPLOY_DIRECT', 'MINT']);
});

const denyGuardSrc = new URL('./support/deny-network.cjs', import.meta.url);

test('The source verify-transaction CLI prints a report without touching a denied network', async (t) => {
  const fixtureRoot = await fixtureProject(t);
  await buildRelease(fixtureRoot);
  const consumer = await temporaryDirectory(t, 'qie-forge-cli-');
  const guard = path.join(consumer, 'deny-network.cjs');
  await cp(denyGuardSrc, guard);
  const env = { PATH: process.env.PATH, NODE_OPTIONS: `--require=${guard}` };
  const result = runNodeResult([
    path.join(projectRoot, 'scripts/verify-transaction.mjs'), 'qie-testnet', TX, 'GENERIC_TX', URL_TESTNET,
    '--claims', path.join(fixtureRoot, 'skills/qie-networks/data/network-claims.json'),
  ], { cwd: consumer, env });
  assert.equal(result.status, 0, 'a produced report exits 0; its verdict fields carry the finding');
  const report = JSON.parse(result.stdout);
  assert.equal(report.applicationOutcome, 'UNKNOWN');
  assert.equal(report.errorCode, 'RPC_UNAVAILABLE');
  assert.equal(report.expectedChainId, 1983);
  assert.doesNotThrow(() => validate('evidence-report', report));
});

test('A MINT request through the source CLI is refused with no network access at all', async (t) => {
  const fixtureRoot = await fixtureProject(t);
  await buildRelease(fixtureRoot);
  const consumer = await temporaryDirectory(t, 'qie-forge-cli-');
  const guard = path.join(consumer, 'deny-network.cjs');
  await cp(denyGuardSrc, guard);
  const env = { PATH: process.env.PATH, NODE_OPTIONS: `--require=${guard}` };
  const result = runNodeResult([
    path.join(projectRoot, 'scripts/verify-transaction.mjs'), 'qie-mainnet', TX, 'MINT', URL_MAINNET, EXPECTED,
    '--claims', path.join(fixtureRoot, 'skills/qie-networks/data/network-claims.json'),
  ], { cwd: consumer, env });
  assert.equal(result.status, 0);
  const report = JSON.parse(result.stdout);
  assert.equal(report.applicationOutcome, 'NOT_RUN');
});

test('The verify-transaction CLI rejects usage errors with status 2', async (t) => {
  const cli = path.join(projectRoot, 'scripts/verify-transaction.mjs');
  const result = runNodeResult([cli]);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /Usage/);
  const tooMany = runNodeResult([cli, 'qie-mainnet', TX, 'GENERIC_TX', URL_MAINNET, EXPECTED, 'extra']);
  assert.equal(tooMany.status, 2);
  assert.match(tooMany.stderr, /Usage/);
  const unknownOption = runNodeResult([cli, 'qie-mainnet', TX, 'GENERIC_TX', URL_MAINNET, '--dry-run']);
  assert.equal(unknownOption.status, 2);
  assert.match(unknownOption.stderr, /Unknown option/);
  const unknownKind = runNodeResult([cli, 'qie-mainnet', TX, 'SWAP', URL_MAINNET]);
  assert.equal(unknownKind.status, 2);
  assert.match(unknownKind.stderr, /kind must be GENERIC_TX, DEPLOY_DIRECT or MINT/);
  const missingClaimsValue = runNodeResult([cli, 'qie-mainnet', TX, 'GENERIC_TX', URL_MAINNET, '--claims']);
  assert.equal(missingClaimsValue.status, 2);
  assert.match(missingClaimsValue.stderr, /--claims requires a network-claims.json path./);
});
