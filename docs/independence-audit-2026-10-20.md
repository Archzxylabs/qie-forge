# Independence cleanup and originality audit — 2026-10-20

**Scope:** remove irrelevant third-party branding, repository identifiers, research links and research artifacts from the current QIE Forge tree while preserving every installable skill, canonical QIE fact, evidence record and release guarantee.

**Branch:** `feat/b09-distribution`. `main` was not modified. No remote operation, force-push or history rewrite was performed.

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

No legally required third-party attribution remains in the current tree. Official QIE documentation and product names remain attributed through the canonical source records and citations; those are factual references, not third-party implementation.

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
| `npm run test:coverage` | PASS — 270/270 tests; **97.72% lines, 88.37% branches, 98.92% functions** (an earlier run measured 88.35% branches) |

### Artifact checks

- Exactly **nine** published skills: `qie`, `qie-networks`, `qie-smart-contracts`, `qie-frontend`, `qie-wallets`, `qie-transactions`, `qie-deployment`, `qie-debug`, `qie-ecosystem`.
- Nine `MANIFEST.json` files in `skills/`; all declared file hashes match.
- `skills/` and `dist/skills/` are byte-identical (`diff -rq` exit 0).
- 42 Markdown files in each generated tree; **0 broken relative links**.
- 64 generated `.mjs` files; **0 broken relative imports**.
- 30 non-authored Markdown documentation files; 133 links checked; **0 broken relative or absolute local links**.
- Authored source templates retain build-time placeholders and unresolved reference names by design; they are materialized by the build and are not published links.

### Reference scan

Case-insensitive scan of the current tracked tree for the removed project name, upstream owner/repository identifiers, the pinned commit/tree hashes, and the related chain name returned **no matches**. Remaining historical filename references are limited to the annotated pre-cleanup baseline in `docs/foundation-results.md` and the preserved B07 evidence record; neither contains third-party branding.

### Gitleaks

- Current worktree: **0 findings**.
- Git history: **7 findings**, all from the `sourcegraph-access-token` rule matching 40-character Git commit/tree hashes in the files removed by this cleanup. The matched values are public Git object identifiers, not credentials. No API keys, tokens, private keys or credential-bearing URLs were found.
- The current tree no longer contains the affected files, but the historical commit still does.

## 4. Git diff summary

The final diff changes 37 files: 26 deletions, 8 modifications and 3 additions, for **577 insertions and 8,695 deletions**. The deletion count is dominated by the removed research evidence snapshots. Generated `skills/` files were not edited by hand and did not drift.

The changes are committed locally on `feat/b09-distribution`; no push was performed. The commit hash and final diff stat are reported in the handoff.

## 5. Historical Git references and safe migration options

### Current state

The current tree is clean, but the repository history still contains the removed research files, their names and their links. This is expected: a new commit does not erase earlier commits, and `origin/main` still points at the pre-cleanup release commit.

### If historical removal is required

This requires explicit owner approval and a coordinated, destructive operation:

1. Freeze pushes and create a fresh backup of all branches, tags and the pre-cleanup archive.
2. Use `git filter-repo` (or an equivalent reviewed rewrite) to remove the named paths and, if required, replace the remaining identifier strings across all commits.
3. Re-run the full gate suite on the rewritten tree.
4. Force-push all affected refs, expire server-side caches and require every collaborator to re-clone. Existing clones and cached commit objects will still contain the old data.
5. Verify the remote history, release tags and checksums before reopening pushes.

No rewrite was performed. The safe default is to keep history intact and treat the current-tree cleanup as the product boundary.

## 6. Risks and open items

- **History remains searchable.** The removed names and research documents are still in the existing commit. Removing them requires the approved rewrite above.
- **Repository license unresolved.** The QIE Forge repository has no top-level license file; ownership/license is an existing open decision. This cleanup does not resolve it.
- **No live evidence was created.** No QIE RPC, wallet, signing, deployment, explorer verification or `VERIFIED` capability promotion was performed. The nine skills remain installable, but their live-capability limits are unchanged.
- **Historical baseline hashes no longer match.** `docs/foundation-results.md` and `docs/evidence/b07/preserved-foundation.json` intentionally preserve the pre-cleanup hash record. A future evidence regeneration must decide whether to re-baseline them rather than silently overwrite them.
- **Third-party reuse policy.** The current tree is independent, but future contributors must still follow the PRD originality policy and record any upstream license/attribution if material is reused.
