# QIE Lending protocol review

**Reviewed:** 2026-10-24T20:00:51Z  
**SDK commit:** `qieadmin/qie-lend-sdk@21d2ef2d5c4e9ac82f7e5d72e628341bd0b15262`

## Package and exports

The pinned repository is a CommonJS package named `qie-lend-sdk`, version `1.0.0`, using ethers `^6.0.0`. Its entry point exports `{ LendingSDK, config }`. The SDK constructor accepts a provider, optional signer and config.

Methods:

| Method | Source behavior | Safe release interpretation |
|---|---|---|
| `supply({ market, amount })` | Approves underlying if needed, simulates `mint`, estimates gas and calls cToken `mint` | DOCUMENTED source behavior; write blocked |
| `borrow({ market, amount })` | Creates Comptroller, calls `enterMarkets([cToken])`, simulates borrow, estimates gas and calls cToken `borrow` | Has a state-changing market-entry side effect; never use in a read dashboard |
| `repay({ market, amount })` | Approves underlying, then calls `repayBorrow` | Approval/receipt handling differs from supply |
| `withdraw({ market, amount })` | Calls `redeemUnderlying` directly | No source-level simulation or receipt wait |
| `getPortfolio(user)` | Reads `balanceOfUnderlying`, `borrowBalanceStored`, then `getAccountLiquidity` for each market | Useful read adapter pattern; decimals and health semantics need review |
| `getTotals()` | Sums `totalSupply` and `totalBorrows` across configured markets | Raw totals across different markets are not a common USD denomination |

## Market configuration

The static configuration lists WBNB, WETH, QUSDC and WQIE, plus a Comptroller candidate. It supplies cToken, underlying and decimal fields. These are published discovery candidates, not issuer-authenticated deployment identities. The QUSDC underlying candidate is preserved as a conflict because its role is not reconciled with the separate QUSDC SDK inputs.

## ABI and source observations

The shipped cToken ABI includes:

```solidity
mint(uint256)
borrow(uint256)
repayBorrow(uint256)
redeemUnderlying(uint256)
borrowBalanceStored(address)
totalSupply()
totalBorrows()
```

The Comptroller ABI includes `enterMarkets(address[])` and `getAccountLiquidity(address)`. The source code review found the following implementation observations, not confirmed production vulnerabilities:

- market guards are inconsistent; the borrow path dereferences a market before checking it;
- borrowing changes market membership before borrow simulation;
- decimal values are static config rather than dynamically read metadata;
- approval handling differs between actions;
- receipt waiting is incomplete across actions;
- `simulate` error construction can lose the intended message due to operator precedence;
- portfolio health converts raw liquidity by a fixed `1e18` assumption without documenting the denomination;
- totals sum raw values across markets with different asset scales;
- oracle, collateral factor, liquidation threshold, caps, cash and rate metadata are not read.

## Safe dashboard architecture

Use a provider-only read adapter with an explicit network and candidate identity record. Read each market independently, preserve raw amounts and decimals, attach block numbers, surface Comptroller error/shortfall values, and represent missing or stale data as UNKNOWN. Mock zero positions, nonzero supply, borrow balances, shortfall, market errors and unavailable markets.

Do not call `enterMarkets`, approve tokens, borrow, repay or withdraw from a dashboard read path. Do not claim “supported markets” are live simply because a static config lists them.

## Deployment boundary

The pinned SDK is enough to build local adapters and mock tests. It is not enough to authorize production writes. Current deployment, ABI correspondence, issuer provenance, live market metadata, oracle identity and collateral/liquidation parameters remain unresolved.
