import path from 'node:path';
import { readFile, readdir } from 'node:fs/promises';
import { sha256, stableJson, walkFiles } from './io.mjs';
import { computeReleaseId, MANIFEST_FILE } from './release-identity.mjs';

const SHA256 = /^[0-9a-f]{64}$/;
const REQUIRED_IDENTITY = ['release_version', 'schema_version', 'built_at', 'release_id'];

function shapeProblem(manifest, name) {
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) return [`INVALID_MANIFEST ${name}: manifest must be an object`];
  const problems = [];
  for (const field of REQUIRED_IDENTITY) {
    if (typeof manifest[field] !== 'string' || !manifest[field]) problems.push(`INVALID_MANIFEST ${name}: missing ${field}`);
  }
  if (manifest.release_id !== undefined && !SHA256.test(manifest.release_id)) problems.push(`INVALID_RELEASE_ID ${name}: release_id must be a lowercase SHA-256`);
  if (!Array.isArray(manifest.files) || manifest.files.length === 0) problems.push(`INVALID_MANIFEST ${name}: files must be a non-empty array`);
  return problems;
}

async function inspectBundle(root, name) {
  const problems = [];
  const directory = path.join(root, name);
  let manifest;
  try {
    manifest = JSON.parse(await readFile(path.join(directory, MANIFEST_FILE), 'utf8'));
  } catch (error) {
    return { name, problems: [`MISSING_MANIFEST ${name}: ${error.message}`], manifest: null, inventory: null };
  }
  problems.push(...shapeProblem(manifest, name));
  if (!manifest || !Array.isArray(manifest.files)) return { name, problems, manifest, inventory: null };
  if (manifest.skill_id !== name) problems.push(`SKILL_ID_MISMATCH ${name}: manifest says ${String(manifest.skill_id)}`);

  const expected = manifest.files.map((file) => file?.path);
  if (new Set(expected).size !== expected.length) problems.push(`DUPLICATE_MANIFEST_ENTRY ${name}: duplicate file paths`);
  if (expected.includes(MANIFEST_FILE)) problems.push(`INVALID_MANIFEST ${name}: manifest must not hash itself`);

  let actual;
  try {
    actual = (await walkFiles(directory)).filter((file) => file !== MANIFEST_FILE).sort();
  } catch (error) {
    problems.push(`UNREADABLE_BUNDLE ${name}: ${error.message}`);
    return { name, problems, manifest, inventory: null };
  }
  const actualSet = new Set(actual);
  const expectedSet = new Set(expected);
  for (const file of expected) {
    if (!actualSet.has(file)) problems.push(`MISSING_FILE ${name}/${file}: listed in manifest but absent`);
  }
  for (const file of actual) {
    if (!expectedSet.has(file)) problems.push(`UNEXPECTED_FILE ${name}/${file}: not listed in manifest`);
  }

  const inventory = [];
  for (const entry of manifest.files) {
    if (!entry || typeof entry.path !== 'string' || typeof entry.sha256 !== 'string') {
      problems.push(`INVALID_MANIFEST ${name}: each file entry needs path and sha256`);
      continue;
    }
    if (!actualSet.has(entry.path)) continue;
    const content = await readFile(path.join(directory, entry.path));
    const digest = sha256(content);
    inventory.push({ path: entry.path, sha256: digest });
    if (digest !== entry.sha256) problems.push(`HASH_MISMATCH ${name}/${entry.path}: manifest ${entry.sha256} != actual ${digest}`);
  }

  if (typeof manifest.snapshot_path === 'string') {
    const snapshotPath = path.join(directory, manifest.snapshot_path);
    try {
      const snapshot = JSON.parse(await readFile(snapshotPath, 'utf8'));
      if (manifest.knowledge_sha256 !== sha256(await readFile(snapshotPath))) {
        problems.push(`KNOWLEDGE_HASH_MISMATCH ${name}: snapshot digest differs from manifest`);
      }
      if (manifest.policy_sha256 !== sha256(stableJson(snapshot.policy))) {
        problems.push(`POLICY_HASH_MISMATCH ${name}: snapshot policy digest differs from manifest`);
      }
      if (snapshot.schema_version !== manifest.schema_version) {
        problems.push(`SNAPSHOT_SCHEMA_MISMATCH ${name}: snapshot ${String(snapshot.schema_version)} != manifest ${String(manifest.schema_version)}`);
      }
    } catch (error) {
      problems.push(`UNREADABLE_SNAPSHOT ${name}: ${error.message}`);
    }
  } else {
    problems.push(`INVALID_MANIFEST ${name}: missing snapshot_path`);
  }

  if (typeof manifest.release_id !== 'string') {
    problems.push(`LEGACY_RELEASE_ID ${name}: installed manifest predates B09 release identity; reinstall from the same source`);
  }
  return { name, problems, manifest, inventory };
}

export async function inspectInstalledRelease(root, { expectedSkills, expectedReleaseId, requireSuite = false } = {}) {
  const problems = [];
  let entries;
  try {
    entries = await readdir(root, { withFileTypes: true });
  } catch (error) {
    return {
      root,
      status: 'ERROR',
      problems: [`UNREADABLE_ROOT ${root}: ${error.message}`],
      skills: [],
      suiteComplete: false,
      releaseId: null,
      releaseVersion: null,
      schemaVersion: null,
      builtAt: null,
    };
  }

  const names = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
  const skills = [];
  for (const name of names) {
    const bundle = await inspectBundle(root, name);
    skills.push(bundle);
    problems.push(...bundle.problems);
  }
  if (!skills.length) problems.push(`NO_SKILLS ${root}: no installed skill directories found`);

  const manifests = skills.map((skill) => skill.manifest).filter(Boolean);
  const identities = [...new Set(manifests.map((manifest) => manifest.release_id).filter((value) => typeof value === 'string'))];
  const versions = [...new Set(manifests.map((manifest) => manifest.release_version).filter((value) => typeof value === 'string'))];
  const schemas = [...new Set(manifests.map((manifest) => manifest.schema_version).filter((value) => typeof value === 'string'))];
  const builds = [...new Set(manifests.map((manifest) => manifest.built_at).filter((value) => typeof value === 'string'))];

  if (identities.length > 1) problems.push(`MIXED_RELEASE_ID: installed bundles carry ${identities.length} different release identities`);
  if (versions.length > 1) problems.push(`MIXED_RELEASE_VERSION: installed bundles carry ${versions.length} different release versions`);
  if (schemas.length > 1) problems.push(`MIXED_SCHEMA_VERSION: installed bundles carry ${schemas.length} different schema versions`);
  if (builds.length > 1) problems.push(`MIXED_BUILD_TIMESTAMP: installed bundles were built at ${builds.length} different timestamps`);

  const releaseVersion = versions.length === 1 ? versions[0] : null;
  const schemaVersion = schemas.length === 1 ? schemas[0] : null;
  const builtAt = builds.length === 1 ? builds[0] : null;
  let releaseId = identities.length === 1 ? identities[0] : null;

  let suiteComplete = false;
  if (expectedSkills) {
    const expected = [...expectedSkills].sort();
    const actual = skills.map((skill) => skill.name).sort();
    const missing = expected.filter((name) => !actual.includes(name));
    const unexpected = actual.filter((name) => !expected.includes(name));
    if (missing.length) problems.push(`MISSING_SKILLS: ${missing.join(', ')}`);
    if (unexpected.length) problems.push(`UNEXPECTED_SKILLS: ${unexpected.join(', ')}`);
    // A partial installation can be coherent without being a full suite. The
    // suite identity is only recomputable when all nine published skills are
    // present; a one-skill installation reports its manifest identity instead.
    suiteComplete = expected.length === 9 && missing.length === 0 && unexpected.length === 0 && skills.every((skill) => skill.inventory);
  } else {
    // The published B09 suite has nine skills. If a caller does not supply the
    // expected set, a nine-directory installation is the only shape for which
    // the suite identity can be recomputed.
    suiteComplete = skills.length === 9 && skills.every((skill) => skill.inventory);
    if (requireSuite && skills.length !== 9) problems.push(`INCOMPLETE_SUITE: expected 9 installed skills, found ${skills.length}`);
  }

  if (suiteComplete && releaseVersion && schemaVersion && builtAt) {
    for (const skill of skills) if (!skill.inventory) problems.push(`UNVERIFIABLE_BUNDLE ${skill.name}: no file inventory`);
    if (skills.every((skill) => skill.inventory)) {
      const computed = computeReleaseId({
        release: { release_version: releaseVersion, schema_version: schemaVersion, built_at: builtAt },
        bundles: skills.map((skill) => ({ skill_id: skill.name, files: skill.inventory })),
      });
      if (releaseId && computed !== releaseId) problems.push(`RELEASE_ID_MISMATCH: manifests say ${releaseId}, installed files compute ${computed}`);
      releaseId = computed;
    }
  }

  if (expectedReleaseId) {
    if (releaseId !== expectedReleaseId) problems.push(`EXPECTED_RELEASE_ID_MISMATCH: expected ${expectedReleaseId}, observed ${releaseId ?? 'UNKNOWN'}`);
  }

  const uniqueProblems = [...new Set(problems)];
  return {
    root,
    status: uniqueProblems.length ? 'REJECTED' : suiteComplete ? 'COHERENT_FULL_SUITE' : 'COHERENT_PARTIAL',
    problems: uniqueProblems,
    skills: skills.map((skill) => ({
      name: skill.name,
      release_id: skill.manifest?.release_id ?? null,
      release_version: skill.manifest?.release_version ?? null,
      schema_version: skill.manifest?.schema_version ?? null,
      built_at: skill.manifest?.built_at ?? null,
      files: skill.inventory?.length ?? null,
      valid: skill.problems.length === 0,
    })),
    suiteComplete,
    releaseId,
    releaseVersion,
    schemaVersion,
    builtAt,
  };
}
