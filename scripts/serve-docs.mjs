import { fileURLToPath } from 'node:url';
import { access } from 'node:fs/promises';
import { documentationServer } from './lib/documentation-server.mjs';

const args = process.argv.slice(2);
const port = args.length === 0 ? 5174 : args.length === 2 && args[0] === '--port' ? Number(args[1]) : NaN;
if (!Number.isInteger(port) || port < 1024 || port > 65535) {
  console.error('Usage: node scripts/serve-docs.mjs [--port <1024..65535>]');
  process.exitCode = 2;
} else {
  const root = fileURLToPath(new URL('../dist/docs/', import.meta.url));
  try {
    await access(new URL('../dist/docs/index.html', import.meta.url));
    const server = documentationServer(root);
    server.on('error', (error) => { console.error(error.message); process.exitCode = 1; });
    server.listen(port, '127.0.0.1', () => console.log(`QIE Forge documentation: http://127.0.0.1:${port}/`));
    for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close());
  } catch {
    console.error('Build the portal first: npm run site:build');
    process.exitCode = 1;
  }
}
