// Dependency-free consistency check for the skills/ tree (Node >= 20).
// Checks: every skills/<dir>/SKILL.md exists with frontmatter `name` equal to the
// directory and a non-empty `description` (<= 1024 chars); every relative
// markdown link inside skills/ and README.md resolves; the router mentions every
// skill; no local filesystem paths leak into published files.
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..', '..');
const skillsDir = path.join(root, 'skills');
const problems = [];
const NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function frontmatter(text, file) {
  const match = /^---\n([\s\S]*?)\n---\n/.exec(text);
  if (!match) {
    problems.push(`${file}: missing YAML frontmatter`);
    return {};
  }
  const fields = {};
  for (const line of match[1].split('\n')) {
    const kv = /^([a-z_-]+):\s*(.*)$/.exec(line);
    if (kv) fields[kv[1]] = kv[2].replace(/^["']|["']$/g, '').trim();
  }
  return fields;
}

async function exists(file) {
  try {
    await stat(file);
    return true;
  } catch {
    return false;
  }
}

async function markdownFiles(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await markdownFiles(full));
    else if (entry.name.endsWith('.md')) out.push(full);
  }
  return out;
}

async function checkLinks(file) {
  const text = await readFile(file, 'utf8');
  const withoutCode = text.replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, '');
  for (const [, target] of withoutCode.matchAll(/\]\(([^)\s]+)\)/g)) {
    if (/^(https?:|mailto:|#)/.test(target)) continue;
    const resolved = path.resolve(path.dirname(file), target.split('#')[0]);
    if (!resolved.startsWith(root + path.sep)) problems.push(`${path.relative(root, file)}: link escapes repo: ${target}`);
    else if (!await exists(resolved)) problems.push(`${path.relative(root, file)}: broken link: ${target}`);
  }
  if (/\/home\/[a-z]|\/Users\/[A-Za-z]|C:\\Users\\/.test(text)) problems.push(`${path.relative(root, file)}: contains a local filesystem path`);
}

const skills = (await readdir(skillsDir, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();
if (!skills.length) problems.push('skills/: no skills found');

for (const name of skills) {
  const file = path.join(skillsDir, name, 'SKILL.md');
  if (!await exists(file)) {
    problems.push(`skills/${name}: missing SKILL.md`);
    continue;
  }
  const fields = frontmatter(await readFile(file, 'utf8'), `skills/${name}/SKILL.md`);
  if (fields.name !== name) problems.push(`skills/${name}/SKILL.md: frontmatter name "${fields.name}" must equal directory "${name}"`);
  if (!NAME.test(name)) problems.push(`skills/${name}: directory name must be lowercase kebab-case`);
  if (!fields.description) problems.push(`skills/${name}/SKILL.md: missing description`);
  else if (fields.description.length > 1024) problems.push(`skills/${name}/SKILL.md: description longer than 1024 characters`);
}

const router = path.join(skillsDir, 'qie', 'SKILL.md');
if (await exists(router)) {
  const text = await readFile(router, 'utf8');
  for (const name of skills) {
    if (name !== 'qie' && !text.includes(`${name}/`)) problems.push(`skills/qie/SKILL.md: router does not route to ${name}`);
  }
}

for (const file of [...await markdownFiles(skillsDir), path.join(root, 'README.md')]) await checkLinks(file);

if (problems.length) {
  console.error(problems.map((problem) => `✗ ${problem}`).join('\n'));
  process.exitCode = 1;
} else {
  console.log(`✓ ${skills.length} skills: frontmatter, router coverage and links are consistent.`);
}
