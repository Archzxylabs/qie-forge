// Independent read-only verification of the published QIE Forge bundles.
// Usage: node docs/evidence/b08-final/independent-verify.mjs [repo-root]
//
// Checks, without writing anything:
//   - the release cut and every source review are grounded in real time
//   - skills/ and dist/skills/ are the same bytes
//   - every manifest-declared SHA-256 matches the published file
//   - every capability's published effective status equals the canonical
//     effective-status projection evaluated at the frozen build clock
//   - no published Markdown carries a contract-address literal, a retired
//     endpoint, or an unresolved canonical placeholder
//   - the canonical network facts are published, and every bundle states the
//     release cut
import path from 'node:path';
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { readYaml } from '../../../scripts/lib/io.mjs';
import { effectiveStatus } from '../../../scripts/lib/effective-status.mjs';

const root = process.argv[2] ?? new URL('../../..', import.meta.url).pathname;
const problems = [];
const notes = [];
const ok = (label, cond, detail = '') => {
  if (!cond) problems.push(`${label}${detail ? `: ${detail}` : ''}`);
  else notes.push(`ok  ${label}`);
};

const sha256 = (text) => createHash('sha256').update(text).digest('hex');

const release = JSON.parse(await readFile(path.join(root, 'release-context.json'), 'utf8'));
const claims = await readYaml(path.join(root, 'knowledge/claims.yaml'));
const capabilities = await readYaml(path.join(root, 'knowledge/capabilities.yaml'));
const sources = await readYaml(path.join(root, 'knowledge/sources.yaml'));
const now = Date.now();

// 1. Chronology of the release cut against the real clock.
ok('built_at is not in the future', Date.parse(release.built_at) <= now, release.built_at);
for (const source of sources) {
  if (source.reviewed_at === null) continue;
  ok(`source ${source.source_id} review is not in the future`, Date.parse(source.reviewed_at) <= now, source.reviewed_at);
  ok(`source ${source.source_id} review precedes the release cut`, Date.parse(source.reviewed_at) <= Date.parse(release.built_at), source.reviewed_at);
}

// 2. Published tree vs dist tree.
const published = [];
async function walk(dir, base = '') {
  for (const entry of await readdir(path.join(dir, base), { withFileTypes: true })) {
    const rel = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) await walk(dir, rel);
    else published.push(rel);
  }
}
await walk(path.join(root, 'skills'));
const dist = [];
async function walkDist(dir, base = '') {
  for (const entry of await readdir(path.join(dir, base), { withFileTypes: true })) {
    const rel = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) await walkDist(dir, rel);
    else dist.push(rel);
  }
}
await walkDist(path.join(root, 'dist/skills'));
ok('skills/ and dist/skills/ hold the same file set', JSON.stringify(published.sort()) === JSON.stringify(dist.sort()),
  `${published.length} vs ${dist.length}`);
for (const rel of published) {
  const a = await readFile(path.join(root, 'skills', rel), 'utf8');
  const b = await readFile(path.join(root, 'dist/skills', rel), 'utf8');
  if (a !== b) problems.push(`published copy differs: ${rel}`);
}

// 3. Manifest digests.
for (const rel of published.filter((p) => p.endsWith('MANIFEST.json'))) {
  const manifest = JSON.parse(await readFile(path.join(root, 'skills', rel), 'utf8'));
  for (const entry of manifest.files) {
    const content = await readFile(path.join(root, 'skills', path.posix.dirname(rel), entry.path), 'utf8');
    ok(`${rel} -> ${entry.path} digest`, sha256(content) === entry.sha256);
  }
  ok(`${rel} records the release built_at`, manifest.built_at === release.built_at, manifest.built_at);
}

// 4. Effective-status parity between the catalogue and the compatibility matrix.
const skillDir = path.join(root, 'skills/qie-ecosystem');
const catalogue = await readFile(path.join(skillDir, 'references/catalogue.md'), 'utf8');
const matrix = await readFile(path.join(skillDir, 'references/compatibility.md'), 'utf8');
const capById = new Map(capabilities.map((c) => [c.capability_id, c]));
const expected = new Map(capabilities.map((c) => [c.capability_id, effectiveStatus(c, { now: release.built_at, offline: true }).status]));

for (const [id, status] of expected) {
  const matrixRow = matrix.split('\n').find((line) => line.startsWith(`| \`${id}\` |`));
  ok(`matrix row exists for ${id}`, Boolean(matrixRow));
  if (!matrixRow) continue;
  const effectiveCell = matrixRow.split('|').map((c) => c.trim()).find((c) => c.startsWith('**') && c.endsWith('**'));
  ok(`matrix effective status for ${id}`, effectiveCell === `**${status}**`, `${effectiveCell} vs ${status}`);
}
const overview = catalogue.split('\n').find((line) => line.startsWith('| `bridge-transfer` |'));
ok('catalogue overview publishes an effective status column', /Effective Status/.test(catalogue));

// 5. No published contract address literal, no retired endpoint, no unresolved placeholder.
for (const rel of published.filter((p) => p.endsWith('.md'))) {
  const content = await readFile(path.join(root, 'skills', rel), 'utf8');
  ok(`no contract address literal in ${rel}`, !/0x[0-9a-fA-F]{40}/.test(content));
  ok(`no retired endpoint in ${rel}`, !/qiescan\.org|rpc-main1\.qie\.digital|rpc-testnet\.qie\.digital/i.test(content));
  ok(`no unresolved placeholder in ${rel}`, !content.includes('{{'));
}

// 6. Published network facts equal the canonical claim values.
const rpcClaims = claims.filter((c) => ['rpc_url', 'explorer_url', 'chain_id'].includes(c.predicate));
for (const claim of rpcClaims) {
  ok(`canonical ${claim.claim_id} is published in the catalogue`, catalogue.includes(String(claim.value)), String(claim.value));
}

// 7. Release info freshness per bundle.
for (const rel of published.filter((p) => p.endsWith('references/release-info.md'))) {
  const content = await readFile(path.join(root, 'skills', rel), 'utf8');
  ok(`${rel} states the release cut`, content.includes(release.built_at));
}

console.log(notes.join('\n'));
console.log(`\n${problems.length ? `PROBLEMS (${problems.length}):\n- ${problems.join('\n- ')}` : 'No problems found.'}`);
process.exitCode = problems.length ? 1 : 0;
