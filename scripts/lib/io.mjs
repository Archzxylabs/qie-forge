import { createHash } from 'node:crypto';
import { readdir, readFile, lstat, mkdir, realpath, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import YAML from 'yaml';

export function stableJson(value) {
  const normalize = (item) => {
    if (Array.isArray(item)) return item.map(normalize);
    if (item && typeof item === 'object') {
      return Object.fromEntries(Object.keys(item).sort().map((key) => [key, normalize(item[key])]));
    }
    return item;
  };
  return JSON.stringify(normalize(value), null, 2) + '\n';
}

export const sha256 = (value) => createHash('sha256').update(value).digest('hex');

export async function readYaml(filename) {
  const document = YAML.parseDocument(await readFile(filename, 'utf8'), {
    uniqueKeys: true, strict: true,
  });
  if (document.errors.length) throw new Error(`${filename}: ${document.errors[0].message}`);
  return document.toJS({ maxAliasCount: 0 });
}

export function containedPath(root, relative) {
  if (typeof relative !== 'string' || path.isAbsolute(relative) || relative.includes('\\')) {
    throw new Error(`Invalid local path: ${relative}`);
  }
  const resolved = path.resolve(root, relative);
  if (!resolved.startsWith(path.resolve(root) + path.sep)) {
    throw new Error(`Path escapes package: ${relative}`);
  }
  return resolved;
}

export async function readContained(root, relative) {
  const filename = containedPath(root, relative);
  const realRoot = await realpath(root);
  const realFile = await realpath(filename);
  if (!realFile.startsWith(realRoot + path.sep)) throw new Error(`Symlink escapes source: ${relative}`);
  return readFile(realFile, 'utf8');
}

export async function walkFiles(root, prefix = '') {
  const entries = await readdir(path.join(root, prefix), { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name, 'en'))) {
    const relative = path.posix.join(prefix, entry.name);
    const info = await lstat(path.join(root, relative));
    if (info.isSymbolicLink()) throw new Error(`Unexpected file symlink: ${relative}`);
    if (entry.isDirectory()) files.push(...await walkFiles(root, relative));
    else if (entry.isFile()) files.push(relative);
    else throw new Error(`Unsupported file type: ${relative}`);
  }
  return files;
}

export async function writeTree(root, files) {
  await rm(root, { recursive: true, force: true });
  await mkdir(root, { recursive: true });
  for (const [relative, content] of Object.entries(files)) {
    const filename = containedPath(root, relative);
    await mkdir(path.dirname(filename), { recursive: true });
    await writeFile(filename, content);
  }
}
