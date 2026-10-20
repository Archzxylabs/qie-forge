import { execFileSync } from 'node:child_process';
import { walkFiles } from './lib/io.mjs';

for (const directory of ['scripts', 'tests']) {
  for (const file of await walkFiles(directory)) {
    if (file.endsWith('.mjs') || file.endsWith('.cjs')) execFileSync(process.execPath, ['--check', `${directory}/${file}`], { stdio: 'inherit' });
  }
}
console.log('JavaScript syntax checks passed. No TypeScript compiler or style linter is configured.');
