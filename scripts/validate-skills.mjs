import path from 'node:path';
import { readdir } from 'node:fs/promises';
import { loadValidators } from './lib/schemas.mjs';
import { validateBundle } from './lib/bundle.mjs';

try {
  const root = process.cwd();
  const validate = await loadValidators(path.join(root, 'knowledge/schema'));
  const skills = await readdir(path.join(root, 'skills'));
  if (!skills.length) throw new Error('No published skill');
  for (const name of skills) await validateBundle(path.join(root, 'skills', name), validate);
  console.log(`Validated ${skills.length} self-contained skill bundle(s).`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
