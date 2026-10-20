# QIE Forge B08 — Consolidated Independent Review

**Basis:** Codex independent review as pasted by user; separate source inspection of `QIE-FORGE-B08-review.zip`; prior `QIE_Forge_B08_Independent_Audit.md`. No new repository changes assessed; conclusions apply to the uploaded B08 snapshot. **Verdict: HOLD B08 / DO NOT START B09.**

## Concordance

| Codex finding | Earlier independent audit | Resolution |
|---|---|---|
| P1 conflicting RPC/explorer configuration | F-B08-01 | Same defect; canonical network profiles and generated references must agree |
| P1 hard-coded compatibility statuses | F-B08-03 | Same defect; derive tool/operation status from capabilities and effective-status evaluator |
| P1 weakened address identity gate | Subfinding in F-B08-03 | Same issue, Codex adds clear issuer/ABI deficiency; source-claimed precompile address must not be treated as trusted/operational |
| P2 source-ID provenance mismatch | F-B08-02 | Same defect; exact ID-to-URL reconciliation required |
| P2 substring category misclassification | Not separately listed | Additional confirmed defect in `scripts/lib/release.mjs:207` |
| P2 incorrect report/counts and explorer status | F-B08-04 | Same defect; generate counts/status summaries from canonical data |

## Additional independent findings not fully covered by the six-point Codex summary

1. **Unsafe operational certainty (F-B08-05):** fixed Cosmos staking fee in `authoring/qie-ecosystem/references/decision-guide.md:135-138`, non-provider-verified `eth_getLogs` range advice around lines 109-120, and overstated absence of hosted indexers in the ledger. Remove unjustified transactional defaults; label heuristics and negative searches correctly.
2. **Missing invariant tests (F-B08-06):** 216 passing tests did not detect the source/network/status/category contradictions. Add cross-artifact and deliberate mutation/negative tests.
3. **Further evidence hygiene:** distinguish local Solidity compiler/EVM targets from documented QIE deployment support; confirm stable wallet extension identity and package availability; preserve timestamps and source revisions for compatibility claims.

## Source-specific observations reproduced in B08 ZIP

- `scripts/lib/release.mjs:186-202`: manually maintained `toolsSummary` including status and product descriptions rather than deriving from canonical capability records.
- `scripts/lib/release.mjs:207`: substring classification `c.tool_id.includes(t) || c.capability_id.includes(t)` permits `qiedex` to match `qied` (native category); the `unidentified-indexer` record does not match category tool tokens.
- `scripts/lib/release.mjs:230-233`: manually authored network RPC/explorer strings differ from network claims recorded in `knowledge/claims.yaml`.
- `authoring/qie-ecosystem/references/decision-guide.md:61-64`: asks for an explorer-verified router and `eth_getCode`, but omits full issuer/source/ABI/identity checks; nonempty code is not sufficient for product identity.
- `docs/evidence/b08/source-ledger.md` vs `knowledge/sources.yaml`: conflicting source IDs S08, S09, S12, S13, S14, S15, S18.
- `docs/b08-results.md:39`: reports 25 capabilities but misstates breakdown (11 DOCUMENTED + 8 UNKNOWN, which sums to 26 when combined with other categories). Actual canonical values: 25 = 9 DOCUMENTED + 9 UNKNOWN + 2 CLAIMED + 2 UNSUPPORTED + 2 DEPRECATED + 1 CONFLICTED + 0 VERIFIED. Canonical `explorer-verification-api`: UNKNOWN.
- `authoring/qie-ecosystem/references/decision-guide.md:135-138`: executable native delegation example contains an unsupported fixed fee.

## Unified remediation acceptance criteria

1. Reconcile all canonical source IDs, URLs, titles, and associated claim references. Capture genuine source evidence or downgrade uncertainties; no invented provenance.
2. Eliminate manually duplicated RPCs/explorers/chain IDs and tool statuses from release rendering. Derive from canonical validated snapshots and effective-status evaluation. Alternate endpoints must have independently attributable sources if published.
3. Define explicit non-substring product-to-category mapping in canonical data and prove QIEDex/indexer/native placement is correct.
4. Strengthen DEX and precompile address restrictions: do not treat an address in documentation, a successful receipt, or nonempty bytecode as proof of issuer/product/ABI identity. If shown as a historical or source-claimed lead, visibly mark non-operational/unverified; never use it in executable flows until the release gate is met.
5. Correct reports, overbroad compatibility language, absent indexer claims, fixed staking fee assumptions, and RPC query bounds. Report statuses and counts from actual canonical data.
6. Implement regression tests that **fail when deliberate contradictions are injected** across data, source ledger, generated skill bundles, category mapping, and docs. Preserve all B02–B07 regressions.
7. Rebuild all nine skills; run build/validate/build:check/lint/npm test/coverage/Skills CLI installations, with actual logs and immutable manifests. Separate mocked/local tests from live QIE evidence. No signing/broadcast or new infrastructure.
8. Produce a findings resolution table, source reconciliation, before/after outputs, test logs, and B08 PASS/PARTIAL/BLOCKED verdict. **B09 begins only after evidence/source correctness gates pass.**

**Caution:** The user-provided Codex review claims independent reruns; this consolidated file does not independently re-execute its 216 tests or 20 installation tests.
