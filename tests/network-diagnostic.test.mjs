// B06: read-only network diagnostics (PRD FR-003, FR-020, §14.3 channel). Every RPC
// interaction runs against injected mock transports; no network is contacted.
import test from 'node:test';
import assert from 'node:assert/strict';
import { cp, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildRelease } from '../scripts/lib/release.mjs';
import { verifyNetworkIdentity } from '../scripts/lib/network-diagnostic.mjs';
import { dispatchTransport, errorResponse, failingTransport, jsonResponse, rawResponse } from './support/mock-rpc.mjs';
import { projectRoot, schemaRoot, fixtureProject, temporaryDirectory } from './support/fixtures.mjs';
import { runNodeResult } from './support/process.mjs';
import { loadValidators } from '../scripts/lib/schemas.mjs';

const NOW = '2026-10-19T04:00:00Z';
const URL_MAINNET = 'https://rpc1mainnet.qie.digital/';
const URL_TESTNET = 'https://rpc1testnet.qie.digital/';
const BLOCK = { number: '0x1000', timestamp: '0x65000000' };

// The packaged, schema-validated network profile is the canonical input context.
const packaged = JSON.parse(await readFile(new URL('../skills/qie-networks/data/network-claims.json', import.meta.url), 'utf8'));
const validate = await loadValidators(schemaRoot);

const passRoutes = () => dispatchTransport({
  eth_chainId: jsonResponse('0x7c6'),
  eth_getBlockByNumber: jsonResponse(BLOCK),
});

test('a healthy mainnet endpoint passes identity and responsiveness without claiming freshness', async () => {
  const transport = passRoutes();
  const report = await verifyNetworkIdentity({ networkId: 'qie-mainnet', transport, now: NOW, snapshot: packaged });
  assert.equal(report.schema_version, '1.0');
  assert.equal(report.network_id, 'qie-mainnet');
  assert.equal(report.expected_chain_id, 1990);
  assert.equal(report.observed.chain_id, 1990);
  assert.equal(report.observed.chain_id_hex, '0x7c6');
  assert.equal(report.observed.latest_block, 4096);
  assert.equal(report.observed.latest_block_timestamp, new Date(0x65000000 * 1000).toISOString());
  assert.equal(report.endpoint, URL_MAINNET);
  assert.equal(report.endpoint_source, 'packaged-documented');
  assert.equal(report.rpc_host, 'rpc1mainnet.qie.digital');
  assert.equal(report.checked_at, NOW);
  assert.equal(report.live_check.outcome, 'PASS');
  assert.equal(report.live_check.error_code, null);
  assert.equal(transport.calls.length, 2, 'exactly one chain read and one block read');
  assert.deepEqual(report.effective_claims.map((claim) => claim.status), ['DOCUMENTED', 'DOCUMENTED', 'DOCUMENTED', 'DOCUMENTED', 'DOCUMENTED']);
  assert.match(report.warnings.join(' '), /never promotes a packaged claim or capability status/);
  assert.match(report.warnings.join(' '), /freshness/);
  assert.doesNotThrow(() => validate('live-check', report), 'PASS report validates against the live-check channel');
});

test('a healthy testnet endpoint is verified against the packaged testnet chain ID', async () => {
  const transport = dispatchTransport({
    eth_chainId: jsonResponse('0x7bf'),
    eth_getBlockByNumber: jsonResponse(BLOCK),
  });
  const report = await verifyNetworkIdentity({ networkId: 'qie-testnet', transport, now: NOW, snapshot: packaged });
  assert.equal(report.observed.chain_id, 1983);
  assert.equal(report.endpoint, URL_TESTNET);
  assert.equal(report.live_check.outcome, 'PASS');
  assert.doesNotThrow(() => validate('live-check', report));
});

test('a wrong-chain endpoint fails with WRONG_CHAIN and never probes another endpoint', async () => {
  const transport = dispatchTransport({
    eth_chainId: jsonResponse('0x1'),
    eth_getBlockByNumber: jsonResponse(BLOCK),
  });
  const report = await verifyNetworkIdentity({ networkId: 'qie-mainnet', transport, now: NOW, snapshot: packaged });
  assert.equal(report.live_check.outcome, 'FAIL');
  assert.equal(report.live_check.error_code, 'WRONG_CHAIN');
  assert.match(report.live_check.reason, /no fallback/);
  assert.equal(report.observed.chain_id, 1);
  assert.equal(report.observed.latest_block, null);
  assert.equal(transport.calls.length, 1, 'the helper stops after the identity mismatch');
  assert.equal(transport.calls[0].url, URL_MAINNET, 'only the selected endpoint is contacted');
  assert.doesNotThrow(() => validate('live-check', report));
});

test('an unavailable, rate-limited or malformed endpoint reports UNKNOWN with explicit error codes', async () => {
  const cases = [
    ['RPC_UNAVAILABLE', failingTransport(new Error('NETWORK_DISABLED_BY_TEST'))],
    ['RPC_RATE_LIMITED', async () => rawResponse(429, 'slow down')],
    ['RPC_MALFORMED', async () => rawResponse(200, '{not-json')],
    ['UNSUPPORTED_PROVIDER', async () => errorResponse(-32601, 'method not found')],
  ];
  for (const [expected, transport] of cases) {
    const report = await verifyNetworkIdentity({ networkId: 'qie-mainnet', transport, now: NOW, snapshot: packaged });
    assert.equal(report.live_check.outcome, 'UNKNOWN', expected);
    assert.equal(report.live_check.error_code, expected);
    assert.match(report.live_check.reason, /fallback|attempt/i);
    assert.deepEqual(report.observed, {
      chain_id: null, chain_id_hex: null, latest_block: null, latest_block_hex: null, latest_block_timestamp: null,
    }, `${expected} records no partial chain identity`);
  }
});

test('malformed quantities and unusable block headers are explicit failures to conclude', async () => {
  const cases = [
    ['malformed chain quantity', '12345', BLOCK, 'RPC_MALFORMED', null, null],
    ['block read error', '0x7c6', async () => rawResponse(500, 'oops'), 'RPC_UNAVAILABLE', 1990, null],
    ['block header missing fields', '0x7c6', { number: '0x1000' }, 'RPC_MALFORMED', 1990, null],
    ['block timestamp garbage', '0x7c6', { number: '0x1000', timestamp: 'not-hex' }, 'RPC_MALFORMED', 1990, null],
    ['block height zero', '0x7c6', { number: '0x0', timestamp: '0x65000000' }, 'RPC_UNAVAILABLE', 1990, 0],
  ];
  for (const [name, chain, block, expectedCode, expectedChainObserved, expectedLatestBlock] of cases) {
    const transport = dispatchTransport({
      eth_chainId: jsonResponse(chain),
      eth_getBlockByNumber: typeof block === 'function' ? block : jsonResponse(block),
    });
    const report = await verifyNetworkIdentity({ networkId: 'qie-mainnet', transport, now: NOW, snapshot: packaged });
    assert.equal(report.live_check.outcome, 'UNKNOWN', name);
    assert.equal(report.live_check.error_code, expectedCode, name);
    assert.equal(report.observed.chain_id, expectedChainObserved, `${name}: observed identity is preserved when available`);
    assert.equal(report.observed.latest_block, expectedLatestBlock, name);
    assert.doesNotThrow(() => validate('live-check', report), name);
  }
});

test('an explicit endpoint override replaces the packaged URL and still verifies chain identity', async () => {
  const transport = dispatchTransport({
    eth_chainId: jsonResponse('0x1'),
    eth_getBlockByNumber: jsonResponse(BLOCK),
  });
  const report = await verifyNetworkIdentity({
    networkId: 'qie-mainnet', endpoint: 'https://alternative-mainnet.example/', transport, now: NOW, snapshot: packaged,
  });
  assert.equal(report.endpoint, 'https://alternative-mainnet.example/');
  assert.equal(report.endpoint_source, 'explicit-override');
  assert.equal(report.rpc_host, 'alternative-mainnet.example');
  assert.equal(transport.calls[0].url, 'https://alternative-mainnet.example/');
  assert.equal(report.live_check.outcome, 'FAIL');
  assert.equal(report.live_check.error_code, 'WRONG_CHAIN');
});

test('usage errors throw without producing a report', async () => {
  await assert.rejects(verifyNetworkIdentity({ networkId: 'qie-native', snapshot: packaged }), /Choose qie-mainnet/);
  await assert.rejects(verifyNetworkIdentity({ networkId: 'qie-mainnet', endpoint: 'http://insecure.example/', snapshot: packaged }), /https/);
  await assert.rejects(verifyNetworkIdentity({ networkId: 'qie-mainnet', snapshot: { claims: [] } }), /Packaged network records are missing/);
});

test('effective claim evaluation uses the shared evaluator on the same clock and never promotes', async () => {
  // Expired VERIFIED evidence must project to STALE even while the live check passes.
  const synthetic = {
    claims: [
      {
        claim_id: 'qie-mainnet.chain_id', network_id: 'qie-mainnet', predicate: 'chain_id', value: 1990,
        status: 'VERIFIED', checked_at: '2026-01-01T00:00:00Z', expires_at: '2026-01-02T00:00:00Z', source_ids: ['src'], evidence_test_ids: [],
      },
      {
        claim_id: 'qie-mainnet.rpc_url', network_id: 'qie-mainnet', predicate: 'rpc_url', value: URL_MAINNET,
        status: 'VERIFIED', checked_at: null, expires_at: null, source_ids: ['src'], evidence_test_ids: [],
      },
    ],
  };
  const transport = passRoutes();
  const report = await verifyNetworkIdentity({ networkId: 'qie-mainnet', transport, now: NOW, snapshot: synthetic });
  const chainClaim = report.effective_claims.find((claim) => claim.claim_id === 'qie-mainnet.chain_id');
  const rpcClaim = report.effective_claims.find((claim) => claim.claim_id === 'qie-mainnet.rpc_url');
  assert.equal(chainClaim.status, 'STALE', 'expired VERIFIED evidence projects to STALE on the shared evaluator');
  assert.equal(rpcClaim.status, 'UNKNOWN', 'VERIFIED without validity metadata projects to UNKNOWN');
  assert.notEqual(report.effective_claims.find((claim) => claim.claim_id === 'qie-mainnet.chain_id').status, 'VERIFIED');
  assert.equal(report.live_check.outcome, 'PASS', 'the live observation itself is unaffected by stored evidence state');
  assert.match(report.warnings.join(' '), /never promotes/);
});

// Bundled helper behavior: the generated skill must carry a working, self-contained
// copy that fails closed when the network is unavailable (test guard, not a live probe).
const denyGuardSrc = new URL('./support/deny-network.cjs', import.meta.url);

test('the bundled verify-network CLI fails closed on a blocked network', async (t) => {
  const source = await fixtureProject(t);
  await buildRelease(source);
  const consumer = await temporaryDirectory(t, 'qie-forge-cli-');
  const guard = path.join(consumer, 'deny-network.cjs');
  await cp(denyGuardSrc, guard);
  const env = { PATH: process.env.PATH, NODE_OPTIONS: `--require=${guard}` };
  const bundled = path.join(source, 'skills/qie-networks/scripts/verify-network.mjs');
  const result = runNodeResult([bundled, 'qie-testnet'], { cwd: consumer, env });
  assert.equal(result.status, 1, 'UNKNOWN is fail-closed for preflight use');
  const report = JSON.parse(result.stdout);
  assert.equal(report.live_check.outcome, 'UNKNOWN');
  assert.equal(report.live_check.error_code, 'RPC_UNAVAILABLE');
  assert.equal(report.network_id, 'qie-testnet');
});

test('the bundled verify-network CLI rejects usage errors with status 2', async (t) => {
  const source = await fixtureProject(t);
  await buildRelease(source);
  const bundled = path.join(source, 'skills/qie-networks/scripts/verify-network.mjs');
  const result = runNodeResult([bundled], { cwd: source });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /Usage/);
});

test('the source verify-network CLI rejects unknown options and malformed flags', () => {
  const cli = path.join(projectRoot, 'scripts/verify-network.mjs');
  const unknownOption = runNodeResult([cli, 'qie-mainnet', '--qie']);
  assert.equal(unknownOption.status, 2);
  assert.match(unknownOption.stderr, /Unknown option/);
  const missingValue = runNodeResult([cli, 'qie-mainnet', '--rpc']);
  assert.equal(missingValue.status, 2);
  assert.match(missingValue.stderr, /--rpc requires an https URL/);
  const missingClaimsValue = runNodeResult([cli, 'qie-mainnet', '--claims']);
  assert.equal(missingClaimsValue.status, 2);
  assert.match(missingClaimsValue.stderr, /--claims requires a network-claims.json path./);
});

test('the source verify-network CLI runs against an explicit --claims snapshot', async (t) => {
  const source = await fixtureProject(t);
  await buildRelease(source);
  const consumer = await temporaryDirectory(t, 'qie-forge-cli-');
  const guard = path.join(consumer, 'deny-network.cjs');
  await cp(denyGuardSrc, guard);
  const env = { PATH: process.env.PATH, NODE_OPTIONS: `--require=${guard}` };
  const result = runNodeResult([
    path.join(projectRoot, 'scripts/verify-network.mjs'), 'qie-mainnet',
    '--claims', path.join(source, 'skills/qie-networks/data/network-claims.json'),
  ], { cwd: consumer, env });
  assert.equal(result.status, 1, 'denied network yields a fail-closed UNKNOWN report');
  const report = JSON.parse(result.stdout);
  assert.equal(report.expected_chain_id, 1990);
  assert.equal(report.live_check.outcome, 'UNKNOWN');
});
