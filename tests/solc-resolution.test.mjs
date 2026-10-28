import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { chmod, cp, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { resolveSolc } from '../scripts/lib/solc.mjs';
import { projectRoot, temporaryDirectory } from './support/fixtures.mjs';

const toolchain = JSON.parse(await readFile(path.join(projectRoot, 'recipes/build-test/toolchain.json'), 'utf8'));
const hostResolution = resolveSolc({ root: projectRoot, toolchain });
const pin = toolchain.solc_version;

async function nativeBin(t, name = 'solc') {
  const bin = await temporaryDirectory(t, 'qie-solc-bin-');
  const file = path.join(bin, name);
  await cp(hostResolution.path, file);
  await chmod(file, 0o755);
  return { bin, file };
}

function envWith(overrides = {}) {
  const env = { ...process.env, ...overrides };
  const override = overrides.QIE_FORGE_SOLC;
  delete env.QIE_FORGE_SOLC;
  if (Object.hasOwn(overrides, 'QIE_FORGE_SOLC')) env.QIE_FORGE_SOLC = override;
  return env;
}

function codeOf(error) {
  return error?.code ?? null;
}

test('PATH-only native solc resolves in an isolated HOME without a solc-select cache', async (t) => {
  const { bin, file } = await nativeBin(t);
  const home = await temporaryDirectory(t, 'qie-solc-home-');
  const env = envWith({ HOME: home, PATH: bin });
  const resolved = resolveSolc({ root: projectRoot, toolchain, env });
  assert.equal(resolved.source, 'PATH');
  assert.equal(resolved.path, file);
  assert.ok(resolved.version.startsWith(pin));
  await assert.rejects(readdir(path.join(home, '.solc-select')), /ENOENT/);
});

test('a valid absolute QIE_FORGE_SOLC override is authoritative and is the binary that runs', async (t) => {
  const { file } = await nativeBin(t);
  const home = await temporaryDirectory(t, 'qie-solc-home-');
  const env = envWith({ HOME: home, PATH: path.join(home, 'empty-path'), QIE_FORGE_SOLC: file });
  const resolved = resolveSolc({ root: projectRoot, toolchain, env });
  assert.equal(resolved.source, 'QIE_FORGE_SOLC');
  assert.equal(resolved.path, file);
  const version = spawnSync(resolved.path, ['--version'], { encoding: 'utf8' });
  assert.equal(version.status, 0);
  assert.match(version.stdout, new RegExp(`Version: ${pin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
});

test('a broken explicit override fails instead of falling back to a valid PATH compiler', async (t) => {
  const { bin } = await nativeBin(t);
  const home = await temporaryDirectory(t, 'qie-solc-home-');
  const env = envWith({
    HOME: home,
    PATH: bin,
    QIE_FORGE_SOLC: path.join(home, 'missing-solc'),
  });
  assert.throws(
    () => resolveSolc({ root: projectRoot, toolchain, env }),
    (error) => codeOf(error) === 'SOLC_OVERRIDE_MISSING'
      && /authoritative/.test(error.message)
      && /no fallback/.test(error.message),
  );
});

test('a relative explicit override is rejected rather than resolved from cwd', async (t) => {
  const home = await temporaryDirectory(t, 'qie-solc-home-');
  const env = envWith({ HOME: home, QIE_FORGE_SOLC: './solc' });
  assert.throws(
    () => resolveSolc({ root: projectRoot, toolchain, env }),
    (error) => codeOf(error) === 'SOLC_OVERRIDE_NOT_ABSOLUTE' && /absolute path/.test(error.message),
  );
});

test('a solc-select wrapper on PATH is never executed when no artifact exists', async (t) => {
  const bin = await temporaryDirectory(t, 'qie-solc-wrapper-');
  const home = await temporaryDirectory(t, 'qie-solc-home-');
  const marker = path.join(home, 'wrapper-executed');
  const wrapper = path.join(bin, 'solc');
  await writeFile(wrapper, `#!/bin/sh\n# solc-select wrapper fixture: executing this would be unsafe.\ntouch '${marker}'\nexit 0\n`);
  await chmod(wrapper, 0o755);
  const env = envWith({ HOME: home, PATH: bin });
  assert.throws(
    () => resolveSolc({ root: projectRoot, toolchain, env }),
    (error) => codeOf(error) === 'SOLC_WRAPPER_UNRESOLVED' && /not executed/.test(error.message),
  );
  await assert.rejects(readFile(marker), /ENOENT/, 'discovery must not execute the wrapper');
  await assert.rejects(readdir(path.join(home, '.solc-select')), /ENOENT/);
});

test('a wrapper on PATH resolves to an existing native solc-select artifact without installing', async (t) => {
  const bin = await temporaryDirectory(t, 'qie-solc-wrapper-');
  const home = await temporaryDirectory(t, 'qie-solc-home-');
  const version = pin.split('+')[0];
  const artifact = path.join(home, '.solc-select', 'artifacts', `solc-${version}`, `solc-${version}`);
  await mkdir(path.dirname(artifact), { recursive: true });
  await cp(hostResolution.path, artifact);
  await chmod(artifact, 0o755);
  const marker = path.join(home, 'wrapper-executed');
  const wrapper = path.join(bin, 'solc');
  await writeFile(wrapper, `#!/bin/sh\n# solc-select wrapper fixture: executing this would be unsafe.\ntouch '${marker}'\nexit 0\n`);
  await chmod(wrapper, 0o755);

  const resolved = resolveSolc({ root: projectRoot, toolchain, env: envWith({ HOME: home, PATH: bin }) });
  assert.equal(resolved.source, 'solc-select artifact');
  assert.equal(resolved.path, artifact);
  assert.ok(resolved.version.startsWith(pin));
  await assert.rejects(readFile(marker), /ENOENT/, 'the resolved artifact must be used directly, not via the wrapper');
});

test('missing and incompatible compilers fail with actionable remediation and no install', async (t) => {
  const home = await temporaryDirectory(t, 'qie-solc-home-');
  assert.throws(
    () => resolveSolc({ root: projectRoot, toolchain, env: envWith({ HOME: home, PATH: path.join(home, 'empty') }) }),
    (error) => codeOf(error) === 'SOLC_NOT_FOUND'
      && /Nothing was installed or downloaded/.test(error.message)
      && /QIE_FORGE_SOLC/.test(error.remediation),
  );

  assert.throws(
    () => resolveSolc({ root: projectRoot, toolchain, env: envWith({ HOME: home, PATH: path.join(home, 'empty'), QIE_FORGE_SOLC: '/bin/true' }) }),
    (error) => codeOf(error) === 'SOLC_INCOMPATIBLE' && /version probe/.test(error.message),
  );

  await assert.rejects(readdir(path.join(home, '.solc-select')), /ENOENT/);
});
