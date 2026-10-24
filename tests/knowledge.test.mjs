import test from 'node:test';
import assert from 'node:assert/strict';
import { loadKnowledge, validateKnowledge } from '../scripts/lib/knowledge.mjs';
import { loadValidators } from '../scripts/lib/schemas.mjs';
import { projectRoot, schemaRoot } from './support/fixtures.mjs';

const baseline = await loadKnowledge(projectRoot);
const validate = await loadValidators(schemaRoot);
// The knowledge validator is exercised against a fixed clock: the suite must
// not depend on the wall clock of the machine that runs it. The real-clock
// behaviour of the release cut is covered by tests/chronology.test.mjs.
//
// The frozen clock is derived from the canonical records themselves — the
// latest recorded event plus one minute — rather than pinned to a literal
// instant. A pinned instant silently breaks every fixture the moment the
// release is legitimately re-cut, which is exactly the failure mode the
// release-cut gate exists to expose. Deriving it keeps the fixture frozen
// (the same input always yields the same clock) while staying valid for any
// truthful release cut.
const FROZEN_CLOCK = new Date(Math.max(
  Date.parse(baseline.release.built_at),
  ...baseline.sources.map((source) => Date.parse(source.reviewed_at)),
) + 60_000).toISOString();
const verify = (data) => validateKnowledge(data, schemaRoot, { now: FROZEN_CLOCK });

test('inventory covers D01–D15 without inventing tested capabilities or addresses', async () => {
  await verify(baseline);
  assert.equal(baseline.domains.length, 15);
  assert.deepEqual(baseline.domains.map((d) => d.domain_id), Array.from({ length: 15 }, (_, i) => `D${String(i + 1).padStart(2, '0')}`));
  assert.ok(baseline.domains.every((d) => d.source_ids.length && d.missing_information.length));
  assert.ok(baseline.capabilities.every((c) => c.status !== 'VERIFIED'));
  assert.ok(baseline.capabilities.some((c) => c.status === 'DOCUMENTED'));
  assert.ok(baseline.capabilities.some((c) => c.status === 'UNKNOWN'));
  assert.ok(baseline.addresses.length >= 1, 'published candidates are retained as non-verified discovery records');
  assert.ok(baseline.addresses.every((address) => ['CLAIMED', 'CONFLICTED', 'UNKNOWN'].includes(address.status)));
  assert.equal(baseline.validationRuns.length, 0);
  assert.ok(baseline.integrations.length >= 10, 'integration records provide operational protocol knowledge');
  assert.ok(baseline.integrations.every((integration) => integration.execution_allowed === false));
  assert.deepEqual(baseline.capabilities.find((c) => c.capability_id === 'native-delegate').network_ids, []);
});

test('catalogue binds the router to released skills and router-entry domains', async () => {
  const router = baseline.skills.find((s) => s.skill_id === 'qie');
  assert.ok(router, 'qie router is catalogued');
  assert.ok(router.enabled_for_release);
  assert.deepEqual(router.domain_ids, baseline.domains.map((d) => d.domain_id));
  assert.deepEqual(router.generated_references, ['coverage']);
  for (const domain of baseline.domains.filter((d) => d.entry_skill === 'qie')) {
    assert.ok(['D01', 'D12'].includes(domain.domain_id), `router is the entry only where declared: ${domain.domain_id}`);
  }
  assert.ok(baseline.skills.every((s) => s.generated_references.length === 1));
});

test('release context is never built before its sources were reviewed', async () => {
  const changed = structuredClone(baseline);
  changed.release.built_at = '2020-01-01T00:00:00Z';
  await assert.rejects(verify(changed), /built_at precedes the review timestamp/);
});

test('release-cut chronology rejects future build and source-review timestamps', async () => {
  // The clock is frozen, so every offset below is deterministic.
  const clock = FROZEN_CLOCK;
  const at = (minutes) => new Date(Date.parse(clock) + minutes * 60_000).toISOString();

  const futureBuild = structuredClone(baseline);
  futureBuild.release.built_at = at(60);
  await assert.rejects(
    validateKnowledge(futureBuild, schemaRoot, { now: clock }),
    /built_at is in the future/,
  );

  const toleratedSkew = structuredClone(baseline);
  toleratedSkew.release.built_at = at(3);
  await validateKnowledge(toleratedSkew, schemaRoot, { now: clock });

  const futureReview = structuredClone(baseline);
  futureReview.release.built_at = at(-1);
  futureReview.sources[0].reviewed_at = at(10);
  await assert.rejects(
    validateKnowledge(futureReview, schemaRoot, { now: clock }),
    /reviewed_at is in the future/,
  );

  const unknownReview = structuredClone(baseline);
  unknownReview.sources[0].reviewed_at = null;
  await validateKnowledge(unknownReview, schemaRoot, { now: clock });
});

for (const status of ['VERIFIED_LIVE', 'CONFIRMED_TESTED', 'OFFICIALLY_DOCUMENTED', 'UNVERIFIED', 'PASS']) {
  test(`rejects obsolete or outcome-as-status value ${status}`, () => {
    assert.throws(() => validate('claim', { ...baseline.claims[0], status }), /enum|allowed/);
    assert.throws(() => validate('capability', { ...baseline.capabilities[0], status }), /enum|allowed/);
  });
}

const cases = [
  ['missing source', (d) => { d.claims[0].source_ids = ['S99']; }, /Missing source/],
  ['duplicate source identity', (d) => { d.sources.push(d.sources[0]); }, /Duplicate sources/],
  ['missing domain', (d) => { d.domains.pop(); }, /Missing domain/],
  ['missing selected claim', (d) => { d.skills[0].claim_ids.push('missing'); }, /Missing selected claim/],
  ['unknown network identifier', (d) => { d.claims[0].network_id = 'ethereum'; }, /allowed/],
  ['invalid documented chain ID', (d) => { d.claims[0].value = -1; }, /must be >= 1/],
  ['invalid documented RPC URL', (d) => { d.claims.find((c) => c.predicate === 'rpc_url').value = 'http://unsafe.example'; }, /pattern/],
  ['invalid source timestamp', (d) => { d.sources[0].reviewed_at = 'not-a-timestamp'; }, /format|pattern/],
  ['ambiguous YAML example field alias', (d) => { d.claims[0].id = d.claims[0].claim_id; delete d.claims[0].claim_id; }, /required|additional/],
  ['marketing-only documented operation', (d) => { d.capabilities[0] = { ...d.capabilities[0], status: 'DOCUMENTED', source_ids: ['S01'], evidence_type: 'OFFICIAL_DOC' }; }, /technical primary/],
  ['unsafe freshness policy', (d) => { d.policy.require_live_check_for_writes = false; }, /constant/],
  ['reversed status precedence', (d) => { d.policy.status_precedence.reverse(); }, /constant/],
  ['mismatched release schema', (d) => { d.release.schema_version = '2.0.0'; }, /schema versions differ/],
  ['handwritten aggregate source check', (d) => { d.release.sources_checked_at = d.release.built_at; }, /sources_checked_at is derived/],
  ['missing generated reference artifact', (d) => { delete d.skills[0].generated_references; }, /required/],
  ['unknown generated reference artifact', (d) => { d.skills[0].generated_references = ['bogus']; }, /enum|allowed/],
  ['multiple generated reference artifacts', (d) => { d.skills[0].generated_references = ['coverage', 'network-profiles']; }, /maxItems|more than/],
  ['expiry before checked evidence', (d) => { d.claims[0].checked_at = d.release.built_at; d.claims[0].expires_at = '2020-01-01T00:00:00Z'; }, /expiry/],
  ['unproven verified capability', (d) => { d.capabilities[0].status = 'VERIFIED'; }, /minItems|type|allowed/],
];
for (const [name, mutate, expected] of cases) {
  test(`rejects ${name}`, async () => {
    const changed = structuredClone(baseline);
    mutate(changed);
    await assert.rejects(verify(changed), expected);
  });
}

function withVerifiedClaim() {
  const data = structuredClone(baseline);
  const claim = data.claims[0];
  const version = 'test-client-1.0.0';
  data.claims[0] = { ...claim, status: 'VERIFIED', evidence_type: 'CHAIN_OBSERVATION',
    evidence_test_ids: ['test-chain-id'], checked_at: '2026-01-01T00:00:00Z',
    expires_at: '2026-01-02T00:00:00Z', version_scope: version };
  data.validationRuns = [{ test_id: 'test-chain-id', scope: { kind: 'CHAIN_OBSERVATION', operation: claim.predicate },
    network_id: claim.network_id, tool_version: version, expected: claim.value, observed: claim.value,
    outcome: 'PASS', checked_at: '2026-01-01T00:00:00Z', artifact_hash: 'a'.repeat(64),
    redacted_log_pointer: null, reviewer: 'synthetic-test-reviewer' }];
  return data;
}

test('accepts a synthetic operation/network/version-matched verified evidence fixture', async () => {
  await verify(withVerifiedClaim());
});
for (const [name, mutate] of [
  ['mock-only evidence', (d) => { d.validationRuns[0].scope.kind = 'MOCK'; }],
  ['wrong network', (d) => { d.validationRuns[0].network_id = 'qie-testnet'; }],
  ['wrong operation', (d) => { d.validationRuns[0].scope.operation = 'unrelated'; }],
  ['wrong version', (d) => { d.validationRuns[0].tool_version = 'other'; }],
  ['failed evidence', (d) => { d.validationRuns[0].outcome = 'FAIL'; }],
  ['missing human review', (d) => { d.validationRuns[0].reviewer = null; }],
  ['unrelated observed value', (d) => { d.validationRuns[0].observed = 1; }],
  ['unrelated matched expected/observed values', (d) => { d.validationRuns[0].expected = 1; d.validationRuns[0].observed = 1; }],
  ['local replay labelled chain observation', (d) => { d.validationRuns[0].scope.kind = 'LOCAL_REPLAY'; }],
  ['check timestamp newer than evidence', (d) => { d.claims[0].checked_at = '2026-01-01T01:00:00Z'; }],
]) {
  test(`rejects promotion from ${name}`, async () => {
    const data = withVerifiedClaim(); mutate(data);
    await assert.rejects(verify(data), /matched PASS evidence/);
  });
}

test('rejects address identity inferred from code presence alone', async () => {
  const data = withVerifiedClaim();
  data.addresses = [{ address: '0x' + '1'.repeat(40), chain_id: 1990, claimed_product: 'fixture-only',
    issuer_source_ids: [], abi_source_ids: [], code_observation: { network_id: 'qie-mainnet',
      code_present: true, checked_at: '2026-01-01T00:00:00Z', evidence_test_id: 'test-chain-id' },
    status: 'VERIFIED', checked_at: '2026-01-01T00:00:00Z', expires_at: '2026-01-02T00:00:00Z' }];
  await assert.rejects(verify(data), /bytecode alone/);
});
