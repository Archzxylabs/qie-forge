# Changelog

QIE Forge identifies a release by the human `release_version` in `release-context.json` plus the content-addressed `release_id` in every generated `MANIFEST.json`. Two packaging revisions can share a human version while carrying different identities; the identity is authoritative for byte-level update and rollback checks.

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
- **Known limitations:** B09 is PARTIAL. No B09 commit, tag, release or public source was published; the GitHub proof installed legacy B08 bundles; the CLI does not validate manifests during update; true process-kill interruption and atomic backup are not implemented. See [B09 results](docs/b09-results.md).
- **Tag state:** no tag or release was created for this local candidate.

## 0.5.1-ecosystem.1 — B08 ecosystem catalogue

- **Release version:** `0.5.1-ecosystem.1`
- **Schema version:** `1.4.0`
- **Legacy manifests:** generated before B09; they carry no `release_id` and the verifier reports them as legacy.
- **Scope:** ecosystem catalogue, compatibility matrix, decision guide and the B08 remediation/re-audit corrections. No QIE capability was promoted beyond its recorded evidence.
- **Evidence:** [B08 results](docs/b08-results.md), [B08 remediation results](docs/b08-remediation-results.md), [B08 final-integrity corrections](docs/b08-final-integrity-results.md).
