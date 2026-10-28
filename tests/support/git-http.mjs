import http from 'node:http';
import { spawn } from 'node:child_process';

// Minimal smart-HTTP bridge around `git http-backend`. The Skills CLI refuses
// dumb HTTP because it always requests a shallow clone, so the local fixture
// must expose the real upload-pack protocol. This server is test-only and
// binds to loopback.
export async function serveGitRepository(t, projectRoot) {
  const server = http.createServer(async (request, response) => {
    const url = new URL(request.url, `http://${request.headers.host}`);
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    const body = Buffer.concat(chunks);
    const env = {
      ...process.env,
      GIT_PROJECT_ROOT: projectRoot,
      GIT_HTTP_EXPORT_ALL: '1',
      PATH_INFO: decodeURIComponent(url.pathname),
      QUERY_STRING: url.search.slice(1),
      REQUEST_METHOD: request.method,
      CONTENT_TYPE: request.headers['content-type'] ?? '',
      CONTENT_LENGTH: String(body.length),
      REMOTE_USER: 'fixture',
      REMOTE_ADDR: '127.0.0.1',
      GIT_PROTOCOL: request.headers['git-protocol'] ?? '',
      GATEWAY_INTERFACE: 'CGI/1.1',
      SERVER_PROTOCOL: 'HTTP/1.1',
    };
    const child = spawn('git', ['http-backend'], { env, stdio: ['pipe', 'pipe', 'pipe'] });
    const output = [];
    let stderr = '';
    child.stdout.on('data', (chunk) => output.push(chunk));
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.stdin.end(body);
    await new Promise((resolve) => child.on('close', resolve));
    const raw = Buffer.concat(output);
    let split = raw.indexOf('\r\n\r\n');
    let separator = 4;
    if (split < 0) {
      split = raw.indexOf('\n\n');
      separator = 2;
    }
    if (split < 0) {
      response.writeHead(500, { 'content-type': 'text/plain' });
      response.end(`git http-backend produced no headers\n${stderr}`);
      return;
    }
    const headers = raw.subarray(0, split).toString().split(/\r?\n/);
    const payload = raw.subarray(split + separator);
    let status = 200;
    const mapped = [];
    for (const line of headers) {
      const index = line.indexOf(':');
      if (index < 0) continue;
      const key = line.slice(0, index);
      const value = line.slice(index + 1).trim();
      if (key.toLowerCase() === 'status') status = Number(value.split(' ')[0]);
      else mapped.push([key, value]);
    }
    response.writeHead(status, Object.fromEntries(mapped));
    response.end(payload);
  });

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const url = `http://127.0.0.1:${server.address().port}`;
  let closed = false;
  const close = async () => {
    if (closed) return;
    closed = true;
    server.closeAllConnections?.();
    await new Promise((resolve) => server.close(resolve));
  };
  t.after(close);
  return { url, close };
}
