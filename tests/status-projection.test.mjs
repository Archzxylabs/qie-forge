import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { readFile, writeFile } from 'node:fs/promises';
import YAML from 'yaml';
import { buildRelease } from '../scripts/lib/release.mjs';
import { fixtureProject } from './support/fixtures.mjs';

// Cross-view status projection (B08 final audit, F-FINAL-02). Every
// developer-facing verdict in a bundle must come from the one shared,
// non-promoting projection evaluated at the frozen build clock. A record
// whose evidence has expired must therefore be shown as expired everywhere,
// with the stored status still visible next to it.

test('an expired claim downgrades in the network profile, catalogue and evidence page together', async (t) => {
  const root = await fixtureProject(t);
  const claimsFile = path.join(root, 'knowledge/claims.yaml');
  const claims = YAML.parse(await readFile(claimsFile, 'utf8'));
  const target = claims.find((claim) => claim.claim_id === 'qie-mainnet.rpc_url');
  target.checked_at = '2026-10-01T00:00:00Z';
  target.expires_at = '2026-10-10T00:00:00Z';
  await writeFile(claimsFile, YAML.stringify(claims));

  await buildRelease(root);

  const profile = await readFile(path.join(root, 'skills/qie-networks/references/network-mainnet.md'), 'utf8');
  const profileRow = profile.split('\n').find((line) => line.startsWith('| rpc_url '));
  assert.match(profileRow, /\| `?DOCUMENTED`? \| \*\*STALE\*\* \|/, 'the network profile publishes the effective claim status');

  const catalogue = await readFile(path.join(root, 'skills/qie-ecosystem/references/catalogue.md'), 'utf8');
  const catalogueRow = catalogue.split('\n').find((line) => line.startsWith('| `qie-mainnet` | `rpc_url`'));
  assert.match(catalogueRow, /\| DOCUMENTED \| \*\*STALE\*\* \|/, 'the catalogue publishes the effective claim status');

  const evidence = await readFile(path.join(root, 'skills/qie-debug/references/evidence.md'), 'utf8');
  const evidenceRow = evidence.split('\n').find((line) => line.startsWith('| qie-mainnet.rpc_url '));
  assert.match(evidenceRow, /\| DOCUMENTED \| \*\*STALE\*\* \|/, 'the selected-evidence page publishes the effective claim status');
});

test('every published view labels a stored status and an effective status', async (t) => {
  const root = await fixtureProject(t);
  await buildRelease(root);

  const catalogue = await readFile(path.join(root, 'skills/qie-ecosystem/references/catalogue.md'), 'utf8');
  const matrix = await readFile(path.join(root, 'skills/qie-ecosystem/references/compatibility.md'), 'utf8');
  const coverage = await readFile(path.join(root, 'skills/qie/references/qie-a-z.md'), 'utf8');
  const profile = await readFile(path.join(root, 'skills/qie-networks/references/network-mainnet.md'), 'utf8');

  assert.match(catalogue, /\| Effective Status \| Primary Limitation \|/);
  assert.match(matrix, /\| Stored Status \| Effective Status \|/);
  assert.match(matrix, /\*\*Stored Status\*\*: `/);
  assert.match(matrix, /\*\*Effective Status\*\*: `/);
  assert.match(coverage, /- Effective status: \*\*/);
  assert.match(profile, /\| Stored evidence \| Effective status \|/);
});
