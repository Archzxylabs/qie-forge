import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { appendFile, chmod, cp, lstat, mkdir, readFile, rename, rm, symlink, writeFile } from 'node:fs/promises';
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
  assert.ok(report.projections.every((projection) => projection.valid), JSON.stringify(report.projections, null, 2));
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
  expectProblem(await inspect(malformed), 'INVALID_MANIFEST qie: manifest is not valid JSON');

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

  const unlistedSkill = await copyQie();
  const unlistedSkillManifestPath = path.join(unlistedSkill, 'qie/MANIFEST.json');
  const unlistedSkillManifest = JSON.parse(await readFile(unlistedSkillManifestPath, 'utf8'));
  unlistedSkillManifest.files = unlistedSkillManifest.files.filter((file) => file.path !== 'SKILL.md');
  await rm(path.join(unlistedSkill, 'qie/SKILL.md'));
  await writeFile(unlistedSkillManifestPath, `${JSON.stringify(unlistedSkillManifest, null, 2)}\n`);
  expectProblem(await inspect(unlistedSkill), 'MISSING_SKILL_FILE qie');

  const extraFile = await copyQie();
  await writeFile(path.join(extraFile, 'qie/EXTRA.txt'), 'unexpected');
  expectProblem(await inspect(extraFile), 'UNEXPECTED_FILE qie/EXTRA.txt');

  const badEntry = await copyQie();
  const badEntryManifest = JSON.parse(await readFile(path.join(badEntry, 'qie/MANIFEST.json'), 'utf8'));
  badEntryManifest.files[0] = null;
  await writeFile(path.join(badEntry, 'qie/MANIFEST.json'), `${JSON.stringify(badEntryManifest, null, 2)}\n`);
  expectProblem(await inspect(badEntry), 'INVALID_MANIFEST qie');

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
  expectProblem(await inspect(renamed), 'NO_QIE_SKILLS');

  const wrongSkillId = await copyQie();
  const wrongSkillIdManifest = JSON.parse(await readFile(path.join(wrongSkillId, 'qie/MANIFEST.json'), 'utf8'));
  wrongSkillIdManifest.skill_id = 'not-qie';
  await writeFile(path.join(wrongSkillId, 'qie/MANIFEST.json'), `${JSON.stringify(wrongSkillIdManifest, null, 2)}\n`);
  expectProblem(await inspect(wrongSkillId), 'SKILL_ID_MISMATCH qie');

  const missingSnapshotFile = await copyQie();
  const missingSnapshotFileManifest = JSON.parse(await readFile(path.join(missingSnapshotFile, 'qie/MANIFEST.json'), 'utf8'));
  await rm(path.join(missingSnapshotFile, 'qie', missingSnapshotFileManifest.snapshot_path));
  expectProblem(await inspect(missingSnapshotFile), 'SNAPSHOT_NOT_IN_BUNDLE qie');

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

  const notGenerated = await copyQie();
  const notGeneratedManifest = JSON.parse(await readFile(path.join(notGenerated, 'qie/MANIFEST.json'), 'utf8'));
  notGeneratedManifest.generated = false;
  await writeFile(path.join(notGenerated, 'qie/MANIFEST.json'), `${JSON.stringify(notGeneratedManifest, null, 2)}\n`);
  expectProblem(await inspect(notGenerated), 'MANIFEST_NOT_GENERATED qie');

  const futureReview = await copyQie();
  const futureReviewManifest = JSON.parse(await readFile(path.join(futureReview, 'qie/MANIFEST.json'), 'utf8'));
  futureReviewManifest.sources_checked_at = '2099-01-01T00:00:00Z';
  await writeFile(path.join(futureReview, 'qie/MANIFEST.json'), `${JSON.stringify(futureReviewManifest, null, 2)}\n`);
  expectProblem(await inspect(futureReview), 'FUTURE_SOURCES_CHECKED_AT qie');

  const unsupportedSchema = await copyQie();
  const unsupportedSchemaManifest = JSON.parse(await readFile(path.join(unsupportedSchema, 'qie/MANIFEST.json'), 'utf8'));
  unsupportedSchemaManifest.schema_version = '1.5.0';
  await writeFile(path.join(unsupportedSchema, 'qie/MANIFEST.json'), `${JSON.stringify(unsupportedSchemaManifest, null, 2)}\n`);
  expectProblem(await inspect(unsupportedSchema), 'UNSUPPORTED_SCHEMA_VERSION qie');

  const snapshotNotListed = await copyQie();
  const snapshotNotListedManifest = JSON.parse(await readFile(path.join(snapshotNotListed, 'qie/MANIFEST.json'), 'utf8'));
  snapshotNotListedManifest.files = snapshotNotListedManifest.files
    .filter((file) => file.path !== snapshotNotListedManifest.snapshot_path);
  await writeFile(path.join(snapshotNotListed, 'qie/MANIFEST.json'), `${JSON.stringify(snapshotNotListedManifest, null, 2)}\n`);
  expectProblem(await inspect(snapshotNotListed), 'SNAPSHOT_NOT_IN_MANIFEST qie');

  const symlinked = await copyQie();
  await symlink(path.join(symlinked, 'qie/SKILL.md'), path.join(symlinked, 'qie/link.md'));
  expectProblem(await inspect(symlinked), 'UNREADABLE_BUNDLE qie');

  const missingRoot = path.join(await temporaryDirectory(t, 'qie-forge-b09-verifier-root-'), 'absent');
  const missingRootReport = await inspect(missingRoot);
  assert.equal(missingRootReport.status, 'ERROR');
  expectProblem(missingRootReport, 'UNREADABLE_ROOT');

  const empty = await temporaryDirectory(t, 'qie-forge-b09-verifier-empty-');
  expectProblem(await inspect(empty), 'NO_QIE_SKILLS');

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
  const invalidRelease = runNodeResult([verifier, '--release-id', 'NOT-A-SHA'], { env });
  assert.equal(invalidRelease.status, 2);
  const emptyClaude = runNodeResult([verifier, '--claude-root', ''], { env });
  assert.equal(emptyClaude.status, 2);
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

test('snapshot paths are contained, bounded and never leak outside file content through verifier errors', async (t) => {
  const project = await buildFixture(t);
  const source = path.join(project, 'skills');
  const sentinel = 'OUTSIDE-BUNDLE-SENTINEL-DO-NOT-READ';
  const copyQie = async () => {
    const root = await temporaryDirectory(t, 'qie-forge-b09-containment-');
    await cp(path.join(source, 'qie'), path.join(root, 'qie'), { recursive: true });
    return root;
  };
  const manifestAt = async (root) => {
    const filename = path.join(root, 'qie/MANIFEST.json');
    return { filename, manifest: JSON.parse(await readFile(filename, 'utf8')) };
  };
  const writeManifest = async (filename, manifest) => {
    await writeFile(filename, `${JSON.stringify(manifest, null, 2)}\n`);
  };

  const traversal = await copyQie();
  await writeFile(path.join(traversal, 'OUTSIDE.json'), `${sentinel}\n{`);
  {
    const { filename, manifest } = await manifestAt(traversal);
    manifest.snapshot_path = '../OUTSIDE.json';
    await writeManifest(filename, manifest);
  }
  const traversalReport = await inspectInstalledRelease(traversal);
  assert.match(traversalReport.problems.join('\n'), /INVALID_MANIFEST qie/);
  assert.doesNotMatch(traversalReport.problems.join('\n'), new RegExp(sentinel));

  const absolute = await copyQie();
  const absoluteSentinel = path.join(absolute, 'ABS-OUTSIDE.json');
  await writeFile(absoluteSentinel, `${sentinel}\n{`);
  {
    const { filename, manifest } = await manifestAt(absolute);
    manifest.snapshot_path = absoluteSentinel;
    await writeManifest(filename, manifest);
  }
  const absoluteReport = await inspectInstalledRelease(absolute);
  assert.match(absoluteReport.problems.join('\n'), /INVALID_MANIFEST qie/);
  assert.doesNotMatch(absoluteReport.problems.join('\n'), new RegExp(sentinel));

  const manifestTraversal = await copyQie();
  await writeFile(path.join(manifestTraversal, 'OUTSIDE.json'), `${sentinel}\n`);
  {
    const { filename, manifest } = await manifestAt(manifestTraversal);
    manifest.files[0].path = '../OUTSIDE.json';
    manifest.files[0].sha256 = sha256(`${sentinel}\n`);
    await writeManifest(filename, manifest);
  }
  const manifestTraversalReport = await inspectInstalledRelease(manifestTraversal);
  assert.match(manifestTraversalReport.problems.join('\n'), /INVALID_MANIFEST qie/);
  assert.doesNotMatch(manifestTraversalReport.problems.join('\n'), new RegExp(sentinel));

  const symlinkEscape = await copyQie();
  const symlinkTarget = path.join(symlinkEscape, 'OUTSIDE.json');
  await writeFile(symlinkTarget, `${sentinel}\n`);
  await symlink(symlinkTarget, path.join(symlinkEscape, 'qie/escape.json'));
  const symlinkReport = await inspectInstalledRelease(symlinkEscape);
  assert.match(symlinkReport.problems.join('\n'), /UNREADABLE_BUNDLE qie/);
  assert.doesNotMatch(symlinkReport.problems.join('\n'), new RegExp(sentinel));

  const manifestSymlink = await copyQie();
  const manifestTarget = path.join(manifestSymlink, 'OUTSIDE-MANIFEST.json');
  await writeFile(manifestTarget, `${sentinel}\n`);
  await rm(path.join(manifestSymlink, 'qie/MANIFEST.json'));
  await symlink(manifestTarget, path.join(manifestSymlink, 'qie/MANIFEST.json'));
  const manifestSymlinkReport = await inspectInstalledRelease(manifestSymlink);
  assert.match(manifestSymlinkReport.problems.join('\n'), /UNSAFE_MANIFEST_SYMLINK qie/);
  assert.doesNotMatch(manifestSymlinkReport.problems.join('\n'), new RegExp(sentinel));

  const unreadable = await copyQie();
  {
    const { manifest } = await manifestAt(unreadable);
    const snapshot = path.join(unreadable, 'qie', manifest.snapshot_path);
    await chmod(snapshot, 0o000);
    const report = await inspectInstalledRelease(unreadable);
    assert.match(report.problems.join('\n'), /UNREADABLE_(FILE|SNAPSHOT) qie/);
    assert.doesNotMatch(report.problems.join('\n'), new RegExp(sentinel));
    await chmod(snapshot, 0o600);
  }

  const oversized = await copyQie();
  {
    const { manifest } = await manifestAt(oversized);
    await writeFile(path.join(oversized, 'qie', manifest.snapshot_path), Buffer.alloc(2 * 1024 * 1024 + 1, 0x41));
    const report = await inspectInstalledRelease(oversized);
    assert.match(report.problems.join('\n'), /OVERSIZED_SNAPSHOT qie/);
    assert.doesNotMatch(report.problems.join('\n'), new RegExp(sentinel));
  }

  const invalidJson = await copyQie();
  {
    const { filename, manifest } = await manifestAt(invalidJson);
    const snapshot = path.join(invalidJson, 'qie', manifest.snapshot_path);
    const content = `${sentinel}\n{`;
    await writeFile(snapshot, content);
    manifest.knowledge_sha256 = sha256(content);
    manifest.files.find((file) => file.path === manifest.snapshot_path).sha256 = sha256(content);
    await writeManifest(filename, manifest);
    const report = await inspectInstalledRelease(invalidJson);
    assert.match(report.problems.join('\n'), /UNREADABLE_SNAPSHOT qie/);
    assert.doesNotMatch(report.problems.join('\n'), new RegExp(sentinel));
  }
});

test('full-suite verification uses the exact canonical inventory, checks frontmatter and distinguishes trusted identity', async (t) => {
  const project = await buildFixture(t);
  const source = path.join(project, 'skills');
  const originalId = (await readManifest(path.join(source, 'qie'))).release_id;
  const release = JSON.parse(await readFile(path.join(project, 'release-context.json'), 'utf8'));
  const copySuite = async () => {
    const root = await temporaryDirectory(t, 'qie-forge-b09-suite-');
    await cp(source, root, { recursive: true });
    return root;
  };
  const recompute = async (root, names) => {
    const bundles = [];
    for (const name of names) bundles.push(await readBundleInventory(path.join(root, name), name));
    const id = computeReleaseId({ release, bundles });
    for (const name of names) {
      const filename = path.join(root, name, 'MANIFEST.json');
      const manifest = JSON.parse(await readFile(filename, 'utf8'));
      manifest.release_id = id;
      await writeFile(filename, `${JSON.stringify(manifest, null, 2)}\n`);
    }
    return id;
  };

  const full = await copySuite();
  const fullReport = await inspectInstalledRelease(full, { requireSuite: true });
  assert.equal(fullReport.status, 'COHERENT_FULL_SUITE');
  assert.deepEqual(fullReport.problems, []);
  assert.equal(fullReport.publisherAuthenticity, 'NOT_ESTABLISHED');

  const missingRouter = await copySuite();
  await rm(path.join(missingRouter, 'qie'), { recursive: true });
  const missingReport = await inspectInstalledRelease(missingRouter, { requireSuite: true });
  assert.equal(missingReport.status, 'REJECTED');
  assert.ok(missingReport.problems.some((problem) => problem.startsWith('MISSING_SKILLS: qie')));
  assert.ok(missingReport.problems.some((problem) => problem.startsWith('INCOMPLETE_SUITE')));

  const fake = await copySuite();
  await rename(path.join(fake, 'qie'), path.join(fake, 'qie-fake'));
  {
    const filename = path.join(fake, 'qie-fake/MANIFEST.json');
    const manifest = JSON.parse(await readFile(filename, 'utf8'));
    manifest.skill_id = 'qie-fake';
    await writeFile(filename, `${JSON.stringify(manifest, null, 2)}\n`);
  }
  await recompute(fake, [...releasedSkills.filter((name) => name !== 'qie'), 'qie-fake']);
  const fakeReport = await inspectInstalledRelease(fake, { requireSuite: true });
  assert.notEqual(fakeReport.status, 'COHERENT_FULL_SUITE');
  assert.ok(fakeReport.problems.some((problem) => problem.startsWith('MISSING_SKILLS: qie')));
  assert.ok(fakeReport.ignored.includes('qie-fake'));
  const fakeCli = runNodeResult([verifier, '--root', fake, '--expect-suite', '--json']);
  assert.equal(fakeCli.status, 1, fakeCli.stdout + fakeCli.stderr);
  assert.ok(JSON.parse(fakeCli.stdout).problems.some((problem) => problem.startsWith('MISSING_SKILLS: qie')));

  const badFrontmatter = await copySuite();
  {
    const filename = path.join(badFrontmatter, 'qie/SKILL.md');
    const content = (await readFile(filename, 'utf8')).replace(/^name: qie$/m, 'name: not-qie');
    await writeFile(filename, content);
    const manifestFilename = path.join(badFrontmatter, 'qie/MANIFEST.json');
    const manifest = JSON.parse(await readFile(manifestFilename, 'utf8'));
    manifest.files.find((file) => file.path === 'SKILL.md').sha256 = sha256(content);
    await writeFile(manifestFilename, `${JSON.stringify(manifest, null, 2)}\n`);
  }
  const badFrontmatterReport = await inspectInstalledRelease(badFrontmatter);
  assert.equal(badFrontmatterReport.status, 'REJECTED');
  assert.ok(badFrontmatterReport.problems.some((problem) => problem.startsWith('INVALID_SKILL_FRONTMATTER qie')));

  const selfConsistent = await copySuite();
  {
    const filename = path.join(selfConsistent, 'qie-networks/references/scope.md');
    await appendFile(filename, '\nSELF-CONSISTENT BUT UNTRUSTED\n');
    const manifestFilename = path.join(selfConsistent, 'qie-networks/MANIFEST.json');
    const manifest = JSON.parse(await readFile(manifestFilename, 'utf8'));
    manifest.files.find((file) => file.path === 'references/scope.md').sha256 = sha256(await readFile(filename));
    await writeFile(manifestFilename, `${JSON.stringify(manifest, null, 2)}\n`);
  }
  const fakeId = await recompute(selfConsistent, releasedSkills);
  assert.notEqual(fakeId, originalId);
  const selfConsistentReport = await inspectInstalledRelease(selfConsistent);
  assert.equal(selfConsistentReport.status, 'COHERENT_FULL_SUITE');
  assert.equal(selfConsistentReport.publisherAuthenticity, 'NOT_ESTABLISHED');
  assert.equal(selfConsistentReport.identitySource, 'recomputed');
  const pinnedWrong = await inspectInstalledRelease(selfConsistent, { expectedReleaseId: originalId });
  assert.ok(pinnedWrong.problems.some((problem) => problem.startsWith('EXPECTED_RELEASE_ID_MISMATCH')));
  assert.equal(pinnedWrong.publisherAuthenticity, 'MISMATCH');
  assert.equal(pinnedWrong.suiteComplete, false);
  assert.equal(pinnedWrong.inventoryComplete, true);
  const pinnedRight = await inspectInstalledRelease(selfConsistent, { expectedReleaseId: fakeId });
  assert.deepEqual(pinnedRight.problems, []);
  assert.equal(pinnedRight.publisherAuthenticity, 'PINNED_MATCH');
});

test('rejected reports never claim suite completion and manifest provenance is checked against snapshot sources', async (t) => {
  const project = await buildFixture(t);
  const source = path.join(project, 'skills');
  const originalId = (await readManifest(path.join(source, 'qie'))).release_id;
  const copySuite = async () => {
    const root = await temporaryDirectory(t, 'qie-forge-b09-reporting-');
    await cp(source, root, { recursive: true });
    return root;
  };

  const full = await copySuite();
  const fullReport = await inspectInstalledRelease(full, { requireSuite: true, expectedReleaseId: originalId });
  assert.deepEqual(fullReport.problems, []);
  assert.equal(fullReport.status, 'COHERENT_FULL_SUITE');
  assert.equal(fullReport.inventoryComplete, true);
  assert.equal(fullReport.payloadIntegrity, 'VERIFIED');
  assert.equal(fullReport.releaseCoherence, 'COHERENT');
  assert.equal(fullReport.provenance.validation, 'MATCH');
  assert.equal(fullReport.provenance.manifestMetadataAuthenticated, false);
  assert.equal(fullReport.verificationComplete, true);
  assert.equal(fullReport.suiteComplete, true);
  assert.equal(fullReport.authenticityScope, 'PAYLOAD_IDENTITY_ONLY');

  const wrongPin = await inspectInstalledRelease(full, { requireSuite: true, expectedReleaseId: '0'.repeat(64) });
  assert.equal(wrongPin.status, 'REJECTED');
  assert.equal(wrongPin.inventoryComplete, true);
  assert.equal(wrongPin.payloadIntegrity, 'VERIFIED');
  assert.equal(wrongPin.releaseCoherence, 'COHERENT');
  assert.equal(wrongPin.publisherAuthenticity, 'MISMATCH');
  assert.equal(wrongPin.verificationComplete, false);
  assert.equal(wrongPin.suiteComplete, false);

  const invalidSchema = await copySuite();
  {
    const filename = path.join(invalidSchema, 'qie/MANIFEST.json');
    const manifest = JSON.parse(await readFile(filename, 'utf8'));
    manifest.schema_version = '9.9.9';
    await writeFile(filename, `${JSON.stringify(manifest, null, 2)}\n`);
  }
  const invalidSchemaReport = await inspectInstalledRelease(invalidSchema, { requireSuite: true });
  assert.equal(invalidSchemaReport.status, 'REJECTED');
  // The nine bundles and their file inventories are structurally complete even
  // though the unsupported schema makes the release incoherent.
  assert.equal(invalidSchemaReport.inventoryComplete, true);
  assert.equal(invalidSchemaReport.payloadIntegrity, 'VERIFIED');
  assert.equal(invalidSchemaReport.releaseCoherence, 'INCOHERENT');
  assert.equal(invalidSchemaReport.verificationComplete, false);
  assert.equal(invalidSchemaReport.suiteComplete, false);

  const other = await buildFixture(t);
  await appendAuthoringMarker(other, 'B09 P2 MIXED IDENTITY');
  await buildRelease(other);
  const mixed = await copySuite();
  await rm(path.join(mixed, 'qie-networks'), { recursive: true, force: true });
  await cp(path.join(other, 'skills/qie-networks'), path.join(mixed, 'qie-networks'), { recursive: true });
  const mixedReport = await inspectInstalledRelease(mixed, { requireSuite: true });
  assert.equal(mixedReport.status, 'REJECTED');
  assert.ok(mixedReport.problems.some((problem) => problem.startsWith('MIXED_RELEASE_ID')));
  assert.equal(mixedReport.inventoryComplete, true);
  assert.equal(mixedReport.payloadIntegrity, 'VERIFIED');
  assert.equal(mixedReport.releaseCoherence, 'INCOHERENT');
  assert.equal(mixedReport.verificationComplete, false);
  assert.equal(mixedReport.suiteComplete, false);

  const projectionCase = await temporaryDirectory(t, 'qie-forge-b09-reporting-projection-');
  const canonical = path.join(projectionCase, '.agents', 'skills');
  const claude = path.join(projectionCase, '.claude', 'skills');
  await mkdir(canonical, { recursive: true });
  await mkdir(claude, { recursive: true });
  await cp(source, canonical, { recursive: true });
  for (const name of releasedSkills) {
    await symlink(path.join('../../.agents/skills', name), path.join(claude, name));
  }
  await rm(path.join(claude, 'qie'));
  await symlink('../../missing/qie', path.join(claude, 'qie'));
  const projectionReport = await inspectInstalledRelease(canonical, { requireSuite: true });
  assert.equal(projectionReport.status, 'REJECTED');
  assert.ok(projectionReport.problems.some((problem) => problem.startsWith('BROKEN_CLAUDE_PROJECTION qie')));
  assert.equal(projectionReport.inventoryComplete, true);
  assert.equal(projectionReport.payloadIntegrity, 'VERIFIED');
  assert.equal(projectionReport.releaseCoherence, 'INCOHERENT');
  assert.equal(projectionReport.verificationComplete, false);
  assert.equal(projectionReport.suiteComplete, false);

  const provenanceMutated = await copySuite();
  const provenanceManifestPath = path.join(provenanceMutated, 'qie/MANIFEST.json');
  const provenanceManifest = JSON.parse(await readFile(provenanceManifestPath, 'utf8'));
  assert.notEqual(provenanceManifest.sources_checked_at, provenanceManifest.built_at);
  provenanceManifest.sources_checked_at = provenanceManifest.built_at;
  await writeFile(provenanceManifestPath, `${JSON.stringify(provenanceManifest, null, 2)}\n`);
  const provenanceReport = await inspectInstalledRelease(provenanceMutated, {
    requireSuite: true,
    expectedReleaseId: originalId,
  });
  assert.equal(provenanceReport.status, 'REJECTED');
  assert.ok(provenanceReport.problems.some((problem) => problem.startsWith('SOURCES_CHECKED_AT_MISMATCH qie')));
  assert.equal(provenanceReport.inventoryComplete, true);
  assert.equal(provenanceReport.payloadIntegrity, 'VERIFIED');
  assert.equal(provenanceReport.releaseCoherence, 'INCOHERENT');
  assert.equal(provenanceReport.publisherAuthenticity, 'PINNED_MATCH');
  assert.equal(provenanceReport.authenticityScope, 'PAYLOAD_IDENTITY_ONLY');
  assert.equal(provenanceReport.provenance.manifestMetadataAuthenticated, false);
  assert.equal(provenanceReport.provenance.validation, 'MISMATCH');
  assert.equal(provenanceReport.verificationComplete, false);
  assert.equal(provenanceReport.suiteComplete, false);

  const provenanceNull = await copySuite();
  {
    const filename = path.join(provenanceNull, 'qie/MANIFEST.json');
    const manifest = JSON.parse(await readFile(filename, 'utf8'));
    manifest.sources_checked_at = null;
    await writeFile(filename, `${JSON.stringify(manifest, null, 2)}\n`);
  }
  const nullReport = await inspectInstalledRelease(provenanceNull, { requireSuite: true });
  assert.ok(nullReport.problems.some((problem) => problem.startsWith('SOURCES_CHECKED_AT_MISMATCH qie')));
  assert.equal(nullReport.suiteComplete, false);
});

test('verification coexists with unrelated skills and validates Claude Code symlink and copy projections', async (t) => {
  const project = await buildFixture(t);
  const source = path.join(project, 'skills');
  const validProjection = async () => {
    const root = await temporaryDirectory(t, 'qie-forge-b09-projection-');
    const canonical = path.join(root, '.agents', 'skills');
    const claude = path.join(root, '.claude', 'skills');
    await mkdir(canonical, { recursive: true });
    await mkdir(claude, { recursive: true });
    await cp(source, canonical, { recursive: true });
    await mkdir(path.join(canonical, 'other-skill'), { recursive: true });
    await writeFile(path.join(canonical, 'other-skill/SKILL.md'), '---\nname: other-skill\ndescription: unrelated skill\n---\n');
    for (const name of releasedSkills) {
      await symlink(path.join('../../.agents/skills', name), path.join(claude, name));
    }
    await mkdir(path.join(claude, 'other-skill'), { recursive: true });
    await writeFile(path.join(claude, 'other-skill/SKILL.md'), '---\nname: other-skill\ndescription: unrelated skill\n---\n');
    return { root, canonical, claude };
  };

  const symlinkCase = await validProjection();
  const symlinkReport = await inspectInstalledRelease(symlinkCase.canonical);
  assert.equal(symlinkReport.status, 'COHERENT_FULL_SUITE');
  assert.deepEqual(symlinkReport.problems, []);
  assert.equal(symlinkReport.projections.length, 9);
  assert.ok(symlinkReport.projections.every((projection) => projection.valid));
  assert.ok(symlinkReport.ignored.includes('other-skill'));
  const cli = runNodeResult([verifier, '--root', symlinkCase.canonical, '--json'], {
    env: isolatedEnvironment(symlinkCase.root),
  });
  assert.equal(cli.status, 0, cli.stdout + cli.stderr);
  assert.equal(JSON.parse(cli.stdout).status, 'COHERENT_FULL_SUITE');
  const explicitCli = runNodeResult([verifier, '--root', symlinkCase.canonical,
    '--claude-root', symlinkCase.claude, '--json'], { env: isolatedEnvironment(symlinkCase.root) });
  assert.equal(explicitCli.status, 0, explicitCli.stdout + explicitCli.stderr);
  assert.equal(JSON.parse(explicitCli.stdout).projections.length, 9);

  const codexOnly = await temporaryDirectory(t, 'qie-forge-b09-codex-only-');
  const codexCanonical = path.join(codexOnly, '.agents', 'skills');
  const codexClaude = path.join(codexOnly, '.claude', 'skills');
  await mkdir(codexCanonical, { recursive: true });
  await mkdir(codexClaude, { recursive: true });
  await cp(source, codexCanonical, { recursive: true });
  await mkdir(path.join(codexClaude, 'other-skill'), { recursive: true });
  await writeFile(path.join(codexClaude, 'other-skill/SKILL.md'), '---\nname: other-skill\ndescription: unrelated skill\n---\n');
  const codexOnlyReport = await inspectInstalledRelease(codexCanonical);
  assert.equal(codexOnlyReport.status, 'COHERENT_FULL_SUITE');
  assert.deepEqual(codexOnlyReport.problems, []);
  assert.equal(codexOnlyReport.projections.length, 0);

  const copyCase = await validProjection();
  await rm(copyCase.claude, { recursive: true, force: true });
  await mkdir(copyCase.claude, { recursive: true });
  for (const name of releasedSkills) await cp(path.join(copyCase.canonical, name), path.join(copyCase.claude, name), { recursive: true });
  const copyReport = await inspectInstalledRelease(copyCase.canonical);
  assert.equal(copyReport.status, 'COHERENT_FULL_SUITE');
  assert.ok(copyReport.projections.every((projection) => projection.kind === 'copy' && projection.valid));

  const broken = await validProjection();
  await rm(path.join(broken.claude, 'qie'));
  await symlink('../../missing/qie', path.join(broken.claude, 'qie'));
  const brokenReport = await inspectInstalledRelease(broken.canonical);
  assert.ok(brokenReport.problems.some((problem) => problem.startsWith('BROKEN_CLAUDE_PROJECTION qie')));
  assert.doesNotMatch(brokenReport.problems.join('\n'), /other-skill/);
  const noClaudeCli = runNodeResult([verifier, '--root', broken.canonical, '--no-claude', '--json'],
    { env: isolatedEnvironment(broken.root) });
  assert.equal(noClaudeCli.status, 0, noClaudeCli.stdout + noClaudeCli.stderr);
  assert.equal(JSON.parse(noClaudeCli.stdout).projections.length, 0);

  const misdirected = await validProjection();
  await rm(path.join(misdirected.claude, 'qie'));
  await symlink('../../.agents/skills/qie-networks', path.join(misdirected.claude, 'qie'));
  const misdirectedReport = await inspectInstalledRelease(misdirected.canonical);
  assert.ok(misdirectedReport.problems.some((problem) => problem.startsWith('MISDIRECTED_CLAUDE_PROJECTION qie')));

  const absolute = await validProjection();
  await rm(path.join(absolute.claude, 'qie'));
  await symlink(path.join(absolute.canonical, 'qie'), path.join(absolute.claude, 'qie'));
  const absoluteReport = await inspectInstalledRelease(absolute.canonical);
  assert.ok(absoluteReport.problems.some((problem) => problem.startsWith('ABSOLUTE_CLAUDE_LINK qie')));

  const staleCopy = await validProjection();
  await rm(path.join(staleCopy.claude, 'qie'));
  await cp(path.join(staleCopy.canonical, 'qie'), path.join(staleCopy.claude, 'qie'), { recursive: true });
  await appendFile(path.join(staleCopy.claude, 'qie/SKILL.md'), '\nSTALE COPY\n');
  const staleReport = await inspectInstalledRelease(staleCopy.canonical);
  assert.ok(staleReport.problems.some((problem) => problem.startsWith('CLAUDE_COPY_MISMATCH qie')));

  const staleManifest = await validProjection();
  await rm(path.join(staleManifest.claude, 'qie'));
  await cp(path.join(staleManifest.canonical, 'qie'), path.join(staleManifest.claude, 'qie'), { recursive: true });
  {
    const filename = path.join(staleManifest.claude, 'qie/MANIFEST.json');
    const manifest = JSON.parse(await readFile(filename, 'utf8'));
    manifest.built_at = '2026-10-18T00:00:00Z';
    await writeFile(filename, `${JSON.stringify(manifest, null, 2)}\n`);
  }
  const staleManifestReport = await inspectInstalledRelease(staleManifest.canonical);
  assert.ok(staleManifestReport.problems.some((problem) => problem.startsWith('CLAUDE_COPY_MISMATCH qie')));

  const unrelatedBroken = await validProjection();
  await symlink('../../missing/other-skill', path.join(unrelatedBroken.claude, 'unrelated-link'));
  const unrelatedReport = await inspectInstalledRelease(unrelatedBroken.canonical);
  assert.deepEqual(unrelatedReport.problems, []);

  const onlyUnrelated = await temporaryDirectory(t, 'qie-forge-b09-unrelated-');
  await mkdir(path.join(onlyUnrelated, 'other-skill'), { recursive: true });
  await writeFile(path.join(onlyUnrelated, 'other-skill/SKILL.md'), '---\nname: other-skill\ndescription: unrelated skill\n---\n');
  const onlyUnrelatedReport = await inspectInstalledRelease(onlyUnrelated);
  assert.ok(onlyUnrelatedReport.problems.some((problem) => problem.startsWith('NO_QIE_SKILLS')));
  assert.ok(!onlyUnrelatedReport.problems.some((problem) => problem.includes('other-skill')));

  const symlinkRoot = await temporaryDirectory(t, 'qie-forge-b09-root-link-');
  await symlink(path.join(source, 'qie'), path.join(symlinkRoot, 'qie'));
  const symlinkRootReport = await inspectInstalledRelease(symlinkRoot);
  assert.ok(symlinkRootReport.problems.some((problem) => problem.startsWith('UNSAFE_BUNDLE_SYMLINK qie')));
  assert.ok(!symlinkRootReport.problems.some((problem) => problem.startsWith('NO_QIE_SKILLS')));
});
