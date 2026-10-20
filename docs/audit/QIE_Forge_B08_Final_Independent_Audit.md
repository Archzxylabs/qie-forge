# QIE Forge — B08 Final Remediation Independent Audit

**Audit input:** User-uploaded `QIE-FORGE-B08-FINAL-review.zip` (558 ZIP entries, 2,695,894 uncompressed bytes).  
**Repository release:** `0.5.1-ecosystem.1`, schema/policy `1.4.0`.  
**Observed auditor UTC clock:** 2026-10-19 20:54–20:57 UTC (2026-10-20 03:54–03:57 WIB).  
**Verdict:** **REMEDIATION SUBSTANTIALLY VERIFIED; RELEASE-PROVENANCE AND STATUS-PROJECTION CORRECTIONS REQUIRED BEFORE FINAL B08 SIGN-OFF/B09 RELEASE WORK.** No rewrite of nine skills required.

## Verified independently against archive bytes

- Nine independent bundles exist: `qie`, `qie-networks`, `qie-smart-contracts`, `qie-frontend`, `qie-wallets`, `qie-transactions`, `qie-deployment`, `qie-debug`, and `qie-ecosystem`.
- All manifest-declared SHA-256 hashes in `skills/` and `dist/skills/` match actual file contents; no unlisted/missing files in these bundles. The two trees are byte-identical: **103 files each**.
- Local Markdown references in all nine published bundles resolve (no missing relative targets in the link scan).
- All `.mjs` files under `scripts/`, `tests/`, and `skills/` pass `node --check` (auditor Node 22.16.0; syntax check is not a replacement for project Node 24 test suite).
- Source ledger ID→URL equality: **18/18 match** `knowledge/sources.yaml`; no extra ledger IDs. The previous S08/S09/S12–S15/S18 URL mismatch was corrected.
- `knowledge/capabilities.yaml`: **25** capabilities: 0 VERIFIED, 9 DOCUMENTED, 2 CLAIMED, 9 UNKNOWN, 1 CONFLICTED, 0 STALE, 2 UNSUPPORTED, 2 DEPRECATED. Category membership explicitly stored, with `dex-swap` and `qiedex-web-swap` under `defi` and `indexer-query` under `indexing`.
- Current generated ecosystem catalogue projects RPC/explorer facts from canonical claims, not the previously problematic hostnames. QIE official published Mainnet 1990 (`rpc1mainnet.qie.digital`), Testnet 1983 (`rpc1testnet.qie.digital`), and explorers `mainnet.qie.digital`, `testnet.qie.digital` match the source cited in S03; no live QIE RPC tests were performed.
- The hand-maintained `toolsSummary` product-status mapping and literal precompile address in catalogue renderer are gone. Address inventory remains empty; the decision guide includes the issuer/ABI/scoped-observation/human-review/conflict gates.
- Installed offline `skills/qie-networks/scripts/inspect-network.mjs qie-mainnet` ran and accurately returned DOCUMENTED/NOT_RUN information (no live RPC).
- The supplied recorded logs show **234/234** unit/integration tests and **20/20** Skills CLI installation fixtures PASS. **Those suites were not independently rerun**: installed audit Node is v22.16.0; this project declares Node >=24.20.0 and packaged npm dependencies are not included.

## Remaining finding F-FINAL-01 — P1: release and source-review timestamps are in the future

**Evidence:**
- `release-context.json:4`: `built_at: 2026-10-20T08:00:00Z`.
- `knowledge/sources.yaml:213-218`: source S21 `reviewed_at: 2026-10-20T06:00:00Z`.
- `docs/b08-results.md:8,60` repeats these dates as actual release/review facts.
- Archive received and audited approximately **2026-10-19T20:52–20:57Z**, so the alleged review is ~9 h in the future and build is ~11 h in the future relative to the archive's existence. This is not a timezone misunderstanding: all timestamps are UTC (`Z`).
- `scripts/lib/knowledge.mjs:113-118` enforces only `reviewed_at <= built_at` and does not enforce real-world chronology; a matching pair of **future** timestamps passes.

**Impact:** Reproducible packaging hashes still work, but timestamps are not trustworthy provenance or release metadata. A `PASS` on `build:check` does not validate actual times of review/build.

**Correction:** Audit the actual S21 retrieval/review evidence; record only the real observed UTC timestamp, or mark review time unknown and keep the applicable operation conservative until confirmed. Recut `built_at` to the actual release-build time. Regenerate all nine bundles, documentation and manifests. Add a release-cut chronology gate that rejects ungrounded future `built_at` and `source.reviewed_at`, with a small documented clock-skew tolerance. Preserve deterministic frozen-time test fixtures separately from the real release gate. Do not simply invent earlier timestamps to make validation green.

## Remaining finding F-FINAL-02 — P1 for future VERIFIED/expiry claims: inconsistent effective-status projection

**Evidence:**
- `scripts/lib/release.mjs:194-213`: `catalogueReference()` computes `effectiveStatus(cap,{now:builtAt,offline:true}).status` and renders the result.
- `scripts/lib/release.mjs:268-280`: `compatibilityReference()` renders `${cap.status}` (the stored status) in the public compatibility summary, **without applying effectiveStatus**. Detailed cards label their value `Canonical Status`, which is a legitimate historical view when explicitly labelled.
- Independent evaluator probe: `{status:'DOCUMENTED',checked_at:'2026-10-10T00:00:00Z',expires_at:'2026-10-18T00:00:00Z'}` under `now:'2026-10-20T08:00:00Z'` gives **STALE**, while the compatibility renderer would output **DOCUMENTED** in its summary table.

**Impact:** Currently all 25 capability records have no expiry-based divergence, so this is a **latent** inconsistency, not evidence that today's matrix displays wrong statuses. However, when expiry or VERIFIED evidence is introduced, an installed agent could read `catalogue.md` and `compatibility.md` and receive conflicting support verdicts. This directly undermines the canonical effective-status promise.

**Correction:** Use the same frozen build clock and `effectiveStatus()` for all developer-facing *effective* status fields; if stored status is also useful, label both `Stored Status` and `Effective Status` explicitly. Add a fixture that mutates a formerly DOCUMENTED/VERIFIED capability to have expired evidence and asserts that all generated views downgrade together. Also cover offline high-risk VERIFIED semantics.

## Remaining finding F-FINAL-03 — P2: authored decision-guide examples duplicate canonical network and compatibility facts

**Evidence:** `authoring/qie-ecosystem/references/decision-guide.md:90-105` contains manually copied Mainnet/Testnet RPC URLs and chain IDs in its Hardhat example; lines 81–85 hardcode framework deployment status labels. The generated catalogue derives network facts from the canonical claim collection, but the authoring guide is copied as-is to the published bundle (`scripts/lib/release.mjs:324-330`). Existing tests check against the *current fixed hostnames*, not against arbitrary future changes to canonical claims.

**Impact:** The files are consistent in **this snapshot**, but editing a claim or status can cause the guide to silently become stale without build drift (the guide was never generated from the updated claim). This is a recurrence risk, not a current wrong-chain claim.

**Correction:** Render QIE network configuration examples from canonical claim placeholders or validate every published authoring literal/status against canonical facts at build time, including adversarial claim/status mutations. Keep compiler versions scoped to their own primary evidence, not generalized by network.

## Explicit residual release gates (not remediation defects)

- No live QIE RPC, wallet extension/browser integration, transaction signing/broadcast, finalized application verification, or actual QIE contract deployment has been independently demonstrated.
- Official Agent Skills validator and a real published-git-source installation remain separate release checks; local Skills CLI fixtures are not the same as public distribution acceptance.
- QIE native Cosmos interfaces, DEX router/ABI identities and oracle precompiles require additional operation- and network-scoped evidence; do not promote capabilities to VERIFIED without it.
- The S21 Remix docs URL was not accessible using the independent web retrieval available for this audit. This is **not** proof that the source does not exist; retain the actual repository acquisition receipt as the provenance evidence and re-check if necessary.

## Next actions

1. **Repair chronology F-FINAL-01 first** and recut/rebuild honestly from actual source-review and build timestamps.
2. Apply one shared effective-status projection to both catalogue and compatibility matrix (F-FINAL-02).
3. Add dynamic canonical-to-guide consistency protection for the Hardhat example and deployment statuses (F-FINAL-03).
4. Run `npm run build`, `npm run validate`, `npm run docs:check`, `npm run build:check`, `npm run lint`, `npm test`, `npm run test:coverage`, `npm run test:install` on the supported Node 24 toolchain and preserve logs.
5. Once corrected, accept B08 and proceed to B09 distribution/update/rollback with explicit separation between local test results and real QIE compatibility.

**Bottom line:** The original B08 independent-audit defects are substantially closed and code structure is strong. The new findings are focused consistency/provenance release gates, **not grounds for rewriting B02–B08**.
