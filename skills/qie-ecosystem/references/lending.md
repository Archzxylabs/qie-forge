# QIE Lending

A Compound v2–style money market on QIE mainnet. **Documented** by the official SDK [qieadmin/qie-lend-sdk @ `21d2ef2`](https://github.com/qieadmin/qie-lend-sdk/tree/21d2ef2d5c4e9ac82f7e5d72e628341bd0b15262). **Observed** on-chain 2026-11-16 with read-only calls. Addresses are in `qie-addresses`.

## Protocol parameters (observed 2026-11-16, mainnet)

| | Value |
|---|---|
| Comptroller | `0x69a31E3D361C69B37463aa67Ef93067dC760fBD4` (Unitroller proxy → implementation `0x8E66Ab11E2990d8Cc9C5609Dc42C137Bb0fb51B6`) |
| Markets (`getAllMarkets()`) | qWBNB, qWETH, qWQIE, qQUSDC |
| Close factor | 50% |
| Liquidation incentive | 8% (`1.08e18`) |
| Price oracle (`oracle()`) | `0x02D1D90247C030Cb69c6Db90e0d891d710c215E0` (Compound `getUnderlyingPrice(qToken)`, scaled to `1e(36 − underlyingDecimals)`) |
| Interest model `blocksPerYear` | 8,520,000 (rates are **per block**) |

| Market | Underlying | Collateral factor | Underlying decimals | qToken decimals |
|---|---|---|---|---|
| qWQIE | WQIE `0x0087…9139` (official) | 50% | 18 | 8 |
| qWETH | WETH `0x9532…c4A2` (**not** the official WETH `0xAC8d…6728`) | 60% | 18 | 8 |
| qWBNB | WBNB `0x9e02…966E` (official) | 60% | 18 | 8 |
| qQUSDC | QUSDC `0x3F43…5DA5` (official) | 80% | 6 | 8 |

- The lending oracle priced QUSDC at exactly 1.00 USD (`1e30` for 6 decimals): a fixed peg in the protocol, not a market price.
- WQIE, WETH and WBNB are priced from the QIE Oracle QIE/USDT, ETH/USDT and BNB/USDT feeds: `getUnderlyingPrice` equals the feed answer × 1e10 (observed 2026-11-17). The QIE/USDT feed has gone ~20 h without an update, so liquidation and borrow limits can lag the market.
- **WETH caveat:** ETH bridged through the official bridge arrives as `0xAC8d…` WETH, which the qWETH market does **not** accept. Tell users before they bridge to supply.
- Interest-rate models: QUSDC `0x03629cE2F8EED1866B76D1aa831bFeA96105fA7A`, WQIE `0x8A21Fb7B5878Ee5a1e2536aEB84a15B9DBe7C2b5`, WETH `0xBbBf298B0fa60f1a8246f1eBc2f84Fde8f4fa457`, WBNB `0x0b01f415ff47c442433C5DA7765bcA878b338358`.
- Parameters can change through the admin. Re-read them; don't hardcode.

## Read-only dashboard (viem, no SDK, no signer)

```ts
import { createPublicClient, http, parseAbi, formatUnits } from 'viem';
import { qieMainnet } from './chains'; // from qie-networks

const client = createPublicClient({ chain: qieMainnet, transport: http() });
const COMPTROLLER = '0x69a31E3D361C69B37463aa67Ef93067dC760fBD4';

const comptrollerAbi = parseAbi([
  'function getAllMarkets() view returns (address[])',
  'function markets(address) view returns (bool isListed, uint256 collateralFactorMantissa, bool isComped)',
  'function getAccountLiquidity(address) view returns (uint256 errorCode, uint256 liquidity, uint256 shortfall)', // viem rejects `error` as a name
  'function oracle() view returns (address)',
]);
const qTokenAbi = parseAbi([
  'function symbol() view returns (string)',
  'function underlying() view returns (address)',
  'function getAccountSnapshot(address) view returns (uint256 errorCode, uint256 qTokenBalance, uint256 borrowBalance, uint256 exchangeRateMantissa)',
  'function supplyRatePerBlock() view returns (uint256)',
  'function borrowRatePerBlock() view returns (uint256)',
]);
const erc20Abi = parseAbi(['function decimals() view returns (uint8)', 'function symbol() view returns (string)']);

export async function portfolio(user: `0x${string}`) {
  const markets = await client.readContract({ address: COMPTROLLER, abi: comptrollerAbi, functionName: 'getAllMarkets' });
  const rows = [];
  for (const q of markets) {                       // individual reads: no canonical Multicall3 on QIE
    const [err, qBal, borrow, rate] = await client.readContract({ address: q, abi: qTokenAbi, functionName: 'getAccountSnapshot', args: [user] });
    if (err !== 0n) throw new Error(`getAccountSnapshot error ${err} for ${q}`);
    const underlying = await client.readContract({ address: q, abi: qTokenAbi, functionName: 'underlying' });
    const decimals = await client.readContract({ address: underlying, abi: erc20Abi, functionName: 'decimals' });
    const supplied = (qBal * rate) / 10n ** 18n;   // underlying raw units
    rows.push({ qToken: q, supplied: formatUnits(supplied, decimals), borrowed: formatUnits(borrow, decimals) });
  }
  const [lerr, liquidity, shortfall] = await client.readContract({ address: COMPTROLLER, abi: comptrollerAbi, functionName: 'getAccountLiquidity', args: [user] });
  return { rows, liquidityUsd: formatUnits(liquidity, 18), shortfallUsd: formatUnits(shortfall, 18), error: lerr };
}
```

- APY from per-block rate: `((1 + rate/1e18) ** blocksPerYear − 1)`. Use `blocksPerYear = 8,520,000` from the model, or measure blocks/year from real block times (~3.6 s).
- Keep raw integers until display. Different markets have different decimals, so never sum raw amounts across markets.
- A dashboard must never call `enterMarkets`, `approve`, `mint`, `borrow`, `repayBorrow` or `redeem*`.

## The official SDK

- CommonJS, ethers v6, exports `{ LendingSDK, config }`. Methods: `supply`, `borrow`, `repay`, `withdraw`, `getPortfolio`, `getTotals`.
- **Not published on npm.** `npm install qie-lend-sdk` fails. Pin the GitHub commit instead: `npm install github:qieadmin/qie-lend-sdk#21d2ef2d5c4e9ac82f7e5d72e628341bd0b15262`.
- SDK caveats found in source review:
  - `borrow` sends `enterMarkets([qToken])`, a state-changing tx, before borrowing.
  - `repay` approves every time and doesn't wait for or check a receipt. `supply`/`withdraw` don't wait for receipts either.
  - `getTotals` adds up raw `totalSupply` (qToken units, each market at a different exchange rate) and raw `totalBorrows` (underlying units: 6 decimals for QUSDC, 18 for the rest) across markets, so neither total is meaningful.
  - `getPortfolio` calls `balanceOfUnderlying` via `staticCall` (it is non-view in the ABI).
  - Decimals come from a static config. Read `decimals()` on-chain instead.

## Writes (only with explicit user approval, testnet-style care)

Compound v2 flow: `approve(underlying → qToken)` → `qToken.mint(amount)`. To borrow, first `comptroller.enterMarkets([collateralQTokens])`, then `qToken.borrow(amount)`. Repay with `repayBorrow(amount)` (approve first). Withdraw with `redeemUnderlying(amount)`. The function names on QIE are the same as Compound's. Before each write show the user:
- the market
- the raw and human amount
- the allowance change
- the post-action health (`getAccountLiquidity`)
- the gas limit (QIE bills ≥ 50% of it)

There is no testnet deployment, so writes go straight to mainnet. Start with small amounts.
