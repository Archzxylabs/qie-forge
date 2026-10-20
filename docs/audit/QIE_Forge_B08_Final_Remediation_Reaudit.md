# QIE Forge — B08 Final Remediation Re-Audit

**Audit input:** the remediated working tree at release `0.5.1-ecosystem.1`, schema/policy `1.4.0`.
**Audit window:** 2026-10-19T22:07Z → 2026-10-19T22:18Z (UTC).
**Toolchain:** Node v24.20.0, npm 11.19.0.
**Method:** independent code reading, read-only gate execution and adversarial build probes in temporary directories. No file in the repository was created, edited or deleted by the auditor.
**Predecessor:** [QIE_Forge_B08_Final_Independent_Audit.md](QIE_Forge_B08_Final_Independent_Audit.md).

**Verdict:** the three findings of the final independent audit (F-FINAL-01, F-FINAL-02, F-FINAL-03) are **substantially closed**. The re-audit accepted all three as resolved and raised **one release-sign-off gap (P2-1)** in the guard itself, plus a set of hardening notes. P2-1 was closed after this audit; the disposition of every finding is recorded below.

## Findings and disposition

| ID | Severity | Finding | Disposition |
|---|---|---|---|
| F-FINAL-01 | P1 | Release and source-review timestamps were in the future | **Closed.** Release re-cut to the real build time; S21 carries the observed review time; a release-cut chronology gate with a documented five-minute tolerance rejects future `built_at` and future source reviews. |
| F-FINAL-02 | P1 | Inconsistent effective-status projection between views | **Closed.** Every developer-facing verdict is one `effectiveStatus()` projection at the frozen build clock; stored and effective statuses are published side by side and explicitly labelled; the packaged snapshot carries the projection too. |
| F-FINAL-03 | P2 | Authored examples duplicated canonical network and compatibility facts | **Closed, then guard-locked.** Authored content states canonical facts only through placeholders, and a build-time gate now rejects a hand-written chain identifier, canonical endpoint or support verdict. |
| P2-1 | P2 | The authored projections were not guard-locked: a one-token edit could re-introduce a hand-written chain ID or status label with a green build | **Closed after this audit** by `assertNoHandWrittenCanonicalFacts` (`scripts/lib/canonical-facts.mjs`) plus `tests/authored-facts-guard.test.mjs`. The one hand-written canonical endpoint the gate found in the published guide was replaced with a placeholder; the rendered output is byte-identical. |
| P2-2 | P2 | The packaged JSON snapshot published only the stored status | **Closed.** The published snapshot now carries `effective_status` and `effective_status_reason` for every claim and capability, computed at the frozen build clock. |
| P2-3 | P2 | The traceability gate is host-granular for source-derived hosts, so a fabricated path under an attested host would pass | **Accepted as a residual hardening item.** The gate's guarantee is stated as host-level traceability; tightening it to path-level for third-party hosts is recorded as follow-up work, not silently assumed. |
| P3-1 / P3-3 | P3 | Two implementations of the chronology rule, two tolerance constants, one dead export | **Closed after this audit.** `scripts/lib/chronology.mjs` is the single implementation and the single tolerance; the knowledge validator delegates to it. |
| P3-2 | P3 | The knowledge suite depended on the wall clock | **Closed after this audit.** The suite validates against a fixed clock; the real-clock behaviour stays covered by `tests/chronology.test.mjs`. |
| P3-4 | P3 | The "Deprecated & Conflicted" list published a bare stored status | **Closed after this audit.** It now publishes the effective status and labels the stored status when the two differ. |
| P3-5 | P3 | A domain's `verification_status` was published without projection | **Deliberately not projected.** A domain is verified by scoped validation runs, not by an expiry window; the canonical validator already requires that evidence, so projecting it would publish a wrong verdict. The decision is recorded in `docs/decisions.md`. |
| P3-6 | P3 | The internal evidence catalogue publishes stored status only | **Accepted.** The document is explicitly a verbatim dump of the canonical records, and the milestone reports carry the effective view; it is labelled as such. |
| P3-7 | P3 | Authored content may not link to third-party reference material | **Accepted by design.** In authored ecosystem content every absolute URL is a claim about QIE; in a published bundle third-party links are legal. The error text names the scope. |
| P3-8 | P3 | The retired-endpoint check is a raw substring match | **Accepted.** It is a deliberately explicit regression list of the endpoints earlier releases published. |
| P3-9 | P3 | The native Cosmos chain ID `qie_1990-1` cannot be projected | **Accepted.** The claim vocabulary is restricted to the operational EVM networks; the guide attributes the native chain ID to the Cosmos chain registry source, not to the EVM claims. |
| P3-10 | P3 | Test-count drift in the milestone documents | **Closed after this audit.** The executed evidence is regenerated by `npm run verify:evidence`, and the same script compares the figures the reports quote against the logs the run just wrote. |
| P3-11 | P3 | A mislabelled column in the network profile | **Closed after this audit.** The column is labelled "Stored evidence" only where it holds a stored value; the effective status has its own column. |
| P3-12 | P3 | The placeholder grammar documentation was incomplete | **Closed after this audit.** The grammar is documented once, in the module that implements it. |

## Gate results (independent re-run)

| Command | Exit | Outcome |
|---|---|---|
| `npm run lint` | 0 | JavaScript syntax checks pass; the repository has no TypeScript compiler or style linter by design. |
| `npm run validate` | 0 | 15 domains, 18 sources, 11 claims, 25 capabilities; 9 self-contained bundles valid. |
| `npm run docs:check` | 0 | The evidence catalogue matches the canonical knowledge records. |
| `npm run build:check` | 0 | All nine bundles reproduced byte-for-byte; `skills/` and `dist/skills/` are identical. |
| `npm test` | 0 | Full suite green. |
| `npm run test:install` | 0 | 20/20 Skills CLI installation fixtures (symlink and copy modes, offline). |
| Manifest and link graph | 0 | Every manifest SHA-256 matches its file; every local reference resolves; no unresolved placeholder is published. |

## What the re-audit confirmed as clean

- Every renderer evaluates the effective status at the same frozen build clock; no renderer evaluates a status at wall-clock time. The runtime helpers legitimately re-project at run time and never publish a stored value.
- No future timestamp exists in any release, knowledge or published artifact. The only future dates in the tree are quoted reproductions of the original defect and deliberate negative fixtures.
- The chronology gate bites: a future build, a future review, a review after the release cut, invalid timestamps and an invalid clock are all rejected; a tolerated skew and an unknown review time are accepted.
- Unknown, malformed, unsupported and unresolvable placeholders fail the build; nothing leaks into the published tree.
- The cross-view downgrade is regression-locked: an expired record downgrades in the catalogue, the matrix, the authored guide, the network profile and the evidence page together.

## Residual risk the release owner must know

- No live QIE RPC was contacted, no endpoint reachability, failover, rate limit or `eth_getLogs` block-range limit is known, no wallet extension was loaded, no transaction was signed or broadcast, no contract was deployed and no application effect was verified. Every published endpoint stays `DOCUMENTED`.
- The official Agent Skills validator was not run. The local installation fixtures are not public-distribution acceptance, and no published-git-source install has been performed.
- The chronology gate proves only that recorded timestamps are not in the future and that source reviews precede the release cut. It does not attest that a source was read.
- The five-minute clock-skew tolerance is fail-closed: a build host whose clock is more than five minutes behind `built_at` cannot re-cut the release without first re-cutting the context.
- `effectiveStatus()` can never promote a record, but it cannot detect a falsely recorded `checked_at` or `expires_at`; the truth of evidence metadata rests on the review process and the knowledge validator.
- The traceability gate attests a host, not a path, for source-derived hosts (P2-3). A fabricated repository or file path under an attested third-party host would still be published as "traceable". This is recorded as follow-up work.
- The native Cosmos chain ID remains an unprojectable authored literal (P3-9), correctly attributed to the Cosmos chain registry source.
