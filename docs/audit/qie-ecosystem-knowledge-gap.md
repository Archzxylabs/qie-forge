# QIE ecosystem knowledge gap audit

## Before and after

| Area | Previous behavior | New capability | Remaining limit |
|---|---|---|---|
| QUSDC | Product named but SDK and WUSDC flow treated as unknown | Pinned SDK ABI, constructor inputs, allowance, decimals, approval, estimateGas, wait and source-level limitations | Deployment and economic verification remain blocked |
| Lending | Repository existence only | Pinned operation matrix, market candidates, Comptroller/cToken calls, health and source-code observations | No live market metadata or production borrow proof |
| Token accounting | Generic ERC-20 guidance | Raw-unit, decimals, allowance, nonstandard-token and balance-delta recipe | No token-specific runtime verification |
| Network/RPC | Chain profile and two-call preflight | Bounded per-method read-only probe with no fallback or promotion | No live probe executed in CI/release |
| Wallet | EIP-1193 guide | Product-specific discovery, numeric chain comparison, account invalidation and approval review | Browser extension not tested |
| Deployment/address identity | Empty address inventory and broad refusal | Discovery candidates plus one shared identity gate and conflict records | No candidate is executable |
| DEX/Bridge | Web product names | Web/product discovery versus programmatic interface separation | Router, bridge, relayer and ABI unknown |
| Oracle | Mapping and generic note | AggregatorV3 interface, decimal/freshness/sanity guidance and candidate roles | Feed identity and update policy unknown |
| Native/Cosmos | Navigation references | Explicit EVM/native separation, `aqie`, chain registry and staking/governance boundary | Native CLI/runtime untested |
| QIE ID/Pass | Product names | Address-free resolver and credential boundaries, privacy/replay warnings | No resolver or credential API found |
| Indexing/Explorer | Generic gaps | Read-only logs, explorer and source-verification boundaries | Provider limits/API unknown |

## Verdict

The release is materially more useful for local development and evidence-bounded planning. It is not production integration proof: every write-bound ecosystem operation remains BLOCKED or UNKNOWN unless separately verified.
