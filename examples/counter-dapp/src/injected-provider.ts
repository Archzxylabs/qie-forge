import type { Eip1193Provider } from './mock-provider';

// QIE's documented discovery identifier selects a provider candidate; it is not
// proof of wallet authenticity or capability. Every candidate still needs the
// controller's chain/account guards before a read.
// Source: https://docs.qie.digital/qie-wallet-integration-guide-for-websites
const QIE_RDNS = 'me.qiewallet';
let announcedQieProvider: Eip1193Provider | null = null;

function usableProvider(candidate: unknown): Eip1193Provider | null {
  if (!candidate || typeof candidate !== 'object') return null;
  const provider = candidate as Partial<Eip1193Provider>;
  if (typeof provider.request !== 'function'
    || typeof provider.on !== 'function'
    || typeof provider.removeListener !== 'function') {
    return null;
  }
  return provider as Eip1193Provider;
}

// Keep the listener for the page's lifetime so announcements after module load
// are also discovered. No account request or connection happens in this handler.
window.addEventListener('eip6963:announceProvider', (event: Event) => {
  const detail: unknown = (event as CustomEvent<unknown>).detail;
  if (!detail || typeof detail !== 'object') return;
  const { info, provider } = detail as { info?: unknown; provider?: unknown };
  if (!info || typeof info !== 'object'
    || (info as { rdns?: unknown }).rdns !== QIE_RDNS) return;
  const candidate = usableProvider(provider);
  if (candidate && !announcedQieProvider) announcedQieProvider = candidate;
});

export function getInjectedProvider(): Eip1193Provider | null {
  // Called by the explicit Connect action. Re-announcement also covers wallets
  // whose initial event arrived before the app installed its listener.
  window.dispatchEvent(new Event('eip6963:requestProvider'));
  const injected = window as Window & { qie?: unknown; ethereum?: unknown };
  return usableProvider(announcedQieProvider)
    ?? usableProvider(injected.qie)
    ?? usableProvider(injected.ethereum);
}
