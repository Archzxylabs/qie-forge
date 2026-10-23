// GENERATED — DO NOT EDIT. Change canonical helper sources.
// Original offline helper. Reads packaged files only and never contacts RPC, a wallet,
// a provider or any other network service. Exit codes are fail-closed for scripting:
// 0 report, 1 unusable snapshot, 2 usage error.
//
// The packaged network claims are read relative to this file by default, which is the
// installed-skill layout. The optional --claims override lets a maintainer run this
// source file against an explicit snapshot; it never changes which network is selected
// or how identity is verified.
import { readFile } from 'node:fs/promises';
import { effectiveStatus } from './lib/effective-status.mjs';

const NETWORKS = ['qie-mainnet', 'qie-testnet'];
const USAGE = 'Usage: node scripts/inspect-network.mjs <qie-mainnet|qie-testnet> [--claims <network-claims.json>]';
const PACKAGED_UNAVAILABLE = 'Cannot inspect the packaged network snapshot.';
const SUPPLIED_UNINSPECTABLE = 'The supplied network snapshot could not be inspected.';

class UsageError extends Error {}
class SnapshotError extends Error {}

function parseArguments(argv) {
  const positional = [];
  let claims = null;
  for (let i = 0; i < argv.length; i += 1) {
    const argument = argv[i];
    if (argument === '--claims') {
      const value = argv[i + 1];
      if (!value || value.startsWith('--')) throw new UsageError('--claims requires a network-claims.json path.');
      claims = value;
      i += 1;
    } else if (argument.startsWith('--')) {
      throw new UsageError(`Unknown option: ${argument}`);
    } else {
      positional.push(argument);
    }
  }
  if (positional.length !== 1) throw new UsageError(USAGE);
  if (!NETWORKS.includes(positional[0])) throw new UsageError('Choose qie-mainnet or qie-testnet explicitly.');
  return { network: positional[0], claims };
}

// Parser messages can quote the supplied bytes. Every snapshot failure is therefore
// reported with a fixed message instead of the underlying error text.
async function readSnapshot(claimsPath) {
  const source = claimsPath === null ? new URL('../data/network-claims.json', import.meta.url) : claimsPath;
  let text;
  try {
    text = await readFile(source, 'utf8');
  } catch {
    throw new SnapshotError(claimsPath === null
      ? PACKAGED_UNAVAILABLE
      : `Cannot read the supplied network snapshot: ${claimsPath}`);
  }
  let snapshot;
  try {
    snapshot = JSON.parse(text);
  } catch {
    throw new SnapshotError(claimsPath === null ? PACKAGED_UNAVAILABLE : 'The supplied network snapshot is not valid JSON.');
  }
  if (snapshot === null || typeof snapshot !== 'object' || !Array.isArray(snapshot.claims) || !Array.isArray(snapshot.sources)) {
    throw new SnapshotError(claimsPath === null
      ? PACKAGED_UNAVAILABLE
      : 'The supplied network snapshot must contain claims and sources arrays.');
  }
  return snapshot;
}

let claimsPath = null;
try {
  const parsed = parseArguments(process.argv.slice(2));
  claimsPath = parsed.claims;
  const snapshot = await readSnapshot(claimsPath);
  const claims = snapshot.claims.filter((record) => record && record.network_id === parsed.network);
  if (!claims.length) {
    throw new SnapshotError(claimsPath === null
      ? 'Packaged network records are missing.'
      : `The supplied network snapshot has no records for ${parsed.network}.`);
  }
  const now = new Date().toISOString();
  console.log(JSON.stringify({
    network_id: parsed.network,
    claims: claims.map((record) => ({
      claim_id: record.claim_id, predicate: record.predicate, value: record.value,
      ...effectiveStatus(record, { now, offline: true }),
      source_ids: record.source_ids,
    })),
    sources: snapshot.sources.map(({ source_id, url }) => ({ source_id, url })),
    live_check: { outcome: 'NOT_RUN', reason: 'Offline inspection only; no RPC or provider compatibility test was executed.' },
  }, null, 2));
} catch (error) {
  const usage = error instanceof UsageError;
  const sanitized = usage || error instanceof SnapshotError;
  console.error(JSON.stringify({
    outcome: 'UNKNOWN',
    error_code: usage ? 'USAGE' : 'DEPENDENCY_MISMATCH',
    message: sanitized
      ? error.message
      : (claimsPath === null ? PACKAGED_UNAVAILABLE : SUPPLIED_UNINSPECTABLE),
  }));
  process.exitCode = usage ? 2 : 1;
}
