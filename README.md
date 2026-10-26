# QIE Forge engineering foundation

QIE Forge is a Skills-first knowledge and developer workflow system for QIE. This checkout implements B02–B09 within the available evidence from the approved [architecture](docs/architecture.md), using [PRD v2.1](QIE_Forge_PRD_v2.1.md) as its requirements.

All QIE Forge product prose, recipes and authored code in this repository are original. Canonical records distinguish official QIE source facts from QIE Forge analysis, and third-party development dependencies remain declared in `package-lock.json`. Third-party research notes used during design are not part of the product tree and are archived outside the repository. No third-party source code is bundled in any skill.

Nine generated local skill artifacts are available:

- [`qie`](skills/qie/SKILL.md) — the task router. It classifies intent, target network (mainnet vs testnet) and EVM-vs-native context, then routes to the minimal topical skill or to the bundled QIE A–Z coverage references. It carries no chain facts of its own, distinguishes installable published skills from non-installable planned ones, and instructs explicit remediation when a routed skill is not installed.
- [`qie-networks`](skills/qie-networks/SKILL.md) — original local network references, an optional offline inspector and an optional read-only live preflight helper. Its eleven network facts are **DOCUMENTED**; its RPC capability is **UNKNOWN**.
- [`qie-smart-contracts`](skills/qie-smart-contracts/SKILL.md) — actual local Foundry build/test/ABI replay with original Solidity assets.
- [`qie-frontend`](skills/qie-frontend/SKILL.md) — framework-neutral TypeScript read controller, chain/account gating and UI integration guidance; mock-tested.
- [`qie-wallets`](skills/qie-wallets/SKILL.md) — capability discovery, deliberate connection, invalidation and developer-owned signing boundaries.
- [`qie-transactions`](skills/qie-transactions/SKILL.md) — independently bundled receipt/direct-creation observations with explicit proof limits.
- [`qie-deployment`](skills/qie-deployment/SKILL.md) — local artifacts, selected-network preflight, blocked review template and post-submission inspection; no untested broadcast command.
- [`qie-debug`](skills/qie-debug/SKILL.md) — stage-specific troubleshooting and read-only diagnostics without sibling dependencies.
- [`qie-ecosystem`](skills/qie-ecosystem/SKILL.md) — operation-scoped ecosystem catalogue, compatibility matrix and decision guide, all projected from the canonical records at the frozen build clock.

The generated suite in this working tree is the `0.6.0-ecosystem.1` candidate with payload identity `838a1e0952fe8da3bc6bbe746bb83754aba40acbd13611ae1ec46e8430103309`. It expands the canonical recipes with QUSDC escrow, ERC-20 accounting, Lending read adapters, address investigation, ecosystem selection, Oracle collateral, transaction reads and bounded RPC capability probing. B09's **private-distribution** evidence was recorded against the earlier `0.5.1-ecosystem.1` payload (`b280364e…`) and remains historical; it does not certify these changed bytes. Public distribution, anonymous access and repository licensing remain unproven. See [B09 results](docs/b09-results.md). Native/indexing procedures remain source navigation, not invented execution support. Address candidates are discovery-only and never executable without the shared identity gate.

Current candidate evidence is recorded in the [release results](docs/evidence/qie-knowledge-release-results.md). Follow the [B09-first integration order](docs/implementation/qie-knowledge-expansion.md#pull-request-integration-order): review PR #1 before integrating PR #2, preserve the combined engineering gates, and rerun them after rebasing. CI acceptance must cover the current PR head; a successful run on an earlier commit does not certify later changes.

Read-only QIE testnet checks were captured on 2026-10-26: RPC2 returned the documented chain ID and advancing blocks, while RPC1 and RPC3 were unavailable from the capture machine. The [testnet observation report](docs/results/qie-testnet-readonly-2026-10-26.md) retains each attempt, command, exit code and artifact hash. These observations do not promote canonical claims or qualify deployment or wallet compatibility. Automated tests and install checks continue to use injected mock transports; live RPC checks remain separate from CI.

The [Counter testnet preparation](docs/results/counter-testnet-preparation-2026-10-26.md) adds compiled ABI/initcode/runtime artifacts and a read-only creation simulation whose returned runtime matches the compiled contract. Its [unsigned deployment review](docs/deployment/counter-testnet-review.json) remains `BLOCKED` until a developer-controlled account, actual-signer estimate, fee limits and submission path are established. The simulation is not a deployed reference application.

## Develop and verify

New to this checkout? Follow the [developer quickstart](docs/quickstart.md) for the tested toolchain acquisition path, exact commands and recovery steps. The implementation record for the earlier slice is in [docs/results/developer-experience-slice.md](docs/results/developer-experience-slice.md); the remediation record is in [docs/results/developer-experience-remediation.md](docs/results/developer-experience-remediation.md).

Use Node.js **24.20.0** and npm **11.19.0**, the versions executed for this foundation. Dependencies are pinned in `package-lock.json`.

The B07 local replay additionally requires existing **Forge 1.8.1** (commit pinned in `recipes/build-test/toolchain.json`) and a native **solc 0.8.37** binary. One resolver is shared by `doctor`, example preparation, the clean-consumer check and the installed-recipe replay: an absolute `QIE_FORGE_SOLC` override is authoritative and fails closed if broken; otherwise a native `solc` on PATH is used; otherwise an existing `solc-select` artifact referenced by a wrapper is resolved without executing the wrapper. Nothing is installed or downloaded during discovery. The clean tests copy that one resolved binary into an isolated native toolchain directory and never export an override. Local compiler/EVM-target success does not prove QIE deployment compatibility.

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm run doctor
npm run build:check          # non-mutating; run before any build
npm run example:prepare:check
npm run validate
npm run docs:check
npm run lint
npm test
npm run typecheck
npm run example:build
npm run test:browser
```

`npm run audit:security` checks production and development dependencies against the npm registry and fails on advisories rated low or higher. CI runs this online check in a separate **Audit dependencies** job alongside the engineering gates.

Install the browser once with `npx playwright install --with-deps --no-shell chromium`. Regenerate owned output only with `npm run build` and `npm run example:prepare`; never hand-edit `skills/` or the generated Counter asset.

`npm run verify:b09-evidence` re-executes the eight B09 gates in order, writes the complete logs to `docs/evidence/b09/`, and fails when `docs/b09-results.md` quotes numbers the run did not produce. `npm run verify:evidence` remains the preserved B08 evidence generator and is bound to the historical B08 report figures; it is not the B09 evidence path.

`lint` checks JavaScript syntax only; no style linter is configured. `npm run typecheck` runs TypeScript in strict mode over the canonical read controller, the Counter example and its browser tests. Tests use Node's runner with process isolation disabled so it works in the current sandbox. Each filesystem test still creates and removes its own temporary project. Real child commands capture output through regular files because captured subprocess pipes fail in this sandbox.

## Counter reference app

[`examples/counter-dapp`](examples/counter-dapp/README.md) is a small read-only app that imports the canonical wallet-read controller and packaged network snapshot instead of copying them. Its ABI/selector asset is generated from the single canonical Counter source in `recipes/build-test/assets` by `npm run example:prepare`. The default mode is a clearly labelled deterministic mock. Injected-wallet mode discovers QIE Wallet through EIP-6963 or `window.qie` before the legacy `window.ethereum` fallback; Connect displays the selected account, and reads require a configured contract address. The session rejects a wrong chain, invalidates on wallet events and address changes, discards late results and never signs or broadcasts. See the [quickstart](docs/quickstart.md#4-run-the-counter-reference-app) for commands and the [wallet discovery results](docs/results/qie-wallet-discovery-2026-10-26.md) for the tested scope.


## Install the skills

After building, run the existing, pinned Skills CLI from a separate consumer project. Replace the checkout path below with this checkout's absolute path:

```sh
node /absolute/path/to/QIE-FORGE/node_modules/skills/bin/cli.mjs add /absolute/path/to/QIE-FORGE --list
node /absolute/path/to/QIE-FORGE/node_modules/skills/bin/cli.mjs add /absolute/path/to/QIE-FORGE --skill '*' -a codex -a claude-code -y
```

Use `--skill qie-smart-contracts` (or any listed name) for a single self-contained skill; `--skill '*'` selects the complete generated suite (currently **nine** skills). `qie-debug` can be installed alone or alongside a topical skill. Add `--copy` for copied agent installations. The CLI version tested is **1.7.2**. Local-directory sources are install-only: `skills update` exits 0 but reports no matching installed skills for them, so use a Git source when updates are required. The generated bytes in this checkout are a local candidate release, not a claim that the same payload already exists at a remote ref.

For a Git source, pin an immutable tag or a full commit SHA:

```sh
node /absolute/path/to/QIE-FORGE/node_modules/skills/bin/cli.mjs add https://github.com/OWNER/REPO.git#<full-commit-sha> --skill '*' -a codex -a claude-code -y
```

The CLI records the requested ref in `skills-lock.json`. `skills update -p -y` follows a mutable branch, leaves a pinned tag or SHA unchanged, and can convert a prior `--copy` projection into a symlink while leaving the canonical `.agents` copy in place. Reinstall with `--copy` when copied Claude Code files are required after an update.

Rollback is an explicit reinstall of the known-good immutable ref, not an in-place history rewrite:

```sh
node /absolute/path/to/QIE-FORGE/node_modules/skills/bin/cli.mjs add https://github.com/OWNER/REPO.git#<known-good-sha> --skill '*' --copy -a codex -a claude-code -y
```

Verify the exact installed files, manifest hashes and suite identity without modifying them:

```sh
node scripts/verify-installed-release.mjs --root .agents/skills --expect-suite
node scripts/verify-installed-release.mjs --root .agents/skills --expect-suite --release-id <trusted-release-id>
```

`--expect-suite` requires the exact nine canonical skill names, valid `SKILL.md` frontmatter and coherent file inventories; unrelated agent skills beside them are ignored. If a sibling `.claude/skills` directory contains any QIE Forge projection, the verifier also checks all canonical projections there: relative symlinks must resolve to the canonical `.agents` bundle, and copied projections must match canonical bytes exactly. A Claude directory containing only unrelated skills is treated as a Codex-only install and skipped. Use `--claude-root <dir>` for a non-default projection path or `--no-claude` to skip projection checks.

The JSON report separates four claims. `inventoryComplete` is structural: the exact canonical nine bundles are present and their declared file inventories were read. `payloadIntegrity` covers SHA-256 verification of listed non-manifest files. `releaseCoherence` covers schema, inventory, snapshot, frontmatter, identity and projection checks. `publisherAuthenticity` compares the recomputed identity with an optional trusted pin; its `PINNED_MATCH` value is scoped to **payload identity only** (`authenticityScope: PAYLOAD_IDENTITY_ONLY`). `verificationComplete` is true only when the canonical inventory is complete and every blocking check passes; the legacy `suiteComplete` field is an alias with that same fail-closed value. A rejected installation, a mixed identity, an invalid schema, a broken projection or a wrong pin therefore never reports `suiteComplete: true`.

`COHERENT_FULL_SUITE` means the installed tree is internally coherent. Supply `--release-id` from a trusted/pinned source to match its payload identity; without that pin, `publisherAuthenticity` is `NOT_ESTABLISHED`. The verifier exits 1 for digest mismatches, snapshot/path containment failures, provenance mismatches, missing or malformed frontmatter, mixed release identities, incompatible schema versions, legacy manifests without `release_id`, incomplete suites or broken Claude projections. The CLI itself does not validate manifests during install or update, so this post-operation check is required for B09 acceptance.

`MANIFEST.json` is deliberately excluded from the release identity to avoid self-hashing. The verifier derives each bundle's `sources_checked_at` from the review timestamps of the selected snapshot's source records and rejects a manifest value that differs. That checks consistency with the payload, but it does **not** make manifest-only metadata part of the content address. `provenance.manifestMetadataAuthenticated` is therefore always `false`; a caller needs an independently trusted manifest or a separately signed index to authenticate metadata outside the release identity. A trusted release-ID match must not be read as authentication of that metadata.

`npm run test:install` executes twenty local combinations (suite plus nine single selections, each in copy/symlink mode) in clean temporary consumer projects and temporary homes. It denies network access, removes the source fixture, validates installed hashes, manifest hashes, release identity, frontmatter and Claude copy/symlink projections, and exercises helpers and wallet invalidation guards. The B09 suite adds eleven local scenarios built on a loopback smart-HTTP Git source, malformed installed trees, path-containment attacks, canonical-inventory checks, projection failures and provenance mutation checks; an authenticated private GitHub proof at an immutable B09 SHA exercised suite/single, copy/symlink, verifier, helper, unrelated-skill and rollback paths. See [B09 results](docs/b09-results.md). B09 is accepted for private distribution only; public distribution, anonymous access and repository licensing remain unproven. These are installer-target checks for Codex/Claude, not execution inside either agent. No global skill directory is modified.

From the installed `qie-networks` directory:

```sh
node scripts/inspect-network.mjs qie-testnet
node scripts/verify-network.mjs qie-mainnet
```

The inspector reads its own packaged JSON and status evaluator, requires no npm installation and no network, and always reports `live_check.outcome: NOT_RUN`. The preflight helper contacts the packaged documented endpoint (or a `--rpc` override on the selected network), verifies `eth_chainId` and block responsiveness, prints one JSON report and exits fail-closed (`0` PASS, `1` FAIL/UNKNOWN, `2` usage). An `UNKNOWN` or `FAIL` outcome must never be read as a successful preflight. It never signs, broadcasts or requests a key. Source helper files inside this checkout cannot reach packaged data by default; both helpers accept an explicit `--claims <network-claims.json>` snapshot for maintainer use.

The installed `qie` router needs no helper: its routing table, A–Z coverage map and catalogue snapshot are plain local files.

## Editable inputs and generated output

| Path | Purpose |
|---|---|
| `authoring/qie/` | Original router entry prose |
| `authoring/qie-networks/` | Original skill entry and procedural references |
| `authoring/qie-*/` | Original topical entries; select only the resources needed for the task |
| `recipes/<task>/` | Canonical Markdown recipe and local assets; selected trees retain their relative paths in each consuming bundle |
| `knowledge/` | Canonical sources, claims, capabilities, addresses, domains, selectors, validation runs and policy |
| `knowledge/schema/` | Strict JSON Schema 2020-12 contracts |
| `scripts/` | Original build, validation and offline helper sources; contributor tooling only |
| `release-context.json` | Frozen release/schema versions and build timestamp; a release-cut chronology gate rejects a `built_at` or any source `reviewed_at` that is later than the real build clock (five-minute documented skew tolerance) |
| `dist/skills/` | Generated staging, ignored by version control |
| `skills/qie/` | Generated, publishable standalone router bundle |
| `skills/qie-networks/` | Generated, publishable standalone bundle; keep with its manifest |
| `tests/` | Schema, evidence, freshness, packaging, routing-contract and actual installer tests |

Edit canonical inputs, then run `npm run build`. The build replaces the owned `dist/skills/` and `skills/` trees. Do not place manual files there. `build:check` compares regenerated bytes with the published tree without modifying it. Build time never supplies live evidence or extends expiry.

See [source coverage](docs/source-map.md), [resolved contracts](docs/decisions.md), [executed B02–B04 results](docs/foundation-results.md), [B05 router results](docs/b05-results.md), [B06 diagnostic results](docs/b06-results.md), [B07 operational results](docs/b07-results.md), [B08 ecosystem results](docs/b08-results.md), the [B08 final-integrity corrections](docs/b08-final-integrity-results.md), [B09 distribution results](docs/b09-results.md) and the [changelog](CHANGELOG.md). Official `skills-ref` validation remains a separate gate; independent validation/installer checks do not replace it. TypeScript is strictly typechecked, and the Counter reference UI has rendered browser regression coverage; neither proves QIE network or wallet compatibility. This is a local engineering candidate, not a production or public-release readiness claim.
