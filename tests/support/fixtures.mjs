import { cp, mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CANONICAL_SKILLS } from '../../scripts/lib/release-contract.mjs';

export const projectRoot = fileURLToPath(new URL('../../', import.meta.url));
export const schemaRoot = path.join(projectRoot, 'knowledge/schema');
export const releasedSkills = [...CANONICAL_SKILLS];

export async function fixtureProject(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'qie-forge-project-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const name of ['authoring', 'knowledge', 'scripts', 'recipes', 'release-context.json']) {
    await cp(path.join(projectRoot, name), path.join(root, name), { recursive: true });
  }
  return root;
}

export async function temporaryDirectory(t, prefix = 'qie-forge-isolation-') {
  const root = await mkdtemp(path.join(os.tmpdir(), prefix));
  t.after(() => rm(root, { recursive: true, force: true }));
  return root;
}
