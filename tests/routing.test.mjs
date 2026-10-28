import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { cp, mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import { buildRelease } from '../scripts/lib/release.mjs';

// Build the router bundle once from a temporary copy of the canonical inputs.
const projectRoot = new URL('../', import.meta.url).pathname;
const root = await mkdtemp(path.join(os.tmpdir(), 'qie-forge-routing-'));
after(() => rm(root, { recursive: true, force: true }));
for (const name of ['authoring', 'knowledge', 'scripts', 'recipes', 'release-context.json', 'LICENSE']) {
  await cp(path.join(projectRoot, name), path.join(root, name), { recursive: true });
}
const output = await buildRelease(root);
const entry = output['qie']['SKILL.md'];
const coverage = output['qie']['references/qie-a-z.md'];
const routing = output['qie']['references/routing.md'];
const data = JSON.parse(output['qie']['data/qie-a-z.json']);
const fixtureSet = JSON.parse(await readFile(path.join(projectRoot, 'tests/fixtures/routing-fixtures.json'), 'utf8'));

const domains = new Map(data.domains.map((d) => [d.domain_id, d]));
const catalogue = new Map(data.skills.map((s) => [s.skill_id, s]));
const routeSkill = (domain) => domain.entry_skill ?? domain.planned_skill;
const evmScopes = ['qie-mainnet', 'qie-testnet', 'general'];
const nativeScopes = ['qie-native', 'general'];

test('frozen fixture set covers the required routing breadth', () => {
  assert.ok(fixtureSet.fixtures.length >= 20, 'at least 20 frozen routing fixtures');
  assert.ok(fixtureSet.fixtures.filter((f) => f.high_risk).length >= 5, 'at least 5 high-risk fixtures');
  assert.equal(new Set(fixtureSet.fixtures.map((f) => f.id)).size, fixtureSet.fixtures.length, 'fixture ids are unique');
  const intents = new Set(fixtureSet.fixtures.map((f) => f.intent));
  assert.equal(intents.size, fixtureSet.fixtures.length, 'fixture intents are unique');
});

test('catalogue snapshot covers D01–D15 and never inflates capability status', () => {
  assert.equal(data.domains.length, 15);
  assert.deepEqual([...domains.keys()].sort(), Array.from({ length: 15 }, (_, i) => `D${String(i + 1).padStart(2, '0')}`).sort());
  for (const domain of data.domains) {
    assert.ok(domain.source_ids.length >= 1, `${domain.domain_id} has a source`);
    assert.ok(domain.missing_information.length >= 1, `${domain.domain_id} records gaps`);
    assert.ok(domain.user_intents.length >= 1, `${domain.domain_id} records intents`);
  }
  assert.ok(data.capabilities.length >= 8);
  assert.ok(data.capabilities.every((c) => c.status !== 'VERIFIED'), 'no capability may be upgraded to VERIFIED by packaging');
  assert.ok(data.claims.length === 0, 'router carries no chain facts of its own');
  assert.deepEqual(catalogue.get('qie').domain_ids, data.domains.map((d) => d.domain_id).sort());
  assert.ok(catalogue.get('qie-networks').enabled_for_release);
  assert.ok(catalogue.get('qie').logical_handoffs.includes('qie-networks'));
});

test('router entry carries the mandatory safety behaviors referenced by high-risk fixtures', () => {
  const required = new Set(fixtureSet.fixtures.filter((f) => f.required_behavior).map((f) => f.required_behavior));
  assert.ok(required.size >= 5);
  for (const behavior of required) assert.ok(entry.includes(behavior), `router entry contains: ${behavior}`);
});

test('router entry states graceful missing-skill remediation for both catalogue states', () => {
  // A published skill missing locally can be installed.
  assert.match(entry, /skills add <qie-forge-source> --skill <skill-name>/);
  assert.match(entry, /is an installable release artifact/);
  // A planned or unpublished skill must not be offered as an installable artifact.
  assert.match(entry, /does NOT exist as an installable release/);
  assert.match(entry, /do not offer an install command for it/);
  assert.match(entry, /Never fabricate the planned skill/);
  assert.match(entry, /do not upgrade a status in your answer/);
  assert.match(entry, /Never generate a plausible-looking QIE contract address/);
  assert.match(entry, /discovery-only candidates, but none is executable/);
  assert.match(entry, /NOT_RUN` or `UNKNOWN` — never a successful preflight/);
});

test('router routes to references, not to chain facts or sibling-skill paths', () => {
  for (const [name, text] of [['SKILL.md', entry], ['references/qie-a-z.md', coverage], ['references/routing.md', routing]]) {
    assert.ok(!text.includes('1990'), `${name} must not restate the mainnet chain ID`);
    assert.ok(!text.includes('1983'), `${name} must not restate the testnet chain ID`);
    assert.ok(!text.includes('../../'), `${name} must not reference repository-root paths`);
    assert.ok(!/\]\(qie-[a-z-]+\//.test(text), `${name} must not link into a sibling skill directory`);
  }
});

test('every routed skill is labelled by its actual catalogue publication state', () => {
  const handoffSection = routing.split('## Skill handoffs')[1];
  assert.ok(handoffSection);
  const published = new Set(data.skills.filter((s) => s.enabled_for_release).map((s) => s.skill_id));
  assert.ok(published.has('qie') && published.has('qie-networks'));
  for (const skillId of catalogue.get('qie').logical_handoffs) {
    assert.match(handoffSection, new RegExp(`\\| \`${skillId.replace(/-/g, '\\-')}\` \\|`), `handoff table lists ${skillId}`);
  }
  for (const match of handoffSection.matchAll(/\| `([a-z0-9-]+)` \|[^|]+\| ([^|]+) \|/g)) {
    const [, skillId, state] = match;
    if (published.has(skillId)) assert.match(state, /published in this release/, `${skillId} is published`);
    else assert.match(state, /catalogued; not published in this release|planned; not a published artifact/,
      `${skillId} is explicitly not installable`);
  }
});

for (const fixture of fixtureSet.fixtures) {
  test(`${fixture.id}${fixture.high_risk ? ' [high-risk]' : ''}: ${fixture.intent}`, () => {
    const accepted = fixture.accepted_domains.map((id) => {
      const domain = domains.get(id);
      assert.ok(domain, `${fixture.id}: domain ${id} exists in the catalogue`);
      return domain;
    });
    const routes = accepted.map(routeSkill);
    // Route consistency: every accepted domain routes to an accepted skill.
    for (const route of routes) {
      assert.ok(fixture.expected_skills.includes(route),
        `${fixture.id}: catalogue route ${route} is within the accepted skill set`);
    }
    // Expected skills must be real catalogue routes or the router itself.
    for (const skill of fixture.expected_skills) {
      if (skill === 'qie') continue;
      assert.ok(routes.includes(skill) || catalogue.has(skill),
        `${fixture.id}: expected skill ${skill} is catalogued`);
    }
    // Forbidden substitutions never appear as a route for the accepted domains.
    for (const skill of fixture.forbidden_skills) {
      assert.ok(!routes.includes(skill), `${fixture.id}: forbidden route ${skill}`);
    }
    // Network distinction: accepted domains must stay inside the fixture's network scope.
    for (const domain of accepted) {
      if (fixture.expected_networks.length) {
        assert.ok(domain.network_scope.some((scope) => fixture.expected_networks.includes(scope) || scope === 'general'),
          `${fixture.id}: ${domain.domain_id} scope ${domain.network_scope} covers ${fixture.expected_networks}`);
      }
    }
    // Execution-context distinction between EVM and native scopes.
    if (fixture.execution_context === 'evm') {
      for (const domain of accepted) {
        assert.ok(domain.network_scope.some((scope) => evmScopes.includes(scope)),
          `${fixture.id}: ${domain.domain_id} is not native-only`);
      }
    } else if (fixture.execution_context === 'native') {
      for (const domain of accepted) {
        assert.ok(domain.network_scope.some((scope) => nativeScopes.includes(scope)),
          `${fixture.id}: ${domain.domain_id} is reachable from a native context`);
      }
    } else if (fixture.execution_context === 'mixed') {
      assert.ok(accepted.some((domain) => domain.network_scope.includes('qie-native')),
        `${fixture.id}: a mixed comparison must include a native-scoped domain`);
    }
    // The generated routing table must publish the accepted route rows with a truthful state.
    for (const domain of accepted) {
      const row = new RegExp(`\\| ${domain.domain_id} ${domain.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} \\| \`([a-z0-9-]+)\` \\(([^)]*)\\) \\|`);
      const match = routing.match(row);
      assert.ok(match, `${fixture.id}: routing table contains ${domain.domain_id}`);
      assert.ok(fixture.expected_skills.includes(match[1]), `${fixture.id}: published route ${match[1]} is accepted`);
      const published = data.skills.find((s) => s.skill_id === match[1])?.enabled_for_release === true;
      if (published) assert.match(match[2], /published in this release/, `${fixture.id}: ${match[1]} state`);
      else assert.match(match[2], /catalogued; not published in this release|planned; not a published artifact/, `${fixture.id}: ${match[1]} state`);
    }
  });
}
