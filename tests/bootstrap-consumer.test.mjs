import test from 'node:test';
import assert from 'node:assert/strict';
import { access, chmod, cp, lstat, mkdir, mkdtemp, readdir, readFile, realpath, rm, stat, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { runNode, runNodeResult } from './support/process.mjs';
import { buildRelease } from '../scripts/lib/release.mjs';
import { projectRoot, releasedSkills } from './support/fixtures.mjs';
import { parseJsonc } from '../scripts/lib/jsonc.mjs';
import { buildInstallArgs, expandHome, isRemoteSource, loadAgentMatrix, MANAGED_END, MANAGED_START, selectAgents, upsertManagedBlock, validateAgentMatrix } from '../scripts/lib/consumer-bootstrap.mjs';

const bootstrap = path.join(projectRoot, 'scripts/bootstrap-consumer.mjs');
const cli = path.join(projectRoot, 'node_modules/skills/bin/cli.mjs');

let source;

test.before(async () => {
  source = await mkdtemp(path.join(os.tmpdir(), 'qie-forge-bootstrap-source-'));
  for (const name of ['authoring', 'knowledge', 'scripts', 'recipes', 'release-context.json']) {
    await cp(path.join(projectRoot, name), path.join(source, name), { recursive: true });
  }
  await buildRelease(source);
});

test.after(async () => {
  await rm(source, { recursive: true, force: true });
});

async function consumer(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'qie-forge-bootstrap-consumer-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, 'home'), { recursive: true });
  return root;
}

function environment(root) {
  return {
    HOME: path.join(root, 'home'),
    XDG_CONFIG_HOME: path.join(root, 'config'),
    CI: '1',
    NO_COLOR: '1',
    DISABLE_TELEMETRY: '1',
    DO_NOT_TRACK: '1',
  };
}

async function exists(filename) {
  try {
    await access(filename);
    return true;
  } catch {
    return false;
  }
}

function runBootstrap(root, args) {
  return JSON.parse(runNode([bootstrap, ...args], { cwd: root, env: environment(root) }));
}

function runBootstrapResult(root, args) {
  const result = runNodeResult([bootstrap, ...args], { cwd: root, env: environment(root) });
  return {
    ...result,
    report: result.stdout.trim() ? JSON.parse(result.stdout) : null,
  };
}

test('bootstrap installs the canonical suite and writes AGENTS.md', async (t) => {
  const root = await consumer(t);
  const report = runBootstrap(root, [
    '--source', source,
    '--target', root,
    '--cli', cli,
    '--agent', 'universal',
    '--copy',
    '--json',
  ]);

  assert.equal(report.ok, true);
  assert.equal(report.install.status, 'PASS');
  assert.equal(report.verification.status, 'PASS');
  assert.equal(report.verification.canonical.verificationComplete, true);
  assert.deepEqual((await readdir(path.join(root, '.agents/skills'))).sort(), [...releasedSkills].sort());

  const agents = await readFile(path.join(root, 'AGENTS.md'), 'utf8');
  assert.match(agents, /qie-forge:bootstrap:start/);
  assert.match(agents, /Load the `qie` skill before any other QIE skill/);
  assert.match(agents, /Signing, broadcasting, deploying, and spending/);
  assert.equal(await exists(path.join(root, 'opencode.jsonc')), false);
});

test('bootstrap writes agent-native instructions and is idempotent', async (t) => {
  const root = await consumer(t);
  const args = [
    '--target', root,
    '--agent', 'matrix',
    '--no-install',
    '--no-verify',
    '--json',
  ];
  const first = runBootstrap(root, args);
  assert.equal(first.ok, true);

  const expected = [
    'AGENTS.md',
    'opencode.jsonc',
    'CLAUDE.md',
    '.cursor/rules/qie-forge.mdc',
    'GEMINI.md',
    '.github/copilot-instructions.md',
    '.windsurf/rules/qie-forge.md',
    '.clinerules/qie-forge.md',
    '.roo/rules/qie-forge.md',
    '.kiro/steering/qie-forge.md',
    'QWEN.md',
    '.continue/rules/qie-forge.md',
    '.junie/guidelines.md',
    '.trae/rules/project_rules.md',
    '.amazonq/rules/qie-forge.md',
    '.goosehints',
    'CONVENTIONS.md',
  ];
  for (const filename of expected) assert.equal(await exists(path.join(root, filename)), true, filename);

  assert.match(await readFile(path.join(root, 'CLAUDE.md'), 'utf8'), /@AGENTS\.md/);
  assert.match(await readFile(path.join(root, '.cursor/rules/qie-forge.mdc'), 'utf8'), /alwaysApply: true/);
  assert.match(await readFile(path.join(root, '.windsurf/rules/qie-forge.md'), 'utf8'), /trigger: always_on/);
  assert.match(await readFile(path.join(root, '.kiro/steering/qie-forge.md'), 'utf8'), /inclusion: always/);
  assert.match(await readFile(path.join(root, '.continue/rules/qie-forge.md'), 'utf8'), /alwaysApply: true/);

  const agentsBefore = await readFile(path.join(root, 'AGENTS.md'), 'utf8');
  const cursorBefore = await readFile(path.join(root, '.cursor/rules/qie-forge.mdc'), 'utf8');
  const second = runBootstrap(root, args);
  assert.equal(second.ok, true);
  assert.equal(second.instructions.find((item) => item.path === 'AGENTS.md').status, 'unchanged');
  assert.equal(second.instructions.find((item) => item.path === '.cursor/rules/qie-forge.mdc').status, 'unchanged');
  assert.equal(await readFile(path.join(root, 'AGENTS.md'), 'utf8'), agentsBefore);
  assert.equal(await readFile(path.join(root, '.cursor/rules/qie-forge.mdc'), 'utf8'), cursorBefore);
  assert.equal((agentsBefore.match(/qie-forge:bootstrap:start/g) ?? []).length, 1);
});

test('bootstrap preserves existing AGENTS.md and OpenCode config', async (t) => {
  const root = await consumer(t);
  await writeFile(path.join(root, 'AGENTS.md'), '# Existing project\n\nKeep this line.\n');
  await writeFile(path.join(root, 'opencode.jsonc'), '{\n  // keep my model\n  "model": "keep/me",\n}\n');

  const report = runBootstrap(root, [
    '--target', root,
    '--agent', 'opencode',
    '--no-install',
    '--no-verify',
    '--json',
  ]);
  assert.equal(report.ok, true);

  const agents = await readFile(path.join(root, 'AGENTS.md'), 'utf8');
  assert.match(agents, /^# Existing project/);
  assert.match(agents, /Keep this line\./);
  assert.equal((agents.match(/qie-forge:bootstrap:start/g) ?? []).length, 1);

  const config = await readFile(path.join(root, 'opencode.jsonc'), 'utf8');
  assert.match(config, /keep\/me/);
  assert.match(config, /keep my model/);
  const opencode = report.instructions.find((item) => item.path === 'opencode.jsonc');
  assert.equal(opencode.status, 'skipped-existing');
  assert.ok(report.warnings.some((warning) => warning.includes('opencode.jsonc')));
});

test('bootstrap merges an existing OpenCode config on request', async (t) => {
  const root = await consumer(t);
  await writeFile(path.join(root, 'opencode.jsonc'), `{
    "$schema": "https://opencode.ai/config.json",
    // keep my model
    "model": "keep/me",
    "skills": ["./team-skills",],
  }\n`);

  const report = runBootstrap(root, [
    '--target', root,
    '--agent', 'opencode',
    '--no-install',
    '--no-verify',
    '--merge-opencode-config',
    '--json',
  ]);
  assert.equal(report.ok, true);

  const merged = report.instructions.find((item) => item.path === 'opencode.jsonc');
  assert.equal(merged.status, 'merged');
  assert.ok(merged.backup);
  assert.equal(await exists(path.join(root, merged.backup)), true);

  const config = parseJsonc(await readFile(path.join(root, 'opencode.jsonc'), 'utf8'));
  assert.equal(config.model, 'keep/me');
  assert.ok(config.skills.includes('./team-skills'));
  assert.ok(config.skills.includes('./.agents/skills'));
  assert.ok(config.instructions.includes('./AGENTS.md'));
  assert.ok(config.permissions.some((rule) => rule.action === 'skill' && rule.resource === 'qie'));
  assert.ok(config.permissions.some((rule) => rule.action === 'skill' && rule.resource === 'qie-*'));
});

test('OpenCode merges preserve the precedence and order of existing permission rules', async (t) => {
  const root = await consumer(t);
  const filename = path.join(root, 'opencode.jsonc');
  const originalRules = [
    { action: 'skill', resource: '*', effect: 'ask' },
    { action: 'skill', resource: 'qie', effect: 'allow' },
    { action: 'skill', resource: 'qie-deployment', effect: 'deny' },
    { action: 'skill', resource: 'qie-wallets', effect: 'ask' },
    { action: 'bash', resource: '*', effect: 'deny' },
  ];
  const original = `${JSON.stringify({ permissions: originalRules }, null, 2)}\n`;
  await writeFile(filename, original);

  const args = [
    '--target', root,
    '--agent', 'opencode',
    '--no-install',
    '--no-verify',
    '--merge-opencode-config',
    '--json',
  ];
  const first = runBootstrap(root, args);
  assert.equal(first.ok, true);
  const config = parseJsonc(await readFile(filename, 'utf8'));
  // OpenCode applies the last matching rule. Existing catch-all, ask and deny
  // rules must retain priority over defaults introduced by the bootstrap.
  assert.deepEqual(config.permissions, [
    { action: 'skill', resource: 'qie-*', effect: 'allow' },
    ...originalRules,
  ]);
  const result = first.instructions.find((item) => item.path === 'opencode.jsonc');
  assert.equal(await readFile(path.join(root, result.backup), 'utf8'), original);

  const second = runBootstrap(root, args);
  assert.equal(second.ok, true);
  assert.deepEqual(parseJsonc(await readFile(filename, 'utf8')).permissions, config.permissions);
});

test('bootstrap dry-run plans installation without writing skills', async (t) => {
  const root = await consumer(t);
  const report = runBootstrap(root, [
    '--target', root,
    '--agent', 'matrix',
    '--dry-run',
    '--json',
  ]);
  assert.equal(report.ok, true);
  assert.equal(report.dryRun, true);
  assert.equal(report.install.status, 'PLANNED');
  assert.ok(report.install.args.includes('add'));
  assert.equal(report.verification.status, 'SKIPPED');
  assert.match(report.verification.reason, /dry run/);
  assert.equal(await exists(path.join(root, '.agents/skills')), false);
  assert.equal(await exists(path.join(root, 'AGENTS.md')), false);
  assert.equal(await exists(path.join(root, 'opencode.jsonc')), false);
  assert.ok(report.instructions.every((item) => item.status.startsWith('planned')));
});

test('bootstrap dry-run writes nothing', async (t) => {
  const root = await consumer(t);
  const report = runBootstrap(root, [
    '--target', root,
    '--agent', 'matrix',
    '--no-install',
    '--no-verify',
    '--dry-run',
    '--json',
  ]);
  assert.equal(report.ok, true);
  assert.equal(report.dryRun, true);
  assert.equal(await exists(path.join(root, 'AGENTS.md')), false);
  assert.equal(await exists(path.join(root, 'opencode.jsonc')), false);
  assert.ok(report.instructions.every((item) => item.status.startsWith('planned')));
});

test('bootstrap projects to Claude Code and verifies the projection', async (t) => {
  const root = await consumer(t);
  const report = runBootstrap(root, [
    '--source', source,
    '--target', root,
    '--cli', cli,
    '--agent', 'claude-code',
    '--copy',
    '--json',
  ]);
  assert.equal(report.ok, true);
  assert.equal(report.install.status, 'PASS');
  assert.equal(report.verification.status, 'PASS');
  assert.deepEqual((await readdir(path.join(root, '.claude/skills'))).sort(), [...releasedSkills].sort());
  assert.match(await readFile(path.join(root, 'CLAUDE.md'), 'utf8'), /@AGENTS\.md/);
  assert.equal(report.verification.projections[0].agent, 'claude-code');
  assert.equal(report.verification.projections[0].ok, true);
});

test('bootstrap symlink mode links agent projections to the canonical store', async (t) => {
  const root = await consumer(t);
  const report = runBootstrap(root, [
    '--source', source,
    '--target', root,
    '--cli', cli,
    '--agent', 'claude-code',
    '--symlink',
    '--json',
  ]);
  assert.equal(report.ok, true);
  assert.equal(report.install.status, 'PASS');
  assert.equal(report.install.mode, 'symlink');
  assert.equal(report.install.requestedMode, 'symlink');
  assert.equal(report.install.skills[0].mode, 'symlink');
  const link = path.join(root, '.claude/skills/qie');
  assert.equal((await lstat(link)).isSymbolicLink(), true);
  assert.equal(await realpath(link), path.join(root, '.agents/skills/qie'));
  assert.equal(report.verification.status, 'PASS');
});

test('bootstrap global mode installs skills only', async (t) => {
  const root = await consumer(t);
  const report = runBootstrap(root, [
    '--source', source,
    '--target', root,
    '--cli', cli,
    '--agent', 'universal',
    '--global',
    '--copy',
    '--json',
  ]);
  assert.equal(report.ok, true);
  assert.equal(report.scope, 'global');
  assert.equal(report.install.status, 'PASS');
  assert.equal(report.verification.status, 'PASS');
  assert.equal(report.instructions.length, 0);
  assert.ok(report.warnings.some((warning) => warning.includes('Global mode installs skills only')));
  assert.deepEqual((await readdir(path.join(root, 'home/.agents/skills'))).sort(), [...releasedSkills].sort());
  assert.equal(await exists(path.join(root, 'AGENTS.md')), false);
});

test('bootstrap preserves existing rule frontmatter and content', async (t) => {
  const root = await consumer(t);
  await mkdir(path.join(root, '.cursor/rules'), { recursive: true });
  await writeFile(
    path.join(root, '.cursor/rules/qie-forge.mdc'),
    '---\ndescription: custom rule\nalwaysApply: false\nglobs: "**/*.ts"\n---\n\n# Custom rule\n\nKeep me.\n',
  );

  const report = runBootstrap(root, [
    '--target', root,
    '--agent', 'cursor',
    '--no-install',
    '--no-verify',
    '--json',
  ]);
  assert.equal(report.ok, true);
  const content = await readFile(path.join(root, '.cursor/rules/qie-forge.mdc'), 'utf8');
  assert.match(content, /description: custom rule/);
  assert.match(content, /alwaysApply: true/);
  assert.match(content, /globs: "\*\*\/\*\.ts"/);
  assert.match(content, /# Custom rule/);
  assert.match(content, /Keep me\./);
  assert.equal((content.match(/qie-forge:bootstrap:start/g) ?? []).length, 1);

  const second = runBootstrap(root, [
    '--target', root,
    '--agent', 'cursor',
    '--no-install',
    '--no-verify',
    '--json',
  ]);
  const secondResult = second.instructions.find((item) => item.path === '.cursor/rules/qie-forge.mdc');
  assert.equal(secondResult.status, 'unchanged');
});

test('bootstrap writes strict JSON when forcing an opencode.json config', async (t) => {
  const root = await consumer(t);
  await writeFile(path.join(root, 'opencode.json'), '{\n  "model": "keep/me"\n}\n');

  const report = runBootstrap(root, [
    '--target', root,
    '--agent', 'opencode',
    '--no-install',
    '--no-verify',
    '--force',
    '--json',
  ]);
  assert.equal(report.ok, true);

  const content = await readFile(path.join(root, 'opencode.json'), 'utf8');
  assert.doesNotMatch(content, /^\s*\/\//m);
  assert.doesNotMatch(content, /\/\*/);
  const config = JSON.parse(content);
  assert.deepEqual(config.skills, ['./.agents/skills']);
  assert.ok(config.permissions.some((rule) => rule.resource === 'qie-*'));

  const result = report.instructions.find((item) => item.path === 'opencode.json');
  assert.equal(result.status, 'overwritten');
  assert.ok(result.backup);
  assert.equal(await exists(path.join(root, result.backup)), true);
});

test('bootstrap rejects --force with --merge-opencode-config', async (t) => {
  const root = await consumer(t);
  const result = runBootstrapResult(root, ['--target', root, '--force', '--merge-opencode-config', '--json']);
  assert.equal(result.status, 2);
  assert.equal(result.report.ok, false);
  assert.match(result.report.error, /--force and --merge-opencode-config cannot be combined/);
});

test('bootstrap reports a malformed managed block without rewriting the file', async (t) => {
  const root = await consumer(t);
  const filename = path.join(root, 'AGENTS.md');
  const original = '# Existing\n\n<!-- qie-forge:bootstrap:start -->\nNo end marker.\n';
  await writeFile(filename, original);

  const { status, report } = runBootstrapResult(root, [
    '--target', root,
    '--agent', 'universal',
    '--no-install',
    '--no-verify',
    '--json',
  ]);
  assert.equal(status, 1);
  assert.equal(report.ok, false);
  assert.equal(await readFile(filename, 'utf8'), original);
  const result = report.instructions.find((item) => item.path === 'AGENTS.md');
  assert.equal(result.status, 'malformed-managed-block');
  assert.ok(report.warnings.some((warning) => warning.includes('managed block markers are incomplete')));
});

test('bootstrap refuses to follow symlinked instruction and config targets', async (t) => {
  const outside = await mkdtemp(path.join(os.tmpdir(), 'qie-forge-bootstrap-outside-'));
  t.after(() => rm(outside, { recursive: true, force: true }));

  const fileRoot = await consumer(t);
  const outsideFile = path.join(outside, 'AGENTS.md');
  await writeFile(outsideFile, '# Outside file\n');
  await symlink(outsideFile, path.join(fileRoot, 'AGENTS.md'));
  const fileResult = runBootstrapResult(fileRoot, [
    '--target', fileRoot,
    '--agent', 'universal',
    '--no-install',
    '--no-verify',
    '--json',
  ]);
  assert.equal(fileResult.status, 1);
  assert.equal(fileResult.report.ok, false);
  assert.equal(fileResult.report.instructions.find((item) => item.path === 'AGENTS.md').status, 'unsafe-path');
  assert.equal(await readFile(outsideFile, 'utf8'), '# Outside file\n');

  const directoryRoot = await consumer(t);
  const outsideRules = path.join(outside, 'rules');
  await mkdir(outsideRules, { recursive: true });
  await symlink(outsideRules, path.join(directoryRoot, '.cursor'));
  const directoryResult = runBootstrapResult(directoryRoot, [
    '--target', directoryRoot,
    '--agent', 'cursor',
    '--no-install',
    '--no-verify',
    '--json',
  ]);
  assert.equal(directoryResult.status, 1);
  assert.equal(directoryResult.report.ok, false);
  assert.equal(
    directoryResult.report.instructions.find((item) => item.path === '.cursor/rules/qie-forge.mdc').status,
    'unsafe-path',
  );
  assert.deepEqual(await readdir(outsideRules), []);

  const configRoot = await consumer(t);
  const outsideConfig = path.join(outside, 'opencode.jsonc');
  await writeFile(outsideConfig, '{ "model": "keep/me" }\n');
  await symlink(outsideConfig, path.join(configRoot, 'opencode.jsonc'));
  const configResult = runBootstrapResult(configRoot, [
    '--target', configRoot,
    '--agent', 'opencode',
    '--no-install',
    '--no-verify',
    '--merge-opencode-config',
    '--json',
  ]);
  assert.equal(configResult.status, 1);
  assert.equal(configResult.report.ok, false);
  assert.equal(configResult.report.instructions.find((item) => item.path === 'opencode.jsonc').status, 'unsafe-path');
  assert.equal(await readFile(outsideConfig, 'utf8'), '{ "model": "keep/me" }\n');
});

test('expandHome honors XDG_CONFIG_HOME and CLAUDE_CONFIG_DIR', () => {
  // null explicitly disables an override; undefined uses the process defaults.
  assert.equal(expandHome('~/.config/goose/skills', '/home/user', '/xdg', null), path.join('/xdg', 'goose/skills'));
  assert.equal(expandHome('~/.claude/skills', '/home/user', '/xdg', null), path.join('/home/user', '.claude/skills'));
  assert.equal(expandHome('~/.claude/skills', '/home/user', '/xdg', '/claude'), path.join('/claude', 'skills'));
  assert.equal(expandHome('~/.config/goose/skills', '/home/user', null, null), path.join('/home/user', '.config/goose/skills'));
});

test('isRemoteSource recognizes remote source forms and rejects local paths', () => {
  for (const remote of [
    'https://example.com/skills.git',
    'http://example.com/skills',
    'git+https://example.com/skills.git',
    'git@github.com:owner/skills.git',
    'ssh://git@example.com/skills.git',
    'git://example.com/skills.git',
  ]) {
    assert.equal(isRemoteSource(remote), true, remote);
  }
  for (const local of ['./skills', '/opt/skills', '../skills', 'skills', '', undefined, null]) {
    assert.equal(isRemoteSource(local), false, String(local));
  }
});

test('validateAgentMatrix rejects a canonical entry that cannot route the CLI', () => {
  const fixture = () => ({
    schema_version: '1.0.0',
    canonical: {
      id: 'universal',
      cli_agent: 'universal',
      project_skills: '.agents/skills',
      global_skills: '~/.agents/skills',
      detect: [],
      instructions: [{ path: 'AGENTS.md', format: 'markdown', body: 'full' }],
    },
    agents: [
      {
        id: 'codex',
        cli_agent: 'codex',
        project_skills: '.agents/skills',
        global_skills: '~/.agents/skills',
        detect: ['.codex'],
        instructions: [{ path: 'AGENTS.md', format: 'markdown', body: 'full' }],
      },
    ],
  });

  assert.equal(validateAgentMatrix(fixture()).canonical.id, 'universal');

  const wrongId = fixture();
  wrongId.canonical.id = 'base';
  assert.throws(() => validateAgentMatrix(wrongId), /canonical entry must use the id "universal"/);

  const wrongCliAgent = fixture();
  wrongCliAgent.canonical.cli_agent = 'claude-code';
  assert.throws(() => validateAgentMatrix(wrongCliAgent), /must map to the CLI agent "universal"/);

  const missingCanonical = fixture();
  delete missingCanonical.canonical;
  assert.throws(() => validateAgentMatrix(missingCanonical), /missing the canonical entry/);
});

test('bootstrap keeps a remote source URL and expands ~ for the target', async (t) => {
  const root = await consumer(t);
  await mkdir(path.join(root, 'home/project'), { recursive: true });

  const remote = runBootstrap(root, [
    '--source', 'https://example.com/qie-forge.git#0123456789abcdef',
    '--target', root,
    '--cli', cli,
    '--agent', 'universal',
    '--dry-run',
    '--no-instructions',
    '--json',
  ]);
  assert.equal(remote.ok, true);
  assert.equal(remote.source, 'https://example.com/qie-forge.git#0123456789abcdef');
  assert.equal(remote.install.status, 'PLANNED');
  assert.equal(remote.install.args[1], remote.source);
  assert.equal(remote.verification.status, 'SKIPPED');

  const homeTarget = runBootstrap(root, [
    '--target', '~/project',
    '--no-install',
    '--no-instructions',
    '--no-verify',
    '--json',
  ]);
  assert.equal(homeTarget.ok, true);
  assert.equal(homeTarget.target, path.join(root, 'home/project'));
});

test('OpenCode config backups preserve the original file mode', async (t) => {
  const root = await consumer(t);
  const filename = path.join(root, 'opencode.jsonc');
  await writeFile(filename, '{ "model": "keep/me" }\n', { mode: 0o600 });
  await chmod(filename, 0o600);

  const report = runBootstrap(root, [
    '--target', root,
    '--agent', 'opencode',
    '--no-install',
    '--no-verify',
    '--merge-opencode-config',
    '--json',
  ]);
  assert.equal(report.ok, true);
  const result = report.instructions.find((item) => item.path === 'opencode.jsonc');
  assert.equal(result.status, 'merged');
  assert.equal((await stat(path.join(root, result.backup))).mode & 0o777, 0o600);
});

test('selectAgents combines auto detection with explicit agents', async (t) => {
  const root = await consumer(t);
  await mkdir(path.join(root, '.claude'), { recursive: true });
  const matrix = await loadAgentMatrix(path.join(projectRoot, 'templates/consumer'));
  const selection = selectAgents({
    matrix,
    requested: ['auto', 'kiro-cli'],
    target: root,
    home: path.join(root, 'home'),
  });
  assert.equal(selection.mode, 'explicit');
  assert.deepEqual(selection.selected.map((agent) => agent.id), ['universal', 'claude-code', 'kiro-cli']);
  assert.deepEqual(selection.cliAgents, ['universal', 'claude-code', 'kiro-cli']);
  assert.deepEqual(selection.detected, ['claude-code']);
});

test('bootstrap global mode installs Goose under XDG_CONFIG_HOME', async (t) => {
  const root = await consumer(t);
  const report = runBootstrap(root, [
    '--source', source,
    '--target', root,
    '--cli', cli,
    '--agent', 'goose',
    '--global',
    '--copy',
    '--json',
  ]);
  assert.equal(report.ok, true);
  assert.equal(report.scope, 'global');
  assert.equal(report.install.status, 'PASS');
  assert.equal(report.verification.status, 'PASS');
  assert.deepEqual((await readdir(path.join(root, 'config/goose/skills'))).sort(), [...releasedSkills].sort());
  const projection = report.verification.projections.find((item) => item.agent === 'goose');
  assert.equal(projection.ok, true);
  assert.equal(projection.root, path.join(root, 'config/goose/skills'));
});

test('upsertManagedBlock does not prepend blank lines to an empty file', () => {
  const block = `${MANAGED_START}\nbody\n${MANAGED_END}\n`;
  const first = upsertManagedBlock('', block);
  assert.equal(first.status, 'appended');
  assert.equal(first.content, block);
  assert.equal(upsertManagedBlock(first.content, block).status, 'unchanged');
});

test('buildInstallArgs uses --copy only for copy mode', () => {
  const base = { source: '/source', cliAgents: ['universal', 'claude-code'], global: false };
  const copyArgs = buildInstallArgs({ ...base, copy: true });
  const linkArgs = buildInstallArgs({ ...base, copy: false });
  assert.ok(copyArgs.includes('--copy'));
  assert.equal(linkArgs.includes('--copy'), false);
  assert.equal(linkArgs.includes('--symlink'), false);
  for (const args of [copyArgs, linkArgs]) {
    assert.equal(args[0], 'add');
    assert.ok(args.includes('--yes'));
    assert.ok(args.includes('--json'));
    assert.ok(args.includes('--agent'));
  }
});

test('selectAgents global mode covers distinct global paths and dedupes shared ones', async (t) => {
  const root = await consumer(t);
  const matrix = await loadAgentMatrix(path.join(projectRoot, 'templates/consumer'));
  const selection = selectAgents({
    matrix,
    requested: ['opencode', 'cursor', 'codex', 'claude-code'],
    target: root,
    home: path.join(root, 'home'),
    global: true,
  });
  assert.deepEqual(selection.selected.map((agent) => agent.id), ['universal', 'opencode', 'cursor', 'codex', 'claude-code']);
  assert.deepEqual(selection.cliAgents, ['universal', 'claude-code']);
});
