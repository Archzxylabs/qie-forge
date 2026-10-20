// GENERATED — DO NOT EDIT. Change canonical helper sources.
// Original read-only network diagnostic (PRD FR-003). It observes chain identity and
// block responsiveness on one explicitly selected network. It never signs, never
// broadcasts, never handles keys, never retries, and never falls back to another
// endpoint or network. A live observation never promotes a packaged claim or
// capability status; the shared effective-status evaluator is applied unchanged.
import { readFile } from 'node:fs/promises';
import { effectiveStatus } from './effective-status.mjs';
import { parseHexQuantity, rpcCall } from './rpc.mjs';

const NETWORKS = ['qie-mainnet', 'qie-testnet'];

function errorCodeOf(error) {
  return error && typeof error.errorCode === 'string' ? error.errorCode : 'UNKNOWN';
}

// Returns a report object (live-check channel, snake_case). Throws only for usage
// errors: an unknown network, an unusable endpoint or incomplete packaged records.
export async function verifyNetworkIdentity({ networkId, endpoint = null, transport, now = null, snapshot = null } = {}) {
  if (!NETWORKS.includes(networkId)) throw new Error('Choose qie-mainnet or qie-testnet explicitly.');
  if (endpoint !== null && (typeof endpoint !== 'string' || !endpoint.startsWith('https://'))) {
    throw new Error('An endpoint override must be an https URL on the selected network.');
  }
  const pack = snapshot ?? JSON.parse(await readFile(new URL('../../data/network-claims.json', import.meta.url), 'utf8'));
  const claims = (pack.claims ?? []).filter((record) => record.network_id === networkId);
  const chainClaim = claims.find((record) => record.predicate === 'chain_id');
  const rpcClaim = claims.find((record) => record.predicate === 'rpc_url');
  if (!chainClaim || !rpcClaim || typeof chainClaim.value !== 'number') {
    throw new Error('Packaged network records are missing.');
  }
  const url = endpoint ?? rpcClaim.value;
  const rpcHost = new URL(url).host;
  const checkedAt = now ?? new Date().toISOString();
  const report = {
    schema_version: '1.0',
    network_id: networkId,
    expected_chain_id: chainClaim.value,
    endpoint: url,
    endpoint_source: endpoint === null ? 'packaged-documented' : 'explicit-override',
    rpc_host: rpcHost,
    observed: { chain_id: null, chain_id_hex: null, latest_block: null, latest_block_hex: null, latest_block_timestamp: null },
    effective_claims: claims.map((record) => ({
      claim_id: record.claim_id,
      ...effectiveStatus(record, { now: checkedAt, offline: false }),
    })),
    live_check: { outcome: 'NOT_RUN', error_code: null, reason: null },
    checked_at: checkedAt,
    warnings: [
      'A live observation never promotes a packaged claim or capability status.',
      'No reviewed freshness threshold exists for QIE block heights, so block freshness is reported but never claimed.',
    ],
  };
  const live = report.live_check;

  let chainHex;
  try {
    chainHex = await rpcCall({ url, method: 'eth_chainId', params: [], transport });
  } catch (error) {
    live.outcome = 'UNKNOWN';
    live.error_code = errorCodeOf(error);
    live.reason = `${error.message} No fallback endpoint or network was attempted.`;
    return report;
  }
  const chainId = parseHexQuantity(chainHex);
  if (chainId === null) {
    live.outcome = 'UNKNOWN';
    live.error_code = 'RPC_MALFORMED';
    live.reason = 'eth_chainId returned a malformed quantity.';
    return report;
  }
  report.observed.chain_id = Number(chainId);
  report.observed.chain_id_hex = chainHex;
  if (chainId !== BigInt(report.expected_chain_id)) {
    // Wrong chain stops here. The other network's endpoint is never tried.
    live.outcome = 'FAIL';
    live.error_code = 'WRONG_CHAIN';
    live.reason = `Observed chain ID ${chainId} does not match the selected network's documented chain ID ${report.expected_chain_id}; no fallback to another network or endpoint was attempted.`;
    return report;
  }

  let block;
  try {
    block = await rpcCall({ url, method: 'eth_getBlockByNumber', params: ['latest', false], transport });
  } catch (error) {
    live.outcome = 'UNKNOWN';
    live.error_code = errorCodeOf(error);
    live.reason = `Chain identity matched, but the latest block could not be read: ${error.message} No fallback was attempted.`;
    return report;
  }
  if (!block || typeof block !== 'object' || typeof block.number !== 'string' || typeof block.timestamp !== 'string') {
    live.outcome = 'UNKNOWN';
    live.error_code = 'RPC_MALFORMED';
    live.reason = 'The latest block header is missing required fields.';
    return report;
  }
  const height = parseHexQuantity(block.number);
  const stampSeconds = parseHexQuantity(block.timestamp);
  const stampDate = stampSeconds === null ? null : new Date(Number(stampSeconds) * 1000);
  if (height === null || stampSeconds === null || !stampDate || Number.isNaN(stampDate.getTime())) {
    live.outcome = 'UNKNOWN';
    live.error_code = 'RPC_MALFORMED';
    live.reason = 'The latest block header carries a malformed height or timestamp.';
    return report;
  }
  report.observed.latest_block = Number(height);
  report.observed.latest_block_hex = block.number;
  report.observed.latest_block_timestamp = stampDate.toISOString();
  if (height === 0n) {
    live.outcome = 'UNKNOWN';
    live.error_code = 'RPC_UNAVAILABLE';
    live.reason = 'The endpoint reports block height zero, so chain responsiveness cannot be established.';
    return report;
  }
  live.outcome = 'PASS';
  live.reason = 'Observed chain ID matches the selected documented network and a nonzero latest block was read. Freshness beyond this observation and any capability promotion are not claimed.';
  return report;
}
