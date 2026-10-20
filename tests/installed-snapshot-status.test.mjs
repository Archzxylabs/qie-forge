import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { readFile, writeFile } from 'node:fs/promises';
import YAML from 'yaml';
import { buildRelease } from '../scripts/lib/release.mjs';
import { effectiveStatus } from '../scripts/lib/effective-status.mjs';
import { fixtureProject } from './support/fixtures.mjs';

// Installed-snapshot status consistency (B08 final audit, F-FINAL-02).
//
// The compatibility matrix, the ecosystem catalogue and the knowledge snapshot
// that ships inside a bundle are three views of the same canonical record. An
// agent that installs a bundle and reads only `data/*.json` must not reach a
// different support verdict than an agent that reads the rendered reference
// pages. The projection is therefore computed once, at the frozen build clock,
// and published with the record it belongs to.
//
// The fixtures below are synthetic and local. They exist only to exercise the
// projection rules the canonical release cannot exercise on its own (no
// canonical capability is VERIFIED, because no live execution evidence
// exists). The canonical checkout is never modified.

const CRITICAL_CHAIN_ID_CLAIM = 'qie-mainnet.chain_id';

// A VERIFIED record is only legitimate with reviewed, non-mock, operation-,
// network- and version-matched PASS evidence. This builds exactly that
// synthetic evidence for the canonical chain-ID claim.
async function withVerifiedChainId(root, { expiresAt }) {
  const claimsFile = path.join(root, 'knowledge/claims.yaml');
  const claims = YAML.parse(await readFile(claimsFile, 'utf8'));
  const target = claims.find((claim) => claim.claim_id === CRITICAL_CHAIN_ID_CLAIM);
  target.status = 'VERIFIED';
  target.evidence_type = 'CHAIN_OBSERVATION';
  target.evidence_test_ids = ['synthetic-chain-id-observation'];
  target.checked_at = '2026-10-01T00:00:00Z';
  target.expires_at = expiresAt;
  target.version_scope = 'synthetic-node-1.0.0';
  await writeFile(claimsFile, YAML.stringify(claims));

  const runsFile = path.join(root, 'knowledge/validation-runs.yaml');
  const runs = YAML.parse(await readFile(runsFile, 'utf8'));
  runs.push({
    test_id: 'synthetic-chain-id-observation',
    scope: { kind: 'CHAIN_OBSERVATION', operation: 'chain_id' },
    network_id: 'qie-mainnet',
    tool_version: 'synthetic-node-1.0.0',
    expected: 1990,
    observed: 1990,
    outcome: 'PASS',
    checked_at: '2026-10-01T00:00:00Z',
    artifact_hash: 'a'.repeat(64),
    redacted_log_pointer: null,
    reviewer: 'synthetic-fixture-reviewer',
  });
  await writeFile(runsFile, YAML.stringify(runs));
  return target;
}

const read = (root, relative) => readFile(path.join(root, relative), 'utf8');

test('expired VERIFIED evidence is published as STALE in every view, including the installed snapshot', async (t) => {
  const root = await fixtureProject(t);
  await withVerifiedChainId(root, { expiresAt: '2026-10-10T00:00:00Z' });
  await buildRelease(root);

  const catalogue = await read(root, 'skills/qie-ecosystem/references/catalogue.md');
  const catalogueRow = catalogue.split('\n').find((line) => line.startsWith('| `qie-mainnet` | `chain_id`'));
  assert.match(catalogueRow, /\| VERIFIED \| \*\*STALE\*\* \|/, 'the catalogue publishes the expired verdict');

  const profile = await read(root, 'skills/qie-networks/references/network-mainnet.md');
  const profileRow = profile.split('\n').find((line) => line.startsWith('| chain_id '));
  assert.match(profileRow, /\| VERIFIED \| \*\*STALE\*\* \|/, 'the network profile publishes the expired verdict');

  const evidence = await read(root, 'skills/qie-debug/references/evidence.md');
  const evidenceRow = evidence.split('\n').find((line) => line.startsWith('| qie-mainnet.chain_id '));
  assert.match(evidenceRow, /\| VERIFIED \| \*\*STALE\*\* \|/, 'the selected-evidence page publishes the expired verdict');

  const snapshot = JSON.parse(await read(root, 'skills/qie-ecosystem/data/ecosystem-catalogue.json'));
  const claim = snapshot.claims.find((entry) => entry.claim_id === CRITICAL_CHAIN_ID_CLAIM);
  assert.equal(claim.status, 'VERIFIED', 'the stored status is preserved for provenance');
  assert.equal(claim.effective_status, 'STALE', 'the installed snapshot publishes the same effective verdict');
  assert.match(claim.effective_status_reason, /expired/i);

  for (const view of [catalogue, profile, evidence]) {
    assert.doesNotMatch(view, /\| VERIFIED \| \*\*VERIFIED\*\* \|/, 'no view keeps a positive verdict on expired evidence');
  }
});

test('offline high-risk VERIFIED evidence is published as UNKNOWN, never as VERIFIED', async (t) => {
  const root = await fixtureProject(t);
  // The canonical chain-ID claim is risk_level critical, so offline evidence
  // cannot establish current operational freshness.
  await withVerifiedChainId(root, { expiresAt: '2026-12-01T00:00:00Z' });
  await buildRelease(root);

  const catalogue = await read(root, 'skills/qie-ecosystem/references/catalogue.md');
  const catalogueRow = catalogue.split('\n').find((line) => line.startsWith('| `qie-mainnet` | `chain_id`'));
  assert.match(catalogueRow, /\| VERIFIED \| \*\*UNKNOWN\*\* \|/, 'the catalogue downgrades offline high-risk evidence');

  const snapshot = JSON.parse(await read(root, 'skills/qie-ecosystem/data/ecosystem-catalogue.json'));
  const claim = snapshot.claims.find((entry) => entry.claim_id === CRITICAL_CHAIN_ID_CLAIM);
  assert.equal(claim.effective_status, 'UNKNOWN');
  assert.match(claim.effective_status_reason, /offline/i);

  const profile = await read(root, 'skills/qie-networks/references/network-mainnet.md');
  assert.doesNotMatch(profile, /\| VERIFIED \| \*\*VERIFIED\*\* \|/, 'the network profile never publishes VERIFIED offline');
});

test('the installed snapshot and every rendered view publish the same effective status', async (t) => {
  const root = await fixtureProject(t);
  await buildRelease(root);

  const snapshot = JSON.parse(await read(root, 'skills/qie-ecosystem/data/ecosystem-catalogue.json'));
  const catalogue = await read(root, 'skills/qie-ecosystem/references/catalogue.md');
  const matrix = await read(root, 'skills/qie-ecosystem/references/compatibility.md');

  for (const capability of snapshot.capabilities) {
    const matrixRow = matrix.split('\n').find((line) => line.startsWith(`| \`${capability.capability_id}\` |`));
    assert.ok(matrixRow, `the matrix publishes ${capability.capability_id}`);
    assert.match(matrixRow, new RegExp(`\\| \`${capability.status}\` \\| \\*\\*${capability.effective_status}\\*\\* \\|`),
      `${capability.capability_id} matrix verdict matches the installed snapshot`);
    const catalogueRow = catalogue.split('\n').find((line) => line.startsWith(`| \`${capability.capability_id}\` |`));
    assert.ok(catalogueRow, `the catalogue publishes ${capability.capability_id}`);
    assert.match(catalogueRow, new RegExp(`\\*\\*${capability.effective_status}\\*\\*`),
      `${capability.capability_id} catalogue verdict matches the installed snapshot`);
  }
});

test('the published projection is the canonical evaluator applied to the stored record', async (t) => {
  const root = await fixtureProject(t);
  await buildRelease(root);
  const snapshot = JSON.parse(await read(root, 'skills/qie-ecosystem/data/ecosystem-catalogue.json'));

  for (const record of [...snapshot.capabilities, ...snapshot.claims]) {
    const expected = effectiveStatus(record, { now: snapshot.status_evaluated_at, offline: true }).status;
    assert.equal(record.effective_status, expected, `${record.capability_id ?? record.claim_id} uses the shared evaluator`);
    // A projection may preserve the stored status or downgrade it. It may
    // never promote a record to a stronger evidence level.
    assert.ok(['STALE', 'UNKNOWN'].includes(record.effective_status) || record.effective_status === record.status,
      `${record.capability_id ?? record.claim_id} is never silently promoted`);
  }
});
