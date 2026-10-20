import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { projectRoot } from './support/fixtures.mjs';

// The milestone reports quote executed verification numbers. The authoritative
// source for those numbers is the preserved run logs in docs/evidence/b08/.
//
// The numeric cross-check lives in scripts/verify-evidence.mjs, which writes
// the logs first and compares afterwards; running it inside the test suite
// would compare a report against the previous run's log and fail whenever the
// suite grows. What can be checked inside the suite is the part that does not
// depend on a run: the release cut the report quotes is the canonical one.

const readDoc = (relative) => readFile(path.join(projectRoot, relative), 'utf8');

test('the release cut quoted by the milestone report is the canonical release cut', async () => {
  const release = JSON.parse(await readDoc('release-context.json'));
  const text = await readDoc('docs/b08-results.md');
  const quotedCut = text.match(/\*\*Release Date\*\*: (\S+)/);
  assert.ok(quotedCut, 'the milestone report states a release date');
  assert.equal(quotedCut[1], release.built_at, 'the reported release date is the canonical release cut');
});

test('the preserved verification logs are complete enough to be evidence', async () => {
  for (const name of ['tests', 'coverage', 'installation']) {
    const text = await readDoc(`docs/evidence/b08/${name}.txt`);
    assert.match(text, /^ℹ tests \d+$/m, `${name}.txt records a test count`);
    assert.match(text, /^ℹ pass \d+$/m, `${name}.txt records a pass count`);
  }
  // The unit-test and coverage logs are written by a run of this suite, so
  // their "no failure" property is checked against the log of the run that
  // just happened, in scripts/verify-evidence.mjs. Asserting it here would
  // compare this run against the previous run's log and could never bootstrap
  // a changed test count. The installation log is produced by a different
  // command, so its cleanliness can be required here.
  const installation = await readDoc('docs/evidence/b08/installation.txt');
  assert.match(installation, /^ℹ fail 0$/m, 'installation.txt records no failure');
  const coverage = await readDoc('docs/evidence/b08/coverage.txt');
  assert.match(coverage, /^ℹ all files\s*\|/m, 'coverage.txt records the overall coverage row');
});
