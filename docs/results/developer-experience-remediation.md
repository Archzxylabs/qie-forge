# Developer experience remediation — implementation report

**Date:** 2026-10-21 (UTC)

**Branch:** `feat/b09-distribution` at `b0927630eed7a1a519cef52986c7eeb062b5fbef`; all changes are uncommitted. No commit, push, tag, publish, deploy, merge, visibility change or QIE network call was made.

**Scope:** repair the developer-experience slice's compiler discovery and Counter invalid-address recovery, recut active metadata to a new local prerelease, decouple historical evidence checks from the active cut, add the missing assertion-diagnosis agent evaluation, and re-run the complete local verification sequence.

## Result

The remediation is implemented and locally verified. The generated suite now identifies itself as `0.5.2-ecosystem.1` with one shared payload identity. A native solc supplied only through `PATH` works in an isolated HOME with no `.solc-select` cache; a broken `QIE_FORGE_SOLC` override fails without fallback; and a solc-select wrapper is inspected but never executed. The Counter app no longer turns an invalid address into a failed session retry. Historical B08/B09 evidence remains byte-for-byte untouched and is checked against an explicit historical record instead of the active release.

Final measured results: **`npm test`: 304 passed, 0 failed, 0 skipped; browser: 16 passed, 0 failed.** All required consistency checks pass after the mutating example build.

## Release identities

| Tree | Human version | Release identity |
| --- | --- | --- |
| Historical B09 accepted payload | `0.5.1-ecosystem.1` | `b280364ed46be17d048f2b5c7c78485c8c35bb7172d123dd253f784fdf17b3ce` |
| Prior uncommitted developer-experience payload | `0.5.1-ecosystem.1` | `e59be15b276950d4ca99dc86760af0460bcd49749c87b4079c2cc0daa7a8fd79` |
| This remediation (active working tree) | `0.5.2-ecosystem.1` | `3f88cb8b595dfdc2b3defa38ffb1d0e6efc71ee9d3158210d41262620561e30b` |

The active cut is `2026-10-21T17:28:25Z`. All nine `skills/*/MANIFEST.json` files carry the same version, timestamp and identity. The previous uncommitted identity `e59be15b…` is not relabelled as published, and the historical B09 identity `b280364e…` remains the identity quoted by the B09 evidence.

## Toolchain

| Tool | Version / pin |
| --- | --- |
| Node.js | `24.20.0` |
| npm | `11.19.0` |
| Skills CLI | `1.7.2` |
| Forge | `1.8.1`, commit `982849d3140c01fd3b72905759581a132df7aa98` |
| solc | native `0.8.37+commit.f401782d` |
| TypeScript | `7.0.2` |
| Playwright | `1.64.1`, Chromium via `channel: 'chromium'` |

## Defects and fixes

### 1. Compiler discovery was duplicated and unsafe

The previous `doctor` and example-preparation paths had separate discovery rules. They could resolve `~/.solc-select` directly, did not consistently support a native `solc` that was already on `PATH`, and risked executing a solc-select wrapper that could download a compiler during an allegedly offline check.

**Fix.** Added `scripts/lib/solc.mjs`, one resolver used by `doctor`, `prepare-counter-example.mjs`, the clean-consumer test and the installed-recipe replay:

- an absolute `QIE_FORGE_SOLC` is authoritative; a relative, missing, non-executable, non-native, or incompatible override fails without fallback;
- otherwise an already-installed native `solc` on `PATH` is selected;
- otherwise a known `solc-select` wrapper is inspected for an existing native artifact under `$HOME/.solc-select`; the wrapper is never executed and nothing is installed or downloaded;
- every selected binary must report the pinned version **and** complete a native compile probe before it is used;
- errors include a stable code, the observed candidate and a concrete remediation.

The clean-consumer and operational replay tests now copy the single resolved native binary into an isolated `toolchain-bin` directory, lead `PATH` with it, assert the isolated HOME has no `.solc-select`, and never export an override. `doctor` passes with a native PATH compiler in an isolated HOME.

### 2. Invalid-address recovery called `connect()` on a ready session

The Counter app offered the same **Retry connection** action for local input errors and session failures. With a ready session and an invalid address, Retry called `connect()` and replaced the useful input error with `SESSION_NOT_READY`.

**Fix.** `examples/counter-dapp/src/main.ts` now:

- keeps a ready session intact when the address is invalid or missing;
- reports `INVALID_ADDRESS` as input feedback, focuses the address field and sets `aria-invalid`;
- hides session Retry unless the session itself has an error;
- disposes/resets the session and clears obsolete input errors on every address change, preserving stale-value invalidation;
- requires an explicit Connect and Read after correcting the address.

The recovery copy in `src/errors.ts` directs the user to the field and states that changing the target disconnects the current session and does not reconnect automatically.

### 3. Active metadata was stale

`package.json`, `package-lock.json` and `release-context.json` still identified the tree as `0.5.1-ecosystem.1` with the old cut, while the generated bytes had changed. The active instructions also referred to the earlier payload as if it were the published distribution.

**Fix.** Recut to `0.5.2-ecosystem.1` at the actual UTC above, regenerated all nine owned bundles through `npm run build`, and documented the local candidate versus the historical B09 payload in `README.md` and `CHANGELOG.md`. No remote ref, publication or visibility claim is made for these bytes.

### 4. Historical checks were coupled to the active release cut

`tests/evidence-logs.test.mjs` read the active `release-context.json`, and consistency tests regenerated the preserved B08 evidence catalogue at the active version. A legitimate recut therefore failed historical tests or forced historical evidence to be rewritten.

**Fix.** Added `tests/fixtures/historical-releases.json` with documented provenance for the preserved B08 cut, review times and B09 identity/test totals. The historical tests and the evidence-catalogue generator now use this record, not `release-context.json`. `docs/b08-results.md`, `docs/b09-results.md`, B08/B09 logs, audits and the generated historical catalogue were not modified.

### 5. Missing assertion-diagnosis agent evaluation

Task 6 was added and executed against installed assets. See [agent evidence](../evidence/developer-experience-remediation/agent-counter-assertion/README.md) and [`docs/agent-evaluation.md`](../agent-evaluation.md). The run is separately identified and does not relabel prior tasks 1–5.

## Regression coverage

| Area | Coverage |
| --- | --- |
| Compiler resolver | 7 tests: PATH-only isolated HOME, authoritative valid override, broken/relative override, wrapper non-execution, wrapper→artifact resolution, missing/incompatible compiler and no-install behavior |
| Doctor | 4 tests: ready environment, isolated-HOME PATH-only native solc, broken override, missing PATH prerequisites |
| Clean consumer | Installs only `qie-networks`, `qie-smart-contracts`, `qie-wallets`; source fixture deleted; isolated native compiler; installed inspector, read controller and real Forge replay: 5 passed, 0 failed |
| Installed recipe replay | 6 tests including actual Foundry build/test/ABI and a negative wrong-expectation replay |
| Counter UI | 16 rendered Chromium tests: 13 existing plus missing-address feedback, corrected-address workflow, and failed-read recovery; retains connect/reject/wrong-chain/event/late-result/address-change coverage |
| Historical evidence | 3 tests bind B08/B09 reports to the historical fixture and verify preserved log completeness |
| Full suite | 304 tests passed, 0 failed, 0 skipped |

## Agent task 6

| Item | Value |
| --- | --- |
| Run ID | `devx-2026-10-21-task6` |
| Host | OpenCode CLI child agent (`general`), session `ses_ea07cecdbffeIXJ0nrAyMOAFlf` |
| Model | Host-reported `opencode/deepseek-v4.1-flash-free`, not independently verified |
| Installed subset | `qie-smart-contracts`, `qie-debug` only |
| Initial failure | `4 passed; 1 failed`, `[FAIL: increment effect] testIncrementChangesState()` |
| Repair | Only the test expectation `== 2` → `== 1` in the consumer copy |
| Final result | `5 passed; 0 failed; 0 skipped`, 256 fuzz runs |
| Invariants | `Counter.sol` and `foundry.toml` unchanged; repaired test byte-identical to installed canonical test; no test deleted or weakened |
| Status | **PASS** |

The full prompt, raw failure, diff, final output, agent response and structured result are retained under `docs/evidence/developer-experience-remediation/agent-counter-assertion/`. The evaluator independently reran the final suite. The prompt prohibited source-checkout reads and network access; the retained response says the agent complied, but this was not independently traced.

## Final verification sequence

Run against the finalized working tree, in the required order:

| # | Command | Exit | Result |
| --- | --- | --- | --- |
| 1 | `npm ci` | 0 | 36 packages installed, 0 vulnerabilities |
| 2 | `npm run doctor` | 0 | READY; Node 24.20.0, npm 11.19.0, Forge 1.8.1, native solc probe, nine coherent bundles at `3f88cb8b…` |
| 3 | `npm run build:check` | 0 | All nine bundles reproduce from canonical data |
| 4 | `npm run example:prepare:check` | 0 | Generated Counter ABI/selector asset is current |
| 5 | `npm run validate` | 0 | 15 domains, 18 sources, 11 claims, 25 capabilities; 9 bundles; identity `3f88cb8b…` |
| 6 | `npm run docs:check` | 0 | Historical B08 catalogue matches the historical record |
| 7 | `npm run lint` | 0 | JavaScript syntax checks passed |
| 8 | `npm test` | 0 | **304 passed, 0 failed, 0 skipped** (142.1 s) |
| 9 | `npm run typecheck` | 0 | Strict TypeScript over controller, example and browser tests |
| 10 | `npm run example:build` | 0 | Vite 8.3.5 production build, 18.90 kB JS / 5.54 kB gzip |
| 11 | `npm run test:browser` | 0 | **16 passed** (20.5 s) |
| 12 | `npm run build:check` (post-build) | 0 | Mutating build left generated bundles unchanged |
| 13 | `npm run example:prepare:check` (post-build) | 0 | Mutating build left the generated Counter asset unchanged |
| 14 | `npm run validate` / `npm run docs:check` (post-build) | 0 | Release identity and historical catalogue remain consistent |

The first full test run after the recut exposed three stale coupling failures in `tests/consistency.test.mjs`: the generated B08 catalogue and two milestone-date assertions still used the active cut. Those were product/test-code defects, not environment failures. They were fixed with the historical fixture and the generator/test changes above, and the final `npm test` run is 304/304.

## NOT_RUN and remaining gaps

- **No real QIE RPC call, wallet, deployment, signing, broadcast or indexer.** All network claims remain `DOCUMENTED`/`UNKNOWN`, and `live_check` remains `NOT_RUN`.
- **`verify:evidence` and `verify:b09-evidence` were not run.** They are historical evidence generators; running them would be outside this remediation and could rewrite preserved logs. Historical B08/B09 files were not modified.
- **Historical B08/B09 evidence is not a certification of `0.5.2-ecosystem.1`.** It remains bound to `0.5.1-ecosystem.1` / `b280364e…`.
- **Agent tasks 2–4 remain NOT_RUN.** Task 3's dependency statement was corrected: `qie-debug` can be installed alone or alongside a topical skill; a full nine-skill install is not required. Task 6 PASS is a separate run.
- **CI was not executed on GitHub.** The workflow is unchanged except where this tree includes it; no push/dispatch occurred.
- **Official `skills-ref` validation was not run.** No claim is made that it replaces or is replaced by the local checks.
- **Platform scope is Linux only.** macOS and Windows were not tested.
- **Task 6 isolation is prompt-level, not traced.** The prompt and final response are retained, but no syscall/audit trace proves every read stayed inside the consumer.
- **`npm run test:coverage` was not rerun.** The required `npm test` includes installation, consumer and operational checks; no coverage percentage is claimed for this remediation.

## Mock versus real-tool scope

| Surface | What ran | What it does not prove |
| --- | --- | --- |
| Compiler resolver | Real native solc 0.8.37 version and compile probes; isolated PATH/HOME fixtures | QIE deployment compatibility |
| Forge replay | Real Forge 1.8.1, native solc, 5 tests, 256 fuzz runs | QIE gas, opcodes or endpoint behavior |
| Counter browser suite | Deterministic EIP-1193 fixture in Chromium | Real wallet or QIE RPC compatibility |
| Mock mode | Deterministic in-browser adapter | Any network or deployed-contract behavior |
| Installed skills | Real Skills CLI copy installs, manifest/identity checks | Publisher authenticity or agent-host compliance |
| Agent task 6 | Live OpenCode child-agent session over installed bundles | General agent reliability, sandbox isolation or QIE behavior |
| Doctor | Local tool/version/bundle observation | Live network, wallet or publisher compatibility |

## Reviewer path

```sh
npm ci
npm run doctor
npm run build:check
npm run example:prepare:check
npm run validate
npm run docs:check
npm run lint
npm test
npm run typecheck
npm run example:build
npm run test:browser
npm run build:check
npm run example:prepare:check
```

Expected: doctor `READY`; all consistency checks exit 0; `npm test` 304/304; typecheck exit 0; browser 16/16; post-build checks unchanged. The worktree remains uncommitted by design.
