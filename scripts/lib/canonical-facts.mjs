// Canonical fact projection for authored documents.
//
// An authored reference must not restate canonical facts: it must reference
// them. A placeholder such as `{{claim:qie-mainnet.rpc_url}}` is resolved at
// build time from the canonical records, so a hand-edited document can never
// drift away from the knowledge it describes. Capability statuses are
// projected through the same non-promoting effective-status evaluator and the
// same frozen build clock that the generated catalogues use, so an authored
// document and a generated catalogue can never disagree about a support
// verdict.
//
// Two invariants are enforced at build time:
//
//   1. Every placeholder must resolve. An unknown key, an empty value or a
//      leftover `{{` fails the build rather than shipping a half-rendered
//      document.
//   2. Every absolute URL published in a bundle must be traceable to canonical
//      data. A hostname that appears in no canonical claim, source or
//      capability limitation is a fabricated endpoint, and the build fails.
//      In a published bundle the rule is scoped to QIE-owned domains, because
//      a third-party reference link is legitimate; in authored ecosystem
//      content every absolute URL is a claim about QIE and must be canonical.
//      A retired endpoint that a previous release published fails the build
//      outright, whichever scope it appears in.
//
// Documentation-only reserved names (RFC 2606 `.example`, `.invalid`, `.test`
// and `localhost`) are illustrative placeholders, not published endpoints, and
// are exempt from the traceability rule.

import { effectiveStatus } from './effective-status.mjs';

const PLACEHOLDER = /\{\{\s*([^{}]*?)\s*\}\}/g;
const URL_LITERAL = /https?:\/\/[^\s`)"'<>]+/g;
const BARE_HOST = /\b([a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)*\.(?:[a-z]{2,63}))\b/gi;
const RESERVED_HOST_SUFFIXES = ['.example', '.invalid', '.test', '.local', '.localhost'];
const RESERVED_HOSTS = new Set(['example.com', 'example.org', 'example.net', 'localhost']);

// The placeholder vocabulary is fixed. An ad-hoc token is rejected rather than
// ignored, so a typo in an authored document can never publish as literal
// text.
const PLACEHOLDER_KINDS = new Set(['claim', 'hex', 'stored', 'effective', 'capability', 'source']);

function isReservedHost(host) {
  const lowered = host.toLowerCase();
  if (RESERVED_HOSTS.has(lowered)) return true;
  return RESERVED_HOST_SUFFIXES.some((suffix) => lowered.endsWith(suffix));
}

function hostOf(value) {
  try {
    return new URL(value).host.toLowerCase();
  } catch {
    return null;
  }
}

// A single shared projection of the canonical records, keyed by the canonical
// identifiers. Nothing here restates a value: every fact is read from the
// loaded snapshot.
function indexes(data) {
  return {
    claims: new Map(data.claims.map((c) => [c.claim_id, c])),
    capabilities: new Map(data.capabilities.map((c) => [c.capability_id, c])),
    sources: new Map(data.sources.map((s) => [s.source_id, s])),
  };
}

function chainIdHex(value) {
  const numeric = Number(value);
  if (!Number.isInteger(numeric) || numeric <= 0) return null;
  return `0x${numeric.toString(16)}`;
}

// Resolves one canonical placeholder key to its value.
//
// The grammar is strict and deliberately small:
//
//   {{claim:<network_id>:<predicate>}}  -> the canonical claim value
//   {{hex:<network_id>:<predicate>}}    -> the canonical claim value as 0x-hex
//   {{stored:<capability_id>}}          -> the capability's stored status
//   {{effective:<capability_id>}}       -> the capability's effective status
//   {{capability:<capability_id>[:field]}}
//   {{source:<source_id>[:field]}}
//
// A claim is addressed by network and predicate, and must match exactly one
// canonical claim. A capability status is addressed by its canonical
// identifier. The effective status is the shared non-promoting projection
// evaluated at the supplied clock.
export function resolveFact(key, data, { now, index = indexes(data) } = {}) {
  const parts = key.split(':');
  const kind = parts[0];
  if (!PLACEHOLDER_KINDS.has(kind)) {
    throw new Error(`unsupported canonical placeholder kind: ${kind}`);
  }
  const effective = (record) => effectiveStatus(record, { now, offline: true }).status;

  if (kind === 'claim' || kind === 'hex') {
    if (parts.length !== 3 || !parts[1] || !parts[2]) {
      throw new Error('A claim placeholder must be {{claim:network_id:predicate}}');
    }
    const [, networkId, predicate] = parts;
    const matches = [...index.claims.values()].filter((claim) => claim.network_id === networkId && claim.predicate === predicate);
    if (matches.length !== 1) {
      throw new Error(`A claim placeholder must match exactly one canonical claim: ${key}`);
    }
    const claim = matches[0];
    if (kind === 'hex') {
      if (claim.predicate !== 'chain_id') throw new Error(`Claim ${claim.claim_id} is not a chain ID`);
      const hex = chainIdHex(claim.value);
      if (!hex) throw new Error(`Claim ${claim.claim_id} has no usable chain ID value`);
      return hex;
    }
    return String(claim.value);
  }

  if (kind === 'stored' || kind === 'effective') {
    const capability = index.capabilities.get(parts[1]);
    if (!capability) throw new Error(`unknown capability in canonical placeholder: ${parts[1]}`);
    return kind === 'stored' ? capability.status : effective(capability);
  }

  if (kind === 'capability') {
    const capability = index.capabilities.get(parts[1]);
    if (!capability) throw new Error(`unknown capability in canonical placeholder: ${parts[1]}`);
    const [field] = parts.slice(2);
    if (!field) return capability.capability_id;
    if (field === 'status') return effective(capability);
    if (field === 'stored_status') return capability.status;
    if (field === 'version') return capability.tool_version_range ?? 'UNKNOWN';
    if (field === 'tool_id') return capability.tool_id;
    if (field === 'operation') return capability.operation;
    if (field === 'category') return capability.category;
    if (field === 'source_ids') return capability.source_ids.join(', ');
    throw new Error(`Unknown capability fact field: ${field}`);
  }

  if (kind === 'source') {
    const source = index.sources.get(parts[1]);
    if (!source) throw new Error(`unknown source in canonical placeholder: ${parts[1]}`);
    const [field] = parts.slice(2);
    if (!field) return source.title;
    if (field === 'title') return source.title;
    if (field === 'url') return source.url;
    if (field === 'trust_tier') return source.trust_tier;
    if (field === 'publisher') return source.publisher;
    throw new Error(`Unknown source fact field: ${field}`);
  }
}

// Renders every canonical placeholder in an authored document. The document
// label is only used to make a build failure point at the offending file.
export function renderCanonicalFacts(text, data, { now, label, index = indexes(data) } = {}) {
  const rendered = text.replace(PLACEHOLDER, (whole, key) => {
    const value = resolveFact(key, data, { now, index });
    if (value === null || value === undefined || value === '') {
      throw new Error(`Canonical fact ${key} in ${label} resolved to an empty value`);
    }
    return String(value);
  });
  if (rendered.includes('{{')) {
    throw new Error(`Unresolved canonical placeholder in ${label}`);
  }
  return rendered;
}

// The set of hosts that canonical data attests. Every published absolute URL
// must resolve to one of these hosts.
//
// Canonical prose also names a QIE host without a scheme (for example
// "swap.dex.qie.digital" in a domain gap record). Those names are attested as
// well, so a published URL is never rejected merely for spelling a canonical
// QIE host the way the canonical record spells it.
export function canonicalHosts(data) {
  const hosts = new Set();
  const addHost = (value) => {
    const host = hostOf(value);
    if (host) hosts.add(host);
  };
  for (const claim of data.claims) {
    if (typeof claim.value === 'string') addHost(claim.value);
  }
  for (const source of data.sources) addHost(source.url);
  const prose = [
    ...data.capabilities.flatMap((c) => c.limitations ?? []),
    ...data.domains.flatMap((d) => d.missing_information ?? []),
  ];
  for (const text of prose) {
    for (const match of text.matchAll(URL_LITERAL)) {
      const host = hostOf(match[0]);
      if (host) hosts.add(host);
    }
  }
  const owned = qieOwnedDomains(data);
  for (const text of prose) {
    for (const match of text.matchAll(BARE_HOST)) {
      const host = match[0].toLowerCase();
      if (owned.has(registrableDomain(host))) hosts.add(host);
    }
  }
  return hosts;
}

// A registrable-domain approximation, used only to decide whether a host is
// in scope for traceability. It never asserts ownership of a domain.
function registrableDomain(host) {
  const labels = host.toLowerCase().split('.');
  return labels.length >= 2 ? labels.slice(-2).join('.') : host.toLowerCase();
}

// The QIE-owned domains are derived from the canonical claim values: every
// published network endpoint belongs to one of them. A host outside these
// domains is a third-party reference (an EIP, a toolchain manual) and is out
// of scope for endpoint traceability.
export function qieOwnedDomains(data) {
  const domains = new Set();
  for (const claim of data.claims) {
    if (typeof claim.value !== 'string') continue;
    const host = hostOf(claim.value);
    if (host) domains.add(registrableDomain(host));
  }
  return domains;
}

// Retired QIE endpoints that must never be published again. They are the
// concrete defects the B08 independent audit found in published guidance, so
// they are kept as an explicit regression list rather than re-derived.
const RETIRED_ENDPOINTS = ['qiescan.org', 'rpc-main1.qie.digital', 'rpc-testnet.qie.digital'];

// The canonical status vocabulary. A status token written by hand in authored
// content is a support verdict, and a support verdict that disagrees with the
// canonical record is exactly the defect class the final audit found.
const STATUS_TOKENS = ['VERIFIED', 'DOCUMENTED', 'CLAIMED', 'UNKNOWN', 'CONFLICTED', 'STALE', 'UNSUPPORTED', 'DEPRECATED'];
const CHAIN_CONTEXT = /\b(chain|chain\s*id|chainid|network|networks|mainnet|testnet|evm|hex)\b/i;

function lineMatches(text, pattern) {
  return text.split('\n').filter((line) => pattern.test(line));
}

// Fails the build when authored content states a canonical fact by hand.
//
// Placeholders are the only sanctioned way to state a canonical network fact
// or a canonical support verdict. The projection mechanism alone does not
// protect against a future edit: a single hand-written literal would ship
// unchanged and could contradict the canonical record without any build
// failure. This gate closes that hole.
//
// It runs on the authored text with the placeholders removed, so it only sees
// what a human typed. Three families are rejected:
//
//   1. A chain identifier (decimal or 0x-hex) written literally in a line that
//      talks about a chain or a network.
//   2. A canonical endpoint written literally instead of projected.
//   3. A status token that asserts a verdict: after "status:"/"verdict:", after
//      a canonical capability identifier, next to a canonical capability or
//      tool identifier, or next to a canonical tool identifier whose canonical
//      statuses do not include it.
//
// A general statement about the status vocabulary ("treat an unknown version
// as UNKNOWN") names no canonical record and is therefore allowed; a general
// statement that a specific record is DOCUMENTED is not.
export function assertNoHandWrittenCanonicalFacts(text, data, { label, builtAt } = {}) {
  const authored = text.replace(/\{\{[^{}]*\}\}/g, ' ');
  const problems = [];

  const chainClaims = data.claims.filter((claim) => claim.predicate === 'chain_id');
  for (const claim of chainClaims) {
    const decimal = String(claim.value);
    const hex = `0x${Number(decimal).toString(16)}`;
    for (const token of [decimal, hex]) {
      const pattern = new RegExp(`(?<![A-Za-z0-9_])${token}(?![A-Za-z0-9_])`);
      for (const line of lineMatches(authored, pattern)) {
        if (!CHAIN_CONTEXT.test(line)) continue;
        problems.push(`chain identifier "${token}" is written by hand in "${line.trim()}"`);
      }
    }
  }

  for (const claim of data.claims) {
    if (typeof claim.value !== 'string' || !/^https?:\/\//.test(claim.value)) continue;
    for (const line of lineMatches(authored, new RegExp(claim.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))) {
      problems.push(`canonical endpoint "${claim.value}" is written by hand in "${line.trim()}"`);
    }
  }

  const capabilityById = new Map(data.capabilities.map((capability) => [capability.capability_id, capability]));
  const statusOf = (capability) => effectiveStatus(capability, { now: builtAt, offline: true }).status;
  const statusSetsByTool = new Map();
  for (const capability of data.capabilities) {
    const set = statusSetsByTool.get(capability.tool_id) ?? new Set();
    set.add(statusOf(capability));
    statusSetsByTool.set(capability.tool_id, set);
  }
  const toolIds = [...statusSetsByTool.keys()];

  const statusPattern = new RegExp(`\\b(${STATUS_TOKENS.join('|')})\\b`);
  const markerPattern = new RegExp(`\\b(?:status|verdict)\\s*:\\s*\\**\`?(${STATUS_TOKENS.join('|')})\\b`, 'i');
  const capabilityPattern = new RegExp(`\\b(${data.capabilities.map((capability) => capability.capability_id).join('|')})\\b`);
  const toolPattern = new RegExp(`\\b(${toolIds.join('|')})\\b`);

  for (const line of authored.split('\n')) {
    const statuses = [...line.matchAll(new RegExp(statusPattern.source, 'g'))].map((match) => match[1]);
    if (!statuses.length) continue;

    const marker = line.match(markerPattern);
    if (marker) {
      problems.push(`support verdict "${marker[1]}" is written by hand in "${line.trim()}"`);
      continue;
    }

    const capabilities = [...line.matchAll(new RegExp(capabilityPattern.source, 'g'))].map((match) => match[1]);
    for (const capabilityId of capabilities) {
      const capability = capabilityById.get(capabilityId);
      if (!capability) continue;
      const expected = new Set([statusOf(capability), capability.status]);
      for (const status of statuses) {
        if (!expected.has(status)) {
          problems.push(`support verdict "${status}" for "${capabilityId}" contradicts the canonical status (${[...expected].join('/')}) in "${line.trim()}"`);
        }
      }
    }

    if (!capabilities.length) {
      const tools = [...line.matchAll(new RegExp(toolPattern.source, 'g'))].map((match) => match[1]);
      for (const toolId of tools) {
        const expected = statusSetsByTool.get(toolId);
        for (const status of statuses) {
          if (!expected.has(status)) {
            problems.push(`support verdict "${status}" for tool "${toolId}" contradicts the canonical statuses (${[...expected].join('/')}) in "${line.trim()}"`);
          }
        }
      }
    }
  }

  if (problems.length) {
    throw new Error(`Authored content states canonical facts by hand in ${label}:\n- ${[...new Set(problems)].join('\n- ')}\nUse a canonical placeholder instead.`);
  }
  return true;
}


// Fails the build when a published document contains an absolute URL whose
// host no canonical record attests. `scope` is 'qie' (the default) for
// published bundles, where third-party reference links are legitimate, and
// 'all' for authored ecosystem content, where every absolute URL is a claim
// about the QIE ecosystem and must be canonical.
export function assertTraceableUrls(text, data, { label, scope = 'qie', hosts = canonicalHosts(data), ownedDomains = qieOwnedDomains(data) } = {}) {
  const untraceable = [];
  for (const match of text.matchAll(URL_LITERAL)) {
    const raw = match[0].replace(/[.,;:]+$/, '');
    const host = hostOf(raw);
    if (!host || isReservedHost(host)) continue;
    if (scope === 'qie' && !ownedDomains.has(registrableDomain(host))) continue;
    if (!hosts.has(host)) untraceable.push(raw);
  }
  if (untraceable.length) {
    throw new Error(`Published URL in ${label} is not traceable to canonical data: ${[...new Set(untraceable)].join(', ')}`);
  }
  return true;
}

// Fails the build when a published document names an endpoint that a previous
// release published and this release has retired.
export function assertNoRetiredEndpoints(text, { label, retired = RETIRED_ENDPOINTS } = {}) {
  const found = retired.filter((host) => text.toLowerCase().includes(host));
  if (found.length) {
    throw new Error(`Retired QIE endpoint published in ${label}: ${found.join(', ')}`);
  }
  return true;
}
