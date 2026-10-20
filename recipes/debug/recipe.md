# Diagnose the smallest failing stage

**Scope:** selected QIE EVM Mainnet/Testnet, Node 24.20.0, B06 read-only helpers. Runtime regression evidence is MOCK. Native validator/account failures require official native sources and release information, not these EVM commands.

**Inputs:** redacted command/error, exact tool/version, intended network, stage, optional actual tx hash, expected target/action, reviewed source/ABI and any observed output. No credentials, keys or seed phrases. A network-independent compile error does not require a wallet.

| Symptom / observed class | Minimal check | Recovery and stop rule |
|---|---|---|
| Local compiler/test failure | Reproduce the first error with the pinned local toolchain | Correct source/config/dependency mismatch, rerun failed test then suite; no chain claim |
| Wallet rejection or disconnection | Inspect app connection state and user-visible error | Clear state, deliberate reconnect; no permission bypass or automatic switch |
| WRONG_CHAIN | Compare observed identity with selected packaged claims | Stop after identity lookup; fix selected-network configuration, never substitute mainnet/testnet |
| RPC_UNAVAILABLE / timeout | Selected-endpoint preflight | UNKNOWN; deliberate read retry or separately check an official same-network alternative |
| RPC_RATE_LIMITED | Preserve endpoint host and method; no credentials | UNKNOWN; stop automatic retries; provider policy is not invented |
| RPC_MALFORMED | Preserve redacted method and malformed field | UNKNOWN; do not coerce data into PASS |
| UNSUPPORTED_PROVIDER | Record exact failed method/version/network | UNKNOWN for that operation; no blanket provider compatibility |
| TX_NOT_FOUND / TX_PENDING | Hash on the independently checked chain | Pending/not found is not failure permission to rebroadcast; obtain submission evidence |
| TX_REVERTED | Receipt plus reviewed source/ABI and available trace | Execution FAIL; fix the cause locally before a new externally approved action |
| CONTRACT_NO_CODE / ADDRESS_UNVERIFIED | Expected target/creation and scoped receipt/code check | No contract identity or deployment-success claim; obtain issuer/ABI/action provenance |
| Nonce/gas/balance hypothesis | Exact error, sender and pending action context | Do not invent gas multipliers, fee currency decimals, replacement rules or resubmit |
| Receipt passes but app has no effect | Chain, target, ABI/event/state and UI config | Receipt success is narrower; missing effect/finality keeps overall outcome UNKNOWN |
| SOURCE_STALE / conflicted source | Shared effective status and canonical source records | Block dependent operational recommendation until reviewed |

From any directory, using an installed skill with the helpers:

```sh
node "$SKILL_DIR/scripts/verify-network.mjs" "$NETWORK_ID" --rpc "$PUBLIC_RPC_URL"
node "$SKILL_DIR/scripts/verify-transaction.mjs" "$NETWORK_ID" "$TX_HASH" GENERIC_TX "$PUBLIC_RPC_URL"
```

Run the receipt command only if a real hash exists and the selected-network preflight permits continuation. `NETWORK_ID` is the explicit `qie-mainnet` or `qie-testnet`; `PUBLIC_RPC_URL` is the same independently checked endpoint, never a cross-network fallback. Preflight exit 0 requires PASS; transaction exit 0 merely means a JSON report exists. No exit-code-only success claim.

For a direct-creation claim supply `DEPLOY_DIRECT` and the independently expected created address as the final argument. Generic receipt inspection leaves identity/effect unbound; MINT is recognized but refused without any request. Inspect `checks.inclusion`, `execution`, `identityLinkage`, `applicationEffect`, `finality` and `applicationOutcome` separately. All finality remains UNKNOWN in this helper version; even matching latest-block code does not establish inclusion-block code or canonical continuity.

**Artifacts:** the minimal redacted error reproduction, network observation, scoped transaction report when applicable, evidence versus hypotheses, one selected correction and its retest result. Never fabricate output. Do not paste a secret-bearing endpoint or complete private logs into an issue.

**Success:** explain the observed failing stage and demonstrate recovery with the relevant check, or report the remaining blocker and next required evidence. Local correctness, chain inclusion, contract identity, application effect, explorer source match and finality are separate results. Recovery introducing login, publication, signing, spending or changed permissions requires separate concrete authorization and external enforcement.
