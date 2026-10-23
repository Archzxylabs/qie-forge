// Repository-local environment doctor. It only observes the machine: it never
// downloads, installs, upgrades, signs or contacts a QIE endpoint. Exit code 0
// means every required prerequisite passed; 1 means the environment is NOT ready.
import { accessSync, constants, readFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { CANONICAL_SKILLS } from './lib/release-contract.mjs';
import { SOLC_OVERRIDE_ENV, describeSolcFailure, resolveSolc } from './lib/solc.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const packageJson = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
const toolchain = JSON.parse(readFileSync(path.join(root, 'recipes/build-test/toolchain.json'), 'utf8'));
const results = [];

function record(level, label, detail, fix = null) {
  results.push({ level, label, detail, fix });
}

function tool(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: 'utf8', timeout: 15000, maxBuffer: 1024 * 1024, ...options,
  });
  return {
    ok: !result.error && result.status === 0,
    status: result.status,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    error: result.error ?? null,
  };
}

function parseVersion(text) {
  const match = /^v?(\d+)\.(\d+)\.(\d+)/.exec(text.trim());
  return match ? match.slice(1).map(Number) : null;
}

function compareVersions(a, b) {
  for (let i = 0; i < 3; i += 1) {
    if (a[i] !== b[i]) return a[i] - b[i];
  }
  return 0;
}

// Minimal comparator support for the engine range recorded in package.json
// (">=x.y.z <major"). No new dependency is introduced for a two-clause range.
function satisfiesRange(version, range) {
  const parts = parseVersion(version);
  if (!parts) return false;
  return range.trim().split(/\s+/).every((clause) => {
    const match = /^(>=|<)(\d+(?:\.\d+){0,2})$/.exec(clause);
    if (!match) return false;
    const bound = match[2].split('.').map(Number);
    while (bound.length < 3) bound.push(0);
    const order = compareVersions(parts, bound);
    return match[1] === '>=' ? order >= 0 : order < 0;
  });
}

function findExecutable(name) {
  for (const directory of (process.env.PATH ?? '').split(path.delimiter)) {
    if (!directory) continue;
    const candidate = path.join(directory, name);
    try {
      accessSync(candidate, constants.X_OK);
      return candidate;
    } catch { /* keep looking */ }
  }
  return null;
}

// 1. Node.js
const nodeVersion = process.versions.node;
if (satisfiesRange(nodeVersion, packageJson.engines.node)) {
  record('PASS', 'Node.js', `${nodeVersion} satisfies "${packageJson.engines.node}".`);
} else {
  record('FAIL', 'Node.js', `${nodeVersion} does not satisfy "${packageJson.engines.node}".`,
    'Install Node.js 24.20.0; see docs/quickstart.md step 1.');
}

// 2. npm
const npmPin = /^npm@(.+)$/.exec(packageJson.packageManager)?.[1] ?? null;
const npmResult = tool('npm', ['--version']);
const npmVersion = npmResult.ok ? npmResult.stdout.trim() : null;
if (!npmVersion) {
  record('FAIL', 'npm', 'npm is not runnable from PATH.', `Install npm ${npmPin}: npm install -g npm@${npmPin}`);
} else if (npmVersion === npmPin) {
  record('PASS', 'npm', `${npmVersion} matches the pinned package manager "${packageJson.packageManager}".`);
} else {
  record('FAIL', 'npm', `${npmVersion} does not match the pinned "${packageJson.packageManager}".`,
    `Run: npm install -g npm@${npmPin}`);
}

// 3. Forge
const forgePath = findExecutable('forge');
const forgeResult = forgePath ? tool(forgePath, ['--version']) : null;
if (!forgeResult?.ok) {
  record('FAIL', 'Forge', `Forge ${toolchain.forge_version} is not runnable from PATH.`,
    `Install Foundry ${toolchain.forge_version}: curl -L https://foundry.paradigm.xyz | bash && foundryup --install ${toolchain.forge_version}`);
} else {
  const version = /Version:\s*(\S+)/.exec(forgeResult.stdout)?.[1] ?? null;
  const commit = /Commit SHA:\s*([0-9a-f]+)/.exec(forgeResult.stdout)?.[1] ?? null;
  if (version === toolchain.forge_version && commit === toolchain.forge_commit) {
    record('PASS', 'Forge', `${version} (commit ${commit.slice(0, 12)}…) matches recipes/build-test/toolchain.json.`);
  } else {
    record('FAIL', 'Forge', `Observed version ${version ?? 'UNKNOWN'} (commit ${commit ?? 'UNKNOWN'}), pinned ${toolchain.forge_version} (commit ${toolchain.forge_commit}).`,
      `foundryup --install ${toolchain.forge_version}`);
  }
}

// 4. Native solc. One shared resolver defines the same precedence used by
// example preparation and the integration tests. QIE_FORGE_SOLC is
// authoritative; a broken override fails instead of falling back. A native
// PATH installation is used directly, and a solc-select wrapper is resolved to
// an existing artifact without executing the wrapper or downloading anything.
let solcLabel = Object.hasOwn(process.env, SOLC_OVERRIDE_ENV)
  ? `solc (${SOLC_OVERRIDE_ENV})`
  : 'solc (PATH)';
try {
  const resolved = resolveSolc({ root, toolchain });
  solcLabel = resolved.source === 'solc-select artifact' ? 'solc (solc-select artifact)' : `solc (${resolved.source})`;
  record('PASS', solcLabel, `${resolved.version} at ${resolved.path}; native compile probe succeeded.`);
} catch (error) {
  const failure = describeSolcFailure(error);
  if (!Object.hasOwn(process.env, SOLC_OVERRIDE_ENV) && failure.code === 'SOLC_NOT_NATIVE') {
    solcLabel = 'solc (PATH)';
  }
  record('FAIL', solcLabel, failure.message, failure.remediation);
}

// 5. Dependencies and generated bundles. The installed verifier is reused so the
// doctor reports the same coherence contract as a consumer install.
const dependenciesPresent = ['ajv', 'skills'].every((name) => {
  try {
    accessSync(path.join(root, 'node_modules', name, 'package.json'));
    return true;
  } catch { return false; }
});
if (!dependenciesPresent) {
  record('FAIL', 'Dependencies', 'node_modules is absent or incomplete.',
    'Run: npm ci --ignore-scripts --no-audit --no-fund');
  record('SKIP', 'Skill bundles', 'Bundle coherence needs the installed dependencies.', 'Run npm ci, then npm run doctor again.');
} else {
  try {
    const { inspectInstalledRelease } = await import('./lib/installed-release.mjs');
    const report = await inspectInstalledRelease(path.join(root, 'skills'), {
      expectedSkills: [...CANONICAL_SKILLS],
      claudeRoot: null,
    });
    if (report.status === 'COHERENT_FULL_SUITE' && report.verificationComplete) {
      record('PASS', 'Skill bundles', `Nine coherent bundles; release ${report.releaseId}.`);
    } else {
      record('FAIL', 'Skill bundles', `${report.status}; ${report.problems.slice(0, 3).join('; ') || 'verification incomplete'}`,
        'Regenerate owned output with: npm run build');
    }
  } catch (error) {
    record('FAIL', 'Skill bundles', `Bundle verification could not run: ${error.message}`,
      'Run: npm ci --ignore-scripts --no-audit --no-fund && npm run build');
  }
}

// Report
const failures = results.filter((result) => result.level === 'FAIL');
const skipped = results.filter((result) => result.level === 'SKIP');
console.log('QIE Forge environment doctor');
console.log('Supported environment: Node.js 24.20.0, npm 11.19.0, Forge 1.8.1, native solc 0.8.37 (recipes/build-test/toolchain.json).');
console.log('Offline: no QIE endpoint, wallet, download or install is used.\n');
for (const result of results) {
  console.log(`[${result.level}] ${result.label}: ${result.detail}`);
  if (result.fix) console.log(`       Fix: ${result.fix}`);
}
console.log('');
if (failures.length || skipped.length) {
  console.log(`doctor: NOT_READY — ${failures.length} failed, ${skipped.length} skipped. Nothing was installed or downloaded.`);
  process.exitCode = 1;
} else {
  console.log('doctor: READY — required prerequisites passed. This does not prove QIE network or wallet compatibility.');
}
