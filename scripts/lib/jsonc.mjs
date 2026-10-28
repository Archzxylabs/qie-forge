// Minimal JSONC support for consumer configuration files.
//
// The bootstrap script only needs to merge a few top-level keys into an
// existing OpenCode config. It does not preserve comments: the caller creates
// a timestamped backup before rewriting. This parser rejects anything that is
// not JSON after comments and trailing commas are removed.

export function stripJsonComments(text) {
  let result = '';
  let inString = false;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const next = text[index + 1];

    if (lineComment) {
      if (character === '\n') {
        lineComment = false;
        result += character;
      }
      continue;
    }

    if (blockComment) {
      if (character === '*' && next === '/') {
        blockComment = false;
        index += 1;
        result += ' ';
      }
      continue;
    }

    if (inString) {
      result += character;
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === '"') inString = false;
      continue;
    }

    if (character === '"') {
      inString = true;
      result += character;
      continue;
    }

    if (character === '/' && next === '/') {
      lineComment = true;
      index += 1;
      continue;
    }

    if (character === '/' && next === '*') {
      blockComment = true;
      index += 1;
      result += ' ';
      continue;
    }

    result += character;
  }

  if (blockComment) throw new SyntaxError('Unterminated block comment');
  return result;
}

export function stripTrailingCommas(text) {
  let result = '';
  let inString = false;
  let escaped = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];

    if (inString) {
      result += character;
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === '"') inString = false;
      continue;
    }

    if (character === '"') {
      inString = true;
      result += character;
      continue;
    }

    if (character === ',') {
      let lookahead = index + 1;
      while (lookahead < text.length && /\s/.test(text[lookahead])) lookahead += 1;
      if (text[lookahead] === '}' || text[lookahead] === ']') continue;
    }

    result += character;
  }

  return result;
}

export function parseJsonc(text) {
  const withoutBom = text.replace(/^\uFEFF/, '');
  return JSON.parse(stripTrailingCommas(stripJsonComments(withoutBom)));
}
