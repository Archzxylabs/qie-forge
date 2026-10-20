// GENERATED — DO NOT EDIT. Change canonical helper sources.
// Original, dependency-free, read-only JSON-RPC client for QIE Forge diagnostics.
// Uses only the injected or global fetch transport. It never signs, never broadcasts,
// never handles keys, and never retries or falls back across networks or endpoints.
// One call sends one request; responses are read under a hard byte ceiling and must
// be a consistent JSON-RPC 2.0 envelope matching the request ID; failures map to the
// stable error classes of PRD §14.5.
export const RPC_LIMITS = Object.freeze({ timeoutMs: 10000, maxResponseBytes: 1048576 });

const HEX_QUANTITY = /^0x[0-9a-fA-F]+$/;
export const TX_HASH_PATTERN = /^0x[0-9a-fA-F]{64}$/;
export const ADDRESS_PATTERN = /^0x[0-9a-fA-F]{40}$/;

export class RpcError extends Error {
  constructor(errorCode, message) {
    super(message);
    this.name = 'RpcError';
    this.errorCode = errorCode;
  }
}

// Returns the parsed integer value of a JSON-RPC hex quantity, or null when the value
// is malformed. Null never means zero.
export function parseHexQuantity(value) {
  if (typeof value !== 'string' || !HEX_QUANTITY.test(value)) return null;
  try {
    return BigInt(value);
  } catch {
    return null;
  }
}

// Reads the response body under the byte ceiling. A streaming body is decoded and
// counted chunk by chunk, so an oversized response is rejected while streaming; a
// plain text body (for example a test double) is checked after reading.
async function readBoundedText(response, maxResponseBytes) {
  const body = response.body;
  if (body && (typeof body.getReader === 'function' || typeof body[Symbol.asyncIterator] === 'function')) {
    const decoder = new TextDecoder();
    let received = 0;
    let text = '';
    try {
      for await (const chunk of body) {
        received += chunk.byteLength;
        if (received > maxResponseBytes) {
          throw new RpcError('RPC_MALFORMED', 'The RPC response exceeded the response size limit.');
        }
        text += decoder.decode(chunk, { stream: true });
      }
      return text + decoder.decode();
    } catch (error) {
      if (error instanceof RpcError) throw error;
      throw new RpcError('RPC_UNAVAILABLE', `The RPC response body could not be read: ${error.message}`);
    }
  }
  let text;
  try {
    text = await response.text();
  } catch {
    throw new RpcError('RPC_UNAVAILABLE', 'The RPC response body could not be read.');
  }
  if (text.length > maxResponseBytes) {
    throw new RpcError('RPC_MALFORMED', 'The RPC response exceeded the response size limit.');
  }
  return text;
}

export async function rpcCall({
  url,
  method,
  params = [],
  transport = globalThis.fetch,
  timeoutMs = RPC_LIMITS.timeoutMs,
  maxResponseBytes = RPC_LIMITS.maxResponseBytes,
  requestId = 1,
}) {
  if (typeof url !== 'string' || !/^https:\/\//.test(url)) {
    throw new RpcError('RPC_UNAVAILABLE', 'The RPC endpoint must be an https URL.');
  }
  if (typeof transport !== 'function') {
    throw new RpcError('RPC_UNAVAILABLE', 'No HTTP transport is available in this runtime.');
  }
  let response;
  try {
    response = await transport(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: requestId, method, params }),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    throw new RpcError('RPC_UNAVAILABLE', `RPC request failed or timed out within ${timeoutMs} ms: ${error.message}`);
  }
  if (response.status === 429) {
    throw new RpcError('RPC_RATE_LIMITED', 'The RPC endpoint rate-limited the request (HTTP 429).');
  }
  if (!response.ok) {
    throw new RpcError('RPC_UNAVAILABLE', `The RPC endpoint returned HTTP ${response.status}.`);
  }
  const text = await readBoundedText(response, maxResponseBytes);
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    throw new RpcError('RPC_MALFORMED', 'The RPC response is not valid JSON.');
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new RpcError('RPC_MALFORMED', 'The RPC response is not a JSON-RPC object.');
  }
  if (body.jsonrpc !== '2.0') {
    throw new RpcError('RPC_MALFORMED', 'The RPC response does not declare the JSON-RPC 2.0 protocol.');
  }
  if (body.id !== requestId) {
    throw new RpcError('RPC_MALFORMED', 'The RPC response ID does not match the request.');
  }
  const hasResult = Object.hasOwn(body, 'result');
  const hasError = body.error !== undefined && body.error !== null;
  if (hasResult && hasError) {
    throw new RpcError('RPC_MALFORMED', 'The RPC response carries both a result and an error.');
  }
  if (!hasResult && !hasError) {
    throw new RpcError('RPC_MALFORMED', 'The RPC response carries neither a result nor an error.');
  }
  if (hasError) {
    const code = body.error.code ?? 'unknown';
    const message = `RPC error ${code}: ${body.error.message ?? 'no message'}`;
    // A JSON-RPC "method not found" reply is an unsupported provider surface, not a
    // transport outage; every other server-side error maps to RPC_UNAVAILABLE.
    throw new RpcError(code === -32601 ? 'UNSUPPORTED_PROVIDER' : 'RPC_UNAVAILABLE', message);
  }
  return body.result;
}
