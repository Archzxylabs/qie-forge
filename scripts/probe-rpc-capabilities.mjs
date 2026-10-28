import { readFile } from 'node:fs/promises';
import { parseHexQuantity, rpcCall, RpcError } from './lib/rpc.mjs';

const NETWORKS = new Set(['qie-mainnet', 'qie-testnet']);
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const ZERO_HASH = `0x${'0'.repeat(64)}`;
const METHODS = [
  ['eth_blockNumber', []],
  ['eth_getBlockByNumber', ['latest', false]],
  ['eth_getBalance', [ZERO_ADDRESS, 'latest']],
  ['eth_getCode', [ZERO_ADDRESS, 'latest']],
  ['eth_call', [{ to: ZERO_ADDRESS, data: '0x' }, 'latest']],
  ['eth_getLogs', [{ fromBlock: 'latest', toBlock: 'latest' }]],
  ['eth_getTransactionByHash', [ZERO_HASH]],
  ['eth_getTransactionReceipt', [ZERO_HASH]],
  ['eth_feeHistory', ['0x1', 'latest', []]],
  ['eth_gasPrice', []],
  ['eth_getTransactionCount', [ZERO_ADDRESS, 'latest']],
  ['eth_getStorageAt', [ZERO_ADDRESS, '0x0', 'latest']],
  ['eth_estimateGas', [{ from: ZERO_ADDRESS, to: ZERO_ADDRESS, data: '0x' }]],
];

function usage() {
  throw new Error('Usage: node probe-rpc-capabilities.mjs <qie-mainnet|qie-testnet> [--rpc <https-url>] [--claims <network-claims.json>] [--max-requests <1..14>]');
}

function errorCodeOf(error) {
  return error instanceof RpcError ? error.errorCode : 'UNKNOWN';
}

function resultShape(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return `array(${Math.min(value.length, 100)})`;
  if (typeof value === 'string') return value.length > 66 ? 'hex-or-string' : value;
  if (typeof value === 'number' || typeof value === 'boolean') return typeof value;
  if (typeof value === 'object') return 'object';
  return typeof value;
}

function parseArgs(args) {
  const [networkId, ...rest] = args;
  if (!NETWORKS.has(networkId)) usage();
  let endpoint = null;
  let claimsPath = null;
  let maxRequests = METHODS.length + 1;
  for (let index = 0; index < rest.length; index += 1) {
    const flag = rest[index];
    const value = rest[index + 1];
    if (flag === '--rpc' && value) endpoint = value;
    else if (flag === '--claims' && value) claimsPath = value;
    else if (flag === '--max-requests' && value && /^\d+$/.test(value)) maxRequests = Number(value);
    else usage();
    index += 1;
  }
  if (endpoint !== null && !endpoint.startsWith('https://')) throw new Error('--rpc must be an https URL.');
  if (!Number.isInteger(maxRequests) || maxRequests < 2 || maxRequests > METHODS.length + 1) {
    throw new Error(`--max-requests must be between 2 and ${METHODS.length + 1}.`);
  }
  return { networkId, endpoint, claimsPath, maxRequests };
}

async function readSnapshot(claimsPath) {
  const url = claimsPath ? null : new URL('../data/network-claims.json', import.meta.url);
  return JSON.parse(await readFile(claimsPath ?? url, 'utf8'));
}

const { networkId, endpoint, claimsPath, maxRequests } = parseArgs(process.argv.slice(2));
const snapshot = await readSnapshot(claimsPath);
const claims = (snapshot.claims ?? []).filter((claim) => claim.network_id === networkId);
const chainClaim = claims.find((claim) => claim.predicate === 'chain_id');
const rpcClaim = claims.find((claim) => claim.predicate === 'rpc_url');
if (!chainClaim || !rpcClaim || typeof chainClaim.value !== 'number') throw new Error('Packaged network claims are incomplete.');
const url = endpoint ?? rpcClaim.value;
const report = {
  schema_version: '1.0',
  network_id: networkId,
  endpoint: url,
  endpoint_source: endpoint ? 'explicit-override' : 'packaged-documented',
  expected_chain_id: chainClaim.value,
  checked_at: new Date().toISOString(),
  observed: { chain_id: null, latest_block: null },
  requests: [],
  warnings: [
    'This is a bounded read-only observation. It never promotes a canonical capability status.',
    'No fallback endpoint or other network is attempted.',
    'Method success with synthetic zero-address parameters does not prove application-specific compatibility.',
  ],
};

async function probe(method, params) {
  try {
    const result = await rpcCall({ url, method, params, requestId: report.requests.length + 1 });
    report.requests.push({ method, outcome: 'OBSERVED', error_code: null, result_shape: resultShape(result) });
    return result;
  } catch (error) {
    report.requests.push({ method, outcome: errorCodeOf(error) === 'UNSUPPORTED_PROVIDER' ? 'UNSUPPORTED' : 'ERROR', error_code: errorCodeOf(error), result_shape: null });
    return null;
  }
}

const chainHex = await probe('eth_chainId', []);
const chainId = parseHexQuantity(chainHex);
if (chainId === null) {
  report.outcome = 'UNKNOWN';
  report.reason = 'eth_chainId returned no valid quantity.';
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = 1;
} else if (chainId !== BigInt(report.expected_chain_id)) {
  report.observed.chain_id = Number(chainId);
  report.outcome = 'FAIL';
  report.reason = `Observed chain ID ${chainId} does not match selected network ${report.expected_chain_id}.`;
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = 1;
} else {
  report.observed.chain_id = Number(chainId);
  const block = await probe('eth_getBlockByNumber', ['latest', false]);
  const height = parseHexQuantity(block?.number);
  report.observed.latest_block = height === null ? null : Number(height);
  if (height === null || height === 0n) {
    report.outcome = 'UNKNOWN';
    report.reason = 'Selected chain identity matched, but a nonzero latest block was not observed.';
    console.log(JSON.stringify(report, null, 2));
    process.exitCode = 1;
  } else {
    for (const [method, params] of METHODS) {
      if (report.requests.length >= maxRequests) break;
      await probe(method, params);
    }
    report.outcome = 'OBSERVED';
    report.reason = `Selected network identity and latest block matched; ${report.requests.length} bounded read-only requests were attempted.`;
    console.log(JSON.stringify(report, null, 2));
  }
}
