// B06: read-only JSON-RPC transport tests (PRD FR-003, FR-007, §14.5). All requests run
// against injected mock transports; no network is contacted in these tests.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseHexQuantity, rpcCall, RPC_LIMITS, RpcError } from '../scripts/lib/rpc.mjs';
import { dispatchTransport, errorResponse, failingTransport, jsonResponse, rawResponse, streamResponse } from './support/mock-rpc.mjs';
import { projectRoot, schemaRoot } from './support/fixtures.mjs';
import { loadValidators } from '../scripts/lib/schemas.mjs';

const URL_MAINNET = 'https://rpc1mainnet.qie.digital/';

test('rpcCall sends one JSON-RPC 2.0 request and returns the matching result', async () => {
  const transport = dispatchTransport({ eth_chainId: jsonResponse('0x7c6') });
  const result = await rpcCall({ url: URL_MAINNET, method: 'eth_chainId', transport });
  assert.equal(result, '0x7c6');
  assert.equal(transport.calls.length, 1);
  assert.equal(transport.calls[0].url, URL_MAINNET);
  assert.equal(transport.calls[0].method, 'eth_chainId');
});

test('rpcCall validates the envelope: version, request ID echo, and result/error consistency', async () => {
  const cases = [
    ['missing protocol version', rawResponse(200, JSON.stringify({ id: 1, result: '0x1' }))],
    ['wrong protocol version', rawResponse(200, JSON.stringify({ jsonrpc: '1.0', id: 1, result: '0x1' }))],
    ['wrong response ID', rawResponse(200, JSON.stringify({ jsonrpc: '2.0', id: 999, result: '0x1' }))],
    ['both result and error', rawResponse(200, JSON.stringify({ jsonrpc: '2.0', id: 1, result: '0x1', error: { code: -1, message: 'x' } }))],
    ['neither result nor error', rawResponse(200, JSON.stringify({ jsonrpc: '2.0', id: 1 }))],
    ['no jsonrpc envelope', rawResponse(200, '"0x7c6"')],
    ['invalid JSON', rawResponse(200, '{not-json')],
    ['empty body', rawResponse(200, '')],
  ];
  for (const [name, response] of cases) {
    await assert.rejects(
      rpcCall({ url: URL_MAINNET, method: 'eth_chainId', transport: async () => response }),
      (error) => error instanceof RpcError && error.errorCode === 'RPC_MALFORMED',
      name,
    );
  }
});

test('rpcCall maps HTTP and JSON-RPC failures to stable error classes', async () => {
  const cases = [
    ['HTTP 429', rawResponse(429, 'slow down'), 'RPC_RATE_LIMITED'],
    ['HTTP 500', rawResponse(500, 'oops'), 'RPC_UNAVAILABLE'],
    ['HTTP 404', rawResponse(404, 'nope'), 'RPC_UNAVAILABLE'],
    ['JSON-RPC -32601', errorResponse(-32601, 'method not found'), 'UNSUPPORTED_PROVIDER'],
    ['JSON-RPC -32000', errorResponse(-32000, 'server error'), 'RPC_UNAVAILABLE'],
  ];
  for (const [name, response, expected] of cases) {
    await assert.rejects(
      rpcCall({ url: URL_MAINNET, method: 'eth_chainId', transport: async () => response }),
      (error) => error instanceof RpcError && error.errorCode === expected,
      `${name} maps to ${expected}`,
    );
  }
});

test('rpcCall rejects failed transports like timeouts and network guards without retry', async () => {
  const transport = failingTransport(new Error('NETWORK_DISABLED_BY_TEST'));
  let calls = 0;
  const counting = async (...args) => { calls += 1; return transport(...args); };
  await assert.rejects(
    rpcCall({ url: URL_MAINNET, method: 'eth_chainId', transport: counting }),
    (error) => error instanceof RpcError && error.errorCode === 'RPC_UNAVAILABLE',
  );
  assert.equal(calls, 1, 'exactly one request is attempted; there is no retry');
});

test('rpcCall enforces the byte ceiling while streaming oversized responses', async () => {
  const chunk = 'x'.repeat(1024 * 256);
  const transport = async () => streamResponse([chunk, chunk, chunk, chunk, chunk]);
  await assert.rejects(
    rpcCall({ url: URL_MAINNET, method: 'eth_chainId', transport }),
    (error) => error instanceof RpcError && error.errorCode === 'RPC_MALFORMED',
  );
});

test('rpcCall accepts a streamed response within the byte limit', async () => {
  const payload = JSON.stringify({ jsonrpc: '2.0', id: 1, result: '0x7c6' });
  const padding = ' '.repeat(RPC_LIMITS.maxResponseBytes - payload.length - 1000);
  const transport = async () => streamResponse([padding.slice(0, 512 * 1024), payload, padding.slice(512 * 1024)]);
  const result = await rpcCall({ url: URL_MAINNET, method: 'eth_chainId', transport });
  assert.equal(result, '0x7c6');
});

test('rpcCall rejects an oversized plain-text response and unusable inputs', async () => {
  const oversized = { ok: true, status: 200, text: async () => 'z'.repeat(RPC_LIMITS.maxResponseBytes + 1) };
  await assert.rejects(
    rpcCall({ url: URL_MAINNET, method: 'eth_chainId', transport: async () => oversized }),
    (error) => error.errorCode === 'RPC_MALFORMED',
  );
  await assert.rejects(rpcCall({ url: 'http://insecure.example/', method: 'eth_chainId' }), /https/);
  await assert.rejects(rpcCall({ url: URL_MAINNET, method: 'eth_chainId', transport: 'nope' }), /transport/);
});

test('rpcCall echoes the configured request ID and rejects mismatched echoes', async () => {
  const transport = async (url, init) => {
    const sent = JSON.parse(init.body);
    assert.equal(sent.id, 7);
    return jsonResponse('0x1', { id: 7 });
  };
  assert.equal(await rpcCall({ url: URL_MAINNET, method: 'eth_chainId', transport, requestId: 7 }), '0x1');
  const mismatch = async () => jsonResponse('0x1', { id: 1 });
  await assert.rejects(rpcCall({ url: URL_MAINNET, method: 'eth_chainId', transport: mismatch, requestId: 7 }), /ID does not match/);
});

test('parseHexQuantity judges hex quantities strictly', () => {
  assert.equal(parseHexQuantity('0x7c6'), 1990n);
  assert.equal(parseHexQuantity('0x0'), 0n);
  assert.equal(parseHexQuantity('0X7c6'), null);
  assert.equal(parseHexQuantity('0x'), null);
  assert.equal(parseHexQuantity('1990'), null);
  assert.equal(parseHexQuantity('banana'), null);
  assert.equal(parseHexQuantity(null), null);
  assert.equal(parseHexQuantity(1990), null);
});

test('diagnostic helpers expose no signing, broadcasting or secret-handling surface', async () => {
  // The helpers are read-only by contract (FR-008): scan their sources for forbidden surfaces.
  const forbidden = [
    'eth_sendRawTransaction', 'eth_sendTransaction', 'eth_signTransaction', 'eth_sign',
    'personal_', 'privateKey', 'private_key', 'mnemonic', 'keystore', 'Signer(', 'Wallet(',
  ];
  const directories = ['scripts'];
  for (const directory of directories) {
    const root = path.join(projectRoot, directory);
    for (const name of (await readdir(root, { recursive: true })).sort()) {
      if (!name.endsWith('.mjs')) continue;
      const text = await readFile(path.join(root, name), 'utf8');
      for (const token of forbidden) {
        assert.ok(!text.includes(token), `${directory}/${name} must not reference ${token}`);
      }
    }
  }
});

test('stable error classes and live-check reports validate against the schema collection', async () => {
  const validate = await loadValidators(schemaRoot);
  for (const code of ['WRONG_CHAIN', 'RPC_UNAVAILABLE', 'RPC_RATE_LIMITED', 'RPC_MALFORMED', 'UNSUPPORTED_PROVIDER', 'UNKNOWN']) {
    assert.doesNotThrow(() => validate('error-code', code), `${code} is a stable error class`);
  }
  assert.throws(() => validate('error-code', 'RPC_TIMEOUT'), /error-code/);
});
