// Regenerates the preserved B09 distribution/update/rollback verification
// evidence. It runs the eight B09 gates in the required order, writes the
// complete output of each run to docs/evidence/b09/<gate>.txt with the exact
// command, Node version and UTC timestamp, and then verifies that
// docs/b09-results.md quotes the numbers the run just produced.
//
// This script is deliberately separate from verify-evidence.mjs so the
// preserved B08 logs and B08 report figures are not rewritten by a later
// milestone.

import { execFileSync, spawn } from 'node:child_process';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const evidence = path.join(root, 'docs', 'evidence', 'b09');

async function testFiles() {
  const entries = await readdir(path.join(root, 'tests'));
  return entries.filter((name) => name.endsWith('.test.mjs')).sort().map((name) => `tests/${name}`);
}

const suite = await testFiles();

const gates = [
  { name: 'build', command: 'npm run build', args: ['scripts/build-skill-release.mjs'] },
  { name: 'validate', command: 'npm run validate', shell: 'node scripts/validate-knowledge.mjs && node scripts/validate-skills.mjs' },
  { name: 'build-check', command: 'npm run build:check', args: ['scripts/build-skill-release.mjs', '--check'] },
  { name: 'docs-check', command: 'npm run docs:check', args: ['scripts/generate-evidence-doc.mjs', '--check'] },
  { name: 'lint', command: 'npm run lint', args: ['scripts/check-syntax.mjs'] },
  { name: 'tests', command: 'npm test', args: ['--test', '--test-isolation=none', ...suite] },
  { name: 'coverage', command: 'npm run test:coverage', args: ['--test', '--test-isolation=none', '--experimental-test-coverage', '--test-coverage-include=scripts/**', ...suite] },
  { name: 'installation', command: 'npm run test:install', args: ['--test', '--test-isolation=none', 'tests/installation.test.mjs'] },
];

function run(gate) {
  return new Promise((resolve) => {
    const child = gate.shell
      ? spawn('sh', ['-c', gate.shell], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] })
      : spawn(process.execPath, gate.args, { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '';
    child.stdout.on('data', (chunk) => { output += chunk; });
    child.stderr.on('data', (chunk) => { output += chunk; });
    child.on('close', (code) => resolve({ code, output }));
  });
}

await mkdir(evidence, { recursive: true });
const failures = [];
const stamp = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();

for (const gate of gates) {
  const { code, output } = await run(gate);
  const header = `# QIE Forge B09 verification — ${gate.name}\n`
    + `# node ${process.version} / UTC ${stamp}\n`
    + `# commit: ${head}\n`
    + `# command: ${gate.command}\n\n`;
  await writeFile(path.join(evidence, `${gate.name}.txt`), header + output);
  console.log(`${code === 0 ? 'PASS' : 'FAIL'}  ${gate.command}`);
  if (code !== 0) failures.push(gate.command);
}

if (failures.length) {
  console.error(`B09 verification failed: ${failures.join(', ')}`);
  process.exitCode = 1;
} else {
  console.log(`All ${gates.length} B09 gates passed; logs in docs/evidence/b09/`);
}

const problems = [];
const readLog = async (name) => readFile(path.join(evidence, `${name}.txt`), 'utf8');
const logCounts = (text, name) => {
  const tests = Number(text.match(/^ℹ tests (\d+)$/m)?.[1]);
  const pass = Number(text.match(/^ℹ pass (\d+)$/m)?.[1]);
  const fail = Number(text.match(/^ℹ fail (\d+)$/m)?.[1]);
  if (![tests, pass, fail].every(Number.isFinite)) throw new Error(`Verification log ${name}.txt has no test summary`);
  return { tests, pass, fail };
};
const coverageRow = (text) => {
  const row = text.match(/^ℹ all files\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|/m);
  if (!row) throw new Error('Coverage log coverage.txt has no overall coverage row');
  return { lines: row[1], branches: row[2], functions: row[3] };
};

const testCounts = logCounts(await readLog('tests'), 'tests');
const installCounts = logCounts(await readLog('installation'), 'installation');
const coverage = coverageRow(await readLog('coverage'));
const manifest = JSON.parse(await readFile(path.join(root, 'skills/qie/MANIFEST.json'), 'utf8'));
const skills = (await readdir(path.join(root, 'skills'), { withFileTypes: true })).filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();

if (skills.length !== 9) problems.push(`published suite has ${skills.length} skills, expected 9`);
if (!/^[0-9a-f]{64}$/.test(manifest.release_id)) problems.push('release_id is not a lowercase SHA-256');

const report = await readFile(path.join(root, 'docs/b09-results.md'), 'utf8');
if (!new RegExp(`\\b${testCounts.tests}/${testCounts.tests}\\b`).test(report)) {
  problems.push(`docs/b09-results.md does not quote the executed test count ${testCounts.tests}/${testCounts.tests}`);
}
if (!new RegExp(`\\b${installCounts.pass}/${installCounts.pass}\\b`).test(report)) {
  problems.push(`docs/b09-results.md does not quote the executed installation count ${installCounts.pass}/${installCounts.pass}`);
}
if (!report.includes(manifest.release_id)) {
  problems.push(`docs/b09-results.md does not quote the current release identity ${manifest.release_id}`);
}
const quoted = report.match(/([\d.]+)% lines, ([\d.]+)% branches, ([\d.]+)% functions/);
const tolerance = 0.1;
const drift = (a, b) => Math.abs(Number(a) - Number(b)) > tolerance;
if (!quoted) problems.push('docs/b09-results.md does not quote overall coverage figures');
else if (drift(quoted[1], coverage.lines) || drift(quoted[2], coverage.branches) || drift(quoted[3], coverage.functions)) {
  problems.push(`docs/b09-results.md quotes coverage ${quoted[1]}/${quoted[2]}/${quoted[3]} but the executed run produced ${coverage.lines}/${coverage.branches}/${coverage.functions}`);
}

if (problems.length) {
  console.error(`B09 report figures do not match the executed run:\n- ${problems.join('\n- ')}`);
  process.exitCode = 1;
} else {
  console.log(`B09 report quotes the executed verification: ${testCounts.tests}/${testCounts.tests} tests, ${installCounts.pass}/${installCounts.pass} installation fixtures, identity ${manifest.release_id}, ${coverage.lines}%/${coverage.branches}%/${coverage.functions}% coverage.`);
}
