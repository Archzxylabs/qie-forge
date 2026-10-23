import type { Eip1193Provider } from './mock-provider';

// The developer selects the injected provider by choosing this execution mode.
// No wallet brand is assumed: any object exposing the EIP-1193 request/on/
// removeListener surface is accepted. Absence is reported, never worked around.
export function getInjectedProvider(): Eip1193Provider | null {
  const candidate = (window as Window & { ethereum?: unknown }).ethereum;
  if (!candidate || typeof candidate !== 'object') return null;
  const provider = candidate as Partial<Eip1193Provider>;
  if (typeof provider.request !== 'function'
    || typeof provider.on !== 'function'
    || typeof provider.removeListener !== 'function') {
    return null;
  }
  return provider as Eip1193Provider;
}
