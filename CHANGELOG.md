# Changelog

QIE Forge identifies a release by the human `release_version` in `release-context.json` plus the content-addressed `release_id` in every generated `MANIFEST.json`. Two packaging revisions can share a human version while carrying different identities; the identity is authoritative for byte-level update and rollback checks.

## QIE ecosystem intelligence expansion — 2026-10-24

- **Release version:** `0.6.0-ecosystem.1` (working-tree candidate; not published)
- **Schema version:** `1.4.0` (integration records are additive)
- **Release identity:** `420cded32a598d9aa64cd816391aec5b125c6759837ff350f54eaddd2442103b`
- **Scope:** source-grounded QUSDC and QIE Lending intelligence, token accounting, QIE Wallet/RPC integration guidance, Oracle/DEX/Bridge/ID/Pass/native/indexing boundaries, shared address identity gate and seven new reusable recipes.
- **Safety:** source-published address candidates are retained as CLAIMED/CONFLICTED discovery records; all new integration operations have `execution_allowed: false`; no QIE RPC write, signer, bridge transfer or live wallet action was run.
- **Evidence:** see [source inventory](docs/research/qie-ecosystem-source-inventory.md), [QUSDC review](docs/research/qusdc-protocol-review.md), [Lending review](docs/research/qie-lending-protocol-review.md), [golden-task evaluation](docs/evidence/qie-knowledge-golden-tasks.md) and [release results](docs/evidence/qie-knowledge-release-results.md).

## Developer experience remediation — 2026-10-21

- **Release version:** `0.5.2-ecosystem.1` (working-tree candidate; not published)
- **Schema version:** `1.4.0` (unchanged)
- **Release identity:** `3f88cb8b595dfdc2b3defa38ffb1d0e6efc71ee9d3158210d41262620561e30b`
- **Built at:** `2026-10-21T17:28:25Z`
- **Affected networks:** none; no canonical QIE network fact or policy claim changed
- **Changes:**
  - introduced one compiler-resolution contract used by `doctor`, example preparation, the clean-consumer check and the installed-recipe replay;
  - made an absolute `QIE_FORGE_SOLC` override authoritative and fail closed, added native PATH discovery, and safely resolved a present `solc-select` artifact without executing an auto-installing wrapper;
  - corrected the Counter reference app's invalid/missing-address recovery so an input error does not call `connect()` on a ready session, and added rendered browser regressions;
  - bound historical B08/B09 report checks to a provenance-documented fixture instead of the active release cut;
  - added and executed an independent agent evaluation for repairing a deliberately failing Counter assertion.
- **Historical evidence:** the B08/B09 reports and logs remain at `0.5.1-ecosystem.1` / `b280364ed46be17d048f2b5c7c78485c8c35bb7172d123dd253f784fdf17b3ce`. They were not rewritten and do not certify this new payload.

## B09 distribution revision — 2026-10-20

- **Release version:** `0.5.1-ecosystem.1` (unchanged; no canonical QIE knowledge or policy change)
- **Schema version:** `1.4.0` (unchanged)
- **Release identity:** `b280364ed46be17d048f2b5c7c78485c8c35bb7172d123dd253f784fdf17b3ce`
- **Affected networks:** none; this revision changes packaging and distribution evidence only
- **Changes:**
  - added the required suite `release_id` to every generated manifest;
  - added suite-set and identity coherence checks to `npm run validate`;
  - added the read-only `scripts/verify-installed-release.mjs` verifier for file hashes, knowledge/policy digests, legacy manifests, mixed releases and incomplete suites;
  - hardened the verifier against untrusted manifest paths: strict schema and snapshot inventory checks, containment before reads, symlink rejection, size ceilings and error redaction;
  - made full-suite verification use the exact canonical nine-name contract, validate `SKILL.md` frontmatter, ignore unrelated agent skills and check Claude Code copy/symlink projections;
  - separated internal coherence from publisher authenticity via optional trusted `--release-id` pinning;
  - made `suiteComplete` a fail-closed alias of `verificationComplete`, added `inventoryComplete`, `payloadIntegrity` and `releaseCoherence`, and exposed `authenticityScope: PAYLOAD_IDENTITY_ONLY`;
  - derived `sources_checked_at` from the selected snapshot source reviews and rejected manifest-only provenance mutations without claiming the manifest is inside the release identity;
  - removed reintroduced upstream project/owner identifiers from the historical audit prose without changing its findings;
  - added a local smart-HTTP Git fixture, immutable tag and full-SHA installs, update, rollback and corruption tests plus adversarial containment, fake-inventory, provenance-mutation and projection tests;
  - aligned `package-lock.json` to the declared package version;
  - recorded the authenticated private GitHub install at an immutable B08 SHA.
- **Update/rollback:** `skills update -p -y` follows a mutable branch and leaves pinned tags/SHAs unchanged. Rollback is an explicit reinstall of a known-good pinned ref. Copy-mode fidelity after update requires `--copy`.
- **Distribution status:** B09 is **ACCEPTED FOR PRIVATE DISTRIBUTION** after authenticated immutable-SHA installs from the private GitHub feature branch, exact-tree/hash verification, suite/single and copy/symlink projections, helper independence, unrelated-skill coexistence and known-good rollback. Public distribution is not proven and the repository has no license decision.
- **Known limitations:** The CLI does not validate manifests during update; true process-kill interruption and atomic backup are not implemented; public installation and anonymous access remain unproven. See [B09 results](docs/b09-results.md).
- **Tag state:** no tag or GitHub Release was created for this candidate.

## 0.5.1-ecosystem.1 — B08 ecosystem catalogue

- **Release version:** `0.5.1-ecosystem.1`
- **Schema version:** `1.4.0`
- **Legacy manifests:** generated before B09; they carry no `release_id` and the verifier reports them as legacy.
- **Scope:** ecosystem catalogue, compatibility matrix, decision guide and the B08 remediation/re-audit corrections. No QIE capability was promoted beyond its recorded evidence.
- **Evidence:** [B08 results](docs/b08-results.md), [B08 remediation results](docs/b08-remediation-results.md), [B08 final-integrity corrections](docs/b08-final-integrity-results.md).
