import { MOCK_ACCOUNT, MOCK_COUNTER_VALUE } from './config';

export type Eip1193Provider = {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
  on(event: string, listener: (...args: unknown[]) => void): void;
  removeListener(event: string, listener: (...args: unknown[]) => void): void;
};

type Listener = (...args: unknown[]) => void;

// Deliberate mock adapter for the simulated demonstration. It answers exactly
// the three methods the guarded read controller uses and nothing else. It is
// never selected to replace a real provider after a failure.
export class MockProvider implements Eip1193Provider {
  readonly kind = 'mock';
  #chainId: bigint;
  #value: bigint;
  #listeners = new Map<string, Set<Listener>>();

  constructor(chainId: bigint, value: bigint = MOCK_COUNTER_VALUE) {
    this.#chainId = chainId;
    this.#value = value;
  }

  async request({ method }: { method: string; params?: unknown[] }): Promise<unknown> {
    switch (method) {
      case 'eth_chainId':
        return `0x${this.#chainId.toString(16)}`;
      case 'eth_requestAccounts':
        return [MOCK_ACCOUNT];
      case 'eth_call':
        return `0x${this.#value.toString(16).padStart(64, '0')}`;
      default:
        throw Object.assign(new Error(`The mock adapter does not implement ${method}.`), { code: 4200 });
    }
  }

  on(event: string, listener: Listener): void {
    const listeners = this.#listeners.get(event) ?? new Set<Listener>();
    listeners.add(listener);
    this.#listeners.set(event, listeners);
  }

  removeListener(event: string, listener: Listener): void {
    this.#listeners.get(event)?.delete(listener);
  }
}
