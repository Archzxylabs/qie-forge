#!/usr/bin/env node
// Install QIE Forge into a consumer project for any supported coding agent.
//
// The canonical installation is .agents/skills. Agents with a different
// project directory receive an additional projection. Instruction files are
// written as managed blocks, so existing AGENTS.md/CLAUDE.md content is kept.
//
// Usage:
//   node scripts/bootstrap-consumer.mjs [--source <path|git-url>]
//     [--target <dir>] [--agent auto|matrix|*|id,id] [--global] [--copy|--symlink]
//     [--dry-run] [--json] [--no-install] [--no-instructions] [--no-verify]
//     [--merge-opencode-config] [--force] [--release-id <sha256>] [--cli <path>]

import { existsSync, statSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildInstallArgs,
  expandHome,
  installSkills,
  isRemoteSource,
  loadAgentMatrix,
  resolveSkillCli,
  selectAgents,
  verifyInstalledRelease,
  verifyProjections,
  writeInstructionSet,
} from './lib/consumer-bootstrap.mjs';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const templateRoot = path.join(projectRoot, 'templates/consumer');
const verifier = path.join(projectRoot, 'scripts/verify-installed-release.mjs');
const packageJson = JSON.parse(await readFile(path.join(projectRoot, 'package.json'), 'utf8'));

const USAGE = `Usage: node scripts/bootstrap-consumer.mjs [options]

Install the QIE Forge skill suite into a consumer project and write
agent-specific bootstrap instructions.

Options:
  --source <path|git-url>   QIE Forge source (default: this checkout)
  --target <dir>            Consumer project (default: current directory)
  --agent <list>            auto (default), matrix, *, all, or agent IDs
                            IDs may be comma-separated or space-separated
  --global                  Install skills in the user-level directories
  --copy                    Copy skills (default)
  --symlink, --link         Request symlinked agent projections
                            (the CLI may copy for a single target)
  --dry-run                 Print the plan without writing
  --json                    Machine-readable report
  --no-install              Skip skill installation
  --no-instructions         Skip AGENTS.md and agent instruction files
  --no-verify               Skip post-install verification
  --verify                  Force verification even with --no-install
  --merge-opencode-config   Merge QIE entries into an existing opencode.json(c)
  --force                   Overwrite an existing OpenCode config (backup first)
                            Cannot be combined with --merge-opencode-config
  --release-id <sha256>     Pin the expected payload identity
  --cli <path>              Path to the pinned Skills CLI
  -h, --help                Show this help
  -v, --version             Show the bootstrap version

Modes:
  auto     Install the canonical .agents/skills suite plus agents detected in
           the target project.
  matrix   Install the canonical suite plus every curated agent projection in
           templates/consumer/agents.json.
  *        Pass --agent '*' to the pinned Skills CLI (all supported agents) and
           write every curated instruction surface.
  id,id    Install the canonical suite plus the named agent projections.

Global mode installs skills only. Run the bootstrap in each project to write
AGENTS.md and agent-specific instruction files.`;

function parseArgs(argv) {
  const options = {
    source: projectRoot,
    target: process.cwd(),
    agents: [],
    global: false,
    copy: true,
    dryRun: false,
    json: false,
    install: true,
    instructions: true,
    verify: true,
    verifyExplicit: false,
    mergeOpencodeConfig: false,
    force: false,
    releaseId: undefined,
    cli: undefined,
    help: false,
    version: false,
  };

  const takeValue = (index, flag) => {
    const value = argv[index + 1];
    if (value === undefined || value.startsWith('--')) throw new UsageError(`${flag} requires a value`);
    return value;
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--source') {
      options.source = takeValue(index, arg);
      index += 1;
    } else if (arg === '--target') {
      options.target = takeValue(index, arg);
      index += 1;
    } else if (arg === '--agent') {
      const values = [];
      let cursor = index + 1;
      while (cursor < argv.length && !argv[cursor].startsWith('-')) {
        values.push(argv[cursor]);
        cursor += 1;
      }
      if (!values.length) throw new UsageError('--agent requires at least one value');
      options.agents.push(...values);
      index = cursor - 1;
    } else if (arg === '--global') options.global = true;
    else if (arg === '--copy') options.copy = true;
    else if (arg === '--symlink' || arg === '--link') options.copy = false;
    else if (arg === '--dry-run') options.dryRun = true;
    else if (arg === '--json') options.json = true;
    else if (arg === '--no-install') options.install = false;
    else if (arg === '--no-instructions') options.instructions = false;
    else if (arg === '--no-verify') options.verify = false;
    else if (arg === '--verify') {
      options.verify = true;
      options.verifyExplicit = true;
    } else if (arg === '--merge-opencode-config') options.mergeOpencodeConfig = true;
    else if (arg === '--force') options.force = true;
    else if (arg === '--release-id') {
      options.releaseId = takeValue(index, arg);
      index += 1;
    } else if (arg === '--cli') {
      options.cli = takeValue(index, arg);
      index += 1;
    } else if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg === '--version' || arg === '-v') options.version = true;
    else throw new UsageError(`Unknown argument: ${arg}`);
  }

  if (options.releaseId !== undefined && !/^[0-9a-f]{64}$/.test(options.releaseId)) {
    throw new UsageError('--release-id must be a lowercase SHA-256');
  }

  if (options.force && options.mergeOpencodeConfig) {
    throw new UsageError('--force and --merge-opencode-config cannot be combined');
  }

  options.source = expandHome(options.source);
  options.source = path.isAbsolute(options.source) || isRemoteSource(options.source)
    ? options.source
    : path.resolve(options.source);
  options.target = path.resolve(expandHome(options.target));
  if (options.cli !== undefined) options.cli = expandHome(options.cli);
  return options;
}

class UsageError extends Error {}

function tail(value, limit = 4000) {
  const text = String(value ?? '').trim();
  return text.length > limit ? text.slice(-limit) : text;
}

function summarizeVerifier(report) {
  if (!report) return null;
  return {
    status: report.status,
    releaseVersion: report.releaseVersion,
    releaseId: report.releaseId,
    inventoryComplete: report.inventoryComplete,
    payloadIntegrity: report.payloadIntegrity,
    releaseCoherence: report.releaseCoherence,
    publisherAuthenticity: report.publisherAuthenticity,
    verificationComplete: report.verificationComplete,
    skills: report.skills?.length ?? 0,
    projections: report.projections?.length ?? 0,
    problems: report.problems ?? [],
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    console.log(USAGE);
    return 0;
  }
  if (options.version) {
    console.log(packageJson.version);
    return 0;
  }

  if (!existsSync(options.target) || !statSync(options.target).isDirectory()) {
    throw new UsageError(`--target is not a directory: ${options.target}`);
  }
  if (!isRemoteSource(options.source)) {
    if (!existsSync(path.join(options.source, 'skills/qie/SKILL.md'))) {
      throw new UsageError(`--source does not contain the generated QIE Forge skills: ${options.source}`);
    }
  }

  const matrix = await loadAgentMatrix(templateRoot);
  const selection = selectAgents({
    matrix,
    requested: options.agents,
    target: options.target,
    home: os.homedir(),
    global: options.global,
  });

  const warnings = [...selection.warnings];
  const nextSteps = [];
  const report = {
    ok: true,
    tool: 'qie-forge-bootstrap',
    version: packageJson.version,
    source: options.source,
    target: options.target,
    scope: options.global ? 'global' : 'project',
    dryRun: options.dryRun,
    mode: selection.mode,
    agents: selection.selected.map((agent) => agent.id),
    detectedAgents: selection.detected,
    cliAgents: selection.cliAgents,
    unsupportedAgents: selection.unsupported,
    install: null,
    instructions: [],
    verification: null,
    warnings,
    notes: selection.notes,
    nextSteps,
  };

  if (options.global && options.instructions) {
    options.instructions = false;
    warnings.push('Global mode installs skills only; project instruction files were skipped.');
  }

  if (options.install && options.dryRun) {
    const cli = await resolveSkillCli({
      source: options.source,
      cli: options.cli,
      projectRoot,
      env: process.env,
    });
    report.install = {
      status: 'PLANNED',
      mode: options.copy ? 'copy' : 'symlink',
      requestedMode: options.copy ? 'copy' : 'symlink',
      cli,
      args: buildInstallArgs({
        source: options.source,
        cliAgents: selection.cliAgents,
        copy: options.copy,
        global: options.global,
      }),
    };
  } else if (options.install) {
    const cli = await resolveSkillCli({
      source: options.source,
      cli: options.cli,
      projectRoot,
      env: process.env,
    });
    const install = await installSkills({
      cli,
      source: options.source,
      cliAgents: selection.cliAgents,
      target: options.target,
      copy: options.copy,
      global: options.global,
    });
    const recordModes = [...new Set((install.records ?? []).map((record) => record.mode).filter(Boolean))];
    const installedMode = recordModes.length === 0
      ? (options.copy ? 'copy' : 'symlink')
      : recordModes.length === 1
        ? recordModes[0]
        : 'mixed';
    report.install = {
      status: install.ok ? 'PASS' : 'FAIL',
      mode: installedMode,
      requestedMode: options.copy ? 'copy' : 'symlink',
      skills: (install.records ?? []).map((record) => ({
        name: record.name,
        status: record.status,
        path: record.path,
        agents: record.agents,
        mode: record.mode,
      })),
      problems: install.problems,
      exitStatus: install.status,
    };
    if (!install.ok) {
      report.ok = false;
      warnings.push('Skill installation failed.');
      report.install.stderr = tail(install.stderr);
      report.install.stdout = tail(install.stdout);
    }
  } else {
    report.install = { status: 'SKIPPED', reason: '--no-install' };
  }

  if (options.instructions) {
    const results = await writeInstructionSet({
      target: options.target,
      agents: selection.selected,
      templateRoot,
      dryRun: options.dryRun,
      mergeOpencodeConfig: options.mergeOpencodeConfig,
      force: options.force,
    });
    report.instructions = results;
    for (const result of results) {
      if (result.warning) warnings.push(`${result.path}: ${result.warning}`);
      if (result.error) {
        report.ok = false;
        warnings.push(`${result.path}: ${result.error}`);
      }
      if (result.status === 'invalid-jsonc' || result.status === 'invalid-shape') report.ok = false;
      if (result.status === 'malformed-managed-block') {
        report.ok = false;
        warnings.push(`${result.path}: managed block markers are incomplete; the file was left unchanged.`);
      }
      if (result.status === 'skipped-existing') {
        nextSteps.push(`Merge the QIE entries into ${result.path} manually or rerun with --merge-opencode-config.`);
      }
    }
  }

  if (options.verify) {
    const home = os.homedir();
    const canonicalRoot = options.global
      ? path.join(home, '.agents/skills')
      : path.join(options.target, '.agents/skills');
    const claudeRoot = options.global
      ? expandHome('~/.claude/skills', home)
      : path.join(options.target, '.claude/skills');
    const claudeSelected = selection.selected.some((agent) => agent.id === 'claude-code');
    const hasCanonicalRoot = existsSync(canonicalRoot);
    const willInstall = options.install && !options.dryRun;

    if (!hasCanonicalRoot && !willInstall && !options.verifyExplicit) {
      report.verification = {
        status: 'SKIPPED',
        reason: options.dryRun ? 'dry run: canonical skill root not found' : 'canonical skill root not found',
      };
    } else if (!hasCanonicalRoot) {
      report.verification = { status: 'FAIL', reason: `canonical skill root not found: ${canonicalRoot}` };
      report.ok = false;
    } else {
      const canonical = await verifyInstalledRelease({
        verifier,
        root: canonicalRoot,
        releaseId: options.releaseId,
        claudeRoot: claudeSelected && existsSync(claudeRoot) ? claudeRoot : undefined,
        cwd: options.target,
      });
      const projections = await verifyProjections({
        agents: selection.selected,
        target: options.target,
        home,
        global: options.global,
      });
      const ok = canonical.ok && projections.problems.length === 0;
      report.verification = {
        status: ok ? 'PASS' : 'FAIL',
        canonicalRoot,
        canonical: summarizeVerifier(canonical.report),
        projections: projections.checked,
        problems: [...canonical.problems, ...projections.problems],
      };
      if (!ok) report.ok = false;
    }

    if (selection.mode === 'all') {
      warnings.push('--agent * installs every agent supported by the pinned Skills CLI; only the curated matrix projections were checked.');
    }
  } else {
    report.verification = { status: 'SKIPPED', reason: '--no-verify' };
  }

  for (const note of selection.notes) {
    nextSteps.push(`${note.agent}: ${note.note}`);
  }
  if (options.dryRun) {
    nextSteps.push('Re-run without --dry-run to apply the planned installation.');
  } else if (options.global) {
    nextSteps.push('Run this bootstrap inside each consumer project to write AGENTS.md and agent-specific rules.');
  } else if (!options.install && report.verification?.status !== 'PASS') {
    nextSteps.push('Run the bootstrap without --no-install to install the skills before asking an agent to load them.');
  } else if (report.ok) {
    nextSteps.push('Open the consumer project in your coding agent and ask it to load the `qie` skill before any QIE task.');
  }

  if (options.dryRun) {
    warnings.push('Dry run: no files were written.');
  }

  if (options.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log('QIE Forge consumer bootstrap');
    console.log(`  source: ${report.source}`);
    console.log(`  target: ${report.target}`);
    console.log(`  scope: ${report.scope}${options.dryRun ? ' (dry run)' : ''}`);
    console.log(`  mode: ${report.mode}`);
    console.log(`  agents: ${report.agents.join(', ')}`);
    if (report.detectedAgents.length) console.log(`  detected: ${report.detectedAgents.join(', ')}`);
    console.log(`  skills: ${report.install.status}${report.install.mode ? ` (${report.install.mode})` : ''}`);
    if (report.instructions.length) {
      console.log('  instructions:');
      for (const result of report.instructions) {
        console.log(`    ${result.status.padEnd(18)} ${result.path}${result.agents ? ` (${result.agents.join(', ')})` : ''}`);
      }
    }
    console.log(`  verification: ${report.verification?.status ?? 'SKIPPED'}`);
    if (report.verification?.canonical) {
      console.log(`    release: ${report.verification.canonical.releaseVersion ?? 'UNKNOWN'} ${report.verification.canonical.releaseId?.slice(0, 12) ?? ''}`);
      console.log(`    skills: ${report.verification.canonical.skills}`);
      console.log(`    payload integrity: ${report.verification.canonical.payloadIntegrity}`);
      console.log(`    publisher authenticity: ${report.verification.canonical.publisherAuthenticity}`);
    }
    if (warnings.length) {
      console.log('  warnings:');
      for (const warning of warnings) console.log(`    - ${warning}`);
    }
    if (nextSteps.length) {
      console.log('  next:');
      for (const step of nextSteps) console.log(`    - ${step}`);
    }
  }

  return report.ok ? 0 : 1;
}

try {
  const code = await main();
  process.exitCode = code;
} catch (error) {
  const json = process.argv.includes('--json');
  if (error instanceof UsageError) {
    if (json) console.log(JSON.stringify({ ok: false, error: error.message }, null, 2));
    else console.error(error.message);
    process.exitCode = 2;
  } else {
    if (json) console.log(JSON.stringify({ ok: false, error: error.message }, null, 2));
    else console.error(error.stack ?? error.message);
    process.exitCode = 1;
  }
}
