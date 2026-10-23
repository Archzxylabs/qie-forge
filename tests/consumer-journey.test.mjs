import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { cp, chmod, mkdir, readFile, readdir, rm } from 'node:fs/promises';
import { closeSync, openSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { runNode } from './support/process.mjs';
import { buildRelease } from '../scripts/lib/release.mjs';
import { inspectInstalledRelease } from '../scripts/lib/installed-release.mjs';
import { walkFiles } from '../scripts/lib/io.mjs';
import { resolveSolc } from '../scripts/lib/solc.mjs';
import { fixtureProject, temporaryDirectory, projectRoot } from './support/fixtures.mjs';

const cli = path.join(projectRoot, 'node_modules/skills/bin/cli.mjs');
// A deliberately partial install: the build/test and wallet-read journey must
// not require the other six sibling skills to be present.
const subset = ['qie-networks', 'qie-smart-contracts', 'qie-wallets'];
const absent = ['qie', 'qie-frontend', 'qie-transactions', 'qie-deployment', 'qie-debug', 'qie-ecosystem'];

function tool(command, args, cwd, env) {
  const stdoutPath = path.join(cwd, 'tool-stdout');
  const stderrPath = path.join(cwd, 'tool-stderr');
  const out = openSync(stdoutPath, 'w');
  const err = openSync(stderrPath, 'w');
  try {
    const result = spawnSync(command, args, { cwd, env, timeout: 60000, stdio: ['ignore', out, err] });
    return {
      status: result.status,
      error: result.error?.message ?? null,
      stdout: readFileSync(stdoutPath, 'utf8'),
      stderr: readFileSync(stderrPath, 'utf8'),
    };
  } finally {
    closeSync(out);
    closeSync(err);
  }
}

test('a clean consumer builds, tests and reads from installed bundle resources without the source checkout', async (t) => {
  const source = await fixtureProject(t);
  await buildRelease(source);
  const releaseId = JSON.parse(await readFile(path.join(source, 'skills/qie/MANIFEST.json'), 'utf8')).release_id;

  // Consumer workspace with a private HOME, cache and a network-denying guard.
  const consumer = await temporaryDirectory(t, 'qie-forge-clean-consumer-');
  const home = path.join(consumer, 'home');
  await mkdir(home);
  const guard = path.join(consumer, 'deny-network.cjs');
  await cp(path.join(projectRoot, 'tests/support/deny-network.cjs'), guard);
  const env = {
    PATH: process.env.PATH, HOME: home, CI: '1', NO_COLOR: '1', DISABLE_TELEMETRY: '1',
    DO_NOT_TRACK: '1', XDG_CACHE_HOME: path.join(consumer, 'cache'),
    NODE_OPTIONS: `--require=${guard}`,
  };

  // Install the documented subset with the pinned Skills CLI. Copied projections
  // survive deletion of the source checkout; symlinks would not.
  for (const skill of subset) {
    runNode([cli, 'add', source, '--skill', skill, '-a', 'codex', '--copy', '-y'], { cwd: consumer, env });
  }
  await rm(source, { recursive: true, force: true });

  const installedRoot = path.join(consumer, '.agents/skills');
  assert.deepEqual((await readdir(installedRoot)).sort(), [...subset].sort());
  for (const name of absent) {
    await assert.rejects(readFile(path.join(installedRoot, name, 'SKILL.md')), /ENOENT/);
  }

  // Bundle verification and release identity.
  const report = await inspectInstalledRelease(installedRoot, { expectedSkills: subset, claudeRoot: null });
  assert.deepEqual(report.problems, []);
  assert.equal(report.releaseId, releaseId);
  assert.equal(report.status, 'COHERENT_PARTIAL');
  assert.equal(report.payloadIntegrity, 'VERIFIED');
  assert.equal(report.inventoryComplete, false, 'a partial install is not a full-suite claim');
  assert.equal(report.verificationComplete, false);
  assert.equal(report.publisherAuthenticity, 'NOT_ESTABLISHED');

  // No installed byte may depend on this checkout's absolute path.
  for (const name of subset) {
    for (const relative of await walkFiles(path.join(installedRoot, name))) {
      const content = await readFile(path.join(installedRoot, name, relative), 'utf8');
      assert.ok(!content.includes(projectRoot), `${name}/${relative} contains the checkout path`);
      assert.ok(!content.includes(consumer), `${name}/${relative} contains the consumer path`);
    }
  }

  // Offline inspector from its packaged default snapshot.
  const inspection = JSON.parse(runNode([path.join(installedRoot, 'qie-networks/scripts/inspect-network.mjs'), 'qie-testnet'], { cwd: consumer, env }));
  assert.equal(inspection.network_id, 'qie-testnet');
  assert.equal(inspection.claims.find((claim) => claim.predicate === 'chain_id').value, 1983);
  assert.equal(inspection.live_check.outcome, 'NOT_RUN');

  // Installed read controller + installed snapshot, driven by a deterministic mock provider.
  const controller = path.join(installedRoot, 'qie-wallets/recipes/wallet-read/assets/wallet-read.ts');
  const snapshot = path.join(installedRoot, 'qie-wallets/data/network-claims.json');
  const walletScript = `
    import { pathToFileURL } from 'node:url';
    import { readFile } from 'node:fs/promises';
    const { createReadSession } = await import(pathToFileURL(${JSON.stringify(controller)}).href);
    const claims = JSON.parse(await readFile(${JSON.stringify(snapshot)}, 'utf8'));
    const calls = [];
    const account = '0x' + '22'.repeat(20);
    const provider = {
      on() {}, removeListener() {},
      async request({ method }) {
        calls.push(method);
        if (method === 'eth_chainId') return '0x7bf';
        if (method === 'eth_requestAccounts') return [account];
        if (method === 'eth_call') return '0x' + '9'.padStart(64, '0');
        throw Object.assign(new Error('unsupported'), { code: 4200 });
      },
    };
    const session = createReadSession(provider, claims, 'qie-testnet');
    await session.connect();
    const value = await session.readUint256('0x' + 'aa'.repeat(20), '0x3fa4f245');
    if (value !== 9n) throw new Error('unexpected read value');
    if (session.snapshot().phase !== 'ready') throw new Error('session not ready');
    session.dispose();
    console.log('CLEAN_CONSUMER_WALLET_OK');`;
  assert.match(runNode(['--input-type=module', '-e', walletScript], { cwd: consumer, env }), /CLEAN_CONSUMER_WALLET_OK/);

  // Documented local build/test journey, replayed from the installed recipe assets.
  const project = path.join(consumer, 'counter-project');
  await cp(path.join(installedRoot, 'qie-smart-contracts/recipes/build-test/assets'), project, { recursive: true });
  const pins = JSON.parse(await readFile(path.join(installedRoot, 'qie-smart-contracts/recipes/build-test/toolchain.json'), 'utf8'));
  // Reuse the repository's one resolved native compiler; never install or
  // download a tool here. The consumer HOME has no solc-select cache, and the
  // tool PATH is led by a native binary, so this exercises the PATH-only case.
  const compilerResolution = resolveSolc({ root: projectRoot, toolchain: pins });
  const toolchainBin = path.join(consumer, 'toolchain-bin');
  await mkdir(toolchainBin);
  const compiler = path.join(toolchainBin, 'solc');
  await cp(compilerResolution.path, compiler);
  await chmod(compiler, 0o755);
  await assert.rejects(readdir(path.join(home, '.solc-select')), /ENOENT/,
    'the isolated HOME must not contain a solc-select artifact');
  const toolEnv = {
    PATH: `${toolchainBin}${path.delimiter}${process.env.PATH}`,
    HOME: home,
    NO_COLOR: '1',
  };
  const run = (command, args) => {
    const result = tool(command, args, project, toolEnv);
    assert.equal(result.status, 0, JSON.stringify(result));
    return result.stdout;
  };
  assert.ok(run('forge', ['--version']).includes(`Version: ${pins.forge_version}`));
  assert.ok(run(compiler, ['--version']).includes(pins.solc_version));
  run('forge', ['build', '--offline', '--use', compiler]);
  const tests = run('forge', ['test', '--offline', '--use', compiler, '-vv']);
  assert.match(tests, /5 passed; 0 failed/);
  assert.match(tests, /runs: 256/);

  t.diagnostic(JSON.stringify({
    scope: 'CLEAN_CONSUMER checklist only; no QIE RPC or wallet interoperability evidence',
    installed: subset, absent, releaseId, releaseStatus: report.status,
    inspector: inspection.live_check, forge: pins.forge_version, solc: pins.solc_version,
    compilerResolution: compilerResolution.source, compilerHomeHasSolcSelect: false,
    counterTests: tests.match(/\d+ passed; \d+ failed/)?.[0] ?? 'UNKNOWN',
  }));
});
