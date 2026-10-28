<!-- GENERATED — DO NOT EDIT. Change canonical authoring or knowledge. -->

# Use QIE Oracle data for collateral

**Scope:** read-only price adapter and local mock. No unverified feed address may enter executable collateral logic.

The reviewed official QIE Oracle sources document an AggregatorV3-style interface with `latestRoundData()`, `getRoundData(uint80)` and `decimals()`, plus a mapping table of asset candidates. The mapping and examples do not establish current on-chain identity.

## Safe adapter

1. Pass an issuer-authenticated feed address through the address identity gate.
2. Read `decimals()` and `latestRoundData()` at the same selected network.
3. Reject zero or negative answers where the application requires positive prices.
4. Check `updatedAt` against an application-defined maximum age; do not assume updates happen every block.
5. Normalize using integer arithmetic and an explicit base/quote denomination. Never use `Number(price)` for large values.
6. Bound price magnitude and change, handle stale/missing rounds, and define a fail-closed fallback. Do not use a marketing claim or one successful read as an economic guarantee.

## Local test cases

Use a mock AggregatorV3 feed for fresh, stale, zero, negative, oversized and missing data. Assert that collateral, liquidation and QUSDC-to-USD accounting stop or surface UNKNOWN when the feed identity or freshness gate is not satisfied.
