import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { projectRoot } from './support/fixtures.mjs';

// The milestone reports quote executed verification numbers and a release cut
// from the time they were produced. Those claims are historical evidence, not
// properties of whatever release is currently active. They are bound to an
// explicit, provenance-documented historical record so a new local release cut
// can proceed without rewriting (or silently reinterpreting) the old reports.
//
// The numeric cross-check for a new active cut belongs to the active evidence
// procedure, not this historical test. The B08/B09 values below are copied from
// the preserved reports and logs named by tests/fixtures/historical-releases.json.

const readDoc = (relative) => readFile(path.join(projectRoot, relative), 'utf8');
const historical = JSON.parse(await readDoc('tests/fixtures/historical-releases.json'));

test('the historical B08 report still quotes its recorded release cut', async () => {
  const text = await readDoc(historical.b08.report);
  const quotedVersion = text.match(/\*\*Release Version\*\*: `([^`]+)`/);
  const quotedCut = text.match(/\*\*Release Date\*\*: (\S+)/);
  assert.ok(quotedVersion, 'the milestone report states a release version');
  assert.ok(quotedCut, 'the milestone report states a release date');
  assert.equal(quotedVersion[1], historical.b08.release_version);
  assert.equal(quotedCut[1], historical.b08.built_at);
});

test('the historical B09 report still quotes its recorded version, identity and test totals', async () => {
  const text = await readDoc(historical.b09.report);
  const quotedVersion = text.match(/\*\*Release:\*\* `([^`]+)`/);
  const quotedIdentity = text.match(/\*\*Release identity:\*\* `([0-9a-f]{64})`/);
  const quotedTests = text.match(/\| `npm test` \| PASS — \*\*(\d+)\/\1\*\*/);
  assert.ok(quotedVersion, 'the B09 report states its release version');
  assert.ok(quotedIdentity, 'the B09 report states its release identity');
  assert.ok(quotedTests, 'the B09 report quotes its executed test total');
  assert.equal(quotedVersion[1], historical.b09.release_version);
  assert.equal(quotedIdentity[1], historical.b09.release_identity);
  assert.equal(Number(quotedTests[1]), historical.b09.tests_passed);
});

test('the preserved verification logs are complete enough to be evidence', async () => {
  for (const name of ['tests', 'coverage', 'installation']) {
    const text = await readDoc(`docs/evidence/b08/${name}.txt`);
    assert.match(text, /^ℹ tests \d+$/m, `${name}.txt records a test count`);
    assert.match(text, /^ℹ pass \d+$/m, `${name}.txt records a pass count`);
  }
  // The unit-test and coverage logs are written by a run of the active suite,
  // so their "no failure" property is checked by the active evidence procedure.
  // The historical B09 log is a fixed record and can be checked here.
  const installation = await readDoc('docs/evidence/b08/installation.txt');
  assert.match(installation, /^ℹ fail 0$/m, 'installation.txt records no failure');
  const coverage = await readDoc('docs/evidence/b08/coverage.txt');
  assert.match(coverage, /^ℹ all files\s*\|/m, 'coverage.txt records the overall coverage row');

  const b09Tests = await readDoc(historical.b09.tests_log);
  assert.match(b09Tests, new RegExp(`^ℹ tests ${historical.b09.tests_passed}$`, 'm'));
  assert.match(b09Tests, new RegExp(`^ℹ pass ${historical.b09.tests_passed}$`, 'm'));
  assert.match(b09Tests, new RegExp(`^ℹ fail ${historical.b09.tests_failed}$`, 'm'));
});
