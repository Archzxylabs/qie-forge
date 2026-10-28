import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { sha256, stableJson, walkFiles } from './io.mjs';

// A release identity is the content address of the whole published suite. It
// is deliberately independent of MANIFEST.json: each manifest carries the
// identity, so the identity cannot hash the manifests without becoming
// self-referential. Every other file in every bundle is covered, including
// generated references, snapshots, recipes, helpers and frontmatter.
export const MANIFEST_FILE = 'MANIFEST.json';

const bySkill = (a, b) => a.skill_id.localeCompare(b.skill_id, 'en');
const byPath = (a, b) => a.path.localeCompare(b.path, 'en');

export function releaseIdentityInput({ release, bundles }) {
  if (!release || typeof release !== 'object') throw new Error('Release context is required');
  return {
    release_version: release.release_version,
    schema_version: release.schema_version,
    built_at: release.built_at,
    skills: [...bundles].sort(bySkill).map((bundle) => ({
      skill_id: bundle.skill_id,
      files: [...bundle.files]
        .filter((file) => file.path !== MANIFEST_FILE)
        .sort(byPath)
        .map((file) => ({ path: file.path, sha256: file.sha256 })),
    })),
  };
}

export function computeReleaseId({ release, bundles }) {
  return sha256(stableJson(releaseIdentityInput({ release, bundles })));
}

export function releaseIdFromOutputs(outputs, release) {
  const bundles = Object.entries(outputs).map(([skillId, files]) => ({
    skill_id: skillId,
    files: Object.entries(files).map(([file, content]) => ({ path: file, sha256: sha256(content) })),
  }));
  return computeReleaseId({ release, bundles });
}

export async function readBundleInventory(root, skillId = path.basename(root)) {
  const paths = (await walkFiles(root)).filter((file) => file !== MANIFEST_FILE).sort();
  const files = await Promise.all(paths.map(async (file) => ({
    path: file,
    sha256: sha256(await readFile(path.join(root, file))),
  })));
  return { skill_id: skillId, files };
}
