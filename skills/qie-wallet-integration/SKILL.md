---
name: qie-wallet-integration
description: Connect a website or dApp to QIE Wallet (and any injected EVM wallet) on QIE — EIP-6963 discovery (rdns me.qiewallet), window.qie, connect, switch/add the QIE network, testnet toggle, account/chain events, ethers/viem/wagmi wiring and QIE Wallet quirks. Use for any wallet-connection, signing-prompt or "wallet not detected / wrong network" work on QIE.
license: MIT
---

QIE Wallet is a non-custodial browser extension that injects a standard [EIP-1193](https://eips.ethereum.org/EIPS/eip-1193) provider. Anything that works with injected EVM wallets works with it — but it has a few quirks that silently break naive integrations. Sources: the official [QIE Wallet Integration Guide for Websites](https://docs.qie.digital/qie-wallet-integration-guide-for-websites.md) (written for v4.2.2), and the current Chrome Web Store package, v4.2.4, read as source on 2026-11-17.

- Install: [Chrome Web Store](https://chromewebstore.google.com/detail/oljchdcgmibnjbbopolafbjncfhdacjb) (extension id `oljchdcgmibnjbbopolafbjncfhdacjb`) · portal: https://qiewallet.me/
- EVM only: the wallet's Bitcoin and Solana accounts are **not** exposed through the provider.
- Pages must be served over HTTPS or `localhost`; extensions don't inject into `file://`.

## QIE Wallet quirks you must handle

| Quirk | What to do |
|---|---|
| Reports `isMetaMask = true` | Never identify the wallet by `isMetaMask`. Use EIP-6963 `rdns === 'me.qiewallet'` or `window.qie`. |
| `window.ethereum` may belong to another wallet | Prefer EIP-6963, then `window.qie`, then `window.ethereum`. |
| Never emits `disconnect` | Site disconnection arrives as `accountsChanged` with `[]`. Treat `[]` as disconnected. |
| `eth_chainId` returns lowercase hex (`0x7c6`) | Compare chain IDs numerically, never as strings. |
| Testnet hidden until the user enables the **Testnet** toggle in wallet settings | Before that, `wallet_switchEthereumChain` to `0x7bf` returns `4902` and `wallet_addEthereumChain` does not help. Tell the user to enable the toggle. |
| `eth_accounts` non-empty ≠ unlocked | A later signing request can still open an unlock prompt first — expect the delay and a possible `4001`. |
| Methods the wallet doesn't handle are forwarded to the active chain's RPC | `eth_call`, `eth_getBalance`, `eth_getTransactionReceipt` work through the provider directly. |
| Every request is rejected after 60 s in the page with `Error('Request timeout')` and no `code`, while the popup can stay open for up to 5 minutes (v4.2.4) | Don't add your own short timeouts. After a timeout on a send, the user can still approve it: check the nonce and explorer before offering a retry. |
| The wallet's `eth_estimateGas` drops `from` (v4.2.4) | Sender-dependent calls (token transfers, anything that reads `msg.sender`) fail to estimate through the wallet. ethers estimates through the provider, so pass `gasLimit` yourself (§4). viem/wagmi leave gas to the wallet's send path, which isn't affected. |

Also supported (guide v4.2.2, checked against v4.2.4): `wallet_watchAsset` (ERC-20 only), `wallet_requestPermissions`, `wallet_revokePermissions`, `net_version` (the active chain's ID as a decimal string), `personal_sign`, `eth_signTypedData_v4` and `_v3`. v4.2.4 rejects `eth_sign` and v1 `eth_signTypedData` with `4200` (unsupported method).

## 1. Detect the wallet

```ts
type Announced = { info: { uuid: string; name: string; icon: string; rdns: string }; provider: any };
const announced: Announced[] = [];
window.addEventListener('eip6963:announceProvider', (e: any) => announced.push(e.detail));
window.dispatchEvent(new Event('eip6963:requestProvider'));

export function getQieProvider() {
  const viaEip6963 = announced.find((p) => p.info.rdns === 'me.qiewallet');
  if (viaEip6963) return viaEip6963.provider;
  if ((window as any).qie) return (window as any).qie;         // QIE Wallet only
  return (window as any).ethereum ?? null;                     // any injected wallet
}
```

Announcements can arrive after your first check — re-run detection when the user clicks **Connect** instead of caching `null` at page load. If nothing is found, show an install link; don't fail silently. Show the user which wallet you picked (name/icon from EIP-6963).

## 2. Connect (only from a user action)

```ts
const provider = getQieProvider();
const accounts: string[] = await provider.request({ method: 'eth_requestAccounts' }); // opens the popup
```

- Call it only from a click. To restore a session silently on load use `eth_accounts` (no popup; `[]` when not connected).
- **Don't wrap `eth_requestAccounts` in a short timeout.** It waits for a human (unlock + approve). QIE Wallet's page-side provider already gives up after 60 s (`Error('Request timeout')`, no `code`) while its popup can stay open for up to 5 minutes, and a retry queues a second approval. Let the user finish or cancel the first prompt.
- `accountsChanged` can fire *during* a first-time connect, just before `eth_requestAccounts` resolves. Don't treat that event as "connection cancelled" — reconcile with the returned accounts.

## 3. Make sure the wallet is on the right QIE network

```ts
const QIE = {
  mainnet: {
    chainId: '0x7c6',
    chainName: 'QIE Blockchain Mainnet',
    nativeCurrency: { name: 'QIE', symbol: 'QIE', decimals: 18 },
    rpcUrls: ['https://rpc1mainnet.qie.digital', 'https://rpc5mainnet.qie.digital'],
    blockExplorerUrls: ['https://mainnet.qie.digital'],
  },
  testnet: {
    chainId: '0x7bf',
    chainName: 'QIE Testnet',
    nativeCurrency: { name: 'QIE', symbol: 'QIE', decimals: 18 },
    rpcUrls: ['https://rpc1testnet.qie.digital'],
    blockExplorerUrls: ['https://testnet.qie.digital'],
  },
} as const;

// Call after connecting: QIE Wallet answers 4100 (unauthorized) to sites that aren't connected.
export async function ensureQieNetwork(provider: any, net: keyof typeof QIE) {
  const target = QIE[net];
  const current = await provider.request({ method: 'eth_chainId' });
  if (BigInt(current) === BigInt(target.chainId)) return;              // numeric compare
  try {
    await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: target.chainId }] });
  } catch (err: any) {
    if (err?.code !== 4902) throw err;
    // QIE Wallet hides testnet until its Testnet toggle is on; adding the chain doesn't help there.
    if (net === 'testnet' && provider.isQIE) throw new Error('Enable "Testnet" in QIE Wallet settings, then retry.');
    await provider.request({ method: 'wallet_addEthereumChain', params: [target] });   // other wallets
  }
}
```

Always ask before switching networks, and never silently switch from mainnet to testnet or back. Re-check `eth_chainId` right before every signing request.

## 4. Read, sign and send (ethers v6)

```ts
import { BrowserProvider, Contract, JsonRpcProvider, parseEther, parseUnits } from 'ethers';

const browser = new BrowserProvider(getQieProvider());
const signer = await browser.getSigner();                      // signing goes through the wallet popup
const rpc = new JsonRpcProvider('https://rpc1mainnet.qie.digital/', 1990); // same network as the wallet

const erc20 = new Contract(tokenAddress, [
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function transfer(address,uint256) returns (bool)',
], rpc);
const me = await signer.getAddress();
const raw = await erc20.balanceOf(me);                         // reads: no popup, no gas

const tx = await signer.sendTransaction({ to: recipient, value: parseEther('1.5') }); // native QIE
await tx.wait();

// Token transfer: estimate on the public RPC *with* `from`, then pass gasLimit yourself.
const data = erc20.interface.encodeFunctionData('transfer', [recipient, parseUnits('10', await erc20.decimals())]);
const gas = await rpc.estimateGas({ from: me, to: tokenAddress, data });
const tx2 = await signer.sendTransaction({ to: tokenAddress, data, gasLimit: (gas * 12n) / 10n });
await tx2.wait();
```

- Don't hardcode gas prices. For gas limits, don't rely on the wallet's estimate in ethers: QIE Wallet v4.2.4's `eth_estimateGas` drops `from`, so sender-dependent calls fail to estimate. Native transfers still work (the wallet falls back to 21,000).
- You pay for **at least 50% of the gas limit** (see `qie-concepts`), so use estimate × ~1.2 and never pad generously.
- Login messages must include a one-time nonce and be verified server-side (`ethers.verifyMessage`). Prefer EIP-712 (`signer.signTypedData`) for structured data; set `chainId: 1990` (or 1983) in the domain.
- Show exactly what the user approves: network, recipient/contract, amount in token units, allowance changes.

## 5. Keep state in sync

```ts
provider.on('accountsChanged', (accounts: string[]) => {
  if (accounts.length === 0) resetSession();        // this IS the disconnect signal on QIE Wallet
  else setAccount(accounts[0]);
});
provider.on('chainChanged', () => window.location.reload()); // simplest safe handling
// SPA: provider.removeListener(event, handler) on unmount
```

Discard any in-flight read whose account/chain changed before it resolved; never render a balance from an older session.

## viem and wagmi

```ts
import { createWalletClient, createPublicClient, custom, http, defineChain } from 'viem';

export const qieMainnet = defineChain({
  id: 1990,
  name: 'QIE Mainnet',
  nativeCurrency: { name: 'QIE', symbol: 'QIE', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc1mainnet.qie.digital'] } },
  blockExplorers: { default: { name: 'QIE Explorer', url: 'https://mainnet.qie.digital' } },
  // canonical Multicall3 is not deployed on QIE; optional compatible one (undocumented, see qie-addresses):
  // contracts: { multicall3: { address: '0x13305ab992c3BA30a3f2c4B92727eb4cA64063e8' } },
});

export const walletClient = createWalletClient({ chain: qieMainnet, transport: custom(getQieProvider()) });
export const publicClient = createPublicClient({ chain: qieMainnet, transport: http() });
```

wagmi's `createConfig` discovers EIP-6963 wallets by default (`multiInjectedProviderDiscovery: true`), so QIE Wallet shows up as its own connector (`id === 'me.qiewallet'`). A bare `injected()` targets `window.ethereum`, which may belong to another wallet. Full chain definitions for both networks are in `qie-networks`. The canonical Multicall3 doesn't exist on QIE. Either configure the compatible address above, or batch reads with individual calls.

## Errors

| Code / symptom | Meaning | Action |
|---|---|---|
| `4001` | User rejected | Normal path; offer a retry button. |
| `4902` on mainnet switch | Chain not in this wallet | `wallet_addEthereumChain` with the params above. |
| `4902` switching to testnet in QIE Wallet | Testnet toggle off | Ask the user to enable Testnet in wallet settings. |
| `Error('Request timeout')`, no `code` | QIE Wallet's 60 s page-side timeout; the popup may still be open | Don't retry automatically. For a send, check the nonce and explorer first: the user can still approve the original. |
| `-32002` | Other wallets: a request is already pending (QIE Wallet doesn't use this code) | Ask the user to open the wallet popup; don't fire another request. |
| `4200` | Unsupported method, e.g. `eth_sign` or v1 `eth_signTypedData` | Use `personal_sign` or `eth_signTypedData_v4`. |
| `4100` / `4900` / `4901` | Unauthorized / provider disconnected / chain disconnected | Reset state, reconnect deliberately. |
| Provider `undefined` | Not installed, `file://` page, or checked before injection | Re-detect on click; serve over HTTPS/localhost; show install link. |
| Popup never appears | Another wallet owns `window.ethereum` | Use EIP-6963 detection. |
| Txs fail / balances wrong | dApp configured with legacy chain ID `5656` or `9731` | Use `1990` (mainnet) / `1983` (testnet). |

## Never

- Never ask for, log or store a seed phrase or private key — QIE Wallet keys stay on the user's device.
- Never request accounts or signatures on page load.
- Never send a transaction the user hasn't explicitly confirmed, and never resubmit automatically.

## Pre-ship checklist (from the official guide)

- [ ] Connect and disconnect (disconnect = `accountsChanged([])`)
- [ ] Reject each popup once
- [ ] Switch accounts mid-session
- [ ] Switch networks mid-session (incl. testnet toggle off)
- [ ] Confirm one transaction end-to-end on the explorer
