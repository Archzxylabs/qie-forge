// Original CLI wrapper for the read-only transaction observer (PRD FR-009, §14.4).
// It prints one JSON evidence report and never signs or broadcasts. Exit codes:
// 0 a report was produced (its verdict fields are authoritative), 2 usage error.
//
// The expected chain ID is not a user choice: it is bound to the selected network from
// the packaged network claims. The optional --claims override lets a maintainer run
// this source file against an explicit snapshot.
import { readFile } from 'node:fs/promises';
import { observeTransaction } from './lib/transaction-diagnostic.mjs';

try {
  const args = process.argv.slice(2);
  const positional = [];
  let claims = null;
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--claims') {
      claims = args[i + 1];
      if (!claims) throw new Error('--claims requires a network-claims.json path.');
      i += 1;
    } else if (args[i].startsWith('--')) {
      throw new Error(`Unknown option: ${args[i]}`);
    } else {
      positional.push(args[i]);
    }
  }
  if (positional.length < 4 || positional.length > 5) {
    throw new Error('Usage: node scripts/verify-transaction.mjs <qie-mainnet|qie-testnet> <txHash> '
      + '<GENERIC_TX|DEPLOY_DIRECT|MINT> <https-rpc-url> [expectedContractAddressOrTo] [--claims <network-claims.json>]');
  }
  const [networkId, txHash, kind, rpcUrl, address] = positional;
  const expectedAction = { kind };
  if (kind === 'DEPLOY_DIRECT') {
    if (!address) throw new Error('DEPLOY_DIRECT requires the expected contract address.');
    expectedAction.expectedContractAddress = address;
    expectedAction.expectedPostcondition = 'runtime-code-present';
  } else if (kind === 'GENERIC_TX') {
    expectedAction.expectedTo = address ?? null;
  } else if (kind === 'MINT') {
    expectedAction.expectedContractAddress = address ?? null;
  } else {
    throw new Error('kind must be GENERIC_TX, DEPLOY_DIRECT or MINT.');
  }
  const snapshot = claims ? JSON.parse(await readFile(claims, 'utf8')) : null;
  const report = await observeTransaction({ networkId, txHash, rpcUrl, expectedAction, snapshot });
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  console.error(JSON.stringify({ outcome: 'NOT_RUN', error_code: 'DEPENDENCY_MISMATCH', message: error.message }, null, 2));
  process.exitCode = 2;
}
