<!-- GENERATED — DO NOT EDIT. Change canonical authoring or knowledge. -->

# QIE Lending read-only dashboard

**Scope:** source-grounded read adapter and local mock architecture. Do not supply a signer, approve a token, call `enterMarkets`, borrow, repay or withdraw for a dashboard task.

## Reviewed SDK surface

The pinned official SDK exports a CommonJS `{ LendingSDK, config }` pair and uses ethers v6. The read methods are `getPortfolio(user)` and `getTotals()`. Portfolio loops over configured markets, calls `balanceOfUnderlying.staticCall(user)` and `borrowBalanceStored(user)`, then calls Comptroller `getAccountLiquidity(user)`. Totals sum `totalSupply()` and `totalBorrows()` across configured markets.

## Adapter procedure

1. Select QIE Mainnet explicitly and run the read-only chain preflight.
2. Treat the SDK's comptroller, cToken and underlying addresses as published candidates. Do not copy them into a write configuration.
3. Replace the static config with a reviewed adapter that includes market role, raw decimals, identity status and source commit.
4. Read each market independently. Show raw amounts, token decimals, market role and block number; do not sum different assets into a USD total without a verified price source and denomination.
5. Surface Comptroller error codes, shortfall, missing market responses and stale provider data rather than reducing them to a generic zero health score.
6. Add pagination/caching only after observing provider behavior; do not invent a QIE log-range or RPC limit.

## Why writes stay blocked

The SDK's write methods call `mint`, `borrow`, `repayBorrow` and `redeemUnderlying`; borrowing also sends `enterMarkets` first. The source does not prove collateral factors, liquidation thresholds, caps, oracle identity or current deployment compatibility. The local dashboard must never call those methods as a side effect of a read.

## Local mock checks

Mock provider responses for multiple markets, zero positions, shortfall, comptroller error, malformed token scale, stale block and one unavailable market. Assert that the UI shows raw balances and an explicit UNKNOWN state instead of approving or borrowing.
