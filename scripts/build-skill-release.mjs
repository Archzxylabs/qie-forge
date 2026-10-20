import { buildRelease } from './lib/release.mjs';

try {
  if (process.argv.slice(2).some((arg) => arg !== '--check')) throw new Error('Only --check is supported');
  const outputs = await buildRelease(process.cwd(), { check: process.argv.includes('--check') });
  console.log(`${process.argv.includes('--check') ? 'Reproduced' : 'Built'} ${Object.keys(outputs).join(', ')}; no live network checks performed.`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
