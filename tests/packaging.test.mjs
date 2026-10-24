import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { appendFile, cp, readFile, rm, writeFile } from 'node:fs/promises';
import { runNode } from './support/process.mjs';
import { buildRelease } from '../scripts/lib/release.mjs';
import { loadValidators } from '../scripts/lib/schemas.mjs';
import { validateBundle, validateFrontmatter, validateReferences } from '../scripts/lib/bundle.mjs';
import { readYaml } from '../scripts/lib/io.mjs';
import { fixtureProject, temporaryDirectory, schemaRoot } from './support/fixtures.mjs';

const validate = await loadValidators(schemaRoot);

test('build is byte-reproducible across separate roots and staging equals publication', async (t) => {
  const first = await fixtureProject(t); const second = await fixtureProject(t);
  const a = await buildRelease(first); const b = await buildRelease(second);
  assert.deepEqual(a, b);
  assert.deepEqual(await buildRelease(first, { check: true }), a);
  for (const [file, content] of Object.entries(a['qie-networks'])) {
    assert.equal(await readFile(path.join(first, 'skills/qie-networks', file), 'utf8'), content);
    assert.equal(await readFile(path.join(first, 'dist/skills/qie-networks', file), 'utf8'), content);
  }
});

test('offline helper works after canonical authoring, knowledge, scripts and checkout are removed', async (t) => {
  const source = await fixtureProject(t); await buildRelease(source);
  const isolated = await temporaryDirectory(t);
  const skill = path.join(isolated, 'qie-networks');
  await cp(path.join(source, 'skills/qie-networks'), skill, { recursive: true });
  await rm(source, { recursive: true, force: true });
  await validateBundle(skill, validate);
  for (const network of ['qie-mainnet', 'qie-testnet']) {
    const json = JSON.parse(runNode([path.join(skill, 'scripts/inspect-network.mjs'), network], { cwd: isolated }));
    assert.equal(json.network_id, network);
    assert.equal(json.live_check.outcome, 'NOT_RUN');
    assert.ok(json.claims.every((c) => c.status === 'DOCUMENTED'));
  }
});

test('packaged manifest rejects tampering and unlisted files', async (t) => {
  const root = await fixtureProject(t); await buildRelease(root);
  const skill = path.join(root, 'skills/qie-networks');
  await appendFile(path.join(skill, 'references/scope.md'), '\nchanged\n');
  await assert.rejects(validateBundle(skill, validate), /hash mismatch/);
  await assert.rejects(buildRelease(root, { check: true }), /drift/);
  await buildRelease(root);
  await writeFile(path.join(skill, 'unlisted.txt'), 'unexpected');
  await assert.rejects(validateBundle(skill, validate), /inventory differs/);
});

for (const target of ['references/missing.md','../../knowledge/claims.yaml','/home/private/file','references/%2e%2e/%2e%2e/secret']) {
  test(`rejects broken/escaping link ${target}`, () => {
    assert.throws(() => validateReferences({ 'SKILL.md': `[reference](${target})` }), /reference/);
  });
}
test('rejects broken JS imports, data URLs and reference-style Markdown links', () => {
  assert.throws(() => validateReferences({ 'scripts/a.mjs': "import { x } from './missing.mjs';" }), /reference/);
  assert.throws(() => validateReferences({ 'scripts/a.mjs': "new URL('../data/missing.json', import.meta.url)" }), /reference/);
  assert.throws(() => validateReferences({ 'SKILL.md': '[text][missing]' }), /definition/);
});
test('rejects missing/duplicate/invalid frontmatter without silently repairing it', () => {
  assert.throws(() => validateFrontmatter('body', 'qie-networks'), /frontmatter/);
  assert.throws(() => validateFrontmatter('---\nname: qie-networks\nname: other\ndescription: test\n---\n', 'qie-networks'), /YAML/);
  assert.throws(() => validateFrontmatter('---\nname: other\ndescription: test\n---\n', 'qie-networks'), /name/);
});

test('a broken authored link prevents publication', async (t) => {
  const root = await fixtureProject(t);
  await appendFile(path.join(root, 'authoring/qie-networks/SKILL.md.in'), '\n[broken](references/missing.md)\n');
  await assert.rejects(buildRelease(root), /Broken/);
});
test('selected capability recipes must exist within the skill', async (t) => {
  const root = await fixtureProject(t);
  const file = path.join(root, 'knowledge/capabilities.yaml');
  const content = await readFile(file, 'utf8');
  await writeFile(file, content.replace('recipe_path: null', 'recipe_path: references/missing-recipe.md'));
  await assert.rejects(buildRelease(root), /Missing skill-local recipe/);
});
test('authoring cannot silently overwrite generated network references', async (t) => {
  const root = await fixtureProject(t);
  await writeFile(path.join(root, 'authoring/qie-networks/references/network-mainnet.md'), 'handwritten fact');
  await assert.rejects(buildRelease(root), /Reserved generated reference/);
});
test('selected snapshot contains only transitive sources and no invented runtime evidence', async (t) => {
  const root = await fixtureProject(t); const output = await buildRelease(root);
  const snapshot = JSON.parse(output['qie-networks']['data/network-claims.json']);
  assert.deepEqual(snapshot.sources.map((s) => s.source_id), ['S03', 'S10', 'S15']);
  assert.equal(snapshot.validation_runs.length, 0);
  assert.deepEqual(snapshot.domains.map((d) => d.domain_id), ['D02']);
  const manifest = JSON.parse(output['qie-networks']['MANIFEST.json']);
  assert.equal(manifest.built_at, JSON.parse(await readFile(path.join(root, 'release-context.json'))).built_at);
  assert.equal(manifest.sources_checked_at, (await readYaml(path.join(root, 'knowledge/sources.yaml'))).find((s) => s.source_id === 'S03').reviewed_at);
});
