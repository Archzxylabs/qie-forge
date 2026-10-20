# QIE Forge — B08 Final Integrity Corrections — Results

**Subject:** the three remaining findings of `docs/audit/QIE_Forge_B08_Final_Independent_Audit.md` (F-FINAL-01, F-FINAL-02, F-FINAL-03), corrected on release `0.5.1-ecosystem.1` (schema/policy `1.4.0`).

**Scope:** corrections only. B08 was not restarted, the nine released skills were not rewritten, the canonical knowledge architecture, the source-ledger reconciliation, deterministic packaging and every prior capability were preserved. No B09 work, no new infrastructure, no CLI, MCP server, database, website or reference dApp was added.

**Environment:** Node.js `v24.20.0`, npm `11.19.0` (the toolchain declared in `package.json` / `.node-version`), Linux, all timestamps in this document are UTC.

**Verdict:** **ACCEPTED for B08 with the residual release gates below.** All three findings are reproduced, corrected and locked behind adversarial tests. The release is honest about its own chronology, every developer-facing support verdict now comes from one canonical projection, and authored guidance can no longer drift from the canonical records. The residual gates listed in §8 are unchanged from the audit and still apply.

---

## 1. Truthful timestamps

| Item | Value | How it was established |
|---|---|---|
| Release cut (`release-context.json` → `built_at`) | `2026-10-19T22:35:15Z` | The UTC instant at which this release was cut and the nine bundles were generated. It is in the past relative to the verification run and is embedded verbatim in all nine manifests. |
| Source reviews S00, S01, S03, S04, S08, S09 | `2026-10-19T00:08:45Z` | Unchanged genuine review times from the original acquisition. |
| Source reviews S10 – S20 | `2026-10-19T17:00:00Z` | Unchanged genuine review times from the original acquisition. |
| Source review S21 (Remix deployment guide) | `2026-10-19T21:37:00Z` | The URL was re-retrieved during this correction pass and the page was reachable. Its content — an `Injected Web3` environment with MetaMask, no compiler version, no EVM target — matches the canonical `remix-deploy` record exactly. A second, independent re-retrieval at `2026-10-19T21:44:49Z` is preserved with its HTTP response headers, the exact body and the SHA-256 of that body in `docs/evidence/b08-final/` (`s21-remix-guide-receipt.md`, `s21-remix-guide-headers.txt`, `s21-remix-guide-body.md`). The recorded time is the observed re-retrieval time; no earlier or invented time was used. |
| Verification run | see the header of each preserved log in `docs/evidence/b08/` | Each log records the exact command, the Node version and the UTC time of the run that produced it. |

The audit's central provenance defect is gone. The submitted release claimed `built_at: 2026-10-20T08:00:00Z` and a source review at `2026-10-20T06:00:00Z` — both roughly nine and eleven hours *after* the archive those dates claimed to describe already existed, in UTC, so not a timezone reading. Nothing in the repository carried a fabricated replacement: the release cut is the real cut, the source review is the real re-retrieval, and a review time that could not be substantiated would have been recorded as `null` with the dependent operation kept conservative (the chronology gate and the knowledge schema both accept `null` review times for exactly that case).

## 2. Finding F-FINAL-01 — release and source-review timestamps in the future

**Reproduced.** Yes. `release-context.json` carried `built_at: 2026-10-20T08:00:00Z` and `knowledge/sources.yaml` carried `reviewed_at: 2026-10-20T06:00:00Z` for S21, while the repository snapshot and the audit clock (`2026-10-19T20:52–20:57Z`) were earlier. The pre-existing validator only enforced `reviewed_at <= built_at`, so a consistent pair of *future* timestamps passed every gate, including `build:check`.

**Root cause.** The knowledge validators were pure functions of the records and had no notion of real time, so "a build that claims to happen later than now" was indistinguishable from a legitimate one. Nothing on the release path compared a recorded timestamp against the wall clock.

**Corrections.**

- `scripts/lib/chronology.mjs` (new) — the release-cut chronology gate. It compares the release cut and every source review timestamp against the observed clock, rejects a review that follows the release cut, rejects an unparseable timestamp, and rejects a missing or invalid clock. The tolerance is explicit and documented: `CLOCK_SKEW_TOLERANCE_MS = 5 * 60 * 1000` (five minutes) — far below the multi-hour offsets the gate exists to catch, and documented rather than hidden.
- The gate runs on both release paths: `scripts/validate-knowledge.mjs` (validation) and `scripts/lib/release.mjs` → `buildRelease()` (build and `build:check`).
- `scripts/lib/knowledge.mjs` keeps a matching chronology check with an injectable clock, so the deterministic validators can be exercised with frozen fixtures and never depend on real time.
- The release context was re-cut to the real build instant and every bundle, manifest, snapshot, reference page and release document was regenerated from it. The nine `references/release-info.md` pages now state the same cut and the same source-review derivation.

**Evidence.** `tests/chronology.test.mjs` (gate behaviour, skew tolerance, unknown review times, frozen-clock fixtures), `tests/knowledge.test.mjs` (future build, future review, tolerated skew, review after the cut), and the chronology gate on the build and validate paths. The frozen build clock is preserved separately from the real-time gate: the fixtures inject a clock, and the deterministic packaging tests still reproduce byte-identical bundles.

## 3. Finding F-FINAL-02 — inconsistent effective-status projection

**Reproduced.** Yes. `catalogueReference()` projected the canonical record through `effectiveStatus()`, while `compatibilityReference()` published the raw stored `cap.status` in its summary table. An independent probe showed the split concretely: a `DOCUMENTED` record whose evidence expired before the build clock is `STALE` for the evaluator, but the compatibility summary would still have published `DOCUMENTED`. The matrix and the catalogue inside one bundle could therefore disagree about whether an operation was supported.

**Root cause.** Two renderers, two status sources, and no single frozen evaluation clock shared by the developers' views.

**Corrections.**

- One projection, computed once per bundle: `scripts/lib/release.mjs` projects every selected claim and capability through the shared non-promoting `effectiveStatus()` evaluator at the frozen build clock and stores the result on the snapshot record as `effective_status` / `effective_status_reason`, with `status_evaluated_at` recording the clock. Every renderer — catalogue overview, compatibility summary and cards, A–Z coverage map, network profiles, selected-evidence pages and the authored decision guide — reads that one projection. The authored guide resolves `{{effective:<capability>}}` through the same evaluator and the same clock.
- Stored and effective statuses are published side by side and always labelled: `Stored Status` and `Effective Status` in the matrix, `Stored evidence` and `Effective status` in the network profiles, `stored` and `effective` in the selected-evidence pages, and `(stored: …)` in the coverage map. No view presents a stored status as an effective verdict.
- The installed snapshot carries the verdict with the record it belongs to (`effective_status`, `effective_status_reason`), so an agent that reads only `data/*.json` reaches the same conclusion as one that reads the rendered pages.
- No status can be silently promoted: the projection can preserve the stored status or downgrade it, never upgrade it, and the guards assert that property directly.

**Adversarial evidence (all executed).**

| Case | Where it is proven |
|---|---|
| Expired `DOCUMENTED` evidence | `tests/status-projection.test.mjs` (claim), `tests/ecosystem.test.mjs` (capability) — the catalogue, the matrix, the guide and the network profile all downgrade to `STALE` together |
| Expired `VERIFIED` evidence | `tests/final-integrity.test.mjs` — a capability promoted to `VERIFIED` with expired, reviewed PASS evidence is published as `STALE` in the catalogue, the matrix, the card, the authored guide and the installed bundle, while the stored `VERIFIED` stays visible and labelled |
| Offline high-risk `VERIFIED` evidence | `tests/final-integrity.test.mjs` and `tests/installed-snapshot-status.test.mjs` — a critical-risk chain-identity claim with fresh, non-expired execution evidence is published as `UNKNOWN` offline, and the installed offline helper reaches the same verdict from the installed snapshot |
| Consistent results across catalogue, compatibility matrix and installed snapshots | `tests/final-integrity.test.mjs` (every capability in the installed snapshot is compared against both rendered views and the canonical projection) and `tests/installed-snapshot-status.test.mjs` (installed snapshot versus every rendered view, plus the no-silent-promotion property) |

## 4. Finding F-FINAL-03 — authored examples duplicating canonical network and compatibility facts

**Reproduced.** Yes. `authoring/qie-ecosystem/references/decision-guide.md` hard-coded the mainnet/testnet RPC URLs and chain IDs in its Hardhat example, and hard-coded operational compatibility labels (`status: CLAIMED`, `status: UNKNOWN`, "deployment remains `UNKNOWN`", "the canonical V3 Mainnet chain ID is **1990**", the legacy chain-ID states). The published catalogue derived network facts from the canonical claims, but the guide was copied verbatim, so a claim or status edit could make the guide silently stale with a green build.

**Root cause.** Authored prose was allowed to restate facts that canonical records own. There was no build-time check that an authored literal still agreed with the canonical data.

**Corrections.**

- Canonical facts in authored content are now *placeholders*, resolved at build time from the skill's own canonical snapshot: `{{claim:<network_id>:<predicate>}}`, `{{hex:<network_id>:<predicate>}}`, `{{stored:<capability_id>}}` and `{{effective:<capability_id>}}` (plus `{{capability:…}}` and `{{source:…}}` field accessors). The grammar is fixed and strict: an unknown kind, a malformed claim token, a token that matches no canonical claim, and a token that names no capability selected into the bundle all fail the build instead of publishing as literal text.
- The authored guide now expresses every network fact and every operational compatibility label through those placeholders: the Hardhat network block, the wallet chain IDs, the testnet switch identifier, the framework matrix, the DEX and indexer verdicts, the foundry deployment verdict and the legacy/conflict chain-ID states.
- Two build-time guards were added in `scripts/lib/canonical-facts.mjs`:
  - **hand-written-fact guard** — authored content with the placeholders removed is inspected, and a hand-written chain identifier, a hand-written canonical endpoint, or a hand-written support verdict that contradicts the canonical record fails the build. A general statement about the status vocabulary stays allowed, because it is not a verdict about a specific record.
  - **URL traceability guard** — every absolute URL published in a bundle must resolve to a host attested by canonical data. In authored ecosystem content every absolute URL must be canonical; a published bundle may still link to third-party reference material, because such a link is not a claim about QIE. The QIE-owned domains are derived from the canonical claim values, so the rule cannot itself drift, and the endpoints this release retires (`qiescan.org`, `rpc-main1.qie.digital`, `rpc-testnet.qie.digital`) are rejected outright.

**Mutation evidence (all executed).** `tests/ecosystem.test.mjs` and `tests/final-integrity.test.mjs` mutate a fixture copy of the canonical data and prove that the stale literal cannot survive: changing the canonical mainnet RPC URL projects into the catalogue and the guide and removes the previous literal; changing the canonical mainnet chain ID to `1991` republishes `1991` and `0x7c7` in the guide and the network profile and leaves no `1990` / `0x7c6` behind. `tests/authored-facts-guard.test.mjs` proves that a hand-written chain ID, endpoint or support verdict in the authored guide fails the build.

## 5. Additional corrections made in this pass

- **Report/log cross-check moved out of the suite.** The milestone reports quote executed test counts and coverage figures. Comparing a report against the log of the *previous* run inside the test suite cannot bootstrap a changed test count — the run that refreshes the log would fail against the stale log it replaces. The comparison now runs in `scripts/verify-evidence.mjs` after the logs are written, so it compares each report against the log of the run that just happened. The test count and the installation count are compared exactly; the coverage figures are compared with a documented tolerance of 0.1 percentage point, because V8's block coverage is not bit-stable for lazily executed paths. The suite keeps the checks that do not depend on a run (the quoted release cut is the canonical cut).
- **Deterministic coverage.** `scripts/lib/io.mjs` used a dynamic `import('node:fs/promises')` inside a hot function; V8's block coverage for it was not stable between runs, so the quoted branch figure moved by 0.02 points from run to run. The import is now static and two consecutive coverage runs produce byte-identical figures.
- **README refreshed** for the ninth skill, the twenty installation fixtures, the new gates (`docs:check`, `test:install`, `verify:evidence`) and the chronology rule on `release-context.json`.

## 6. Executed verification

Every command below was executed on the supported toolchain (Node `v24.20.0`, npm `11.19.0`) against the final tree. The complete, untruncated output of each run is preserved in `docs/evidence/b08/`, and `npm run verify:evidence` re-executes all of them in one deterministic pass.

| Command | Result |
|---|---|
| `npm run build` | PASS — nine bundles generated: `qie`, `qie-networks`, `qie-smart-contracts`, `qie-frontend`, `qie-wallets`, `qie-transactions`, `qie-deployment`, `qie-debug`, `qie-ecosystem`; no live network check performed |
| `npm run validate` | PASS — knowledge valid: 15 domains, 18 sources, 11 claims, 25 capabilities; 9 self-contained skill bundles validated |
| `npm run docs:check` | PASS — the evidence catalogue matches the canonical knowledge records |
| `npm run build:check` | PASS — all nine bundles reproduced byte-for-byte from the canonical inputs |
| `npm run lint` | PASS — JavaScript syntax checks (no style linter or TypeScript compiler is configured) |
| `npm test` | PASS — **270/270** unit and integration tests, 0 failed |
| `npm run test:coverage` | PASS — 270/270; **97.72% lines, 88.37% branches, 98.92% functions** |
| `npm run test:install` | PASS — **20/20** Skills CLI installation fixtures (full suite plus each of the nine skills, symlink and copy modes) |
| `npm run verify:evidence` | PASS — all nine gates green, and both milestone reports quote the executed figures |

## 7. Bundle integrity

- Nine bundles are published: `skills/` and `dist/skills/` are byte-identical, **103 files each**.
- Every bundle carries its own `MANIFEST.json` with the SHA-256 of every file it contains; the hashes are verified by the installation fixtures against the installed copy, and `build:check` verifies the published bytes.
- All nine bundles install independently into a clean consumer project (10 selections × symlink/copy = 20 fixtures), and the installed `qie-ecosystem` and `qie-networks` bundles reproduce the published verdicts from their own snapshots.
- The manifest-declared release cut is the canonical cut, and the derived `sources_checked_at` never follows it.
- A separate read-only verification pass is preserved in `docs/evidence/b08-final/independent-checks.txt`: it re-verifies every manifest digest, the equality of the two published trees, the chronology of every source review against the release cut, the presence of an effective-status row for all 25 capabilities in the compatibility matrix, the presence of the canonical network facts in the catalogue, the release cut in all nine `release-info.md` pages, and the absence of contract-address literals, retired endpoints and unresolved placeholders in every published file. It reports `No problems found.` The checker itself is kept at `docs/evidence/b08-final/independent-verify.mjs` (read-only, re-runnable), and the independent pass is written up in `docs/evidence/b08-final/independent-verification.md`.

## 8. Remaining limitations (unchanged by this pass)

- **No live QIE verification.** No QIE RPC endpoint was contacted, no wallet extension was loaded, no transaction was signed or broadcast, no contract was deployed, and no capability was promoted to `VERIFIED`. The `verify-network` / `verify-transaction` helpers remain read-only and fail closed.
- **The chronology gate proves timing, not reading.** It shows that no recorded timestamp is in the future. It does not attest that a source was read; `docs/evidence/b08/source-ledger.md` remains the provenance record, and the S21 entry rests on the re-retrieval whose receipt, headers, body and digest are preserved in `docs/evidence/b08-final/`. The retained body digest was deliberately *not* written into `knowledge/sources.yaml` in this pass, because that would change every bundle digest and belongs to a deliberate release cut rather than to a verification side-channel.
- **Offline high-risk evidence is never a support verdict.** A `VERIFIED` record for a high- or critical-risk operation is published as `UNKNOWN` in an offline bundle by design. That is a limitation of offline publication, not a defect, and it is stated in the published pages.
- **The hand-written-fact guard is a heuristic.** It rejects the literal patterns the audits found; it cannot prove that arbitrary prose is free of interpretation. The canonical projections remain the authoritative source.
- **Distribution remains a separate gate.** The official Skills validator, public git-source installation, agent activation inside a real agent, and the B09 distribution/update/rollback work are not part of this release and were not attempted.
- **Native Cosmos identity is registry-sourced.** The Cosmos chain ID and denomination in the decision guide are attributed to the published chain-registry source and are deliberately not mixed into the EVM claim model; they are not projections of an EVM canonical claim.

## 9. Final acceptance verdict

**B08 is accepted for the `0.5.1-ecosystem.1` release cut with the corrections in this document.** The three remaining audit findings are closed:

1. the release and source-review timestamps are grounded in real time and are now gated against future dating;
2. one canonical effective-status projection, at one frozen clock, drives every developer-facing verdict in every view, with stored and effective statuses labelled separately and no silent promotion;
3. authored network facts and compatibility labels are build-time projections of the canonical records, protected by mutation tests and by build-time guards.

The nine released skills, the canonical knowledge architecture, the source-ledger reconciliation, deterministic packaging and all prior functionality are preserved; the residual gates of §8 are unchanged. B09 distribution work may proceed on this release cut, keeping the separation between local verification results and real QIE compatibility explicit.
