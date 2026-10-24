import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { appendFile, cp, readFile, rm, writeFile } from 'node:fs/promises';
import YAML from 'yaml';
import { buildRelease } from '../scripts/lib/release.mjs';
import { loadValidators } from '../scripts/lib/schemas.mjs';
import { validateBundle, validateReferences } from '../scripts/lib/bundle.mjs';
import { loadKnowledge } from '../scripts/lib/knowledge.mjs';
import { effectiveStatus } from '../scripts/lib/effective-status.mjs';
import { fixtureProject, temporaryDirectory, schemaRoot, projectRoot } from './support/fixtures.mjs';

const validate = await loadValidators(schemaRoot);

test('ecosystem catalogue preserves canonical statuses and discovery-only address candidates', async () => {
  const data = await loadKnowledge(projectRoot);
  assert.ok(data.addresses.length >= 1, 'identity blocker retains discovery candidates');
  assert.equal(data.validationRuns.length, 0, 'no invented runtime execution evidence');
  assert.ok(data.capabilities.every((c) => c.status !== 'VERIFIED'), 'no capability is VERIFIED without non-mock execution evidence');
  
  // Verify exact canonical statuses are present
  const statuses = new Set(data.capabilities.map((c) => c.status));
  assert.ok(statuses.has('DOCUMENTED'), 'DOCUMENTED status present');
  assert.ok(statuses.has('CLAIMED'), 'CLAIMED status present');
  assert.ok(statuses.has('UNKNOWN'), 'UNKNOWN status present');
  assert.ok(statuses.has('UNSUPPORTED'), 'UNSUPPORTED status present');
  assert.ok(statuses.has('DEPRECATED'), 'DEPRECATED status present');
  assert.ok(statuses.has('CONFLICTED'), 'CONFLICTED status present');

  // Verify specific key capabilities
  const qieWallet = data.capabilities.find((c) => c.capability_id === 'qiewallet-eip1193-connect');
  assert.equal(qieWallet.status, 'DOCUMENTED');
  assert.equal(qieWallet.tool_version_range, '4.2.2');

  const qieWalletDisconnect = data.capabilities.find((c) => c.capability_id === 'qiewallet-disconnect-event');
  assert.equal(qieWalletDisconnect.status, 'UNSUPPORTED');

  const qieWalletNonEvm = data.capabilities.find((c) => c.capability_id === 'qiewallet-non-evm-eip1193');
  assert.equal(qieWalletNonEvm.status, 'UNSUPPORTED');

  const qiedexSwap = data.capabilities.find((c) => c.capability_id === 'qiedex-web-swap');
  assert.equal(qiedexSwap.status, 'CLAIMED');

  const dexSwap = data.capabilities.find((c) => c.capability_id === 'dex-swap');
  assert.equal(dexSwap.status, 'UNKNOWN');

  const hardhatDeploy = data.capabilities.find((c) => c.capability_id === 'hardhat-deploy');
  assert.equal(hardhatDeploy.status, 'DOCUMENTED');

  const remixDeploy = data.capabilities.find((c) => c.capability_id === 'remix-deploy');
  assert.equal(remixDeploy.status, 'DOCUMENTED');

  const legacy5656 = data.capabilities.find((c) => c.capability_id === 'legacy-chain-5656');
  assert.equal(legacy5656.status, 'DEPRECATED');

  const conflict5656 = data.capabilities.find((c) => c.capability_id === 'chain-id-5656-conflict');
  assert.equal(conflict5656.status, 'CONFLICTED');
});

test('qie-ecosystem bundle builds with self-contained references and manifest', async (t) => {
  const root = await fixtureProject(t);
  const outputs = await buildRelease(root);
  assert.ok(Object.hasOwn(outputs, 'qie-ecosystem'), 'qie-ecosystem is packaged');
  
  const files = outputs['qie-ecosystem'];
  const expectedFiles = [
    'SKILL.md',
    'MANIFEST.json',
    'data/ecosystem-catalogue.json',
    'scripts/lib/effective-status.mjs',
    'references/address-candidates.md',
    'references/catalogue.md',
    'references/compatibility.md',
    'references/decision-guide.md',
    'references/release-info.md',
    'recipes/ecosystem-address/recipe.md',
    'recipes/ecosystem-selection/recipe.md',
    'recipes/erc20-asset/recipe.md',
    'recipes/lending-read/recipe.md',
    'recipes/oracle-collateral/recipe.md',
    'recipes/qusdc-escrow/recipe.md',
    'recipes/qusdc-escrow/assets/foundry.toml',
    'recipes/qusdc-escrow/assets/src/MockQusdcEscrow.sol',
    'recipes/qusdc-escrow/assets/test/MockQusdcEscrow.t.sol',
    'recipes/transaction-readonly/recipe.md',
  ];
  assert.deepEqual(Object.keys(files).sort(), expectedFiles.sort());

  const manifest = await validateBundle(path.join(root, 'skills/qie-ecosystem'), validate);
  assert.equal(manifest.skill_id, 'qie-ecosystem');
  assert.equal(manifest.snapshot_path, 'data/ecosystem-catalogue.json');
  assert.equal(manifest.files.length, expectedFiles.filter((f) => f !== 'MANIFEST.json').length);

  // Validate reference links across all files in bundle
  validateReferences(files);
});

test('qie-ecosystem operates offline after checkout deletion', async (t) => {
  const source = await fixtureProject(t);
  await buildRelease(source);
  const isolated = await temporaryDirectory(t);
  const skill = path.join(isolated, 'qie-ecosystem');
  await cp(path.join(source, 'skills/qie-ecosystem'), skill, { recursive: true });
  await rm(source, { recursive: true, force: true });

  const manifest = await validateBundle(skill, validate);
  assert.equal(manifest.skill_id, 'qie-ecosystem');

  const snapshot = JSON.parse(await readFile(path.join(skill, 'data/ecosystem-catalogue.json'), 'utf8'));
  assert.ok(snapshot.capabilities.length >= 20);
  assert.ok(snapshot.claims.length === 11);
  assert.ok(snapshot.sources.length >= 30);
  assert.ok(snapshot.integrations.length >= 10);

  const catalogue = await readFile(path.join(skill, 'references/catalogue.md'), 'utf8');
  assert.match(catalogue, /# QIE Ecosystem Catalogue/);
  assert.match(catalogue, /qie-wallet/);
  assert.match(catalogue, /external-evm-wallet/);
  assert.match(catalogue, /hardhat/);
  assert.match(catalogue, /remix/);
  assert.match(catalogue, /qiedex/);
  // The catalogue remains address-free, while a separate candidate table
  // preserves useful source-published leads without authorizing them.
  assert.doesNotMatch(catalogue, /0x[0-9a-fA-F]{40}/, 'no contract address literal is published');
  const candidates = await readFile(path.join(skill, 'references/address-candidates.md'), 'utf8');
  assert.match(candidates, /QIE contract address candidates/);
  assert.match(candidates, /0xD4949664cD82660AaE99bEdc034a0deA8A0bd517/);
  assert.match(candidates, /Discovery only/);

  const compat = await readFile(path.join(skill, 'references/compatibility.md'), 'utf8');
  assert.match(compat, /# QIE Compatibility Matrix/);
  assert.match(compat, /qiewallet-eip1193-connect/);
  assert.match(compat, /qiewallet-disconnect-event/);
  assert.match(compat, /UNSUPPORTED/);
  assert.match(compat, /DEPRECATED/);
  assert.match(compat, /CONFLICTED/);
});

test('decision guide covers Cases A through H with mandatory safety rules', async (t) => {
  const authored = await readFile(path.join(projectRoot, 'authoring/qie-ecosystem/references/decision-guide.md'), 'utf8');
  // Canonical network values and capability statuses are placeholders in the
  // authored source; only the generated bundle may contain literals.
  assert.match(authored, /\{\{claim:qie-mainnet:rpc_url\}\}/);
  assert.match(authored, /\{\{effective:hardhat-deploy\}\}/);
  const root = await fixtureProject(t);
  await buildRelease(root);
  const guide = await readFile(path.join(root, 'skills/qie-ecosystem/references/decision-guide.md'), 'utf8');
  assert.doesNotMatch(guide, /\{\{/, 'no unresolved canonical placeholder is published');

  // Case A: Wallet integration
  assert.match(guide, /## Case A: Wallet Selection and Integration/);
  assert.match(guide, /me\.qiewallet/);
  assert.match(guide, /window\.qie/);
  assert.match(guide, /accountsChanged/);
  assert.match(guide, /accounts\.length === 0/);
  assert.match(guide, /4902/);
  assert.match(guide, /enable "Testnet"/);

  // Case B: DEX / Swap routing
  assert.match(guide, /## Case B: DEX \/ Swap Routing and Address Refusal/);
  assert.match(guide, /swap\.dex\.qie\.digital/);
  assert.match(guide, /Refusal to Hallucinate DEX Router Addresses/);
  assert.match(guide, /MUST REFUSE/);
  // B08-R03: the guide preserves the full address-identity release blocker.
  assert.match(guide, /Address Identity Is Never Established by an Explorer Page or Bytecode/);
  assert.match(guide, /Issuer provenance/);
  assert.match(guide, /ABI provenance/);
  assert.match(guide, /Scoped identity observation/);
  assert.match(guide, /Human review/);
  assert.match(guide, /Conflict checks/);
  assert.match(guide, /unverified lead/);
  assert.doesNotMatch(guide, /mainnet\.qiescan\.org/);

  // Case C: Smart contract frameworks
  assert.match(guide, /## Case C: Foundry, Hardhat, and Remix Toolchains/);
  assert.match(guide, /evm_version = "shanghai"|`shanghai` EVM target/);
  assert.match(guide, /Foundry \(`forge`\)/);
  assert.match(guide, /Hardhat/);
  assert.match(guide, /Remix/);
  // B08-R01/R06: authored configuration matches canonical claims and sources.
  assert.match(guide, /https:\/\/rpc1mainnet\.qie\.digital\//);
  assert.match(guide, /https:\/\/rpc1testnet\.qie\.digital\//);
  assert.doesNotMatch(guide, /rpc-main1\.qie\.digital|rpc-testnet\.qie\.digital|qiescan\.org/,
    'no non-canonical RPC or explorer hostnames are published');
  assert.match(guide, /Official QIE Docs \(S11\)/);
  assert.match(guide, /Official QIE Docs \(S21\)/);
  assert.match(guide, /solidity: "0\.8\.20"/);
  assert.doesNotMatch(guide, /0\.8\.28/, 'no unsourced Solidity version is published');

  // Case D: Indexers
  assert.match(guide, /## Case D: Indexer Coverage Uncertainty and Historical Event Querying/);
  assert.match(guide, /eth_getLogs/);
  assert.doesNotMatch(guide, /2,000–5,000 blocks/, 'no unverified provider block-range limit is published');
  assert.match(guide, /not proof of absence/);

  // Case E: Native staking vs EVM staking
  assert.match(guide, /## Case E: Native QIE Staking vs EVM Staking/);
  assert.match(guide, /qie_1990-1/);
  assert.match(guide, /aqie/);
  assert.match(guide, /qied tx staking delegate/);
  assert.match(guide, /MUST CLARIFY/);
  // B08-R05 (consolidated F-B08-05): no fixed native transaction fee is published.
  assert.doesNotMatch(guide, /--fees 20000000000000000aqie|--fees [0-9]/, 'no fixed staking fee is published');
  assert.match(guide, /--fees <fee_in_aqie>/);

  // Case F: Network substitution refusal
  assert.match(guide, /## Case F: Network Substitution Refusal & Legacy Chain IDs/);
  assert.match(guide, /1990/);
  assert.match(guide, /1983/);
  assert.match(guide, /5656/);
  assert.match(guide, /9731/);
  assert.match(guide, /No Cross-Network Fallback/);

  // Case G: Discovery vs Execution
  assert.match(guide, /## Case G: Discovery vs Execution Proof/);
  assert.match(guide, /qie-lend-sdk/);
  assert.match(guide, /not published as an npm package/i);

  // Case H: Evidence freshness & expiry
  assert.match(guide, /## Case H: Evidence Freshness, Expiry, and Effective Status/);
  assert.match(guide, /checked_at/);
  assert.match(guide, /expires_at/);
});

test('effective status correctly computes freshness and expiration', async () => {
  const cap = {
    status: 'DOCUMENTED',
    checked_at: '2026-10-19T17:00:00Z',
    expires_at: '2026-11-19T17:00:00Z',
  };

  // Valid current context
  const validStatus = effectiveStatus(cap, {
    now: '2026-10-20T00:00:00Z',
    offline: true,
  });
  assert.equal(validStatus.status, 'DOCUMENTED');

  // Expired context drops to STALE
  const expiredStatus = effectiveStatus(cap, {
    now: '2026-12-01T00:00:00Z',
    offline: true,
  });
  assert.equal(expiredStatus.status, 'STALE');
});

test('tampered ecosystem publication causes build:check drift error', async (t) => {
  const root = await fixtureProject(t);
  await buildRelease(root);
  await appendFile(path.join(root, 'skills/qie-ecosystem/references/catalogue.md'), '\ntampered content\n');
  await assert.rejects(buildRelease(root, { check: true }), /drift/);
});

// --- B08 remediation: mutation-based projection and adversarial regression tests ---
// These tests deliberately inject the contradictions the independent audits
// found undetected (network facts, capability statuses, categories, source
// identities, reported counts, and address evidence) and assert the defect is
// detected. All fixtures are local copies; the canonical checkout is untouched.

const categoryOf = (data, capabilityId) => data.capabilities.find((c) => c.capability_id === capabilityId).category;

test('canonical category placement keeps DEX and indexer capabilities in their own categories', async () => {
  const data = await loadKnowledge(projectRoot);
  assert.equal(categoryOf(data, 'dex-swap'), 'defi');
  assert.equal(categoryOf(data, 'qiedex-web-swap'), 'defi');
  assert.equal(categoryOf(data, 'indexer-query'), 'indexing');
  assert.equal(categoryOf(data, 'native-delegate'), 'native-cosmos');
  assert.equal(categoryOf(data, 'qied-staking-delegate'), 'native-cosmos');
  assert.equal(categoryOf(data, 'qied-gov-submit'), 'native-cosmos');
  assert.equal(categoryOf(data, 'rpc-identity'), 'networks');
  assert.equal(categoryOf(data, 'explorer-verification-api'), 'explorers');
  assert.ok(data.capabilities.every((c) => typeof c.category === 'string' && c.category.length));
});

test('generated catalogue sections follow explicit category membership', async (t) => {
  const root = await fixtureProject(t);
  await buildRelease(root);
  const catalogue = await readFile(path.join(root, 'skills/qie-ecosystem/references/catalogue.md'), 'utf8');
  const section = (title) => catalogue.split(`### ${title}\n\n`)[1].split('\n### ')[0];
  const native = section('Native Cosmos & Validator Operations');
  const indexing = section('Indexing & Historical Data');
  const defi = section('Decentralized Finance & Swaps');
  assert.doesNotMatch(native, /dex-swap|qiedex/, 'DEX capabilities are not native Cosmos operations');
  assert.match(indexing, /indexer-query/, 'indexer capability is discoverable in the indexing category');
  assert.match(defi, /dex-swap/);
  assert.match(defi, /qiedex-web-swap/);
  assert.match(native, /qied-staking-delegate/);
});

test('catalogue network facts are projections of canonical claims (mutation check)', async (t) => {
  const root = await fixtureProject(t);
  await buildRelease(root);
  const cataloguePath = () => path.join(root, 'skills/qie-ecosystem/references/catalogue.md');
  const before = await readFile(cataloguePath(), 'utf8');
  // Canonical values derived from knowledge/claims.yaml, not hardcoded strings.
  assert.match(before, /https:\/\/rpc1mainnet\.qie\.digital\//);
  assert.match(before, /https:\/\/rpc1testnet\.qie\.digital\//);
  assert.match(before, /https:\/\/mainnet\.qie\.digital\//);
  assert.match(before, /https:\/\/testnet\.qie\.digital\//);
  assert.doesNotMatch(before, /rpc-main1\.qie\.digital|rpc-testnet\.qie\.digital|qiescan\.org/);

  // Inject the exact defect the audits found: a divergent RPC host.
  const claimsFile = path.join(root, 'knowledge/claims.yaml');
  const claims = await readFile(claimsFile, 'utf8');
  await writeFile(claimsFile, claims.replace('https://rpc1mainnet.qie.digital/', 'https://rpc-altered.qie.digital/'));
  await buildRelease(root);
  const after = await readFile(cataloguePath(), 'utf8');
  assert.match(after, /https:\/\/rpc-altered\.qie\.digital/, 'altered canonical claim projects into the catalogue');
  assert.doesNotMatch(after, /https:\/\/rpc1mainnet\.qie\.digital\//, 'stale hardcoded network fact cannot survive a canonical change');
});

test('capability status mutations project into catalogue and matrix (mutation check)', async (t) => {
  const root = await fixtureProject(t);
  const capabilitiesFile = path.join(root, 'knowledge/capabilities.yaml');
  const original = await readFile(capabilitiesFile, 'utf8');
  const conflicted = original.replaceAll('  status: DOCUMENTED', '  status: CONFLICTED');
  assert.notEqual(conflicted, original, 'fixture mutation must alter statuses');
  await writeFile(capabilitiesFile, conflicted);
  await buildRelease(root);
  const catalogue = await readFile(path.join(root, 'skills/qie-ecosystem/references/catalogue.md'), 'utf8');
  const matrix = await readFile(path.join(root, 'skills/qie-ecosystem/references/compatibility.md'), 'utf8');
  for (const capabilityId of ['qiewallet-eip1193-connect', 'qiewallet-switch-chain', 'hardhat-deploy', 'remix-deploy', 'viem-custom-chain', 'wagmi-injected', 'qie-oracle-price-feed', 'qied-staking-delegate', 'qied-gov-submit']) {
    const row = catalogue.split('\n').find((line) => line.includes(`\`${capabilityId}\``) && line.startsWith('|'));
    assert.match(row, /\*\*CONFLICTED\*\*/, `${capabilityId} overview row reflects the canonical status`);
  }
  assert.match(matrix, /qiewallet-eip1193-connect[\s\S]{0,400}CONFLICTED/);
});

test('no hardcoded product-wide status survives a canonical status flip', async (t) => {
  const root = await fixtureProject(t);
  const capabilitiesFile = path.join(root, 'knowledge/capabilities.yaml');
  const original = await readFile(capabilitiesFile, 'utf8');
  await writeFile(capabilitiesFile, original.replaceAll('  status: DOCUMENTED', '  status: CONFLICTED'));
  await buildRelease(root);
  const catalogue = await readFile(path.join(root, 'skills/qie-ecosystem/references/catalogue.md'), 'utf8');
  const walletRows = catalogue.split('\n').filter((line) => line.includes('`qie-wallet`'));
  assert.ok(walletRows.length >= 4);
  assert.ok(walletRows.every((line) => !line.includes('DOCUMENTED')),
    'no independently asserted DOCUMENTED product summary remains');
  for (const capabilityId of ['qiewallet-eip1193-connect', 'qiewallet-switch-chain']) {
    const row = walletRows.find((line) => line.includes(`\`${capabilityId}\``) && line.startsWith('|'));
    assert.match(row, /CONFLICTED/);
  }
  for (const capabilityId of ['qiewallet-disconnect-event', 'qiewallet-non-evm-eip1193']) {
    const row = walletRows.find((line) => line.includes(`\`${capabilityId}\``) && line.startsWith('|'));
    assert.match(row, /UNSUPPORTED/, 'previously negative statuses are untouched by the flip');
  }
});

test('address evidence mutations never publish an executable recommendation', async (t) => {
  const root = await fixtureProject(t);
  const addressesFile = path.join(root, 'knowledge/addresses.yaml');
  // Inject a source-claimed address with issuer provenance but no identity
  // observation: the build must succeed and the catalogue must still publish
  // no address literal and no recommendation.
  await writeFile(addressesFile, [
    '- address: \'0xDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD\'',
    '  chain_id: 1990',
    '  claimed_product: source-claimed-conversion-precompile',
    '  issuer_source_ids:',
    '    - S16',
    '  abi_source_ids: []',
    '  code_observation: null',
    '  status: UNKNOWN',
    '  checked_at: null',
    '  expires_at: null',
    '',
  ].join('\n'));
  await buildRelease(root);
  const catalogue = await readFile(path.join(root, 'skills/qie-ecosystem/references/catalogue.md'), 'utf8');
  assert.doesNotMatch(catalogue, /0x[0-9a-fA-F]{40}/, 'an unverified address record is never rendered into guidance');
  assert.doesNotMatch(catalogue, /DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD/);
});

test('unknown or missing category associations fail the build', async (t) => {
  const root = await fixtureProject(t);
  const capabilitiesFile = path.join(root, 'knowledge/capabilities.yaml');
  const original = await readFile(capabilitiesFile, 'utf8');
  await writeFile(capabilitiesFile, original.replace('- capability_id: rpc-identity\n  category: networks', '- capability_id: rpc-identity\n  category: bogus-category'));
  await assert.rejects(buildRelease(root), /enum|allowed/i, 'schema rejects a non-canonical category');
  const removed = original.replace('  category: networks\n', '');
  await writeFile(capabilitiesFile, removed);
  await assert.rejects(buildRelease(root), /required/i, 'schema requires a category association');
});

// --- B08 final-audit remediation: F-FINAL-02 and F-FINAL-03 ---

test('expired canonical evidence downgrades catalogue, matrix and guide together', async (t) => {
  const root = await fixtureProject(t);
  const capabilitiesFile = path.join(root, 'knowledge/capabilities.yaml');
  const capabilities = YAML.parse(await readFile(capabilitiesFile, 'utf8'));
  const target = capabilities.find((cap) => cap.capability_id === 'hardhat-deploy');
  target.checked_at = '2026-10-01T00:00:00Z';
  target.expires_at = '2026-10-10T00:00:00Z';
  await writeFile(capabilitiesFile, YAML.stringify(capabilities));
  await buildRelease(root);

  const catalogue = await readFile(path.join(root, 'skills/qie-ecosystem/references/catalogue.md'), 'utf8');
  const matrix = await readFile(path.join(root, 'skills/qie-ecosystem/references/compatibility.md'), 'utf8');
  const guide = await readFile(path.join(root, 'skills/qie-ecosystem/references/decision-guide.md'), 'utf8');

  const catalogueRow = catalogue.split('\n').find((line) => line.includes('`hardhat-deploy`') && line.startsWith('|'));
  assert.match(catalogueRow, /\*\*STALE\*\*/, 'catalogue overview uses the effective status');
  const matrixRow = matrix.split('\n').find((line) => line.includes('`hardhat-deploy`') && line.startsWith('|'));
  assert.match(matrixRow, /\| `DOCUMENTED` \| \*\*STALE\*\* \|/, 'summary shows stored and effective status');
  assert.match(matrix, /hardhat-deploy[\s\S]*?\*\*Stored Status\*\*: `DOCUMENTED`[\s\S]*?\*\*Effective Status\*\*: `STALE`/);
  const guideRow = guide.split('\n').find((line) => line.includes('**Hardhat**'));
  assert.match(guideRow, /STALE/, 'authored framework status renders the same effective projection');
});

test('authored network literals and statuses are build-time projections of canonical data', async (t) => {
  const root = await fixtureProject(t);
  const claimsFile = path.join(root, 'knowledge/claims.yaml');
  const claims = await readFile(claimsFile, 'utf8');
  await writeFile(claimsFile, claims.replace('https://rpc1mainnet.qie.digital/', 'https://rpc-altered.qie.digital/'));

  const capabilitiesFile = path.join(root, 'knowledge/capabilities.yaml');
  const capabilities = YAML.parse(await readFile(capabilitiesFile, 'utf8'));
  capabilities.find((cap) => cap.capability_id === 'hardhat-deploy').status = 'CONFLICTED';
  await writeFile(capabilitiesFile, YAML.stringify(capabilities));

  await buildRelease(root);
  const guide = await readFile(path.join(root, 'skills/qie-ecosystem/references/decision-guide.md'), 'utf8');
  assert.match(guide, /https:\/\/rpc-altered\.qie\.digital/, 'canonical claim change projects into the Hardhat example');
  assert.doesNotMatch(guide, /https:\/\/rpc1mainnet\.qie\.digital\//, 'stale authored RPC literal cannot survive');
  const hardhatRow = guide.split('\n').find((line) => line.includes('**Hardhat**'));
  assert.match(hardhatRow, /CONFLICTED/, 'canonical status change projects into the framework matrix');
  assert.doesNotMatch(hardhatRow, /DOCUMENTED/);
});

test('unknown canonical placeholders fail publication instead of leaking', async (t) => {
  const root = await fixtureProject(t);
  const guide = path.join(root, 'authoring/qie-ecosystem/references/decision-guide.md');
  await writeFile(guide, (await readFile(guide, 'utf8')) + '\n{{effective:not-a-capability}}\n');
  await assert.rejects(buildRelease(root), /unknown capability/);
});

test('malformed, unsupported and unresolved canonical placeholders fail publication', async (t) => {
  const root = await fixtureProject(t);
  const guideFile = path.join(root, 'authoring/qie-ecosystem/references/decision-guide.md');
  const original = await readFile(guideFile, 'utf8');

  // A claim token with the wrong argument arity is rejected before rendering.
  await writeFile(guideFile, `${original}\n{{claim:qie-mainnet-rpc-url}}\n`);
  await assert.rejects(buildRelease(root), /claim placeholder must be \{\{claim:network_id:predicate\}\}/);

  // An unexposed placeholder kind is rejected (no ad-hoc token vocabulary).
  await writeFile(guideFile, `${original}\n{{product-support:qie-wallet}}\n`);
  await assert.rejects(buildRelease(root), /unsupported canonical placeholder kind/);

  // A token referencing no canonical claim at all is rejected.
  await writeFile(guideFile, `${original}\n{{claim:qie-mainnet:faucet_url}}\n`);
  await assert.rejects(buildRelease(root), /must match exactly one canonical claim/);

  // A half-structured token with no clear resolution never leaks into the bundle.
  await writeFile(guideFile, `${original}\n{{unknown-token}}\n`);
  await assert.rejects(buildRelease(root), /unresolved canonical placeholder|unsupported canonical placeholder kind/);
});
