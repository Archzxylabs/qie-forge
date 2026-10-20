<!-- GENERATED — DO NOT EDIT. Change canonical authoring or knowledge. -->

# Prepare a deployment without inventing compatibility

**Scope:** EVM Mainnet or Testnet release preparation and optional read-only inspection of an already externally submitted transaction. No native operation, signing, broadcasting, funding transfer or explorer-verification command is implemented. Foundry deployment, compiler/EVM-target support, fee semantics, signer, explorer API and finality remain UNKNOWN on QIE.

**Inputs:** explicit intended network; reviewed application source/tests; pinned compiler/tools; ABI, creation/runtime bytecode and constructor arguments; actual capability evidence; developer-owned signer identity and spend authority when available. Missing values are blockers, not placeholders to execute. A Mainnet request stays Mainnet; testnet qualification is a prerequisite where required, not a silent substitution.

1. Run the application's local build/test recipe. Preserve source/configuration/dependency/artifact hashes and actual exit results. The bundled local counter demonstrates generic tooling only; it is not the reference dApp or a QIE-qualified deployment.
2. From the installed skill run `node "$SKILL_DIR/scripts/verify-network.mjs" qie-testnet` for a Testnet task (or `qie-mainnet` for Mainnet). Capture the JSON and exit separately. Wrong chain, offline, malformed, stale or conflicting evidence stops the dependent flow. An identity/responsiveness PASS alone does not clear compatibility or signing gates.
3. Copy [the blocked review template](assets/deployment-review.json) to `deployment-review.json` in the consumer project. Populate target network and expected/observed chain; source/artifact/ABI digests; constructor/configuration; intended direct creation or separately reviewed factory/proxy path; signer account; native value; fees and maximum spend with units; tool/version/capability sources; explicit unresolved checks; approval state. Null fields are unresolved, not approved defaults. Do not store secrets or call an unsigned plan an executed deployment. This is a review artifact, not an enforceable approval service or a new canonical schema.
4. Report AWAITING_USER_APPROVAL only after all technical prerequisites are established and the exact concrete action is reviewable. Otherwise report BLOCKED with the missing evidence. This release supplies no tested signing/broadcast command: never substitute a generic `forge create`, embedded wallet, factory address or guessed verifier API and call it QIE-supported.
5. After a future separately authorized external submission, bind its actual transaction hash and expected creation address to the reviewed action. Optional read-only command:

```sh
node "$SKILL_DIR/scripts/verify-transaction.mjs" "$NETWORK_ID" "$TX_HASH" DEPLOY_DIRECT "$PUBLIC_RPC_URL" "$EXPECTED_CREATED_ADDRESS"
```

All variables must come from that reviewed action and observed submission; no dummy hash/address is executable guidance. The observer's exit 0 means a report was produced. Inspect errorCode, checks and applicationOutcome. Matching receipt and latest-block code are limited observations; original creation intent, block-specific code, canonicality, application effects and finality need additional evidence. Factory/proxy creation is not direct creation. MINT verification is refused.
6. Keep compiler-artifact/source verification on the actual QIE explorer separate. No working API is known here. Never describe an explorer link, code presence or generic receipt as verified source, a security audit or APPLICATION_VERIFIED.

**Recovery:** rejected signing → no submission assumed. Missing receipt → pending/not found/UNKNOWN, investigate before another action. Revert → preserve tx/trace/context and fix locally before a new approved attempt. Wrong network → stop, never retry on the other chain. Unknown fees or maximum spend → no approval-ready action. No empty commits, pushes, key requests or automatic replacement transactions are recovery steps.

**Success:** local artifacts plus an honest readiness/blocker record. A real deployment claim requires independent actual submission/identity/effect evidence. Full application verification remains blocked by unresolved QIE finality. Do not mark preparation or a narrow observation as a completed rollout.
