import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { cp, chmod, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import { closeSync, openSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import YAML from 'yaml';
import { buildRelease } from '../scripts/lib/release.mjs';
import { validateBundle } from '../scripts/lib/bundle.mjs';
import { loadValidators } from '../scripts/lib/schemas.mjs';
import { fixtureProject, temporaryDirectory, schemaRoot, releasedSkills, projectRoot } from './support/fixtures.mjs';
import { runNode } from './support/process.mjs';

const validate = await loadValidators(schemaRoot);
const operational = releasedSkills.filter(s => !['qie', 'qie-networks', 'qie-ecosystem'].includes(s));

test('six P0 topical bundles package selected recipes without unrelated generated pages or promotion', async t => {
  const root = await fixtureProject(t); const outputs = await buildRelease(root);
  for (const name of operational) {
    const files = outputs[name];
    const manifest = await validateBundle(path.join(root, 'skills', name), validate);
    assert.equal(manifest.snapshot_path, 'data/network-claims.json');
    assert.ok(!Object.hasOwn(files, 'references/network-mainnet.md'));
    assert.ok(!Object.hasOwn(files, 'references/qie-a-z.md'));
    assert.ok(Object.hasOwn(files, 'references/evidence.md'));
    const data = JSON.parse(files[manifest.snapshot_path]);
    assert.ok(data.capabilities.every(c => c.status === 'UNKNOWN'));
    assert.ok(data.claims.every(c => c.status === 'DOCUMENTED'));
    assert.equal(data.validation_runs.length, 0);
    assert.ok(Object.keys(files).some(p => /^recipes\/.+\/recipe.md$/.test(p)));
    assert.ok(!Object.keys(files).some(p => /(?:broadcast|signer|private-key)/.test(p)));
  }
  assert.ok(Object.hasOwn(outputs, 'qie-ecosystem'), 'ecosystem published in B08');
  assert.equal(Object.keys(outputs).length, 9, 'all nine P0 skills published');
});

test('a single third topical skill builds and validates independently after checkout deletion', async t => {
  const root = await fixtureProject(t);
  const selectors = YAML.parse(await readFile(path.join(root, 'knowledge/skills.yaml'), 'utf8'));
  for (const entry of selectors) entry.enabled_for_release = entry.skill_id === 'qie-smart-contracts';
  await writeFile(path.join(root, 'knowledge/skills.yaml'), YAML.stringify(selectors));
  const outputs = await buildRelease(root);
  assert.deepEqual(Object.keys(outputs), ['qie-smart-contracts']);
  const isolated = await temporaryDirectory(t);
  const installed = path.join(isolated, 'qie-smart-contracts');
  await cp(path.join(root, 'skills/qie-smart-contracts'), installed, { recursive: true });
  await rm(root, { recursive: true, force: true });
  await validateBundle(installed, validate);
  assert.match(await readFile(path.join(installed, 'recipes/build-test/assets/src/Counter.sol'), 'utf8'), /contract Counter/);
});

for (const [name, recipe] of [
  ['missing selected recipe', 'recipes/not-present/recipe.md'],
  ['escaping recipe', '../outside/recipe.md'],
]) {
  test(`recipe selector rejects ${name}`, async t => {
    const root = await fixtureProject(t);
    const p = path.join(root, 'knowledge/skills.yaml');
    const selectors = YAML.parse(await readFile(p, 'utf8'));
    selectors.find(s => s.skill_id === 'qie-smart-contracts').recipe_paths = [recipe];
    await writeFile(p, YAML.stringify(selectors));
    await assert.rejects(buildRelease(root), /ENOENT|pattern/);
  });
}

test('broken recipe asset and TypeScript helper imports block publication', async t => {
  const root = await fixtureProject(t);
  const p = path.join(root, 'recipes/wallet-read/assets/wallet-read.ts');
  await writeFile(p, (await readFile(p, 'utf8')).replace("../../../scripts/lib/effective-status.mjs", '../../../scripts/lib/missing.mjs'));
  await assert.rejects(buildRelease(root), /reference/);
  await writeFile(p, '// isolated fixture with no imports\n');
  await rm(path.join(root, 'recipes/build-test/assets/test/Counter.t.sol'));
  await assert.rejects(buildRelease(root), /reference/);
});

// Capture regular files rather than subprocess pipes, matching the project's
// process harness. This runs real tools; it is not a mocked compiler test.
function tool(command, args, cwd, env) {
  const stdoutPath = path.join(cwd, 'tool-stdout');
  const stderrPath = path.join(cwd, 'tool-stderr');
  const out = openSync(stdoutPath, 'w'); const err = openSync(stderrPath, 'w');
  try {
    const result = spawnSync(command, args, { cwd, env, timeout: 60000, stdio: ['ignore', out, err] });
    return { status: result.status, error: result.error?.message ?? null,
      stdout: readFileSync(stdoutPath, 'utf8'), stderr: readFileSync(stderrPath, 'utf8') };
  } finally { closeSync(out); closeSync(err); }
}

test('installed Foundry recipe replays real build/test/ABI commands and detects an incorrect expected effect', async t => {
  const source = await fixtureProject(t); await buildRelease(source);
  const isolated = await temporaryDirectory(t, 'qie-forge-foundry-replay-');
  const home = path.join(isolated, 'home'); await mkdir(home);
  const guard = path.join(isolated, 'deny-network.cjs');
  await cp(path.join(projectRoot, 'tests/support/deny-network.cjs'), guard);
  runNode([path.join(projectRoot, 'node_modules/skills/bin/cli.mjs'), 'add', source,
    '--skill', 'qie-smart-contracts', '-a', 'codex', '--copy', '-y'], {
    cwd: isolated,
    env: { PATH: process.env.PATH, HOME: home, CI: '1', DISABLE_TELEMETRY: '1', DO_NOT_TRACK: '1', NODE_OPTIONS: `--require=${guard}` },
  });
  const installed = path.join(isolated, '.agents/skills/qie-smart-contracts');
  const project = path.join(isolated, 'project');
  await cp(path.join(installed, 'recipes/build-test/assets'), project, { recursive: true });
  const pins = JSON.parse(await readFile(path.join(installed, 'recipes/build-test/toolchain.json'), 'utf8'));
  await rm(source, { recursive: true, force: true });
  await validateBundle(installed, validate);
  // Use an already installed native compiler, not the solc-select wrapper that
  // attempts installation under a new HOME. Never install tools from a test.
  const compilerSource = process.env.QIE_FORGE_SOLC
    ?? path.join(os.homedir(), '.solc-select/artifacts/solc-0.8.37/solc-0.8.37');
  const compiler = path.join(isolated, 'solc');
  await cp(compilerSource, compiler); await chmod(compiler, 0o755);
  const env = { PATH: process.env.PATH, HOME: home, NO_COLOR: '1' };
  const commands = [];
  const run = (cmd, args) => {
    const result = tool(cmd, args, project, env);
    commands.push({ command: [cmd, ...args], status: result.status });
    assert.equal(result.status, 0, JSON.stringify(result));
    return result.stdout;
  };
  const forgeVersion = run('forge', ['--version']);
  assert.ok(forgeVersion.includes(`Version: ${pins.forge_version}`));
  assert.ok(forgeVersion.includes(pins.forge_commit));
  assert.ok(run(compiler, ['--version']).includes(pins.solc_version));
  run('forge', ['build', '--offline', '--use', compiler]);
  const tests = run('forge', ['test', '--offline', '--use', compiler, '-vv']);
  assert.match(tests, /5 passed; 0 failed/);
  assert.match(tests, /runs: 256/);
  const abi = JSON.parse(run('forge', ['inspect', '--offline', '--use', compiler, 'Counter', 'abi', '--json']));
  assert.deepEqual(abi.filter(a => a.type === 'function').map(a => a.name).sort(), ['increment', 'value']);
  const methods = JSON.parse(run('forge', ['inspect', '--offline', '--use', compiler, 'Counter', 'methodIdentifiers', '--json']));
  assert.match(methods['value()'], /^[a-f0-9]{8}$/);
  const artifact = JSON.parse(await readFile(path.join(project, 'out/Counter.sol/Counter.json'), 'utf8'));
  assert.ok(artifact.bytecode.object.length > 2 && artifact.deployedBytecode.object.length > 2);
  const metadata = JSON.parse(artifact.rawMetadata);
  assert.equal(metadata.settings.evmVersion, pins.evm_version);
  assert.ok(metadata.compiler.version.startsWith(pins.solc_version));
  t.diagnostic(JSON.stringify({ scope: 'LOCAL_REPLAY only; QIE interoperability UNKNOWN', commands,
    tests: tests.trim(), methodIdentifiers: methods,
    compiler_sha256: createHash('sha256').update(await readFile(compiler)).digest('hex'),
    artifact_sha256: createHash('sha256').update(JSON.stringify(artifact)).digest('hex') }));
  const testFile = path.join(project, 'test/Counter.t.sol');
  await writeFile(testFile, (await readFile(testFile, 'utf8')).replace('counter.value() == 1', 'counter.value() == 2'));
  const rejected = tool('forge', ['test', '--offline', '--use', compiler, '-vv'], project, env);
  assert.notEqual(rejected.status, 0, 'an incorrect expected application effect must fail');
  assert.match(rejected.stdout + rejected.stderr, /increment effect|testIncrementChangesState/);
  t.diagnostic('Negative replay: forge test with wrong expected state exits nonzero; no QIE RPC, signer or broadcast used.');
});
