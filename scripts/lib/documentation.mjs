// Original static documentation projection. Facts and raw files come from the
// verified installed release; this module never edits or promotes that release.
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { inspectInstalledRelease } from './installed-release.mjs';
import { CANONICAL_SKILLS } from './release-contract.mjs';
import { validateFrontmatter } from './bundle.mjs';
import { effectiveStatus } from './effective-status.mjs';
import { sha256, stableJson, walkFiles } from './io.mjs';
import { DOCUMENTATION_CSP } from './documentation-server.mjs';

export const PORTAL_ROUTES = Object.freeze([
  ['/', 'Overview'], ['/get-started/', 'Get started'], ['/skills/', 'Skills'],
  ['/topics/', 'QIE A–Z'], ['/ecosystem/', 'Ecosystem'], ['/recipes/', 'Recipes'],
  ['/reference/networks/', 'Networks'], ['/troubleshooting/', 'Troubleshooting'],
  ['/verification/', 'Verification'], ['/contribute/', 'Contribute'], ['/status/', 'Release status'],
]);

export const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g,
  (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const e = escapeHtml;
const link = (href, label, attrs = '') => `<a href="${e(href)}"${attrs}>${e(label)}</a>`;
const badge = (status) => `<span class="badge" data-state="${e(status)}">${e(status)}</span>`;
const list = (items) => `<ul>${items.map((item) => `<li>${e(item)}</li>`).join('')}</ul>`;
const slug = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const unknown = (value) => value ?? 'UNKNOWN';
const REPOSITORY = 'https://github.com/Archzxylabs/qie-forge';

function safeHref(value) {
  if (value.startsWith('/') && !value.startsWith('//') && !value.includes('\\')) return value;
  if (value.startsWith('#')) return value;
  try { if (new URL(value).protocol === 'https:') return value; } catch { /* relative references are resolved by the caller */ }
  throw new Error('Unsupported documentation link');
}

// A deliberately small renderer for the controlled first-party recipe dialect.
// Raw HTML is always escaped; the original Markdown remains downloadable.
export function renderMarkdown(source, resolveLink = safeHref) {
  const inline = (text) => {
    const pattern = /`([^`]+)`|\[([^\]]+)\]\(([^\s)]+)\)|\*\*([^*]+)\*\*/g;
    let result = ''; let offset = 0;
    for (const match of text.matchAll(pattern)) {
      result += e(text.slice(offset, match.index));
      if (match[1] !== undefined) result += `<code>${e(match[1])}</code>`;
      else if (match[2] !== undefined) result += link(safeHref(resolveLink(match[3])), match[2]);
      else result += `<strong>${e(match[4])}</strong>`;
      offset = match.index + match[0].length;
    }
    return result + e(text.slice(offset));
  };
  const text = source.replace(/^---\n[\s\S]*?\n---\n/, '').replace(/<!-- GENERATED[^]*?-->/g, '');
  const lines = text.split(/\r?\n/); const output = [];
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line.trim()) continue;
    if (/^```/.test(line)) {
      const code = [];
      while (++index < lines.length && !/^```/.test(lines[index])) code.push(lines[index]);
      if (index === lines.length) throw new Error('Unterminated documentation code fence');
      output.push(`<pre class="source-code" tabindex="0" aria-label="Code sample"><code>${e(code.join('\n'))}</code></pre>`); continue;
    }
    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      const level = Math.min(heading[1].length + 1, 6);
      output.push(`<h${level} id="${slug(heading[2])}">${inline(heading[2])}</h${level}>`); continue;
    }
    if (/^\|/.test(line) && /^\|[\s:|-]+\|\s*$/.test(lines[index + 1] ?? '')) {
      const cells = (row, tag) => row.trim().slice(1, -1).split('|').map((cell) => `<${tag}>${inline(cell.trim())}</${tag}>`).join('');
      const rows = []; const header = cells(line, 'th'); index += 1;
      while (index + 1 < lines.length && /^\|/.test(lines[index + 1])) rows.push(`<tr>${cells(lines[++index], 'td')}</tr>`);
      output.push(`<div class="table-scroll" tabindex="0" role="region" aria-label="Scrollable table"><table><thead><tr>${header}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`); continue;
    }
    if (/^[-*]\s/.test(line)) {
      const items = [line.slice(2)];
      while (/^[-*]\s/.test(lines[index + 1] ?? '')) items.push(lines[++index].slice(2));
      output.push(`<ul>${items.map((item) => `<li>${inline(item)}</li>`).join('')}</ul>`); continue;
    }
    if (/^---+$/.test(line)) { output.push('<hr>'); continue; }
    const paragraph = [line];
    while (lines[index + 1]?.trim() && !/^(?:#|```|[-*]\s|\|)/.test(lines[index + 1])) paragraph.push(lines[++index]);
    output.push(`<p>${inline(paragraph.join('\n'))}</p>`);
  }
  return output.join('\n');
}

function command(id, label, text) {
  return `<div class="command"><div class="command-label">${e(label)}</div><pre tabindex="0" aria-label="${e(label)}"><code id="${e(id)}">${e(text)}</code></pre><div class="command-controls"><button type="button" data-copy="${e(id)}" hidden>Copy command</button><span role="status" aria-live="polite"></span></div></div>`;
}

function filterGroup(label, items, { statuses = false } = {}) {
  const values = ['VERIFIED', 'DOCUMENTED', 'CLAIMED', 'UNKNOWN', 'CONFLICTED', 'STALE', 'UNSUPPORTED', 'DEPRECATED'];
  return `<section data-filter-group aria-label="${e(label)}"><div class="filters"><label>Search ${e(label.toLowerCase())}<input type="search" placeholder="Filter by name or task" autocomplete="off"></label>${statuses ? `<label>Effective status<select><option value="">All statuses</option>${values.map((value) => `<option value="${value}">${value}</option>`).join('')}</select></label>` : ''}</div><p class="result-count" data-result-count aria-live="polite">${items.length} results</p><div class="rows">${items.join('')}</div><div class="empty" data-empty hidden><p>No matches. Try a broader search.</p><button type="button" data-reset>Reset filters</button></div></section>`;
}

function searchable(text, body, status = '') {
  return `<article class="entry" data-search="${e(text.toLowerCase())}" data-status="${e(status)}">${body}</article>`;
}

export async function documentationFiles(root) {
  const release = await inspectInstalledRelease(path.join(root, 'skills'), { requireSuite: true, claudeRoot: null });
  if (!release.verificationComplete) throw new Error(`Documentation requires coherent skill bundles: ${release.problems.join('; ')}`);
  const files = {};
  const manifests = new Map(); const snapshots = new Map(); const metadata = new Map(); const bundleFiles = new Map();
  const prefix = `/releases/${release.releaseVersion}/${release.releaseId}`;
  const raw = (skill, filename) => `${prefix}/skills/${skill}/${filename}`;
  const read = (skill, filename) => `/read/${skill}/${filename.replace(/\.md$/, '')}/`;
  const pages = new Map();
  const addPage = (route, title, intro, content) => pages.set(route, { title, intro, content });
  for (const name of CANONICAL_SKILLS) {
    const directory = path.join(root, 'skills', name);
    const names = await walkFiles(directory);
    bundleFiles.set(name, new Set(names));
    for (const filename of names) files[raw(name, filename).slice(1)] = await readFile(path.join(directory, filename));
    const manifest = JSON.parse(files[raw(name, 'MANIFEST.json').slice(1)]);
    manifests.set(name, manifest);
    const snapshot = JSON.parse(files[raw(name, manifest.snapshot_path).slice(1)]);
    snapshots.set(name, snapshot);
    metadata.set(name, validateFrontmatter(files[raw(name, 'SKILL.md').slice(1)].toString(), name));
    for (const collection of ['claims', 'capabilities']) {
      for (const record of snapshot[collection]) {
        const expected = effectiveStatus(record, { now: snapshot.status_evaluated_at, offline: true });
        if (record.effective_status !== expected.status || record.effective_status_reason !== expected.reason) {
          throw new Error('Documentation snapshot status differs from the shared evaluator');
        }
      }
    }
  }
  const router = snapshots.get('qie'); const ecosystem = snapshots.get('qie-ecosystem');
  const network = snapshots.get('qie-networks'); const manifest = manifests.get('qie');
  const sources = new Map(ecosystem.sources.map((source) => [source.source_id, source]));
  const sourceLinks = (ids) => `<div class="source-list">${ids.map((id) => {
    const source = sources.get(id);
    if (!source) throw new Error(`Missing portal source ${id}`);
    return link(safeHref(source.url), `${id} · ${source.title} (${source.trust_tier})`);
  }).join('')}</div>`;
  const projected = (record) => {
    const result = effectiveStatus(record, { now: ecosystem.status_evaluated_at, offline: true });
    return `<div class="evidence"><span>Stored ${badge(record.status)}</span><span>Effective ${badge(result.status)}</span></div><p class="small muted">${e(result.reason)}</p>`;
  };
  const install = 'node /absolute/path/to/QIE-FORGE/scripts/bootstrap-consumer.mjs \\\n  --target /path/to/your-project --agent auto --copy';
  const releaseNote = `<div class="notice"><p><strong>Candidate snapshot.</strong> QIE facts are evaluated at ${e(router.status_evaluated_at)}. Check current sources and run an explicit network preflight before operational use.</p></div>`;

  addPage('/', 'A clearer path to building on QIE.', 'Source-grounded skills, explicit evidence and reproducible workflows for your coding agent.',
    `<div class="columns"><section><p>Start with one task: build and test the original Counter contract locally, then inspect the evidence needed for a QIE deployment.</p><div class="actions">${link('/get-started/', 'Start building', ' class="button"')}${link('/recipes/', 'Explore recipes', ' class="button secondary"')}</div><p class="small muted">Agent setup: Codex · Claude Code · Cursor · OpenCode. Runtime evaluations are scoped in ${link('/status/', 'release status')}.</p></section><section aria-label="Install QIE Forge">${command('install-home', 'From a prepared checkout', install)}<p class="small muted">${link('/get-started/', 'Get the checkout, prerequisites and installation verification.')}</p></section></div>
    <div class="metrics"><div class="metric"><strong>${CANONICAL_SKILLS.length}</strong><span>Self-contained skills</span></div><div class="metric"><strong>${router.domains.length}</strong><span>QIE topic domains</span></div><div class="metric"><strong>${ecosystem.sources.length}</strong><span>Traceable sources</span></div></div>
    <h2>Choose your next task</h2><div class="grid-links">${[
      ['/skills/qie-smart-contracts/', 'Build a contract', 'Pinned Foundry tooling and original Solidity fixtures.'],
      ['/reference/networks/', 'Choose a QIE network', 'Mainnet and testnet settings, with their evidence scope.'],
      ['/ecosystem/', 'Evaluate an integration', 'Operation-specific support, sources and visible gaps.'],
      ['/troubleshooting/', 'Resolve a failure', 'Wrong-chain, unavailable RPC and evidence diagnostics.'],
    ].map(([url, title, description]) => `<a href="${url}"><strong>${title} →</strong><span>${description}</span></a>`).join('')}</div>${releaseNote}`);

  addPage('/get-started/', 'Start with a local, inspectable workflow.', 'Prepare the checkout, install the skills into your project, and give your agent a concrete first task.',
    `<ol class="step-list"><li><h2>Prepare the checkout</h2><p>Use an authorized checkout of ${link(REPOSITORY, 'QIE Forge')}. Checkout access follows repository permissions. Original QIE Forge content is MIT licensed. Install the versions pinned in ${link(`${REPOSITORY}/blob/feat/qie-ecosystem-intelligence/docs/quickstart.md`, 'the developer quickstart')}.</p>${command('prepare', 'In the QIE Forge checkout', 'npm ci --ignore-scripts --no-audit --no-fund\nnpm run doctor\nnpm run build:check')}</li>
    <li><h2>Install into your project</h2><p>The bootstrap uses the pinned Skills CLI and writes managed agent instructions. Preview changes with <code>--dry-run --json</code>. Replace both absolute paths below.</p>${command('install-start', 'Consumer setup', install)}</li>
    <li><h2>Verify the installed bytes</h2><p>Run from your consumer project. Compare with the payload identity shown on this site.</p>${command('verify-install', 'Read-only verification', `node /absolute/path/to/QIE-FORGE/scripts/verify-installed-release.mjs \\\n  --root .agents/skills --expect-suite --release-id ${release.releaseId}`)}</li>
    <li><h2>Ask for the first workflow</h2>${command('first-task', 'Prompt for your coding agent', 'Load the qie skill, then use qie-smart-contracts to build and test the Counter fixture locally. Report the commands and actual results.')}<p>${link(read('qie-smart-contracts', 'recipes/build-test/recipe.md'), 'Open the canonical build/test recipe')} for prerequisites, failure branches and expected local results.</p></li></ol>${releaseNote}`);

  addPage('/skills/', 'One task. The right skill.', 'Nine published bundles, each with its own references, provenance and selected recipes.', filterGroup('Skills', CANONICAL_SKILLS.map((name) => {
    const data = metadata.get(name);
    return searchable(`${name} ${data.description}`, `<header><h2>${link(`/skills/${name}/`, name)}</h2>${badge('PUBLISHED')}</header><p>${e(data.description)}</p><p class="small">${link(read(name, 'SKILL.md'), 'Read skill')} · ${link(raw(name, 'SKILL.md'), 'Raw Markdown')} · ${link(raw(name, 'MANIFEST.json'), 'Manifest')}</p>`);
  })));
  for (const name of CANONICAL_SKILLS) {
    const data = metadata.get(name); const snapshot = snapshots.get(name);
    addPage(`/skills/${name}/`, name, data.description,
      `<p>${e(data.compatibility ?? 'Read the bundled prerequisites before running a workflow.')}</p><div class="actions">${link(read(name, 'SKILL.md'), 'Read the skill', ' class="button"')}${link(raw(name, 'MANIFEST.json'), 'Inspect manifest', ' class="button secondary"')}</div><h2>Scope and compatibility</h2><p>Published format and installation checks are distinct from tested host/model behavior. ${link('/status/', 'See the recorded evaluation boundary')}.</p><h2>Bundled references and recipes</h2>${listLinks([...bundleFiles.get(name)].filter((filename) => filename.endsWith('.md')), (filename) => read(name, filename))}<h2>Capability evidence</h2>${snapshot.capabilities.map((capability) => `<article class="entry"><h3>${e(capability.capability_id)}</h3>${projected(capability)}${list(capability.limitations)}</article>`).join('') || '<p>This router carries navigation and handoffs; use a topical skill for operational evidence.</p>'}`);
  }

  addPage('/topics/', 'QIE, from fundamentals to operations.', 'Coverage and missing evidence are visible for every domain. Planned skills are identified before you try to install them.',
    filterGroup('Topics', router.domains.map((domain) => searchable(`${domain.domain_id} ${domain.title} ${domain.user_intents.join(' ')}`,
      `<header><h2>${e(domain.domain_id)} · ${e(domain.title)}</h2>${badge(domain.verification_status)}</header><p>${e(domain.user_intents.join(' · '))}</p><div class="evidence"><span>Coverage: ${e(domain.coverage_level)}</span><span>${domain.entry_skill ? link(`/skills/${domain.entry_skill}/`, domain.entry_skill) : `${e(domain.planned_skill)} · planned, not published`}</span></div><h3>Known gaps</h3>${list(domain.missing_information)}${sourceLinks(domain.source_ids)}`))));

  addPage('/ecosystem/', 'Choose with the evidence in view.', 'An operation-specific catalogue of QIE tools and services. Documentation and product discovery remain separate from tested runtime support.',
    `${releaseNote}${filterGroup('Ecosystem capabilities', ecosystem.capabilities.map((capability) => searchable(`${capability.tool_id} ${capability.operation} ${capability.capability_id} ${capability.category}`,
      `<header><h2>${e(capability.tool_id)}</h2>${badge(capability.effective_status)}</header><p><code>${e(capability.operation)}</code> · ${e(capability.network_ids.join(', ') || 'Network scope unresolved')}</p>${projected(capability)}<p class="small muted">Version: ${e(unknown(capability.tool_version_range))} · Checked: ${e(unknown(capability.checked_at))} · Expires: ${e(unknown(capability.expires_at))}</p>${list(capability.limitations)}${sourceLinks(capability.source_ids)}`, capability.effective_status)), { statuses: true })}
    <h2>Integration interfaces and operations</h2><p>Execution remains disabled in this candidate's integration catalogue.</p>${ecosystem.integrations.map((integration) => `<details><summary>${e(integration.display_name)} ${badge(integration.status)}</summary><p>${e(integration.description)}</p>${list(integration.known_limitations)}${integration.operations.map((operation) => `<article class="entry"><h3>${e(operation.name)}</h3>${projected(operation)}<p>Execution allowed: <strong>${e(operation.execution_allowed)}</strong></p>${list(operation.limitations)}</article>`).join('')}${sourceLinks(integration.source_ids)}</details>`).join('')}
    <h2>Address identity</h2><p>${ecosystem.addresses.length} address candidates are retained in the raw snapshot. Each requires issuer and ABI provenance plus matching chain evidence before operational use. ${link(raw('qie-ecosystem', manifests.get('qie-ecosystem').snapshot_path), 'Inspect the original candidate records')}.</p>`);

  const recipes = new Map();
  for (const [name, names] of bundleFiles) for (const filename of names) {
    if (filename.startsWith('recipes/') && filename.endsWith('/recipe.md') && !recipes.has(filename)) recipes.set(filename, name);
  }
  addPage('/recipes/', 'Workflows you can inspect and replay.', 'Original recipes with explicit prerequisites, local assets, expected observations and recovery paths.',
    filterGroup('Recipes', [...recipes].map(([filename, name]) => {
      const markdown = files[raw(name, filename).slice(1)].toString();
      const title = markdown.match(/^#\s+(.+)$/m)?.[1] ?? filename;
      return searchable(`${title} ${filename}`, `<header><h2>${link(read(name, filename), title)}</h2></header><p class="small muted">${e(filename)}</p><p>${link(raw(name, filename), 'Raw recipe')} · ${link(`/skills/${name}/`, `Bundled in ${name}`)}</p>`);
    })));

  addPage('/reference/networks/', 'Choose the network explicitly.', 'Published EVM configuration from the same snapshot used by the installed network skill.',
    `${releaseNote}${['qie-testnet', 'qie-mainnet'].map((id) => `<section><h2>${e(id)}</h2><dl>${network.claims.filter((claim) => claim.network_id === id).map((claim) => `<dt>${e(claim.predicate)}</dt><dd><code>${e(claim.value)}</code>${projected(claim)}${sourceLinks(claim.source_ids)}</dd>`).join('')}</dl></section>`).join('')}<h2>Check identity before operational use</h2><p>${link(read('qie-networks', 'recipes/network/recipe.md'), 'Follow the read-only network preflight recipe')}. A response is a scoped observation; use the selected network and stop on a wrong-chain result.</p><h2>Recorded source conflicts</h2>${network.conflicts.map((conflict) => `<article class="entry"><h3>${e(conflict.subject)}</h3>${badge(conflict.state)}<p>${e(conflict.summary)}</p><p>${e(conflict.resolution)}</p>${sourceLinks(conflict.source_ids)}</article>`).join('')}`);

  addPage('/troubleshooting/', 'Start with the failure you observed.', 'Follow a scoped recovery path and preserve the selected network and original evidence.',
    `<p>${link(read('qie-debug', 'recipes/debug/recipe.md'), 'Open the full diagnosis recipe')} for build, wallet, RPC and transaction failures.</p><div class="rows">${[
      ['WRONG_CHAIN', 'The provider reports another chain.', 'Stop, select the intended QIE network in your wallet, and retry deliberately.'],
      ['RPC_UNAVAILABLE', 'The selected endpoint did not respond.', 'Record the endpoint and failure. Retry explicitly or choose another documented endpoint on the same selected network.'],
      ['RPC_RATE_LIMITED', 'The endpoint refused the request budget.', 'Stop repeated requests, respect provider limits, and record an unknown observation.'],
      ['RPC_MALFORMED', 'The response cannot support the requested conclusion.', 'Preserve the response shape and diagnose the provider; do not infer success from missing fields.'],
      ['TX_PENDING / TX_NOT_FOUND', 'A mined receipt is unavailable.', 'Keep the result pending or unknown. Recheck the original hash before considering another submission.'],
      ['TX_REVERTED', 'The observed receipt reports execution failure.', 'Diagnose the original transaction before preparing a new one.'],
      ['ADDRESS_UNVERIFIED', 'A candidate lacks established identity.', 'Resolve issuer, ABI, network and code linkage before preparing an action.'],
      ['SOURCE_STALE', 'The required evidence has expired.', 'Review current primary sources and evidence before restoring trust.'],
      ['USER_APPROVAL_REQUIRED', 'The action needs the developer-controlled signer.', 'Review network, signer, calldata, native value and maximum fee, then approve in the wallet.'],
      ['DEPENDENCY_MISMATCH', 'Installed bundles or tools disagree.', 'Reinstall one reviewed payload and rerun the installed-release verifier.'],
    ].map(([code, cause, recovery]) => `<article class="entry"><h2><code>${code}</code></h2><p>${e(cause)}</p><p>${e(recovery)}</p></article>`).join('')}</div>`);

  addPage('/verification/', 'Every conclusion needs the right evidence.', 'Keep source documentation, local replay, chain observations and application effects in their own scope.',
    `<ol class="step-list"><li><h2>Read the stored and effective status</h2><p>Stored evidence is projected through the shared evaluator at the frozen release clock. Expired or conflicting evidence remains visible. A build does not extend validity.</p></li><li><h2>Reproduce local behavior</h2><p>Build and test the original fixture with pinned tools. A local pass establishes that tested local behavior.</p></li><li><h2>Observe the selected chain</h2><p>Bind network identity, transaction hash, expected contract and the claimed action. Check receipt, code and action-relevant state.</p></li><li><h2>Resolve finality separately</h2><p>QIE finality policy remains unresolved in this candidate. Missing finality evidence keeps full application verification unknown, even when individual observations match.</p></li></ol><h2>Use the canonical recipes</h2><p>${link(read('qie-transactions', 'recipes/transaction-readonly/recipe.md'), 'Read-only transaction observation')} · ${link(read('qie-deployment', 'recipes/deployment/recipe.md'), 'Deployment preparation')}</p><h2>Evidence vocabulary</h2>${list(['DOCUMENTED: scoped source support; runtime testing is separate.', 'CLAIMED: a discovery claim awaiting stronger evidence.', 'UNKNOWN: evidence is insufficient for the requested conclusion.', 'VERIFIED: reviewed evidence must match operation, network and exact version, with explicit validity.', 'STALE / CONFLICTED / UNSUPPORTED / DEPRECATED: retain the blocking or retired evidence state.'])}${releaseNote}`);

  addPage('/contribute/', 'Improve one fact, with its evidence.', 'Contributions start from canonical source records and original authoring, then regenerate and inspect the resulting bundles.',
    `<ol class="step-list"><li><h2>Describe the scope</h2><p>Identify the source, domain, network, tool version and requested operation. Record missing information explicitly.</p></li><li><h2>Change the source</h2><p>Edit <code>knowledge/</code>, <code>authoring/</code> or <code>recipes/</code>. Generated skill bundles and raw portal files come from those reviewed inputs.</p></li><li><h2>Run the gates</h2>${command('contribute-checks', 'From the repository root', 'npm run build:check\nnpm run validate\nnpm run docs:check\nnpm run typecheck\nnpm test\nnpm run site:build\nnpm run test:site')}</li><li><h2>Submit reviewable evidence</h2><p>Include relevant source links, expected and observed results, actual test output and any limitations. ${link(`${REPOSITORY}/pulls`, 'Open pull requests')} provide the review surface.</p></li></ol><h2>Security disclosure</h2><p>A dedicated private reporting channel and triage owner remain unresolved. Keep sensitive findings out of public issues; use an owner-approved private channel before sharing details. Never include keys, seed phrases, credentials or private prompts.</p><h2>Publication policy</h2><p>Original QIE Forge code and documentation use the MIT license. Third-party dependencies retain their own licenses. Public distribution and actual host access require their own acceptance evidence.</p>`);

  addPage('/status/', 'Know exactly what this release establishes.', 'A coherent candidate payload with explicit limits and separately scoped evidence.',
    `<dl><dt>Release</dt><dd>${e(release.releaseVersion)}</dd><dt>Payload identity</dt><dd><code>${e(release.releaseId)}</code></dd><dt>Schema</dt><dd>${e(release.schemaVersion)}</dd><dt>Built at</dt><dd>${e(release.builtAt)}</dd><dt>Oldest bundled source review</dt><dd>${e(unknown(manifest.sources_checked_at))}</dd><dt>Status evaluation</dt><dd>${e(router.status_evaluated_at)} · offline snapshot</dd><dt>Publication</dt><dd>Candidate; public Git distribution acceptance pending</dd></dl><h2>Evidence and remaining gates</h2><div class="table-scroll"><table><thead><tr><th>Surface</th><th>Boundary</th></tr></thead><tbody><tr><td>Skill payload</td><td>Nine coherent bundles; inspect the raw manifests.</td></tr><tr><td>Agent setup</td><td>Installer projections do not prove host/model workflows.</td></tr><tr><td>Counter</td><td>Local build, browser fixtures and read-only testnet simulation; actual wallet deployment pending.</td></tr><tr><td>QIE capabilities</td><td>Stored and effective statuses are visible in the catalogue.</td></tr><tr><td>Public release</td><td>Owner review, hosted acceptance, external pilot and final release evidence remain open.</td></tr></tbody></table></div><h2>Inspect the original records</h2><p>${link(`${prefix}/index.json`, 'Release file index')} · ${link(raw('qie', manifest.snapshot_path), 'A–Z snapshot')} · ${link(raw('qie-ecosystem', manifests.get('qie-ecosystem').snapshot_path), 'Ecosystem snapshot')}</p><p>${link(`${REPOSITORY}/actions`, 'Current CI results')} · ${link(`${REPOSITORY}/blob/feat/qie-ecosystem-intelligence/CHANGELOG.md`, 'Changelog')} · ${link(`${REPOSITORY}/blob/feat/qie-ecosystem-intelligence/docs/evidence/qie-knowledge-golden-tasks.md`, 'Recorded agent evaluations')}</p>`);

  for (const [name, names] of bundleFiles) for (const filename of names) if (filename.endsWith('.md')) {
    const source = files[raw(name, filename).slice(1)].toString();
    const title = source.replace(/^---\n[\s\S]*?\n---\n/, '').match(/^#\s+(.+)$/m)?.[1] ?? filename;
    const resolve = (target) => {
      if (/^https:\/\//.test(target) || target.startsWith('#')) return target;
      const [file, fragment] = target.split('#');
      const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(filename), file));
      if (!names.has(resolved)) throw new Error(`Missing raw reference ${name}/${resolved}`);
      return `${resolved.endsWith('.md') ? read(name, resolved) : raw(name, resolved)}${fragment ? `#${fragment}` : ''}`;
    };
    addPage(read(name, filename), title, `From ${name} · ${filename}`,
      `<p>${link(raw(name, filename), 'Open byte-identical raw Markdown')} · ${link(`/skills/${name}/`, 'Back to skill')}</p><article class="document">${renderMarkdown(source, resolve)}</article>`);
  }

  for (const filename of ['portal.css', 'portal.mjs', 'favicon.svg']) files[`assets/${filename}`] = await readFile(path.join(root, 'site/assets', filename));
  for (const [route, page] of pages) files[`${route.slice(1)}index.html`] = Buffer.from(renderPage(route, page, release));
  files.LICENSE = await readFile(path.join(root, 'LICENSE'));
  files['404.html'] = Buffer.from(renderPage('', { title: 'This page is unavailable.', intro: 'The requested document is not in this release.', content: `<p>${link('/', 'Return to the documentation overview')} or ${link('/skills/', 'browse the published skills')}.</p>` }, release));
  files[`${prefix.slice(1)}/index.json`] = Buffer.from(stableJson({
    release_version: release.releaseVersion, release_id: release.releaseId,
    status_evaluated_at: router.status_evaluated_at,
    files: Object.entries(files).filter(([name]) => name.startsWith(`${prefix.slice(1)}/skills/`)).map(([name, bytes]) => ({ path: `/${name}`, sha256: sha256(bytes) })),
  }));
  files['portal-build.json'] = Buffer.from(stableJson({ release_id: release.releaseId, release_version: release.releaseVersion, routes: [...pages.keys()], raw_prefix: prefix, status_evaluated_at: router.status_evaluated_at }));
  files['vercel.json'] = Buffer.from(stableJson({
    $schema: 'https://openapi.vercel.sh/vercel.json',
    trailingSlash: true,
    headers: [
      { source: '/(.*)', headers: [
        { key: 'Content-Security-Policy', value: DOCUMENTATION_CSP },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'no-referrer' },
      ] },
      { source: `${prefix}/(.*)`, headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
      { source: '/releases/(.*\\.md)', headers: [{ key: 'Content-Type', value: 'text/markdown; charset=utf-8' }] },
      { source: '/releases/(.*\\.json)', headers: [{ key: 'Content-Type', value: 'application/json; charset=utf-8' }] },
      { source: '/LICENSE', headers: [{ key: 'Content-Type', value: 'text/plain; charset=utf-8' }] },
    ],
  }));
  // Static-host headers; local preview enforces the same policy in code.
  files['_headers'] = Buffer.from(`/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: no-referrer\n  Content-Security-Policy: ${DOCUMENTATION_CSP}\n${prefix}/*\n  Cache-Control: public, max-age=31536000, immutable\n`);
  return files;
}

function listLinks(items, href) { return `<ul>${items.map((item) => `<li>${link(href(item), item)}</li>`).join('')}</ul>`; }

function renderPage(route, page, release) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="${e(page.intro)}"><title>${e(page.title)} · QIE Forge</title><link rel="icon" href="/assets/favicon.svg"><link rel="stylesheet" href="/assets/portal.css"><script type="module" src="/assets/portal.mjs"></script></head><body><a class="skip" href="#content">Skip to content</a><div class="layout"><aside class="rail"><a class="brand" href="/"><span class="brand-mark" aria-hidden="true">QF</span>QIE Forge</a><p class="eyebrow">Developer field guide</p><nav aria-label="Documentation">${PORTAL_ROUTES.map(([url, title]) => link(url, title, url === route ? ' aria-current="page"' : '')).join('')}</nav><div class="rail-note">Original skills. Traceable sources.<br>Developer-controlled signing.<p>${link(REPOSITORY, 'Source repository ↗')}</p></div></aside><div class="workspace"><div class="release-strip"><span>Candidate ${e(release.releaseVersion)}</span><span>Snapshot ${e(release.builtAt)}</span><span>${link('/status/', 'Evidence & limitations →')}</span></div><main id="content" tabindex="-1"><p class="eyebrow">QIE Forge / Documentation</p><h1>${e(page.title)}</h1><p class="lede">${e(page.intro)}</p>${page.content}<footer class="footer">Snapshot facts retain their original evidence scope. ${link('/verification/', 'Understand verification')} · ${link('/contribute/', 'Improve a source')} · ${link('/LICENSE', 'MIT license')}</footer></main></div></div></body></html>\n`;
}
