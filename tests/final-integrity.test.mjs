import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { cp, readFile, writeFile } from 'node:fs/promises';
import YAML from 'yaml';
import { buildRelease } from '../scripts/lib/release.mjs';
import { effectiveStatus } from '../scripts/lib/effective-status.mjs';
import { runNode } from './support/process.mjs';
import { fixtureProject, temporaryDirectory } from './support/fixtures.mjs';

// B08 final-integrity corrections (independent audit findings F-FINAL-01,
// F-FINAL-02 and F-FINAL-03).
//
// F-FINAL-02 requires one canonical effective-status projection for every
// developer-facing verdict, evaluated at the frozen build clock, plus
// adversarial proof that an expired, unverifiable or offline-only record can
// never keep a positive summary verdict in one view while another view still
// publishes it. F-FINAL-03 requires that a canonical network change cannot
// leave stale instructions behind in authored guidance.
//
// Every fixture below mutates a throwaway copy of the project; the canonical
// checkout is never modified.

const readYaml = async (root, relative) => YAML.parse(await readFile(path.join(root, relative), 'utf8'));
const writeYaml = async (root, relative, value) => writeFile(path.join(root, relative), YAML.stringify(value));

async function buildClockOf(root, relative = 'release-context.json') {
  const release = JSON.parse(await readFile(path.join(root, relative), 'utf8'));
  return release.built_at;
}

// Simulates an installation: the published bundle is copied out of the build
// tree into a consumer directory, exactly as a Skills CLI installation would
// leave it, and the installed copy is the only thing inspected afterwards.
async function installBundle(t, root, skill) {
  const consumer = await temporaryDirectory(t, 'qie-forge-final-integrity-');
  const destination = path.join(consumer, skill);
  await cp(path.join(root, 'skills', skill), destination, { recursive: true });
  return destination;
}

function rowFor(markdown, prefix) {
  const row = markdown.split('\n').find((line) => line.startsWith(prefix));
  assert.ok(row, `no published row starts with ${prefix}`);
  return row;
}

test('expired VERIFIED evidence is downgraded in every developer-facing verdict', async (t) => {
  const root = await fixtureProject(t);

  // Promote one canonical capability to VERIFIED with evidence that was valid
  // once and has since expired. The stored record keeps VERIFIED; every
  // published verdict must fall back to STALE.
  const capabilities = await readYaml(root, 'knowledge/capabilities.yaml');
  const target = capabilities.find((capability) => capability.capability_id === 'hardhat-deploy');
  target.status = 'VERIFIED';
  target.evidence_type = 'EXECUTED_TEST';
  target.tool_version_range = 'fixture-toolchain-1.0.0';
  target.checked_at = '2026-10-01T00:00:00Z';
  target.expires_at = '2026-10-10T00:00:00Z';
  target.evidence_test_ids = ['fixture-expired-verified-run'];
  await writeYaml(root, 'knowledge/capabilities.yaml', capabilities);

  await writeYaml(root, 'knowledge/validation-runs.yaml', [{
    test_id: 'fixture-expired-verified-run',
    scope: { kind: 'CHAIN_OBSERVATION', operation: target.operation },
    tool_version: 'fixture-toolchain-1.0.0',
    network_id: 'qie-mainnet',
    expected: { deployed: true },
    observed: { deployed: true },
    outcome: 'PASS',
    checked_at: '2026-10-02T00:00:00Z',
    artifact_hash: 'b'.repeat(64),
    redacted_log_pointer: null,
    reviewer: 'fixture-reviewer',
  }]);

  await buildRelease(root);

  const catalogue = await readFile(path.join(root, 'skills/qie-ecosystem/references/catalogue.md'), 'utf8');
  const matrix = await readFile(path.join(root, 'skills/qie-ecosystem/references/compatibility.md'), 'utf8');
  const guide = await readFile(path.join(root, 'skills/qie-ecosystem/references/decision-guide.md'), 'utf8');

  assert.match(rowFor(catalogue, '| `hardhat-deploy` |'), /\*\*STALE\*\*/,
    'the catalogue overview publishes the expired effective status');
  assert.match(rowFor(matrix, '| `hardhat-deploy` |'), /\| `VERIFIED` \| \*\*STALE\*\* \|/,
    'the compatibility summary keeps the stored status and publishes the expired effective status');
  assert.match(matrix, /### hardhat-deploy:[\s\S]*?\*\*Stored Status\*\*: `VERIFIED`[\s\S]*?\*\*Effective Status\*\*: `STALE`/,
    'the capability card labels the stored and the effective status separately');
  assert.match(rowFor(guide, '| **Hardhat**'), /STALE/,
    'the authored framework matrix publishes the same expired effective status');

  const installed = await installBundle(t, root, 'qie-ecosystem');
  const installedMatrix = await readFile(path.join(installed, 'references/compatibility.md'), 'utf8');
  assert.match(rowFor(installedMatrix, '| `hardhat-deploy` |'), /\| `VERIFIED` \| \*\*STALE\*\* \|/,
    'the installed snapshot publishes the same expired effective status');
});

test('offline high-risk VERIFIED evidence cannot keep a positive published verdict', async (t) => {
  const root = await fixtureProject(t);

  // A critical-risk chain identity claim with fresh, non-expired, reviewed
  // execution evidence. Offline, that evidence still cannot establish current
  // high-risk operational freshness, so the published verdict is UNKNOWN.
  const claims = await readYaml(root, 'knowledge/claims.yaml');
  const target = claims.find((claim) => claim.claim_id === 'qie-mainnet.chain_id');
  target.status = 'VERIFIED';
  target.evidence_type = 'CHAIN_OBSERVATION';
  target.checked_at = '2026-10-19T00:00:00Z';
  target.expires_at = '2026-12-19T00:00:00Z';
  target.evidence_test_ids = ['fixture-chain-observation'];
  await writeYaml(root, 'knowledge/claims.yaml', claims);

  await writeYaml(root, 'knowledge/validation-runs.yaml', [{
    test_id: 'fixture-chain-observation',
    scope: { kind: 'CHAIN_OBSERVATION', operation: target.predicate },
    tool_version: target.version_scope,
    network_id: target.network_id,
    expected: target.value,
    observed: target.value,
    outcome: 'PASS',
    checked_at: '2026-10-19T01:00:00Z',
    artifact_hash: 'c'.repeat(64),
    redacted_log_pointer: null,
    reviewer: 'fixture-reviewer',
  }]);

  await buildRelease(root);

  const builtAt = await buildClockOf(root);
  assert.equal(effectiveStatus(target, { now: builtAt, offline: true }).status, 'UNKNOWN',
    'the canonical evaluator refuses an offline high-risk VERIFIED verdict');

  const profile = await readFile(path.join(root, 'skills/qie-networks/references/network-mainnet.md'), 'utf8');
  assert.match(rowFor(profile, '| chain_id |'), /\| VERIFIED \| \*\*UNKNOWN\*\* \|/,
    'the network profile publishes the offline high-risk verdict, not the stored one');
  const catalogue = await readFile(path.join(root, 'skills/qie-ecosystem/references/catalogue.md'), 'utf8');
  assert.match(rowFor(catalogue, '| `qie-mainnet` | `chain_id`'), /\| VERIFIED \| \*\*UNKNOWN\*\* \|/,
    'the catalogue publishes the same verdict for the same claim');

  // The installed offline helper must reach the same verdict from the
  // installed snapshot, so an installed agent cannot read a stronger claim
  // than the published documents state.
  const installed = await installBundle(t, root, 'qie-networks');
  const report = JSON.parse(runNode([path.join(installed, 'scripts/inspect-network.mjs'), 'qie-mainnet']));
  const chain = report.claims.find((claim) => claim.predicate === 'chain_id');
  assert.equal(chain.status, 'UNKNOWN', 'the installed offline helper publishes the same verdict');
});

test('catalogue, compatibility matrix and the installed snapshot agree on every verdict', async (t) => {
  const root = await fixtureProject(t);
  await buildRelease(root);

  const installed = await installBundle(t, root, 'qie-ecosystem');
  const snapshot = JSON.parse(await readFile(path.join(installed, 'data/ecosystem-catalogue.json'), 'utf8'));
  const catalogue = await readFile(path.join(installed, 'references/catalogue.md'), 'utf8');
  const matrix = await readFile(path.join(installed, 'references/compatibility.md'), 'utf8');
  const releaseInfo = await readFile(path.join(installed, 'references/release-info.md'), 'utf8');
  const builtAt = /Built: (\S+)/.exec(releaseInfo)[1];

  assert.ok(snapshot.capabilities.length >= 20, 'the installed snapshot carries the canonical capabilities');
  for (const capability of snapshot.capabilities) {
    const verdict = effectiveStatus(capability, { now: builtAt, offline: true }).status;
    assert.match(rowFor(catalogue, `| \`${capability.capability_id}\` |`), new RegExp(`\\*\\*${verdict}\\*\\*`),
      `${capability.capability_id}: the catalogue verdict matches the canonical projection`);
    assert.match(rowFor(matrix, `| \`${capability.capability_id}\` |`),
      new RegExp(`\\| \`${capability.status}\` \\| \\*\\*${verdict}\\*\\* \\|`),
      `${capability.capability_id}: the matrix keeps the stored status and publishes the same effective verdict`);
  }

  // No stored status may be silently promoted anywhere in the installed views.
  for (const capability of snapshot.capabilities) {
    const verdict = effectiveStatus(capability, { now: builtAt, offline: true }).status;
    if (capability.status === verdict) continue;
    assert.notEqual(verdict, 'VERIFIED', 'a downgraded record never keeps a verified verdict');
  }
});

test('a canonical chain ID change cannot leave stale chain identifiers in published guidance', async (t) => {
  const root = await fixtureProject(t);

  const claims = await readYaml(root, 'knowledge/claims.yaml');
  const target = claims.find((claim) => claim.claim_id === 'qie-mainnet.chain_id');
  target.value = 1991;
  await writeYaml(root, 'knowledge/claims.yaml', claims);

  await buildRelease(root);

  const guide = await readFile(path.join(root, 'skills/qie-ecosystem/references/decision-guide.md'), 'utf8');
  assert.match(guide, /`1991`/, 'the changed canonical chain ID is published');
  assert.doesNotMatch(guide, /`1990`/, 'the stale chain identifier cannot survive a canonical change');
  assert.match(guide, /`0x7c7`/, 'the hexadecimal form follows the canonical chain ID');
  assert.doesNotMatch(guide, /`0x7c6`/, 'the stale hexadecimal chain identifier cannot survive');

  const profile = await readFile(path.join(root, 'skills/qie-networks/references/network-mainnet.md'), 'utf8');
  assert.match(rowFor(profile, '| chain_id |'), /\| 1991 \|/, 'the published network profile follows the canonical chain ID');
  assert.doesNotMatch(profile, /\| 1990 \|/, 'the published network profile has no stale chain ID');

  const catalogue = await readFile(path.join(root, 'skills/qie-ecosystem/references/catalogue.md'), 'utf8');
  assert.match(rowFor(catalogue, '| `qie-mainnet` | `chain_id`'), /`1991`/, 'the catalogue follows the canonical chain ID');
  assert.doesNotMatch(rowFor(catalogue, '| `qie-mainnet` | `chain_id`'), /`1990`/,
    'the catalogue has no stale chain ID');
});
