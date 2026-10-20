// Regenerates the preserved verification evidence for this release.
//
// The milestone reports quote executed verification numbers. Those numbers are
// only trustworthy while they describe a complete, preserved run log, so this
// script produces the whole evidence set in one deterministic pass: every gate
// is executed, its full output (not a truncated excerpt) is written to
// docs/evidence/b08/<gate>.txt, and the script fails if any gate fails.
//
// The logs are written with a header recording the exact command, the Node
// version and the UTC time of the run, so a reader can tell which tree and
// which toolchain produced them.

import { spawn } from 'node:child_process';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const evidence = path.join(root, 'docs', 'evidence', 'b08');

async function testFiles() {
  const entries = await readdir(path.join(root, 'tests'));
  return entries.filter((name) => name.endsWith('.test.mjs')).sort().map((name) => `tests/${name}`);
}

const suite = await testFiles();

// Each gate is executed in order. `args` are passed to the Node binary
// directly (not through npm) so the captured output contains the test reporter
// lines and the coverage table verbatim.
const gates = [
  { name: 'lint', command: 'npm run lint', args: ['scripts/check-syntax.mjs'] },
  { name: 'validate', command: 'npm run validate', shell: 'node scripts/validate-knowledge.mjs && node scripts/validate-skills.mjs' },
  { name: 'docs-generate', command: 'npm run docs:generate', args: ['scripts/generate-evidence-doc.mjs'] },
  { name: 'docs-check', command: 'npm run docs:check', args: ['scripts/generate-evidence-doc.mjs', '--check'] },
  { name: 'build', command: 'npm run build', args: ['scripts/build-skill-release.mjs'] },
  { name: 'build-check', command: 'npm run build:check', args: ['scripts/build-skill-release.mjs', '--check'] },
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

for (const gate of gates) {
  const { code, output } = await run(gate);
  const header = `# QIE Forge release verification — ${gate.name}\n`
    + `# node ${process.version} / UTC ${stamp}\n`
    + `# command: ${gate.command}\n\n`;
  await writeFile(path.join(evidence, `${gate.name}.txt`), header + output);
  const status = code === 0 ? 'PASS' : 'FAIL';
  console.log(`${status}  ${gate.command}`);
  if (code !== 0) failures.push(gate.command);
}

if (failures.length) {
  console.error(`Verification failed: ${failures.join(', ')}`);
  process.exitCode = 1;
} else {
  console.log(`All ${gates.length} verification gates passed; logs in docs/evidence/b08/`);
}

// The milestone reports quote executed numbers. They are only truthful while
// they describe the run that was just executed, so the reports are checked
// against the logs this run wrote. The check runs after the logs exist, which
// is why it cannot live inside the test suite.
//
// The comparison is deliberately not part of the test suite: the unit-test and
// coverage logs are written by a run of that suite, so a suite that asserts
// against them can never bootstrap a changed test count — the run that
// refreshes the log would fail against the stale log it replaces. Comparing
// here compares each report against the log of the run that just happened.
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

// The test count and the installation count are compared exactly. The coverage
// figures are compared with a small tolerance, because V8's block coverage is
// not bit-stable for lazily executed paths and can move by a hundredth of a
// point between two runs of the same tree. The tolerance is far below any
// meaningful drift: a report that quotes the figures of a different code state
// differs by much more than a tenth of a point.
const COVERAGE_TOLERANCE_POINTS = 0.1;
const coverageDrift = (quoted, executed) => Math.abs(Number(quoted) - Number(executed)) > COVERAGE_TOLERANCE_POINTS;

for (const report of ['docs/b08-results.md', 'docs/b08-remediation-results.md']) {
  const text = await readFile(path.join(root, report), 'utf8');
  if (!new RegExp(`${testCounts.tests}/${testCounts.tests}\\b`).test(text)) {
    problems.push(`${report} does not quote the executed test count ${testCounts.tests}/${testCounts.tests}`);
  }
  if (!new RegExp(`${installCounts.pass}/${installCounts.pass}\\b`).test(text)) {
    problems.push(`${report} does not quote the executed installation count ${installCounts.pass}/${installCounts.pass}`);
  }
  const quoted = text.match(/([\d.]+)% lines, ([\d.]+)% branches, ([\d.]+)% functions/);
  if (!quoted) problems.push(`${report} does not quote the overall coverage figures`);
  else if (coverageDrift(quoted[1], coverage.lines) || coverageDrift(quoted[2], coverage.branches) || coverageDrift(quoted[3], coverage.functions)) {
    problems.push(`${report} quotes coverage ${quoted[1]}/${quoted[2]}/${quoted[3]} but the executed run produced ${coverage.lines}/${coverage.branches}/${coverage.functions}`);
  }
}

if (problems.length) {
  console.error(`Report figures do not match the executed run:\n- ${problems.join('\n- ')}`);
  process.exitCode = 1;
} else {
  console.log(`Milestone reports quote the executed verification: ${testCounts.tests}/${testCounts.tests} tests, ${installCounts.pass}/${installCounts.pass} installation fixtures, ${coverage.lines}%/${coverage.branches}%/${coverage.functions}% coverage.`);
}
