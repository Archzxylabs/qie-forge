import path from 'node:path';
import { loadKnowledge, validateKnowledge } from './lib/knowledge.mjs';
import { checkReleaseChronology } from './lib/chronology.mjs';

try {
  const root = process.cwd();
  const data = await loadKnowledge(root);
  checkReleaseChronology(data, { now: new Date() });
  await validateKnowledge(data, path.join(root, 'knowledge/schema'));
  console.log(`Knowledge valid: ${data.domains.length} domains, ${data.sources.length} sources, ${data.claims.length} claims, ${data.capabilities.length} capabilities.`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
