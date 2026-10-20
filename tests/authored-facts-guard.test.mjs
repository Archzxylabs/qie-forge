import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { readFile, writeFile } from 'node:fs/promises';
import { buildRelease } from '../scripts/lib/release.mjs';
import { assertNoHandWrittenCanonicalFacts } from '../scripts/lib/canonical-facts.mjs';
import { loadKnowledge } from '../scripts/lib/knowledge.mjs';
import { fixtureProject, projectRoot } from './support/fixtures.mjs';

// The final independent audit found that the placeholder mechanism alone did
// not protect the authored decision guide: a single hand-written literal could
// reintroduce the drift the milestone was opened for, with a green build and a
// green suite. These tests lock the build-time guard that closes that hole.
//
// The guard runs on authored content with the placeholders removed, so it sees
// only what a human typed. A general statement about the status vocabulary is
// allowed; a statement that a specific canonical record has a specific status
// is not, because that is a support verdict the canonical record owns.

const baseline = await loadKnowledge(projectRoot);
const builtAt = baseline.release.built_at;
const guidePath = (root) => path.join(root, 'authoring/qie-ecosystem/references/decision-guide.md');

const guard = (text) => assertNoHandWrittenCanonicalFacts(text, baseline, { label: 'sample', builtAt });

test('a hand-written chain identifier is rejected in chain context', () => {
  assert.throws(() => guard('The QIE Mainnet chain ID is 1990.'), /chain identifier "1990"/);
  assert.throws(() => guard('QIE Testnet uses chain id 1983 (0x7bf).'), /chain identifier/);
  // A chain identifier outside a chain or network sentence is not a canonical
  // claim about QIE and stays allowed.
  assert.doesNotThrow(() => guard('The registry file is dated 1990 in the archive listing.'));
});

test('a hand-written support verdict is rejected', () => {
  assert.throws(() => guard('The QIEDex web swap interface is (`status: CLAIMED`).'), /support verdict "CLAIMED"/);
  assert.throws(() => guard('The `qiedex-web-swap` capability is `UNKNOWN`.'), /contradicts the canonical status/);
  assert.throws(() => guard('The `hardhat-deploy` capability is `DEPRECATED`.'), /contradicts the canonical status/);
  assert.throws(() => guard('The `qie-wallet` tool is `VERIFIED`.'), /contradicts the canonical statuses/);
});

test('a general statement about the status vocabulary stays allowed', () => {
  assert.doesNotThrow(() => guard('If the version is unspecified, treat the capability as UNKNOWN.'));
  assert.doesNotThrow(() => guard('Classify repository discovery leads as `DOCUMENTED` or `CLAIMED`.'));
  assert.doesNotThrow(() => guard('The canonical vocabulary is VERIFIED, DOCUMENTED, CLAIMED, UNKNOWN, CONFLICTED, STALE, UNSUPPORTED, DEPRECATED.'));
});

test('a hand-written canonical endpoint is rejected', () => {
  assert.throws(() => guard('RPC: https://rpc1mainnet.qie.digital/'), /canonical endpoint/);
  assert.throws(() => guard('Explorer: https://mainnet.qie.digital/'), /canonical endpoint/);
});

test('the authored guide passes the guard as it stands', async () => {
  const authored = await readFile(guidePath(projectRoot), 'utf8');
  assert.doesNotThrow(() => guard(authored));
});

test('a hand-written literal in the authored guide fails the build', async (t) => {
  const root = await fixtureProject(t);
  const guide = guidePath(root);
  const original = await readFile(guide, 'utf8');

  await writeFile(guide, `${original}\nThe QIE Mainnet chain ID is 1990.\n`);
  await assert.rejects(buildRelease(root), /chain identifier "1990"/);

  await writeFile(guide, `${original}\nThe QIEDex web swap interface is (\`status: CLAIMED\`).\n`);
  await assert.rejects(buildRelease(root), /support verdict "CLAIMED"/);

  await writeFile(guide, `${original}\nThe \`hardhat-deploy\` capability is \`DEPRECATED\`.\n`);
  await assert.rejects(buildRelease(root), /contradicts the canonical status/);

  await writeFile(guide, `${original}\nRPC: https://rpc1mainnet.qie.digital/\n`);
  await assert.rejects(buildRelease(root), /canonical endpoint/);
});
