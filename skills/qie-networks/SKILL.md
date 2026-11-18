---
name: qie-networks
description: QIE network settings — chain IDs (mainnet 1990, testnet 1983), every official RPC endpoint with live status, explorers, faucet, native currency, legacy chain IDs to avoid, RPC capabilities/limits, and copy-paste configs for viem, wagmi, ethers, Hardhat, Foundry and wallet_addEthereumChain. Use whenever you connect anything to QIE or need to verify an endpoint is on the right chain.
license: MIT
---

**Never default between mainnet and testnet.** If the user didn't say which, ask. Never fall back from one network's RPC to the other's.

## Networks

| | QIE Mainnet | QIE Testnet |
|---|---|---|
| Chain ID | `1990` (`0x7c6`) | `1983` (`0x7bf`) |
| Primary RPC | `https://rpc1mainnet.qie.digital/` | `https://rpc1testnet.qie.digital/` (docs: "recommend") |
| Explorer | https://mainnet.qie.digital/ | https://testnet.qie.digital/ |
| Native currency | QIE, 18 decimals | QIE, 18 decimals |
| Faucet | — | https://www.qie.digital/faucet (2 test QIE per day) |
| Explorer API (Blockscout v7.0.2) | `https://mainnet.qie.digital/api` and `/api/v2` | `https://testnet.qie.digital/api` and `/api/v2` |
| WebSocket | no documented endpoint (see below) | no documented endpoint |

Sources: [Access Mainnet or Testnet](https://docs.qie.digital/getting-started-with-qie-blockchain/4.-access-mainnet-or-testnet.md), the [QIE Wallet integration guide](https://docs.qie.digital/qie-wallet-integration-guide-for-websites.md) and the official [developers page](https://www.qie.digital/developers).

**Never use chain ID `5656` (pre-V3) or `9731` (legacy).** Old aggregator listings still show them.

**Chain-ID registries are wrong or incomplete for QIE (observed 2026-11-16):**
- `ethereum-lists/chains` (and chainid.network) registers **1983 as "Krown Mainnet"**, a different chain, and has **no entry for 1990**. Its "QIE Blockchain" entry is the legacy 5656.
- Tools that resolve chain metadata by ID (wallet network names, chain pickers, `viem/chains`-style lookups) may therefore show the wrong name for 1983 or nothing for 1990.
- Always define QIE chains explicitly with the values on this page. Never trust an auto-resolved name or RPC for these IDs.
- chainlist.org (DefiLlama registry) lists 1990 as "QIEMainnet" with rpc1/rpc5.

Official display labels differ. The docs network page lists mainnet as name `QIEMainnet`, symbol `QIEV3`. The wallet guide uses `QIE Blockchain Mainnet`, QIE's own Safe deployment uses `QIE Mainnet`, and the developers page gives the currency as `QIE, 18 decimals`. Use symbol `QIE` with 18 decimals. Any of these names works: the label has no on-chain effect.

## All official RPC endpoints

| Network | Endpoint | eth_chainId (re-checked 2026-11-17) |
|---|---|---|
| Mainnet | `https://rpc1mainnet.qie.digital/` | ✅ `0x7c6` |
| Mainnet | `https://rpc2mainnet.qie.digital/` | ✅ `0x7c6` |
| Mainnet | `https://rpc3mainnet.qie.digital/` | ✅ `0x7c6` |
| Mainnet | `https://rpc4mainnet.qie.digital/` | ✅ `0x7c6` |
| Mainnet | `https://rpc5mainnet.qie.digital/` | ✅ `0x7c6` |
| Testnet | `https://rpc1testnet.qie.digital/` | ✅ `0x7bf` |
| Testnet | `https://rpc2testnet.qie.digital/` | ✅ `0x7bf` |
| Testnet | `https://rpc3testnet.qie.digital/` | ❌ DNS does not resolve |
| Testnet | `https://rpc4testnet.qie.digital/` | ✅ `0x7bf` |
| Testnet | `https://rpc5testnet.qie.digital/` | ✅ `0x7bf` |
| Testnet | `https://rpc6testnet.qie.digital/` | ✅ `0x7bf` |

- The docs say: if one RPC is offline, switch to another available one. QIE Forge adds: only to another RPC **of the same network**.
- On the docs page the mainnet labels "RPC3" and "RPC5" point to `rpc5mainnet` and `rpc3mainnet` respectively. Refer to endpoints by hostname, not label.
- The Oracle docs page [Reading Data from Oracle](https://docs.qie.digital/qie-oracle/getting-started/reading-data-from-oracle.md) uses `https://rpc.qiechain.io`, which doesn't resolve (2026-11-17). Use the endpoints above.

## Verify an endpoint before use

```bash
cast chain-id --rpc-url https://rpc1mainnet.qie.digital/      # must print 1990 (testnet: 1983)
cast block-number --rpc-url https://rpc1mainnet.qie.digital/  # must be non-zero and advancing
```

Without Foundry:

```bash
curl -s -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_chainId","params":[]}' \
  https://rpc1testnet.qie.digital/          # → {"result":"0x7bf"}
```

A different chain ID means stop. Do this before any deployment or transaction.

## RPC capabilities and limits (observed 2026-11-16 and 2026-11-17, both networks)

| Feature | Status |
|---|---|
| Standard `eth_*` reads, `eth_sendRawTransaction`, `eth_estimateGas`, `eth_feeHistory`, `eth_maxPriorityFeePerGas` | ✅ |
| `eth_getLogs` | ✅ `toBlock − fromBlock` ≤ **10,000**, and at most 10,000 logs per response (node defaults) |
| Filters over HTTP (`eth_newFilter`, `eth_newBlockFilter`, `eth_getFilterChanges`) | ✅ |
| Archive state (`eth_call`/`eth_getBalance` at old blocks) | ✅ served back to genesis (block 1) on both networks. Not a published guarantee. |
| `debug_traceTransaction` (callTracer) | ✅ (rpc1–5 mainnet, testnet) |
| JSON-RPC batch requests | ✅ |
| `txpool_status` / `txpool_content` | ⚠️ answer, but always report an empty pool (hard-coded in QIE's node source). For pending txs use `eth_getTransactionCount(addr, "pending")` or CometBFT `https://rpc.qie.digital/num_unconfirmed_txs`. |
| `eth_getProof` | ⚠️ returns Cosmos IAVL proofs, not Ethereum MPT proofs |
| `eth_getBlockReceipts`, `eth_createAccessList`, `debug_traceCall`, `trace_*`, `eth_blobBaseFee` | ❌ not available |
| WebSocket / `eth_subscribe` on `rpcN*` hosts | ❌ (`wss://` returns 405) |
| Avg block time (last 100 blocks) | mainnet ~3.6 s · testnet ~4.3 s (docs claim ~2 s) |
| Base fee / suggested tip | mainnet 1 gwei / 0.125 gwei · testnet 7 wei / 0 |

Rate limits are not published, and no rate-limit headers are returned. Back off on HTTP 429 and spread load across the official endpoints of the same network.

**Undocumented hosts.** These answered with chain 1990 but are not in the official docs, so don't depend on them in production:
- `wss://ws1mainnet.qie.digital/` (WebSocket)
- `https://evm-rpc.qie.digital`

**Third-party RPC.** [NOWNodes](https://docs.nownodes.io/qie/) offers API-keyed QIE endpoints (`https://qie-evm.nownodes.io/`, Tendermint `https://qie-tendermint.nownodes.io`) and advertises WSS, debug/trace and archive. Ankr, dRPC, QuickNode, Alchemy and GetBlock had no QIE listing.

## Configs

### viem

```ts
import { defineChain, createPublicClient, fallback, http } from 'viem';

export const qieMainnet = defineChain({
  id: 1990,
  name: 'QIE Mainnet',
  nativeCurrency: { name: 'QIE', symbol: 'QIE', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc1mainnet.qie.digital'] } },
  blockExplorers: { default: { name: 'QIE Explorer', url: 'https://mainnet.qie.digital' } },
});

export const qieTestnet = defineChain({
  id: 1983,
  name: 'QIE Testnet',
  nativeCurrency: { name: 'QIE', symbol: 'QIE', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc1testnet.qie.digital'] } },
  blockExplorers: { default: { name: 'QIE Testnet Explorer', url: 'https://testnet.qie.digital' } },
  testnet: true,
});

// Same-network failover only.
export const client = createPublicClient({
  chain: qieMainnet,
  transport: fallback([
    http('https://rpc1mainnet.qie.digital'),
    http('https://rpc2mainnet.qie.digital'),
    http('https://rpc4mainnet.qie.digital'),
  ]),
});
```

The canonical Multicall3 is not deployed on QIE, so viem's `multicall()` fails by default. To batch reads you can either:
- set `contracts: { multicall3: { address: '0x13305ab992c3BA30a3f2c4B92727eb4cA64063e8' } }` on **mainnet only**. It is a Multicall3-compatible contract found in the current official QIEDEX app config (undocumented; no code on testnet; see `qie-addresses` → Multicall), or
- make individual calls, or
- deploy your own Multicall3.

### wagmi

```ts
import { createConfig, http } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { qieMainnet, qieTestnet } from './chains';

export const config = createConfig({
  chains: [qieMainnet, qieTestnet],
  connectors: [injected()],              // window.ethereum; QIE Wallet is also added via EIP-6963
  transports: { [qieMainnet.id]: http(), [qieTestnet.id]: http() },
});
```

`createConfig` discovers EIP-6963 wallets by default (`multiInjectedProviderDiscovery: true`), so QIE Wallet appears as its own connector with `id === 'me.qiewallet'`. A bare `injected()` targets `window.ethereum`, which may belong to another wallet.

### ethers v6

```ts
import { JsonRpcProvider } from 'ethers';
const provider = new JsonRpcProvider('https://rpc1mainnet.qie.digital/', 1990);
```

### Foundry (`foundry.toml`)

```toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
evm_version = "shanghai"          # QIE has no Cancun opcodes

[rpc_endpoints]
qie_mainnet = "https://rpc1mainnet.qie.digital/"
qie_testnet = "https://rpc1testnet.qie.digital/"
```

Use as `--rpc-url qie_testnet`. Contract verification settings are in `qie-scaffold`.

### Hardhat 3 (`hardhat.config.ts`)

```ts
import { defineConfig, configVariable } from 'hardhat/config';

export default defineConfig({
  solidity: { version: '0.8.28', settings: { evmVersion: 'shanghai', optimizer: { enabled: true, runs: 200 } } },
  networks: {
    qieTestnet: { type: 'http', chainId: 1983, url: 'https://rpc1testnet.qie.digital/', accounts: [configVariable('QIE_DEPLOYER_KEY')] },
    qieMainnet: { type: 'http', chainId: 1990, url: 'https://rpc1mainnet.qie.digital/', accounts: [configVariable('QIE_DEPLOYER_KEY')] },
  },
});
```

Hardhat 2: the same networks without `type: 'http'`, exported as a plain `HardhatUserConfig` (Hardhat 2 has no `defineConfig`), with `accounts: [vars.get('QIE_DEPLOYER_KEY')]` (`import { vars } from 'hardhat/config'`; set it with `npx hardhat vars set QIE_DEPLOYER_KEY`). The official QIE Hardhat guide hardcodes a key in the config. Don't do that.

### Wallet (`wallet_addEthereumChain`)

```json
{ "chainId": "0x7c6", "chainName": "QIE Blockchain Mainnet",
  "nativeCurrency": { "name": "QIE", "symbol": "QIE", "decimals": 18 },
  "rpcUrls": ["https://rpc1mainnet.qie.digital", "https://rpc5mainnet.qie.digital"],
  "blockExplorerUrls": ["https://mainnet.qie.digital"] }
```

```json
{ "chainId": "0x7bf", "chainName": "QIE Testnet",
  "nativeCurrency": { "name": "QIE", "symbol": "QIE", "decimals": 18 },
  "rpcUrls": ["https://rpc1testnet.qie.digital"],
  "blockExplorerUrls": ["https://testnet.qie.digital"] }
```

In QIE Wallet, testnet stays hidden until the user enables the Testnet toggle. See `qie-wallet-integration`.

## Native (Cosmos) layer endpoints (mainnet)

| | Value |
|---|---|
| Cosmos chain ID | `qie_1990-1` (not an EVM chain ID: never put it in an EVM config) |
| CometBFT RPC | `https://rpc.qie.digital`, `https://tendermint.qie.digital` |
| REST (LCD) | `https://api.qie.digital`, `https://validators.qie.digital` |
| gRPC | `grpc.qie.digital:443`: TLS answers, but HTTP/2 isn't negotiated (no ALPN), so standard gRPC clients fail. Use REST or CometBFT RPC. |
| Denom | `aqie` (1 QIE = 10¹⁸ aqie) |

Sources: [qieadmin/chain-registry `chain.json`](https://raw.githubusercontent.com/qieadmin/chain-registry/master/qie/chain.json) and the delegator docs. The endpoints were observed live on 2026-11-16. No native testnet chain ID or endpoints are published. See `qie-concepts` for native accounts and commands.
