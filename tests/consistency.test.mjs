import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { loadKnowledge } from '../scripts/lib/knowledge.mjs';
import { renderCapabilityCatalogue, statusCounts, statusOrder } from '../scripts/lib/evidence-doc.mjs';
import { projectRoot } from './support/fixtures.mjs';

// Cross-artifact consistency and adversarial regression tests for the B08
// independent-audit remediation. Every checker below is exercised both against
// the real repository and against deliberately injected contradictions, so a
// future drift in source IDs, URLs, network facts, statuses, categories,
// reported counts, or address evidence fails the suite.

const baseline = await loadKnowledge(projectRoot);
const historical = JSON.parse(await readFile(path.join(projectRoot, 'tests/fixtures/historical-releases.json'), 'utf8'));
const readDoc = (relative) => readFile(path.join(projectRoot, relative), 'utf8');

function parseLedgerSources(markdown) {
  const found = new Map();
  for (const match of markdown.matchAll(/^\| \*\*(S\d+)\*\* \| `([^`]+)` \|/gm)) {
    if (found.has(match[1])) throw new Error(`Duplicate ledger row: ${match[1]}`);
    found.set(match[1], match[2]);
  }
  return found;
}

function diffLedgerAgainstCanonical(canonicalSources, ledgerSources) {
  const problems = [];
  for (const [id, url] of canonicalSources) {
    if (!ledgerSources.has(id)) problems.push(`missing ledger row: ${id}`);
    else if (ledgerSources.get(id) !== url) problems.push(`${id}: ledger URL ${ledgerSources.get(id)} != canonical ${url}`);
  }
  for (const id of ledgerSources.keys()) {
    if (!canonicalSources.has(id)) problems.push(`ledger row without canonical source: ${id}`);
  }
  return problems;
}

function parseReportedCounts(markdown) {
  const counts = new Map();
  for (const match of markdown.matchAll(/^\s*\| (VERIFIED|DOCUMENTED|CLAIMED|UNKNOWN|CONFLICTED|STALE|UNSUPPORTED|DEPRECATED) \| (\d+) \|$/gm)) {
    counts.set(match[1], Number(match[2]));
  }
  return counts;
}

function diffReportedCounts(computed, reported) {
  const problems = [];
  for (const status of statusOrder) {
    if (!reported.has(status)) problems.push(`reported table is missing ${status}`);
    else if (reported.get(status) !== computed[status]) problems.push(`${status}: reported ${reported.get(status)} != computed ${computed[status]}`);
  }
  for (const status of reported.keys()) {
    if (!statusOrder.includes(status)) problems.push(`reported unknown status: ${status}`);
  }
  return problems;
}

test('source ledger identities match canonical knowledge/sources.yaml exactly', async () => {
  const ledger = parseLedgerSources(await readDoc('docs/evidence/b08/source-ledger.md'));
  // B08 is preserved historical evidence; new research belongs to the active
  // inventory rather than rewriting that report.
  const canonical = new Map(baseline.sources
    .filter((source) => Number(source.source_id.slice(1)) <= 21)
    .map((s) => [s.source_id, s.url]));
  assert.deepEqual(diffLedgerAgainstCanonical(canonical, ledger), []);
  // S19 must carry the complete, discoverable store URL (extension identifier).
  assert.match(canonical.get('S19'), /oljchdcgmibnjbbopolafbjncfhdacjb$/);
});

test('adversarial: swapped or rewritten source IDs are detected', async () => {
  const canonical = new Map(baseline.sources.map((s) => [s.source_id, s.url]));
  const swapped = new Map(canonical);
  const s12 = swapped.get('S12');
  const s15 = swapped.get('S15');
  swapped.set('S12', s15);
  swapped.set('S15', s12);
  assert.ok(diffLedgerAgainstCanonical(canonical, swapped).length >= 2, 'S12/S15 swap is detected');

  const truncated = new Map(canonical);
  truncated.delete('S21');
  assert.match(diffLedgerAgainstCanonical(canonical, truncated).join('\n'), /missing ledger row: S21/);

  const relabelled = new Map(canonical);
  relabelled.set('S08', relabelled.get('S09'));
  assert.match(diffLedgerAgainstCanonical(canonical, relabelled).join('\n'), /S08/);
});

test('reported capability counts in b08-results.md equal computed canonical counts', async () => {
  const computed = statusCounts(baseline.capabilities);
  assert.equal(baseline.capabilities.length, 25);
  assert.deepEqual(computed, {
    VERIFIED: 0, DOCUMENTED: 9, CLAIMED: 2, UNKNOWN: 9, CONFLICTED: 1, STALE: 0, UNSUPPORTED: 2, DEPRECATED: 2,
  });
  const reported = parseReportedCounts(await readDoc('docs/b08-results.md'));
  assert.deepEqual(diffReportedCounts(computed, reported), []);
});

test('adversarial: an inflated or deflated reported count is detected', async () => {
  const computed = statusCounts(baseline.capabilities);
  const forged = new Map(Object.entries(computed));
  forged.set('DOCUMENTED', computed.DOCUMENTED + 2);
  forged.set('UNKNOWN', computed.UNKNOWN - 1);
  const problems = diffReportedCounts(computed, forged);
  assert.match(problems.join('\n'), /DOCUMENTED/);
  assert.match(problems.join('\n'), /UNKNOWN/);
});

test('b08 evidence catalogue is generated from canonical records without drift', async () => {
  const expected = renderCapabilityCatalogue(baseline, historical.b08);
  const actual = await readDoc('docs/evidence/b08/capability-catalogue.md');
  assert.equal(actual, expected, 'run: npm run docs:generate');
});

test('b08 evidence catalogue preserves canonical statuses, identifiers, and versions', async () => {
  const doc = await readDoc('docs/evidence/b08/capability-catalogue.md');
  assert.match(doc, /\| `explorer-verification-api` \| `qie-explorer` \| `verify_contract_api` \| `explorers` \| qie-mainnet, qie-testnet \| null \| `UNKNOWN` \|/);
  assert.doesNotMatch(doc, /\^2\.22\.0|\^2\.0\.0/, 'no invented tool version ranges');
  assert.doesNotMatch(doc, /\| `json-rpc` \||\| `blockscout` \||\| `subgraph` \||\| `cosmos-sdk` \||\| `eip-1193` \||\| `evm-toolchain` \|/, 'canonical tool identifiers only');
  assert.doesNotMatch(doc, /swap_exact_tokens|eth_chainId\b|verify_source_code|request_accounts/, 'canonical operations only');
  assert.doesNotMatch(doc, /mainnet\.qiescan\.org|rpc-main1\.qie\.digital/, 'no non-canonical endpoints');
  assert.match(doc, /Status distribution \(computed, not copied\): `VERIFIED`: 0, `DOCUMENTED`: 9, `CLAIMED`: 2, `UNKNOWN`: 9, `CONFLICTED`: 1, `STALE`: 0, `UNSUPPORTED`: 2, `DEPRECATED`: 2\./);
});

test('adversarial: forged evidence-catalogue rows are detected by regeneration drift', async () => {
  const canonical = renderCapabilityCatalogue(baseline, historical.b08);
  const forged = canonical.replace('| `explorer-verification-api` | `qie-explorer` | `verify_contract_api` | `explorers` | qie-mainnet, qie-testnet | null | `UNKNOWN` |',
    '| `explorer-verification-api` | `qie-explorer` | `verify_contract_api` | `explorers` | qie-mainnet, qie-testnet | null | `DOCUMENTED` |');
  assert.notEqual(forged, canonical);
  assert.notEqual(forged, renderCapabilityCatalogue(baseline, historical.b08), 'a status forgery diverges from canonical regeneration');
});

test('generated and authored ecosystem artifacts contain no unsupported network or operational facts', async () => {
  const files = {
    'authoring/qie-ecosystem/references/decision-guide.md': await readDoc('authoring/qie-ecosystem/references/decision-guide.md'),
    'skills/qie-ecosystem/references/catalogue.md': await readDoc('skills/qie-ecosystem/references/catalogue.md'),
    'skills/qie-ecosystem/references/compatibility.md': await readDoc('skills/qie-ecosystem/references/compatibility.md'),
    'skills/qie-ecosystem/references/decision-guide.md': await readDoc('skills/qie-ecosystem/references/decision-guide.md'),
  };
  const forbidden = [
    /rpc-main1\.qie\.digital/,
    /rpc-testnet\.qie\.digital/,
    /qiescan\.org/,
    /--fees 20000000000000000aqie/,
    /2,000–5,000 blocks/,
    /0\.8\.28/,
    /0xD4949664cD82660AaE99bEdc034a0deA8A0bd517/,
  ];
  for (const [name, text] of Object.entries(files)) {
    for (const pattern of forbidden) {
      assert.doesNotMatch(text, pattern, `${name} must not contain ${pattern}`);
    }
  }
  // Canonical values must be present where network configuration is published.
  // The authored guide renders them from canonical placeholders, so the
  // placeholder tokens are expected there; the published guide carries the
  // rendered canonical values.
  assert.match(files['authoring/qie-ecosystem/references/decision-guide.md'], /\{\{claim:qie-mainnet:rpc_url\}\}/, 'authored guide uses the canonical mainnet RPC placeholder');
  assert.match(files['authoring/qie-ecosystem/references/decision-guide.md'], /\{\{claim:qie-testnet:rpc_url\}\}/, 'authored guide uses the canonical testnet RPC placeholder');
  for (const name of ['skills/qie-ecosystem/references/decision-guide.md', 'skills/qie-ecosystem/references/catalogue.md']) {
    assert.match(files[name], /https:\/\/rpc1mainnet\.qie\.digital\//, `${name} publishes the canonical mainnet RPC`);
    assert.match(files[name], /https:\/\/rpc1testnet\.qie\.digital\//, `${name} publishes the canonical testnet RPC`);
  }
});

test('b08-results.md uses canonical source IDs and statuses for its evidence claims', async () => {
  const doc = await readDoc('docs/b08-results.md');
  assert.match(doc, /Remix IDE deployment guide \(`S21`\)/);
  assert.doesNotMatch(doc, /Remix IDE deployment guide \(`S12`\)/);
  assert.match(doc, /Oracle contract tables \(`S12`\)/);
  assert.match(doc, /Native delegation \(`S13`\)|delegation \(`S13`\)/);
  assert.match(doc, /Governance proposals \(`S14`\)/);
  assert.match(doc, /`explorer-verification-api` \(`qie-explorer`, `verify_contract_api`, Mainnet\/Testnet\): `UNKNOWN`/);
  assert.doesNotMatch(doc, /`explorer-verification-api` \(`blockscout`|verify_source_code/);
});

test('adversarial: knowledge source identity mutations fail validation or drift checks', async () => {
  const changed = structuredClone(baseline);
  changed.sources.find((s) => s.source_id === 'S12').url = 'https://example.invalid/remix';
  const canonical = new Map(baseline.sources.map((s) => [s.source_id, s.url]));
  const mutated = new Map(changed.sources.map((s) => [s.source_id, s.url]));
  assert.ok(diffLedgerAgainstCanonical(canonical, mutated).length > 0, 'a rewritten canonical URL diverges from the ledger');

  // A capability citing a source ID that no longer resolves must fail validation.
  const { validateKnowledge } = await import('../scripts/lib/knowledge.mjs');
  const broken = structuredClone(baseline);
  broken.capabilities.find((c) => c.capability_id === 'qie-oracle-price-feed').source_ids = ['S15-oracle'];
  await assert.rejects(validateKnowledge(broken, path.join(projectRoot, 'knowledge/schema')), /Missing source/);
});

test('capability category tampering in canonical data is detected against frozen expectations', async () => {
  const changed = structuredClone(baseline);
  changed.capabilities.find((c) => c.capability_id === 'qiedex-web-swap').category = 'native-cosmos';
  const placement = (data, id) => data.capabilities.find((c) => c.capability_id === id).category;
  assert.notEqual(placement(changed, 'qiedex-web-swap'), placement(baseline, 'qiedex-web-swap'),
    'a QIEDex reclassification away from defi is a detectable drift');
  assert.equal(placement(baseline, 'qiedex-web-swap'), 'defi');
  assert.equal(placement(baseline, 'dex-swap'), 'defi');
  assert.equal(placement(baseline, 'indexer-query'), 'indexing');
});

// The final independent audit (F-FINAL-01) found the milestone documents
// restating release and review dates that canonical data did not support.
// These checks pin the historical documents to the explicit B08 record rather
// than the active cut, so a new local release does not rewrite old evidence.
test('milestone documents state the canonical release cut and source review times', async () => {
  const builtAt = historical.b08.built_at;
  const latestReview = historical.b08.latest_source_reviewed_at;

  const results = await readDoc('docs/b08-results.md');
  assert.ok(results.includes(builtAt), 'b08-results.md states the canonical release cut');
  assert.ok(results.includes(latestReview), 'b08-results.md states the latest canonical source review');

  const ledger = await readDoc('docs/evidence/b08/source-ledger.md');
  assert.ok(ledger.includes(latestReview), 'the source ledger states the latest canonical source review');

  const remediation = await readDoc('docs/b08-remediation-results.md');
  assert.ok(remediation.includes(historical.b08.s21_reviewed_at), 'the remediation report states the recorded S21 review time');
});

test('adversarial: a milestone document claiming a date canonical data does not support is detected', async () => {
  const builtAt = historical.b08.built_at;
  const results = await readDoc('docs/b08-results.md');
  assert.ok(!results.includes('2026-10-20T08:00:00Z'),
    'the superseded future release cut is gone from the milestone report');
  assert.ok(results.includes(builtAt), 'the canonical cut is the one the report must state');

  // A timestamp after the release cut may only appear as the reproduced
  // defect it was — never as a fact about this release.
  const defectNarration = /reproduced|recorded|claimed|later than|future|superseded|defect/i;
  const cut = Date.parse(builtAt);
  for (const document of ['docs/b08-results.md', 'docs/b08-remediation-results.md', 'docs/evidence/b08/source-ledger.md']) {
    const text = await readDoc(document);
    for (const line of text.split('\n')) {
      for (const match of line.matchAll(/\b(20\d{2}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z)\b/g)) {
        if (Date.parse(match[1]) <= cut) continue;
        assert.match(line, defectNarration,
          `${document} may only quote a post-cut timestamp as a reproduced defect: ${match[1]}`);
      }
    }
  }
});
