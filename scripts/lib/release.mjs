import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { loadKnowledge, validateKnowledge } from './knowledge.mjs';
import { checkReleaseChronology } from './chronology.mjs';
import { loadValidators } from './schemas.mjs';
import { readContained, stableJson, sha256, walkFiles, writeTree } from './io.mjs';
import { validateFrontmatter, validateReferences } from './bundle.mjs';
import { effectiveStatus } from './effective-status.mjs';
import { resolvePlaceholders } from './placeholders.mjs';
import { assertNoHandWrittenCanonicalFacts, assertNoRetiredEndpoints, assertTraceableUrls } from './canonical-facts.mjs';

const generated = '<!-- GENERATED — DO NOT EDIT. Change canonical authoring or knowledge. -->\n\n';
const byId = (key) => (a, b) => a[key].localeCompare(b[key], 'en');

// Each skill selects exactly one generated artifact set (skill.schema.json enforces a single
// choice). Every artifact set provides the skill's knowledge snapshot plus its references.
const artifactSnapshots = {
  'network-profiles': 'data/network-claims.json',
  coverage: 'data/qie-a-z.json',
  operational: 'data/network-claims.json',
  ecosystem: 'data/ecosystem-catalogue.json',
};
const artifactReserved = {
  'network-profiles': ['references/network-mainnet.md', 'references/network-testnet.md'],
  coverage: ['references/qie-a-z.md', 'references/routing.md'],
  operational: ['references/evidence.md'],
  ecosystem: ['references/catalogue.md', 'references/compatibility.md'],
};

// The one shared status projection for a release. Every published view — the
// catalogue, the compatibility matrix, the coverage map, the network profiles,
// the selected-evidence pages and the installed knowledge snapshot — reads the
// value produced here, so no view can disagree with another about a support
// verdict. The projection is evaluated once, against the frozen build clock,
// with the non-promoting evaluator: a stored status can be preserved or
// downgraded, never promoted.
function projectStatus(records, builtAt) {
  return records.map((record) => {
    const projection = effectiveStatus(record, { now: builtAt, offline: true });
    return {
      ...record,
      effective_status: projection.status,
      effective_status_reason: projection.reason,
    };
  });
}

function selectSnapshot(data, skill) {
  const builtAt = data.release.built_at;
  const claims = projectStatus(
    data.claims.filter((c) => skill.claim_ids.includes(c.claim_id)).sort(byId('claim_id')),
    builtAt,
  );
  const capabilities = projectStatus(
    data.capabilities.filter((c) => skill.capability_ids.includes(c.capability_id)).sort(byId('capability_id')),
    builtAt,
  );
  const domains = data.domains.filter((d) => skill.domain_ids.includes(d.domain_id)).sort(byId('domain_id'));
  for (const domain of domains) {
    if (domain.capability_ids.some((id) => !skill.capability_ids.includes(id))) throw new Error('Selected domain capability is missing from skill selectors');
  }
  const sourceIds = new Set([...claims, ...capabilities, ...domains].flatMap((r) => r.source_ids));
  const testIds = new Set([...claims, ...capabilities].flatMap((r) => r.evidence_test_ids).concat(domains.flatMap((d) => d.validation_test_ids)));
  return {
    schema_version: data.release.schema_version,
    status_evaluated_at: builtAt,
    claims, capabilities, domains,
    sources: data.sources.filter((s) => sourceIds.has(s.source_id)).sort(byId('source_id')),
    validation_runs: data.validationRuns.filter((r) => testIds.has(r.test_id)).sort(byId('test_id')),
    policy: data.policy,
  };
}

function skillCatalogue(data) {
  return [...data.skills].sort(byId('skill_id')).map((skill) => ({
    skill_id: skill.skill_id,
    release_tier: skill.release_tier,
    enabled_for_release: skill.enabled_for_release,
    domain_ids: [...skill.domain_ids].sort(),
    logical_handoffs: [...skill.logical_handoffs].sort(),
    generated_references: [...skill.generated_references],
    recipe_paths: [...skill.recipe_paths].sort(),
  }));
}

function networkReference(snapshot, network) {
  const claims = snapshot.claims.filter((c) => c.network_id === network);
  const required = ['chain_id', 'rpc_url', 'explorer_url'];
  if (required.some((p) => claims.filter((c) => c.predicate === p).length !== 1)) {
    throw new Error(`Network profile requires one unambiguous ${required.join(', ')}: ${network}`);
  }
  // Stored and effective status are published side by side, so a reader can
  // see both what the canonical record says and what this build projects.
  const rows = claims.map((claim) => `| ${claim.predicate} | ${String(claim.value).replaceAll('|', '\\|').replaceAll('\n', ' ')} | ${claim.status} | **${claim.effective_status}** | ${claim.source_ids.join(', ')} |`);
  const sources = snapshot.sources.map((s) => `- [${s.source_id}: ${s.title}](${s.url})`);
  return generated + `# ${network}\n\nPublished configuration only. No live RPC or compatibility test has run.\n\n| Property | Published value | Stored evidence | Effective status | Source |\n|---|---|---|---|---|\n${rows.join('\n')}\n\n${sources.join('\n')}\n\nThese values do not prove the active chain. Follow the [preflight checklist](preflight.md) before operational use.\n`;
}

// Published status is derived from the canonical skill catalogue (enabled_for_release),
// never assumed from the presence of an entry_skill reference in a domain record.
function skillState(catalogue, skillId) {
  const entry = catalogue.find((s) => s.skill_id === skillId);
  if (!entry) return 'planned; not a published artifact';
  return entry.enabled_for_release ? 'published in this release' : 'catalogued; not published in this release';
}

function coverageReference(snapshot, catalogue) {
  const sourceIndex = new Map(snapshot.sources.map((s) => [s.source_id, s]));
  const effective = (cap) => cap.effective_status;
  const sections = snapshot.domains.map((domain) => {
    const sources = domain.source_ids.map((id) => {
      const source = sourceIndex.get(id);
      return `[${source.source_id}: ${source.title}](${source.url}) (${source.trust_tier})`;
    });
    const entry = domain.entry_skill ? `\`${domain.entry_skill}\` (${skillState(catalogue, domain.entry_skill)})` : 'none in this release';
    let planned = 'none';
    if (domain.planned_skill && domain.planned_skill === domain.entry_skill) planned = 'same as entry skill';
    else if (domain.planned_skill) planned = `\`${domain.planned_skill}\` (${skillState(catalogue, domain.planned_skill)})`;
    const gaps = domain.missing_information.map((line) => `  - ${line}`).join('\n');
    return `## ${domain.domain_id} — ${domain.title}\n\n`
      + `- User intents: ${domain.user_intents.join('; ')}\n`
      + `- Navigation scope: ${domain.network_scope.join(', ')}\n`
      + `- Coverage level: ${domain.coverage_level}; verification status: ${domain.verification_status}\n`
      + `- Entry skill: ${entry}; planned skill: ${planned}\n`
      + `- Sources: ${sources.join('; ')}\n`
      + `- Known gaps:\n${gaps}\n`;
  });
  const capabilities = snapshot.capabilities.map((cap) => {
    const networks = cap.network_ids.length ? cap.network_ids.join(', ') : 'unscoped (network unknown)';
    const limitations = cap.limitations.map((line) => `  - ${line}`).join('\n');
    return `### ${cap.capability_id}: ${cap.tool_id} — ${cap.operation}\n\n`
      + `- Effective status: **${effective(cap)}** (stored: ${cap.status}); networks: ${networks}; tool version: ${cap.tool_version_range ?? 'UNKNOWN'}\n`
      + `- Limitations:\n${limitations}\n`;
  });
  return generated + '# QIE A–Z coverage map\n\n'
    + 'This map is navigation derived from the canonical catalogue, not tested support. '
    + 'Statuses use the canonical vocabulary (VERIFIED, DOCUMENTED, CLAIMED, UNKNOWN, CONFLICTED, STALE, UNSUPPORTED, DEPRECATED) and never upgrade because this file exists. '
    + 'A skill labelled `published in this release` is an installable release artifact that may still be missing from the local installation; '
    + 'a skill labelled `catalogued; not published in this release` or `planned; not a published artifact` is NOT installable and must never be offered as a release artifact or read as a local path.\n\n'
    + `## Domains\n\n${sections.join('\n')}`
    + `\n## Catalogued capabilities\n\n${capabilities.join('\n')}`;
}

function routingReference(snapshot, catalogue) {
  const intentRows = snapshot.domains.map((domain) => {
    const skillId = domain.entry_skill ?? domain.planned_skill;
    const route = skillId ? `\`${skillId}\` (${skillState(catalogue, skillId)})` : 'none in this release';
    return `| ${domain.user_intents.join('; ')} | ${domain.domain_id} ${domain.title} | ${route} |`;
  });
  const handoffIds = new Set(catalogue.map((s) => s.skill_id).concat(snapshot.domains.map((d) => d.planned_skill).filter(Boolean)));
  const handoffRows = [...handoffIds].sort().map((skillId) => {
    const entry = catalogue.find((s) => s.skill_id === skillId);
    const bound = snapshot.domains.filter((d) => d.entry_skill === skillId || d.planned_skill === skillId).map((d) => d.domain_id);
    const tier = entry ? entry.release_tier : '—';
    return `| \`${skillId}\` | ${tier} | ${skillState(catalogue, skillId)} | ${bound.join(', ')} |`;
  });
  return generated + '# QIE intent routing table\n\n'
    + 'Derived from the canonical catalogue. Select the minimal set of routes for the task; do not load every domain. '
    + 'A route labelled `published in this release` is an installable release artifact: when it is missing from the local installation, '
    + 'install it from the same QIE Forge source this bundle came from (for example `skills add <qie-forge-source> --skill <skill-name>`), '
    + 'or use `--skill \'*\'` for the full published suite, replacing `<qie-forge-source>` with that source. '
    + 'A route labelled `catalogued; not published in this release` or `planned; not a published artifact` is NOT installable: '
    + 'never offer it as a release artifact, never imply that installing it is possible, never read it as a local path, '
    + 'and continue with this bundle\'s coverage map and source URLs. Never fabricate a missing skill\'s procedure.\n\n'
    + `## Intent to domain routes\n\n| Catalogued intent | Domain | Route |\n|---|---|---|\n${intentRows.join('\n')}\n\n`
    + `## Skill handoffs\n\n| Skill | Tier | Catalogue state | Bound domains |\n|---|---|---|---|\n${handoffRows.join('\n')}\n`;
}

// Presentation metadata for the canonical category vocabulary declared in
// knowledge/schema/common.schema.json. Only titles and scope descriptions live
// here. Category MEMBERSHIP is never derived from this map (or by substring
// matching on identifiers): it comes from each canonical capability record's
// `category` field, and every displayed status comes from the canonical record
// projected through the shared effective-status evaluator. This map must not
// assert support statuses or product-specific operational facts.
const categoryPresentation = {
  networks: {
    title: 'Networks & Chain Identity',
    description: 'Published chain identity, RPC endpoints, explorers, and legacy chain-ID resolution for QIE EVM networks.',
  },
  wallets: {
    title: 'Wallets & Injected Providers',
    description: 'Browser wallets, injected EIP-1193 providers, and connection libraries for interaction with QIE EVM networks.',
  },
  frameworks: {
    title: 'Smart Contract Development & Deployment',
    description: 'Frameworks and tooling for building, compiling, testing, and deploying Solidity contracts to QIE.',
  },
  identity: {
    title: 'Identity & Authentication',
    description: 'Identity and authentication products announced for the QIE ecosystem; programmatic interfaces remain unconfirmed.',
  },
  explorers: {
    title: 'Explorers & Contract Verification',
    description: 'Block explorers and programmatic contract source-code verification.',
  },
  defi: {
    title: 'Decentralized Finance & Swaps',
    description: 'Decentralized exchanges, liquidity pools, and lending interfaces in the QIE ecosystem.',
  },
  bridges: {
    title: 'Cross-Chain Bridges & Conversion',
    description: 'Cross-chain token transfer interfaces; contract-level bridge and conversion mechanics remain unverified.',
  },
  oracles: {
    title: 'Oracles & Asset Feeds',
    description: 'On-chain price feeds and oracle contracts documented for asset valuation on QIE.',
  },
  indexing: {
    title: 'Indexing & Historical Data',
    description: 'Event indexing, subgraph hosting, and historical state querying solutions.',
  },
  'native-cosmos': {
    title: 'Native Cosmos & Validator Operations',
    description: 'Native Cosmos SDK operations, validator delegation, and governance proposals.',
  },
};

function catalogueReference(snapshot) {
  const sourceIndex = new Map(snapshot.sources.map((s) => [s.source_id, s]));
  const formatSource = (id) => {
    const s = sourceIndex.get(id);
    return s ? `[${s.source_id}: ${s.title}](${s.url}) (${s.trust_tier})` : id;
  };

  // Effective status is a non-promoting projection evaluated against the frozen
  // build clock; a stored status can only be preserved or downgraded here.
  const effective = (cap) => cap.effective_status;
  const sortedCapabilities = [...snapshot.capabilities].sort(byId('capability_id'));
  for (const cap of sortedCapabilities) {
    if (!Object.hasOwn(categoryPresentation, cap.category)) {
      throw new Error(`Unknown canonical category for capability ${cap.capability_id}: ${cap.category}`);
    }
  }

  const networksOf = (cap) => (cap.network_ids.length ? cap.network_ids.join(', ') : 'unscoped (network unknown)');

  const overviewRows = sortedCapabilities.map((cap) => (
    `| \`${cap.capability_id}\` | \`${cap.tool_id}\` | \`${cap.operation}\` | ${categoryPresentation[cap.category].title} | ${networksOf(cap)} | **${effective(cap)}** | ${cap.limitations[0].replaceAll('|', '\\|')} |`
  ));

  const categorySections = Object.keys(categoryPresentation).map((categoryId) => {
    const caps = sortedCapabilities.filter((cap) => cap.category === categoryId);
    const capList = caps.length
      ? caps.map((cap) => `- \`${cap.capability_id}\` (\`${cap.tool_id}\`, \`${cap.operation}\`): **${effective(cap)}** — ${cap.limitations[0] || 'No limitations recorded.'}`).join('\n')
      : '- No capability entries in this category in the canonical snapshot.';
    return `### ${categoryPresentation[categoryId].title}\n\n${categoryPresentation[categoryId].description}\n\n**Canonical capabilities:**\n${capList}\n`;
  }).join('\n');

  // Published network facts are projections of the canonical claim records
  // selected into this bundle; the renderer never restates endpoints itself.
  const claimRows = [...snapshot.claims]
    .sort((a, b) => a.network_id.localeCompare(b.network_id, 'en') || a.predicate.localeCompare(b.predicate, 'en'))
    .map((claim) => `| \`${claim.network_id}\` | \`${claim.predicate}\` | \`${String(claim.value)}\` | ${claim.status} | **${claim.effective_status}** | ${claim.source_ids.map(formatSource).join(', ')} |`);
  const claimSourceIds = [...new Set(snapshot.claims.flatMap((c) => c.source_ids))].sort();
  const blocking = sortedCapabilities.filter((cap) => ['DEPRECATED', 'CONFLICTED'].includes(cap.status));
  const blockingList = blocking.map((cap) => {
    const stored = cap.effective_status === cap.status ? '' : `, stored \`${cap.status}\``;
    return `- \`${cap.capability_id}\` (**${cap.effective_status}**${stored}, \`${cap.tool_id}\`): ${cap.limitations[0]}`;
  }).join('\n');
  const nativeCaps = sortedCapabilities.filter((cap) => cap.category === 'native-cosmos');
  const nativeSourceIds = [...new Set(nativeCaps.flatMap((cap) => cap.source_ids))].sort();
  const nativeSources = nativeSourceIds.map((id) => sourceIndex.get(id)).filter(Boolean)
    .map((s) => `[${s.source_id}: ${s.title}](${s.url})`).join('; ');

  const sourcesList = snapshot.sources.map((s) => `- [${s.source_id}: ${s.title}](${s.url}) (${s.trust_tier}) — ${s.publisher}, reviewed ${s.reviewed_at}`).join('\n');

  return generated + '# QIE Ecosystem Catalogue\n\n'
    + 'Published tools, frameworks, products and integration interfaces across the QIE ecosystem.\n\n'
    + '> [!IMPORTANT]\n'
    + '> **Evidence Invariant:** Documentation is not execution proof. A product\'s existence on GitHub or a website does not prove its programmatic integration works on QIE. '
    + '> Statuses are derived from primary evidence and follow canonical semantics: `VERIFIED`, `DOCUMENTED`, `CLAIMED`, `UNKNOWN`, `CONFLICTED`, `STALE`, `UNSUPPORTED`, `DEPRECATED`. '
    + '> Every status below is the canonical record projected through the bundled effective-status evaluator at build time; it can never be upgraded by this file. '
    + '> Generic EVM compatibility is never accepted as proof of QIE compatibility. '
    + '> Consult the [Ecosystem Decision Guide](decision-guide.md) and [Compatibility Matrix](compatibility.md) before writing integration code.\n\n'
    + '## Operation-Scoped Compatibility Overview\n\n'
    + 'One row per canonical capability record (Tool + Operation + Network + Evidence). '
    + 'There is no product-wide compatibility verdict anywhere in this release.\n\n'
    + '| Capability | Tool | Operation | Category | Network(s) | Effective Status | Primary Limitation |\n'
    + '|---|---|---|---|---|---|---|\n'
    + overviewRows.join('\n') + '\n\n'
    + '## Category Details\n\n'
    + 'Category membership is the explicit canonical `category` association on each capability record, never substring matching on identifiers.\n\n'
    + categorySections + '\n'
    + '## Published Network Profiles\n\n'
    + 'The values below are projections of the canonical claim records selected into this bundle. '
    + 'They are published (DOCUMENTED) configuration, not live-verified network facts; no RPC endpoint in this release has been contacted.\n\n'
    + '| Network | Property | Published value | Stored status | Effective status | Source |\n'
    + '|---|---|---|---|---|---|---|\n'
    + claimRows.join('\n') + '\n\n'
    + `Claim sources: ${claimSourceIds.map(formatSource).join('; ')}.\n\n`
    + 'Native Cosmos chain identity and denominations are registry facts, not EVM claims; they are published by the native-layer sources of the canonical native capabilities below and are never mixed into the EVM profiles:\n\n'
    + (nativeSources ? `- Native layer sources: ${nativeSources}\n` : '- No native-layer sources are selected into this bundle.\n')
    + (blockingList ? `\n## Deprecated & Conflicted Chain Identities\n\n${blockingList}\n` : '')
    + '\n## Address Publication Policy\n\n'
    + 'The canonical address inventory in this release is empty. No ecosystem contract address — DEX router, factory, pool, token, oracle, bridge, or conversion precompile — is published or recommended by this catalogue. '
    + 'An explorer page, a source-verified listing, or nonempty bytecode never establishes issuer identity, ABI correspondence, or product ownership; see the release address-identity blocker in the [Ecosystem Decision Guide](decision-guide.md).\n\n'
    + '## Primary Sources and Provenance\n\n'
    + sourcesList + '\n\n'
    + 'Refer to [Release information](release-info.md) for build timestamp and review freshness.\n';
}

function compatibilityReference(snapshot) {
  const sourceIndex = new Map(snapshot.sources.map((s) => [s.source_id, s]));
  const formatSource = (id) => {
    const s = sourceIndex.get(id);
    return s ? `[${s.source_id}: ${s.title}](${s.url})` : id;
  };
  // One shared projection for every developer-facing status view. The stored
  // status is preserved for provenance, but it never substitutes for the
  // effective status in a summary table or card verdict.
  const effective = (cap) => cap.effective_status;

  const rows = snapshot.capabilities.map((cap) => {
    const nets = cap.network_ids.length ? cap.network_ids.join(', ') : 'unscoped';
    const ver = cap.tool_version_range ?? 'UNKNOWN';
    const limit = cap.limitations.length ? cap.limitations[0].replaceAll('|', '\\|') : 'None';
    const srcs = cap.source_ids.join(', ');
    return `| \`${cap.capability_id}\` | \`${cap.tool_id}\` | \`${cap.operation}\` | ${nets} | ${ver} | \`${cap.status}\` | **${effective(cap)}** | ${limit} | ${srcs} |`;
  });

  const cards = snapshot.capabilities.map((cap) => {
    const nets = cap.network_ids.length ? cap.network_ids.join(', ') : 'unscoped (network unknown)';
    const ver = cap.tool_version_range ?? 'UNKNOWN';
    const limits = cap.limitations.map((l) => `  - ${l}`).join('\n');
    const srcs = cap.source_ids.map((id) => `  - ${formatSource(id)}`).join('\n');
    return `### ${cap.capability_id}: ${cap.tool_id} — ${cap.operation}\n\n`
      + `- **Stored Status**: \`${cap.status}\`\n`
      + `- **Effective Status**: \`${cap.effective_status}\` — ${cap.effective_status_reason}\n`
      + `- **Network Scope**: ${nets}\n`
      + `- **Tool Version**: \`${ver}\`\n`
      + `- **Evidence Type**: \`${cap.evidence_type}\`\n`
      + `- **Checked At**: \`${cap.checked_at ?? 'UNKNOWN'}\`\n`
      + `- **Limitations & Prerequisites**:\n${limits}\n`
      + `- **Sources**:\n${srcs}\n`;
  });

  return generated + '# QIE Compatibility Matrix\n\n'
    + 'Operation-specific, network-specific, and version-specific compatibility classifications for the QIE ecosystem.\n\n'
    + '> [!IMPORTANT]\n'
    + '> **Granularity Requirement:** Compatibility is never evaluated as a blanket product property. '
    + '> Each entry reflects **Tool + Version + Operation + Network + Evidence**. '
    + '> Stored status is the canonical evidence record. Effective status is that record projected through the bundled non-promoting evaluator at the frozen build clock, so an expired or unverifiable record cannot keep a positive summary verdict. '
    + '> Statuses cannot be upgraded without verified execution evidence. '
    + '> For decision workflows and refusal rules, read the [Ecosystem Decision Guide](decision-guide.md) and [Ecosystem Catalogue](catalogue.md).\n\n'
    + '## Compatibility Summary Table\n\n'
    + '| Capability ID | Tool | Operation | Network(s) | Version | Stored Status | Effective Status | Primary Limitation | Sources |\n'
    + '|---|---|---|---|---|---|---|---|---|\n'
    + rows.join('\n') + '\n\n'
    + '## Detailed Capability Entries\n\n'
    + cards.join('\n') + '\n'
    + '## Evidence Freshness\n\n'
    + 'Effective statuses above were evaluated at the release build clock recorded in [Release information](release-info.md). '
    + 'When capability status is `UNKNOWN` or effective status is `STALE`, coding agents must refuse to treat the operation as supported and guide the developer through testnet verification.\n';
}

async function skillFiles(root, data, skill) {
  const [artifact] = skill.generated_references;
  if (!Object.hasOwn(artifactSnapshots, artifact)) throw new Error(`Unknown generated reference artifact: ${artifact}`);
  const snapshot = selectSnapshot(data, skill);
  const entry = await readContained(root, skill.source_entry);
  validateFrontmatter(entry, skill.skill_id);
  // Authored content describes the QIE ecosystem, so every absolute URL in it
  // is a claim about QIE and must be traceable to canonical data. A stale or
  // invented endpoint fails the build here, before it can be published.
  assertTraceableUrls(entry, data, { label: `${skill.skill_id}/SKILL.md`, scope: 'all' });
  assertNoRetiredEndpoints(entry, { label: `${skill.skill_id}/SKILL.md` });
  assertNoHandWrittenCanonicalFacts(entry, data, { label: `${skill.skill_id}/SKILL.md`, builtAt: data.release.built_at });
  // The entry is authored content too, so its canonical facts are resolved
  // from the same snapshot as its reference files.
  const resolvedEntry = resolvePlaceholders(entry, { snapshot, builtAt: data.release.built_at, label: `${skill.skill_id}/SKILL.md` });
  const files = { 'SKILL.md': resolvedEntry.replace(/\n$/, '') + '\n\n' + generated.trim() + '\n' };
  const sourceDirectory = path.posix.dirname(skill.source_entry);
  const reserved = [...artifactReserved[artifact], 'references/release-info.md'];
  for (const relative of await walkFiles(path.join(root, sourceDirectory))) {
    if (relative === path.posix.basename(skill.source_entry)) continue;
    if (!relative.startsWith('references/')) throw new Error(`Unexpected authoring file: ${relative}`);
    if (reserved.includes(relative)) {
      throw new Error(`Reserved generated reference: ${relative}`);
    }
    const label = `${skill.skill_id}/${relative}`;
    const authored = await readContained(root, `${sourceDirectory}/${relative}`);
    assertTraceableUrls(authored, data, { label, scope: 'all' });
    assertNoRetiredEndpoints(authored, { label });
    assertNoHandWrittenCanonicalFacts(authored, data, { label, builtAt: data.release.built_at });
    files[relative] = generated + resolvePlaceholders(authored, { snapshot, builtAt: data.release.built_at, label });
  }
  for (const helper of skill.helper_paths) {
    files[helper] = '// GENERATED — DO NOT EDIT. Change canonical helper sources.\n' + await readContained(root, helper);
  }
  // Recipes keep their relative tree, including local assets. This is a bounded
  // file selector, not a workflow runtime or a second knowledge registry.
  for (const recipe of skill.recipe_paths) {
    await readContained(root, recipe);
    const directory = path.posix.dirname(recipe);
    for (const relative of await walkFiles(path.join(root, directory))) {
      const destination = `${directory}/${relative}`;
      if (Object.hasOwn(files, destination)) throw new Error(`Recipe file collision: ${destination}`);
      const content = await readContained(root, destination);
      files[destination] = relative.endsWith('.md') ? generated + content : content;
    }
  }
  const catalogue = skillCatalogue(data);
  for (const cap of snapshot.capabilities) {
    if (cap.recipe_path && !Object.hasOwn(files, cap.recipe_path)) throw new Error(`Missing skill-local recipe: ${cap.recipe_path}`);
  }
  const snapshotPath = artifactSnapshots[artifact];
  if (artifact === 'network-profiles') {
    files[snapshotPath] = stableJson(snapshot);
    files['references/network-mainnet.md'] = networkReference(snapshot, 'qie-mainnet');
    files['references/network-testnet.md'] = networkReference(snapshot, 'qie-testnet');
  } else if (artifact === 'coverage') {
    files[snapshotPath] = stableJson({ ...snapshot, skills: catalogue });
    files['references/qie-a-z.md'] = coverageReference(snapshot, catalogue);
    files['references/routing.md'] = routingReference(snapshot, catalogue);
  } else if (artifact === 'ecosystem') {
    files[snapshotPath] = stableJson(snapshot);
    files['references/catalogue.md'] = catalogueReference(snapshot);
    files['references/compatibility.md'] = compatibilityReference(snapshot);
  } else {
    // Reuse the network snapshot location expected by the proven B06 helpers,
    // without forcing network-profile or A–Z pages onto topical recipes.
    files[snapshotPath] = stableJson(snapshot);
    const claims = snapshot.claims.map((c) => `| ${c.claim_id} | ${c.value} | ${c.status} | **${c.effective_status}** | ${c.source_ids.join(', ')} |`);
    const caps = snapshot.capabilities.map((c) => (
      `- ${c.capability_id}: effective ${c.effective_status} (stored ${c.status}); operation ${c.operation}; networks ${c.network_ids.join(', ') || 'UNKNOWN'}; version ${c.tool_version_range ?? 'UNKNOWN'}. ${c.limitations.join(' ')}`
    ));
    files['references/evidence.md'] = generated + '# Selected evidence and compatibility\n\n'
      + 'Published QIE configuration is DOCUMENTED, not a live result. Local recipe replay and mock wallet tests do not establish QIE interoperability. Read effective freshness before operational use; UNKNOWN capabilities block supported write recommendations.\n\n'
      + `| Claim | Published value | Stored status | Effective status | Source |\n|---|---|---|---|---|\n${claims.join('\n')}\n\n`
      + caps.join('\n') + '\n\n'
      + snapshot.sources.map((s) => `- [${s.source_id}: ${s.title}](${s.url}) (${s.trust_tier})`).join('\n') + '\n';
  }
  const reviews = snapshot.sources.map((s) => s.reviewed_at);
  const metadata = { ...data.release, sources_checked_at: reviews.length && reviews.every(Boolean) ? [...reviews].sort()[0] : null };
  if (metadata.sources_checked_at && Date.parse(metadata.sources_checked_at) > Date.parse(metadata.built_at)) {
    throw new Error(`Derived sources_checked_at must not follow built_at: ${skill.skill_id}`);
  }
  files['references/release-info.md'] = generated + `# Release information\n\nRelease: ${metadata.release_version}\n\nSchema: ${metadata.schema_version}\n\nBuilt: ${metadata.built_at}\n\nSources reviewed: ${metadata.sources_checked_at ?? 'UNKNOWN'}\n\nEffective statuses in this bundle were evaluated at the build timestamp above with no live check. Build time is not a live test timestamp. This is an immutable local snapshot until explicitly reinstalled or updated. No provider or RPC compatibility is certified.\n`;
  // Every published document must be traceable to canonical data: a QIE
  // endpoint that no canonical record attests, or an endpoint this release has
  // retired, fails the build instead of being shipped.
  for (const [file, text] of Object.entries(files)) {
    if (!file.endsWith('.md')) continue;
    assertTraceableUrls(text, data, { label: `${skill.skill_id}/${file}`, scope: 'qie' });
    assertNoRetiredEndpoints(text, { label: `${skill.skill_id}/${file}` });
  }
  validateReferences(files);
  const manifest = {
    ...metadata, generated: true, skill_id: skill.skill_id,
    knowledge_sha256: sha256(files[snapshotPath]), policy_sha256: sha256(stableJson(data.policy)),
    snapshot_path: snapshotPath,
    files: Object.keys(files).sort().map((file) => ({ path: file, sha256: sha256(files[file]) })),
  };
  files['MANIFEST.json'] = stableJson(manifest);
  return files;
}

async function comparePublished(root, outputs) {
  const expected = Object.fromEntries(Object.entries(outputs).flatMap(([skill, files]) => Object.entries(files).map(([file, text]) => [`${skill}/${file}`, text])));
  const directory = path.join(root, 'skills');
  let names;
  try { names = await walkFiles(directory); } catch { throw new Error('Published skills are missing; run npm run build'); }
  if (JSON.stringify(Object.keys(expected).sort()) !== JSON.stringify(names.sort())) throw new Error('Generated publication inventory has drifted');
  for (const [file, content] of Object.entries(expected)) {
    if (await readFile(path.join(directory, file), 'utf8') !== content) throw new Error(`Generated publication drift: ${file}`);
  }
}

export async function buildRelease(root, { check = false, now } = {}) {
  const data = await loadKnowledge(root);
  checkReleaseChronology(data, { now: now === undefined ? new Date() : now });
  await validateKnowledge(data, path.join(root, 'knowledge/schema'), now === undefined ? {} : { now });
  const validate = await loadValidators(path.join(root, 'knowledge/schema'));
  const enabled = data.skills.filter((s) => s.enabled_for_release);
  if (!enabled.length) throw new Error('No skill is enabled for release');
  const outputs = Object.fromEntries(await Promise.all(enabled.map(async (skill) => [skill.skill_id, await skillFiles(root, data, skill)])));
  for (const files of Object.values(outputs)) validate('manifest', JSON.parse(files['MANIFEST.json']));
  if (check) await comparePublished(root, outputs);
  else {
    const flattened = Object.fromEntries(Object.entries(outputs).flatMap(([id, files]) => Object.entries(files).map(([file, text]) => [`${id}/${file}`, text])));
    await writeTree(path.join(root, 'dist/skills'), flattened);
    await writeTree(path.join(root, 'skills'), flattened);
  }
  return outputs;
}
