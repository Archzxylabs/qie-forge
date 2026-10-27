// Agent-agnostic consumer bootstrap for the QIE Forge skill suite.
//
// The pinned Skills CLI owns skill installation. This module owns the
// deterministic parts around it: agent selection, instruction-file projection,
// OpenCode config merging and post-install checks.

import { spawnSync } from 'node:child_process';
import { closeSync, existsSync, mkdtempSync, openSync, readFileSync, rmSync } from 'node:fs';
import { access, chmod, lstat, mkdir, readFile, realpath, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { CANONICAL_SKILLS } from './release-contract.mjs';
import { parseJsonc } from './jsonc.mjs';

export const MANAGED_START = '<!-- qie-forge:bootstrap:start -->';
export const MANAGED_END = '<!-- qie-forge:bootstrap:end -->';
export const OPENCODE_SCHEMA = 'https://opencode.ai/config.json';
export const OPENCODE_SKILLS_PATH = './.agents/skills';
export const OPENCODE_INSTRUCTIONS_PATH = './AGENTS.md';
export const OPENCODE_PERMISSIONS = Object.freeze([
  { action: 'skill', resource: 'qie', effect: 'allow' },
  { action: 'skill', resource: 'qie-*', effect: 'allow' },
]);

const POINTER_BODY = `# QIE Forge bootstrap

Read and follow \`AGENTS.md\` at the repository root before any QIE task. Load
the \`qie\` skill first. If the skill is unavailable, report the installation
gap instead of inventing its procedure.`;

const IMPORT_BODY = `# QIE Forge bootstrap

@AGENTS.md`;

const ANSI_PATTERN = /\u001b\[[0-9;]*m/g;

export function stripAnsi(value) {
  return String(value ?? '').replace(ANSI_PATTERN, '');
}

export function isRemoteSource(source) {
  return /^(?:https?:\/\/|git\+|git@|ssh:\/\/|git:\/\/)/.test(String(source));
}

export function expandHome(value, home = os.homedir(), xdgConfigHome = process.env.XDG_CONFIG_HOME, claudeConfigHome = process.env.CLAUDE_CONFIG_DIR) {
  if (typeof value !== 'string' || !value) return value;
  if (value === '~') return home;
  if (xdgConfigHome && value.startsWith('~/.config/')) {
    return path.join(xdgConfigHome, value.slice('~/.config/'.length));
  }
  if (claudeConfigHome && value.startsWith('~/.claude/')) {
    return path.join(claudeConfigHome, value.slice('~/.claude/'.length));
  }
  if (value.startsWith('~/')) return path.join(home, value.slice(2));
  return value;
}

export function normalizeAgentRequest(value) {
  const values = Array.isArray(value) ? value : [value];
  return values
    .flatMap((item) => String(item ?? '').split(','))
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
    .map((item) => (item === 'all' ? '*' : item));
}

function assertSafeRelativePath(value, label) {
  if (typeof value !== 'string' || !value || path.isAbsolute(value) || value.includes('\\')) {
    throw new Error(`${label} must be a relative POSIX path`);
  }
  const normalized = path.posix.normalize(value);
  if (normalized === '.' || normalized === '..' || normalized.startsWith('../')) {
    throw new Error(`${label} must stay inside the consumer project: ${value}`);
  }
  return normalized;
}

async function resolveWriteTarget(target, relative) {
  const base = await realpath(target);
  const absolute = path.resolve(base, relative);
  const remainder = path.relative(base, absolute);
  if (!remainder || remainder === '..' || remainder.startsWith(`..${path.sep}`) || path.isAbsolute(remainder)) {
    throw new Error(`Refusing to write outside the consumer project: ${relative}`);
  }

  const parts = remainder.split(path.sep);
  let current = base;
  for (const [index, part] of parts.entries()) {
    current = path.join(current, part);
    let info;
    try {
      info = await lstat(current);
    } catch (error) {
      if (error.code === 'ENOENT') return absolute;
      throw error;
    }
    if (info.isSymbolicLink()) {
      throw new Error(`Refusing to follow a symlink at ${path.relative(base, current)}`);
    }
    const last = index === parts.length - 1;
    if (last ? !info.isFile() : !info.isDirectory()) {
      throw new Error(`Refusing to write through a non-${last ? 'file' : 'directory'} at ${path.relative(base, current)}`);
    }
  }
  return absolute;
}

export function validateAgentMatrix(matrix) {
  if (!matrix || typeof matrix !== 'object' || Array.isArray(matrix)) {
    throw new Error('Agent matrix must be an object');
  }
  if (matrix.schema_version !== '1.0.0') {
    throw new Error(`Unsupported agent matrix schema: ${matrix.schema_version}`);
  }
  const agents = [matrix.canonical, ...(Array.isArray(matrix.agents) ? matrix.agents : [])];
  if (!matrix.canonical || typeof matrix.canonical !== 'object') {
    throw new Error('Agent matrix is missing the canonical entry');
  }
  if (matrix.canonical.id !== 'universal') {
    throw new Error('Agent matrix canonical entry must use the id "universal"');
  }
  if (matrix.canonical.cli_agent !== 'universal') {
    throw new Error('Agent matrix canonical entry must map to the CLI agent "universal"');
  }
  if (!Array.isArray(matrix.agents) || matrix.agents.length === 0) {
    throw new Error('Agent matrix must contain at least one agent');
  }

  const seen = new Set();
  for (const agent of agents) {
    if (!agent || typeof agent !== 'object' || Array.isArray(agent)) {
      throw new Error('Agent matrix entries must be objects');
    }
    if (typeof agent.id !== 'string' || !/^[a-z0-9][a-z0-9-]*$/.test(agent.id)) {
      throw new Error(`Invalid agent id: ${agent.id}`);
    }
    if (seen.has(agent.id)) throw new Error(`Duplicate agent id: ${agent.id}`);
    seen.add(agent.id);
    if (agent.cli_agent !== null && (typeof agent.cli_agent !== 'string' || !agent.cli_agent)) {
      throw new Error(`Agent ${agent.id} has an invalid cli_agent`);
    }
    if (agent.project_skills !== null) {
      assertSafeRelativePath(agent.project_skills, `Agent ${agent.id} project_skills`);
    }
    if (agent.global_skills !== null && (typeof agent.global_skills !== 'string' || !agent.global_skills)) {
      throw new Error(`Agent ${agent.id} has invalid global_skills`);
    }
    if (!Array.isArray(agent.instructions)) {
      throw new Error(`Agent ${agent.id} must declare an instructions array`);
    }
    if (agent.detect !== undefined && (!Array.isArray(agent.detect) || agent.detect.some((marker) => typeof marker !== 'string' || !marker))) {
      throw new Error(`Agent ${agent.id} must declare detect as an array of non-empty strings`);
    }
    for (const marker of agent.detect ?? []) {
      assertSafeRelativePath(marker, `Agent ${agent.id} detect marker`);
    }
    for (const spec of agent.instructions) {
      if (!spec || typeof spec !== 'object') throw new Error(`Agent ${agent.id} has an invalid instruction spec`);
      assertSafeRelativePath(spec.path, `Agent ${agent.id} instruction path`);
      if (!['markdown', 'cursor-rule', 'windsurf-rule', 'kiro-steering', 'continue-rule', 'opencode-config'].includes(spec.format)) {
        throw new Error(`Agent ${agent.id} has an unsupported instruction format: ${spec.format}`);
      }
      if (spec.body !== undefined && !['full', 'pointer', 'import-agents'].includes(spec.body)) {
        throw new Error(`Agent ${agent.id} has an unsupported instruction body: ${spec.body}`);
      }
    }
  }
  return matrix;
}

export async function loadAgentMatrix(templateRoot) {
  const filename = path.join(templateRoot, 'agents.json');
  const matrix = JSON.parse(await readFile(filename, 'utf8'));
  return validateAgentMatrix(matrix);
}

export function selectAgents({ matrix, requested = [], target, home = os.homedir(), global = false }) {
  const all = [matrix.canonical, ...matrix.agents];
  const byId = new Map(all.map((agent) => [agent.id, agent]));
  const normalized = normalizeAgentRequest(requested);
  const warnings = [];
  const detectedAgents = all.filter((agent) => (agent.detect ?? []).some((marker) => existsSync(path.join(target, marker))));
  let mode;
  let selected = [];
  let cliAgents = [];
  let detected = [];

  const cliAgentsFor = (agents) => {
    const seenGlobalPaths = new Set();
    const filtered = agents.filter((agent) => {
      if (!agent.cli_agent) return false;
      if (!global) return agent.project_skills !== '.agents/skills';
      const key = agent.global_skills ?? '';
      if (!key || seenGlobalPaths.has(key)) return false;
      seenGlobalPaths.add(key);
      return true;
    });
    return ['universal', ...filtered.map((agent) => agent.cli_agent)];
  };

  if (normalized.includes('*')) {
    mode = 'all';
    selected = all;
    cliAgents = ['*'];
  } else if (normalized.includes('matrix')) {
    mode = 'matrix';
    selected = all;
    cliAgents = cliAgentsFor(all);
  } else if (!normalized.length || (normalized.length === 1 && normalized[0] === 'auto')) {
    mode = 'auto';
    detected = detectedAgents;
    selected = [matrix.canonical, ...detectedAgents];
    cliAgents = cliAgentsFor(selected);
  } else {
    mode = 'explicit';
    const unknown = [];
    for (const id of normalized) {
      if (id === 'universal') {
        selected.push(matrix.canonical);
        continue;
      }
      if (id === 'auto') {
        selected.push(...detectedAgents);
        detected = detectedAgents;
        continue;
      }
      const agent = byId.get(id);
      if (agent) selected.push(agent);
      else unknown.push(id);
    }
    selected.unshift(matrix.canonical);
    if (unknown.length) warnings.push(`Unknown agent IDs have no curated projection: ${unknown.join(', ')}. Use --agent '*' for every CLI-supported agent.`);
    cliAgents = cliAgentsFor(selected);
  }

  selected = [...new Map(selected.map((agent) => [agent.id, agent])).values()];
  cliAgents = [...new Set(cliAgents)];
  detected = detected.map((agent) => agent.id);
  const unsupported = selected.filter((agent) => agent.cli_agent === null).map((agent) => agent.id);
  const notes = selected.filter((agent) => agent.notes).map((agent) => ({ agent: agent.id, note: agent.notes }));

  return {
    mode,
    selected,
    cliAgents,
    detected,
    unsupported,
    warnings,
    notes,
    home,
  };
}

export function buildInstallArgs({ source, cliAgents, copy = true, global = false }) {
  const args = ['add', source, '--skill', '*', '--yes', '--json'];
  for (const agent of cliAgents) args.push('--agent', agent);
  if (copy) args.push('--copy');
  if (global) args.push('--global');
  return args;
}

export function runCommand(command, args, options = {}) {
  const root = mkdtempSync(path.join(os.tmpdir(), 'qie-forge-bootstrap-'));
  const stdoutPath = path.join(root, 'stdout');
  const stderrPath = path.join(root, 'stderr');
  const stdout = openSync(stdoutPath, 'w');
  const stderr = openSync(stderrPath, 'w');
  try {
    const result = spawnSync(command, args, {
      cwd: options.cwd,
      env: { ...process.env, ...options.env },
      stdio: ['ignore', stdout, stderr],
      timeout: options.timeout ?? 180000,
      encoding: 'utf8',
    });
    return {
      status: result.status,
      signal: result.signal,
      error: result.error,
      stdout: readFileSync(stdoutPath, 'utf8'),
      stderr: readFileSync(stderrPath, 'utf8'),
    };
  } finally {
    closeSync(stdout);
    closeSync(stderr);
    rmSync(root, { recursive: true, force: true });
  }
}

export async function resolveSkillCli({ source, cli, projectRoot, env = process.env }) {
  const candidates = [];
  if (cli) candidates.push(path.resolve(cli));
  if (env.QIE_FORGE_SKILLS_CLI) candidates.push(path.resolve(env.QIE_FORGE_SKILLS_CLI));
  candidates.push(path.join(projectRoot, 'node_modules/skills/bin/cli.mjs'));
  if (!isRemoteSource(source)) candidates.push(path.join(source, 'node_modules/skills/bin/cli.mjs'));

  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  throw new Error(
    'Unable to find the pinned Skills CLI. Run `npm ci` in QIE-FORGE or pass --cli <path-to-cli.mjs>.',
  );
}

export function parseInstallOutput(stdout) {
  const text = stripAnsi(stdout).trim();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export function assessInstallRecords(records) {
  if (!Array.isArray(records)) return { ok: false, problems: ['Skills CLI did not return a JSON array'] };
  const byName = new Map(records.filter((record) => record && typeof record.name === 'string').map((record) => [record.name, record]));
  const problems = [];
  const accepted = new Set(['installed', 'updated', 'already-installed', 'unchanged']);
  for (const name of CANONICAL_SKILLS) {
    const record = byName.get(name);
    if (!record) {
      problems.push(`Missing install record for ${name}`);
      continue;
    }
    if (!accepted.has(record.status)) problems.push(`${name} reported status ${record.status}`);
  }
  return { ok: problems.length === 0, problems };
}

export async function installSkills({ cli, source, cliAgents, target, copy, global, env = process.env }) {
  const args = buildInstallArgs({ source, cliAgents, copy, global });
  const result = runCommand(process.execPath, [cli, ...args], {
    cwd: target,
    env: {
      CI: '1',
      NO_COLOR: '1',
      DISABLE_TELEMETRY: '1',
      DO_NOT_TRACK: '1',
      ...env,
    },
  });
  const records = parseInstallOutput(result.stdout);
  const assessment = assessInstallRecords(records);
  const ok = result.status === 0 && assessment.ok;
  return {
    ok,
    args,
    status: result.status,
    signal: result.signal,
    error: result.error?.message,
    records,
    problems: assessment.problems,
    stdout: result.stdout,
    stderr: result.stderr,
  };
}

export function parseVerifierOutput(stdout) {
  const text = stripAnsi(stdout).trim();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function verifyInstalledRelease({ verifier, root, releaseId, claudeRoot, cwd, env = process.env }) {
  const args = [verifier, '--root', root, '--expect-suite', '--json'];
  if (releaseId) args.push('--release-id', releaseId);
  if (claudeRoot) args.push('--claude-root', claudeRoot);
  else args.push('--no-claude');

  const result = runCommand(process.execPath, args, {
    cwd,
    env: {
      CI: '1',
      NO_COLOR: '1',
      DISABLE_TELEMETRY: '1',
      DO_NOT_TRACK: '1',
      ...env,
    },
  });
  const report = parseVerifierOutput(result.stdout);
  const ok = result.status === 0 && report?.verificationComplete === true;
  return {
    ok,
    status: result.status,
    report,
    problems: report?.problems ?? [],
    stdout: result.stdout,
    stderr: result.stderr,
  };
}

export async function verifyProjections({ agents, target, home = os.homedir(), global = false, xdgConfigHome = process.env.XDG_CONFIG_HOME, claudeConfigHome = process.env.CLAUDE_CONFIG_DIR }) {
  const checked = [];
  const problems = [];
  const seenRoots = new Set();

  for (const agent of agents) {
    if (!agent.cli_agent) continue;
    if (!global && (!agent.project_skills || agent.project_skills === '.agents/skills')) continue;
    const root = global ? expandHome(agent.global_skills, home, xdgConfigHome, claudeConfigHome) : path.join(target, agent.project_skills);
    if (!root || seenRoots.has(root)) continue;
    seenRoots.add(root);
    const missing = [];
    for (const name of CANONICAL_SKILLS) {
      try {
        await access(path.join(root, name, 'SKILL.md'));
      } catch {
        missing.push(name);
      }
    }
    checked.push({ agent: agent.id, root, ok: missing.length === 0, missing });
    if (missing.length) problems.push(`${agent.id} projection is missing: ${missing.join(', ')}`);
  }

  return { checked, problems };
}

export function splitFrontmatter(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return { frontmatter: null, body: text };
  return { frontmatter: match[1], body: text.slice(match[0].length) };
}

export function parseFrontmatterKeys(frontmatter) {
  if (frontmatter && typeof frontmatter === 'object') {
    return Object.fromEntries(Object.entries(frontmatter).map(([key, value]) => [key, String(value)]));
  }
  const keys = {};
  for (const line of String(frontmatter ?? '').split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (match) keys[match[1]] = match[2];
  }
  return keys;
}

export function ensureFrontmatter(frontmatter, required, { preserve = [] } = {}) {
  const seen = new Set();
  const preserved = new Set(preserve);
  const lines = String(frontmatter ?? '').split(/\r?\n/).map((line) => {
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match || required[match[1]] === undefined) return line;
    seen.add(match[1]);
    if (preserved.has(match[1])) return line;
    return `${match[1]}: ${required[match[1]]}`;
  });
  for (const [key, value] of Object.entries(required)) {
    if (!seen.has(key)) lines.push(`${key}: ${value}`);
  }
  return lines.join('\n');
}

export function renderInstruction(spec, blocks) {
  const body = spec.body === 'pointer' ? blocks.pointer : spec.body === 'import-agents' ? blocks.import : blocks.full;
  let frontmatter = null;
  if (spec.format === 'cursor-rule') {
    frontmatter = { description: 'QIE Forge bootstrap rules for QIE tasks', alwaysApply: 'true' };
  } else if (spec.format === 'windsurf-rule') {
    frontmatter = { trigger: 'always_on' };
  } else if (spec.format === 'kiro-steering') {
    frontmatter = { inclusion: 'always' };
  } else if (spec.format === 'continue-rule') {
    frontmatter = { description: 'QIE Forge bootstrap rules for QIE tasks', alwaysApply: 'true' };
  }
  return { body: body.trimEnd(), frontmatter };
}

export function composeInstructionFile({ frontmatter, body }, newline = '\n') {
  const normalizedBody = body.replace(/\r?\n/g, newline).trimEnd() + newline;
  if (!frontmatter) return normalizedBody;
  const frontmatterText = typeof frontmatter === 'string'
    ? frontmatter
    : Object.entries(frontmatter).map(([key, value]) => `${key}: ${value}`).join(newline);
  return `---${newline}${frontmatterText.replace(/\r?\n/g, newline)}${newline}---${newline}${newline}${normalizedBody}`;
}

export function upsertManagedBlock(existing, block) {
  const start = existing.indexOf(MANAGED_START);
  const end = existing.indexOf(MANAGED_END, start === -1 ? 0 : start);
  if (start === -1 && end !== -1) return { content: existing, status: 'malformed-managed-block' };
  if (start !== -1 && end === -1) return { content: existing, status: 'malformed-managed-block' };
  if (start !== -1 && end !== -1) {
    const before = existing.slice(0, start);
    let after = existing.slice(end + MANAGED_END.length);
    if (block.endsWith('\n')) after = after.replace(/^\r?\n/, '');
    const content = `${before}${block}${after}`;
    return { content, status: content === existing ? 'unchanged' : 'updated' };
  }
  if (/qie-forge:bootstrap|Load the `qie` skill first/i.test(existing)) {
    return { content: existing, status: 'skipped-existing-qie-rules' };
  }
  const separator = existing.length === 0 ? '' : existing.endsWith('\n') ? '\n' : '\n\n';
  return { content: `${existing}${separator}${block}`, status: 'appended' };
}

function normalizeNewlines(value, newline) {
  return String(value).replace(/\r?\n/g, newline);
}

export async function writeInstructionFile({ target, spec, blocks, dryRun = false }) {
  let filename;
  try {
    filename = await resolveWriteTarget(target, spec.path);
  } catch (error) {
    return { path: spec.path, status: 'unsafe-path', format: spec.format, error: error.message };
  }
  const rendered = renderInstruction(spec, blocks);

  if (dryRun) {
    return { path: spec.path, status: 'planned', format: spec.format };
  }

  const existing = existsSync(filename) ? await readFile(filename, 'utf8') : null;
  const newline = existing?.includes('\r\n') ? '\r\n' : '\n';
  const block = normalizeNewlines(rendered.body, newline).trimEnd() + newline;

  await mkdir(path.dirname(filename), { recursive: true });

  if (existing === null) {
    await writeFile(filename, composeInstructionFile(rendered, newline));
    return { path: spec.path, status: 'created', format: spec.format };
  }

  const split = splitFrontmatter(existing);
  const frontmatter = rendered.frontmatter
    ? split.frontmatter
      ? ensureFrontmatter(split.frontmatter, parseFrontmatterKeys(rendered.frontmatter), { preserve: ['description'] })
      : Object.entries(rendered.frontmatter).map(([key, value]) => `${key}: ${value}`).join(newline)
    : split.frontmatter ?? null;
  const result = upsertManagedBlock(split.frontmatter ? split.body.replace(/^\r?\n/, '') : existing, block);
  if (result.status === 'skipped-existing-qie-rules' || result.status === 'malformed-managed-block') {
    return { path: spec.path, status: result.status, format: spec.format };
  }
  const content = composeInstructionFile({ frontmatter, body: result.content }, newline);
  if (content === existing) return { path: spec.path, status: 'unchanged', format: spec.format };
  const status = result.status === 'unchanged' ? 'updated' : result.status;
  await writeFile(filename, content);
  return { path: spec.path, status, format: spec.format };
}

function findOpencodeConfig(target) {
  const candidates = [
    'opencode.json',
    'opencode.jsonc',
    path.join('.opencode', 'opencode.json'),
    path.join('.opencode', 'opencode.jsonc'),
  ];
  for (const candidate of candidates) {
    const filename = path.join(target, candidate);
    if (existsSync(filename)) return { relative: candidate, filename };
  }
  return null;
}

function asConfigArray(config, key) {
  if (config[key] === undefined) {
    config[key] = [];
    return config[key];
  }
  if (Array.isArray(config[key])) return config[key];
  if (typeof config[key] === 'string') {
    config[key] = [config[key]];
    return config[key];
  }
  throw new Error(`OpenCode config key "${key}" is not an array`);
}

function addUnique(array, value, compare = (a, b) => a === b) {
  if (!array.some((item) => compare(item, value))) array.push(value);
}

function backupFilename(filename) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `${filename}.qie-forge.${stamp}.bak`;
}

async function writeBackup(filename, content) {
  const backup = backupFilename(filename);
  const { mode } = await stat(filename);
  await writeFile(backup, content, { flag: 'wx', mode });
  await chmod(backup, mode);
  return backup;
}

function templateForFilename(template, filename) {
  if (!filename.endsWith('.json')) return template;
  return `${JSON.stringify(parseJsonc(template), null, 2)}\n`;
}

export async function writeOpencodeConfig({
  target,
  template,
  dryRun = false,
  merge = false,
  force = false,
}) {
  const existing = findOpencodeConfig(target);
  const relative = existing?.relative ?? 'opencode.jsonc';
  let filename;
  try {
    filename = await resolveWriteTarget(target, relative);
  } catch (error) {
    return { path: relative, status: 'unsafe-path', format: 'opencode-config', error: error.message };
  }

  if (dryRun) {
    return {
      path: relative,
      status: existing ? (merge ? 'planned-merge' : force ? 'planned-overwrite' : 'planned-check') : 'planned-create',
      format: 'opencode-config',
    };
  }

  await mkdir(path.dirname(filename), { recursive: true });

  if (!existing) {
    await writeFile(filename, templateForFilename(template, filename));
    return { path: relative, status: 'created', format: 'opencode-config' };
  }

  const content = await readFile(filename, 'utf8');
  if (!merge) {
    if (force) {
      const backup = await writeBackup(filename, content);
      await writeFile(filename, templateForFilename(template, filename));
      return { path: relative, status: 'overwritten', format: 'opencode-config', backup: path.basename(backup) };
    }
    if (/qie-forge|qie-\*|\.agents\/skills/.test(content)) {
      return { path: relative, status: 'unchanged', format: 'opencode-config' };
    }
    return {
      path: relative,
      status: 'skipped-existing',
      format: 'opencode-config',
      warning: 'Existing OpenCode config was left unchanged. Re-run with --merge-opencode-config to merge QIE entries, or add them manually.',
    };
  }

  let config;
  try {
    config = parseJsonc(content);
  } catch (error) {
    return {
      path: relative,
      status: 'invalid-jsonc',
      format: 'opencode-config',
      error: error.message,
    };
  }
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    return {
      path: relative,
      status: 'invalid-jsonc',
      format: 'opencode-config',
      error: 'OpenCode config must be a JSON object',
    };
  }

  try {
    config.$schema ??= OPENCODE_SCHEMA;
    addUnique(asConfigArray(config, 'skills'), OPENCODE_SKILLS_PATH);
    addUnique(asConfigArray(config, 'instructions'), OPENCODE_INSTRUCTIONS_PATH);
    const permissions = asConfigArray(config, 'permissions');
    for (const rule of OPENCODE_PERMISSIONS) {
      addUnique(
        permissions,
        rule,
        (left, right) => left?.action === right.action && left?.resource === right.resource && left?.effect === right.effect,
      );
    }
  } catch (error) {
    return {
      path: relative,
      status: 'invalid-shape',
      format: 'opencode-config',
      error: error.message,
    };
  }

  const backup = await writeBackup(filename, content);
  await writeFile(filename, `${JSON.stringify(config, null, 2)}\n`);
  return {
    path: relative,
    status: 'merged',
    format: 'opencode-config',
    backup: path.basename(backup),
    warning: 'OpenCode config was rewritten without comments. The original is in the backup file.',
  };
}

export async function writeInstructionSet({
  target,
  agents,
  templateRoot,
  dryRun = false,
  mergeOpencodeConfig = false,
  force = false,
}) {
  const fullBlock = (await readFile(path.join(templateRoot, 'AGENTS.md'), 'utf8')).trimEnd() + '\n';
  if (!fullBlock.includes(MANAGED_START) || !fullBlock.includes(MANAGED_END)) {
    throw new Error('templates/consumer/AGENTS.md must contain the managed block markers');
  }
  const pointerBlock = `${MANAGED_START}\n${POINTER_BODY}\n${MANAGED_END}\n`;
  const importBlock = `${MANAGED_START}\n${IMPORT_BODY}\n${MANAGED_END}\n`;
  const opencodeTemplate = await readFile(path.join(templateRoot, 'opencode.jsonc'), 'utf8');
  const blocks = { full: fullBlock, pointer: pointerBlock, import: importBlock };

  const specs = new Map();
  for (const agent of agents) {
    for (const spec of agent.instructions ?? []) {
      const key = path.posix.normalize(spec.path);
      if (!specs.has(key)) specs.set(key, { spec: { ...spec, path: key }, agents: [] });
      specs.get(key).agents.push(agent.id);
    }
  }

  const results = [];
  for (const { spec, agents: owners } of specs.values()) {
    let result;
    if (spec.format === 'opencode-config') {
      result = await writeOpencodeConfig({
        target,
        template: opencodeTemplate,
        dryRun,
        merge: mergeOpencodeConfig,
        force,
      });
    } else {
      result = await writeInstructionFile({ target, spec, blocks, dryRun });
    }
    results.push({ ...result, agents: owners });
  }
  return results;
}
