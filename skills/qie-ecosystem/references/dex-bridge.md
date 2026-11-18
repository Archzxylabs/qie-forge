# QIEDEX and QIE Bridge

Addresses are in `qie-addresses`. Everything here is QIE mainnet; there are no official testnet deployments.

## QIEDEX

QIEDEX is a Uniswap V2 fork: constant-product pools with 0.30% to LPs. There is no protocol fee while the factory's `feeTo` is unset; its `feeToSetter` can turn one on. App: https://www.dex.qie.digital/ (swap, liquidity, and 365-day QIE staking with QIEdex rewards). Docs: https://qiedex.qie.digital/ (`.md` pages, e.g. [contracts](https://qiedex.qie.digital/qiedex-contracts.md), [tokenomics](https://qiedex.qie.digital/tokenomics.md)).

### Swap API (recommended for swaps)

Official, read-only, `https://api.dex.qie.digital` (v0.2.0, [OpenAPI](https://api.dex.qie.digital/openapi.json)). It never signs: `/swap` returns an **unsigned** router transaction plus an optional approval transaction, which the user's wallet signs. Rate limits: 120 requests/min per IP, and 60/min for `/quote` and `/swap`.

```bash
# Quote 10 native QIE -> QUSDC (human units). Use amountIn for raw integer units.
curl 'https://api.dex.qie.digital/quote?tokenIn=QIE&tokenOut=0x3F43DA82eC9A4f5285F10FaF1F26EcA7319E5DA5&amountInDecimal=10'

# Build the unsigned tx (+ approval) for a recipient, with an on-chain simulation
curl 'https://api.dex.qie.digital/swap?tokenIn=QIE&tokenOut=0x3F43DA82eC9A4f5285F10FaF1F26EcA7319E5DA5&amountInDecimal=10&recipient=<ADDR>&from=<ADDR>&slippageBps=50&simulate=true'
```

| Parameter | Meaning |
|---|---|
| `tokenIn` / `tokenOut` | Token address, or `QIE` / `0xEeee…EEeE` for native QIE |
| Amount | Exactly one of `amountIn`, `amountOut` (raw integers) or `amountInDecimal`, `amountOutDecimal` (human units) |
| `slippageBps` | Default 50 (0.5%), max 5000 |
| `deadline` | Unix seconds, or seconds from now if < 1e9 (default 1200) |
| `approve` | `exact` (default) or `max` |
| `allowUnverifiedHops` | Default `false`: intermediate hops only through officially verified tokens |
| `acceptHighImpact` | Required above 10% price impact. Set it only after the user explicitly confirms. |
| `feeOnTransfer` | Use the `…SupportingFeeOnTransferTokens` router methods (exact input only) |

`from`, `deadline`, `simulate`, `approve` and `acceptHighImpact` apply to `/swap` only. The returned `gas` (only with `from` + `simulate=true`) is an estimate: add a modest margin (~20%), not a large pad, because QIE bills at least 50% of the gas limit.

Other endpoints:
- `/pairs`, `/pairs/{address}`, `/tokens`, `/tokens/{address}`, `/tokens/verified` (official token list), `/tokens/status/{address}` (verified / bondfire-launch / unverified)
- `/trades`, `/candles`, `/summary`
- CoinGecko, CMC and DEX Screener adapters
- `/health` (indexer lag)

**Rules:**
- Show the quote (amount out, minimum out, price impact, route) and get approval before the user signs.
- Re-quote if the user waits.
- Never set `acceptHighImpact` or `approve=max` on your own.
- Check `/tokens/status/{address}` and warn on unverified tokens.

### Direct router integration

Standard UniswapV2Router02 calls on router `0x08cd2e72e156D8563B4351eb4065C262A9f553Ef`. Pair addresses can be computed with the init code hash in `qie-addresses`, or read with `factory.getPair(a, b)`. Use WQIE for native routes. Router functions are named `…ETH…` for historical reasons and mean native QIE here. Because QIE bills ≥ 50% of the gas limit, use estimate × ~1.2 and don't pad gas further.

### Data

- Subgraph (app config): `https://graphql.qie.digital/subgraphs/name/qie-dex/dex`. Its schema is only Uniswap-V2-like: pairs, tokens, swaps and hour/day data, but the factory is `dexFactory`, daily totals are `dexDayData`, and there is no `bundle`. Introspect before porting Uniswap queries. Example: `{ pairs(first: 5, orderBy: reserveUSD, orderDirection: desc) { id token0 { symbol } token1 { symbol } reserveUSD } }`. Observed working 2026-11-16. It's undocumented, so prefer the Swap API for production.
- Liquidity is thin: the largest pool (WQIE/QUSDC) held ~8.8k USD (observed). Always simulate and check price impact.

## QIE Bridge

Web app: https://bridge.qie.digital. Routes: Ethereum ↔ QIE (ETH ⇄ WETH-on-QIE, QIE ⇄ wQIE-on-Ethereum), BNB Chain ↔ QIE (BNB ⇄ WBNB-on-QIE, QIE ⇄ wQIE-on-BNB), and USDC/USDT ⇄ wUSDC.eth/wUSDT.eth. The routes and their lock/mint/burn/release flow are documented in the QIEDEX guides [How to Bridge Native Assets](https://qiedex.qie.digital/how-to-bridge-native-assets.md) and [How to Bridge Stablecoins](https://qiedex.qie.digital/how-to-bridge-stablecoins.md).

- Contracts and per-chain token addresses: `qie-addresses` → QIE Bridge, wQIE on other chains.
- Backend status APIs (app config; the app picks the backend by route):
  - ETH route: `https://eth.qie-bb.qie.digital/api` (`/limits`, `/status/…`, `/history/{address}`)
  - BNB route: `https://bsc.qie-bb.qie.digital/api` (`/status/{originTx}`, `/history/{address}`; there is no `/limits`)
  - Stablecoins: `https://stablecoin.bridge.qie.digital/api`. Its TLS certificate expired on 2026-10-14 (still expired 2026-11-17), so browsers and other TLS-verifying clients reject it. Don't disable certificate checks to get around it. Treat the stablecoin route as possibly unavailable and confirm in the web app first.
- Fees and limits: the ETH bridge charges 10 bps on-chain, and its `/limits` reported 10,000 tokens per tx and per day in each direction. The BNB bridge charges 0 bps and has no on-chain per-tx or daily limit (observed 2026-11-17).
- Trust model: every route is owner-operated. In the verified contracts (`BridgeVault` for ETH, `QIEBridge` for BNB), only the owner can mint or release on the destination chain, and the owner can also emergency-withdraw funds. Treat the bridges as a trusted-operator system, not trustless. (The QUSDC reserves API says the same about QUSDC's separate USDC↔WUSDC bridges.)
- For users: recommend the web app. For code: show exact contracts and amounts, test with a small amount, and never automate bridging without explicit approval. A "wQIE" token on another chain is only official at the addresses on https://www.qie.digital/wqie.
