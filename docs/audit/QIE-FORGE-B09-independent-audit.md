# QIE Forge B09 — Independent Source & Adversarial Audit

**Audit date:** 2026-10-20  
**Input:** user-supplied `QIE-FORGE-B09-review.zip` (Git archive claimed from `feat/b09-distribution` HEAD `12c575993f5e753134594be6e9197b55a1b61a6a`)  
**Verdict:** **PARTIAL / HOLD for B09 acceptance and remote publication**. The packaged release identity and file hashes are internally consistent, but three reproduced P1 findings require remediation. Remote B09 distribution remains separately unproven.

## Audit method and boundaries

- Inspected actual implementation, tests, documentation, generated skill bundles, manifest schema and recorded B09 evidence.
- Independently checked all **94 non-manifest files across 9 skills** against `MANIFEST.json`: **0 hash mismatches** and **0 missing/extra declared files**. All nine manifests carry the same `release_id`.
- Independently recomputed the suite SHA-256 using the published canonical-input algorithm and Node `localeCompare('en')` path ordering: **`b280364ed46be17d048f2b5c7c78485c8c35bb7172d123dd253f784fdf17b3ce`**, matching all nine manifests.
- Reproduced adversarial verifier behavior in isolated temporary directories, using a minimal, import-only YAML shim because the review environment has **Node v22.16.0**, whereas the project requires **Node v24.20.0**, and npm dependencies were not available offline. The YAML parsing functionality was **not** used by the verifier in these tests. No installed user skills, GitHub branches or remote sources were changed.
- Inspected preserved evidence that reports **277/277 unit/integration tests**, **20/20 local installer tests** and **8/8 named B09 gates** from implementation commit `c1253b9`. These numbers were **not independently re-executed** using the pinned full toolchain; the archive has no `node_modules` and the required npm tarballs were not cached. The final archive's HEAD is claimed to be `12c5759`, not the commit shown in the saved test logs.
- Static scan of extracted source found no unwanted third-party-research branding matching `monskills` or `therealharpaljadeja`.
- The ZIP does **not** contain `dist/skills/` (ignored generated output), so byte parity of staging/publication can be evaluated from the preserved build logs, but not independently reproduced from archive alone in this environment.

## P1 — Required remediation

### P1-01: Snapshot path traversal reads outside the installed skill

**Location:** `scripts/lib/installed-release.mjs:66–80`, particularly `path.join(directory, manifest.snapshot_path)` and subsequent `readFile`.

**Problem:** The installed verifier consumes an untrusted `MANIFEST.json` but does **not** enforce the strict manifest schema's snapshot-path enumeration, nor require `snapshot_path` to be an included, contained file. Relative `../` components are accepted and can make the read escape the installed skill directory. For invalid JSON, a portion of the outside file's contents can be echoed in the returned `UNREADABLE_SNAPSHOT` error string. This breaks the intended read-only containment boundary and can expose sensitive file fragments through console output or saved logs.

**Reproduction (isolated synthetic data):** Copied only `skills/qie` to a temporary installed root; modified its manifest to point `snapshot_path` at `../../OUTSIDE-BUNDLE-SENTINEL.json` and placed a deliberately invalid, harmless sentinel file outside the installed root. The returned error included `Unexpected token 'S', "SENTINEL_P"...`, confirming that content outside the skill was read and partially reported.

**Required fix:** Validate manifest structure and `snapshot_path` using the existing schema or the identical strict runtime constraints; check path containment and symlink resolution **before** any read; require the snapshot to be present in `manifest.files` and the actual package inventory; avoid echoing untrusted parser excerpts into verifier output. Add malicious `../`, absolute-path, symlink-escape, unreadable and oversized-snapshot tests.

### P1-02: `--expect-suite` can report a fake nine-skill inventory as complete

**Location:** `scripts/lib/installed-release.mjs:136–164` and `scripts/verify-installed-release.mjs:11–37`.

**Problem:** The publicly documented CLI does not supply `expectedSkills`. With `--expect-suite`, suite completeness is inferred from the **count of nine directories**, not the canonical skill names. The validator can recompute an internally consistent release ID for an arbitrary nine-name inventory without checking that it is the intended QIE Forge suite. It also does not validate `SKILL.md` frontmatter against the containing directory.

**Reproduction:** Copied all nine published skills; renamed the `qie` directory to `qie-fake`; updated that manifest's `skill_id`, then recomputed and consistently updated all nine `release_id` fields. The files within the renamed skill still contained the original `qie` frontmatter. Running `inspectInstalledRelease(..., {requireSuite:true})` returned **`COHERENT_FULL_SUITE` with zero problems**, even though the `qie` router directory was absent. This shows a *false completeness assertion*, not a break in SHA-256.

**Required fix:** Make `--expect-suite` compare against the actual enabled canonical skill set (either a trusted local release contract or an explicit, source-derived expected set). Validate frontmatter name against its directory; require `--release-id` from a trusted/pinned source when authenticating the release identity, and distinguish **internal coherence** from **publisher authenticity**. Add tests for replaced/missing router, wrong names and recomputed-but-untrusted manifests.

### P1-03: Real agent directories with unrelated skills/symlink projections are unsupported by the verifier

**Location:** `scripts/lib/installed-release.mjs:111–118`, `:136–154` and README command under "Install the skills".

**Problem:** Every immediate directory under `.agents/skills` is interpreted as a QIE Forge skill, so an unrelated legitimate installed skill lacking QIE Forge `MANIFEST.json` produces a rejected installation. Conversely, top-level symlink entries (`Dirent.isDirectory() === false`) are ignored entirely. This is relevant because the pinned installer creates `.claude/skills/<name>` as symlinks by default.

**Reproduction:** (a) A valid nine-skill suite plus one normal unrelated directory with `SKILL.md` was reported **`REJECTED`** (`MISSING_MANIFEST other-legit-skill`, `INCOMPLETE_SUITE: expected 9 installed skills, found 10`). (b) A root containing a symlink to a valid `qie` bundle reported **`REJECTED / NO_SKILLS`** with zero discovered skills.

**Required fix:** Scope verification to the named QIE skills from a trusted list/lock metadata, distinguish unrelated siblings from malformed QIE bundles, and explicitly inspect and validate Claude Code's copy/symlink projection (relative link correctness, target under expected canonical root, and alignment with canonical bytes). Add coexistence and broken/misdirected projection tests. Do not follow arbitrary symlinks without confinement.

## P2 — Follow-up corrections

### P2-01: Manifest metadata and schema support are only partially validated

**Location:** `scripts/lib/installed-release.mjs:9–17`, `:66–89`, `:136–164`.

The installed verifier uses bespoke loose checks instead of validating all required manifest fields and the supported manifest/schema contract. In an isolated test, changing a single skill's `generated` field to `false` and `sources_checked_at` to **2099-01-01** still produced **`COHERENT_PARTIAL`, zero problems**, with no file changes. Those fields are not included in the release ID (manifest exclusion is intentional), so the verifier must either validate and compare them with trusted release metadata or explicitly mark them unauthenticated.

**Suggested fix:** Reuse the manifest schema's field constraints; validate timestamp chronology and `generated === true`; define supported schema compatibility, not just equality between installed peers. Add negative fixtures for malformed/future timestamps and unsupported individual schema versions. Explicitly document which mutable metadata fields are outside the content address.

### P2-02: Evidence was recorded on an earlier commit than the final reported HEAD

**Location:** `docs/evidence/b09/{build,validate,build-check,docs-check,lint,tests,coverage,installation}.txt`.

All eight saved logs identify implementation commit **`c1253b972feb4f34719da85b75e6c4b1b6e6a163`**. The final reported HEAD is **`12c575993f5e753134594be6e9197b55a1b61a6a`**. This is understandable because later commits are reported as evidence/docs-only, but final-HEAD acceptance should be established with new clean-checkout gate results rather than inferring that the same gate outputs apply unchanged. If re-running the evidence script changes logs, document that expected generated-evidence diff and commit the updated results separately.

### P2-03: Distribution and update limitations are accurately disclosed but remain unclosed

**Location:** `docs/b09-results.md:80–135`, `docs/evidence/b09/github-private.txt`.

The private GitHub proof installed **B08** bundles at `cf16d07`, not B09. The B09 branch was not on remote at this evidence cut. Public/anonymous installation remains untested, and the pinned Skills CLI can silently accept corrupt updates, change copy mode to symlinks, or no-op on local-source `update`. These are documented limitations and not independent newly discovered regressions, but they remain gates to a broader distribution-readiness claim.

## Confirmed strengths

- Entire nine-skill published set and **94 file hashes** match their manifests, with one independently reproducible content-addressed ID.
- No evidence of generated-file drift within the shipped archive; the `release-info.md` and manifest identity model does not self-hash the manifest.
- Offline and Git smart-HTTP tests use actual installer behavior rather than only mocks, according to the inspected code and recorded logs.
- Rollback fixtures compare installed bytes to known-good trees and do not mistake a CLI exit code for verified content.
- The report explicitly distinguishes **local/private** evidence from **public remote B09** distribution and discloses non-atomic CLI updates and copy-mode drift.
- All nine skill bundles remain present in the archive; five canonical recipe directories remain present.

## Release decision and prioritized next actions

**Decision: HOLD B09 acceptance and GitHub branch publication pending the three P1 fixes**. The source archive is sound in its content-addressing design but the verifier needs stronger safety and correct suite selection before users rely on it after updates.

Recommended engineering sequence:

1. Fix and regression-test untrusted snapshot-path containment and error redaction (P1-01).
2. Make complete-suite acceptance depend on the exact canonical inventory and trusted reference identity, with frontmatter checks (P1-02).
3. Support coexistence with other agent skills, and validate Claude Code copy/symlink projections without leaving the package trust boundary (P1-03).
4. Tighten manifest metadata/schema validation and rerun adversarial fixtures (P2-01).
5. Re-run full pinned toolchain gates on the final corrected HEAD and capture the exact commit in evidence (P2-02).
6. Review and push **only** the corrected B09 branch to GitHub **Private**, verify install from its immutable SHA, and create/review a PR before merging to `main`. No need for an unreviewed force-push, public release, tag or destructive history operation.

This audit does not claim to have re-executed the complete 277-test suite or the public GitHub distribution matrix. It independently verifies the package hashes and directly reproduces the three P1 failures with synthetic test data.
