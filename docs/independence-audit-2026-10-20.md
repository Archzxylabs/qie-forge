# Independence cleanup and originality audit — 2026-10-20

**Scope:** remove irrelevant third-party branding, repository identifiers, research links and research artifacts from the current QIE Forge tree while preserving every installable skill, canonical QIE fact, evidence record and release guarantee.

**Branch:** cleanup work was prepared on `feat/b09-distribution`. The canonical `main` now uses the clean history described in §5; the GitHub repository remains private.

## 1. What changed

### Removed from the current tree and archived outside the repository

- The root third-party research note.
- The comparative source-import study.
- The two third-party research evidence directories.
- The superseded architecture and engineering-analysis documents.

The material is preserved in an owner-controlled private archive outside the repository, together with a complete pre-cleanup tree archive and a provenance note. The archive records the upstream repository, pinned commit, MIT license text and the reason for removal.

### Replaced with independent QIE Forge documents

- `docs/architecture.md` — component boundaries, repository ownership, router/catalogue contract, progressive disclosure, canonical knowledge contract, effective freshness, deterministic packaging, installation/rollback, tooling budget, helper proof boundaries, validation layers, milestone blueprint and open decisions.
- `docs/engineering-quality.md` — evidence-chain contract, status/outcome semantics, current QIE evidence boundary, architecture quality rules, skill review standard, testing/evaluation layers, acceptance queue and unresolved questions.

These documents express the retained engineering requirements directly. They do not rename the third-party project, reproduce its research narrative, or claim its material as QIE Forge authorship.

### Edited for independence and link integrity

- `README.md` — points to `docs/architecture.md`; records the provenance boundary.
- `docs/source-map.md` — generic third-party wording.
- `docs/b07-results.md` — updated architecture/engineering links; removed an unnecessary cross-chain example.
- `docs/foundation-results.md` — added a historical-baseline note for the pre-cleanup PRD and architecture hashes.
- `docs/audit/QIE_Forge_Full_Repository_Audit_2026-10-19.md` — added an editorial note, removed third-party identifiers and replaced the comparative research section with a provenance-neutral summary. Findings and severities are unchanged.
- `QIE_Forge_PRD_v2.0.md` and `QIE_Forge_PRD_v2.1.md` — generic third-party wording; retired source entry S07 without renumbering the remaining sources; replaced a cross-chain example with a generic EVM example.
- `PRODUCT-BRIEF.md` — converted absolute author-local paths to a repository-relative PRD link and removed links to files outside the repository.

### Preserved historical evidence

`docs/foundation-results.md` and `docs/evidence/b07/preserved-foundation.json` still record the pre-cleanup architecture filename and hash. These are historical evidence, not current links, and were deliberately not altered. The new note in `foundation-results.md` explains why the current files no longer match the baseline hash.

## 2. Originality and provenance findings

### Exact-copy check

The archived research evidence recorded SHA-256 hashes for 76 upstream text files. Comparing those hashes with every file in the then-current repository produced **0 exact matches**. No upstream file was copied verbatim into the QIE Forge tree.

### Shared-text check

A normalized 10-word sequence scan compared 196 QIE product/tooling files (`authoring/`, `recipes/`, `skills/`, `knowledge/`, `scripts/`, `tests/`) with 74 upstream text files. Result: **0 shared 10-word sequences**. This is strong evidence that the product prose, recipes and code are not copied from the upstream corpus.

### Execution and dependency check

- No upstream source code was executed, imported or bundled.
- The generated skills contain only QIE Forge-authored Markdown, JSON, Solidity and JavaScript, plus assets derived from QIE sources and local fixtures.
- Third-party development dependencies are declared in `package-lock.json`; no third-party source tree is vendored.

### License finding

The upstream README at the pinned commit states the MIT License. Because no upstream expression was found in the current product tree, no upstream attribution file is currently required. If any upstream material is reused in the future, its MIT notice and the exact files/commit must be recorded. This is an engineering provenance finding, not a legal opinion.

### Remaining attribution

The engineering provenance review found no third-party attribution currently required in the product tree. Official QIE documentation and product names remain attributed through the canonical source records and citations; those are factual references, not third-party implementation.

## 3. Verification results

All commands were run from the repository root on Node `v24.20.0` and npm `11.19.0`.

| Command | Result |
|---|---|
| `npm run build` | PASS — generated `qie`, `qie-networks`, `qie-smart-contracts`, `qie-frontend`, `qie-wallets`, `qie-transactions`, `qie-deployment`, `qie-debug`, `qie-ecosystem`; no live network checks |
| `npm run validate` | PASS — 15 domains, 18 sources, 11 claims, 25 capabilities, 9 self-contained skill bundles |
| `npm run build:check` | PASS — publication regenerated with no byte or inventory drift |
| `npm run docs:check` | PASS — evidence catalogue matches canonical knowledge records |
| `npm run lint` | PASS — JavaScript syntax checks; no TypeScript compiler or style linter configured |
| `npm test` | PASS — **270 tests, 270 passed, 0 failed, 0 skipped, 0 todo** |
| `npm run test:install` | PASS — **20 installer fixtures, 20 passed, 0 failed, 0 skipped** |
| `npm run test:coverage` | PASS — 270/270 tests; **97.72% lines, 88.35–88.37% branches, 98.92% functions** across repeated runs (final fresh-clone run: 88.35% branches) |

### Artifact checks

- Exactly **nine** published skills: `qie`, `qie-networks`, `qie-smart-contracts`, `qie-frontend`, `qie-wallets`, `qie-transactions`, `qie-deployment`, `qie-debug`, `qie-ecosystem`.
- Nine `MANIFEST.json` files in `skills/`; all declared file hashes match.
- `skills/` and `dist/skills/` are byte-identical (`diff -rq` exit 0).
- 42 Markdown files in each generated tree; **0 broken relative links**.
- 64 generated `.mjs` files; **0 broken relative imports**.
- 30 non-authored Markdown documentation files; 133 links checked; **0 broken relative or absolute local links**.
- Authored source templates retain build-time placeholders and unresolved reference names by design; they are materialized by the build and are not published links.

### Canonical remote and fresh-clone checks

- Remote `main`: clean canonical history whose B08 baseline root is `66e598b47b4749613d46b859af806764d7324cee`; repository **PRIVATE**; only `refs/heads/main` exists.
- Fresh clone: 283 tracked files, nine skills, nine manifests and five recipes; the legacy commit is absent; `git fsck --unreachable` is empty.
- Fresh-clone gates: build, validate, build:check, docs:check and lint pass; **270/270** tests and **20/20** installation fixtures pass; coverage is reported above.
- `skills/` and `dist/skills/` are byte-identical; **94/94** manifest file digests match and there are no missing or extra files.
- Gitleaks: **0 findings** in the new worktree and in the new canonical history.

### Reference scan

Case-insensitive scan of the current tracked tree for the removed project name, upstream owner/repository identifiers, the pinned commit/tree hashes, and the related chain name returned **no matches**. Remaining historical filename references are limited to the annotated pre-cleanup baseline in `docs/foundation-results.md` and the preserved B07 evidence record; neither contains third-party branding.

### Gitleaks

- Current canonical worktree: **0 findings**.
- New canonical history: **0 findings** across its clean root baseline and this report update.
- The pre-rewrite history contained **7 false positives**, all from the `sourcegraph-access-token` rule matching 40-character Git commit/tree hashes in removed research files. They were public Git object identifiers, not credentials. That history is preserved only in the private backup and is not reachable from canonical refs.
- No API keys, tokens, private keys or credential-bearing URLs were found in either scan.

## 4. Cleanup diff summary

The independence cleanup changed 37 files: 26 deletions, 8 modifications and 3 additions, for **577 insertions and 8,695 deletions**. The deletion count is dominated by the removed research evidence snapshots. Generated `skills/` files were not edited by hand and did not drift.

A later hygiene pass redacted author-local paths in recorded B07 evidence, removed the last source-import command reference from the historical audit, and consolidated ignore rules. The resulting audited product tree was published as a single clean root commit rather than as a chain of cleanup commits; this report update is a docs-only child commit. The original cleanup commits remain only in the private pre-rewrite backup.

## 5. Canonical history migration

### Backup

Before rewriting, an independent private backup was created outside the repository:

- a verified `git bundle` containing every local ref and the complete pre-rewrite history;
- a bare mirror clone with the same refs and objects;
- a clean-tree archive of the audited source tree;
- a worktree archive that includes `.git`;
- a checksum manifest and restore notes.

The backup intentionally contains the old research history. It is not published and must not be pushed to GitHub.

### Clean root history

The audited tree was exported into an isolated workspace, initialized as a new repository, and committed as a single root commit. The canonical baseline commit is `66e598b47b4749613d46b859af806764d7324cee` (`QIE Forge 0.5.1-ecosystem.1 — B08 clean canonical baseline`). It has no parent and therefore cannot reach any pre-rewrite commit.

The new `main` was published with an explicit, narrowly scoped force-with-lease against the known old remote tip `174a78b3d05392c63e5a7eded07359e724ed5685`. The remote now contains only `refs/heads/main`; no tags, releases, pull requests, forks or Actions runs were present. The repository remains **PRIVATE**.

### Local branches

- `main` — clean canonical history (B08 baseline root `66e598b`), tracking `origin/main`.
- `feat/b09-distribution` — fresh local branch based on the same clean canonical history.

### Reachability limitation

The legacy research commit is no longer reachable from any canonical branch, tag or remote ref, and a fresh clone does not contain it. It is still retrievable by direct SHA through the GitHub API at the time of this report, and GitHub may retain unreachable objects or caches for a period. Forks are empty, but collaborator clones and external copies may still contain the old history. Immediate erasure would require GitHub-side cache/object purge and collaborator re-clones; this report does not claim that erasure.

## 6. Risks and open items

- **Legacy objects may remain retrievable.** The old commit is not reachable from canonical refs, but it is still retrievable by direct SHA through the GitHub API and may persist in server-side caches or unreachable objects. Forks are empty; collaborator clones and external copies are outside this control. See §5.
- **Repository license unresolved.** The QIE Forge repository has no top-level license file; ownership/license is an existing open decision. This cleanup does not resolve it.
- **No live evidence was created.** No QIE RPC, wallet, signing, deployment, explorer verification or `VERIFIED` capability promotion was performed. The nine skills remain installable, but their live-capability limits are unchanged.
- **Historical baseline hashes no longer match.** `docs/foundation-results.md` and `docs/evidence/b07/preserved-foundation.json` intentionally preserve the pre-cleanup hash record. A future evidence regeneration must decide whether to re-baseline them rather than silently overwrite them.
- **Third-party reuse policy.** The current tree is independent, but future contributors must still follow the PRD originality policy and record any upstream license/attribution if material is reused.
- **Collaborator refresh required.** The repository has three admin collaborators; none had branches, pull requests or commits beyond the baseline. They should re-clone or hard-reset to the new `main` before continuing work.
