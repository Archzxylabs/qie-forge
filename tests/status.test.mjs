import test from 'node:test';
import assert from 'node:assert/strict';
import { effectiveStatus } from '../scripts/lib/effective-status.mjs';

const record = { status: 'VERIFIED', risk_level: 'critical', checked_at: '2026-01-01T00:00:00Z', expires_at: '2026-01-03T00:00:00Z' };
test('unexpired verified fixture remains verified only in supplied online context', () => {
  assert.equal(effectiveStatus(record, { now: '2026-01-02T00:00:00Z', offline: false }).status, 'VERIFIED');
});
test('a frozen historical installation becomes stale without changing its stored record', () => {
  assert.equal(effectiveStatus(record, { now: '2026-01-03T00:00:00Z' }).status, 'STALE');
  assert.equal(record.status, 'VERIFIED');
});
test('offline high-risk evidence cannot establish current verified freshness', () => {
  assert.equal(effectiveStatus(record, { now: '2026-01-02T00:00:00Z' }).status, 'UNKNOWN');
});
test('unknown clock and missing validity never produce verified freshness', () => {
  assert.equal(effectiveStatus(record, { offline: false }).status, 'UNKNOWN');
  assert.equal(effectiveStatus({ ...record, expires_at: null }, { now: 0 }).status, 'UNKNOWN');
});
test('invalid validity metadata and future checks never establish fresh evidence', () => {
  const context = { now: '2026-01-02T00:00:00Z', offline: false };
  assert.equal(effectiveStatus({ ...record, expires_at: 'invalid' }, context).status, 'UNKNOWN');
  assert.equal(effectiveStatus({ ...record, checked_at: '2026-01-02T01:00:00Z' }, context).status, 'UNKNOWN');
});
for (const status of ['DOCUMENTED','CLAIMED','UNKNOWN','CONFLICTED','STALE','UNSUPPORTED','DEPRECATED']) {
  test(`does not promote or hide ${status}`, () => {
    assert.equal(effectiveStatus({ status }, { now: '2026-01-02T00:00:00Z' }).status, status);
  });
}
