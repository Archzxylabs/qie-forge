import path from 'node:path';
import { readdir } from 'node:fs/promises';
import { loadKnowledge } from './lib/knowledge.mjs';
import { loadValidators } from './lib/schemas.mjs';
import { validateBundle } from './lib/bundle.mjs';
import { computeReleaseId, readBundleInventory } from './lib/release-identity.mjs';

try {
  const root = process.cwd();
  const validate = await loadValidators(path.join(root, 'knowledge/schema'));
  const data = await loadKnowledge(root);
  const entries = await readdir(path.join(root, 'skills'), { withFileTypes: true });
  const unexpected = entries.filter((entry) => !entry.isDirectory()).map((entry) => entry.name);
  if (unexpected.length) throw new Error(`Unexpected published entries: ${unexpected.join(', ')}`);
  const skills = entries.map((entry) => entry.name).sort();
  if (!skills.length) throw new Error('No published skill');

  const enabled = data.skills.filter((skill) => skill.enabled_for_release).map((skill) => skill.skill_id).sort();
  if (JSON.stringify(skills) !== JSON.stringify(enabled)) {
    throw new Error(`Published skill set differs from enabled catalogue: published ${skills.join(', ')}; enabled ${enabled.join(', ')}`);
  }

  const bundles = [];
  const manifests = [];
  for (const name of skills) {
    const manifest = await validateBundle(path.join(root, 'skills', name), validate);
    const inventory = await readBundleInventory(path.join(root, 'skills', name), name);
    bundles.push(inventory);
    manifests.push(manifest);
  }

  for (const field of ['release_version', 'schema_version', 'built_at', 'release_id']) {
    const values = [...new Set(manifests.map((manifest) => manifest[field]))];
    if (values.length !== 1) throw new Error(`Published manifests disagree on ${field}: ${values.join(', ')}`);
  }
  for (const field of ['release_version', 'schema_version', 'built_at']) {
    if (manifests[0][field] !== data.release[field]) throw new Error(`Published ${field} differs from release context`);
  }
  const expected = computeReleaseId({ release: data.release, bundles });
  if (manifests[0].release_id !== expected) {
    throw new Error(`Published release identity ${manifests[0].release_id} does not match published bytes ${expected}`);
  }

  console.log(`Validated ${skills.length} self-contained skill bundle(s); release identity ${expected}.`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
