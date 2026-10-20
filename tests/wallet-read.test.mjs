import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import { pathToFileURL } from 'node:url';
import { buildRelease } from '../scripts/lib/release.mjs';
import { projectRoot } from './support/fixtures.mjs';

// Tests execute the generated asset, with its generated local import and snapshot.
// No QIE endpoint or real wallet is contacted.
const root = await mkdtemp(path.join(os.tmpdir(), 'qie-wallet-replay-'));
after(() => rm(root, { recursive: true, force: true }));
const output = await buildRelease(projectRoot, { check: true });
const { writeTree } = await import('../scripts/lib/io.mjs');
await writeTree(path.join(root, 'qie-wallets'), output['qie-wallets']);
const { createReadSession } = await import(pathToFileURL(path.join(root, 'qie-wallets/recipes/wallet-read/assets/wallet-read.ts')));
const pack = JSON.parse(output['qie-wallets']['data/network-claims.json']);
const negatives = JSON.parse(await readFile(new URL('./fixtures/wallet-negative.json', import.meta.url)));
const account = '0x' + '1'.repeat(40); // Synthetic fixture; not a QIE deployment.
const target = '0x' + '2'.repeat(40);
const calldata = '0x' + 'ab'.repeat(4); // Fixture getter input, not a claimed ABI.

class Provider {
  listeners = new Map();
  calls = [];
  chain = '0x7bf';
  accounts = [account];
  value = 1n;
  override = null;
  on(event, fn) { this.listeners.set(event, fn); }
  removeListener(event, fn) { assert.equal(this.listeners.get(event), fn); this.listeners.delete(event); }
  emit(event) { this.listeners.get(event)?.(); }
  async request({ method, params }) {
    this.calls.push({ method, params });
    if (this.override) {
      const result = this.override(method);
      if (result !== undefined) return result;
    }
    if (method === 'eth_chainId') return this.chain;
    if (method === 'eth_requestAccounts') return this.accounts;
    if (method === 'eth_call') return '0x' + this.value.toString(16).padStart(64, '0');
    throw Error('Unexpected method: ' + method);
  }
}

for (const network of ['qie-mainnet', 'qie-testnet']) {
  test(`mock wallet connects and refreshes a read on the explicit ${network}`, async () => {
    const provider = new Provider();
    provider.chain = network === 'qie-mainnet' ? '0x7c6' : '0x7bf';
    const views = [];
    const session = createReadSession(provider, pack, network, { onState: s => views.push(s) });
    assert.equal(provider.calls.length, 0, 'no automatic connection');
    assert.equal(await session.connect(), account);
    assert.equal(await session.readUint256(target, calldata), 1n);
    provider.value = 2n; // Simulated changed state, not a proven transaction effect.
    assert.equal(await session.readUint256(target, calldata), 2n);
    assert.equal(session.snapshot().value, 2n);
    assert.ok(views.some(s => s.phase === 'reading' && s.value === null));
    const call = provider.calls.find(c => c.method === 'eth_call');
    assert.deepEqual(call.params, [{ to: target, data: calldata }, 'latest']);
    assert.ok(provider.calls.every(c => ['eth_chainId', 'eth_requestAccounts', 'eth_call'].includes(c.method)));
    session.dispose();
    assert.equal(provider.listeners.size, 0);
    await assert.rejects(session.connect(), { code: 'SESSION_NOT_READY' });
  });
}

for (const event of ['accountsChanged', 'chainChanged', 'disconnect']) {
  test(`provider ${event} clears old displayed state and requires deliberate reconnect`, async () => {
    const provider = new Provider();
    const session = createReadSession(provider, pack, 'qie-testnet');
    await session.connect(); await session.readUint256(target, calldata);
    const calls = provider.calls.length;
    provider.emit(event);
    assert.deepEqual(session.snapshot(), { phase: 'disconnected', account: null, value: null, error: null });
    await assert.rejects(session.readUint256(target, calldata), { code: 'SESSION_NOT_READY' });
    assert.equal(provider.calls.length, calls, 'no automatic reconnect or read');
    session.dispose();
  });
}

for (const fixture of negatives) {
  test(`wallet negative ${fixture.id} returns ${fixture.error} without a stale value`, async () => {
    const provider = new Provider();
    const session = createReadSession(provider, pack, 'qie-testnet', { timeoutMs: 20 });
    const readFailures = ['empty-call', 'odd-call', 'wide-call', 'silent-change', 'account-event'];
    const duringRead = readFailures.includes(fixture.change);
    if (duringRead) await session.connect();
    provider.override = method => {
      if (fixture.change === 'wrong-chain' && method === 'eth_chainId') return '0x7c6';
      if (fixture.change === 'malformed-chain' && method === 'eth_chainId') return '0x07bf';
      if (fixture.change === 'empty-accounts' && method === 'eth_requestAccounts') return [];
      if (fixture.change === 'malformed-account' && method === 'eth_requestAccounts') return ['fake'];
      if (fixture.change === 'rejected' && method === 'eth_requestAccounts') throw Object.assign(Error('denied'), { code: 4001 });
      if (fixture.change === 'offline') throw Error('offline');
      if (fixture.change === 'hang') return new Promise(() => {});
      if (method === 'eth_call') {
        if (fixture.change === 'empty-call') return '0x';
        if (fixture.change === 'odd-call') return '0x1';
        if (fixture.change === 'wide-call') return '0x' + '0'.repeat(128);
        if (fixture.change === 'silent-change') provider.chain = '0x7c6';
        if (fixture.change === 'account-event') provider.emit('accountsChanged');
      }
    };
    await assert.rejects(duringRead ? session.readUint256(target, calldata) : session.connect(), { code: fixture.error });
    assert.equal(session.snapshot().value, null);
    assert.equal(session.snapshot().account, null);
    if (fixture.change === 'wrong-chain') assert.deepEqual(provider.calls.map(c => c.method), ['eth_chainId']);
    assert.ok(provider.calls.every(c => ['eth_chainId', 'eth_requestAccounts', 'eth_call'].includes(c.method)));
    session.dispose();
  });
}

for (const status of ['UNKNOWN', 'CLAIMED', 'CONFLICTED', 'STALE', 'UNSUPPORTED', 'DEPRECATED']) {
  test(`wallet refuses ${status} chain configuration before any provider call`, () => {
    const snapshot = structuredClone(pack);
    snapshot.claims.find(c => c.network_id === 'qie-testnet' && c.predicate === 'chain_id').status = status;
    const provider = new Provider();
    assert.throws(() => createReadSession(provider, snapshot, 'qie-testnet'), { code: 'DEPENDENCY_MISMATCH' });
    assert.equal(provider.calls.length, 0);
  });
}

test('expired VERIFIED configuration is evaluated by the shared rule before requesting accounts', async () => {
  const snapshot = structuredClone(pack);
  Object.assign(snapshot.claims.find(c => c.network_id === 'qie-testnet' && c.predicate === 'chain_id'), {
    status: 'VERIFIED', checked_at: '2000-01-01T00:00:00Z', expires_at: '2000-01-02T00:00:00Z',
  });
  const provider = new Provider();
  const session = createReadSession(provider, snapshot, 'qie-testnet');
  await assert.rejects(session.connect(), { code: 'SOURCE_STALE' });
  assert.equal(provider.calls.length, 0);
  session.dispose();
});

test('native, duplicate/missing chain claims and non-listening providers cannot create a read session', () => {
  const provider = new Provider();
  assert.throws(() => createReadSession(provider, pack, 'qie-native'), { code: 'DEPENDENCY_MISMATCH' });
  assert.throws(() => createReadSession(provider, { claims: [] }, 'qie-testnet'), { code: 'DEPENDENCY_MISMATCH' });
  assert.throws(() => createReadSession(provider, { claims: [...pack.claims, ...pack.claims] }, 'qie-testnet'), { code: 'DEPENDENCY_MISMATCH' });
  assert.throws(() => createReadSession({ request() {} }, pack, 'qie-testnet'), { code: 'DEPENDENCY_MISMATCH' });
  assert.throws(() => createReadSession(provider, pack, 'qie-testnet', { timeoutMs: 0 }), { code: 'DEPENDENCY_MISMATCH' });
});

test('invalid addresses/calldata fail before a contract read and never infer an address', async () => {
  const provider = new Provider();
  const session = createReadSession(provider, pack, 'qie-testnet'); await session.connect();
  for (const [to, data] of [['fake', calldata], ['0x' + '0'.repeat(40), calldata], [target, '0x'], [target, '0xabc']]) {
    await assert.rejects(session.readUint256(to, data), { code: 'DEPENDENCY_MISMATCH' });
  }
  assert.ok(!provider.calls.some(c => c.method === 'eth_call'));
  session.dispose();
});
