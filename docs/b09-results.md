# B09 distribution, update and rollback results

**Date:** 2026-10-20 (UTC)
**Branch:** `feat/b09-distribution` (local, based on `cf16d074cd33a6ab62179dd3cdf4bcfa6eb5125d`)
**Release:** `0.5.1-ecosystem.1` (unchanged), schema/policy `1.4.0` (unchanged)
**Release identity:** `b280364ed46be17d048f2b5c7c78485c8c35bb7172d123dd253f784fdf17b3ce`
**Toolchain:** Node `v24.20.0`, npm `11.19.0`, Git `2.55.0`, Skills CLI `1.7.2`, Node test runner with process isolation disabled
**Independent audit:** [B09 source and adversarial audit](audit/QIE-FORGE-B09-independent-audit.md) reproduced three P1 verifier defects and one P2 metadata-validation gap at commit `12c5759`. The three P1 findings and P2-01 are remediated with regression tests; P2-02 is addressed by a fresh clean-commit gate/evidence run; P2-03 remains part of the PARTIAL verdict because the separate remote-distribution acceptance test has not run against B09.
**Implementation commit under test:** `ceed1c88c9dc982e1dac09161e94e957f24cbb95` (the evidence logs in `docs/evidence/b09/` record this commit; the following docs/evidence commit records these logs and changes no implementation file).
**Verdict:** **B09 PARTIAL** — local smart-HTTP Git and authenticated private GitHub installs pass the tested matrix; no B09 commit, tag, release or public source was published, so remote B09 distribution and public installation remain unproven.

## 1. Scope and result

B09 adds an explicit suite identity, exact installed-tree verification and a reproducible update/rollback matrix without replacing the pinned Skills CLI. The local/private acceptance matrix is complete for the exact tool and source types below. The milestone is not marked PASS because the B09 tree itself was never available from a remote Git source, the authenticated GitHub proof installed legacy B08 bundles, and no public installation was tested.

The implementation does **not** add a Forge installer, MCP server, backend, registry or updater. It does not hand-edit generated bundles, modify global agent directories, publish a test release, create a permanent tag or promote a QIE capability.

## 2. Implementation

| Area | Change |
|---|---|
| Manifest contract | `release_id` is required and must be a lowercase SHA-256. `knowledge/schema/manifest.schema.json` validates it. |
| Identity computation | `scripts/lib/release-identity.mjs` hashes a canonical projection of release version, schema version, frozen `built_at` and every non-manifest file in all nine bundles. `MANIFEST.json` is excluded to avoid self-reference. |
| Build | `scripts/lib/release.mjs` computes one identity per release cut and injects the same value into all nine manifests. A generated `release-info.md` explains the shared identity. |
| Suite validation | `scripts/validate-skills.mjs` requires the published directory set to equal the enabled catalogue, requires all manifests to agree on version/schema/build/identity, and recomputes the identity from published bytes. |
| Installed verification | `scripts/lib/installed-release.mjs` and `scripts/verify-installed-release.mjs` read an installation without modifying it, verify per-file hashes, knowledge and policy digests, snapshot schema and suite identity, and reject legacy, mixed, incomplete or malformed installations. Installed manifests are treated as untrusted: strict schema validation, published-snapshot enumeration, containment before reads, symlink rejection, size ceilings and redacted diagnostics replace the earlier loose path join. |
| Canonical suite contract | `scripts/lib/release-contract.mjs` is the trusted nine-name inventory used by the verifier and cross-checked against the enabled catalogue by `validate-skills.mjs`. `--expect-suite` requires those exact names; unrelated agent skills are ignored, malformed canonical bundles are rejected and `SKILL.md` frontmatter must name its directory. |
| Agent projections | A sibling `.claude/skills` projection is checked automatically when it contains canonical QIE entries (or via `--claude-root`): symlinks must be relative and resolve to the exact canonical bundle; copied projections must match canonical bytes and `release_id`. Broken, absolute, misdirected and stale projections fail closed; unrelated-only Claude directories do not invalidate a Codex-only install. |
| Authenticity boundary | `COHERENT_FULL_SUITE` is an internal-coherence verdict. `publisherAuthenticity` stays `NOT_ESTABLISHED` unless `--release-id` supplies a trusted pinned identity; only then is `PINNED_MATCH` or `MISMATCH` reported. |
| Tests | `tests/b09-distribution.test.mjs` adds ten scenarios. `tests/installation.test.mjs` now checks installed identity, canonical scope and Claude copy/symlink projections in all twenty existing fixtures. Test support adds asynchronous child execution, a loopback smart-HTTP Git server and isolated CLI environments. |
| Evidence | `scripts/verify-b09-evidence.mjs` runs the eight B09 gates in order, writes logs under `docs/evidence/b09/`, and checks this report's quoted numbers against the executed run. |
| Version metadata | `package-lock.json` was aligned from `0.4.0-operational.1` to the declared `0.5.1-ecosystem.1`; no package version bump was made because canonical QIE knowledge did not change. |

Published bytes remain nine self-contained skills, five recipes, 94 manifest file entries, 103 files in the published tree and one shared release identity. The generated `skills/` tree is byte-identical to a clean rebuild.

`MANIFEST.json` is deliberately excluded from `release_id`, so metadata such as `generated`, `sources_checked_at`, `schema_version` and `release_version` is not itself content-addressed by that identity. The verifier validates those fields against the strict schema, the supported-schema contract and `built_at` chronology; it does not present them as authenticated file bytes. A caller that needs a trusted release assertion must pin the whole identity with `--release-id`.

## 3. Observed Skills CLI behavior

These are observations from the pinned CLI, not assumptions from its documentation.

| Observation | Exact behavior |
|---|---|
| Project lock | `skills-lock.json` stores `source`, `sourceUrl`, `ref`, `sourceType`, `skillPath` and `computedHash` per skill. |
| Default projection | Without `--copy`, `.agents/skills/<name>` is a real copy and `.claude/skills/<name>` is a relative symlink. |
| Copy projection | With `--copy`, both `.agents/skills/<name>` and `.claude/skills/<name>` are independent real copies. |
| Tag/SHA semantics | A `#<tag>` or `#<full-commit-sha>` install remains pinned; `skills update` reports `All project skills are up to date`. |
| Mutable branch | A `#main` install records `ref: main`; `skills update -p -y` advances to the new branch head. |
| Copy after update | Updating a previous `--copy` installation installs the default symlink projection for Claude Code. `.agents` remains a real copy; `.claude` entries become symlinks. |
| Local source | `skills update` exits `0` but prints `No installed skills found matching: <name>` and changes nothing. Local-directory sources are install-only. |
| Missing ref | A nonexistent tag fails nonzero during clone; no installation is created. |
| Removed source | Updating a Git-source installation after the source is unavailable exits nonzero and leaves the installed tree unchanged. |
| Corrupt source | The CLI installs a source whose manifest disagrees with its files and exits `0`; it does not validate bundle manifests. The B09 verifier rejects the result. |
| Rollback | Re-adding the known-good pinned ref succeeds and restores byte-identical files. Copy fidelity requires `--copy`. |

## 4. Acceptance matrix

| Scenario | Source type | Modes / refs | Assertions | Result |
|---|---|---|---|---|
| Suite install | Real Git over loopback smart HTTP (`git http-backend`) | Symlink and copy; immutable tag | 9 installed names, exact tree equality, 103 files, identity match, source removed, helpers still run | PASS |
| Single install | Real Git over loopback smart HTTP | Symlink and copy; immutable tag | `qie-networks` exact tree, no sibling dependency, identity match, offline helper reports `NOT_RUN` | PASS |
| Single install at full SHA | Real Git over loopback smart HTTP | Symlink; full 40-hex SHA | Exact tree and identity match at an immutable commit SHA | PASS |
| Suite update | Real Git over loopback smart HTTP | Symlink and copy; `main` advances A→B | All 9 updated, exact B tree, new identity, lock ref remains `main`, copy projection converts to symlink | PASS |
| Pinned update | Real Git over loopback smart HTTP | Symlink; immutable tag | `All project skills are up to date`; files and identity stay A | PASS |
| Rollback | Real Git over loopback smart HTTP | Symlink and copy; known-good tag after corrupt update | Exact known-good tree and identity; offline helper still works | PASS |
| Source removal | Real Git over loopback smart HTTP | Both modes | Installed tree unchanged; offline verifier and helper still work | PASS |
| Corrupt update | Real Git over loopback smart HTTP | Both modes | CLI exits `0`; verifier reports `HASH_MISMATCH`; rollback restores A | PASS (detection and recovery, not prevention) |
| Mixed releases | Real Git over loopback smart HTTP | Two pinned tags, one consumer | `MIXED_RELEASE_ID`, `MIXED_SCHEMA_VERSION`; repair from one release clears them | PASS |
| Legacy installation | Local fixture derived from an older manifest | Nine bundles | `LEGACY_RELEASE_ID`; no hash/snapshot failures | PASS (rejected as intended) |
| Malformed installed trees | Local fixtures | Missing/extra files, malformed manifests, duplicate entries, bad snapshot/policy/schema, symlink, unreadable root, incomplete suite | Specific fail-closed findings; verifier exits `1`; usage errors exit `2` | PASS |
| Adversarial verifier | Local fixtures | `../` and absolute snapshot paths, manifest path traversal, symlink escapes, unreadable/oversized snapshots, parser-error redaction, fake nine-name inventory, missing router, frontmatter mismatch | No outside content is read or echoed; exact canonical set required; fake suite rejected; diagnostics remain path/type-only | PASS |
| Claude projections | Local installs and synthetic trees | Relative symlink, copied projection, unrelated sibling, broken, absolute, misdirected and stale copy | Canonical `.agents` tree stays coherent; each projection is validated against it; unrelated entries ignored | PASS |
| Local-source update | Local directory | Symlink | Exit `0`, explicit no-op message, no file or lock change | PASS (documented limitation) |
| Authenticated private GitHub | Real private HTTPS repository at full SHA | Suite symlink and single copy | Exact tree to `git archive`; 103 files; hashes match; pinned update no-op; CLI verifier finds only expected legacy release IDs | PASS for B08 artifacts; B09 remote still unproven |

The local smart-HTTP fixtures use real Git clone/fetch and real ref resolution; they are not mocks. The GitHub check uses a real private remote. The twenty existing installation fixtures use a local directory source with a network-deny guard. The adversarial and projection tests use local synthetic installed trees; they do not follow arbitrary symlinks or read outside the canonical root. No QIE RPC, wallet, signer or deployment endpoint is contacted by any B09 test.

## 5. Failure and adversarial coverage

- Missing or malformed `MANIFEST.json`, a symlinked manifest and an oversized manifest.
- Manifest that is not an object, has no files array or contains invalid file entries.
- Duplicate manifest entries and a manifest that hashes itself.
- Missing listed file, unexpected extra file and a symlink inside a bundle.
- Missing, unreadable or schema-incompatible packaged snapshot.
- Snapshot `../` traversal, absolute path, symlink escape, unsupported snapshot path and snapshot absent from the declared inventory.
- Oversized snapshot and oversized bundle; parser errors are redacted and never include the outside file's content.
- Manifest file-entry traversal and absolute paths; no read occurs before schema/containment acceptance.
- Knowledge digest mismatch and policy digest mismatch.
- Invalid or absent `release_id` (legacy path).
- `generated` false or non-boolean, malformed `sources_checked_at`, and a source review timestamp later than `built_at`.
- Unsupported individual schema version, in addition to mixed-schema detection.
- Mixed release identities, versions, schemas or build timestamps.
- Incomplete suite under `--expect-suite`, a renamed/fake nine-name inventory and a missing canonical router.
- Missing `SKILL.md`, a manifest that omits it, invalid `SKILL.md` frontmatter or a frontmatter name that does not match its directory.
- Unrelated agent skills beside the suite, including a broken unrelated symlink that must be ignored.
- Broken, absolute, misdirected and stale-copy Claude Code projections.
- Nonexistent Git ref and removed Git source.
- Corrupt bundle after manifest generation, followed by pinned rollback.
- Local-source update silent no-op.
- CLI usage errors: unknown argument, missing option value and invalid release ID exit `2`.

True process-kill interruption during an install or update was **not** simulated. Source removal and corrupt-source recovery cover the observable failure classes available without adding a Forge updater; they do not prove atomic filesystem transactions.

## 6. Reproduction and evidence

Required gates were executed in this order:

```sh
npm run build
npm run validate
npm run build:check
npm run docs:check
npm run lint
npm test
npm run test:coverage
npm run test:install
```

`npm run verify:b09-evidence` re-executes the same eight gates in order and writes full logs to `docs/evidence/b09/{build,validate,build-check,docs-check,lint,tests,coverage,installation}.txt`. Each log records the command, Node version, UTC timestamp and the commit under test. The script fails if this report does not quote the executed test count, installation count, release identity or coverage figures. The B09 evidence run is executed from a clean worktree on the final implementation commit rather than inferred from earlier commits; the following evidence/docs commit records the generated logs and changes no implementation file.

The authenticated private GitHub proof is recorded in `docs/evidence/b09/github-private.txt`. No credential or authorization header is stored. No branch, tag, release or repository was created or modified for that proof.

## 7. Gate results

| Gate | Result |
|---|---|
| `npm run build` | PASS — 9 skills rebuilt; no live network checks |
| `npm run validate` | PASS — 15 domains, 18 sources, 11 claims, 25 capabilities; 9 bundles; identity `b280364e…b3ce` |
| `npm run build:check` | PASS — byte-identical reproducible rebuild |
| `npm run docs:check` | PASS — B08 evidence catalogue matches canonical knowledge |
| `npm run lint` | PASS — JavaScript syntax checks |
| `npm test` | PASS — **280/280**, 0 failed |
| `npm run test:coverage` | PASS — **280/280**; **96.15% lines, 88.56% branches, 97.96% functions** |
| `npm run test:install` | PASS — **20/20** installation fixtures |
| B09 dedicated suite | PASS — 10/10 scenarios |

## 8. Limitations and unresolved cases

1. **B09 is PARTIAL for remote distribution.** The B09 commit is local. The authenticated GitHub proof installed B08 bundles at `cf16d074…` because publishing the B09 tree would violate the local-only constraint. No B09 tag, release or public source exists.
2. **Public installation is unclaimed.** A private authenticated read does not prove public discovery, rate limits, anonymous access or cache behavior.
3. **The CLI does not validate manifests.** A corrupt update can be installed successfully and is only caught by the post-operation verifier. The smallest compatible solution is the read-only verifier plus pinned rollback, not a replacement updater.
4. **Update is not transactional.** There is no automatic pre-update backup, atomic swap or process-kill recovery. A failed clone/update leaves the previous tree intact in the tested cases, but a successfully installed corrupt tree must be rolled back manually.
5. **Copy mode is not preserved by update.** The CLI converts Claude Code copies to symlinks. The documented remedy is an explicit `--copy` reinstall; changing the upstream CLI is out of scope.
6. **Local sources are install-only.** The CLI exits `0` with a no-op message. Updates require a Git source; the README states this rather than hiding it.
7. **Installed versus current version is not printed.** The verifier reports the installed release, version, identity and exact hashes; `skills update` reports that skills changed or are up to date, but the CLI does not print both the installed and current versions. The smallest compatible addition would be a read-only source-manifest lookup after ref resolution that compares `release_id`; it was not added because it would duplicate the CLI's clone/update path for a reporting-only capability.
8. **Remote B09 verification requires publication.** Once the branch is reviewed and pushed, a disposable or dedicated private repository at a full SHA with `delete_repo` cleanup authority should repeat the GitHub matrix against B09 manifests.
9. **No live QIE evidence.** B09 did not contact a live RPC, wallet, signer, deployment target or explorer, and did not promote any capability to `VERIFIED`.
10. **Coherence is not publisher authenticity.** A self-consistent tree can be fabricated. `COHERENT_FULL_SUITE` means the exact canonical inventory, frontmatter, hashes, snapshots and recomputed identity agree; it becomes a trusted release assertion only when the caller supplies a pinned `--release-id` from an independent trusted source. The verifier cannot establish who published a tree by hashing it.
11. **Projection coverage is limited to detected targets.** The verifier checks the canonical `.agents/skills` tree and, when present, the sibling `.claude/skills` projection. Other agent directories or future projection layouts require an explicit `--claude-root` or a separate verifier extension; the CLI remains the authority for where it installs.
12. **Evidence chronology is explicit.** The eight gate logs record the clean implementation commit under test. The evidence/docs commit that follows is not a second implementation change; no gate output is inferred from an earlier commit.

## 9. B08 preservation and non-claims

No file under `docs/evidence/b08/`, `docs/b08-results.md`, `docs/b08-remediation-results.md`, `docs/b08-final-integrity-results.md` or `docs/audit/` was rewritten. The B08 historical figures remain historical. B09 changes generated manifests and packaging metadata, so B08 installations are now correctly classified as legacy; that is a new packaging contract, not a retroactive change to B08 evidence.

B09 does not claim live QIE RPC, wallet connection, signing, broadcast, deployment, explorer verification, host/model workflow success, official `skills-ref` validation, public installation or production readiness.

## 10. Verdict

**B09 PARTIAL.** The local and private-source matrix is reproducible and fail-closed for the pinned CLI: suite and single installs, copy and symlink modes, immutable tags and full SHAs, mutable-branch updates, pinned no-ops, corrupt-update detection, mixed-release rejection, adversarial path containment and explicit rollback all pass. The three P1 audit findings and the P2 metadata-validation gap are remediated with regression tests; the P2 evidence-chronology gap is addressed by running all eight gates from a clean implementation commit. The remaining blocker is remote/public distribution of the B09 release itself, which cannot be proven without publishing it.
