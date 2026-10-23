// GENERATED — DO NOT EDIT. Change canonical helper sources.
// Original, dependency-free status projection. Never promotes a record's evidence.
/**
 * @param {{ status: string, expires_at?: string | null, checked_at?: string | null, risk_level?: string | null }} record
 * @param {{ now?: string | number, offline?: boolean }} [options]
 * @returns {{ status: string, reason: string }}
 */
export function effectiveStatus(record, { now, offline = true } = {}) {
  if (['CONFLICTED', 'DEPRECATED', 'UNSUPPORTED', 'STALE'].includes(record.status)) {
    return { status: record.status, reason: 'Stored blocking or retired evidence state.' };
  }
  const time = typeof now === 'string' ? Date.parse(now) : now;
  if (record.expires_at && Number.isFinite(time) && Date.parse(record.expires_at) <= time) {
    return { status: 'STALE', reason: 'Evidence validity has expired.' };
  }
  if (record.status === 'VERIFIED' && (!record.checked_at || !record.expires_at)) {
    return { status: 'UNKNOWN', reason: 'Verified evidence requires explicit check and expiry metadata.' };
  }
  if (record.status === 'VERIFIED' && !Number.isFinite(time)) {
    return { status: 'UNKNOWN', reason: 'A reliable evaluation clock is unavailable.' };
  }
  if (record.status === 'VERIFIED' && (!Number.isFinite(Date.parse(record.checked_at))
    || !Number.isFinite(Date.parse(record.expires_at))
    || Date.parse(record.checked_at) > time
    || Date.parse(record.expires_at) <= Date.parse(record.checked_at))) {
    return { status: 'UNKNOWN', reason: 'Evidence validity metadata cannot establish freshness.' };
  }
  if (record.status === 'VERIFIED' && offline && ['high', 'critical'].includes(record.risk_level)) {
    return { status: 'UNKNOWN', reason: 'Offline evidence cannot establish current high-risk operational freshness.' };
  }
  return { status: record.status, reason: 'Stored evidence level; no live check or evidence promotion.' };
}
