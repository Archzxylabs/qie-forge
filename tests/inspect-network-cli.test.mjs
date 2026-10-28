import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { cp, rm, writeFile } from 'node:fs/promises';
import { runNodeResult } from './support/process.mjs';
import { buildRelease } from '../scripts/lib/release.mjs';
import { fixtureProject, temporaryDirectory, projectRoot } from './support/fixtures.mjs';

// Every child process runs with the test network guard installed, so a successful
// invocation also proves that the inspector attempted no network request.
const guard = path.join(projectRoot, 'tests/support/deny-network.cjs');
const offlineEnv = (home) => ({
  PATH: process.env.PATH, HOME: home, CI: '1', NO_COLOR: '1',
  NODE_OPTIONS: `--require=${guard}`,
});

function inspect(args, { cwd, home, script = 'scripts/inspect-network.mjs' }) {
  const result = runNodeResult([script, ...args], { cwd, env: offlineEnv(home) });
  return {
    ...result,
    report: result.stdout ? JSON.parse(result.stdout) : null,
    error: result.stderr ? JSON.parse(result.stderr) : null,
  };
}

test('root-source inspector accepts an explicit valid snapshot and stays offline', async (t) => {
  const root = await fixtureProject(t);
  await buildRelease(root);
  const result = inspect(['qie-testnet', '--claims', 'skills/qie-networks/data/network-claims.json'], { cwd: root, home: root });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.report.network_id, 'qie-testnet');
  assert.equal(result.report.claims.find((claim) => claim.predicate === 'chain_id').value, 1983);
  assert.ok(result.report.claims.every((claim) => claim.status === 'DOCUMENTED'));
  assert.ok(result.report.claims.every((claim) => claim.reason.length > 0));
  assert.ok(result.report.sources.every((source) => source.source_id && source.url));
  assert.deepEqual(result.report.live_check.outcome, 'NOT_RUN');
});

test('installed inspector works from its packaged default snapshot', async (t) => {
  const source = await fixtureProject(t);
  await buildRelease(source);
  const isolated = await temporaryDirectory(t, 'qie-inspect-installed-');
  const installed = path.join(isolated, 'qie-networks');
  await cp(path.join(source, 'skills/qie-networks'), installed, { recursive: true });
  await rm(source, { recursive: true, force: true });
  for (const [network, chainId] of [['qie-mainnet', 1990], ['qie-testnet', 1983]]) {
    const result = inspect([network], {
      cwd: isolated, home: isolated, script: path.join('qie-networks', 'scripts/inspect-network.mjs'),
    });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.report.network_id, network);
    assert.equal(result.report.claims.find((claim) => claim.predicate === 'chain_id').value, chainId);
    assert.equal(result.report.live_check.outcome, 'NOT_RUN');
  }
});

test('root-source invocation without --claims cannot reach a packaged snapshot', async (t) => {
  const root = await fixtureProject(t);
  await buildRelease(root);
  const result = inspect(['qie-testnet'], { cwd: root, home: root });
  assert.equal(result.status, 1);
  assert.equal(result.report, null);
  assert.equal(result.error.error_code, 'DEPENDENCY_MISMATCH');
  assert.match(result.error.message, /Cannot inspect the packaged network snapshot/);
});

for (const [name, args, expected] of [
  ['unknown option', ['qie-testnet', '--bogus'], /Unknown option: --bogus/],
  ['missing option value', ['qie-testnet', '--claims'], /--claims requires/],
  ['empty option value', ['qie-testnet', '--claims', ''], /--claims requires/],
  ['extra positional argument', ['qie-testnet', 'qie-mainnet'], /Usage:/],
  ['missing network', [], /Usage:/],
  ['invalid network', ['qie-native'], /Choose qie-mainnet or qie-testnet explicitly/],
]) {
  test(`inspector rejects ${name} with a usage error`, async (t) => {
    const root = await fixtureProject(t);
    const result = inspect(args, { cwd: root, home: root });
    assert.equal(result.status, 2);
    assert.equal(result.report, null);
    assert.equal(result.error.error_code, 'USAGE');
    assert.match(result.error.message, expected);
  });
}

test('missing and malformed snapshots fail without leaking supplied contents', async (t) => {
  const root = await fixtureProject(t);
  const missing = inspect(['qie-testnet', '--claims', 'no-such-snapshot.json'], { cwd: root, home: root });
  assert.equal(missing.status, 1);
  assert.equal(missing.report, null);
  assert.match(missing.error.message, /Cannot read the supplied network snapshot/);

  const secret = 'SUPPLIED_SECRET_CONTENT';
  const cases = [
    ['invalid JSON', `{ "claims": [ ${secret}`],
    ['wrong shape', JSON.stringify({ claims: secret, sources: [] })],
    ['no matching network', JSON.stringify({ claims: [{ network_id: 'qie-mainnet', predicate: 'chain_id' }], sources: [] })],
  ];
  for (const [name, content] of cases) {
    const file = path.join(root, `${name.replaceAll(' ', '-')}.json`);
    await writeFile(file, content);
    const result = inspect(['qie-testnet', '--claims', file], { cwd: root, home: root });
    assert.equal(result.status, 1, `${name}: exit code`);
    assert.equal(result.report, null, `${name}: no report`);
    assert.doesNotMatch(result.stderr, new RegExp(secret), `${name}: content must not leak`);
    assert.match(result.error.message, /supplied network snapshot/, `${name}: fixed message`);
  }
});
