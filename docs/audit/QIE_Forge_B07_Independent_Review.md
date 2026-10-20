# QIE Forge B07 — Independent Source Review

**Source:** User-provided `QIE-FORGE-B07-review.zip` (511 archive entries, ~2.21 MB uncompressed).  
**Inspected release:** `0.4.0-operational.1` (schema `1.2.0`).  
**Decision:** **PASS for B07's declared local, mock, and preparation scope; proceed to B08.** Do not market this as live QIE-compatibility, complete dApp, deployment, or production-ready evidence.

## Independent checks performed

| Check | Actual result | Evidence / limits |
|---|---|---|
| Published skill inventory | PASS: 8 (`qie`, `qie-networks`, `qie-smart-contracts`, `qie-frontend`, `qie-wallets`, `qie-transactions`, `qie-deployment`, `qie-debug`) | `skills/` |
| Manifest completeness & SHA-256 | PASS: every declared hash matches; no missing/unlisted files | All 8 `MANIFEST.json` files |
| Publication/staging byte parity | PASS: all files in `skills/` and `dist/skills/` match | Independent byte comparison |
| Local Markdown references | PASS: no broken local links found in published Markdown | Independent local link scan |
| B07 evidence receipt integrity | PASS: 42 hash comparisons, including evidence artifacts, manifest digests, and report | `docs/evidence/b07/execution-receipt.json` |
| JS source/test syntax | PASS: checked `.mjs` files using local Node 22 | `node --check`; not a Node 24 test suite |
| Status evaluator tests | PASS: 12/12, executed independently | `node --test tests/status.test.mjs` |
| Installed-wallet-controller behavior | PASS: copied only `skills/qie-wallets` to an isolated temp folder and ran mock provider connection, `uint256` read, account-change invalidation | Used Node 22 experimental TS stripping; no source repo or real wallet required |
| Full `npm test` 208/208 | **Corroborated from archived log, not independently rerun** | `docs/evidence/b07/tests.txt` |
| Skills CLI install tests 18/18 | **Corroborated from archived log, not independently rerun** | `docs/evidence/b07/installation.txt`; test source deletes fixture checkout and exercises both installation modes |
| Real Foundry Solidity replay 5/5 incl. fuzz 256 | **Source and detailed recorded output inspected, not independently rerun** | `tests/operational-skills.test.mjs`, `Counter.sol`, `Counter.t.sol`, `docs/evidence/b07/` |
| Actual QIE RPC, wallet/browser, deploy, signing, explorer verification | **NOT_RUN / not proved** | Same disclosure in `docs/b07-results.md` |

The review container supplies Node 22, lacks `node_modules`, Forge, and the pinned native solc. Consequently it cannot replay the repo's full Node 24.20 + Foundry/solc integration suite without installing external prerequisites. The archive's logs are consistent with the reported 208 unit/integration and 18 installer successes, but are not cryptographic attestations of the host execution.

## Product and implementation findings

### PASS — Skill quality and honest scope boundaries

- Six new operational skills have task-specific triggers, concise procedures, progressive references, failure handling, and security/approval boundaries; they are not empty Markdown stubs. See `authoring/qie-{smart-contracts,frontend,wallets,transactions,deployment,debug}/SKILL.md.in`.
- The five canonical recipes are present and properly bundled: network, local Solidity build/test, wallet read, deployment preparation, debug. Selected helpers and their import closure stay inside the installed bundle.
- The local Solidity `Counter` fixture contains an original contract and five tests including bounded fuzzing. This is a valid **local tooling proof**, not proof of QIE EVM compatibility or security of arbitrary user dApps.
- Wallet read is intentionally a framework-neutral controller; mock-tested handling covers wrong chain, connection refusal, malformed `eth_call`, account/chain events, and pending stale reads. The copy-only isolated test also succeeded in this review.
- Deployment explicitly remains **BLOCKED** until QIE-specific compatibility, signer, fees and spend evidence are established. No invented signing/broadcast recipe or contract address was detected in the reviewed guidance.
- `qie-ecosystem` stays unpublished for B08; router differentiates missing published and planned/unpublished skills.

### M1 — Clean-machine reproducibility / CI setup is incomplete (non-blocking for B08)

`tests/operational-skills.test.mjs` requires `forge` on PATH and the native compiler via `QIE_FORGE_SOLC` or the maintainer-specific `~/.solc-select/artifacts/solc-0.8.37/solc-0.8.37` fallback. Installing npm dependencies alone is insufficient to reproduce the 208-test suite on a new machine. Document/provide a clean, pinned setup for Forge and compiler with verified checksums, and run it in CI; keep actual offline replay separate from mock suites, without silently skipping required release tests. `recipes/build-test/recipe.md` already documents that the compiler is an explicit prerequisite.

### M2 — TypeScript typecheck and framework/browser proof are missing (release gate, not B07 failure)

The controller at `recipes/wallet-read/assets/wallet-read.ts` is executed via Node type stripping and mock EIP-1193 providers; no `tsc --noEmit`, real framework build, browser test, wallet integration, or actual QIE `eth_call` has been proved. Add `tsc` checks and at least one real frontend integration during the relevant later milestone. Do not call this a production wallet/SDK integration yet.

### M3 — QIE evidence remains mostly discovery-level (direct B08 priority)

The canonical dataset still has 15 domains, 11 `DOCUMENTED` network claims, 8 `UNKNOWN` capabilities and no authoritative contract addresses. Foundry local replay does not change these statuses. B08 should expand capability records at **tool × version × operation × exact network × environment** granularity, with sources, limitations, currency/fees where applicable, freshness review, conflicts and reproducible checks. Do not fill gaps with generic EVM assumptions.

### L1 — Forward-test provenance would be stronger with portable artifacts

The forward-test receipt names temporary checkout paths and records SHA-256 hashes/output logs, but the built `Counter.json` artifacts themselves are not present in the evidence folder. This does not invalidate the replay logs, since the recipe includes the original source and reproduction commands. For independent reviewers, include sanitized source/artifact snapshots or a reproducible tarball in future evidence; avoid user machine absolute paths in public-facing receipts.

### Later release gates (accurately recorded by project)

- Official Agent Skills `skills-ref` validation; immutable published Git ref installation and upgrade/rollback; mixed-release compatibility.
- Actual cross-host skill discovery/use tests (Codex/Claude/Cursor/OpenCode), not just catalog/routing fixtures.
- Live QIE RPC and chosen wallet/SDK tests; real browser/frontend build; reviewed signer and transaction-specific evidence; explorer source verification and finality policy.
- A separately scoped reference dApp/contract for hackathon submission, built and demonstrated with QIE Forge, with the source verified on QIE explorer subject to organizer conditions.

## Recommended next action

**Approve B07 in its explicit local/mock/preparation scope, proceed to B08.** Keep M1/M2 as recorded delivery gates, and prioritize M3 now. Do not rewrite working skill/package architecture or add a custom CLI, MCP, database or backend. Re-audit after B08 with a new repository ZIP plus evidence logs.
