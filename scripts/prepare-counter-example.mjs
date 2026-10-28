// Deterministic preparation of the Counter example's ABI/selector asset.
// The canonical contract stays in recipes/build-test/assets; this script never
// keeps a second Solidity source. It runs the pinned local Forge and solc in an
// ignored staging directory, offline, and writes one generated TypeScript module.
import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describeSolcFailure, resolveSolc } from './lib/solc.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const exampleRoot = path.join(root, 'examples/counter-dapp');
const assets = path.join(root, 'recipes/build-test/assets');
const staging = path.join(exampleRoot, '.forge');
const output = path.join(exampleRoot, 'src/generated/counter.ts');
const toolchain = JSON.parse(await readFile(path.join(root, 'recipes/build-test/toolchain.json'), 'utf8'));
const check = process.argv.slice(2).includes('--check');

if (process.argv.slice(2).some((argument) => argument !== '--check')) {
  console.error('Usage: node scripts/prepare-counter-example.mjs [--check]');
  process.exit(1);
}

let solc;
try {
  solc = resolveSolc({ root, toolchain }).path;
} catch (error) {
  const failure = describeSolcFailure(error);
  console.error(failure.message);
  console.error(`Fix: ${failure.remediation}`);
  process.exit(1);
}

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', timeout: 120000, maxBuffer: 4 * 1024 * 1024 });
  if (result.error || result.status !== 0) {
    const detail = `${result.stdout ?? ''}${result.stderr ?? ''}`.trim();
    throw new Error(`${command} ${args.join(' ')} failed in ${cwd}:\n${detail || result.error?.message || 'unknown error'}`);
  }
  return result.stdout;
}

let generated;
try {
  await rm(staging, { recursive: true, force: true });
  await cp(assets, staging, { recursive: true });
  // The generated header names the pinned tools, so refuse to generate from a
  // different local toolchain. `npm run doctor` reports the supported setup.
  const forgeReport = run('forge', ['--version'], root);
  if (!forgeReport.includes(`Version: ${toolchain.forge_version}`) || !forgeReport.includes(toolchain.forge_commit)) {
    throw new Error(`Forge does not match recipes/build-test/toolchain.json (expected ${toolchain.forge_version}, commit ${toolchain.forge_commit}). Run npm run doctor.`);
  }
  // --offline forbids Forge from downloading a compiler; --use pins the local
  // native binary so no tool is installed or upgraded by this preparation step.
  run('forge', ['build', '--offline', '--use', solc], staging);
  const artifact = JSON.parse(await readFile(path.join(staging, 'out/Counter.sol/Counter.json'), 'utf8'));
  const selector = artifact?.methodIdentifiers?.['value()'];
  if (!Array.isArray(artifact?.abi) || typeof selector !== 'string' || !/^[0-9a-f]{8}$/.test(selector)) {
    throw new Error('The Counter artifact does not expose the expected value() ABI and selector.');
  }
  const source = await readFile(path.join(assets, 'src/Counter.sol'));
  const sourceDigest = createHash('sha256').update(source).digest('hex');
  generated = `// GENERATED FILE — DO NOT EDIT. Derived from recipes/build-test/assets/src/Counter.sol
// by scripts/prepare-counter-example.mjs with the pinned local Forge ${toolchain.forge_version}
// and solc ${toolchain.solc_version}. Regenerate with: npm run example:prepare
//
// The canonical contract source and tests stay in recipes/build-test/assets.
export const COUNTER_SOURCE_SHA256 = '${sourceDigest}';

// value() selector from the compiled artifact; used as read-only eth_call calldata.
export const COUNTER_VALUE_SELECTOR = '${selector}';

export const COUNTER_ABI = ${JSON.stringify(artifact.abi, null, 2)} as const;
`;
} catch (error) {
  await rm(staging, { recursive: true, force: true });
  console.error(error.message);
  process.exit(1);
}
await rm(staging, { recursive: true, force: true });

if (check) {
  let current = null;
  try { current = await readFile(output, 'utf8'); } catch { /* reported below */ }
  if (current !== generated) {
    console.error('Generated example asset is stale or missing. Run: npm run example:prepare');
    process.exit(1);
  }
  console.log('Generated Counter example asset is current.');
} else {
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, generated);
  console.log(`Wrote ${path.relative(root, output)} from the canonical Counter source. No QIE endpoint was contacted.`);
}
