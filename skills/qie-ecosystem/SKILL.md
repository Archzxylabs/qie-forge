---
name: qie-ecosystem
description: QIE ecosystem products and infrastructure for builders — QIE Oracle price feeds, QIELend (Compound-style lending), QUSDC, QIEDEX and its Swap API, QIE Bridge and wQIE on Ethereum/BNB, QIE ID / QIE Pass, QIE Wallet MCP, the Blockscout explorer API, indexing options, third-party providers (what is and isn't supported) and integration patterns. Use when a task touches any QIE product, protocol, SDK, API or provider, or asks "does X support QIE?".
license: MIT
---

Compatibility on QIE is **per operation**. "QIE Lending exists" doesn't mean "my bot can borrow through the SDK on testnet". For each product, report what is documented, observed, claimed or unknown; build the smallest safe integration now; and never invent contract addresses, endpoints or SDK methods. Addresses live in `qie-addresses`.

## Products at a glance (status as of 2026-11-16, re-checked 2026-11-17)

| Product | What it is | Programmatic interface | Status |
|---|---|---|---|
| **QIE Oracle** | Price feeds (BTC, ETH, XRP, SOL, QIE, gold, BNB) | AggregatorV3 contracts on mainnet | Documented + observed → [references/oracle.md](references/oracle.md) |
| **QIELend** | Compound v2–style money market (WQIE, WETH, WBNB, QUSDC) | Comptroller + qTokens; SDK on GitHub (not npm); app https://www.qielend.qie.digital/markets | Documented + observed → [references/lending.md](references/lending.md). ⚠️ Its WETH market uses an **unofficial** WETH token. |
| **QUSDC** | USDC-backed receipt token (WUSDC → vault → QUSDC), 6 decimals | Vault `depositAndMint`/`burnAndWithdraw`; SDK on GitHub (not npm) | Documented → [references/qusdc.md](references/qusdc.md) |
| **QIEDEX** | QIE's DEX (swap, liquidity, stake) at https://www.dex.qie.digital/ | **QIEDEX Swap API v0.2.0** `https://api.dex.qie.digital` ([OpenAPI](https://api.dex.qie.digital/openapi.json)) | Documented (official developers page) → [references/dex-bridge.md](references/dex-bridge.md) |
| **QIE Bridge** | Bridge QIE ↔ Ethereum / BNB Chain at https://bridge.qie.digital | Web app; owner-operated contracts (verified on Blockscout); wQIE token contracts on Ethereum/BNB are listed | Documented (QIEDEX bridge guides) + app config → [references/dex-bridge.md](references/dex-bridge.md) |
| **QIE Wallet** | Non-custodial browser wallet | EIP-1193 / EIP-6963 (`me.qiewallet`) | Documented → `qie-wallet-integration` |
| **QIE Wallet MCP** | Read-only MCP server: balances, `.qie` names, token lists, tx status | `https://mcp.qie.digital/mcp` (6 tools) | Documented (developers page) + observed → [references/identity.md](references/identity.md) |
| **QIE ID** | `.qie` names → addresses on QIE and other chains; sign-in/verify pages | `resolveMetadata(name, key)` and `resolveCurrency(name, "qie")` on two metadata contracts; MetaMask Snap `@qie-blockchain/qie-id-snap` | Name resolution documented + observed; sign-in/verify APIs undocumented → [references/identity.md](references/identity.md) |
| **QIE Pass** | Verification brand, now part of QIE ID | No public SDK or credential schema found | Claimed |
| **Safe{Wallet}** | Multisig app run by QIE (Safe v1.4.1 contracts at QIE's own addresses) | https://safe.qie.digital, testnet https://safe-testnet.qie.digital | Documented (developers page) + observed → `qie-addresses` → Safe |
| **Explorer** | Blockscout v7.0.2 (mainnet + testnet) | Etherscan-style `/api` and `/api/v2` | Observed → below |
| **Native staking & governance** | Validators, delegation, proposals | `qied` CLI, Cosmos REST/RPC | Documented → `qie-concepts` |
| **QIE Doodle** | Consumer app (https://qiedoodle.com/) | — | Product listing only |

Official hubs: [developers page](https://www.qie.digital/developers) · [docs](https://docs.qie.digital/llms.txt) · GitHub [qieadmin](https://github.com/qieadmin), [qie-blockchain](https://github.com/qie-blockchain), [QIBlockchain](https://github.com/QIBlockchain) · hackathon https://hackathon.qie.digital/.

## Rules of thumb

- **GitHub ≠ npm.** `qie-lend-sdk` and `qusdc-sdk` are not on npm, so `npm install qie-lend-sdk` fails. Pin a commit: `npm install github:qieadmin/<repo>#<commit>`. The only official npm package found is `@qie-blockchain/qie-id-snap`.
- **Web app ≠ contract API.** A working website doesn't give you router or bridge contract addresses. Use the documented API (QIEDEX Swap API) or say the contract interface is unknown.
- **No canonical helpers.** Multicall3, Permit2, Safe and ERC-4337 are not at their canonical addresses (`qie-concepts`). Use plain approvals. Batch reads only through the undocumented mainnet Multicall3-compatible contract (`qie-addresses` → Multicall), or make individual calls. For multisigs use QIE's own Safe{Wallet}.
- **Mainnet only.** The Oracle, QIELend, QUSDC, QIEDEX, the Bridge and QIE ID have no official testnet deployments (Safe and the explorer do have testnet). Test against mocks or a mainnet fork (`forge test --fork-url https://rpc1mainnet.qie.digital/`) and keep live writes small.
- **Units.** Read `decimals()` every time: QUSDC 6, WQIE/WETH/WBNB 18, qTokens 8, oracle answers 8.

## Explorer API (Blockscout)

| | Mainnet | Testnet |
|---|---|---|
| UI | https://mainnet.qie.digital | https://testnet.qie.digital |
| Etherscan-style API | `https://mainnet.qie.digital/api?module=…&action=…` | `https://testnet.qie.digital/api?…` |
| REST v2 | `https://mainnet.qie.digital/api/v2/…` | `https://testnet.qie.digital/api/v2/…` |

Useful calls: `?module=contract&action=getabi&address=<addr>`, `?module=contract&action=getsourcecode&address=<addr>`, `/api/v2/smart-contracts/<addr>`, `/api/v2/stats`, `/api/v2/addresses/<addr>/transactions`. No API key is needed. Rate limits aren't published, so cache responses. Contract verification is covered in `qie-scaffold`.

The mainnet explorer had indexed only 98% of blocks on 2026-11-17 (`/api/v2/main-page/indexing-status`), so its history can have gaps. Cross-check anything important with `eth_getLogs` or direct RPC reads.

## Indexing and data

- **No third-party hosted indexer** was found supporting QIE: The Graph, Goldsky, Envio, SubQuery and Covalent/GoldRush all had no QIE listing (checked 2026-11-16). Moralis and Ormi were inconclusive. Don't promise a subgraph for your own contracts.
- QIEDEX runs its **own** subgraph for DEX data (`https://graphql.qie.digital/subgraphs/name/qie-dex/dex`, a Uniswap-V2-like schema; app config, observed working). The QIEDEX API has DEX Screener/CoinGecko adapters. Both cover DEX data only.
- For your contracts: `eth_getLogs` in ≤ 10,000-block windows with address/topic filters, a persisted cursor and idempotent processing; or the Blockscout API for per-address history.
- No public WebSocket on the official RPC hosts. Poll, or use NOWNodes (API key, advertises WSS).
- Analytics listings: DefiLlama (chain "QIE", id 1990) and CoinGecko (platform `qie-blockchain`).

## Third-party support (checked 2026-11-16)

| Category | Supports QIE | Not found / not supported |
|---|---|---|
| RPC | NOWNodes (API key) | Ankr, dRPC, QuickNode, Alchemy, GetBlock |
| Oracles | QIE Oracle only | Chainlink, Pyth, API3 (RedStone, DIA inconclusive) |
| Bridges / interop | QIE Bridge (web) | LayerZero, Wormhole, Axelar, Hyperlane (IBC to Osmosis exists but its client is expired) |
| Wallets | QIE Wallet; MetaMask and others via custom network | Trust Wallet, Rabby (no built-in listing); Keplr has no QIE chain entry |
| Multisig / AA | QIE's own Safe{Wallet} instance (https://safe.qie.digital) | app.safe.global's chain list, Pimlico, ZeroDev, Etherspot, Biconomy/Gelato inconclusive |
| On-ramps (official buy page) | Alchemy Pay, CoinsNow, Guardarian, Changelly, Exolix, SwapSpace, NOWPayments (network not stated) | Transak, Ramp |
| Chain registries | chainlist.org (1990) | ethereum-lists: 1983 = "Krown Mainnet", 1990 missing |

"Not found" means it wasn't in that provider's own docs or registry on that date. It is not proof of absence. Re-check before telling a user a provider definitely can't be used.

## When something isn't covered

Read the official docs index (`https://docs.qie.digital/llms.txt`, pages as `.md`) and the developers page. Record the exact URL. Give the user:
1. the source-grounded facts
2. the smallest read-only or mock integration you can build now
3. what remains unknown, and what would unblock it

Never present a guessed address or endpoint as real.
