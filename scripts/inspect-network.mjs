// Original offline helper. Reads packaged files only; never contacts RPC or signs.
import { readFile } from 'node:fs/promises';
import { effectiveStatus } from './lib/effective-status.mjs';

try {
  const snapshot = JSON.parse(await readFile(new URL('../data/network-claims.json', import.meta.url), 'utf8'));
  const network = process.argv[2];
  if (!['qie-mainnet', 'qie-testnet'].includes(network)) {
    throw new Error('Choose qie-mainnet or qie-testnet explicitly.');
  }
  const claims = snapshot.claims.filter((record) => record.network_id === network);
  if (!claims.length) throw new Error('Packaged network records are missing.');
  const now = new Date().toISOString();
  console.log(JSON.stringify({
    network_id: network,
    claims: claims.map((record) => ({
      claim_id: record.claim_id, predicate: record.predicate, value: record.value,
      ...effectiveStatus(record, { now, offline: true }),
      source_ids: record.source_ids,
    })),
    sources: snapshot.sources.map(({ source_id, url }) => ({ source_id, url })),
    live_check: { outcome: 'NOT_RUN', reason: 'Offline inspection only; no RPC or provider compatibility test was executed.' },
  }, null, 2));
} catch (error) {
  console.error(JSON.stringify({ outcome: 'UNKNOWN', error_code: 'DEPENDENCY_MISMATCH', message:
    error.message.startsWith('Choose ') ? error.message : 'Cannot inspect the packaged network snapshot.' }));
  process.exitCode = 1;
}
