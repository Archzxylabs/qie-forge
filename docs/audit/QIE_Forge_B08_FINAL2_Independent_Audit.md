# QIE Forge — B08 FINAL2 Independent Snapshot Audit

## Scope

Artifact: `QIE-FORGE-B08-FINAL2-review.zip` supplied by the user. This review inspects the contents as delivered, and compares this artifact against the previously uploaded `QIE-FORGE-B08-FINAL-review.zip`. It is not an attestation of the user's local Git history, which is absent from the reviewed archive and from the user's terminal error.

**Verdict: B08 ACCEPTED as a local/offline knowledge, generation, packaging, and diagnostic milestone. B09 may begin.** This does **not** certify live QIE Mainnet tool compatibility, deployment, wallet interoperability, or published-distribution workflow. The entire npm suite could not be rerun in the reviewer container: its Node runtime is v22.16.0, whereas the project specifies Node 24.20.0; npm dependencies are not present. The supplied logs report 270/270 unit tests and 20/20 installer fixtures.

## Independently observed

1. **Snapshot delta:** prior archive had 384 regular files; FINAL2 has 406. They share 384 paths, with 103 modified and 22 added, none removed. Changes include chronology/status/placeholder modules, new adversarial tests, canonical S21 review metadata and regenerated skill bundles. Exact per-agent change attribution is not possible without commit history.
2. **Packaging:** nine skill bundles present. All **94 manifest-declared files** have matching SHA-256 digests and exist. The published `skills/` tree and staged `dist/skills/` tree have **103 regular files each**; every relative path and byte sequence matches. The eight other skills were preserved alongside `qie-ecosystem`.
3. **Link and placeholder hygiene:** all checked Markdown local links resolve; no unresolved `{{...}}` placeholders in published Markdown. No SHA-256 mismatch or missing referenced local files was found.
4. **Canonical catalogue:** `knowledge/capabilities.yaml` contains **25 records**, including **9 DOCUMENTED, 9 UNKNOWN, 2 CLAIMED, 2 UNSUPPORTED, 2 DEPRECATED, 1 CONFLICTED, 0 VERIFIED**. `knowledge/sources.yaml` has 18 source records.
5. **Chronology:** `release-context.json` records a cut at `2026-10-19T22:35:15Z`, and S21 records a review at `2026-10-19T21:37:00Z`; neither postdates the archive message at `2026-10-19T23:12:22Z`. The build and validation paths actually invoke the chronology gate. Independently invoked the dependency-free JavaScript gate: this recorded cut passes while the earlier future-dated cut and S21 review are both rejected. The 5-minute tolerance is explicit.
6. **Evidence receipt integrity:** the S21 retrieval body saved under `docs/evidence/b08-final/` has SHA-256 `507912dba2dc16f40b3a6ed62e2d5bd9c5d39aade07144407cf02bc09f932852`, matching the saved receipt. This establishes internal integrity of the submitted evidence, not independent network retrieval by this reviewer.
7. **Status projection:** the release builder computes `effective_status` and `effective_status_reason` once per selected record at a frozen release clock. Both catalogue and compatibility renderers read that projected field; the stored status is labelled separately. Independently invoked `effectiveStatus` with expired DOCUMENTED evidence; it returns STALE.
8. **Canonical-fact protections:** authored material is checked for handwritten chain values, endpoints and capability verdicts; canonical placeholders are resolved from the skill-local selected snapshot. Tests explicitly mutate canonical chain ID and RPC values, and introduce contradictory handwritten statements. The rendered Hardhat example in the submitted bundle has the network values documented in the canonical network claims.
9. **JavaScript syntax:** `node --check` passed for 45 project source/test `.mjs` files inspected outside the generated bundles. This is a syntax check, not a full Node 24/npm regression run.

## Gates supported by supplied reports, not independently rerun

- `npm test`: 270 passed, 0 failed (preserved log).
- `npm run test:install`: 20 passed, 0 failed (preserved log).
- Coverage: 97.72% line / 88.37% branch / 98.92% function (preserved report and log).
- `npm run build`, `validate`, `docs:check`, `build:check`, `lint`: marked PASS in preserved logs.
- The `scripts/verify-evidence.mjs` script compares the milestone reports against newly produced test and installation logs; it is separate from `npm test` and should be an explicit B09 CI/release gate.

## Remaining constraints (not regressions to B08)

1. No live QIE RPC, wallet/browser integration, signing, deployment, contract source verification, or finality observation has been evidenced in this review. No capability is VERIFIED.
2. Official upstream Agent Skills validator and published Git-source installation remain release gates.
3. The user's live checkout returns `fatal: not a git repository`. This is a version-control and provenance risk, especially after two agents edited the same working directory. The ZIP excludes `.git`, so the archive alone cannot establish whether any separately hosted Git history exists. For B09, use a real Git repository with controlled commits/branches, and freeze a release snapshot before verifying it.
4. Source S21 remains `content_sha256: null` in canonical `sources.yaml`, while a separately preserved retrieval receipt has a verified digest. Incorporate that digest through the normal controlled release process if relevant; it does not block B08 acceptance.

## Decision

**B08: ACCEPTED for scope; B09: UNBLOCKED.** Do not rework the existing nine skills. Focus B09 on actual Git-based distribution, pinned releases, upgrade/rollback, clean installs from published source, official validator, reproducible CI and multi-agent change isolation. Every claim to QIE runtime compatibility still requires independently scoped QIE evidence.
