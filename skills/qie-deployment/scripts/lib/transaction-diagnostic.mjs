// GENERATED — DO NOT EDIT. Change canonical helper sources.
// Original read-only transaction observer (PRD FR-009, FR-021, §14.4). It binds one
// expected action to one transaction on one explicitly selected network and separates
// inclusion, execution, identity linkage, application effect and finality. It never
// signs, never broadcasts, never handles keys, and never emits APPLICATION_VERIFIED:
// no reviewed QIE finality policy evidence exists in this release, so the finality
// check is UNKNOWN and completion stays UNKNOWN or below.
import { readFile } from 'node:fs/promises';
import { ADDRESS_PATTERN, TX_HASH_PATTERN, parseHexQuantity, rpcCall } from './rpc.mjs';

// MINT is recognized so it can be refused explicitly instead of guessed; only the
// receipt-fact kinds below are executable in this release.
export const ACTION_KINDS = ['GENERIC_TX', 'DEPLOY_DIRECT', 'MINT'];
export const RUNNABLE_KINDS = ['GENERIC_TX', 'DEPLOY_DIRECT'];
export const REPORT_SCHEMA_VERSION = '1.1';
const NETWORKS = ['qie-mainnet', 'qie-testnet'];
const BLOCK_HASH_PATTERN = /^0x[0-9a-fA-F]{64}$/;
const RUNTIME_CODE_PATTERN = /^0x([0-9a-fA-F]{2})*$/;

function errorCodeOf(error) {
  return error && typeof error.errorCode === 'string' ? error.errorCode : 'UNKNOWN';
}

function emptyReport({ networkId, expectedChainId, expectedAction }) {
  return {
    schemaVersion: REPORT_SCHEMA_VERSION,
    networkId,
    expectedChainId,
    expectedAction,
    observed: {
      chainId: null,
      transactionTo: null,
      receiptContractAddress: null,
      receiptBlockHash: null,
      receiptBlockNumber: null,
      receiptStatus: 'NOT_RUN',
      codePresent: null,
    },
    checks: { inclusion: 'NOT_RUN', execution: 'NOT_RUN', identityLinkage: 'NOT_RUN', applicationEffect: 'NOT_RUN', finality: 'UNKNOWN' },
    applicationOutcome: 'UNKNOWN',
    evidenceRefs: [],
    generatedAt: null,
    limitedObservation: null,
    errorCode: null,
    warnings: ['QIE-specific finality policy requires verified network evidence'],
  };
}

// The authoritative network-to-chain-ID binding comes from the packaged,
// schema-validated network profiles — never from caller-supplied arithmetic.
// The default path is skill-local (bundle) data; tests and tools may inject a snapshot.
export async function loadNetworkSnapshot() {
  return JSON.parse(await readFile(new URL('../../data/network-claims.json', import.meta.url), 'utf8'));
}

// Validates the action binding. Throws only for usage errors: the inputs can be fixed
// by the caller, so no report is produced and no network call is made.
function validateActionBinding({ expectedAction }) {
  const kind = expectedAction?.kind;
  if (!ACTION_KINDS.includes(kind)) throw new Error('expectedAction.kind must be GENERIC_TX, DEPLOY_DIRECT or MINT.');
  const contractAddress = expectedAction.expectedContractAddress ?? null;
  const expectedTo = expectedAction.expectedTo ?? null;
  const postcondition = expectedAction.expectedPostcondition ?? null;
  if (contractAddress !== null && !ADDRESS_PATTERN.test(contractAddress)) throw new Error('expectedContractAddress must be a 0x-prefixed address.');
  if (expectedTo !== null && !ADDRESS_PATTERN.test(expectedTo)) throw new Error('expectedTo must be a 0x-prefixed address.');
  if (kind === 'DEPLOY_DIRECT') {
    if (!contractAddress) throw new Error('DEPLOY_DIRECT requires expectedContractAddress to bind the report.');
    if (expectedTo !== null) throw new Error('DEPLOY_DIRECT does not take expectedTo; the creation receipt has no call target.');
    if (postcondition !== null && postcondition !== 'runtime-code-present') {
      throw new Error('Only the runtime-code-present postcondition is supported for DEPLOY_DIRECT.');
    }
  }
  if (kind === 'GENERIC_TX') {
    if (contractAddress !== null) throw new Error('GENERIC_TX does not take expectedContractAddress.');
    if (postcondition !== null) throw new Error('GENERIC_TX asserts only generic receipt facts; no application postcondition can be requested.');
  }
}

// Returns a §14.4 evidence report. Throws only for usage errors: an unknown network,
// a non-https endpoint, malformed identifiers, a malformed action binding, or an
// expectedChainId that disagrees with the packaged chain ID for the selected network.
export async function observeTransaction({
  networkId,
  txHash,
  rpcUrl,
  expectedChainId = null,
  expectedAction = {},
  transport,
  now = null,
  snapshot = null,
} = {}) {
  if (!NETWORKS.includes(networkId)) throw new Error('Choose qie-mainnet or qie-testnet explicitly.');
  if (typeof rpcUrl !== 'string' || !rpcUrl.startsWith('https://')) throw new Error('rpcUrl must be an https endpoint on the selected network.');
  if (typeof txHash !== 'string' || !TX_HASH_PATTERN.test(txHash)) throw new Error('txHash must be a 32-byte 0x-prefixed hex string.');
  validateActionBinding({ expectedAction });

  const pack = snapshot ?? await loadNetworkSnapshot();
  const chainClaim = (pack.claims ?? []).find((record) => record.network_id === networkId && record.predicate === 'chain_id');
  if (!chainClaim || typeof chainClaim.value !== 'number') throw new Error('Packaged network records are missing.');
  if (expectedChainId !== null && expectedChainId !== chainClaim.value) {
    throw new Error(`expectedChainId ${expectedChainId} does not match the packaged chain ID ${chainClaim.value} for ${networkId}; the network label and chain ID must agree.`);
  }

  const kind = expectedAction.kind;
  const bound = {
    kind,
    txHash,
    expectedContractAddress: expectedAction.expectedContractAddress ?? null,
    expectedTo: expectedAction.expectedTo ?? null,
    expectedPostcondition: expectedAction.expectedPostcondition ?? null,
  };
  const report = emptyReport({ networkId, expectedChainId: chainClaim.value, expectedAction: bound });
  report.generatedAt = now ?? new Date().toISOString();

  if (!RUNNABLE_KINDS.includes(kind)) {
    report.applicationOutcome = 'NOT_RUN';
    report.warnings.push(`Action kind ${kind} requires action-specific event or state checks that this release does not implement; no outcome may be inferred from a generic receipt.`);
    return report;
  }

  let chainHex;
  try {
    chainHex = await rpcCall({ url: rpcUrl, method: 'eth_chainId', params: [], transport });
  } catch (error) {
    report.errorCode = errorCodeOf(error);
    report.warnings.push(`Chain identity observation failed: ${error.message}`);
    return report;
  }
  const observedChain = parseHexQuantity(chainHex);
  if (observedChain === null) {
    report.errorCode = 'RPC_MALFORMED';
    report.warnings.push('eth_chainId returned a malformed quantity.');
    return report;
  }
  report.observed.chainId = Number(observedChain);
  if (observedChain !== BigInt(report.expectedChainId)) {
    // Wrong chain: no receipt, code or effect is inspected and no fallback is attempted.
    report.errorCode = 'WRONG_CHAIN';
    report.warnings.push(`Observed chain ID ${observedChain} does not match the expected chain ${report.expectedChainId}; no fallback network or endpoint was attempted.`);
    return report;
  }

  let receipt;
  try {
    receipt = await rpcCall({ url: rpcUrl, method: 'eth_getTransactionReceipt', params: [txHash], transport });
  } catch (error) {
    report.errorCode = errorCodeOf(error);
    report.warnings.push(`Receipt lookup failed: ${error.message}`);
    return report;
  }
  if (receipt === null || typeof receipt !== 'object' || Array.isArray(receipt)) {
    report.errorCode = 'TX_NOT_FOUND';
    report.checks.inclusion = 'UNKNOWN';
    report.warnings.push('No receipt exists for the transaction hash on the selected chain; a fabricated or noncanonical hash never counts as inclusion.');
    return report;
  }

  // Bind the receipt to the requested transaction and shape-check its evidence fields
  // before any check is allowed to pass. Malformed receipts are never partially trusted.
  const echoed = typeof receipt.transactionHash === 'string' ? receipt.transactionHash : null;
  if (!echoed || echoed.toLowerCase() !== txHash.toLowerCase()) {
    report.errorCode = 'RPC_MALFORMED';
    report.checks.inclusion = 'UNKNOWN';
    report.warnings.push('The receipt does not echo the requested transaction hash; it is treated as malformed evidence and no check passes on it.');
    return report;
  }
  if (receipt.blockHash == null || receipt.blockNumber == null) {
    report.checks.inclusion = 'UNKNOWN';
    report.applicationOutcome = 'PENDING';
    report.errorCode = 'TX_PENDING';
    report.warnings.push('The receipt is not yet included in a block; completion is PENDING, never PASS.');
    return report;
  }
  const malformed = [];
  if (typeof receipt.blockHash !== 'string' || !BLOCK_HASH_PATTERN.test(receipt.blockHash)) malformed.push('block hash');
  const blockNumberQty = parseHexQuantity(receipt.blockNumber);
  if (blockNumberQty === null) malformed.push('block number');
  if (receipt.status !== '0x1' && receipt.status !== '0x0') malformed.push('status');
  const to = typeof receipt.to === 'string' ? receipt.to : null;
  const created = typeof receipt.contractAddress === 'string' ? receipt.contractAddress : null;
  if (receipt.to != null && to === null) malformed.push('to address');
  if (receipt.contractAddress != null && created === null) malformed.push('created contract address');
  if (to !== null && created !== null) malformed.push('both a call target and a created contract address');
  if (malformed.length) {
    report.errorCode = 'RPC_MALFORMED';
    report.checks.inclusion = 'UNKNOWN';
    report.warnings.push(`The receipt carries malformed evidence (${malformed.join(', ')}); no check passes on malformed data.`);
    return report;
  }

  report.checks.inclusion = 'PASS';
  report.observed.transactionTo = to;
  report.observed.receiptContractAddress = created;
  report.observed.receiptBlockHash = receipt.blockHash;
  report.observed.receiptBlockNumber = Number(blockNumberQty);

  // Execution: only receipt status facts, never an application claim.
  if (receipt.status === '0x1') {
    report.checks.execution = 'PASS';
    report.observed.receiptStatus = 'PASS';
  } else {
    report.checks.execution = 'FAIL';
    report.observed.receiptStatus = 'FAIL';
    report.errorCode = 'TX_REVERTED';
    report.warnings.push('The transaction reverted on chain; execution FAIL separates receipt existence from any application outcome.');
  }

  // Identity linkage: bind the receipt to the expected target or created contract.
  if (kind === 'DEPLOY_DIRECT') {
    const expected = bound.expectedContractAddress;
    if (!created) {
      report.checks.identityLinkage = 'FAIL';
      report.errorCode ??= 'ADDRESS_UNVERIFIED';
      report.warnings.push('The receipt carries no created-contract address, so it cannot be linked to the expected contract.');
    } else if (created.toLowerCase() !== expected.toLowerCase()) {
      report.checks.identityLinkage = 'FAIL';
      report.errorCode ??= 'ADDRESS_UNVERIFIED';
      report.warnings.push(`The receipt created ${created}, not the expected contract ${expected}; linkage fails.`);
    } else {
      let code;
      try {
        code = await rpcCall({ url: rpcUrl, method: 'eth_getCode', params: [expected, 'latest'], transport });
      } catch (error) {
        report.checks.identityLinkage = 'UNKNOWN';
        report.errorCode ??= errorCodeOf(error);
        report.warnings.push(`Runtime code could not be read: ${error.message}`);
      }
      if (report.checks.identityLinkage !== 'UNKNOWN') {
        if (typeof code !== 'string') {
          report.checks.identityLinkage = 'UNKNOWN';
          report.errorCode ??= 'RPC_MALFORMED';
          report.warnings.push('eth_getCode returned a non-string value; code presence cannot be judged.');
        } else if (!RUNTIME_CODE_PATTERN.test(code)) {
          report.checks.identityLinkage = 'UNKNOWN';
          report.errorCode ??= 'RPC_MALFORMED';
          report.warnings.push('eth_getCode returned malformed bytecode; code presence cannot be judged.');
        } else if (code === '0x') {
          report.checks.identityLinkage = 'FAIL';
          report.errorCode ??= 'CONTRACT_NO_CODE';
          report.observed.codePresent = false;
          report.warnings.push('A valid empty-code response was returned for the expected contract address; no runtime code is present on this chain.');
        } else {
          report.checks.identityLinkage = 'PASS';
          report.observed.codePresent = true;
          report.warnings.push('Runtime code was observed at the latest block, not pinned to the inclusion block; code presence is an observation and never proof of issuer identity or ownership.');
        }
      }
    }
  } else if (bound.expectedTo !== null) {
    if (!to || to.toLowerCase() !== bound.expectedTo.toLowerCase()) {
      report.checks.identityLinkage = 'FAIL';
      report.errorCode ??= 'ADDRESS_UNVERIFIED';
      report.warnings.push(`The receipt target ${to ?? 'null'} does not match the expected target ${bound.expectedTo}.`);
    } else {
      report.checks.identityLinkage = 'PASS';
    }
  } else {
    report.warnings.push('No expected target was provided, so only generic receipt facts are asserted; identity linkage stays NOT_RUN.');
  }

  // Application effect: scoped to the requested postcondition only.
  if (kind === 'DEPLOY_DIRECT') {
    if (report.checks.execution === 'FAIL') {
      report.checks.applicationEffect = 'FAIL';
      report.warnings.push('A reverted creation cannot satisfy the runtime-code-present postcondition.');
    } else if (report.checks.identityLinkage === 'PASS' && report.observed.codePresent === true) {
      report.checks.applicationEffect = 'PASS';
    } else if (report.checks.identityLinkage === 'FAIL') {
      report.checks.applicationEffect = 'FAIL';
    } else {
      report.checks.applicationEffect = 'UNKNOWN';
    }
  } else {
    report.warnings.push('Generic receipt inspection asserts only generic receipt facts; no application effect was requested or verified.');
  }

  // Finality stays UNKNOWN: no reviewed QIE confirmation policy evidence exists here.
  const scoped = ['inclusion', 'execution', 'identityLinkage', 'applicationEffect'];
  if (scoped.some((key) => report.checks[key] === 'FAIL')) {
    report.applicationOutcome = 'APPLICATION_FAILED';
  } else if (scoped.every((key) => report.checks[key] === 'PASS')) {
    // APPLICATION_VERIFIED would require a passing finality check with policy evidence;
    // finality is UNKNOWN, so completion is UNKNOWN with a limited descriptive report.
    report.applicationOutcome = 'UNKNOWN';
    report.limitedObservation = 'CONFIRMED_AT_BLOCK';
    report.warnings.push(`All scoped checks passed for block ${report.observed.receiptBlockNumber}, but no finality policy evidence exists, so completion stays UNKNOWN.`);
  } else {
    report.applicationOutcome = 'UNKNOWN';
  }
  return report;
}
