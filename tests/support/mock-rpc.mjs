// Test doubles for read-only RPC diagnostics. No production code imports this module.
// Every envelope responder produces a proper JSON-RPC 2.0 reply unless a test is
// deliberately probing malformed transport behavior.

// Proper JSON-RPC 2.0 response envelope as a plain response object.
export function jsonResponse(result, { id = 1 } = {}) {
  return { ok: true, status: 200, text: async () => JSON.stringify({ jsonrpc: '2.0', id, result }) };
}

// A JSON-RPC server-side error response.
export function errorResponse(code, message, { id = 1 } = {}) {
  return { ok: true, status: 200, text: async () => JSON.stringify({ jsonrpc: '2.0', id, error: { code, message } }) };
}

// A body that is not valid JSON-RPC (or not JSON at all) with a chosen HTTP status.
export function rawResponse(status, text) {
  return { ok: status >= 200 && status < 300, status, text: async () => text };
}

// A streaming response delivering the given chunks as UTF-8 bytes.
export function streamResponse(chunks, { status = 200 } = {}) {
  const encoder = new TextEncoder();
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => chunks.join(''),
    body: (async function* generate() {
      for (const chunk of chunks) yield encoder.encode(chunk);
    })(),
  };
}

// Transport that fails every call: timeout, DNS failure or test guard simulation.
export function failingTransport(error) {
  return async () => { throw error; };
}

// Transport dispatching by JSON-RPC method, recording every call with its URL.
export function dispatchTransport(routes) {
  const calls = [];
  const transport = async (url, init) => {
    const { method, params } = JSON.parse(init.body);
    calls.push({ url, method, params });
    const handler = routes[method];
    if (!handler) return jsonResponse(null);
    return typeof handler === 'function' ? handler(params, url) : handler;
  };
  transport.calls = calls;
  return transport;
}
