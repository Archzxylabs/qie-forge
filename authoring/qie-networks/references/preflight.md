# Preflight boundary

This is a checklist, not a claim that live tests have passed.

1. Confirm the user's intended EVM network and read its local published configuration.
2. Have the host use a permitted read-only JSON-RPC client to observe `eth_chainId` on the selected endpoint.
3. Compare the observed chain ID with the selected documented chain ID. A mismatch stops the workflow; never substitute another network.
4. Check a responsive recent block and investigate stale, malformed, rate-limited or unavailable responses. The foundation package does not prescribe untested RPC thresholds.
5. Record observations separately from reference data. An inability to conclude is `UNKNOWN`.
6. Any later write requires explicit action review, fee/spend review and developer-controlled signing. A receipt or deployed bytecode alone does not prove application identity, effect, or finality.

No RPC method, wallet, provider, contract address, confirmation count or finality policy is promoted to VERIFIED by reading this checklist.
