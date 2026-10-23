// One compiler-resolution contract for every repository-local workflow.
//
// QIE_FORGE_SOLC is authoritative when present. It must be an absolute path to
// a native compiler; a broken override fails instead of falling back to PATH.
// Otherwise an already-installed native solc is discovered on PATH, or a
// solc-select wrapper is resolved to an existing artifact without executing
// the wrapper. Nothing here installs, downloads or invokes an auto-installer.
import { accessSync, constants, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

export const SOLC_OVERRIDE_ENV = 'QIE_FORGE_SOLC';

const VERSION_TIMEOUT_MS = 30_000;
const PROBE_TIMEOUT_MS = 60_000;
const PROBE_SOURCE = '// QIE Forge offline native compiler probe.\ncontract QieForgeCompilerProbe { function ping() external pure returns (uint256) { return 1; } }\n';

export class SolcResolutionError extends Error {
  constructor(code, message, remediation) {
    super(message);
    this.name = 'SolcResolutionError';
    this.code = code;
    this.remediation = remediation;
  }
}

function executableFile(file) {
  try {
    accessSync(file, constants.X_OK);
    return statSync(file).isFile();
  } catch {
    return false;
  }
}

function headerOf(file) {
  try {
    return readFileSync(file).subarray(0, 8);
  } catch {
    return Buffer.alloc(0);
  }
}

function isNativeBinary(file) {
  const header = headerOf(file);
  if (header.length >= 4 && header[0] === 0x7f && header[1] === 0x45 && header[2] === 0x4c && header[3] === 0x46) {
    return true; // ELF (the supported Linux target)
  }
  const magic = header.length >= 4 ? header.readUInt32BE(0) : 0;
  const little = header.length >= 4 ? header.readUInt32LE(0) : 0;
  // Mach-O (thin and universal) and PE are accepted so the helper does not
  // falsely reject a native compiler on another host platform.
  return [0xfeedface, 0xfeedfacf, 0xcefaedfe, 0xcffaedfe, 0xcafebabe, 0xbebafeca].includes(magic)
    || [0xfeedface, 0xfeedfacf, 0xcefaedfe, 0xcffaedfe, 0xcafebabe, 0xbebafeca].includes(little)
    || (header.length >= 2 && header[0] === 0x4d && header[1] === 0x5a);
}

function looksLikeSolcSelectWrapper(file) {
  try {
    const text = readFileSync(file, { encoding: 'utf8' });
    return /solc[_-]?select|from\s+solc_select|solc-select/i.test(text);
  } catch {
    return false;
  }
}

function run(file, args, env, timeout, input) {
  return spawnSync(file, args, {
    encoding: 'utf8',
    timeout,
    maxBuffer: 4 * 1024 * 1024,
    env,
    input,
  });
}

function reportedVersion(stdout, stderr) {
  return /^Version:\s*(\S+)/m.exec(`${stdout ?? ''}${stderr ?? ''}`)?.[1] ?? null;
}

function detail(result, fallback) {
  const text = `${result.stdout ?? ''}${result.stderr ?? ''}`.trim();
  return text ? text.split('\n').slice(0, 3).join(' | ') : (result.error?.message ?? fallback);
}

function verifyNative(file, pin, env) {
  if (!executableFile(file)) {
    throw new SolcResolutionError(
      'SOLC_NOT_EXECUTABLE',
      `The compiler path ${file} is not an executable file.`,
      `Set ${SOLC_OVERRIDE_ENV} to the absolute path of an existing native solc ${pin.split('+')[0]} binary.`,
    );
  }
  if (!isNativeBinary(file)) {
    throw new SolcResolutionError(
      'SOLC_NOT_NATIVE',
      `The compiler at ${file} is not a native solc binary.`,
      `Set ${SOLC_OVERRIDE_ENV} to the absolute path of the native solc ${pin.split('+')[0]} binary, not a wrapper or script.`,
    );
  }

  const versionResult = run(file, ['--version'], env, VERSION_TIMEOUT_MS);
  const reported = reportedVersion(versionResult.stdout, versionResult.stderr);
  if (versionResult.error || versionResult.status !== 0 || reported === null) {
    throw new SolcResolutionError(
      'SOLC_INCOMPATIBLE',
      `The compiler at ${file} did not complete a native version probe: ${detail(versionResult, 'no version output')}.`,
      `Use an existing native solc ${pin} binary and set ${SOLC_OVERRIDE_ENV} to its absolute path.`,
    );
  }
  if (!reported.startsWith(pin)) {
    throw new SolcResolutionError(
      'SOLC_VERSION_MISMATCH',
      `Observed ${reported} at ${file}, pinned ${pin}.`,
      `Set ${SOLC_OVERRIDE_ENV} to an absolute native solc ${pin} binary.`,
    );
  }

  const probeResult = run(file, ['--bin', '-'], env, PROBE_TIMEOUT_MS, PROBE_SOURCE);
  const probeOutput = `${probeResult.stdout ?? ''}${probeResult.stderr ?? ''}`;
  if (probeResult.error || probeResult.status !== 0 || !/Binary:/.test(probeOutput)) {
    throw new SolcResolutionError(
      'SOLC_PROBE_FAILED',
      `The compiler at ${file} did not complete a native compile probe: ${detail(probeResult, 'no compiler output')}.`,
      `Use an existing native solc ${pin} binary that can compile offline, and set ${SOLC_OVERRIDE_ENV} to its absolute path.`,
    );
  }

  return { path: file, version: reported, source: null };
}

function solcSelectArtifact(env, pin) {
  if (!env.HOME) return null;
  const version = pin.split('+')[0];
  const artifact = path.join(env.HOME, '.solc-select', 'artifacts', `solc-${version}`, `solc-${version}`);
  return executableFile(artifact) && isNativeBinary(artifact) ? artifact : null;
}

function pathCandidates(env) {
  const candidates = [];
  const seen = new Set();
  for (const directory of (env.PATH ?? '').split(path.delimiter)) {
    if (!directory) continue;
    const candidate = path.resolve(directory, 'solc');
    if (seen.has(candidate)) continue;
    seen.add(candidate);
    candidates.push(candidate);
  }
  return candidates;
}

/**
 * Resolve the one compiler a workflow may use.
 *
 * Precedence: QIE_FORGE_SOLC (authoritative, absolute native binary) → an
 * already-installed native solc on PATH → a solc-select artifact referenced by
 * a wrapper on PATH. A wrapper is never executed while resolving it, because
 * solc-select may download a compiler when the selected version is absent.
 *
 * @returns {{ path: string, version: string, source: 'QIE_FORGE_SOLC'|'PATH'|'solc-select artifact' }}
 */
export function resolveSolc({ toolchain, env = process.env, root = process.cwd() }) {
  const pins = toolchain ?? JSON.parse(readFileSync(path.join(root, 'recipes/build-test/toolchain.json'), 'utf8'));
  if (!pins?.solc_version) throw new Error('The pinned solc version is missing from recipes/build-test/toolchain.json');

  const overridePresent = Object.hasOwn(env, SOLC_OVERRIDE_ENV);
  if (overridePresent) {
    const override = env[SOLC_OVERRIDE_ENV];
    if (!override || !path.isAbsolute(override)) {
      throw new SolcResolutionError(
        'SOLC_OVERRIDE_NOT_ABSOLUTE',
        `${SOLC_OVERRIDE_ENV} must be an absolute path; observed ${JSON.stringify(override ?? '')}.`,
        `Set ${SOLC_OVERRIDE_ENV} to the absolute path of an existing native solc ${pins.solc_version} binary.`,
      );
    }
    if (!executableFile(override)) {
      throw new SolcResolutionError(
        'SOLC_OVERRIDE_MISSING',
        `${SOLC_OVERRIDE_ENV} points at ${override}, which is not an executable file. The override is authoritative; no fallback was tried.`,
        `Fix or unset ${SOLC_OVERRIDE_ENV}. To keep it, point it at the absolute path of a native solc ${pins.solc_version} binary.`,
      );
    }
    if (!isNativeBinary(override)) {
      const wrapper = looksLikeSolcSelectWrapper(override);
      throw new SolcResolutionError(
        'SOLC_OVERRIDE_NOT_NATIVE',
        wrapper
          ? `${SOLC_OVERRIDE_ENV} points at a solc-select wrapper, not a native compiler. The override is authoritative; no fallback was tried.`
          : `${SOLC_OVERRIDE_ENV} points at ${override}, which is not a native solc binary. The override is authoritative; no fallback was tried.`,
        `Set ${SOLC_OVERRIDE_ENV} to the existing native artifact (for example $HOME/.solc-select/artifacts/solc-${pins.solc_version.split('+')[0]}/solc-${pins.solc_version.split('+')[0]}).`,
      );
    }
    const verified = verifyNative(override, pins.solc_version, env);
    return { ...verified, source: 'QIE_FORGE_SOLC' };
  }

  let firstProblem = null;
  let wrapperSeen = null;
  for (const candidate of pathCandidates(env)) {
    if (!executableFile(candidate)) continue;
    if (!isNativeBinary(candidate)) {
      if (looksLikeSolcSelectWrapper(candidate)) {
        wrapperSeen = candidate;
        const artifact = solcSelectArtifact(env, pins.solc_version);
        if (artifact) {
          try {
            const verified = verifyNative(artifact, pins.solc_version, env);
            return { ...verified, source: 'solc-select artifact' };
          } catch (error) {
            if (!(error instanceof SolcResolutionError)) throw error;
            firstProblem ??= error;
          }
        }
      }
      firstProblem ??= new SolcResolutionError(
        'SOLC_NOT_NATIVE',
        `The solc on PATH at ${candidate} is not a native solc binary.`,
        `Install native solc ${pins.solc_version} or set ${SOLC_OVERRIDE_ENV} to its absolute path; wrappers are not executed during discovery.`,
      );
      continue;
    }
    try {
      const verified = verifyNative(candidate, pins.solc_version, env);
      return { ...verified, source: 'PATH' };
    } catch (error) {
      if (!(error instanceof SolcResolutionError)) throw error;
      firstProblem ??= error;
    }
  }

  if (wrapperSeen) {
    throw new SolcResolutionError(
      'SOLC_WRAPPER_UNRESOLVED',
      `The solc on PATH at ${wrapperSeen} is a solc-select wrapper, and no compatible existing solc ${pins.solc_version} artifact was found under HOME. The wrapper was not executed, so nothing was downloaded.`,
      `Set ${SOLC_OVERRIDE_ENV} to an existing native solc ${pins.solc_version} binary, or make a native solc available directly on PATH.`,
    );
  }
  if (firstProblem) throw firstProblem;
  throw new SolcResolutionError(
    'SOLC_NOT_FOUND',
    `Native solc ${pins.solc_version} was not found on PATH, and ${SOLC_OVERRIDE_ENV} is unset. Nothing was installed or downloaded.`,
    `Install native solc ${pins.solc_version}, make it available on PATH, or set ${SOLC_OVERRIDE_ENV} to its absolute path.`,
  );
}

export function describeSolcFailure(error) {
  return {
    code: error instanceof SolcResolutionError ? error.code : 'SOLC_RESOLUTION_FAILED',
    message: error?.message ?? String(error),
    remediation: error instanceof SolcResolutionError
      ? error.remediation
      : `Run npm run doctor and set ${SOLC_OVERRIDE_ENV} to an absolute native solc 0.8.37 binary.`,
  };
}
