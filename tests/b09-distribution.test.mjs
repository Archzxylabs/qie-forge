import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { appendFile, cp, lstat, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { runNodeResult } from './support/process.mjs';
import { projectRoot, releasedSkills, temporaryDirectory } from './support/fixtures.mjs';
import { inspectInstalledRelease } from '../scripts/lib/installed-release.mjs';
import { computeReleaseId, readBundleInventory, releaseIdentityInput } from '../scripts/lib/release-identity.mjs';
import { sha256 } from '../scripts/lib/io.mjs';
import { buildRelease } from '../scripts/lib/release.mjs';
import { serveGitRepository } from './support/git-http.mjs';
import { isolatedEnvironment, runSkillsAsync, runSkillsResultAsync } from './support/skills-cli.mjs';
import {
  appendAuthoringMarker, assertBundleTree, buildFixture, commitRelease, createGitSource,
  readBundleTree, readManifest, setSchemaVersion, syncSkills,
} from './support/git-release.mjs';

const verifier = path.join(projectRoot, 'scripts/verify-installed-release.mjs');
const stripAnsi = (text) => text.replaceAll(/\x1b\[[0-9;?]*[A-Za-z]/g, '');

async function consumer(t, prefix = 'qie-forge-b09-consumer-') {
  const root = await temporaryDirectory(t, prefix);
  await mkdir(path.join(root, '.claude'), { recursive: true });
  await mkdir(path.join(root, 'home'), { recursive: true });
  return root;
}

function installArgs(url, ref, selection, copy) {
  const args = ['add', `${url}#${ref}`, '--skill', selection, '-a', 'codex', '-a', 'claude-code', '-y'];
  if (copy) args.push('--copy');
  return args;
}

function install(consumerRoot, url, ref, selection, copy = false) {
  return runSkillsAsync(installArgs(url, ref, selection, copy), { cwd: consumerRoot, env: isolatedEnvironment(consumerRoot) });
}

function update(consumerRoot, selection) {
  const args = ['update'];
  if (selection) args.push(selection);
  args.push('-p', '-y');
  return runSkillsResultAsync(args, { cwd: consumerRoot, env: isolatedEnvironment(consumerRoot) });
}

async function installedReport(consumerRoot, skills) {
  return inspectInstalledRelease(path.join(consumerRoot, '.agents/skills'), { expectedSkills: skills });
}

function assertCoherent(report, releaseId) {
  assert.equal(report.problems.length, 0, report.problems.join('\n'));
  assert.equal(report.releaseId, releaseId);
  assert.ok(['COHERENT_FULL_SUITE', 'COHERENT_PARTIAL'].includes(report.status));
}

async function assertInstalledTree(consumerRoot, expectedTree, copy) {
  await assertBundleTree(path.join(consumerRoot, '.agents/skills'), expectedTree, assert);
  for (const name of [...new Set([...expectedTree.keys()].map((file) => file.split('/')[0]))]) {
    const claude = path.join(consumerRoot, '.claude/skills', name);
    assert.equal((await lstat(claude)).isSymbolicLink(), !copy, `${name} copy mode`);
  }
}

test('B09 release identity is reproducible, digest-verified and rejects legacy or mixed installations', async (t) => {
  const first = await buildFixture(t);
  const second = await buildFixture(t);
  const firstManifests = await Promise.all(releasedSkills.map((name) => readManifest(path.join(first, 'skills', name))));
  const secondManifests = await Promise.all(releasedSkills.map((name) => readManifest(path.join(second, 'skills', name))));
  const releaseId = firstManifests[0].release_id;
  assert.match(releaseId, /^[0-9a-f]{64}$/);
  assert.ok(firstManifests.every((manifest) => manifest.release_id === releaseId));
  assert.ok(secondManifests.every((manifest) => manifest.release_id === releaseId));
  assert.equal(new Set(firstManifests.map((manifest) => manifest.release_id)).size, 1);

  const full = await inspectInstalledRelease(path.join(first, 'skills'), { expectedSkills: releasedSkills });
  assert.equal(full.status, 'COHERENT_FULL_SUITE');
  assertTuple(full.problems, []);
  assert.equal(full.releaseId, releaseId);

  const expectedMismatch = await inspectInstalledRelease(path.join(first, 'skills'), {
    expectedSkills: releasedSkills,
    expectedReleaseId: '0'.repeat(64),
  });
  assert.ok(expectedMismatch.problems.some((problem) => problem.startsWith('EXPECTED_RELEASE_ID_MISMATCH')));

  const tampered = await temporaryDirectory(t, 'qie-forge-b09-tampered-');
  await cp(path.join(first, 'skills'), tampered, { recursive: true });
  await appendFile(path.join(tampered, 'qie-networks/references/scope.md'), '\nTAMPERED\n');
  const tamperedReport = await inspectInstalledRelease(tampered, { expectedSkills: releasedSkills });
  assert.equal(tamperedReport.status, 'REJECTED');
  assert.ok(tamperedReport.problems.some((problem) => problem.startsWith('HASH_MISMATCH qie-networks/references/scope.md')));
  assert.ok(tamperedReport.problems.some((problem) => problem.startsWith('RELEASE_ID_MISMATCH')));

  const verifierEnv = isolatedEnvironment(await temporaryDirectory(t, 'qie-forge-b09-verifier-'));
  const verifierPass = runNodeResult([verifier, '--root', path.join(first, 'skills'), '--json'], { env: verifierEnv });
  assert.equal(verifierPass.status, 0, verifierPass.stdout + verifierPass.stderr);
  assert.equal(JSON.parse(verifierPass.stdout).status, 'COHERENT_FULL_SUITE');
  const verifierFail = runNodeResult([verifier, '--root', tampered, '--json'], { env: verifierEnv });
  assert.equal(verifierFail.status, 1);
  assert.equal(JSON.parse(verifierFail.stdout).status, 'REJECTED');

  const legacy = await temporaryDirectory(t, 'qie-forge-b09-legacy-');
  await cp(path.join(first, 'skills'), legacy, { recursive: true });
  const legacyManifestPath = path.join(legacy, 'qie/MANIFEST.json');
  const legacyManifest = JSON.parse(await readFile(legacyManifestPath, 'utf8'));
  delete legacyManifest.release_id;
  await writeFile(legacyManifestPath, `${JSON.stringify(legacyManifest, null, 2)}\n`);
  const legacyReport = await inspectInstalledRelease(legacy, { expectedSkills: releasedSkills });
  assert.ok(legacyReport.problems.some((problem) => problem.startsWith('LEGACY_RELEASE_ID qie')));

  await appendAuthoringMarker(second, 'B09 IDENTITY MIXTURE');
  await buildRelease(second);
  const mixed = await temporaryDirectory(t, 'qie-forge-b09-mixed-');
  await cp(path.join(first, 'skills/qie'), path.join(mixed, 'qie'), { recursive: true });
  await cp(path.join(second, 'skills/qie-networks'), path.join(mixed, 'qie-networks'), { recursive: true });
  const mixedReport = await inspectInstalledRelease(mixed, { expectedSkills: ['qie', 'qie-networks'] });
  assert.equal(mixedReport.status, 'REJECTED');
  assert.ok(mixedReport.problems.some((problem) => problem.startsWith('MIXED_RELEASE_ID')));
  assert.notEqual(
    (await readManifest(path.join(second, 'skills/qie'))).release_id,
    releaseId,
  );
});

function assertTuple(actual, expected) {
  assert.deepEqual([...actual], [...expected]);
}

test('Skills CLI installs the suite and a single skill from an immutable Git tag in both modes and survives source removal', async (t) => {
  const project = await buildFixture(t);
  const source = await createGitSource(t);
  const expectedTree = await readBundleTree(path.join(project, 'skills'));
  const expectedNetworks = new Map([...await readBundleTree(path.join(project, 'skills/qie-networks'))]
    .map(([file, content]) => [`qie-networks/${file}`, content]));
  const releaseId = (await readManifest(path.join(project, 'skills/qie'))).release_id;
  await syncSkills(source, project);
  const commit = await commitRelease(source, { tag: 'v0.5.1-b09-a', message: 'B09 fixture release A' });
  assert.match(commit, /^[0-9a-f]{40}$/);
  const server = await serveGitRepository(t, source.root);
  const url = `${server.url}/source.git`;

  const lister = await consumer(t);
  const list = stripAnsi(await runSkillsAsync(['add', `${url}#v0.5.1-b09-a`, '--list'], {
    cwd: lister, env: isolatedEnvironment(lister),
  }));
  const listed = [...list.matchAll(/^│ {4}(qie(?:-[a-z-]+)?)$/gm)].map((match) => match[1]);
  assert.deepEqual(listed.sort(), [...releasedSkills].sort());
  assert.equal(listed.length, 9);

  const failures = [];
  const fixtures = [
    ['suite-symlink', '*', false, expectedTree, releasedSkills, 'v0.5.1-b09-a'],
    ['suite-copy', '*', true, expectedTree, releasedSkills, 'v0.5.1-b09-a'],
    ['single-symlink', 'qie-networks', false, expectedNetworks, ['qie-networks'], 'v0.5.1-b09-a'],
    ['single-copy', 'qie-networks', true, expectedNetworks, ['qie-networks'], 'v0.5.1-b09-a'],
    ['single-sha', 'qie-networks', false, expectedNetworks, ['qie-networks'], commit],
  ];
  const consumers = {};
  for (const [label, selection, copy, expected, skills, ref] of fixtures) {
    const root = await consumer(t);
    consumers[label] = root;
    const log = stripAnsi(await install(root, url, ref, selection, copy));
    if (!log.includes('Installation complete') && !log.includes('Installed 1 skill') && !log.includes('Installed 9 skills')) failures.push(`${label}: ${log}`);
    await assertInstalledTree(root, expected, copy);
    const report = await installedReport(root, skills);
    assertCoherent(report, releaseId);
    assert.equal(report.schemaVersion, '1.4.0');
  }
  assert.deepEqual(failures, []);

  const wrong = await runSkillsResultAsync(['add', `${url}#v0.5.1-b09-missing`, '--list'], {
    cwd: consumers['suite-symlink'], env: isolatedEnvironment(consumers['suite-symlink']),
  });
  assert.notEqual(wrong.status, 0);
  assert.match(stripAnsi(wrong.stdout + wrong.stderr), /Failed to clone|not found|unknown revision|remote branch/i);

  await server.close();
  await rm(source.bare, { recursive: true, force: true });

  for (const label of ['suite-symlink', 'suite-copy']) {
    await assertInstalledTree(consumers[label], expectedTree, label.endsWith('copy'));
    const report = await installedReport(consumers[label], releasedSkills);
    assertCoherent(report, releaseId);
  }
  for (const label of ['single-symlink', 'single-copy', 'single-sha']) {
    const root = consumers[label];
    const report = await installedReport(root, ['qie-networks']);
    assertCoherent(report, releaseId);
    const helper = runNodeResult([path.join(root, '.agents/skills/qie-networks/scripts/inspect-network.mjs'), 'qie-testnet'], {
      cwd: root, env: isolatedEnvironment(root),
    });
    assert.equal(helper.status, 0);
    assert.equal(JSON.parse(helper.stdout).live_check.outcome, 'NOT_RUN');
  }
});

test('skills update follows a mutable ref in both modes, pins immutable tags, and exposes copy-mode conversion', async (t) => {
  const project = await buildFixture(t);
  const source = await createGitSource(t);
  const initialTree = await readBundleTree(path.join(project, 'skills'));
  const initialId = (await readManifest(path.join(project, 'skills/qie'))).release_id;
  await syncSkills(source, project);
  await commitRelease(source, { tag: 'v0.5.1-b09-update-a', message: 'B09 update fixture A' });
  const server = await serveGitRepository(t, source.root);
  const url = `${server.url}/source.git`;

  const symlink = await consumer(t);
  const copy = await consumer(t);
  const pinned = await consumer(t);
  await install(symlink, url, 'main', '*', false);
  await install(copy, url, 'main', '*', true);
  await install(pinned, url, 'v0.5.1-b09-update-a', 'qie-networks', false);
  assertCoherent(await installedReport(symlink, releasedSkills), initialId);
  assertCoherent(await installedReport(copy, releasedSkills), initialId);
  assertCoherent(await installedReport(pinned, ['qie-networks']), initialId);

  const lockBefore = JSON.parse(await readFile(path.join(symlink, 'skills-lock.json'), 'utf8'));
  assert.equal(lockBefore.skills.qie.ref, 'main');
  const hashBefore = lockBefore.skills.qie.computedHash;

  await appendAuthoringMarker(project, 'B09 MUTABLE UPDATE RELEASE B');
  await buildRelease(project);
  const updatedTree = await readBundleTree(path.join(project, 'skills'));
  const updatedId = (await readManifest(path.join(project, 'skills/qie'))).release_id;
  assert.notEqual(updatedId, initialId);
  await syncSkills(source, project);
  await commitRelease(source, { tag: 'v0.5.1-b09-update-b', message: 'B09 update fixture B' });

  for (const [label, root] of [['symlink', symlink], ['copy', copy]]) {
    const result = await update(root, undefined);
    assert.equal(result.status, 0, stripAnsi(result.stdout + result.stderr));
    assert.match(stripAnsi(result.stdout), /Updated/);
    await assertBundleTree(path.join(root, '.agents/skills'), updatedTree, assert);
    const report = await installedReport(root, releasedSkills);
    assertCoherent(report, updatedId);
    // The pinned CLI's update path does not preserve --copy for agent
    // projections: it re-installs with the default symlink mode. The canonical
    // .agents copy remains a real directory, while .claude becomes a symlink.
    for (const name of releasedSkills) {
      assert.equal((await lstat(path.join(root, '.claude/skills', name))).isSymbolicLink(), true, `${label} ${name}`);
    }
    if (label === 'copy') assert.equal((await lstat(path.join(root, '.agents/skills/qie'))).isDirectory(), true);
    const lock = JSON.parse(await readFile(path.join(root, 'skills-lock.json'), 'utf8'));
    assert.equal(lock.skills.qie.ref, 'main');
    assert.notEqual(lock.skills.qie.computedHash, hashBefore);
  }

  const pinnedResult = await update(pinned, 'qie-networks');
  assert.equal(pinnedResult.status, 0);
  assert.match(stripAnsi(pinnedResult.stdout), /up to date/i);
  assertCoherent(await installedReport(pinned, ['qie-networks']), initialId);
});

test('a corrupt update is detected, pinned rollback restores the known-good release, and a removed source leaves the installation intact', async (t) => {
  const project = await buildFixture(t);
  const source = await createGitSource(t);
  const knownGood = await readBundleTree(path.join(project, 'skills/qie-networks'));
  const knownGoodId = (await readManifest(path.join(project, 'skills/qie-networks'))).release_id;
  await syncSkills(source, project);
  await commitRelease(source, { tag: 'v0.5.1-b09-rollback-a', message: 'B09 rollback fixture A' });
  const server = await serveGitRepository(t, source.root);
  const url = `${server.url}/source.git`;

  const symlink = await consumer(t);
  const copy = await consumer(t);
  await install(symlink, url, 'main', 'qie-networks', false);
  await install(copy, url, 'main', 'qie-networks', true);
  assertCoherent(await installedReport(symlink, ['qie-networks']), knownGoodId);
  assertCoherent(await installedReport(copy, ['qie-networks']), knownGoodId);

  await appendAuthoringMarker(project, 'B09 CORRUPT UPDATE B');
  await buildRelease(project);
  await appendFile(path.join(project, 'skills/qie-networks/references/scope.md'), '\nCORRUPTED AFTER MANIFEST GENERATION\n');
  await syncSkills(source, project);
  await commitRelease(source, { tag: 'v0.5.1-b09-rollback-corrupt', message: 'B09 deliberately corrupt update' });

  for (const [label, root, copyMode] of [['symlink', symlink, false], ['copy', copy, true]]) {
    const result = await update(root, 'qie-networks');
    assert.equal(result.status, 0, `${label}: ${stripAnsi(result.stdout + result.stderr)}`);
    assert.match(stripAnsi(result.stdout), /Updated/);
    const corruptReport = await installedReport(root, ['qie-networks']);
    assert.equal(corruptReport.status, 'REJECTED');
    assert.ok(corruptReport.problems.some((problem) => problem.startsWith('HASH_MISMATCH qie-networks/references/scope.md')), label);

    const rollback = await runSkillsAsync(installArgs(url, 'v0.5.1-b09-rollback-a', 'qie-networks', copyMode), {
      cwd: root, env: isolatedEnvironment(root),
    });
    assert.match(stripAnsi(rollback), /Installation complete|Installed 1 skill/);
    await assertBundleTree(path.join(root, '.agents/skills/qie-networks'), knownGood, assert);
    assertCoherent(await installedReport(root, ['qie-networks']), knownGoodId);
    const helper = runNodeResult([path.join(root, '.agents/skills/qie-networks/scripts/inspect-network.mjs'), 'qie-testnet'], {
      cwd: root, env: isolatedEnvironment(root),
    });
    assert.equal(helper.status, 0);
    assert.equal(JSON.parse(helper.stdout).live_check.outcome, 'NOT_RUN');
  }

  await server.close();
  await rm(source.bare, { recursive: true, force: true });
  for (const root of [symlink, copy]) {
    const failed = await update(root, 'qie-networks');
    assert.notEqual(failed.status, 0, 'a removed source must not report a successful update');
    await assertBundleTree(path.join(root, '.agents/skills/qie-networks'), knownGood, assert);
    assertCoherent(await installedReport(root, ['qie-networks']), knownGoodId);
  }
});

test('installed-release verifier diagnoses malformed, incomplete and extra installed content', async (t) => {
  const project = await buildFixture(t);
  const source = path.join(project, 'skills');
  const copyQie = async () => {
    const root = await temporaryDirectory(t, 'qie-forge-b09-verifier-case-');
    await cp(path.join(source, 'qie'), path.join(root, 'qie'), { recursive: true });
    return root;
  };
  const inspect = (root, options) => inspectInstalledRelease(root, options);
  const expectProblem = (report, prefix) => assert.ok(report.problems.some((problem) => problem.startsWith(prefix)),
    `${prefix} not in:\n${report.problems.join('\n')}`);

  const missing = await copyQie();
  await rm(path.join(missing, 'qie/MANIFEST.json'));
  expectProblem(await inspect(missing), 'MISSING_MANIFEST qie');

  const malformed = await copyQie();
  await writeFile(path.join(malformed, 'qie/MANIFEST.json'), '{');
  expectProblem(await inspect(malformed), 'MISSING_MANIFEST qie');

  const arrayManifest = await copyQie();
  await writeFile(path.join(arrayManifest, 'qie/MANIFEST.json'), '[]\n');
  expectProblem(await inspect(arrayManifest), 'INVALID_MANIFEST qie: manifest must be an object');

  const noFiles = await copyQie();
  const noFilesManifest = JSON.parse(await readFile(path.join(noFiles, 'qie/MANIFEST.json'), 'utf8'));
  noFilesManifest.files = [];
  await writeFile(path.join(noFiles, 'qie/MANIFEST.json'), `${JSON.stringify(noFilesManifest, null, 2)}\n`);
  expectProblem(await inspect(noFiles), 'INVALID_MANIFEST qie: files must be a non-empty array');

  const missingSnapshot = await copyQie();
  const missingSnapshotManifest = JSON.parse(await readFile(path.join(missingSnapshot, 'qie/MANIFEST.json'), 'utf8'));
  delete missingSnapshotManifest.snapshot_path;
  await writeFile(path.join(missingSnapshot, 'qie/MANIFEST.json'), `${JSON.stringify(missingSnapshotManifest, null, 2)}\n`);
  expectProblem(await inspect(missingSnapshot), 'INVALID_MANIFEST qie: missing snapshot_path');

  const missingFile = await copyQie();
  await rm(path.join(missingFile, 'qie/SKILL.md'));
  expectProblem(await inspect(missingFile), 'MISSING_FILE qie/SKILL.md');

  const extraFile = await copyQie();
  await writeFile(path.join(extraFile, 'qie/EXTRA.txt'), 'unexpected');
  expectProblem(await inspect(extraFile), 'UNEXPECTED_FILE qie/EXTRA.txt');

  const badEntry = await copyQie();
  const badEntryManifest = JSON.parse(await readFile(path.join(badEntry, 'qie/MANIFEST.json'), 'utf8'));
  badEntryManifest.files[0] = null;
  await writeFile(path.join(badEntry, 'qie/MANIFEST.json'), `${JSON.stringify(badEntryManifest, null, 2)}\n`);
  expectProblem(await inspect(badEntry), 'INVALID_MANIFEST qie: each file entry needs path and sha256');

  const duplicate = await copyQie();
  const duplicateManifest = JSON.parse(await readFile(path.join(duplicate, 'qie/MANIFEST.json'), 'utf8'));
  duplicateManifest.files[1] = duplicateManifest.files[0];
  await writeFile(path.join(duplicate, 'qie/MANIFEST.json'), `${JSON.stringify(duplicateManifest, null, 2)}\n`);
  expectProblem(await inspect(duplicate), 'DUPLICATE_MANIFEST_ENTRY qie');

  const badId = await copyQie();
  const badIdManifest = JSON.parse(await readFile(path.join(badId, 'qie/MANIFEST.json'), 'utf8'));
  badIdManifest.release_id = 'not-a-sha256';
  await writeFile(path.join(badId, 'qie/MANIFEST.json'), `${JSON.stringify(badIdManifest, null, 2)}\n`);
  expectProblem(await inspect(badId), 'INVALID_RELEASE_ID qie');

  const renamed = await temporaryDirectory(t, 'qie-forge-b09-verifier-renamed-');
  await cp(path.join(source, 'qie'), path.join(renamed, 'renamed'), { recursive: true });
  expectProblem(await inspect(renamed), 'SKILL_ID_MISMATCH renamed');

  const missingSnapshotFile = await copyQie();
  const missingSnapshotFileManifest = JSON.parse(await readFile(path.join(missingSnapshotFile, 'qie/MANIFEST.json'), 'utf8'));
  missingSnapshotFileManifest.snapshot_path = 'data/missing.json';
  await writeFile(path.join(missingSnapshotFile, 'qie/MANIFEST.json'), `${JSON.stringify(missingSnapshotFileManifest, null, 2)}\n`);
  expectProblem(await inspect(missingSnapshotFile), 'UNREADABLE_SNAPSHOT qie');

  const changedSnapshot = await copyQie();
  const changedManifestPath = path.join(changedSnapshot, 'qie/MANIFEST.json');
  const changedManifest = JSON.parse(await readFile(changedManifestPath, 'utf8'));
  const changedSnapshotPath = path.join(changedSnapshot, 'qie', changedManifest.snapshot_path);
  const changedBytes = JSON.parse(await readFile(changedSnapshotPath, 'utf8'));
  changedBytes.policy.require_explicit_expiry_for_verified = false;
  await writeFile(changedSnapshotPath, `${JSON.stringify(changedBytes, null, 2)}\n`);
  expectProblem(await inspect(changedSnapshot), 'KNOWLEDGE_HASH_MISMATCH qie');

  const policyChanged = await copyQie();
  const policyManifestPath = path.join(policyChanged, 'qie/MANIFEST.json');
  const policyManifest = JSON.parse(await readFile(policyManifestPath, 'utf8'));
  const policySnapshotPath = path.join(policyChanged, 'qie', policyManifest.snapshot_path);
  const policyChangedBytes = JSON.parse(await readFile(policySnapshotPath, 'utf8'));
  policyChangedBytes.policy.require_explicit_expiry_for_verified = false;
  await writeFile(policySnapshotPath, `${JSON.stringify(policyChangedBytes, null, 2)}\n`);
  const policyDigest = sha256(await readFile(policySnapshotPath));
  policyManifest.knowledge_sha256 = policyDigest;
  policyManifest.files.find((file) => file.path === policyManifest.snapshot_path).sha256 = policyDigest;
  await writeFile(policyManifestPath, `${JSON.stringify(policyManifest, null, 2)}\n`);
  expectProblem(await inspect(policyChanged), 'POLICY_HASH_MISMATCH qie');

  const wrongSchema = await copyQie();
  const wrongManifestPath = path.join(wrongSchema, 'qie/MANIFEST.json');
  const wrongManifest = JSON.parse(await readFile(wrongManifestPath, 'utf8'));
  const wrongSchemaPath = path.join(wrongSchema, 'qie', wrongManifest.snapshot_path);
  const wrong = JSON.parse(await readFile(wrongSchemaPath, 'utf8'));
  wrong.schema_version = '9.9.9';
  await writeFile(wrongSchemaPath, `${JSON.stringify(wrong, null, 2)}\n`);
  const wrongDigest = sha256(await readFile(wrongSchemaPath));
  wrongManifest.knowledge_sha256 = wrongDigest;
  wrongManifest.files.find((file) => file.path === wrongManifest.snapshot_path).sha256 = wrongDigest;
  await writeFile(wrongManifestPath, `${JSON.stringify(wrongManifest, null, 2)}\n`);
  expectProblem(await inspect(wrongSchema), 'SNAPSHOT_SCHEMA_MISMATCH qie');

  const symlinked = await copyQie();
  await symlink(path.join(symlinked, 'qie/SKILL.md'), path.join(symlinked, 'qie/link.md'));
  expectProblem(await inspect(symlinked), 'UNREADABLE_BUNDLE qie');

  const missingRoot = path.join(await temporaryDirectory(t, 'qie-forge-b09-verifier-root-'), 'absent');
  const missingRootReport = await inspect(missingRoot);
  assert.equal(missingRootReport.status, 'ERROR');
  expectProblem(missingRootReport, 'UNREADABLE_ROOT');

  const empty = await temporaryDirectory(t, 'qie-forge-b09-verifier-empty-');
  expectProblem(await inspect(empty), 'NO_SKILLS');

  const partial = await copyQie();
  expectProblem(await inspect(partial, { requireSuite: true }), 'INCOMPLETE_SUITE');

  const env = isolatedEnvironment(await temporaryDirectory(t, 'qie-forge-b09-verifier-cli-'));
  const help = runNodeResult([verifier, '--help'], { env });
  assert.equal(help.status, 0);
  assert.match(help.stdout, /Usage: node scripts\/verify-installed-release\.mjs/);
  const unknown = runNodeResult([verifier, '--not-an-option'], { env });
  assert.equal(unknown.status, 2);
  const emptyRelease = runNodeResult([verifier, '--release-id', ''], { env });
  assert.equal(emptyRelease.status, 2);
  const human = runNodeResult([verifier, '--root', source], { env });
  assert.equal(human.status, 0, human.stdout + human.stderr);
  assert.match(human.stdout, /Status: COHERENT_FULL_SUITE/);
  assert.match(human.stdout, /Installed skills: 9/);
  const incomplete = runNodeResult([verifier, '--root', partial, '--expect-suite'], { env });
  assert.equal(incomplete.status, 1);
  assert.match(incomplete.stdout, /INCOMPLETE_SUITE/);
  const wrongRelease = runNodeResult([verifier, '--root', source, '--release-id', '0'.repeat(64)], { env });
  assert.equal(wrongRelease.status, 1);
  assert.match(wrongRelease.stdout, /EXPECTED_RELEASE_ID_MISMATCH/);

  const inventory = await readBundleInventory(path.join(source, 'qie'));
  const recomputed = computeReleaseId({ release: JSON.parse(await readFile(path.join(project, 'release-context.json'), 'utf8')), bundles: [inventory] });
  assert.match(recomputed, /^[0-9a-f]{64}$/);
  assert.throws(() => releaseIdentityInput({ release: null, bundles: [] }), /Release context is required/);
});

test('skills update is a silent no-op for local-directory sources even when the source changes', async (t) => {
  const project = await buildFixture(t);
  const before = await readBundleTree(path.join(project, 'skills/qie-networks'));
  const releaseId = (await readManifest(path.join(project, 'skills/qie-networks'))).release_id;
  const root = await consumer(t);
  await runSkillsAsync(['add', path.join(project, 'skills'), '--skill', 'qie-networks', '-a', 'codex', '-a', 'claude-code', '-y'], {
    cwd: root, env: isolatedEnvironment(root),
  });
  const installed = path.join(root, '.agents/skills/qie-networks');
  await assertBundleTree(installed, before, assert);
  assertCoherent(await installedReport(root, ['qie-networks']), releaseId);
  const hashBefore = JSON.parse(await readFile(path.join(root, 'skills-lock.json'), 'utf8')).skills['qie-networks'].computedHash;

  await appendAuthoringMarker(project, 'LOCAL SOURCE CHANGED');
  await buildRelease(project);
  const afterId = (await readManifest(path.join(project, 'skills/qie-networks'))).release_id;
  assert.notEqual(afterId, releaseId);

  const result = await update(root, 'qie-networks');
  assert.equal(result.status, 0);
  assert.match(stripAnsi(result.stdout), /No installed skills found matching: qie-networks/);
  await assertBundleTree(installed, before, assert);
  assertCoherent(await installedReport(root, ['qie-networks']), releaseId);
  const lock = JSON.parse(await readFile(path.join(root, 'skills-lock.json'), 'utf8'));
  assert.equal(lock.skills['qie-networks'].sourceType, 'local');
  assert.equal(lock.skills['qie-networks'].computedHash, hashBefore);
});

test('mixed release identities and incompatible schemas are reported and can be repaired from a pinned release', async (t) => {
  const project = await buildFixture(t);
  const source = await createGitSource(t);
  const baselineTree = await readBundleTree(path.join(project, 'skills'));
  const baselineId = (await readManifest(path.join(project, 'skills/qie'))).release_id;
  await syncSkills(source, project);
  await commitRelease(source, { tag: 'v0.5.1-b09-mixed-a', message: 'B09 mixed fixture A' });
  const server = await serveGitRepository(t, source.root);
  const url = `${server.url}/source.git`;

  await setSchemaVersion(project, '1.5.0');
  await appendAuthoringMarker(project, 'B09 INCOMPATIBLE SCHEMA B');
  await buildRelease(project);
  const incompatibleId = (await readManifest(path.join(project, 'skills/qie'))).release_id;
  assert.notEqual(incompatibleId, baselineId);
  await syncSkills(source, project);
  await commitRelease(source, { tag: 'v0.5.1-b09-mixed-b', message: 'B09 incompatible schema fixture B' });

  const root = await consumer(t);
  await install(root, url, 'v0.5.1-b09-mixed-a', 'qie', false);
  await install(root, url, 'v0.5.1-b09-mixed-b', 'qie-networks', false);
  const mixed = await installedReport(root, ['qie', 'qie-networks']);
  assert.equal(mixed.status, 'REJECTED');
  assert.ok(mixed.problems.some((problem) => problem.startsWith('MIXED_RELEASE_ID')));
  assert.ok(mixed.problems.some((problem) => problem.startsWith('MIXED_SCHEMA_VERSION')));
  assert.ok(mixed.problems.some((problem) => problem.startsWith('MIXED_RELEASE_VERSION')) === false);
  const cliResult = runNodeResult([verifier, '--root', path.join(root, '.agents/skills'), '--json'], {
    env: isolatedEnvironment(root),
  });
  assert.equal(cliResult.status, 1);
  assert.equal(JSON.parse(cliResult.stdout).status, 'REJECTED');

  await install(root, url, 'v0.5.1-b09-mixed-a', 'qie', false);
  await install(root, url, 'v0.5.1-b09-mixed-a', 'qie-networks', false);
  assertCoherent(await installedReport(root, ['qie', 'qie-networks']), baselineId);
  await assertBundleTree(path.join(root, '.agents/skills/qie'), new Map([...baselineTree].filter(([file]) => file.startsWith('qie/')).map(([file, content]) => [file.slice('qie/'.length), content])), assert);
});
