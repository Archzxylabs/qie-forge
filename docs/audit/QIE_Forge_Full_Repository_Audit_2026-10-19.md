# QIE Forge — Full Repository Technical Audit

**Review basis:** user-provided `QIE-FORGE-FULL-REVIEW.zip`, 164 ZIP entries (~1.3 MB uncompressed). This review treats the ZIP as a snapshot and distinguishes source inspection, rerun tests, mocked behavioral probes and prior Codex logs. It does **not** claim a full end-to-end npm suite, live RPC tests, deployed dApp tests, or model-host evaluation.

**Editorial note (2026-10-20):** this is a historical audit. Third-party repository identifiers and research artifacts were removed from the current tree during an independence cleanup; the findings, severities and acceptance decisions below are unchanged. The original audit and the removed research materials are preserved outside the repository.

## Executive decision

**B02–B05: retain. B06: in progress; do not declare complete or release diagnostics.** The intended direction (agent-first QIE A–Z operational knowledge, canonical source data, task routing, installable local bundles, fail-closed diagnostics) is coherent. The repository's engineering evidence is detailed and evidence-aware. The immediate issue is integration and trust boundaries in the new, as-yet-unreleased B06 diagnostic code, not a need to redesign QIE Forge.

## Reviewed coverage

- Requirements: `QIE_Forge_PRD_v2.1.md`, `PRODUCT-BRIEF.md`, `docs/architecture.md`, `docs/decisions.md`, `docs/engineering-quality.md`.
- Data: `knowledge/{domains,sources,claims,capabilities,addresses,skills,policy,validation-runs}.yaml` and the accompanying JSON Schemas.
- Build/install: `scripts/lib/{release,bundle,io,knowledge,schemas}.mjs`, release context, both generated `skills/` trees, `dist/skills/` and manifests.
- Diagnostics: `scripts/lib/{effective-status,rpc,network-diagnostic,transaction-diagnostic}.mjs` plus CLI wrappers and skill instructions.
- Testing/evidence: existing test files, frozen routing fixtures, Codex logs and preserved engineering-quality receipts.

## Independently verified

1. ZIP extracted with traversal/symlink checks: no unsafe entry encountered.
2. Generated `skills/qie/`: all **5** manifest-listed files exist, contents match SHA-256 entries, no unlisted files.
3. Generated `skills/qie-networks/`: all **9** manifest-listed files exist, contents match SHA-256 entries, no unlisted files.
4. `dist/skills/` files byte-match their `skills/` counterparts.
5. `node --check` passes for all source `.mjs` in `scripts/` and `tests/`.
6. `node --test tests/status.test.mjs` passes **12/12** on the review environment's Node 22.16.0.
7. Installed/packaged offline inspector runs and returns `DOCUMENTED` and `live_check: NOT_RUN` without pretending a live test.
8. Independently reproduced the inconsistent-chain, malformed-code, malformed-receipt and mismatched-JSON-RPC-ID behaviors described below using explicitly injected mocked transports.

**Not independently rerun:** project `npm test`, `npm run build`, `npm run validate`, `npm run build:check`, `npm run test:install`, or cross-host tests. Project requires Node >=24.20.0 and `node_modules` was excluded; review environment has Node 22 and no local `ajv`, `yaml`, or `skills` dependencies. The `107/107` and `6/6` B05 claims are supported by the included Codex log and earlier audit, not by an independent full-suite rerun of this snapshot. No live QIE network calls were performed in this audit.

## Findings, in priority order

### F-01 — HIGH / B06 blocker: authored skill and published artifact are out of sync

**Evidence:** `authoring/qie-networks/SKILL.md.in` now tells the agent to execute `scripts/verify-network.mjs`, and `knowledge/skills.yaml:65–70` selects the new helper and its dependencies. But `skills/qie-networks/` and `dist/skills/qie-networks/` lack `scripts/verify-network.mjs`, `scripts/lib/network-diagnostic.mjs`, and `scripts/lib/rpc.mjs`. The *published* `SKILL.md` still says live preflight is not implemented. `release-context.json` identifies `0.3.0-diagnostics.1` while package manifests identify `0.2.0-router.1`.

**Impact:** users installing current generated skills cannot run the new live preflight. Packaging reproducibility has not yet been re-established for B06; do not claim B06 completed. Running the source `node scripts/verify-network.mjs qie-testnet` also fails with ENOENT for `/data/network-claims.json` because its relative path is intentionally written for the generated skill-local layout.

**Fix:** finish the B06 implementation, `npm run build`, `npm run validate`, `npm run build:check`, test `node skills/qie-networks/scripts/verify-network.mjs ...` against mock RPC, and rerun clean consumer install tests after removing the checkout fixture. Either document source CLI as bundle-only, or explicitly allow a configurable source snapshot so root-level invocation is usable. Do not manually edit `skills/`.

### F-02 — HIGH / wrong-chain safety: transaction network name not bound to canonical chain ID

**Evidence:** `scripts/lib/transaction-diagnostic.mjs:47–50,73–74,106–110`. Input validates only that `networkId` is among `qie-mainnet|qie-testnet` and that `expectedChainId` is a positive integer; comparison uses caller-supplied chain ID, not an authoritative mapping for the selected network.

**Reproduced mock:** `networkId:'qie-testnet'` + `expectedChainId:1990` + mock RPC reporting `0x7c6` is accepted; additional receipt and code calls proceed.

**Impact:** a task labelled testnet can inspect mainnet data with apparently passing chain identity checks. This violates the product's explicit no-network-substitution requirement.

**Fix:** load the network-to-chain-ID mapping from the validated bundled network profiles, reject inconsistent inputs before RPC, and remove arbitrary `expectedChainId` selection from user-facing CLI or cross-check it strictly. Add testnet↔mainnet adversarial tests.

### F-03 — HIGH / evidence correctness: malformed `eth_getCode` marked as valid code

**Evidence:** `scripts/lib/transaction-diagnostic.mjs:175–192`. Any nonempty string other than `0x`, `0x0` passes, including `not-hex-and-no-code`.

**Reproduced mock:** fake nonhex code led to `checks.identityLinkage:'PASS'`, `codePresent:true`, `checks.applicationEffect:'PASS'`. Final result remains `UNKNOWN` because finality stays `UNKNOWN`, but these component PASS results are unfounded.

**Fix:** accept only properly formatted, nonempty `0x`-prefixed *even-length* hex bytecode as runtime code. Mark malformed RPC code as `UNKNOWN`/`RPC_MALFORMED`; distinguish valid empty code (`0x`) from malformed values. Test the code-at-block semantics and classify an `eth_getCode` at `latest` honestly if it is not pinned to inclusion block.

### F-04 — HIGH / receipt evidence: inclusion PASS without validating block fields

**Evidence:** `scripts/lib/transaction-diagnostic.mjs:122–146`. If receipt `blockHash`/`blockNumber` are merely non-null, inclusion is marked PASS even if hash format is invalid or the block height is not a quantity.

**Reproduced mock:** `blockHash:'oops-not-a-hash'` and `blockNumber:'oops-not-a-quantity'` were accepted with `checks.inclusion:'PASS'`, `checks.execution:'PASS'`, `checks.identityLinkage:'PASS'` and `receiptBlockNumber:null`.

**Fix:** validate receipt object shape and transaction hash binding, block hash and number, target and address formats, and status before assigning inclusion PASS. Treat malformed receipts as `RPC_MALFORMED` / `UNKNOWN`. Ensure evidence-report schema is actually applied to produced outputs. For provenance-sensitive validation, inspect canonical block evidence instead of inferring canonicality solely from any object returned at that key.

### F-05 — MEDIUM / JSON-RPC transport hardening

**Evidence:** `scripts/lib/rpc.mjs:63–87`. The code reads the entire response with `response.text()` and only afterwards checks a character-count ceiling. It does not validate `jsonrpc === '2.0'` or response `id === requestId`.

**Reproduced mock:** a reply with `id:999` was accepted for a request with `id:1`.

**Fix:** enforce a bounded stream read (actual UTF-8 byte ceiling) and protocol-level ID/version checks; reject inconsistent result/error fields and malformed JSON-RPC objects. Add mock tests for oversized streaming, wrong id, missing version, non-2xx, 429 and abort.

### F-06 — MEDIUM / diagnostic tests and version claims lag current source

**Evidence:** `tests/` includes `status.test.mjs` but no `network-diagnostic.test.mjs`, `rpc.test.mjs`, or `transaction-diagnostic.test.mjs` in this ZIP; the recorded `docs/b05-results.md` and README refer to B05 as complete, not B06, and continue to disclaim all live RPC functionality. `package.json` advertises diagnostics version `0.3.0-diagnostics.1`.

**Fix:** add comprehensive tests for B06, run them independently within the project's Node/pinned deps environment, capture exact results in `docs/b06-results.md`; maintain strict mock-vs-live categories. Do not reuse B05's 107/107 count as B06 test coverage.

### F-07 — RELEASE GATE / compatibility and address provenance

**Evidence:** `knowledge/capabilities.yaml` has eight UNKNOWN QIE operation capabilities, `knowledge/addresses.yaml` is empty, and no successful provider-specific integration tests, verified application contract identity records, deployed dApp workflow or cross-host agent evaluation appear in this ZIP. `docs/decisions.md` records the need to bind official issuer/ABI provenance to any verified ecosystem contract.

**Impact:** QIE Forge currently provides credible *navigation and network documentation*, not verified A–Z runtime execution support. This is acceptable at the present engineering stage, but it must not be advertised as production-ready compatibility.

**Fix:** keep `UNKNOWN` until operation/version/network-scoped real evidence exists; explicitly distinguish documented network values, observed read-only behavior, officially verified code and verified application postconditions. For a hackathon reference dApp, separately verify its source in the QIE explorer and demonstrate an approved workflow using Forge, consistent with the organizer's message.

## Independence review

The current product tree was checked for third-party copying: no exact upstream file matches or shared long-form text sequences were found. Detailed research provenance and evidence are preserved in the private archive outside the repository. No research material or third-party repository identifiers are required in the product tree.

**Engineering decision:** retain the independently authored QIE requirements and evidence contracts; do not use the archived research as a template for naming, directory count or copied content.

## Product-fit interpretation

The central question is whether an agent using Forge can select a QIE-compatible tool and complete real development work. Right now the answer is: strong **structural foundation**, incomplete **operational evidence**. The two existing skills do network navigation and local status reporting; contract compilation/deployment, wallet integration, dApp troubleshooting and ecosystem protocol support remain scoped future work. The reference app is a demonstration of those capabilities, not a new product identity.

## Immediate action plan

1. **Fix F-02/F-03/F-04 before trusting transaction results.** Bind chain/network IDs; strict code, receipt, and response validation; negative mock fixtures.
2. **Fix F-01.** Package new helpers and regenerate reproducible bundles, keeping single-skill installs self-contained.
3. **Fix F-05.** Harden RPC transport and response limits.
4. **Close F-06.** Add all B06 diagnostic suites and clean install tests, run full scripts on pinned Node/npm, save truthfully labeled evidence; then add scoped read-only live checks when connectivity permits.
5. **Only then proceed to B07.** Add workflow-specific QIE skills and recipes with tested versions and explicit approval boundaries. Do not promote unsupported integration to VERIFIED.

**Do not** redesign the product, add custom MCP/CLI/backend/database, build an unrelated NFT product, or copy another project's implementation.
