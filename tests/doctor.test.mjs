import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { chmod, cp, readdir, readFile } from 'node:fs/promises';
import { runNodeResult } from './support/process.mjs';
import { projectRoot, temporaryDirectory } from './support/fixtures.mjs';
import { resolveSolc } from '../scripts/lib/solc.mjs';

const doctor = path.join(projectRoot, 'scripts/doctor.mjs');
const toolchain = JSON.parse(await readFile(path.join(projectRoot, 'recipes/build-test/toolchain.json'), 'utf8'));

test('doctor reports the supported checkout as ready and names every prerequisite', () => {
  const result = runNodeResult([doctor], { cwd: projectRoot });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /\[PASS\] Node\.js: 24\.20\.0/);
  assert.match(result.stdout, /\[PASS\] npm: 11\.19\.0/);
  assert.match(result.stdout, /\[PASS\] Forge: 1\.8\.1/);
  assert.match(result.stdout, /\[PASS\] solc/);
  assert.match(result.stdout, /\[PASS\] Skill bundles: Nine coherent bundles; release [0-9a-f]{64}/);
  assert.match(result.stdout, /doctor: READY/);
  assert.match(result.stdout, /does not prove QIE network or wallet compatibility/);
});


test('doctor accepts a native solc on PATH in an isolated HOME with no solc-select cache', async (t) => {
  const home = await temporaryDirectory(t, 'qie-doctor-path-home-');
  const bin = await temporaryDirectory(t, 'qie-doctor-path-bin-');
  const resolved = resolveSolc({ root: projectRoot, toolchain });
  const native = path.join(bin, 'solc');
  await cp(resolved.path, native);
  await chmod(native, 0o755);
  await assert.rejects(readdir(path.join(home, '.solc-select')), /ENOENT/);

  const env = {
    ...process.env,
    HOME: home,
    PATH: `${bin}${path.delimiter}${process.env.PATH}`,
  };
  delete env.QIE_FORGE_SOLC;
  const result = runNodeResult([doctor], { cwd: projectRoot, env });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /\[PASS\] solc \(PATH\): .*native compile probe succeeded/);
  assert.match(result.stdout, /doctor: READY/);
  await assert.rejects(readdir(path.join(home, '.solc-select')), /ENOENT/,
    'doctor must not create a compiler cache while observing the environment');
});

test('doctor rejects a broken QIE_FORGE_SOLC override instead of falling back', async (t) => {
  const home = await temporaryDirectory(t, 'qie-doctor-home-');
  const result = runNodeResult([doctor], {
    cwd: projectRoot,
    env: { ...process.env, HOME: home, QIE_FORGE_SOLC: path.join(home, 'missing-solc') },
  });
  assert.equal(result.status, 1);
  assert.match(result.stdout, /\[FAIL\] solc \(QIE_FORGE_SOLC\)/);
  assert.match(result.stdout, /QIE_FORGE_SOLC/);
  assert.match(result.stdout, /doctor: NOT_READY/);
});

test('doctor reports missing PATH prerequisites and remediation without downloading anything', async (t) => {
  const home = await temporaryDirectory(t, 'qie-doctor-home-');
  const env = { ...process.env, HOME: home, PATH: path.join(home, 'empty-path') };
  // CI exports QIE_FORGE_SOLC; this check must observe a genuinely empty PATH.
  delete env.QIE_FORGE_SOLC;
  const result = runNodeResult([doctor], { cwd: projectRoot, env });
  assert.equal(result.status, 1);
  assert.match(result.stdout, /npm is not runnable from PATH/);
  assert.match(result.stdout, /Forge 1\.8\.1 is not runnable from PATH/);
  assert.match(result.stdout, /Native solc 0\.8\.37\+commit\.f401782d was not found/);
  assert.match(result.stdout, /Fix: /);
  assert.match(result.stdout, /Nothing was installed or downloaded/);
  assert.match(result.stdout, /doctor: NOT_READY/);
});
