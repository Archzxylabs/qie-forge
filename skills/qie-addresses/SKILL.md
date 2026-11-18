---
name: qie-addresses
description: Contract addresses on QIE mainnet (1990) — the official verified token list (WQIE, QUSDC, WETH, WBNB, wUSDC.eth, wUSDT.eth), known lookalike tokens, QIEDEX (Uniswap V2 fork) factory/router/init-code hash, QIE Oracle feeds, QIELend markets, QUSDC vault and bridges, QIE Bridge contracts, QIE ID resolvers, a working Multicall3-compatible contract, wQIE on Ethereum/BNB Chain, QIE's own Safe{Wallet} deployment, and which canonical contracts (Multicall3, CreateX, Permit2, Safe, ERC-4337) are NOT at their canonical addresses. Fetch whenever code or a transaction needs a QIE address. Never hallucinate an address — a wrong address loses funds.
license: MIT
---

**CRITICAL**

⚠️ Use only addresses listed here, or ones the user supplies **and** you verify. Never guess, autocomplete or "recall" a QIE address. If an address isn't here, say it is unknown and ask for an official source.

⚠️ Everything below is **QIE mainnet (1990)** unless the section names another chain. Apart from Safe (see Safe below), there are **no official testnet deployments** of these products. None of the other addresses has code on testnet (1983), observed 2026-11-16. If the user means testnet, they must deploy their own contracts.

⚠️ **The same address can be a different token on another chain.** `0xAC8d…6728` is WETH on QIE but wQIE on Ethereum. `0x775A…B867` is wQIE on BNB Chain, an old "WETH" on QIE, and an old Ethereum "WQIE" that QIE's WQIE page says is official on BNB Chain only. Always pair an address with its chain.

## Verify before use

```bash
R=https://rpc1mainnet.qie.digital/
cast chain-id --rpc-url $R                              # 1990
cast code <ADDRESS> --rpc-url $R                        # contract must NOT be 0x
cast call <ADDRESS> "symbol()(string)" --rpc-url $R     # tokens: symbol/decimals match the role
cast call <ADDRESS> "decimals()(uint8)" --rpc-url $R
```

Code and names prove nothing about identity: lookalike tokens below use the same names. Before any write:
1. The address comes from an official source in this file or a newer official page. Record the URL.
2. The chain is correct and code is present.
3. The ABI matches the role (e.g. a qToken's `underlying()`, a pair's `factory()`).
4. No conflicting official address exists.
5. The user approves the specific write.

Status labels: **Documented** = official QIE docs/page/repo or official API; **App config** = found in an official QIE web app's shipped config (undocumented, can change on redeploy); **Observed** = read-only on-chain check on 2026-11-16, re-checked 2026-11-17.

## Official tokens on QIE

Official verified list: [qiedex.qie.digital token page](https://qiedex.qie.digital/official-token-contract-addresses-qie-network.md), also served as JSON at `https://api.dex.qie.digital/tokens/verified` (Uniswap token-list format). All six match the list's symbol and decimals on-chain. Names in parentheses are the list's: on-chain `name()` is "Wrapped ETH" for WETH, "WBNB" for WBNB, and the symbol itself for wUSDC.eth and wUSDT.eth.

| Token | Address | Decimals | Notes |
|---|---|---|---|
| WQIE (Wrapped QIE) | `0x0087904D95BEe9E5F24dc8852804b547981A9139` | 18 | WETH9-style `deposit()`/`withdraw()`; the DEX router's `WETH()` |
| QUSDC | `0x3F43DA82eC9A4f5285F10FaF1F26EcA7319E5DA5` | **6** | USDC-backed receipt token (see QUSDC below) |
| WETH ("Wrapped ETH on QIE Network") | `0xAC8d365ECc9074a679f75B3E6b2bbF303e466728` | 18 | Minted by the ETH↔QIE bridge (`owner()` = bridge) |
| WBNB ("Wrapped BNB on QIE Network") | `0x9e02ba5dE6d26D5Ca5688Ed3999C6bcF4F3e966E` | 18 | Bridged from BNB Chain |
| wUSDC.eth (Wrapped USDC from Ethereum) | `0x0e93FAcc0a2cfD418403f3AD3EEfB5C8b2dfAec7` | 6 | Stablecoin bridge. Not the same token as WUSDC (QUSDC collateral). |
| wUSDT.eth (Wrapped USDT from Ethereum) | `0xCB7bBC584475dce754a918ccD92FF6E0211f3CEE` | 6 | Stablecoin bridge |
| Native QIE (placeholder in APIs) | `0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE` | 18 | Not a contract: the convention for "native QIE" in the QIEDEX API |

Other documented tokens: **QIEdex** governance/reward token `0xA795c4D885522d5e37956265837636b023445871` (18 decimals, [QIEDEX tokenomics](https://qiedex.qie.digital/tokenomics.md)).

### Unofficial, legacy and lookalike tokens — do NOT treat as official

| Address | Reports itself as | Why it's not official |
|---|---|---|
| `0x95322ccB3fb8dDefD210805EE18662762a0bc4A2` | WETH, 18 | Legacy: the token of an old QIE-side ETH bridge, `0x49231a6Cbff390Aa68C425E397A59e7CAb0D6B61` (Blockscout "QIEBridgeETH"; it is that bridge's `wrappedToken()`, and the bridge is its `owner()`). Not on the verified list; QIE Wallet MCP flags it as unofficial. **QIELend's qWETH market uses this token.** |
| `0x775AcF0Fae2B97789eA58e775789925ADE06b867` (on QIE) | WETH, 18 | Old token; not on the verified list |
| `0x883E3098eF144f91818037936a722b8bd448074b` | Wrapped QIE / WQIE, 18 | Lookalike; QIE Wallet MCP flags it as unofficial |

Don't use `https://dex-logo.qie.digital/api/tokenlist` as a source of truth. It accepts arbitrary submissions and contained injected test entries and Ethereum addresses tagged as chain 1990.

## QIEDEX (Uniswap V2 fork)

Documented in [QIEDEX contracts](https://qiedex.qie.digital/qiedex-contracts.md) and in the QIEDEX API's own description.

| Contract | Address | Observed |
|---|---|---|
| Factory (UniswapV2Factory-style) | `0x8E23128a5511223bE6c0d64106e2D4508C08398C` | 36 pairs (2026-11-17); `feeTo` = 0 (no protocol fee) |
| Router (UniswapV2Router02-style) | `0x08cd2e72e156D8563B4351eb4065C262A9f553Ef` | `factory()` matches; `WETH()` = WQIE |
| Pair init code hash | `0x3fcd605fb642f17f9e8061bcb2536c56a5d6e31b82391bf4818a9d4a785aa94a` | Read from `factory.INIT_CODE_HASH()`; CREATE2 reproduces real pair addresses |
| Example pair WQIE/QUSDC | `0x73a3cCF7da7e473ed2e9994aE764f0E30f4e4DFe` | Largest pool by liquidity |
| QIEDEX staking (365-day lock, rewards in QIEdex) | `0xA24a213e589CF96BCD4Ab45320C898eE9B473d34` | App config (current QIEDEX app); `rewardToken()` = QIEdex; 365-day lock per the [QIEDEX docs](https://qiedex.qie.digital/features/stake.md) |
| Old v2 router / factory | `0x2601a070A12749BC2ee095F17D9fbe904505C2dF` / `0xf297CC2e3A711fEeadf54a59a8162b71189E03d7` | **Do not use** (legacy, 1 pair) |

- Swap fee is 0.30% to LPs (`getAmountOut` uses 997/1000).
- For swaps prefer the official **QIEDEX Swap API**, which returns unsigned router transactions. See `qie-ecosystem`.

## QIE Oracle price feeds

AggregatorV3 interface, 8 decimals. Documented in the [contract table](https://docs.qie.digital/qie-oracle/deployed-contracts/table-of-assets-contract-mapping.md). `description()` and update age were observed 2026-11-16.

| Asset | Feed | `description()` | Update age (observed) |
|---|---|---|---|
| BTC | `0x9E596d809a20A272c788726f592c0d1629755440` | BTC / USDT | ~3 min |
| ETH | `0x4bb7012Fbc79fE4Ae9B664228977b442b385500d` | ETH / USDT | ~3 min |
| XRP | `0x804582B1f8Fea73919e7c737115009f668f97528` | XRP / USDT | ~3 min |
| SOL | `0xe86999c8e6C8eeF71bebd35286bCa674E0AD7b21` | SOL / USDT | ~3 min |
| QIE | `0x3Bc617cF3A4Bb77003e4c556B87b13D556903D17` | QIE / USDT | **~20 h** |
| XAUt (gold) | `0x9aD0199a67588ee293187d26bA1BE61cb07A214c` | Gold / USD | ~9 min |
| BNB | `0x775A56117Fdb8b31877E75Ceeb68C96765b031e6` | BNB / USDT | ~3 min |

Quotes are in USDT, not USD. Always enforce a max age and `answer > 0`. When observed, the stale QIE feed read $0.1550 while QIEDEX traded QIE at ~$0.1487.

## QIELend (Compound v2 fork)

Documented in the official SDK ([qieadmin/qie-lend-sdk@21d2ef2 `config.js`](https://raw.githubusercontent.com/qieadmin/qie-lend-sdk/21d2ef2d5c4e9ac82f7e5d72e628341bd0b15262/config.js)) and the official app (https://www.qielend.qie.digital/markets). Observed: `getAllMarkets()` returns exactly these four qTokens, each `underlying()` matches, and the qTokens report 8 decimals.

| Role | Address | Collateral factor |
|---|---|---|
| Comptroller (Unitroller proxy) | `0x69a31E3D361C69B37463aa67Ef93067dC760fBD4` | close factor 50%, liquidation incentive 8% |
| Comptroller implementation | `0x8E66Ab11E2990d8Cc9C5609Dc42C137Bb0fb51B6` | — |
| Price oracle | `0x02D1D90247C030Cb69c6Db90e0d891d710c215E0` | QUSDC fixed at $1; WQIE priced from the QIE/USDT feed (app config) |
| qWQIE | `0x25A9bD97C90161A622a75A4Fd87ea0e7507324CA` → WQIE | 50% |
| qWETH | `0x0b8F865dd5E822323F3B45554bdbC8De3715dA60` → `0x9532…` (**unofficial WETH**) | 60% |
| qWBNB | `0xD072cDDc4e8A15EE532F7fB7AC583a3715b5261f` → WBNB | 60% |
| qQUSDC | `0x3EcD3b3fa22Cc251301BA78F4Ba014f78B6FE542` → QUSDC | 80% |
| Interest-rate models | QUSDC `0x03629cE2F8EED1866B76D1aa831bFeA96105fA7A`, WQIE `0x8A21Fb7B5878Ee5a1e2536aEB84a15B9DBe7C2b5` (app config); WETH `0xBbBf298B0fa60f1a8246f1eBc2f84Fde8f4fa457`, WBNB `0x0b01f415ff47c442433C5DA7765bcA878b338358` (observed via `interestRateModel()`) | 8,520,000 blocks/year |

⚠️ Bridged WETH (`0xAC8d…`) is **not** accepted by qWETH. Users must hold the unofficial `0x9532…` WETH to use that market. Tell them before they bridge.

## QUSDC system

Documented by the official reserves API https://reserves.qie.digital/api/reserves. Observed: `vault.invariantHolds()` = true, and the vault's WUSDC balance equals QUSDC total supply.

| Role | Chain | Address |
|---|---|---|
| QUSDC token | QIE | `0x3F43DA82eC9A4f5285F10FaF1F26EcA7319E5DA5` |
| WUSDC (QUSDC collateral) | QIE | `0xA6d5BadE588699aD37dc29110aca0852575e26cb` (6 decimals) |
| Vault (`depositAndMint` / `burnAndWithdraw`) | QIE | `0xdC20F1fee9e03184ddabcCe96F01E3c570E43D45` |
| WUSDC bridge (QIE side) | QIE | `0x774C7f8Dca344fd1c25aFfC4b968d4A52365F5aE` |
| USDC lock bridge | Ethereum | `0xA2c2CC61f1b6B7c16bEa554c435762Bc523eEB28` (locks canonical USDC `0xA0b8…eB48`) |
| QUSDC admin | QIE | `0xe1acec6312eb701D4A14De700CCec8DeE17a8D28` |
| Bridge operator | both | `0x82e8a143cB07c0daAAb4d9092EAd623B59Dd3Af2` (EOA; `owner()` of both USDC bridges) |

Trust model, in the reserves API's own words: an admin can grant or revoke the vault's minting role, and the bridges are a **trusted-operator system, not trustless**. The QUSDC docs elsewhere say no admin key can mint. When it matters, surface both statements.

## QIE Bridge

App config from the official bridge app (https://bridge.qie.digital). Observed live.

| Bridge | Chain(s) | Address | Notes |
|---|---|---|---|
| ETH ↔ QIE | Ethereum **and** QIE (same address) | `0x81281e05F7Ad0e699CcF26b0aA7A1D17EF421CA7` | `wrappedToken()` = `0xAC8d…` on both chains (WETH on QIE, wQIE on Ethereum). Fee 10 bps (app config). The limits API `https://eth.qie-bb.qie.digital/api/limits` reported 10,000 tokens per tx and per day in each direction. |
| BNB Chain ↔ QIE | QIE / BNB Chain | `0x1e41a39caAa51F8644B487D9ef4AFECD4cE2e897` / `0x5A9808d92a3EC9Cc20CF3f11243Ba64ADCd281Bc` | Wraps WBNB on QIE / wQIE on BNB Chain. `0x5A98…` also has (older) contracts on QIE and Ethereum; on QIE it owns the old `0x775A…` WETH. On QIE use `0x1e41…`. |
| Stablecoins (USDC/USDT ↔ wUSDC.eth/wUSDT.eth) | Ethereum and QIE | `0x06d6eBbe926b2E6822F4415a3692160D34daacc4` | |

Use the web app for user transfers. Programmatic bridging means calling operator-run contracts. Get explicit approval and test small amounts first.

## wQIE on other chains

Official [WQIE page](https://www.qie.digital/wqie).

| Chain | wQIE token | Official pools |
|---|---|---|
| Ethereum | `0xAC8d365ECc9074a679f75B3E6b2bbF303e466728` | Uniswap V2 WQIE/WETH `0x1Fd45a7665A476dF7a974269151Ac5d0ba2d210F`; Uniswap V4 WQIE/USDT pool id `0xe83fa9022f4959e7c00af4a732264128b6e106271fba6d2b9a28e51ad8932998` |
| BNB Chain | `0x775AcF0Fae2B97789eA58e775789925ADE06b867` | PancakeSwap V2 WQIE/USDT `0xD66879d4B65E675f01ff2cE0a072a72F23305458`; WQIE/WBNB `0xdFb12BC53bA3118061dd9650f8BD0B7B329E9836` |

The official page warns that any pool using `0x775A…` **on Ethereum**, or any pool not listed, is not run by QIE. That old Ethereum contract still calls itself "WQIE" (observed).

## QIE ID (`.qie` names)

Documented in the official [qie-blockchain/qie-id-snap](https://github.com/qie-blockchain/qie-id-snap) repo (`docs/implementation-plan.md`) and the id.qie.digital app config.

| Contract | Address |
|---|---|
| Metadata (free names) | `0x8777d01d509D0eA71FB38F88F79867da558d5018` |
| Metadata (premium "Hovr" names) | `0xCFBcBCA93c607590b211c81C7DBcdbd7eD6CC6ED` |
| Default domain resolver (reverse) | `0x76ec8ed377cC0d36D1B48027ac7892Ec6799171E` |
| Root registry | `0x26cCB3fABd6db18834987134d715Ba2346CE7223` (app config) |
| Checkout | `0x15a98EC8E602EA40B186A51755EAb362D0AE7b51` (app config) |

Resolution details are in `qie-ecosystem` → identity.

## Multicall

The canonical Multicall3 (`0xcA11…CA11`) is **not** deployed on QIE. Observed alternatives:

| Address | What works | Source |
|---|---|---|
| `0x13305ab992c3BA30a3f2c4B92727eb4cA64063e8` | Full Multicall3 API (`aggregate3`, `getChainId()` = 1990). Bytecode differs from canonical. | App config (current QIEDEX app, as `contracts.multicall3`) |
| `0x7E055DfaF148023A7B273e1F71014Caf34598b3D` | Only Multicall v1 `aggregate` / `getEthBalance`; `aggregate3` reverts | App config (current bridge and lend apps) |

Both are mainnet only (no code on testnet). For read batching in viem, set `contracts: { multicall3: { address: '0x13305ab992c3BA30a3f2c4B92727eb4cA64063e8' } }` on the QIE mainnet chain. It is undocumented, so cross-check critical values with direct calls. Never route value-bearing writes through it.

## Native QIE as ERC-20 (precompile)

`0xD4949664cD82660AaE99bEdc034a0deA8A0bd517`: the "automatic ERC-20 conversion precompile" ([chain-registry assetlist](https://raw.githubusercontent.com/qieadmin/chain-registry/master/qie/assetlist.json)). It has no bytecode. `totalSupply`/`balanceOf` mirror native QIE, but `name`/`symbol`/`decimals` revert. It is not WQIE, so don't build on it without an official ABI.

## Safe{Wallet} (QIE's own deployment)

The official [developers page](https://www.qie.digital/developers) says "The official Safe multisig app is live on QIE mainnet". app.safe.global doesn't list QIE. QIE runs its own Safe{Wallet}, with Safe v1.4.1 contracts at non-canonical addresses.

| | Mainnet (1990) | Testnet (1983) |
|---|---|---|
| App | https://safe.qie.digital | https://safe-testnet.qie.digital |
| Safe singleton (v1.4.1) | `0x9dADa07e862019c0F9e52B1f857AdAB5d58Fa1CD` | `0x99c04fd0963F30D86d98bB1fA227D3145AB78F38` |

Source: the app's gateway, `https://safe.qie.digital/cgw/v1/chains/<chainId>/about/master-copies`. `VERSION()` returns `1.4.1` on both networks (observed 2026-11-17). Create and manage multisigs in the app. For SDK work, take the other Safe contracts (proxy factory, MultiSend, fallback handler) from QIE's app config, never from Safe's canonical deployment list.

## Canonical contracts that are NOT on QIE

Observed absent on mainnet **and** testnet. Never use these addresses on QIE:

| Contract | Canonical address |
|---|---|
| Multicall3 | `0xcA11bde05977b3631167028862bE2a173976CA11` |
| CreateX | `0xba5Ed099633D3B313e4D5F7bdc1305d3c28ba5Ed` |
| Create2Deployer | `0x13b0D85CcB8bf860b6b79AF3029fCA081AE9beF2` |
| Deterministic deployment proxy (Foundry CREATE2) | `0x4e59b44847b379578588920cA78FbF26c0B4956C` |
| ERC-2470 / Safe singleton factories | `0xce0042B868300000d44A59004Da54A005ffdcf9f` / `0x914d7Fec6aaC8cd542e72Bca78B30650d45643d7` |
| Permit2 | `0x000000000022D473030F116dDEE9F6B43aC78BA3` |
| ERC-4337 EntryPoint v0.6 / v0.7 / v0.8 / v0.9 | `0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789` / `0x0000000071727De22E5E9d8BAf0edAc6f37da032` / `0x4337084D9E255Ff0702461CF8895CE9E3b5Ff108` / `0x433709009B8330FDa32311DF1C2AFA402eD8D009` |
| Safe v1.3.0 / v1.4.1 singletons and factories (canonical) | e.g. `0x41675C099F32341bf84BFc5382aF534df5C7461a`, `0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67` |

For Safe, use QIE's own deployment above.

## Unknown — never guess

- Any **testnet** address for QIEDEX, QIELend, QUSDC, Oracle, Bridge or QIE ID: none is published.
- Concentrated-liquidity (V3-style) pools on QIE, NFT marketplace and launchpad contracts (the Bondfire launchpad is "Coming soon" on the qie.digital homepage, 2026-11-17).
- QIE Pass credential or verification contracts and APIs.
- Official QIELend documentation beyond the SDK and app.

If a user asks for one of these, say it is unknown and point them to the official channels (https://www.qie.digital/developers, https://docs.qie.digital/llms.txt).
