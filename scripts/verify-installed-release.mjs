// Read-only installed-release verification. This is not an installer or an
// updater: it reads the skill directories the pinned Skills CLI created and
// reports whether their files, manifests, suite identity, frontmatter and
// Claude Code projection are coherent.
//
// Usage:
//   node scripts/verify-installed-release.mjs [--root .agents/skills]
//     [--claude-root .claude/skills] [--release-id <sha256>] [--expect-suite]
//     [--no-claude] [--json]
//
// Exit 0: coherent. --expect-suite requires the exact nine canonical skill
//         names; a release identity is only authenticated when --release-id is
//         supplied from a trusted pinned source.
// Exit 1: digest, metadata, inventory, projection or release-identity problem,
//         including a mixed or legacy installation.
// Exit 2: usage error.

import path from 'node:path';
import { inspectInstalledRelease } from './lib/installed-release.mjs';

const args = process.argv.slice(2);
const options = {
  root: path.join('.agents', 'skills'),
  json: false,
  expectSuite: false,
  releaseId: undefined,
  claudeRoot: undefined,
};

for (let index = 0; index < args.length; index += 1) {
  const arg = args[index];
  if (arg === '--root') {
    options.root = args[++index];
    if (!options.root) {
      console.error('--root requires a directory');
      process.exit(2);
    }
  } else if (arg === '--claude-root') {
    options.claudeRoot = args[++index];
    if (!options.claudeRoot) {
      console.error('--claude-root requires a directory');
      process.exit(2);
    }
  } else if (arg === '--no-claude') options.claudeRoot = null;
  else if (arg === '--release-id') {
    options.releaseId = args[++index];
    if (!options.releaseId) {
      console.error('--release-id requires a lowercase SHA-256');
      process.exit(2);
    }
  } else if (arg === '--expect-suite') options.expectSuite = true;
  else if (arg === '--json') options.json = true;
  else if (arg === '--help' || arg === '-h') {
    console.log('Usage: node scripts/verify-installed-release.mjs [--root <dir>] [--claude-root <dir>] [--no-claude] [--release-id <sha256>] [--expect-suite] [--json]');
    process.exit(0);
  } else {
    console.error(`Unknown argument: ${arg}`);
    console.error('Usage: node scripts/verify-installed-release.mjs [--root <dir>] [--claude-root <dir>] [--no-claude] [--release-id <sha256>] [--expect-suite] [--json]');
    process.exit(2);
  }
}

if (options.releaseId !== undefined && !/^[0-9a-f]{64}$/.test(options.releaseId)) {
  console.error('--release-id must be a lowercase SHA-256');
  process.exit(2);
}

const report = await inspectInstalledRelease(options.root, {
  expectedReleaseId: options.releaseId,
  requireSuite: options.expectSuite,
  claudeRoot: options.claudeRoot,
});

if (options.json) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(`Installed release: ${report.releaseVersion ?? 'UNKNOWN'} (schema ${report.schemaVersion ?? 'UNKNOWN'})`);
  console.log(`Built at: ${report.builtAt ?? 'UNKNOWN'}`);
  console.log(`Release identity: ${report.releaseId ?? 'UNKNOWN'} (${report.identitySource})`);
  console.log(`Inventory complete: ${report.inventoryComplete}`);
  console.log(`Payload integrity: ${report.payloadIntegrity}`);
  console.log(`Release coherence: ${report.releaseCoherence}`);
  console.log(`Provenance: ${report.provenance?.validation ?? 'UNAVAILABLE'} (manifest metadata authenticated: ${report.provenance?.manifestMetadataAuthenticated === true})`);
  console.log(`Publisher authenticity: ${report.publisherAuthenticity} (${report.authenticityScope})`);
  console.log(`Verification complete: ${report.verificationComplete} (suiteComplete: ${report.suiteComplete})`);
  console.log(`Installed skills: ${report.skills.length}`);
  for (const skill of report.skills) {
    console.log(`  ${skill.valid ? 'OK' : 'FAIL'} ${skill.name} ${skill.release_version ?? 'UNKNOWN'} ${String(skill.release_id ?? 'NO_RELEASE_ID').slice(0, 12)}`);
  }
  if (report.projections.length) {
    const valid = report.projections.filter((projection) => projection.valid).length;
    console.log(`Claude Code projections: ${valid}/${report.projections.length} valid`);
  }
  console.log(`Status: ${report.status}`);
  for (const problem of report.problems) console.log(`  - ${problem}`);
}

process.exit(report.problems.length ? 1 : 0);
