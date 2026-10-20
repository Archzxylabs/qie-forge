// Read-only installed-release verification. This is not an installer or an
// updater: it reads the skill directories the pinned Skills CLI created and
// reports whether their files, manifests and suite identity are coherent.
//
// Usage:
//   node scripts/verify-installed-release.mjs [--root .agents/skills]
//     [--release-id <sha256>] [--expect-suite] [--json]
//
// Exit 0: coherent (full suite verified when --expect-suite or nine bundles
//         are present, otherwise a verified partial installation).
// Exit 1: digest, metadata or release-identity problem, including a mixed or
//         legacy installation.
// Exit 2: usage error.

import path from 'node:path';
import { inspectInstalledRelease } from './lib/installed-release.mjs';

const args = process.argv.slice(2);
const options = { root: path.join('.agents', 'skills'), json: false, expectSuite: false, releaseId: undefined, expectedSkills: undefined };
for (let index = 0; index < args.length; index += 1) {
  const arg = args[index];
  if (arg === '--root') options.root = args[++index];
  else if (arg === '--release-id') options.releaseId = args[++index];
  else if (arg === '--expect-suite') options.expectSuite = true;
  else if (arg === '--json') options.json = true;
  else if (arg === '--help' || arg === '-h') {
    console.log('Usage: node scripts/verify-installed-release.mjs [--root <dir>] [--release-id <sha256>] [--expect-suite] [--json]');
    process.exit(0);
  } else {
    console.error(`Unknown argument: ${arg}`);
    console.error('Usage: node scripts/verify-installed-release.mjs [--root <dir>] [--release-id <sha256>] [--expect-suite] [--json]');
    process.exit(2);
  }
}
if (!options.root || options.releaseId === '') {
  console.error('A root directory and non-empty release id are required');
  process.exit(2);
}

const report = await inspectInstalledRelease(options.root, {
  expectedReleaseId: options.releaseId,
  requireSuite: options.expectSuite,
});

if (options.json) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(`Installed release: ${report.releaseVersion ?? 'UNKNOWN'} (schema ${report.schemaVersion ?? 'UNKNOWN'})`);
  console.log(`Built at: ${report.builtAt ?? 'UNKNOWN'}`);
  console.log(`Release identity: ${report.releaseId ?? 'UNKNOWN'}${report.suiteComplete ? ' (full suite recomputed)' : ' (manifest value; suite identity not recomputed)'}`);
  console.log(`Installed skills: ${report.skills.length}`);
  for (const skill of report.skills) {
    console.log(`  ${skill.valid ? 'OK' : 'FAIL'} ${skill.name} ${skill.release_version ?? 'UNKNOWN'} ${String(skill.release_id ?? 'NO_RELEASE_ID').slice(0, 12)}`);
  }
  console.log(`Status: ${report.status}`);
  for (const problem of report.problems) console.log(`  - ${problem}`);
}

process.exit(report.problems.length ? 1 : 0);
