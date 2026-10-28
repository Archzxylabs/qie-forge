# Changelog

QIE Forge identifies a release by the human `release_version` in `release-context.json` plus the content-addressed `release_id` in every generated `MANIFEST.json`. Two packaging revisions can share a human version while carrying different identities; the identity is authoritative for byte-level update and rollback checks.

## Consumer bootstrap permission precedence — 2026-10-28

- Fix OpenCode config merges that appended QIE allow rules after existing restrictions. New defaults now precede existing rules, preserving user permission precedence and order.
- Add a regression covering existing catch-all, allow, ask and deny rules, unchanged backup bytes and stable rule order on repeated merges.
- Make home-path unit-test inputs independent of the runner's XDG and Claude configuration environment.

## Agent-agnostic consumer bootstrap — 2026-10-27

- Add `scripts/bootstrap-consumer.mjs`, a wrapper around the pinned Skills CLI that installs the canonical `.agents/skills` suite plus agent-specific projections, writes managed instruction blocks for AGENTS.md-aware and native agent surfaces, and verifies the installed payload.
- Add `templates/consumer/agents.json` with 19 curated agent entries plus the universal canonical entry, `templates/consumer/AGENTS.md` with mandatory routing, evidence, network and approval rules, and `templates/consumer/opencode.jsonc`.
- Preserve existing instruction files and OpenCode config. Merging an existing OpenCode config requires `--merge-opencode-config` and creates a timestamped backup; comments are not preserved by that rewrite.
- Add integration tests for universal and Claude Code installs, global mode, the curated matrix, dry-run, idempotency, existing-file preservation and JSONC merge behavior.
- Keep Git source URLs intact while expanding `~` for `--source`, `--target` and `--cli`, and reject malformed canonical matrix entries that cannot route the `universal` CLI agent.
- Preserve the original OpenCode config file mode on timestamped backups, so a private `0600` config does not become world-readable.
- Refuse to write instruction files or OpenCode configs through symlinked files or parent directories, so a cloned consumer repository cannot redirect bootstrap writes outside the project.

## QIE Wallet discovery — 2026-10-26

- Prefer QIE Wallet's EIP-6963 announcement and `window.qie` over a competing legacy provider, with re-announcement on explicit Connect and provider-shape checks.
- Add the supplied Chrome Web Store listing to the missing-provider recovery path and document QIE Wallet's Testnet setting.
- Expand deterministic browser coverage from 16 to 22 cases, including multiple wallets and `accountsChanged([])` disconnection; see [wallet discovery results](docs/results/qie-wallet-discovery-2026-10-26.md).

## Counter testnet preparation — 2026-10-26

- Capture pinned offline Counter build/test results, ABI, creation/runtime bytecode and a standard JSON compiler input with matching bytecode output.
- Record a read-only creation simulation on testnet RPC2, compare its returned runtime with the compiled artifact, and retain the synthetic-sender gas quote.
- Add an [unsigned deployment review](docs/deployment/counter-testnet-review.json) with explicit signer, fee and submission blockers; see the [preparation report](docs/results/counter-testnet-preparation-2026-10-26.md).

## Read-only testnet observations — 2026-10-26

- Record real QIE EVM testnet identity, block progression and bounded read-only method observations on the officially documented RPC2 endpoint, preserving RPC1 and RPC3 failures alongside the passing observations.
- Retain timestamped reports, commands, exit codes, input fingerprints and artifact checksums in [the testnet observation report](docs/results/qie-testnet-readonly-2026-10-26.md); canonical statuses remain unchanged.

## Dependency security maintenance — 2026-10-26

- Update AJV's transitive `fast-uri` dependency from `3.1.8` to `3.1.9`, which patches four URI parsing and normalization advisories (two medium, two low).
- Add `npm run audit:security` and a separate CI dependency-audit job covering production and development dependencies, with a low-or-higher failure threshold.

## QIE ecosystem intelligence expansion — 2026-10-24

- **Release version:** `0.6.0-ecosystem.1` (working-tree candidate; not published)
- **Schema version:** `1.4.0` (integration records are additive)
- **Release identity:** `838a1e0952fe8da3bc6bbe746bb83754aba40acbd13611ae1ec46e8430103309`
- **Scope:** source-grounded QUSDC and QIE Lending intelligence, token accounting, QIE Wallet/RPC integration guidance, Oracle/DEX/Bridge/ID/Pass/native/indexing boundaries, shared address identity gate and seven new reusable recipes.
- **Safety:** source-published address candidates are retained as CLAIMED discovery records unless technical sources genuinely disagree; all integration, interface and operation records are fail-closed with `execution_allowed: false`; no QIE RPC write, signer, bridge transfer or live wallet action was run.
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
