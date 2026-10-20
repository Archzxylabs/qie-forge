import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { cp, mkdir, rm, readFile, lstat, readdir } from 'node:fs/promises';
import { runNode, runNodeResult } from './support/process.mjs';
import { buildRelease } from '../scripts/lib/release.mjs';
import { validateBundle } from '../scripts/lib/bundle.mjs';
import { loadValidators } from '../scripts/lib/schemas.mjs';
import { projectRoot, schemaRoot, fixtureProject, temporaryDirectory, releasedSkills } from './support/fixtures.mjs';
import { inspectInstalledRelease } from '../scripts/lib/installed-release.mjs';

const cli = path.join(projectRoot, 'node_modules/skills/bin/cli.mjs');
const validate = await loadValidators(schemaRoot);

const selections = [
  ['*', releasedSkills],
  ...releasedSkills.map(name => [name, [name]]),
];

for (const copy of [false, true]) {
  for (const [selection, expectedSkills] of selections) {
    test(`Skills CLI installs ${selection} in ${copy ? 'copy' : 'symlink'} mode into clean project fixtures`, async (t) => {
      const source = await fixtureProject(t); await buildRelease(source);
      const sourceReleaseId = JSON.parse(await readFile(path.join(source, 'skills/qie/MANIFEST.json'), 'utf8')).release_id;
      const consumer = await temporaryDirectory(t, 'qie-forge-consumer-');
      const guard = path.join(consumer, 'deny-network.cjs');
      await cp(path.join(projectRoot, 'tests/support/deny-network.cjs'), guard);
      // Explicit project targets avoid global installation or changes to the user's home/config.
      await mkdir(path.join(consumer, '.claude'), { recursive: true });
      await mkdir(path.join(consumer, 'home'), { recursive: true });
      const env = { PATH: process.env.PATH, CI: '1', NO_COLOR: '1', DISABLE_TELEMETRY: '1',
        HOME: path.join(consumer, 'home'), XDG_CACHE_HOME: path.join(consumer, 'cache'),
        DO_NOT_TRACK: '1', NODE_DISABLE_COMPILE_CACHE: '1', NODE_OPTIONS: `--require=${guard}` };
      const list = runNode([cli, 'add', source, '--list'], { cwd: consumer, env });
      for (const name of releasedSkills) assert.match(list, new RegExp(name));
      const args = [cli, 'add', source, '--skill', selection, '-a', 'codex', '-a', 'claude-code', '-y'];
      if (copy) args.push('--copy');
      const log = runNode(args, { cwd: consumer, env });
      for (const name of expectedSkills) assert.match(log, new RegExp(name));
      await rm(source, { recursive: true, force: true });
      const canonicalRoot = path.join(consumer, '.agents/skills');
      const claudeRoot = path.join(consumer, '.claude/skills');
      assert.deepEqual((await readdir(canonicalRoot)).sort(), expectedSkills);
      assert.deepEqual((await readdir(claudeRoot)).sort(), expectedSkills);
      const report = await inspectInstalledRelease(canonicalRoot, { expectedSkills });
      assert.deepEqual(report.problems, []);
      assert.equal(report.releaseId, sourceReleaseId);
      assert.equal(report.status, expectedSkills.length === 9 ? 'COHERENT_FULL_SUITE' : 'COHERENT_PARTIAL');
      for (const name of expectedSkills) {
        const canonical = path.join(canonicalRoot, name);
        const claude = path.join(claudeRoot, name);
        assert.equal((await lstat(claude)).isSymbolicLink(), !copy);
        for (const skill of [canonical, claude]) {
          const manifest = await validateBundle(skill, validate);
          assert.equal(manifest.skill_id, name);
          if (name === 'qie-networks') {
            assert.match(await readFile(path.join(skill, 'references/network-mainnet.md'), 'utf8'), /DOCUMENTED/);
            const result = JSON.parse(runNode([path.join(skill, 'scripts/inspect-network.mjs'), 'qie-testnet'], { cwd: consumer, env }));
            assert.equal(result.live_check.outcome, 'NOT_RUN');
            assert.equal(result.claims.find((c) => c.predicate === 'chain_id').value, 1983);
          }
          if (name === 'qie') {
            const data = JSON.parse(await readFile(path.join(skill, 'data/qie-a-z.json'), 'utf8'));
            assert.equal(data.domains.length, 15);
            const routing = await readFile(path.join(skill, 'references/routing.md'), 'utf8');
            assert.match(routing, /skills add <qie-forge-source> --skill <skill-name>/);
          }
          if (name === 'qie-ecosystem') {
            const data = JSON.parse(await readFile(path.join(skill, 'data/ecosystem-catalogue.json'), 'utf8'));
            assert.ok(data.capabilities.length >= 20);
            assert.match(await readFile(path.join(skill, 'references/catalogue.md'), 'utf8'), /QIE Ecosystem Catalogue/);
            assert.match(await readFile(path.join(skill, 'references/compatibility.md'), 'utf8'), /QIE Compatibility Matrix/);
            assert.match(await readFile(path.join(skill, 'references/decision-guide.md'), 'utf8'), /QIE Ecosystem Decision Guide/);
          }
          if (manifest.files.some(f => f.path === 'scripts/verify-network.mjs')) {
            const result = runNodeResult([path.join(skill, 'scripts/verify-network.mjs'), 'qie-testnet'], { cwd: consumer, env });
            assert.equal(result.status, 1);
            const report = JSON.parse(result.stdout);
            assert.equal(report.expected_chain_id, 1983);
            assert.equal(report.live_check.outcome, 'UNKNOWN');
          }
          if (manifest.files.some(f => f.path === 'scripts/verify-transaction.mjs')) {
            const result = runNodeResult([path.join(skill, 'scripts/verify-transaction.mjs'), 'qie-mainnet',
              '0x' + 'a'.repeat(64), 'GENERIC_TX', 'https://fixture.invalid/'], { cwd: consumer, env });
            assert.equal(result.status, 0, 'report production is not application success');
            const report = JSON.parse(result.stdout);
            assert.equal(report.applicationOutcome, 'UNKNOWN');
            assert.equal(report.checks.finality, 'UNKNOWN');
          }
          if (['qie-wallets', 'qie-frontend'].includes(name)) {
            const script = `
              const { createReadSession } = await import(${JSON.stringify(path.join(skill, 'recipes/wallet-read/assets/wallet-read.ts'))});
              const { readFile } = await import('node:fs/promises');
              const snapshot = JSON.parse(await readFile(${JSON.stringify(path.join(skill, 'data/network-claims.json'))}, 'utf8'));
              const calls = [];
              const provider = { on() {}, removeListener() {}, async request({method}) { calls.push(method); return '0x7c6'; } };
              const session = createReadSession(provider, snapshot, 'qie-testnet');
              try { await session.connect(); throw Error('wrong chain accepted'); }
              catch (error) { if (error.code !== 'WRONG_CHAIN') throw error; }
              if (calls.length !== 1) throw Error('requested accounts after mismatch');
              session.dispose();
              console.log('isolated wallet guard PASS; mock only');`;
            assert.match(runNode(['--input-type=module', '-e', script], { cwd: consumer, env }), /isolated wallet guard PASS/);
          }
        }
      }
    });
  }
}
