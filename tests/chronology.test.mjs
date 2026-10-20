import test from 'node:test';
import assert from 'node:assert/strict';
import { checkReleaseChronology, CLOCK_SKEW_TOLERANCE_MS } from '../scripts/lib/chronology.mjs';
import { loadKnowledge, validateKnowledge } from '../scripts/lib/knowledge.mjs';
import { projectRoot, schemaRoot } from './support/fixtures.mjs';

const baseline = await loadKnowledge(projectRoot);
// The frozen clock is derived from the canonical records — the latest recorded
// event plus one minute — instead of being pinned to a literal instant. A
// pinned instant breaks every fixture the moment the release is legitimately
// re-cut; deriving it keeps the fixture deterministic and valid for any
// truthful release cut.
const clock = new Date(Math.max(
  Date.parse(baseline.release.built_at),
  ...baseline.sources.map((source) => Date.parse(source.reviewed_at)),
) + 60_000).toISOString();
const at = (minutes) => new Date(Date.parse(clock) + minutes * 60_000).toISOString();

test('chronology gate rejects events grounded after the observed release clock', () => {
  const futureBuild = structuredClone(baseline);
  futureBuild.release.built_at = at(10);
  assert.throws(() => checkReleaseChronology(futureBuild, { now: clock }), /built_at.*later than the observed release clock/u);

  const futureReview = structuredClone(baseline);
  futureReview.release.built_at = clock;
  futureReview.sources[0].reviewed_at = at(30);
  assert.throws(() => checkReleaseChronology(futureReview, { now: clock }), /later than the observed release clock/u);

  const reviewedAfterCut = structuredClone(baseline);
  reviewedAfterCut.release.built_at = at(-10);
  reviewedAfterCut.sources[0].reviewed_at = at(-5);
  assert.throws(() => checkReleaseChronology(reviewedAfterCut, { now: clock }), /after the release cut/u);

  const invalidBuild = structuredClone(baseline);
  invalidBuild.release.built_at = 'not-a-timestamp';
  assert.throws(() => checkReleaseChronology(invalidBuild, { now: clock }), /not a valid timestamp/u);

  const invalidReview = structuredClone(baseline);
  invalidReview.sources[0].reviewed_at = 'not-a-timestamp';
  assert.throws(() => checkReleaseChronology(invalidReview, { now: clock }), /invalid reviewed_at/u);

  const invalidClock = structuredClone(baseline);
  assert.throws(() => checkReleaseChronology(invalidClock, { now: 'not-a-clock' }), /needs a valid evaluation clock/u);

  assert.equal(typeof CLOCK_SKEW_TOLERANCE_MS, 'number');
  assert.ok(CLOCK_SKEW_TOLERANCE_MS > 0 && CLOCK_SKEW_TOLERANCE_MS < 15 * 60 * 1000,
    'clock-skew tolerance stays small and documented');
});

test('chronology gate accepts grounded records and tolerated skew', () => {
  assert.equal(checkReleaseChronology(baseline, { now: clock }), true);

  const skewed = structuredClone(baseline);
  skewed.release.built_at = at(3); // inside the tolerance window
  assert.equal(checkReleaseChronology(skewed, { now: clock }), true);

  const unknownReview = structuredClone(baseline);
  unknownReview.sources[0].reviewed_at = null; // unknown review time stays conservative and legal
  assert.equal(checkReleaseChronology(unknownReview, { now: clock }), true);
});

test('frozen-time knowledge fixtures pass with an injected clock, without real-world dependency', async () => {
  const frozen = structuredClone(baseline);
  frozen.release.built_at = at(-30);
  // A deliberately later injected clock must not change any grounded verdict:
  // the validators are pure functions of the records plus the provided clock.
  await validateKnowledge(frozen, schemaRoot, { now: '2027-06-01T00:00:00Z' });
});
