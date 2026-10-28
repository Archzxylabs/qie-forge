// Build a static projection; generated skills are read-only inputs.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { documentationFiles } from './lib/documentation.mjs';
import { walkFiles, writeTree } from './lib/io.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'dist/docs');
const args = process.argv.slice(2);
if (args.some((arg) => arg !== '--check') || args.length > 1) {
  console.error('Usage: node scripts/build-docs.mjs [--check]');
  process.exitCode = 2;
} else {
  try {
    const files = await documentationFiles(root);
    if (args.includes('--check')) {
      const names = await walkFiles(output);
      if (JSON.stringify(names.sort()) !== JSON.stringify(Object.keys(files).sort())) throw new Error('Documentation file inventory differs; run npm run site:build');
      for (const [name, bytes] of Object.entries(files)) {
        if (!(await readFile(path.join(output, name))).equals(bytes)) throw new Error(`Documentation drift: ${name}`);
      }
      console.log('Static documentation and raw release files match their source inputs.');
    } else {
      await writeTree(output, files);
      console.log(`Built ${Object.keys(files).length} static documentation and raw release files in dist/docs.`);
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
