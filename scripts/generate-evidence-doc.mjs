import path from 'node:path';
import { readFile, writeFile } from 'node:fs/promises';
import { loadKnowledge } from './lib/knowledge.mjs';
import { renderCapabilityCatalogue } from './lib/evidence-doc.mjs';

// Regenerates docs/evidence/b08/capability-catalogue.md from canonical
// knowledge records. --check fails (exit 1) when the checked-in document has
// drifted from what the canonical data produces.
const root = process.cwd();
const target = path.join(root, 'docs/evidence/b08/capability-catalogue.md');
const data = await loadKnowledge(root);
const expected = renderCapabilityCatalogue(data);

if (process.argv.includes('--check')) {
  let actual = null;
  try { actual = await readFile(target, 'utf8'); } catch { /* missing file reported below */ }
  if (actual !== expected) {
    console.error('Evidence catalogue has drifted from canonical knowledge; run: node scripts/generate-evidence-doc.mjs');
    process.exitCode = 1;
  } else {
    console.log('Evidence catalogue matches canonical knowledge records.');
  }
} else {
  await writeFile(target, expected);
  console.log(`Wrote ${path.relative(root, target)} from canonical knowledge records.`);
}
