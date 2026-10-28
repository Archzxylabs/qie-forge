# QIE ecosystem evidence matrix

**Release:** `0.6.0-ecosystem.1`  
**Review cut:** 2026-10-24T20:00:51Z

| Product / operation | Primary evidence | Status | What can be built now | What remains blocked |
|---|---|---|---|---|
| QUSDC product model | S22–S26 | DOCUMENTED | Explain receipt model, WUSDC relationship and economic caveats | Independent backing, current deployment and market-value guarantees |
| QUSDC SDK mint | S27–S28 | DOCUMENTED | Local adapter/mock around `depositAndMint(uint256)` with dynamic WUSDC decimals | Vault/WUSDC/QUSDC identity and live mint effect |
| QUSDC SDK redeem | S27–S28 | DOCUMENTED | Local redemption and failure tests around `burnAndWithdraw(uint256)` | Current redemption liquidity, fees, pause/upgrade behavior |
| QUSDC amount handling | S28 | DOCUMENTED | Integer accounting and raw-unit tests | Equality of QUSDC and WUSDC scales on deployment |
| QIE Lending supply | S29–S30 | DOCUMENTED | Provider-only read adapter and local mocked market | Candidate token/cToken identity, current market metadata and write success |
| QIE Lending borrow | S29 | DOCUMENTED | Model `enterMarkets` as an explicit state-changing prerequisite | Collateral factors, oracle, caps, health semantics and live borrow |
| QIE Lending repay/withdraw | S29 | DOCUMENTED | Local failure and receipt-handling design | Current allowance, cash, liquidity and runtime ABI behavior |
| QIE Wallet EIP-1193 | S10 | DOCUMENTED | QIE-specific provider discovery and state invalidation | Real extension/version/browser test |
| QIE EVM network identity | S03, S15 | DOCUMENTED | Offline profiles and bounded read-only probe | Endpoint liveness, per-method limits and WebSocket support |
| QIE Oracle read | S12, S35–S38 | DOCUMENTED | Local AggregatorV3 mock and freshness/scale checks | Feed identity, proxy code, update policy and live scale |
| QIE DEX web | S31, S34 | CLAIMED | Product discovery and safe handoff | Router/factory ABI, pool model, routes, fees and address identity |
| QIE Bridge web | S32, S34 | CLAIMED | Route discovery and failure-recovery checklist | Lock/mint/burn/release, relayer, finality and refund interfaces |
| QIE ID resolution | S33, S34 | UNKNOWN | Address-free resolver boundary and transfer preview | Resolver API/ABI, mapping freshness, ownership and revocation |
| QIE Pass verification | S34 | UNKNOWN | Consent/replay/privacy design boundary | Credential format, issuer verification and KYC semantics |
| Native QIE delegation | S13, S15, S16 | DOCUMENTED | Native-vs-EVM routing and `aqie` unit guidance | Current qied binary, node, fees and live delegation |
| Explorer lookup | S03, S34 | DOCUMENTED | Human-facing lookup and scoped receipt investigation | Official API, ABI retrieval and source-verification automation |
| Direct event indexing | S00, S09 | UNKNOWN | Bounded `eth_getLogs` adapter with cursor/idempotency | Provider range, rate limits and hosted indexer support |

## Identity gate result

| Gate | Current result | Evidence |
|---|---|---|
| Published candidate | PASS | S28, S30, S12, S16 are retained with claimed roles. |
| Network identity | NOT_RUN | No live QIE RPC observation was executed in this release. |
| Code presence | NOT_RUN | No `eth_getCode` check was executed. |
| ABI correspondence | BLOCKED | Source ABIs exist, but deployed correspondence is unresolved. |
| Issuer provenance | BLOCKED | Official publication exists for some candidates, but issuer-to-deployment linkage is not human-reviewed in a runtime record. |
| Conflict handling | PASS | Open conflicts are retained in `knowledge/conflicts.yaml`. |
| Authorization | BLOCKED | `execution_allowed` is false for all integration records and candidates. |
