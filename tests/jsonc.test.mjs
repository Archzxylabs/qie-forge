import test from 'node:test';
import assert from 'node:assert/strict';
import { parseJsonc, stripJsonComments, stripTrailingCommas } from '../scripts/lib/jsonc.mjs';

test('stripJsonComments preserves comment markers inside strings', () => {
  const text = '{\n  "url": "https://example.com/a//b",\n  "quote": "a \\" // not a comment",\n  // real comment\n  "value": 1\n}\n';
  const stripped = stripJsonComments(text);
  assert.doesNotMatch(stripped, /real comment/);
  assert.match(stripped, /https:\/\/example\.com\/a\/\/b/);
  assert.match(stripped, /not a comment/);
  assert.deepEqual(JSON.parse(stripped), {
    url: 'https://example.com/a//b',
    quote: 'a " // not a comment',
    value: 1,
  });
});

test('stripJsonComments handles block comments and escapes', () => {
  const text = '{\n  /* block */\n  "path": "C:\\\\temp\\\\qie",\n  "flag": true\n}\n';
  assert.deepEqual(parseJsonc(text), { path: 'C:\\temp\\qie', flag: true });
});

test('stripJsonComments separates block comments and rejects unterminated blocks', () => {
  assert.throws(() => parseJsonc('{"a":1} /* unterminated'), SyntaxError);
  assert.throws(() => parseJsonc('{"a":1/*x*/2}'), SyntaxError);
  assert.deepEqual(parseJsonc('{"a":1/*x*/}'), { a: 1 });
});

test('stripTrailingCommas removes object and array trailing commas only', () => {
  const text = '{"a": [1, 2,], "b": {"c": 3,}, "text": "keep,",}';
  assert.deepEqual(JSON.parse(stripTrailingCommas(text)), {
    a: [1, 2],
    b: { c: 3 },
    text: 'keep,',
  });
});

test('parseJsonc accepts a BOM, comments and trailing commas together', () => {
  const text = '\uFEFF{\n  // schema\n  "$schema": "https://opencode.ai/config.json",\n  "skills": ["./.agents/skills",],\n  /* permissions */\n  "permissions": [{"action": "skill", "resource": "qie", "effect": "allow"},],\n}\n';
  assert.deepEqual(parseJsonc(text), {
    $schema: 'https://opencode.ai/config.json',
    skills: ['./.agents/skills'],
    permissions: [{ action: 'skill', resource: 'qie', effect: 'allow' }],
  });
});

test('parseJsonc rejects malformed JSON after cleanup', () => {
  assert.throws(() => parseJsonc('{ "a": 1, } trailing'), SyntaxError);
  assert.throws(() => parseJsonc('{ "a": }'), SyntaxError);
});
