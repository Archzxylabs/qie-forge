# QIE Forge B09 — Independent Re-Audit of the Fixed Archive

**Date:** 2026-10-20  
**Input:** `QIE-FORGE-B09-FIXED-review.zip` uploaded by the owner.  
**Reported local HEAD:** `492e05554daaa3d0cbcf57f75562985a5f9ce3e7` (reported, **not independently provable from a Git archive**; the archive contains no `.git`).  
**Verdict:** **The previously reported P1-01/P1-02/P1-03 remediations pass focused independent regression checks. B09 remains PARTIAL overall, and further P2 hardening is recommended before treating installed metadata as fully trusted.**

## What was independently verified

1. Extracted the uploaded archive safely and inspected `scripts/lib/installed-release.mjs`, `scripts/lib/release-contract.mjs`, `scripts/verify-installed-release.mjs`, `scripts/lib/release-identity.mjs`, B09 fixtures, docs and evidence logs.
2. Compared this archive with the earlier `QIE-FORGE-B09-review.zip`: **19 existing files changed; 2 files added; no files removed**. The published `skills/` bundles are byte-identical between the two archives; no B08 evidence file changed.
3. Verified **exactly 9 skill manifests** and **103 published files** (`skills/`), including 94 non-manifest files. **94/94 SHA-256 hashes match** the declared manifest entries; no missing or unexpected published files.
4. Independently recomputed the content-addressed release ID from all 94 non-manifest files and frozen release context using the actual JavaScript implementation. It matches all nine published manifests: `b280364ed46be17d048f2b5c7c78485c8c35bb7172d123dd253f784fdf17b3ce`.
5. Executed **10 focused isolated adversarial checks; 10/10 passed**. These exercised the actual `inspectInstalledRelease()` implementation on disposable trees, including a redacted sentinel outside the package. No user installations, GitHub refs, or live networks were touched.
6. Reviewed archived evidence logs: they **report** `npm test` 280/280, `npm run test:install` 20/20, and coverage 96.15% lines / 88.56% branches / 97.96% functions at implementation commit `ceed1c88c9dc982e1dac09161e94e957f24cbb95`. This is **log review, not independent re-execution** of all gates.

**Environment limitation:** The audit runtime provides Node 22.16.0 rather than the pinned Node 24.20.0; `npm ci` could not complete, so real YAML/Ajv/Skills CLI dependencies were unavailable. For the isolated adversarial checks only, minimal *audit-only* YAML and manifest-shape shims were installed under ignored local `node_modules` to exercise the shipped verifier code. These shims **do not** prove that the official full Ajv schema compilation or Skills CLI matrix passes. Manifest structure, path constraints and file hashing were additionally inspected statically; hash checks themselves used the actual files and cryptographic hashes. No shim is part of the user ZIP or suggested production code.

## Reproduction of the three previously reported P1 bugs

### P1-01 — snapshot traversal and error leakage: **FIXED in focused checks**

**Source:** `scripts/lib/installed-release.mjs` around lines 207–381. The verifier now requires the manifest snapshot field to have an approved path, be a declared and physically present file, pass containment checks, avoid symlink escape, and remain under size ceilings. Parser errors are redacted.

**Executed regression:** An installed `qie` bundle was given `snapshot_path: '../sentinel.json'`, with a deliberately malformed sentinel outside the bundle. Result: `REJECTED`, with `UNSAFE_SNAPSHOT_PATH`; sentinel contents did not appear in serialized diagnostics.

**Evidence limit:** Concurrent malicious filesystem mutation / TOCTOU protection was not audited as a guarantee.

### P1-02 — fake nine-entry full suite: **FIXED in focused checks**

**Source:** `scripts/lib/release-contract.mjs` and `scripts/lib/installed-release.mjs` around lines 449–515. `--expect-suite` requires the **exact canonical nine names**, and `SKILL.md` must have valid matching frontmatter.

**Executed regressions:** Renaming the `qie` directory to `qie-fake` resulted in `REJECTED`, not `COHERENT_FULL_SUITE`. Changing `name: qie` in frontmatter to a different name produced `INVALID_SKILL_FRONTMATTER`. A correct nine-entry suite without a trusted pin has `publisherAuthenticity: NOT_ESTABLISHED`; a correct independent release-ID pin matches.

### P1-03 — unrelated skills and Claude projections: **FIXED in focused checks**

**Source:** `scripts/lib/installed-release.mjs` around lines 80–205 and 409–570.

**Executed regressions:** A valid nine-skill suite plus an unrelated legitimate skill resulted in `COHERENT_FULL_SUITE`, and that unrelated directory appeared only under `ignored`. Nine valid relative symlinks in sibling `.claude/skills` were recognized and passed. Replacing one with an absolute/broken link produced `REJECTED` and `ABSOLUTE_CLAUDE_LINK`.

### Metadata regression: **FIXED in focused checks**

Changing `generated` to false was rejected (`MANIFEST_NOT_GENERATED`). A `sources_checked_at` timestamp later than `built_at` was rejected (`FUTURE_SOURCES_CHECKED_AT`). An intentionally wrong independently pinned release ID was rejected.

## Additional findings — P2

### P2-NEW-01 — `suiteComplete` contradicts overall `REJECTED` status

**Location:** `scripts/lib/installed-release.mjs` lines ~508–554.

**Reproduced:** A correct full suite verified against the **wrong** expected release ID yielded `status: REJECTED`, `publisherAuthenticity: MISMATCH`, and yet `suiteComplete: true`. The overall verifier exit is still nonzero, so the CLI is fail-closed; however, another integration consuming just the `suiteComplete` field could mistake it for successful acceptance.

**Recommendation:** Define `suiteComplete` as structural completeness only and rename/document it clearly (e.g. `inventoryComplete`), **or** make `suiteComplete` false whenever any global blocking problem exists. Regression-test mismatched trusted pins and mixed global releases for boolean/status consistency.

### P2-NEW-02 — editable manifest provenance timestamp is not protected by the release ID

**Location:** `scripts/lib/release-identity.mjs` (excludes every manifest by design); `scripts/lib/installed-release.mjs` around lines 242–255 and 520–530.

**Reproduced:** Modified only `skills/qie/MANIFEST.json` by replacing `sources_checked_at: 2026-10-19T00:08:45Z` with `2026-10-19T22:35:15Z` (equal to `built_at`). The verifier still returned `COHERENT_FULL_SUITE`, zero problems, and `publisherAuthenticity: PINNED_MATCH` against the original trusted release ID. This does **not** invalidate the content-addressed digest of non-manifest files; it shows that the manifest-only provenance field is not authenticated by that digest.

**Recommendation:** Explicitly define `PINNED_MATCH` as a **payload identity match, not a guarantee about mutable manifest-only metadata**. Consider cross-checking `sources_checked_at` against the selected snapshot's source timestamps, or publishing a separately authenticated canonical manifest index outside the self-hashing tree. Avoid adding manifests to the current release-id hash without a carefully defined non-circular scheme.

### P2-NEW-03 — previously excluded upstream-brand terms reintroduced in audit prose

**Location:** `docs/audit/QIE-FORGE-B09-independent-audit.md:14`.

**Observed:** The copied earlier audit report contains the literal old upstream project and owner identifiers in a sentence describing a negative scan. A case-insensitive scan of the fixed archive finds these in the audit document, despite the owner's explicit goal of excluding this branding from the canonical repository. There is no evidence that executable QIE code or a generated skill bundles that material.

**Recommendation:** Rewrite the sentence using provenance-neutral language such as "excluded third-party research identifiers" while preserving the substance and dates of the finding. Before pushing, scan tracked files for the unwanted identifiers; retain any legally required attribution, if actual licensed content ever gets introduced.

## Open acceptance gate — B09 remote distribution

`docs/b09-results.md` correctly labels B09 PARTIAL. The recorded authenticated GitHub-source proof installed the older B08 SHA `cf16d07`, **not the new B09 HEAD**. The corrected B09 archive alone cannot prove remote authenticated distribution from GitHub. Public anonymous installation remains untested, and private authenticated testing is not proof of public installation. Updating copied Claude projections may still switch them to symlinks because of the pinned upstream Skills CLI. A successful CLI update alone does not prove bundle integrity; invoke the read-only verifier after it.

**Recommended next sequence:** (1) address P2 reporting/hygiene issues or explicitly document the manifest-authenticity limit; (2) rerun the official eight gates on pinned Node 24/Skills CLI 1.7.2; (3) publish **only** the reviewed feature branch to the PRIVATE GitHub repository; (4) test the immutable full B09 SHA, check manifest digests and release ID, including suite/single and copies/symlinks as appropriate; (5) review a PR, and only then decide whether to merge to `main`. Do not claim public readiness without separate public testing and the license decision.

## Decision

**Previous P1s: PASS (focused adversarial re-test).** No new P1 was found in the tested surface. **B09 overall: PARTIAL** pending real B09 remote-source evidence and the above P2 clarifications. **The feature branch can proceed to a carefully reviewed PRIVATE GitHub test after minor hardening; do not treat this as an unconditional public release approval.**
