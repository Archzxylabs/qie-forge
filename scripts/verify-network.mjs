// Original CLI wrapper for the read-only network diagnostic (PRD FR-003). It prints one
// JSON report and never signs or broadcasts. Exit codes are fail-closed for preflight
// use: 0 report with PASS, 1 report with FAIL or UNKNOWN, 2 usage error.
//
// The packaged network claims are read from the installed skill by default. The
// optional --claims override lets a maintainer run this source file against an explicit
// snapshot; it never changes which network is selected or how identity is verified.
import { readFile } from 'node:fs/promises';
import { verifyNetworkIdentity } from './lib/network-diagnostic.mjs';

try {
  const args = process.argv.slice(2);
  const positional = [];
  let endpoint = null;
  let claims = null;
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--rpc') {
      endpoint = args[i + 1];
      if (!endpoint) throw new Error('--rpc requires an https URL.');
      i += 1;
    } else if (args[i] === '--claims') {
      claims = args[i + 1];
      if (!claims) throw new Error('--claims requires a network-claims.json path.');
      i += 1;
    } else if (args[i].startsWith('--')) {
      throw new Error(`Unknown option: ${args[i]}`);
    } else {
      positional.push(args[i]);
    }
  }
  if (positional.length !== 1) {
    throw new Error('Usage: node scripts/verify-network.mjs <qie-mainnet|qie-testnet> [--rpc <https-url>] [--claims <network-claims.json>]');
  }
  const snapshot = claims ? JSON.parse(await readFile(claims, 'utf8')) : null;
  const report = await verifyNetworkIdentity({ networkId: positional[0], endpoint, snapshot });
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = report.live_check.outcome === 'PASS' ? 0 : 1;
} catch (error) {
  console.error(JSON.stringify({ outcome: 'UNKNOWN', error_code: 'DEPENDENCY_MISMATCH', message: error.message }, null, 2));
  process.exitCode = 2;
}
