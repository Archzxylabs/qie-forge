# QIE Forge engineering foundation

QIE Forge is a Skills-first knowledge and developer workflow system for QIE. This checkout implements B02–B08 within the available evidence from the approved [architecture](docs/architecture.md), using [PRD v2.1](QIE_Forge_PRD_v2.1.md) as its requirements.

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

The five canonical recipes are network preflight, local contract build/test, wallet read, deployment preparation and debugging. All nine P0 skills are published in release `0.5.1-ecosystem.1`; the B09 distribution/update/rollback gate is a separate milestone. Native/indexing procedures remain source navigation, not invented execution support.

No live network check has been run against a real QIE endpoint. The diagnostic helpers are exercised in tests and install checks exclusively against injected mock transports; their output is always framed as an observation, never as new evidence or a status promotion.

## Develop and verify

Use Node.js **24.20.0** and npm **11.19.0**, the versions executed for this foundation. Dependencies are pinned in `package-lock.json`.

The B07 local replay additionally requires existing **Forge 1.8.1** (commit pinned in `recipes/build-test/toolchain.json`) and a native **solc 0.8.37** binary. Set `QIE_FORGE_SOLC` to its absolute path for tests. On this workstation the test also discovers the existing standard solc-select artifact path. It copies the binary into the clean fixture; it never installs or upgrades a tool. A PATH `solc-select` wrapper may try to download under an empty HOME, so the recipe explicitly takes `SOLC_BIN`. Local compiler/EVM-target success does not prove QIE deployment compatibility.

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm run build
npm run validate
npm run docs:check
npm run build:check
npm run lint
npm test
npm run test:coverage
npm run test:install
```

`npm run verify:evidence` re-executes every gate above in one deterministic pass and rewrites the preserved logs in `docs/evidence/b08/`, failing if any gate fails.

`lint` currently checks JavaScript syntax; no style linter or TypeScript compiler is configured. Tests use Node's runner with process isolation disabled so it works in the current sandbox. Each filesystem test still creates and removes its own temporary project. Real child commands capture output through regular files because captured subprocess pipes fail in this sandbox.

## Install the skills

After building, run the existing, pinned Skills CLI from a separate consumer project. Replace the checkout path below with this checkout's absolute path:

```sh
node /absolute/path/to/QIE-FORGE/node_modules/skills/bin/cli.mjs add /absolute/path/to/QIE-FORGE --list
node /absolute/path/to/QIE-FORGE/node_modules/skills/bin/cli.mjs add /absolute/path/to/QIE-FORGE --skill '*' -a codex -a claude-code -y
```

Use `--skill qie-smart-contracts` (or any listed name) for a single self-contained skill; `--skill '*'` selects the complete generated suite (currently **nine** skills). Add `--copy` for copied agent installations. The CLI version tested is **1.7.2**. Its local-source discovery and installer are tested; public Git-source publication, agent activation and successful host workflows are separate requirements.

`npm run test:install` executes twenty combinations (suite plus nine single selections, each in copy/symlink mode) in clean temporary consumer projects and temporary homes. It denies network access, disables installer telemetry, removes the source fixture, validates installed hashes/local links, and exercises helpers and wallet invalidation guards. The separate recipe test also installs with the real CLI before offline Foundry replay. These are installer-target checks for Codex/Claude, not execution inside either agent. No global skill directory is modified.

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

See [source coverage](docs/source-map.md), [resolved contracts](docs/decisions.md), [executed B02–B04 results](docs/foundation-results.md), [B05 router results](docs/b05-results.md), [B06 diagnostic results](docs/b06-results.md), [B07 operational results](docs/b07-results.md), [B08 ecosystem results](docs/b08-results.md) and the [B08 final-integrity corrections](docs/b08-final-integrity-results.md). Official `skills-ref` validation remains a separate gate; independent validation/installer checks do not replace it. TypeScript assets are executed through Node's type stripping, not typechecked or tested in an actual browser. This is a local engineering candidate, not a production or public-release readiness claim.
