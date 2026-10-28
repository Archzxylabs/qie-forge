// Evidence replay: read-only Counter creation simulation on the selected testnet.
// Run from any directory; stdout is one JSON report. No signer or broadcast exists.
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { verifyNetworkIdentity } from '../../../../scripts/lib/network-diagnostic.mjs';
import { parseHexQuantity, rpcCall } from '../../../../scripts/lib/rpc.mjs';

const directory = new URL('.', import.meta.url);
const repository = new URL('../../../../', import.meta.url);
const read = (name) => readFile(new URL(name, directory), 'utf8');
const metadata = JSON.parse(await read('run.json'));
const snapshot = JSON.parse(await readFile(new URL('skills/qie-deployment/data/network-claims.json', repository), 'utf8'));
const creation = (await read('Counter.creation.hex')).trim();
const runtime = (await read('Counter.runtime.hex')).trim();
const endpoint = metadata.endpoint;
if (endpoint !== 'https://rpc2testnet.qie.digital/' || metadata.expected_chain_id !== 1983) {
  throw new Error('This evidence replay is scoped to the documented QIE testnet RPC2 endpoint.');
}
for (const [name, expected] of Object.entries(metadata.canonical_input_sha256)) {
  const bytes = await readFile(new URL(name, repository));
  if (createHash('sha256').update(bytes).digest('hex') !== expected) {
    throw new Error('Recorded source input differs: ' + name);
  }
}
for (const [name, expected] of Object.entries(metadata.artifact_sha256)) {
  const bytes = await readFile(new URL(name, directory));
  if (createHash('sha256').update(bytes).digest('hex') !== expected) {
    throw new Error('Recorded compiler artifact differs: ' + name);
  }
}
if (!/^0x(?:[0-9a-fA-F]{2})+$/.test(creation) || !/^0x(?:[0-9a-fA-F]{2})+$/.test(runtime)) {
  throw new Error('Creation and runtime data must contain resolved bytecode.');
}

const simulationSender = '0x0000000000000000000000000000000000000000';
const transaction = { from: simulationSender, data: creation, value: '0x0' };
const report = {
  scope: 'READ_ONLY_COUNTER_CREATION_SIMULATION',
  started_at: new Date().toISOString(),
  network_id: 'qie-testnet',
  expected_chain_id: 1983,
  endpoint,
  simulation_sender: simulationSender,
  signer_account: null,
  transaction,
  preflight: null,
  requests: [],
  outcome: 'UNKNOWN',
  canonical_status_promotion: false,
};

async function request(method, params = []) {
  const record = { method, params, started_at: new Date().toISOString() };
  report.requests.push(record);
  try {
    record.result = await rpcCall({ url: endpoint, method, params, requestId: report.requests.length });
    record.outcome = 'OBSERVED';
    return record.result;
  } catch (error) {
    record.outcome = 'ERROR';
    record.error_code = error.errorCode ?? 'UNKNOWN';
    record.message = error.message;
    throw error;
  } finally {
    record.finished_at = new Date().toISOString();
  }
}

try {
  report.preflight = await verifyNetworkIdentity({ networkId: 'qie-testnet', endpoint, snapshot });
  if (report.preflight.live_check.outcome !== 'PASS') throw new Error('Selected-network preflight did not pass.');
  const block = await request('eth_getBlockByNumber', ['latest', false]);
  if (!block || parseHexQuantity(block.number) === null || !/^0x[0-9a-fA-F]{64}$/.test(block.hash)) {
    throw new Error('A numbered block and hash are required for the simulation scope.');
  }
  report.block = { number: block.number, hash: block.hash, timestamp: block.timestamp, gas_limit: block.gasLimit, base_fee_per_gas: block.baseFeePerGas ?? null };
  report.client_version = await request('web3_clientVersion');
  const gasPriceHex = await request('eth_gasPrice');
  const returnedRuntime = await request('eth_call', [transaction, block.number]);
  report.runtime_comparison = {
    matches_compiled_runtime: typeof returnedRuntime === 'string' && returnedRuntime.toLowerCase() === runtime.toLowerCase(),
    expected_bytes: (runtime.length - 2) / 2,
    returned_bytes: typeof returnedRuntime === 'string' ? (returnedRuntime.length - 2) / 2 : null,
  };
  if (!report.runtime_comparison.matches_compiled_runtime) throw new Error('Creation-call return data differs from compiled runtime.');
  const estimateHex = await request('eth_estimateGas', [transaction, block.number]);
  const estimate = parseHexQuantity(estimateHex);
  const gasPrice = parseHexQuantity(gasPriceHex);
  const blockLimit = parseHexQuantity(block.gasLimit);
  if (estimate === null || estimate === 0n || gasPrice === null || blockLimit === null || estimate > blockLimit) {
    throw new Error('Malformed or unusable gas estimate or gas-price response.');
  }
  const repeated = await request('eth_getBlockByNumber', [block.number, false]);
  report.same_block_hash_at_recheck = repeated?.hash === block.hash;
  if (!report.same_block_hash_at_recheck) throw new Error('Simulation block hash changed or could not be reread.');
  report.gas_quote = {
    gas_estimate_hex: estimateHex,
    gas_estimate: estimate.toString(),
    gas_price_hex: gasPriceHex,
    gas_price_base_units_per_gas: gasPrice.toString(),
    estimate_times_price_base_units: (estimate * gasPrice).toString(),
    native_symbol: metadata.native_currency_documentation.testnet.symbol,
    documented_native_decimals: metadata.native_currency_documentation.testnet.decimals,
    scope: 'Point-in-time synthetic-sender estimate; not an approved fee limit or actual-signer quote.',
  };
  report.outcome = 'OBSERVED';
} catch (error) {
  report.error_code = error.errorCode ?? 'UNKNOWN';
  report.reason = error.message;
}
report.finished_at = new Date().toISOString();
console.log(JSON.stringify(report, null, 2));
process.exitCode = report.outcome === 'OBSERVED' ? 0 : 1;
