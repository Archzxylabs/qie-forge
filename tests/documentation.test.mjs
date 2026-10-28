import test from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { documentationFiles, PORTAL_ROUTES, renderMarkdown } from '../scripts/lib/documentation.mjs';
import { documentationServer } from '../scripts/lib/documentation-server.mjs';
import { sha256, writeTree } from '../scripts/lib/io.mjs';
import { projectRoot } from './support/fixtures.mjs';
import { runNodeResultAsync } from './support/process.mjs';
import { inspectInstalledRelease } from '../scripts/lib/installed-release.mjs';

let files;
test.before(async () => { files = await documentationFiles(projectRoot); });

test('documentation includes every PRD route with usable static navigation', () => {
  for (const [route, title] of PORTAL_ROUTES) {
    const html = files[`${route.slice(1)}index.html`].toString();
    assert.match(html, /<html lang="en">/);
    assert.match(html, /Skip to content/);
    assert.ok(html.includes(`href="${route}" aria-current="page"`), title);
    assert.equal((html.match(/<h1>/g) ?? []).length, 1);
    assert.doesNotMatch(html, /<script(?![^>]*src=)/);
  }
});

test('every copied release file is byte-identical to its bundle and declared digest', async () => {
  assert.deepEqual(files.LICENSE, await readFile(path.join(projectRoot, 'LICENSE')));
  const build = JSON.parse(files['portal-build.json']);
  const index = JSON.parse(files[`${build.raw_prefix.slice(1)}/index.json`]);
  assert.ok(index.files.length > 100);
  for (const file of index.files) {
    const relative = file.path.slice(build.raw_prefix.length + 1);
    const bytes = await readFile(path.join(projectRoot, relative));
    assert.deepEqual(files[file.path.slice(1)], bytes, relative);
    assert.equal(sha256(bytes), file.sha256, relative);
  }
});

test('portal preserves stored/effective statuses, clock, unknowns and source provenance', async () => {
  const snapshot = JSON.parse(await readFile(path.join(projectRoot, 'skills/qie-ecosystem/data/ecosystem-catalogue.json')));
  const html = files['ecosystem/index.html'].toString();
  assert.ok(html.includes(snapshot.status_evaluated_at));
  for (const capability of snapshot.capabilities) {
    assert.ok(html.includes(`Stored <span class="badge" data-state="${capability.status}"`));
    assert.ok(html.includes(`Effective <span class="badge" data-state="${capability.effective_status}"`));
    assert.ok(html.includes(capability.tool_id));
  }
  assert.match(html, /Execution allowed: <strong>false/);
  assert.doesNotMatch(html, /Execution allowed: <strong>true/);
  assert.match(html, /trust|T1|T2/);
});

test('all generated local document links resolve within the static output', () => {
  for (const [filename, bytes] of Object.entries(files)) {
    if (!filename.endsWith('.html')) continue;
    for (const match of bytes.toString().matchAll(/(?:href|src)="([^"#]+)(?:#[^"]*)?"/g)) {
      const href = match[1].replace(/&amp;/g, '&');
      if (!href.startsWith('/')) continue;
      const target = href.endsWith('/') ? `${href.slice(1)}index.html` : href.slice(1);
      assert.ok(Object.hasOwn(files, target), `${filename} -> ${href}`);
    }
  }
});

test('documentation generation is deterministic across independent invocations', async () => {
  const rebuilt = await documentationFiles(projectRoot);
  assert.deepEqual(Object.keys(rebuilt).sort(), Object.keys(files).sort());
  for (const name of Object.keys(files)) assert.deepEqual(rebuilt[name], files[name], name);
});

test('Markdown rendering escapes raw HTML and rejects executable links', () => {
  const html = renderMarkdown('# Example\n\n<script>alert(1)</script>\n\n```html\n<img onerror="x">\n```\n\n[Source](https://docs.qie.digital/)');
  assert.doesNotMatch(html, /<script>|<img /);
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /href="https:\/\/docs.qie.digital\/"/);
  assert.throws(() => renderMarkdown('[unsafe](javascript:alert)'), /Unsupported documentation link/);
  assert.throws(() => renderMarkdown('[unsafe](\/\/example.com/)'), /Unsupported documentation link/);
});

test('tampered bundle bytes block portal generation before publication', async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'qie-docs-tampered-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await cp(path.join(projectRoot, 'skills'), path.join(root, 'skills'), { recursive: true });
  await writeFile(path.join(root, 'skills/qie/SKILL.md'), '# Tampered\n');
  await assert.rejects(documentationFiles(root), /requires coherent skill bundles/);
});

test('static preview serves correct MIME and immutable cache; missing paths and escape attempts fail closed', async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'qie-docs-server-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await writeTree(root, files);
  const outside = await mkdtemp(path.join(os.tmpdir(), 'qie-docs-outside-'));
  t.after(() => rm(outside, { recursive: true, force: true }));
  await writeFile(path.join(outside, 'private.txt'), 'outside sentinel');
  await symlink(path.join(outside, 'private.txt'), path.join(root, 'escape.txt'));
  const server = documentationServer(root);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  const build = JSON.parse(files['portal-build.json']);
  const markdown = await fetch(`${base}${build.raw_prefix}/skills/qie/SKILL.md`);
  assert.equal(markdown.status, 200);
  assert.match(markdown.headers.get('content-type'), /^text\/markdown/);
  assert.match(markdown.headers.get('cache-control'), /immutable/);
  assert.equal(markdown.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(await markdown.text(), files[`${build.raw_prefix.slice(1)}/skills/qie/SKILL.md`].toString());
  const json = await fetch(`${base}${build.raw_prefix}/index.json`);
  assert.match(json.headers.get('content-type'), /^application\/json/);
  for (const target of ['/missing/', '/escape.txt', '/%2e%2e%2fprivate.txt', '/%00']) {
    const response = await fetch(`${base}${target}`);
    assert.equal(response.status, 404, target);
    assert.doesNotMatch(await response.text(), /outside sentinel/);
  }
  assert.equal((await fetch(base, { method: 'POST' })).status, 405);
  assert.equal((await fetch(base, { method: 'HEAD' })).status, 200);
});

test('pinned Skills CLI installs the HTTP release into four profiles with exact payload identity', async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'qie-docs-http-install-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const web = path.join(root, 'web');
  await writeTree(web, files);
  const consumer = path.join(root, 'consumer');
  await mkdir(path.join(consumer, 'home'), { recursive: true });
  const server = documentationServer(web);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const build = JSON.parse(files['portal-build.json']);
  const source = `http://127.0.0.1:${server.address().port}${build.raw_prefix}`;
  const result = await runNodeResultAsync([
    path.join(projectRoot, 'node_modules/skills/bin/cli.mjs'), 'add', source,
    '--skill', '*', '--agent', 'codex', '--agent', 'claude-code', '--agent', 'cursor', '--agent', 'opencode', '--copy', '--yes',
  ], { cwd: consumer, timeout: 60000, env: { ...process.env, HOME: path.join(consumer, 'home'), XDG_CONFIG_HOME: path.join(root, 'config'), CI: '1', DISABLE_TELEMETRY: '1', DO_NOT_TRACK: '1' } });
  assert.equal(result.status, 0, result.stderr + result.stdout);
  const report = await inspectInstalledRelease(path.join(consumer, '.agents/skills'), { requireSuite: true, expectedReleaseId: build.release_id });
  assert.equal(report.verificationComplete, true, report.problems.join('\n'));
  assert.equal(report.publisherAuthenticity, 'PINNED_MATCH');
  assert.equal(report.skills.length, 9);
  assert.equal(report.projections.length, 9);
  for (const skill of report.skills) {
    assert.deepEqual(await readFile(path.join(consumer, '.agents/skills', skill.name, 'LICENSE')), files.LICENSE);
  }
  // The CLI tolerates an unavailable file. A nominally successful download
  // must still fail the independent integrity check when the notice is absent.
  await rm(path.join(web, build.raw_prefix.slice(1), '.well-known/skills/qie/LICENSE'));
  const incomplete = path.join(root, 'incomplete');
  await mkdir(path.join(incomplete, 'home'), { recursive: true });
  const partial = await runNodeResultAsync([
    path.join(projectRoot, 'node_modules/skills/bin/cli.mjs'), 'add', source,
    '--skill', 'qie', '--agent', 'codex', '--copy', '--yes',
  ], { cwd: incomplete, timeout: 60000, env: { ...process.env, HOME: path.join(incomplete, 'home'), XDG_CONFIG_HOME: path.join(root, 'incomplete-config'), CI: '1', DISABLE_TELEMETRY: '1', DO_NOT_TRACK: '1' } });
  assert.equal(partial.status, 0, partial.stderr + partial.stdout);
  const rejected = await inspectInstalledRelease(path.join(incomplete, '.agents/skills'), { expectedSkills: ['qie'], expectedReleaseId: build.release_id, claudeRoot: null });
  assert.equal(rejected.verificationComplete, false);
  assert.equal(rejected.status, 'REJECTED');
  assert.match(rejected.problems.join('\n'), /LICENSE|INVENTORY|MISSING/);
});
