---
name: qie-transactions
license: MIT
description: Inspect QIE EVM transaction receipts, direct-creation linkage and runtime-code observations using bundled read-only diagnostics. Use for pending/reverted transactions, gas or nonce investigation and distinguishing receipt facts from application effects. Does not sign, broadcast, verify a mint or establish QIE finality.
compatibility: Node 24.20.0 in the tested Node 24 line. Local helper imports and data are bundled. HTTPS RPC calls are optional, bounded read-only observations; QIE endpoint behavior has not been tested live.
---

# QIE transaction investigation

1. Establish the exact EVM Mainnet/Testnet target, transaction hash and claimed action. Validator delegation is native research, not this procedure.
2. Read [selected evidence](references/evidence.md) and the [debug recipe](recipes/debug/recipe.md). Separate local build/transport/submission/execution/application failures before choosing a check.
3. Run the bundled network preflight first. A wrong-chain observation stops; an unavailable observation is UNKNOWN. Use the same selected endpoint for follow-up reads; never fall back across networks.
4. Use the recipe's generic receipt command for receipt facts. For DEPLOY_DIRECT, additionally supply the independently expected created address. The helper validates receipt/code format but does not establish original transaction intent, inclusion-block code, canonical continuity or issuer identity.
5. Report inclusion, execution, identityLinkage, applicationEffect and finality separately. Transaction CLI exit 0 means a report exists, not success. Inspect its errorCode/checks/applicationOutcome.
6. For QUSDC or Lending actions, decode application events only with a reviewed ABI and compare expected token balance deltas at the selected block. A generic receipt cannot certify minting, redemption, supply, borrow, repayment or withdrawal.

The installed [transaction observer](scripts/verify-transaction.mjs) and [network preflight](scripts/verify-network.mjs) use the packaged snapshot. No checkout, sibling skill or secret is required. [Release metadata](references/release-info.md) identifies that snapshot.

## Limits and continuation

- MINT is recognized but refused without a network call; ABI/event/state-specific verification is not implemented. Generic receipts cannot certify token delivery, a swap or any requested application effect.
- A matching deployment observation can be described as CONFIRMED_AT_BLOCK only within the helper's limited semantics. Finality remains UNKNOWN and APPLICATION_VERIFIED is unreachable.
- Do not invent QIE fee formulas, nonce replacement rules, confirmation counts or supported block tags. Collect tool/version/endpoint/error evidence and keep hypotheses separate from facts.
- Retry a read only deliberately after classifying the error. Never automatically replace or resubmit a transaction: it may already be pending or included. Any state change needs separate developer review and signing.

<!-- GENERATED — DO NOT EDIT. Change canonical authoring or knowledge. -->
