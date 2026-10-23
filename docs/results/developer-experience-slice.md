# Developer experience slice — implementation report

**Date:** 2026-10-21
**Branch:** `feat/b09-distribution` at `b092763` (no commits, pushes, merges or visibility changes made)
**Scope:** first developer-facing vertical slice: `--claims` inspector defect, environment doctor, runnable Counter example with browser tests and strict type checking, clean-consumer replay, CI workflow, quickstart and agent evaluation.

## Result

The slice is implemented and locally verified. The canonical inspector now accepts `--claims`, generated output was regenerated only through the supported build scripts, the new example and browser tests pass, and a clean consumer can build/test Counter from installed bundles after the source checkout is deleted.

One consequence must be stated explicitly: regenerating the bundles changes the derived release identity. `release-context.json` was deliberately **not** re-cut because the historical B08 report is bound to its canonical `built_at` value by `tests/evidence-logs.test.mjs`. Historical evidence documents therefore still quote the older identity and were **not** modified.

| | Identity |
| --- | --- |
| Baseline (`b092763`, before this slice) | `b280364ed46be17d048f2b5c7c78485c8c35bb7172d123dd253f784fdf17b3ce` |
| Final working tree | `e59be15b276950d4ca99dc86760af0460bcd49749c87b4079c2cc0daa7a8fd79` |

## Baseline

Captured before changes on a clean tree:

- Node.js `v24.20.0`, npm `11.19.0`, Forge `1.8.1` (commit `982849d3140c01fd3b72905759581a132df7aa98`), native solc `0.8.37+commit.f401782d`.
- `npm test`: **281 pass, 0 fail, 0 skip**.
- `npm run validate`, `npm run build:check`, `npm run docs:check`, `npm run lint`: all passed.
- Baseline release identity: `b280364e…b3ce`.

No baseline check failed. The only environment issue encountered was a local Playwright headless-shell download timeout; the already-installed full Chromium build is used through `channel: 'chromium'`, and CI installs with `--no-shell`.

## What changed

### 1. Inspector `--claims` defect

`scripts/inspect-network.mjs` now:

- accepts one explicit network plus optional `--claims <network-claims.json>`;
- keeps the installed-skill default (`../data/network-claims.json` relative to the helper);
- rejects unknown options, missing/empty option values, extra positionals and invalid network names;
- uses exit `0` for a report, `1` for an unusable snapshot and `2` for usage errors;
- reports fixed, sanitized messages instead of parser text, so supplied file contents cannot leak through errors;
- remains fully offline and preserves the conservative `DOCUMENTED`/`NOT_RUN` result structure.

The authoring note in `authoring/qie-networks/SKILL.md.in` documents the maintainer override; the installed bundle needs no option. Ten new regression tests are in `tests/inspect-network-cli.test.mjs`, including a network-denying guard and a malformed-snapshot non-leak check.

Manual reproduction now succeeds:

```sh
node scripts/inspect-network.mjs qie-testnet --claims skills/qie-networks/data/network-claims.json
# exit 0; chain_id 1983; every status DOCUMENTED; live_check NOT_RUN
```

### 2. Environment doctor

`scripts/doctor.mjs` is repository-local and strictly observational. It reports and gates on:

- Node.js against `engines.node`;
- exact npm against `packageManager`;
- Forge version **and** commit against `recipes/build-test/toolchain.json`;
- `QIE_FORGE_SOLC` first, then PATH solc, including a native compile probe;
- dependency presence;
- coherence of the nine generated bundles through the existing installed-release verifier.

It never downloads, installs, upgrades or contacts a network. Exit `0` is `READY`; any failed or skipped required check is `NOT_READY` with a remediation line. Three tests cover the ready path, a broken `QIE_FORGE_SOLC` override (fails instead of falling back) and a stripped-PATH environment.

### 3. Counter reference example

Added `examples/counter-dapp/`:

- imports the canonical controller from `recipes/wallet-read/assets/wallet-read.ts` and the packaged snapshot from `skills/qie-wallets/data/network-claims.json`; neither is copied;
- keeps the only Counter source in `recipes/build-test/assets`; `scripts/prepare-counter-example.mjs` verifies the pinned local Forge commit and solc version, derives `src/generated/counter.ts` offline, and supports `--check`;
- defaults to a prominently labelled mock demonstration using a deterministic adapter and a synthetic, non-deployed fixture address;
- supports an explicit injected-wallet mode with a configured contract address, no auto-connect, chain checks before account access and reads, account/chain/disconnect and address-change invalidation, late-result discard, safe `textContent` rendering, and no signing or broadcasting;
- exposes mode, network, address, phase, account, configured contract, read status and value, with deliberate retry after rejected connections and failed reads.

Browser coverage: 12 injected-fixture checks in `tests/counter.spec.ts` plus one no-wallet mock check in `tests/mock.spec.ts` (including a late connection result discarded after a mode switch and address-change invalidation). The tests use a deterministic EIP-1193 fixture and do not claim real-wallet or QIE compatibility.

### 4. Strict type checking

`tsconfig.json` covers the canonical controller, example sources/configs and browser tests with `strict`, bundler resolution, DOM and Node types. The canonical `scripts/lib/effective-status.mjs` boundary is documented with JSDoc rather than forked. `npm run typecheck` passes with TypeScript 7.0.2.

### 5. CI

Added `.github/workflows/ci.yml`:

- `permissions: contents: read`, concurrency cancellation, Ubuntu 24.04, 30-minute timeout;
- immutable action pins: checkout v7.0.1 `3d3c42e…`, setup-node v7.1.0 `949feb2…`, foundry-toolchain v1.9.1 `908c540…`, upload-artifact v7.0.2 `cf430e0…`;
- pinned npm 11.19.0, Foundry 1.8.1 and solc 0.8.37 downloaded from the official binary host with SHA-256 verification;
- non-mutating `build:check` and `example:prepare:check` before any mutating build, then validate/docs/lint/tests/typecheck/build/browser checks;
- a final `git diff --exit-code` plus `git status --porcelain` cleanliness gate;
- failure-only upload of Playwright reports/traces and npm logs.

No secrets, no real QIE RPC, no signing and no deployment are involved. The workflow was not executed on GitHub, but its solc path was reproduced locally: the official binary downloads with the documented SHA-256, `QIE_FORGE_SOLC` pointed at it makes `doctor` `READY`, `example:prepare:check` reproduces the committed asset, and `npm test` passes 295/295 under that CI-equivalent environment.

### 6. Clean-consumer replay

`tests/consumer-journey.test.mjs` installs only `qie-networks`, `qie-smart-contracts` and `qie-wallets` with the pinned Skills CLI and `--copy` into a private-HOME temp consumer, deletes the source fixture, then:

- verifies the partial installed release is `COHERENT_PARTIAL` with `payloadIntegrity: VERIFIED` and the expected identity;
- confirms the six sibling skills are absent and no installed byte contains the checkout or consumer absolute path;
- runs the installed inspector from its packaged default snapshot;
- drives the installed read controller with a mock provider against the installed snapshot;
- copies the installed Counter assets and replays real offline Forge build/test with the native compiler: **5 passed, 0 failed, runs 256**.

### 7. Documentation and agent evaluation

- `docs/quickstart.md`: supported toolchain acquisition with the verified solc checksum, install/verify commands, exact expected results, browser setup, installed-resource replay, recovery table, agent prompts and explicit mock/local/live boundaries.
- `examples/counter-dapp/README.md`: canonical-source map, modes, checks and limitations.
- `docs/agent-evaluation.md`: five tasks, pass criteria, replay instructions and recorded statuses. Task 1 (local build/test) and task 5 (missing-capability honesty) **PASS** in an OpenCode child-agent session; tasks 2–4 are **NOT_RUN**.
- `README.md`: quickstart/example links, corrected verification sequence and accurate lint/typecheck statement. No historical B08/B09 evidence was edited.

## Verification evidence

All commands were run against this working tree after the final edits.

| Command | Exit | Result |
| --- | --- | --- |
| `npm ci --ignore-scripts --no-audit --no-fund` | 0 | Installed from the lockfile; post-install doctor and pre-build checks passed |
| `npm run doctor` | 0 | `READY`; Node 24.20.0, npm 11.19.0, Forge 1.8.1/commit match, solc 0.8.37 native probe, nine coherent bundles at `e59be15b…` |
| `npm run build:check` | 0 | Reproduced all nine bundles; committed generated output matches canonical sources |
| `npm run example:prepare:check` | 0 | Generated Counter ABI/selector asset is current |
| `npm run validate` | 0 | 15 domains, 18 sources, 11 claims, 25 capabilities; 9 bundles; identity `e59be15b…` |
| `npm run docs:check` | 0 | Evidence catalogue matches canonical knowledge records |
| `npm run lint` | 0 | JavaScript syntax checks passed; message now points to `npm run typecheck` |
| `npm test` (with `QIE_FORGE_SOLC` at the official native binary) | 0 | **295 tests: 295 pass, 0 fail, 0 skip**; 81.4 s; includes 10 inspector CLI tests, 3 doctor tests, 1 clean-consumer test and the existing installation suite |
| `npm run typecheck` | 0 | Strict TypeScript 7.0.2, canonical controller + example + browser tests |
| `npm run example:build` | 0 | Vite 8.3.5 production build (18.70 kB JS, 5.46 kB gzip) |
| `npm run test:browser` | 0 | **13 passed** (9.6 s), Chromium 156.0.8078.4 via `channel: 'chromium'` |
| `QIE_FORGE_SOLC=/tmp/opencode/solc-check npm run doctor` | 0 | `READY`; native 0.8.37 binary at the explicit path passed the compile probe |
| `QIE_FORGE_SOLC=/tmp/opencode/solc-check npm run example:prepare:check` | 0 | Committed Counter asset current when reproduced with the official native binary |
| `node scripts/inspect-network.mjs … --claims …` | 0 | chain 1983, statuses `DOCUMENTED`, live check `NOT_RUN` |
| `git diff --check` | 0 | No whitespace errors |
| final `build:check` + `example:prepare:check` after the mutating example build | 0 | Mutating build left generated output byte-identical |

The working tree is intentionally uncommitted: `git status --porcelain` lists the intended modified and new files only. The CI cleanliness gate applies to the committed revision and both checks above prove the mutating example build does not introduce a diff. `release-context.json`, `docs/b09-results.md`, `docs/evidence/` and the audit documents are untouched.

## Mock versus real-tool scope

| Surface | What actually runs | What it does not prove |
| --- | --- | --- |
| Mock demonstration | In-browser deterministic adapter; no wallet or RPC | Any QIE behavior, wallet compatibility or deployed address |
| Injected browser tests | Deterministic EIP-1193 fixture in Chromium | Real wallet extension behavior or QIE RPC compatibility |
| Type check | TypeScript compiler over canonical controller and example | Runtime provider behavior |
| Forge/solc replay | Real local Forge 1.8.1 and native solc 0.8.37; 5 tests, 256 fuzz runs | QIE deployment, gas, opcodes or endpoint compatibility |
| Skills CLI install | Real pinned CLI, copied installed bundles, private HOME | Publisher authenticity or real agent-client behavior |
| Inspector | Packaged snapshot only | Live network identity (`live_check: NOT_RUN`) |
| Doctor | Local tool/version/bundle observation | Network, wallet or publisher compatibility |
| CI workflow | Static YAML validated locally; not executed here | A real GitHub Actions run |

## NOT_RUN and known gaps

- **No real QIE RPC call.** No read-only live preflight against a real QIE endpoint was executed; all network claims remain `DOCUMENTED` and live checks `NOT_RUN`. No endpoint is known to be live or compatible.
- **No real wallet.** The example has not been exercised with any browser wallet or injected extension; tests use fixtures only.
- **No deployment/signing/broadcast/indexing.** No address was invented or deployed.
- **Historical evidence commands not run.** `verify:evidence` and `verify:b09-evidence` are outside this slice. Because the generated bytes changed, the B09 report's quoted `b280364e…` identity is historical and would not certify this tree; `docs/b09-results.md` was deliberately left unchanged.
- **CI not executed.** Action SHAs, inputs and YAML were verified locally, but no push or workflow dispatch was made.
- **Agent evaluation tasks 2–4** are NOT_RUN; tasks 1 and 5 PASS. See `docs/agent-evaluation.md`.
- **Platform scope** is Linux only (local workstation and Ubuntu 24.04 CI target); macOS and Windows were not tested.
- `npm run test:coverage` was not rerun; the required `npm test` already includes installation coverage and the new consumer journey. `npm run test:install` is not run separately to avoid duplicating the suite.

## Shortest reviewer path

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm run doctor
npm run build:check
npm run example:prepare:check
npx playwright install --with-deps --no-shell chromium
npm test
npm run typecheck
npm run example:build
npm run test:browser
node scripts/inspect-network.mjs qie-testnet --claims skills/qie-networks/data/network-claims.json
```

Expected: doctor `READY`; both pre-checks exit 0; 295/295 tests; typecheck exit 0; browser 13/13; inspector chain 1983 with `NOT_RUN`. For a manual look at the example, run `npm run example:dev` and keep the default labelled mock mode, or deliberately switch to an injected provider with a configured address.

For review focus: `scripts/inspect-network.mjs`, `scripts/doctor.mjs`, `examples/counter-dapp/`, `.github/workflows/ci.yml`, `tests/consumer-journey.test.mjs`, `docs/quickstart.md` and `docs/agent-evaluation.md`. Regenerate owned output only with `npm run build` / `npm run example:prepare`; never hand-edit `skills/` or `src/generated/counter.ts`.
