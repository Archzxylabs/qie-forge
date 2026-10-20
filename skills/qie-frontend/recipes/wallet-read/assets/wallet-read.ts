// Original framework-neutral EIP-1193 read controller. Tested with mock providers;
// this is not a QIE provider compatibility assertion or a signing implementation.
import { effectiveStatus } from '../../../scripts/lib/effective-status.mjs';
type Provider = {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
  on(event: string, listener: (...args: unknown[]) => void): void;
  removeListener(event: string, listener: (...args: unknown[]) => void): void;
};
type Claim = { network_id: string; predicate: string; value: unknown; status: string; [key: string]: unknown };
type Snapshot = { claims: Claim[] };
type State = {
  phase: 'disconnected' | 'connecting' | 'ready' | 'reading' | 'error' | 'disposed';
  account: string | null;
  value: bigint | null;
  error: string | null;
};

export class ReadError extends Error {
  code: string;
  constructor(code: string) { super(code); this.code = code; }
}

// The chain binding comes from the installed canonical snapshot, not a caller's
// arbitrary chain ID. Native identifiers are deliberately not accepted.
export function createReadSession(provider: Provider, snapshot: Snapshot, networkId: string,
  options: { timeoutMs?: number; onState?: (state: State) => void } = {}) {
  if (!['qie-mainnet', 'qie-testnet'].includes(networkId)) throw new ReadError('DEPENDENCY_MISMATCH');
  const claims = snapshot.claims.filter(c => c.network_id === networkId && c.predicate === 'chain_id');
  if (claims.length !== 1 || !['DOCUMENTED', 'VERIFIED'].includes(claims[0].status)
    || !Number.isSafeInteger(claims[0].value) || Number(claims[0].value) <= 0) {
    throw new ReadError('DEPENDENCY_MISMATCH');
  }
  if (!provider || typeof provider.request !== 'function' || typeof provider.on !== 'function'
    || typeof provider.removeListener !== 'function') throw new ReadError('DEPENDENCY_MISMATCH');
  const timeoutMs = options.timeoutMs ?? 10_000;
  if (!Number.isInteger(timeoutMs) || timeoutMs <= 0 || timeoutMs > 10_000) throw new ReadError('DEPENDENCY_MISMATCH');
  const expected = BigInt(Number(claims[0].value));
  const address = /^0x[0-9a-fA-F]{40}$/;
  let revision = 0;
  let state: State = { phase: 'disconnected', account: null, value: null, error: null };
  const view = () => ({ ...state });
  const update = (next: State) => { state = next; options.onState?.(view()); };
  const invalidate = () => {
    revision += 1;
    update({ phase: 'disconnected', account: null, value: null, error: null });
  };
  const events = ['accountsChanged', 'chainChanged', 'disconnect'];
  for (const event of events) provider.on(event, invalidate);

  async function request(method: string, params: unknown[] = []) {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        Promise.resolve().then(() => provider.request({ method, params })),
        new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new ReadError('RPC_UNAVAILABLE')), timeoutMs); }),
      ]);
    } finally { clearTimeout(timer); }
  }
  async function checkChain(epoch: number) {
    if (!['DOCUMENTED', 'VERIFIED'].includes(effectiveStatus(claims[0], {
      now: new Date().toISOString(), offline: false,
    }).status)) throw new ReadError('SOURCE_STALE');
    const raw = await request('eth_chainId');
    if (epoch !== revision) throw new ReadError('SESSION_CHANGED');
    if (typeof raw !== 'string' || !/^0x(?:0|[1-9a-fA-F][0-9a-fA-F]*)$/.test(raw)) throw new ReadError('RPC_MALFORMED');
    if (BigInt(raw) !== expected) throw new ReadError('WRONG_CHAIN');
  }
  function fail(error: unknown, epoch: number): never {
    const code = error instanceof ReadError ? error.code
      : (error as {code?: unknown})?.code === 4001 ? 'USER_REJECTED' : 'RPC_UNAVAILABLE';
    if (epoch === revision) update({ phase: 'error', account: null, value: null, error: code });
    throw new ReadError(code);
  }
  return {
    snapshot: view,
    // Invoke only from an explicit connect button/action. Never automatically ask
    // for accounts at page load or after an invalidating provider event.
    async connect() {
      if (!['disconnected', 'error'].includes(state.phase)) throw new ReadError('SESSION_NOT_READY');
      const epoch = ++revision;
      update({ phase: 'connecting', account: null, value: null, error: null });
      try {
        await checkChain(epoch);
        const accounts = await request('eth_requestAccounts');
        if (epoch !== revision) throw new ReadError('SESSION_CHANGED');
        if (!Array.isArray(accounts) || !accounts.length || !accounts.every(a => typeof a === 'string' && address.test(a))) {
          throw new ReadError('RPC_MALFORMED');
        }
        await checkChain(epoch);
        update({ phase: 'ready', account: accounts[0], value: null, error: null });
        return accounts[0] as string;
      } catch (error) { return fail(error, epoch); }
    },
    async readUint256(to: string, data: string) {
      if (state.phase !== 'ready') throw new ReadError('SESSION_NOT_READY');
      if (!address.test(to) || /^0x0{40}$/.test(to) || !/^0x(?:[0-9a-fA-F]{2}){4,}$/.test(data)) {
        throw new ReadError('DEPENDENCY_MISMATCH');
      }
      const epoch = revision;
      const account = state.account;
      update({ phase: 'reading', account, value: null, error: null });
      try {
        await checkChain(epoch);
        const raw = await request('eth_call', [{ to, data }, 'latest']);
        if (epoch !== revision) throw new ReadError('SESSION_CHANGED');
        if (typeof raw !== 'string' || !/^0x[0-9a-fA-F]{64}$/.test(raw)) throw new ReadError('RPC_MALFORMED');
        await checkChain(epoch);
        const value = BigInt(raw);
        update({ phase: 'ready', account, value, error: null });
        return value;
      } catch (error) { return fail(error, epoch); }
    },
    dispose() {
      revision += 1;
      for (const event of events) provider.removeListener(event, invalidate);
      update({ phase: 'disposed', account: null, value: null, error: null });
    },
  };
}
