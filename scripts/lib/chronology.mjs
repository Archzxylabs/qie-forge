// Release-cut chronology gate.
//
// A release timestamp is a provenance claim about real time, not a formatting
// choice. This gate compares the recorded release cut and every source review
// timestamp against the real wall clock, so a release can never claim to have
// been built — or to have reviewed a source — in the future.
//
// This module is the single implementation of that rule. The deterministic
// knowledge validators call it with an injected clock, so frozen fixtures
// never depend on real time, and the release path calls it with the actual
// system clock, so the real-world gate is always exercised. There is one
// tolerance constant and one set of messages.
//
// A small clock-skew tolerance absorbs benign drift between the machine that
// records a timestamp and the machine that cuts the release. It is documented
// rather than hidden, and it is far smaller than the multi-hour offsets this
// gate exists to catch.

export const CLOCK_SKEW_TOLERANCE_MS = 5 * 60 * 1000;

function toMillis(value) {
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Date.parse(value);
  return Number.NaN;
}

// Collects every chronology problem instead of throwing, so a caller can
// report all of them at once. An empty list means the recorded timeline is
// grounded in the observed clock.
export function collectChronologyProblems(data, { now = new Date(), toleranceMs = CLOCK_SKEW_TOLERANCE_MS } = {}) {
  const observed = toMillis(now);
  if (!Number.isFinite(observed)) throw new Error('Release chronology needs a valid evaluation clock');
  const limit = observed + toleranceMs;
  const observedIso = new Date(observed).toISOString();

  const problems = [];
  const builtAt = toMillis(data.release?.built_at);
  if (!Number.isFinite(builtAt)) {
    problems.push(`Release built_at is not a valid timestamp: ${data.release?.built_at ?? 'missing'}`);
  } else if (builtAt > limit) {
    problems.push(`Release built_at is in the future: the recorded cut ${data.release.built_at} is later than the observed release clock ${observedIso}`);
  }

  for (const source of data.sources ?? []) {
    // A null review time is an explicit "not yet reviewed" marker, allowed by
    // the source schema. It is not a timestamp, so it can neither be in the
    // future nor postdate the release cut; the affected operation stays
    // conservative instead.
    if (source.reviewed_at === null || source.reviewed_at === undefined) continue;
    const reviewedAt = toMillis(source.reviewed_at);
    if (!Number.isFinite(reviewedAt)) {
      problems.push(`Source ${source.source_id} has an invalid reviewed_at: ${source.reviewed_at}`);
      continue;
    }
    if (reviewedAt > limit) {
      problems.push(`Source ${source.source_id} reviewed_at is in the future: the recorded review ${source.reviewed_at} is later than the observed release clock ${observedIso}`);
    }
    if (Number.isFinite(builtAt) && reviewedAt > builtAt) {
      problems.push(`Release built_at precedes the review timestamp of source ${source.source_id}: the recorded review ${source.reviewed_at} is after the release cut ${data.release.built_at}`);
    }
  }

  return problems;
}

export function checkReleaseChronology(data, options = {}) {
  const problems = collectChronologyProblems(data, options);
  if (problems.length) {
    throw new Error(`Release chronology is not grounded in real time:\n- ${problems.join('\n- ')}`);
  }
  return true;
}
