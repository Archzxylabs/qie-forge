// Local static preview only; no account, RPC, write endpoint or SPA fallback.
import { createServer } from 'node:http';
import { readFile, realpath, stat } from 'node:fs/promises';
import path from 'node:path';

export const DOCUMENTATION_CSP = "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; connect-src 'none'";
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.md': 'text/markdown; charset=utf-8', '.svg': 'image/svg+xml' };

export function documentationServer(root) {
  return createServer(async (request, response) => {
    const headers = { 'Content-Security-Policy': DOCUMENTATION_CSP, 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'Cache-Control': 'no-cache' };
    try {
      if (!['GET', 'HEAD'].includes(request.method)) {
        response.writeHead(405, { ...headers, Allow: 'GET, HEAD' }); response.end(); return;
      }
      const base = await realpath(root);
      const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      if (pathname.includes('\\') || pathname.includes('\0')) throw new Error('Invalid path');
      let filename = path.resolve(base, `.${pathname}`);
      if (filename !== base && !filename.startsWith(`${base}${path.sep}`)) throw new Error('Outside root');
      if ((await stat(filename)).isDirectory()) filename = path.join(filename, 'index.html');
      filename = await realpath(filename);
      if (!filename.startsWith(`${base}${path.sep}`)) throw new Error('Outside root');
      const bytes = await readFile(filename);
      const immutable = /^\/releases\/[^/]+\/[a-f0-9]{64}\//.test(pathname);
      response.writeHead(200, { ...headers, 'Content-Type': mime[path.extname(filename)] ?? 'text/plain; charset=utf-8', 'Content-Length': bytes.length, ...(immutable ? { 'Cache-Control': 'public, max-age=31536000, immutable' } : {}) });
      response.end(request.method === 'HEAD' ? undefined : bytes);
    } catch {
      let bytes;
      try { bytes = await readFile(path.join(root, '404.html')); } catch { bytes = Buffer.from('Not found'); }
      response.writeHead(404, { ...headers, 'Content-Type': 'text/html; charset=utf-8' });
      response.end(request.method === 'HEAD' ? undefined : bytes);
    }
  });
}
