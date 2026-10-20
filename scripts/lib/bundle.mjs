import path from 'node:path';
import { readFile } from 'node:fs/promises';
import YAML from 'yaml';
import { containedPath, sha256, stableJson, walkFiles } from './io.mjs';

export function validateFrontmatter(content, expectedName) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) throw new Error('Missing or malformed YAML frontmatter');
  const parsed = YAML.parseDocument(match[1], { uniqueKeys: true, strict: true });
  if (parsed.errors.length) throw new Error('Invalid YAML frontmatter');
  const metadata = parsed.toJS({ maxAliasCount: 0 });
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) throw new Error('Frontmatter must be a mapping');
  const allowed = ['name', 'description', 'license', 'compatibility', 'metadata', 'allowed-tools'];
  if (Object.keys(metadata).some((key) => !allowed.includes(key))) throw new Error('Unsupported frontmatter field');
  if (metadata.name !== expectedName || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(metadata.name) || metadata.name.length > 64) {
    throw new Error('Skill name must match its directory and specification');
  }
  if (typeof metadata.description !== 'string' || !metadata.description.trim() || metadata.description.length > 1024) {
    throw new Error('Skill description must contain 1–1024 characters');
  }
  if (metadata.compatibility !== undefined && (typeof metadata.compatibility !== 'string' || metadata.compatibility.length > 500)) {
    throw new Error('Invalid compatibility frontmatter');
  }
  return metadata;
}

function resolveLocal(from, target, files) {
  if (/^https:\/\//.test(target)) return;
  if (target.startsWith('#')) return;
  if (/^[A-Za-z][A-Za-z0-9+.-]*:/.test(target) || target.startsWith('/') || target.includes('\\')) {
    throw new Error(`Unsupported or absolute reference: ${target}`);
  }
  const decoded = decodeURIComponent(target.split(/[?#]/)[0]);
  const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(from), decoded));
  if (resolved === '..' || resolved.startsWith('../') || resolved.startsWith('/') || !files.has(resolved)) {
    throw new Error(`Broken or escaping reference from ${from}: ${target}`);
  }
}

export function validateReferences(files) {
  const names = new Set(Object.keys(files));
  for (const [filename, text] of Object.entries(files)) {
    if (filename.endsWith('.md')) {
      for (const match of text.matchAll(/!?\[[^\]\n]*\]\(<?([^\s)>]+)>?(?:\s+"[^"]*")?\)/g)) {
        resolveLocal(filename, match[1], names);
      }
      const definitions = new Map([...text.matchAll(/^\[([^\]]+)\]:\s*<?([^\s>]+)>?/gm)].map((m) => [m[1].toLowerCase(), m[2]]));
      for (const target of definitions.values()) resolveLocal(filename, target, names);
      for (const match of text.matchAll(/\[[^\]\n]+\]\[([^\]\n]+)\]/g)) {
        if (!definitions.has(match[1].toLowerCase())) throw new Error(`Missing reference definition in ${filename}`);
      }
    }
    if (filename.endsWith('.mjs') || filename.endsWith('.ts')) {
      for (const match of text.matchAll(/(?:from\s*|import\s*)['"]([^'"]+)['"]/g)) {
        if (!match[1].startsWith('node:')) resolveLocal(filename, match[1], names);
      }
      for (const match of text.matchAll(/new URL\(['"]([^'"]+)['"],\s*import\.meta\.url\)/g)) {
        resolveLocal(filename, match[1], names);
      }
    }
  }
}

export async function validateBundle(root, validate) {
  const names = await walkFiles(root);
  const files = Object.fromEntries(await Promise.all(names.map(async (name) => [name, await readFile(containedPath(root, name), 'utf8')])));
  if (!files['MANIFEST.json'] || !files['SKILL.md']) throw new Error('Bundle requires entry and manifest');
  const manifest = JSON.parse(files['MANIFEST.json']);
  validate('manifest', manifest);
  validateFrontmatter(files['SKILL.md'], path.basename(root));
  const expected = manifest.files.map((entry) => entry.path).sort();
  if (new Set(expected).size !== expected.length || expected.includes('MANIFEST.json')) throw new Error('Invalid manifest file inventory');
  const actual = names.filter((name) => name !== 'MANIFEST.json').sort();
  if (JSON.stringify(expected) !== JSON.stringify(actual)) throw new Error('Manifest inventory differs from bundle');
  for (const entry of manifest.files) {
    if (sha256(files[entry.path]) !== entry.sha256) throw new Error(`Manifest hash mismatch: ${entry.path}`);
  }
  if (manifest.skill_id !== path.basename(root)) throw new Error('Manifest skill ID differs from directory');
  if (typeof manifest.snapshot_path !== 'string' || !Object.hasOwn(files, manifest.snapshot_path)) {
    throw new Error('Manifest snapshot path is missing from the bundle');
  }
  const snapshot = JSON.parse(files[manifest.snapshot_path]);
  if (manifest.knowledge_sha256 !== sha256(files[manifest.snapshot_path])
    || manifest.policy_sha256 !== sha256(stableJson(snapshot.policy))) throw new Error('Manifest knowledge/policy digest mismatch');
  if (snapshot.schema_version !== manifest.schema_version) throw new Error('Manifest snapshot schema mismatch');
  validateReferences(files);
  return manifest;
}
