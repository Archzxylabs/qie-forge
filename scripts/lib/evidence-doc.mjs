// Renders the B08 capability evidence catalogue directly from canonical
// knowledge records. Every identifier, version, status, source ID and
// limitation in the output is copied from knowledge/capabilities.yaml via the
// loaded snapshot; no total, classification or compatibility statement is
// authored here. Consumed by scripts/generate-evidence-doc.mjs and by the
// cross-artifact consistency tests.

const generated = '<!-- GENERATED from canonical knowledge records — DO NOT EDIT. Change knowledge/capabilities.yaml and regenerate. -->\n\n';

const categoryTitles = {
  networks: 'Networks & Chain Identity',
  wallets: 'Wallets & Injected Providers',
  frameworks: 'Smart Contract Development & Deployment',
  identity: 'Identity & Authentication',
  explorers: 'Explorers & Contract Verification',
  defi: 'Decentralized Finance & Swaps',
  bridges: 'Cross-Chain Bridges & Conversion',
  oracles: 'Oracles & Asset Feeds',
  indexing: 'Indexing & Historical Data',
  'native-cosmos': 'Native Cosmos & Validator Operations',
};

export const statusOrder = ['VERIFIED', 'DOCUMENTED', 'CLAIMED', 'UNKNOWN', 'CONFLICTED', 'STALE', 'UNSUPPORTED', 'DEPRECATED'];

export function statusCounts(capabilities) {
  const counts = Object.fromEntries(statusOrder.map((status) => [status, 0]));
  for (const cap of capabilities) counts[cap.status] += 1;
  return counts;
}

const cell = (value) => String(value ?? 'null').replaceAll('|', '\\|');

export function renderCapabilityCatalogue(data, release = data.release) {
  const capabilities = [...data.capabilities].sort((a, b) => a.capability_id.localeCompare(b.capability_id, 'en'));
  const counts = statusCounts(capabilities);
  const countLine = statusOrder.map((status) => `\`${status}\`: ${counts[status]}`).join(', ');

  const rows = capabilities.map((cap) => (
    `| \`${cell(cap.capability_id)}\` | \`${cell(cap.tool_id)}\` | \`${cell(cap.operation)}\` | \`${cell(cap.category)}\` | ${cell(cap.network_ids.join(', ') || 'unscoped')} | ${cell(cap.tool_version_range)} | \`${cap.status}\` | ${cell(cap.evidence_type)} | ${cell(cap.source_ids.join(', '))} | ${cell(cap.limitations.join(' '))} |`
  ));

  const byCategory = new Map();
  for (const cap of capabilities) {
    if (!byCategory.has(cap.category)) byCategory.set(cap.category, []);
    byCategory.get(cap.category).push(cap);
  }
  const categoryRows = [...byCategory.entries()]
    .sort((a, b) => a[0].localeCompare(b[0], 'en'))
    .map(([category, caps]) => {
      const summary = statusOrder.filter((status) => caps.some((c) => c.status === status))
        .map((status) => `\`${status}\`: ${caps.filter((c) => c.status === status).length}`).join(', ');
      return `| \`${category}\` | ${categoryTitles[category] ?? category} | ${caps.length} | ${summary} |`;
    });

  return generated
    + '# QIE Forge B08 Capability Catalogue & Compatibility Classification\n\n'
    + `Total capabilities: ${capabilities.length} (derived from \`knowledge/capabilities.yaml\`; release \`${release.release_version}\`, schema \`${release.schema_version}\`).\n\n`
    + `Status distribution (computed, not copied): ${countLine}.\n\n`
    + 'Every capability remains non-VERIFIED: no live, reviewed, non-mock execution evidence exists in `knowledge/validation-runs.yaml` (the runtime-evidence inventory is empty).\n\n'
    + '---\n\n'
    + '## 1. Capability Breakdown\n\n'
    + 'One row per canonical capability record. Tool IDs, operations, categories, network scopes, version ranges, statuses, evidence types, source IDs and limitations are verbatim canonical values; `null` versions and empty scopes are preserved as recorded.\n\n'
    + '| Capability ID | Tool ID | Operation | Category | Networks | Version | Status | Evidence Type | Sources | Limitations & Prerequisites |\n'
    + '|---|---|---|---|---|---|---|---|---|---|\n'
    + rows.join('\n') + '\n\n'
    + '## 2. Category Distribution\n\n'
    + 'Category membership is the explicit canonical `category` field on each capability record.\n\n'
    + '| Category | Title | Capabilities | Status summary |\n'
    + '|---|---|---|---|\n'
    + categoryRows.join('\n') + '\n\n'
    + '## 3. Granularity & Integrity Compliance\n\n'
    + '- **Tool/Product + Version + Operation + Network + Evidence**: every row evaluates exactly one atomic operation for one tool; no blanket product verdict exists.\n'
    + '- **Status vocabulary**: only the canonical enum values are used, and they are never upgraded by this document.\n'
    + '- **Versions**: `null` is preserved where the canonical record has no reviewed version evidence; no version range is invented.\n'
    + '- **Sources**: every listed source ID resolves against `knowledge/sources.yaml`; per-claim citations live in the canonical records, not here.\n'
    + '- **Address identity**: the canonical address inventory is empty; no contract address is published or recommended by this catalogue, and bytecode or explorer listings never establish issuer/ABI/product identity.\n'
    + '- **Evidence separation**: documentation evidence, mocked/local testing, and live QIE Mainnet verification are distinct classes; this catalogue contains documentation evidence only.\n';
}
