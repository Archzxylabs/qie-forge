import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { appendFile, cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { buildRelease } from '../../scripts/lib/release.mjs';
import { walkFiles } from '../../scripts/lib/io.mjs';
import { fixtureProject, temporaryDirectory } from './fixtures.mjs';

export function git(cwd, args) {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
  });
}

export async function createGitSource(t) {
  const root = await temporaryDirectory(t, 'qie-forge-git-source-');
  const work = path.join(root, 'work');
  const bare = path.join(root, 'source.git');
  await mkdir(work, { recursive: true });
  git(root, ['init', '--bare', '-q', 'source.git']);
  git(work, ['init', '-q', '-b', 'main']);
  git(work, ['config', 'user.name', 'QIE Forge Fixture']);
  git(work, ['config', 'user.email', 'fixture@example.invalid']);
  return { root, work, bare };
}

export async function syncSkills(source, project) {
  await rm(path.join(source.work, 'skills'), { recursive: true, force: true });
  await cp(path.join(project, 'skills'), path.join(source.work, 'skills'), { recursive: true });
}

export async function commitRelease(source, { tag, message }) {
  git(source.work, ['add', '-A']);
  git(source.work, ['commit', '-qm', message]);
  if (tag) git(source.work, ['tag', '-a', tag, '-m', message]);
  git(source.work, ['push', '-q', '--tags', source.bare, 'main']);
  return git(source.work, ['rev-parse', 'HEAD']).trim();
}

export async function buildFixture(t) {
  const project = await fixtureProject(t);
  await buildRelease(project);
  return project;
}

export async function appendAuthoringMarker(project, marker) {
  await appendFile(path.join(project, 'authoring/qie-networks/references/scope.md'), `\n${marker}\n`);
}

export async function setSchemaVersion(project, version) {
  const releaseContext = path.join(project, 'release-context.json');
  const context = JSON.parse(await readFile(releaseContext, 'utf8'));
  context.schema_version = version;
  await writeFile(releaseContext, `${JSON.stringify(context, null, 2)}\n`);
  const policy = path.join(project, 'knowledge/policy.yaml');
  const policyText = await readFile(policy, 'utf8');
  await writeFile(policy, policyText.replace(/^schema_version: .*$/m, `schema_version: ${version}`));
  const policySchema = path.join(project, 'knowledge/schema/policy.schema.json');
  const schema = JSON.parse(await readFile(policySchema, 'utf8'));
  schema.properties.schema_version.const = version;
  await writeFile(policySchema, `${JSON.stringify(schema, null, 2)}\n`);
}

export async function readBundleTree(root) {
  const files = new Map();
  for (const file of await walkFiles(root)) files.set(file, await readFile(path.join(root, file)));
  return files;
}

export async function assertBundleTree(actualRoot, expectedTree, assert) {
  const actual = await readBundleTree(actualRoot);
  assert.deepEqual([...actual.keys()].sort(), [...expectedTree.keys()].sort());
  for (const [file, content] of expectedTree) assert.deepEqual(actual.get(file), content, file);
}

export async function readManifest(skillRoot) {
  return JSON.parse(await readFile(path.join(skillRoot, 'MANIFEST.json'), 'utf8'));
}
