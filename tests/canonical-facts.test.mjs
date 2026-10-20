import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { readFile, writeFile } from 'node:fs/promises';
import { buildRelease } from '../scripts/lib/release.mjs';
import { assertNoRetiredEndpoints, assertTraceableUrls, canonicalHosts, qieOwnedDomains, resolveFact } from '../scripts/lib/canonical-facts.mjs';
import { loadKnowledge } from '../scripts/lib/knowledge.mjs';
import { fixtureProject, projectRoot } from './support/fixtures.mjs';

// Regression tests for the build-time canonical-traceability gate (B08 final
// audit, F-FINAL-03). An authored document that states a QIE endpoint must
// state one that canonical data attests, and an authored document must state
// canonical network facts through placeholders rather than by hand. Every
// check below is exercised against a deliberate contradiction, so a future
// drift fails the suite instead of being published.

const baseline = await loadKnowledge(projectRoot);
const guidePath = (root) => path.join(root, 'authoring/qie-ecosystem/references/decision-guide.md');

test('every QIE-owned domain is derived from the canonical claim values', () => {
  const owned = qieOwnedDomains(baseline);
  assert.ok(owned.has('qie.digital'), 'the QIE ecosystem domain is derived from the canonical endpoints');
  const hosts = canonicalHosts(baseline);
  for (const claim of baseline.claims) {
    if (typeof claim.value !== 'string' || !claim.value.startsWith('https://')) continue;
    assert.ok(hosts.has(new URL(claim.value).host), `canonical claim endpoint is attested: ${claim.claim_id}`);
  }
});

test('the traceability gate accepts canonical content and rejects an invented endpoint', () => {
  const canonical = 'RPC: https://rpc1mainnet.qie.digital/ (S03).';
  assert.doesNotThrow(() => assertTraceableUrls(canonical, baseline, { label: 'sample', scope: 'all' }));

  const invented = 'RPC: https://rpc-invented.qie.digital/ (S03).';
  assert.throws(() => assertTraceableUrls(invented, baseline, { label: 'sample', scope: 'all' }), /not traceable to canonical data/);

  // A third-party reference link is legitimate in a published bundle, but not
  // in authored ecosystem content where every URL is a claim about QIE.
  const thirdParty = 'See the EIP-1193 reference: https://eips.ethereum.org/EIPS/eip-1193.';
  assert.doesNotThrow(() => assertTraceableUrls(thirdParty, baseline, { label: 'sample', scope: 'qie' }));
  assert.throws(() => assertTraceableUrls(thirdParty, baseline, { label: 'sample', scope: 'all' }), /not traceable to canonical data/);

  // A documentation-only reserved name is never a published endpoint.
  const reserved = 'Override example: https://alternative-mainnet-endpoint.example/.';
  assert.doesNotThrow(() => assertTraceableUrls(reserved, baseline, { label: 'sample', scope: 'all' }));
});

test('a retired QIE endpoint is rejected wherever it appears', () => {
  assert.doesNotThrow(() => assertNoRetiredEndpoints('RPC: https://rpc1mainnet.qie.digital/.', { label: 'sample' }));
  assert.throws(() => assertNoRetiredEndpoints('Explorer: https://mainnet.qiescan.org/.', { label: 'sample' }), /Retired QIE endpoint/);
  assert.throws(() => assertNoRetiredEndpoints('RPC: https://rpc-main1.qie.digital/.', { label: 'sample' }), /Retired QIE endpoint/);
});

test('a stale endpoint hand-edited into the authored guide fails the build', async (t) => {
  const root = await fixtureProject(t);
  const guide = guidePath(root);
  const original = await readFile(guide, 'utf8');

  await writeFile(guide, `${original}\nStale endpoint: https://rpc-main1.qie.digital/\n`);
  await assert.rejects(buildRelease(root), /not traceable to canonical data/);

  await writeFile(guide, `${original}\nRetired explorer: https://mainnet.qiescan.org/\n`);
  await assert.rejects(buildRelease(root), /Retired QIE endpoint|not traceable to canonical data/);

  await writeFile(guide, `${original}\nInvented endpoint: https://rpc.qie-fabricated.example.org/\n`);
  await assert.rejects(buildRelease(root), /not traceable to canonical data/);
});

test('a canonical claim change reaches the published guide and the published bundle stays traceable', async (t) => {
  const root = await fixtureProject(t);
  const claimsFile = path.join(root, 'knowledge/claims.yaml');
  await writeFile(claimsFile, (await readFile(claimsFile, 'utf8')).replace('https://rpc1mainnet.qie.digital/', 'https://rpc-relocated.qie.digital/'));
  await buildRelease(root);

  const guide = await readFile(path.join(root, 'skills/qie-ecosystem/references/decision-guide.md'), 'utf8');
  assert.match(guide, /https:\/\/rpc-relocated\.qie\.digital/, 'the canonical claim value projects into the published guide');
  assert.doesNotMatch(guide, /rpc1mainnet\.qie\.digital/, 'the superseded endpoint is not published');

  // The relocated endpoint is canonical now, so the bundle remains traceable.
  const catalogue = await readFile(path.join(root, 'skills/qie-ecosystem/references/catalogue.md'), 'utf8');
  const knowledge = await loadKnowledge(root);
  assert.doesNotThrow(() => assertTraceableUrls(catalogue, knowledge, { label: 'catalogue', scope: 'qie' }));
});

test('the authored guide states canonical network facts only through placeholders', async () => {
  const authored = await readFile(guidePath(projectRoot), 'utf8');
  // A hand-written endpoint would be a drift risk: the canonical claim value
  // is injected at build time instead.
  assert.doesNotMatch(authored, /rpc1mainnet\.qie\.digital|rpc1testnet\.qie\.digital|mainnet\.qiescan\.org/);
  assert.match(authored, /\{\{claim:qie-mainnet:rpc_url\}\}/);
  assert.match(authored, /\{\{claim:qie-mainnet:chain_id\}\}/);
  assert.match(authored, /\{\{effective:hardhat-deploy\}\}/);
});

test('every placeholder kind resolves from canonical records only', () => {
  const resolve = (key) => resolveFact(key, baseline, { now: '2026-10-19T21:42:00Z' });

  // A claim is addressed by network and predicate.
  assert.equal(resolve('claim:qie-mainnet:chain_id'), '1990');
  assert.equal(resolve('claim:qie-testnet:rpc_url'), 'https://rpc1testnet.qie.digital/');
  assert.equal(resolve('hex:qie-testnet:chain_id'), '0x7bf');

  // A capability status is addressed by its canonical identifier.
  assert.equal(resolve('effective:hardhat-deploy'), 'DOCUMENTED');
  assert.equal(resolve('stored:hardhat-deploy'), 'DOCUMENTED');

  // A capability field and a source field are read from the canonical record.
  assert.equal(resolve('capability:qiewallet-eip1193-connect:version'), '4.2.2');
  assert.equal(resolve('capability:qiewallet-eip1193-connect:tool_id'), 'qie-wallet');
  assert.equal(resolve('capability:qiewallet-eip1193-connect:operation'), 'connect_eip1193');
  assert.equal(resolve('capability:qiewallet-eip1193-connect:category'), 'wallets');
  assert.equal(resolve('capability:qiewallet-eip1193-connect:source_ids'), 'S10');
  assert.equal(resolve('capability:qiewallet-eip1193-connect'), 'qiewallet-eip1193-connect');
  assert.equal(resolve('source:S21:url'), 'https://docs.qie.digital/developer-docs/smart-contract-deployment/deploy-using-remix.md');
  assert.equal(resolve('source:S21:trust_tier'), 'T1');
  assert.equal(resolve('source:S21:publisher'), 'QIE');
  assert.equal(resolve('source:S21:title'), resolve('source:S21'));

  // An unknown identifier or field is rejected rather than guessed.
  assert.throws(() => resolve('capability:not-a-capability'), /unknown capability/);
  assert.throws(() => resolve('source:not-a-source'), /unknown source/);
  assert.throws(() => resolve('capability:hardhat-deploy:not-a-field'), /Unknown capability fact field/);
  assert.throws(() => resolve('source:S21:not-a-field'), /Unknown source fact field/);
  assert.throws(() => resolve('hex:qie-mainnet:rpc_url'), /not a chain ID/);
});

test('a canonical prose URL is attested as a host', () => {
  const data = {
    ...baseline,
    domains: [{ domain_id: 'D05', missing_information: ['The product is hosted at https://product.qie.digital/ and documented at swap.dex.qie.digital.'] }],
    capabilities: [],
  };
  const hosts = canonicalHosts(data);
  assert.ok(hosts.has('product.qie.digital'), 'a scheme-ful URL in canonical prose is attested');
  assert.ok(hosts.has('swap.dex.qie.digital'), 'a scheme-less QIE host in canonical prose is attested');
});
