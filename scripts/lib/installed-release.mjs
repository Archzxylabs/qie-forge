import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lstat, readFile, readdir, readlink, realpath } from 'node:fs/promises';
import { containedPath, readContained, sha256, stableJson, walkFiles } from './io.mjs';
import { computeReleaseId, MANIFEST_FILE, readBundleInventory } from './release-identity.mjs';
import {
  CANONICAL_SKILLS,
  CANONICAL_SKILL_SET,
  SNAPSHOT_PATHS,
  SUPPORTED_SCHEMA_VERSIONS,
} from './release-contract.mjs';
import { validateFrontmatter } from './bundle.mjs';
import { loadValidators } from './schemas.mjs';

const SHA256 = /^[0-9a-f]{64}$/;
const REQUIRED_IDENTITY = ['release_version', 'schema_version', 'built_at', 'release_id'];
const MAX_MANIFEST_BYTES = 1024 * 1024;
const MAX_SNAPSHOT_BYTES = 2 * 1024 * 1024;
const MAX_BUNDLE_BYTES = 8 * 1024 * 1024;
const SCHEMA_ROOT = fileURLToPath(new URL('../../knowledge/schema/', import.meta.url));

let validatorPromise;
function manifestValidator() {
  validatorPromise ??= loadValidators(SCHEMA_ROOT);
  return validatorPromise;
}

function timestamp(value) {
  return typeof value === 'string' && Number.isFinite(Date.parse(value)) && value.endsWith('Z');
}

function shapeProblem(manifest, name) {
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    return [`INVALID_MANIFEST ${name}: manifest must be an object`];
  }
  const problems = [];
  for (const field of REQUIRED_IDENTITY) {
    if (typeof manifest[field] !== 'string' || !manifest[field]) problems.push(`INVALID_MANIFEST ${name}: missing ${field}`);
  }
  if (manifest.release_id !== undefined && !SHA256.test(manifest.release_id)) {
    problems.push(`INVALID_RELEASE_ID ${name}: release_id must be a lowercase SHA-256`);
  }
  if (manifest.generated !== true) problems.push(`MANIFEST_NOT_GENERATED ${name}: generated must be true`);
  if (manifest.sources_checked_at !== undefined && manifest.sources_checked_at !== null && !timestamp(manifest.sources_checked_at)) {
    problems.push(`INVALID_TIMESTAMP ${name}: sources_checked_at must be null or a UTC timestamp`);
  }
  if (typeof manifest.snapshot_path !== 'string' || !manifest.snapshot_path) {
    problems.push(`INVALID_MANIFEST ${name}: missing snapshot_path`);
  }
  if (!Array.isArray(manifest.files) || manifest.files.length === 0) {
    problems.push(`INVALID_MANIFEST ${name}: files must be a non-empty array`);
  }
  return problems;
}

async function schemaProblem(manifest, name) {
  let validate;
  try {
    validate = await manifestValidator();
  } catch {
    return `INVALID_MANIFEST ${name}: manifest schema validator unavailable`;
  }
  const candidate = { ...manifest };
  // A legacy manifest predates release_id. Keep it eligible for the explicit
  // LEGACY_RELEASE_ID finding instead of reducing it to a generic schema error.
  if (candidate.release_id === undefined) candidate.release_id = '0'.repeat(64);
  try {
    validate('manifest', candidate);
    return null;
  } catch {
    return `INVALID_MANIFEST ${name}: manifest does not satisfy the manifest schema`;
  }
}

function inventoryMap(inventory) {
  const files = Array.isArray(inventory) ? inventory : (inventory?.files ?? []);
  return new Map(files.map((file) => [file.path, file.sha256]));
}

async function inspectProjection(canonicalRoot, projectionRoot, skill) {
  const problems = [];
  const projection = path.join(projectionRoot, skill.name);
  let info;
  try {
    info = await lstat(projection);
  } catch {
    problems.push(`MISSING_CLAUDE_PROJECTION ${skill.name}: Claude Code projection is absent`);
    return { name: skill.name, kind: 'missing', valid: false, problems };
  }

  if (info.isSymbolicLink()) {
    let target;
    try {
      target = await readlink(projection);
    } catch {
      problems.push(`BROKEN_CLAUDE_PROJECTION ${skill.name}: cannot read link target`);
      return { name: skill.name, kind: 'symlink', valid: false, problems };
    }
    if (path.isAbsolute(target)) {
      problems.push(`ABSOLUTE_CLAUDE_LINK ${skill.name}: projection must be a relative symlink`);
      return { name: skill.name, kind: 'symlink', valid: false, problems };
    }
    let realTarget;
    let realCanonical;
    try {
      realTarget = await realpath(path.resolve(projectionRoot, target));
      realCanonical = await realpath(path.join(canonicalRoot, skill.name));
    } catch {
      problems.push(`BROKEN_CLAUDE_PROJECTION ${skill.name}: projection target does not resolve`);
      return { name: skill.name, kind: 'symlink', valid: false, problems };
    }
    if (realTarget !== realCanonical) {
      problems.push(`MISDIRECTED_CLAUDE_PROJECTION ${skill.name}: link target is outside the canonical bundle`);
      return { name: skill.name, kind: 'symlink', valid: false, problems };
    }
    return { name: skill.name, kind: 'symlink', valid: true, problems };
  }

  if (!info.isDirectory()) {
    problems.push(`INVALID_CLAUDE_PROJECTION ${skill.name}: projection must be a directory or symlink`);
    return { name: skill.name, kind: 'invalid', valid: false, problems };
  }

  let copiedText;
  let copiedManifest;
  try {
    copiedText = await readContained(projection, MANIFEST_FILE);
    copiedManifest = JSON.parse(copiedText);
  } catch {
    problems.push(`UNREADABLE_CLAUDE_COPY ${skill.name}: projection manifest is missing, invalid or outside the projection`);
    return { name: skill.name, kind: 'copy', valid: false, problems };
  }
  let canonicalText;
  try {
    canonicalText = await readContained(path.join(canonicalRoot, skill.name), MANIFEST_FILE);
  } catch {
    problems.push(`UNREADABLE_CLAUDE_COPY ${skill.name}: canonical manifest cannot be read`);
    return { name: skill.name, kind: 'copy', valid: false, problems };
  }
  if (copiedManifest.skill_id !== skill.name
    || copiedManifest.release_id !== skill.manifest.release_id
    || copiedText !== canonicalText) {
    problems.push(`CLAUDE_COPY_MISMATCH ${skill.name}: projection manifest does not match the canonical bundle`);
    return { name: skill.name, kind: 'copy', valid: false, problems };
  }

  let copied;
  try {
    copied = await readBundleInventory(projection, skill.name);
  } catch {
    problems.push(`UNREADABLE_CLAUDE_COPY ${skill.name}: projection contains an unsafe or unreadable entry`);
    return { name: skill.name, kind: 'copy', valid: false, problems };
  }
  const expected = inventoryMap(skill.inventory);
  const actual = inventoryMap(copied);
  const differences = [];
  for (const [file, digest] of expected) if (actual.get(file) !== digest) differences.push(file);
  for (const file of actual.keys()) if (!expected.has(file)) differences.push(file);
  if (differences.length) {
    problems.push(`CLAUDE_COPY_MISMATCH ${skill.name}: ${[...new Set(differences)].sort().slice(0, 5).join(', ')}`);
    return { name: skill.name, kind: 'copy', valid: false, problems };
  }
  return { name: skill.name, kind: 'copy', valid: true, problems };
}

async function inspectProjections(canonicalRoot, projectionRoot, skills, required) {
  const problems = [];
  const projections = [];
  let info;
  try {
    info = await lstat(projectionRoot);
  } catch {
    if (required) problems.push(`MISSING_CLAUDE_ROOT ${projectionRoot}: Claude Code skills directory is absent`);
    return { problems, projections };
  }
  if (info.isSymbolicLink()) {
    problems.push(`UNSAFE_CLAUDE_ROOT ${projectionRoot}: Claude Code skills directory must not be a symlink`);
    return { problems, projections };
  }
  if (!info.isDirectory()) {
    problems.push(`INVALID_CLAUDE_ROOT ${projectionRoot}: not a directory`);
    return { problems, projections };
  }
  let entries;
  try {
    entries = await readdir(projectionRoot, { withFileTypes: true });
  } catch {
    problems.push(`INVALID_CLAUDE_ROOT ${projectionRoot}: cannot be read`);
    return { problems, projections };
  }
  // An auto-detected .claude/skills directory may belong to a Codex-only
  // install or contain unrelated Claude skills. Only inspect it when at least
  // one canonical QIE projection is present; an explicit --claude-root remains
  // a request to verify every canonical projection.
  if (!required && !entries.some((entry) => CANONICAL_SKILL_SET.has(entry.name))) {
    return { problems, projections };
  }
  for (const skill of skills) {
    if (!skill.inventory) continue;
    const projection = await inspectProjection(canonicalRoot, projectionRoot, skill);
    projections.push(projection);
    problems.push(...projection.problems);
  }
  return { problems, projections };
}

async function inspectBundle(root, name) {
  const problems = [];
  const directory = path.join(root, name);
  let info;
  try {
    info = await lstat(directory);
  } catch {
    return { name, present: false, problems: [`MISSING_MANIFEST ${name}: bundle directory is absent`], manifest: null, inventory: null };
  }
  if (info.isSymbolicLink()) {
    return { name, problems: [`UNSAFE_BUNDLE_SYMLINK ${name}: canonical bundle must not be a symlink`], manifest: null, inventory: null };
  }
  if (!info.isDirectory()) {
    return { name, problems: [`UNREADABLE_BUNDLE ${name}: bundle is not a directory`], manifest: null, inventory: null };
  }

  let manifestInfo;
  try {
    manifestInfo = await lstat(path.join(directory, MANIFEST_FILE));
  } catch {
    return { name, problems: [`MISSING_MANIFEST ${name}: manifest is absent`], manifest: null, inventory: null };
  }
  if (manifestInfo.isSymbolicLink()) {
    return { name, problems: [`UNSAFE_MANIFEST_SYMLINK ${name}: manifest must be a contained regular file`], manifest: null, inventory: null };
  }
  if (!manifestInfo.isFile()) {
    return { name, problems: [`INVALID_MANIFEST ${name}: manifest is not a regular file`], manifest: null, inventory: null };
  }
  if (manifestInfo.size > MAX_MANIFEST_BYTES) {
    return { name, problems: [`OVERSIZED_MANIFEST ${name}: manifest exceeds the verification limit`], manifest: null, inventory: null };
  }
  let manifestText;
  try {
    manifestText = await readContained(directory, MANIFEST_FILE);
  } catch {
    return { name, problems: [`INVALID_MANIFEST ${name}: manifest is unreadable`], manifest: null, inventory: null };
  }
  let manifest;
  try {
    manifest = JSON.parse(manifestText);
  } catch {
    return { name, problems: [`INVALID_MANIFEST ${name}: manifest is not valid JSON`], manifest: null, inventory: null };
  }

  problems.push(...shapeProblem(manifest, name));
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest) || !Array.isArray(manifest.files)) {
    return { name, problems: [...new Set(problems)], manifest, inventory: null };
  }
  if (manifest.skill_id !== name) problems.push(`SKILL_ID_MISMATCH ${name}: manifest skill_id must match the directory`);
  if (!SUPPORTED_SCHEMA_VERSIONS.includes(manifest.schema_version)) {
    problems.push(`UNSUPPORTED_SCHEMA_VERSION ${name}: manifest schema version is not supported`);
  }
  if (manifest.sources_checked_at !== null && manifest.sources_checked_at !== undefined) {
    if (timestamp(manifest.built_at) && timestamp(manifest.sources_checked_at)
      && Date.parse(manifest.sources_checked_at) > Date.parse(manifest.built_at)) {
      problems.push(`FUTURE_SOURCES_CHECKED_AT ${name}: sources_checked_at follows built_at`);
    }
  }
  const schemaFailure = await schemaProblem(manifest, name);
  if (schemaFailure) {
    problems.push(schemaFailure);
    return { name, problems: [...new Set(problems)], manifest, inventory: null };
  }

  const expected = manifest.files.map((file) => file?.path);
  if (new Set(expected).size !== expected.length) problems.push(`DUPLICATE_MANIFEST_ENTRY ${name}: duplicate file paths`);
  if (expected.includes(MANIFEST_FILE)) problems.push(`INVALID_MANIFEST ${name}: manifest must not hash itself`);

  let actual;
  try {
    actual = (await walkFiles(directory)).filter((file) => file !== MANIFEST_FILE).sort();
  } catch {
    problems.push(`UNREADABLE_BUNDLE ${name}: bundle contains an unsafe or unreadable entry`);
    return { name, problems: [...new Set(problems)], manifest, inventory: null };
  }
  const actualSet = new Set(actual);
  const expectedSet = new Set(expected);
  for (const file of expected) {
    if (!actualSet.has(file)) problems.push(`MISSING_FILE ${name}/${file}: listed in manifest but absent`);
  }
  for (const file of actual) {
    if (!expectedSet.has(file)) problems.push(`UNEXPECTED_FILE ${name}/${file}: not listed in manifest`);
  }
  if (!expectedSet.has('SKILL.md') || !actualSet.has('SKILL.md')) {
    problems.push(`MISSING_SKILL_FILE ${name}: SKILL.md must be listed and present`);
  }

  const sizes = new Map();
  let totalBytes = 0;
  try {
    for (const file of actual) {
      const fileInfo = await lstat(path.join(directory, file));
      sizes.set(file, fileInfo.size);
      totalBytes += fileInfo.size;
    }
  } catch {
    problems.push(`UNREADABLE_BUNDLE ${name}: bundle size cannot be established`);
    return { name, problems: [...new Set(problems)], manifest, inventory: null };
  }
  const snapshotRel = manifest.snapshot_path;
  if (sizes.get(snapshotRel) > MAX_SNAPSHOT_BYTES) problems.push(`OVERSIZED_SNAPSHOT ${name}: snapshot exceeds the verification limit`);
  if (totalBytes > MAX_BUNDLE_BYTES) problems.push(`OVERSIZED_BUNDLE ${name}: bundle exceeds the verification limit`);
  if (sizes.get(snapshotRel) > MAX_SNAPSHOT_BYTES || totalBytes > MAX_BUNDLE_BYTES) {
    return { name, problems: [...new Set(problems)], manifest, inventory: null };
  }

  let snapshotContained = null;
  try {
    snapshotContained = containedPath(directory, snapshotRel);
  } catch {
    problems.push(`UNSAFE_SNAPSHOT_PATH ${name}: snapshot_path must stay inside the bundle`);
  }
  if (!SNAPSHOT_PATHS.includes(snapshotRel)) {
    problems.push(`UNSAFE_SNAPSHOT_PATH ${name}: snapshot_path is not a published snapshot path`);
  }
  if (!manifest.files.some((entry) => entry?.path === snapshotRel)) {
    problems.push(`SNAPSHOT_NOT_IN_MANIFEST ${name}: snapshot_path is not listed in manifest.files`);
  }
  if (!actualSet.has(snapshotRel)) {
    problems.push(`SNAPSHOT_NOT_IN_BUNDLE ${name}: snapshot_path is not present in the bundle`);
  }

  const inventory = [];
  for (const entry of manifest.files) {
    if (!entry || typeof entry.path !== 'string' || typeof entry.sha256 !== 'string') {
      problems.push(`INVALID_MANIFEST ${name}: each file entry needs path and sha256`);
      continue;
    }
    if (!actualSet.has(entry.path)) continue;
    let filePath;
    try {
      filePath = containedPath(directory, entry.path);
    } catch {
      problems.push(`UNSAFE_MANIFEST_PATH ${name}: ${entry.path}`);
      continue;
    }
    let content;
    try {
      content = await readFile(filePath);
    } catch {
      problems.push(`UNREADABLE_FILE ${name}/${entry.path}: cannot be read`);
      continue;
    }
    const digest = sha256(content);
    inventory.push({ path: entry.path, sha256: digest });
    if (digest !== entry.sha256) problems.push(`HASH_MISMATCH ${name}/${entry.path}: manifest ${entry.sha256} != actual ${digest}`);
  }

  if (expectedSet.has('SKILL.md') && actualSet.has('SKILL.md')) {
    try {
      validateFrontmatter(await readContained(directory, 'SKILL.md'), name);
    } catch {
      problems.push(`INVALID_SKILL_FRONTMATTER ${name}: SKILL.md frontmatter is missing, invalid or does not name this skill`);
    }
  }

  if (snapshotContained && actualSet.has(snapshotRel) && SNAPSHOT_PATHS.includes(snapshotRel)) {
    let snapshotText;
    try {
      snapshotText = await readContained(directory, snapshotRel);
      const snapshot = JSON.parse(snapshotText);
      if (manifest.knowledge_sha256 !== sha256(snapshotText)) {
        problems.push(`KNOWLEDGE_HASH_MISMATCH ${name}: snapshot digest differs from manifest`);
      }
      if (!snapshot || typeof snapshot !== 'object' || !snapshot.policy || typeof snapshot.policy !== 'object') {
        problems.push(`UNREADABLE_SNAPSHOT ${name}: snapshot policy is missing`);
      } else if (manifest.policy_sha256 !== sha256(stableJson(snapshot.policy))) {
        problems.push(`POLICY_HASH_MISMATCH ${name}: snapshot policy digest differs from manifest`);
      }
      if (snapshot.schema_version !== manifest.schema_version) {
        problems.push(`SNAPSHOT_SCHEMA_MISMATCH ${name}: snapshot schema version does not match the manifest`);
      }
    } catch {
      // Never echo parser excerpts or file content from an untrusted snapshot.
      problems.push(`UNREADABLE_SNAPSHOT ${name}: snapshot is invalid or unreadable`);
    }
  }

  if (!Object.hasOwn(manifest, 'release_id')) {
    problems.push(`LEGACY_RELEASE_ID ${name}: installed manifest predates B09 release identity; reinstall from the same source`);
  }
  return { name, problems: [...new Set(problems)], manifest, inventory };
}

function emptyReport(root, problems) {
  return {
    root,
    status: 'ERROR',
    problems,
    skills: [],
    projections: [],
    suiteComplete: false,
    releaseId: null,
    releaseVersion: null,
    schemaVersion: null,
    builtAt: null,
    identitySource: 'unverified',
    publisherAuthenticity: 'NOT_ESTABLISHED',
    ignored: [],
  };
}

export async function inspectInstalledRelease(root, {
  expectedSkills,
  expectedReleaseId,
  requireSuite = false,
  claudeRoot,
} = {}) {
  const problems = [];
  const rootPath = path.resolve(root);
  let rootInfo;
  try {
    rootInfo = await lstat(rootPath);
  } catch {
    return emptyReport(root, [`UNREADABLE_ROOT ${root}: root is absent or unreadable`]);
  }
  if (rootInfo.isSymbolicLink()) return emptyReport(root, [`UNSAFE_ROOT_SYMLINK ${root}: installed root must not be a symlink`]);
  if (!rootInfo.isDirectory()) return emptyReport(root, [`UNREADABLE_ROOT ${root}: root is not a directory`]);

  let entries;
  try {
    entries = await readdir(rootPath, { withFileTypes: true });
  } catch {
    return emptyReport(root, [`UNREADABLE_ROOT ${root}: root cannot be read`]);
  }

  let expectedNames;
  if (expectedSkills !== undefined) {
    if (!Array.isArray(expectedSkills) || expectedSkills.some((name) => typeof name !== 'string')) {
      problems.push('INVALID_EXPECTED_SKILLS: expectedSkills must be an array of skill names');
    } else {
      expectedNames = [...new Set(expectedSkills)].sort();
      const noncanonical = expectedNames.filter((name) => !CANONICAL_SKILL_SET.has(name));
      if (noncanonical.length) problems.push(`NONCANONICAL_EXPECTED_SKILLS: ${noncanonical.join(', ')}`);
      expectedNames = expectedNames.filter((name) => CANONICAL_SKILL_SET.has(name));
      const presentOutside = entries
        .filter((entry) => CANONICAL_SKILL_SET.has(entry.name) && !expectedNames.includes(entry.name))
        .map((entry) => entry.name)
        .sort();
      if (presentOutside.length) problems.push(`UNEXPECTED_SKILLS: ${presentOutside.join(', ')}`);
    }
  }
  if (requireSuite) {
    const canonical = [...CANONICAL_SKILLS].sort();
    if (expectedNames && !expectedNames.every((name) => canonical.includes(name))) {
      problems.push('EXPECTED_SKILLS_NOT_CANONICAL_SUITE: expected set must be the nine canonical skills');
    }
    if (expectedNames && expectedNames.length !== canonical.length) {
      problems.push(`EXPECTED_SKILLS_NOT_CANONICAL_SUITE: expected ${canonical.length} skills, received ${expectedNames.length}`);
    }
    expectedNames = canonical;
  }
  if (!expectedNames) {
    expectedNames = entries.filter((entry) => CANONICAL_SKILL_SET.has(entry.name)).map((entry) => entry.name).sort();
  }

  const ignored = entries
    .filter((entry) => !expectedNames.includes(entry.name))
    .map((entry) => entry.name)
    .sort();
  const skills = [];
  for (const name of expectedNames) {
    const bundle = await inspectBundle(rootPath, name);
    skills.push(bundle);
    problems.push(...bundle.problems);
  }
  if (!expectedNames.length) {
    problems.push(`NO_QIE_SKILLS ${root}: no canonical QIE Forge skill directories found`);
  }

  const presentNames = new Set(skills.filter((skill) => skill.present !== false).map((skill) => skill.name));
  const missing = expectedNames.filter((name) => !presentNames.has(name));
  const unverifiable = expectedNames.filter((name) => presentNames.has(name)
    && !skills.find((skill) => skill.name === name)?.inventory);
  if (missing.length) problems.push(`MISSING_SKILLS: ${missing.join(', ')}`);
  if (unverifiable.length) problems.push(`UNVERIFIABLE_SKILLS: ${unverifiable.join(', ')}`);
  if (requireSuite && (missing.length || unverifiable.length || skills.length !== CANONICAL_SKILLS.length)) {
    problems.push(`INCOMPLETE_SUITE: expected ${CANONICAL_SKILLS.length} canonical installed skills, found ${skills.filter((skill) => skill.inventory).length}`);
  }

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
  let identitySource = 'manifest';

  const canonicalMissing = CANONICAL_SKILLS.filter((name) => !presentNames.has(name));
  const fullInventory = skills.length === CANONICAL_SKILLS.length
    && canonicalMissing.length === 0
    && skills.every((skill) => skill.inventory);
  let suiteComplete = fullInventory && Boolean(releaseVersion && schemaVersion && builtAt)
    && skills.every((skill) => skill.problems.length === 0);
  if (fullInventory && releaseVersion && schemaVersion && builtAt) {
    const computed = computeReleaseId({
      release: { release_version: releaseVersion, schema_version: schemaVersion, built_at: builtAt },
      bundles: skills.map((skill) => ({ skill_id: skill.name, files: skill.inventory })),
    });
    if (releaseId && computed !== releaseId) problems.push(`RELEASE_ID_MISMATCH: manifests say ${releaseId}, installed files compute ${computed}`);
    releaseId = computed;
    identitySource = 'recomputed';
  }

  let publisherAuthenticity = 'NOT_ESTABLISHED';
  if (expectedReleaseId !== undefined) {
    if (!SHA256.test(expectedReleaseId)) {
      problems.push('EXPECTED_RELEASE_ID_INVALID: expected release id must be a lowercase SHA-256');
      publisherAuthenticity = 'MISMATCH';
    } else if (releaseId !== expectedReleaseId) {
      problems.push(`EXPECTED_RELEASE_ID_MISMATCH: expected ${expectedReleaseId}, observed ${releaseId ?? 'UNKNOWN'}`);
      publisherAuthenticity = 'MISMATCH';
    } else {
      publisherAuthenticity = 'PINNED_MATCH';
    }
  }

  let projectionRoot = null;
  let projectionRequired = false;
  if (claudeRoot === null) {
    projectionRoot = null;
  } else if (typeof claudeRoot === 'string') {
    projectionRoot = path.resolve(claudeRoot);
    projectionRequired = true;
  } else if (path.basename(rootPath) === 'skills' && path.basename(path.dirname(rootPath)) === '.agents') {
    projectionRoot = path.resolve(rootPath, '../../.claude/skills');
  }
  let projections = [];
  if (projectionRoot) {
    const result = await inspectProjections(rootPath, projectionRoot, skills, projectionRequired);
    projections = result.projections;
    problems.push(...result.problems);
    if (result.problems.length) suiteComplete = false;
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
      problems: [...new Set(skill.problems)],
    })),
    projections,
    suiteComplete,
    releaseId,
    releaseVersion,
    schemaVersion,
    builtAt,
    identitySource,
    publisherAuthenticity,
    ignored,
  };
}
