import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { appendFile, cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { buildRelease } from '../scripts/lib/release.mjs';
import { loadValidators } from '../scripts/lib/schemas.mjs';
import { validateBundle } from '../scripts/lib/bundle.mjs';
import { fixtureProject, temporaryDirectory, schemaRoot, releasedSkills } from './support/fixtures.mjs';

const validate = await loadValidators(schemaRoot);

const expectedRouterFiles = [
  'SKILL.md',
  'MANIFEST.json',
  'data/qie-a-z.json',
  'references/qie-a-z.md',
  'references/release-info.md',
  'references/routing.md',
];

test('multi-skill build is byte-reproducible across roots and staging equals publication', async (t) => {
  const first = await fixtureProject(t); const second = await fixtureProject(t);
  const a = await buildRelease(first); const b = await buildRelease(second);
  assert.deepEqual(Object.keys(a).sort(), releasedSkills);
  assert.deepEqual(a, b);
  assert.deepEqual(await buildRelease(first, { check: true }), a);
  for (const skill of releasedSkills) {
    for (const [file, content] of Object.entries(a[skill])) {
      assert.equal(await readFile(path.join(first, 'skills', skill, file), 'utf8'), content);
      assert.equal(await readFile(path.join(first, 'dist/skills', skill, file), 'utf8'), content);
    }
  }
});

test('all installed bundles validate independently with consistent release metadata', async (t) => {
  const root = await fixtureProject(t); await buildRelease(root);
  const context = JSON.parse(await readFile(path.join(root, 'release-context.json'), 'utf8'));
  for (const skill of releasedSkills) {
    const bundle = path.join(root, 'skills', skill);
    const manifest = await validateBundle(bundle, validate);
    assert.equal(manifest.release_version, context.release_version);
    assert.equal(manifest.schema_version, context.schema_version);
    assert.equal(manifest.built_at, context.built_at);
    assert.ok(manifest.sources_checked_at === null
      || Date.parse(manifest.sources_checked_at) <= Date.parse(manifest.built_at),
    `${skill}: source reviews cannot postdate the build`);
  }
  const router = JSON.parse(await readFile(path.join(root, 'skills/qie/MANIFEST.json'), 'utf8'));
  assert.equal(router.snapshot_path, 'data/qie-a-z.json');
  const networks = JSON.parse(await readFile(path.join(root, 'skills/qie-networks/MANIFEST.json'), 'utf8'));
  assert.equal(networks.snapshot_path, 'data/network-claims.json');
});

test('router bundle contains exactly its self-contained inventory', async (t) => {
  const root = await fixtureProject(t); const output = await buildRelease(root);
  assert.deepEqual(Object.keys(output['qie']).sort(), [...expectedRouterFiles].sort());
  const snapshot = JSON.parse(output['qie']['data/qie-a-z.json']);
  assert.equal(snapshot.domains.length, 15);
  assert.equal(snapshot.validation_runs.length, 0, 'no invented runtime evidence');
  assert.equal(snapshot.claims.length, 0, 'the router carries no chain facts');
  assert.deepEqual(snapshot.sources.map((s) => s.source_id).sort(), [
    'S00', 'S01', 'S03', 'S04', 'S08', 'S09', 'S10', 'S11', 'S12', 'S13', 'S14', 'S15', 'S16', 'S17', 'S18', 'S19', 'S20', 'S21',
  ]);
  assert.deepEqual(snapshot.skills.map((s) => s.skill_id), releasedSkills);
  const networksSnapshot = JSON.parse(output['qie-networks']['data/network-claims.json']);
  assert.ok(!('skills' in networksSnapshot), 'network snapshot stays task-scoped');
  assert.deepEqual(networksSnapshot.domains.map((d) => d.domain_id), ['D02']);
});

test('router handles a missing sibling skill offline after checkout removal', async (t) => {
  const source = await fixtureProject(t); await buildRelease(source);
  const isolated = await temporaryDirectory(t);
  const skill = path.join(isolated, 'qie');
  await cp(path.join(source, 'skills/qie'), skill, { recursive: true });
  await rm(source, { recursive: true, force: true });
  const manifest = await validateBundle(skill, validate);
  assert.equal(manifest.skill_id, 'qie');
  const routing = await readFile(path.join(skill, 'references/routing.md'), 'utf8');
  const entry = await readFile(path.join(skill, 'SKILL.md'), 'utf8');
  // The installed router knows about skills it does not contain and distinguishes
  // installable published skills from non-installable planned ones.
  assert.match(routing, /qie-networks/);
  assert.match(routing, /qie-networks` \(published in this release\)/);
  assert.match(routing, /planned; not a published artifact/);
  assert.match(routing, /is NOT installable/);
  assert.match(routing, /skills add <qie-forge-source> --skill <skill-name>/);
  assert.match(entry, /never read a path that does not exist/);
  const data = JSON.parse(await readFile(path.join(skill, 'data/qie-a-z.json'), 'utf8'));
  assert.equal(data.domains.length, 15);
});

for (const broken of ['[missing](references/nope.md)', '[escape](../../knowledge/claims.yaml)']) {
  test(`router build rejects broken local reference: ${broken}`, async (t) => {
    const root = await fixtureProject(t);
    await appendFile(path.join(root, 'authoring/qie/SKILL.md.in'), `\n${broken}\n`);
    await assert.rejects(buildRelease(root), /reference/i);
  });
}

test('authoring cannot silently overwrite generated router references', async (t) => {
  const root = await fixtureProject(t);
  await mkdir(path.join(root, 'authoring/qie/references'), { recursive: true });
  await writeFile(path.join(root, 'authoring/qie/references/routing.md'), 'handwritten routes');
  await assert.rejects(buildRelease(root), /Reserved generated reference/);
  await writeFile(path.join(root, 'authoring/qie/references/qie-a-z.md'), 'handwritten coverage');
  await assert.rejects(buildRelease(root), /Reserved generated reference/);
});

test('edited generated publication is detected for either skill', async (t) => {
  const root = await fixtureProject(t); await buildRelease(root);
  await appendFile(path.join(root, 'skills/qie/references/routing.md'), '\nchanged\n');
  await assert.rejects(buildRelease(root, { check: true }), /drift/);
  await buildRelease(root);
  await appendFile(path.join(root, 'skills/qie-networks/references/scope.md'), '\nchanged\n');
  await assert.rejects(buildRelease(root, { check: true }), /drift/);
});

test('a disabled entry skill is never labelled published in generated routes', async (t) => {
  const root = await fixtureProject(t);
  const selectorFile = path.join(root, 'knowledge/skills.yaml');
  const selectors = await readFile(selectorFile, 'utf8');
  const disabled = selectors.replace('enabled_for_release: true\n  domain_ids:\n    - D02', 'enabled_for_release: false\n  domain_ids:\n    - D02');
  assert.notEqual(disabled, selectors, 'fixture mutates the qie-networks selector');
  await writeFile(selectorFile, disabled);
  const output = await buildRelease(root);
  assert.deepEqual(Object.keys(output).sort(), releasedSkills.filter(s => s !== 'qie-networks'), 'only enabled skills are packaged');
  const routing = output['qie']['references/routing.md'];
  assert.match(routing, /\| D02 Networks and RPC \| `qie-networks` \(catalogued; not published in this release\) \|/);
  assert.match(routing, /\| `qie-networks` \| P0 \| catalogued; not published in this release \| D02 \|/);
  assert.ok(!routing.includes('`qie-networks` (published in this release)'), 'a disabled skill must not be offered as installable');
  const coverage = output['qie']['references/qie-a-z.md'];
  assert.match(coverage, /Entry skill: `qie-networks` \(catalogued; not published in this release\)/);
});

test('generated routes distinguish installable published skills from planned artifacts', async (t) => {
  const root = await fixtureProject(t); const output = await buildRelease(root);
  const routing = output['qie']['references/routing.md'];
  // Published: installable, remediation allowed.
  assert.match(routing, /`qie-networks` \(published in this release\)/);
  assert.match(routing, /is an installable release artifact/);
  // Planned: explicitly not installable, no release implied.
  assert.match(routing, /`qie-smart-contracts` \(published in this release\)/);
  assert.match(routing, /`qie-ecosystem` \(published in this release\)/);
  assert.match(routing, /`qie-native` \(planned; not a published artifact\)/);
  assert.match(routing, /`qie-indexing` \(planned; not a published artifact\)/);
  assert.match(routing, /is NOT installable/);
  assert.match(routing, /never offer it as a release artifact/);
  // The router entry carries the same two-way distinction.
  const entry = output['qie']['SKILL.md'];
  assert.match(entry, /### Published skill missing locally/);
  assert.match(entry, /### Planned skill — not installable/);
});
