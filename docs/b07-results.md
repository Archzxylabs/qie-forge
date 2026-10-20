# B07 results — P0 operational skills and golden-path recipes

B07 is implemented against [PRD v2.1](../QIE_Forge_PRD_v2.1.md), [architecture B07](architecture.md), [engineering quality contracts](engineering-quality.md), [B06 results](b06-results.md) and [recorded decisions](decisions.md). It adds original operational guidance and working local assets, not a different architecture, website, reference dApp or signing service.

**Acceptance verdict: PASS for the B07 implementation within its explicitly demonstrated local, mocked and preparation scopes.** Eight self-contained skill artifacts build and install. Actual local contract compilation/tests work. Wallet behavior is mock-tested; deployment guidance deliberately stops at preparation where compatibility evidence is missing. **This is not a full P0/G2, live QIE integration, Mainnet readiness, official-validator or cross-host acceptance PASS.** Those remaining gates are listed below rather than silently relaxed.

Local absolute paths in the recorded B07 evidence were replaced with `<repo>` and `<local-home>` during the 2026-10-20 hygiene pass; recorded outcomes, commands and tool versions are unchanged.

## Skills and recipes delivered

| Generated skill | Useful task | Demonstrated scope |
|---|---|---|
| `qie` | Minimal task/domain/network/EVM-native routing and missing-skill remediation | Existing 23 frozen routing fixtures retained; catalogue reflects actual publication states |
| `qie-networks` | Documented configuration, offline inspection and optional preflight | B06 functionality retained; reusable network recipe added |
| `qie-smart-contracts` | Local Solidity scaffold, build/test and ABI artifacts | Real Forge/solc replay from a clean installed skill; original counter tooling fixture |
| `qie-frontend` | Integrate an existing frontend's account/chain/read state | Executed TypeScript read controller with mock providers; framework/browsers remain separate checks |
| `qie-wallets` | Task-specific capability discovery, deliberate connection and signing review | Same canonical read recipe; no working QIE wallet or signer asserted |
| `qie-transactions` | Generic receipts/direct-creation observations, gas/nonce investigation | B06 observer now independently bundled with its data/import closure; existing proof limits retained |
| `qie-deployment` | Local artifacts, network preflight and concrete unsigned action review | Preparation template remains BLOCKED until missing compatibility, fees and signer evidence exists |
| `qie-debug` | Smallest-stage diagnosis and symptom-specific recovery | Bundled network/transaction helpers; mocked negative paths and explicit unknowns |

The five canonical recipes are:

- [Network selection/preflight](../recipes/network/recipe.md): explicit target, canonical chain binding, bounded read, fail-closed exit semantics and same-network recovery.
- [Contract build/test](../recipes/build-test/recipe.md): original Solidity/tests, pinned Foundry/compiler/configuration, actual ABI/method artifacts, failed-assertion recovery and no chain compatibility inference.
- [Wallet read](../recipes/wallet-read/recipe.md): explicit user connection, provider-chain checks, uint256 ABI read, UI integration wiring, state invalidation and explicit refresh. It neither signs nor supplies a guessed contract address.
- [Deployment preparation](../recipes/deployment/recipe.md): local build artifacts, exact network, unsigned blocked review template, external signing boundary and narrow post-submission observations. No unsupported broadcast command is supplied.
- [Debugging](../recipes/debug/recipe.md): build/wallet/transport/receipt/application-stage decision tree, expected outputs, stop conditions and targeted retests without automatic resubmission.

`qie-ecosystem` remains planned for B08. Native and indexing depth remain outside these EVM recipes. Eight entries do not satisfy B09's complete nine-entry gate. A developer can still perform small local or read-only tasks without being forced through deployment.

## Files created and modified

The complete path inventory, including generated copies and evidence, is [files.json](evidence/b07/files.json). Main editable changes:

| Paths | Change |
|---|---|
| `authoring/qie-smart-contracts/`, `qie-frontend/`, `qie-wallets/`, `qie-transactions/`, `qie-deployment/`, `qie-debug/` | Six new original `SKILL.md.in` entry points with purpose, triggering conditions, progressive resource selection, prerequisites, failures and security boundaries |
| `authoring/qie/SKILL.md.in`, `authoring/qie-networks/SKILL.md.in` | Correct planned-skill examples and discoverable network recipe |
| `recipes/` | Five canonical recipe trees; original Solidity project/config/tests, toolchain pins, TypeScript read controller and blocked deployment-review JSON template |
| `knowledge/skills.yaml`, `knowledge/domains.yaml` | Six topical selectors; required recipe selection; current entry/coverage pointers and gaps for D03/D04/D06/D07/D13/D14; primary architecture source for native/EVM distinctions |
| `knowledge/schema/skill.schema.json`, `knowledge/schema/policy.schema.json`, `knowledge/policy.yaml` | Explicit recipe selector and operational artifact choice; schema/policy version 1.2.0 |
| `scripts/lib/release.mjs`, `scripts/lib/bundle.mjs` | Deterministic contained recipe materialization, task-specific evidence references/snapshot and static TypeScript import checks |
| `release-context.json`, `package.json`, `package-lock.json` | Frozen candidate `0.4.0-operational.1`; no dependency added or upgraded |
| `tests/operational-skills.test.mjs`, `tests/wallet-read.test.mjs`, `tests/fixtures/wallet-negative.json` | Real local replay, isolated third-skill proof, malformed/missing/escaping recipe rejection and wallet behavioral negatives |
| Existing installation/multi-skill/routing tests and fixture support | Preserve earlier regressions while expanding expected publication and suite/single installation matrices |
| `skills/`, `dist/skills/` | Generated eight bundles, selected recipe/assets/data/helper closure, evidence/router references and hashed manifests; staging equals publication |
| `README.md`, `docs/source-map.md`, `docs/decisions.md`, this report and `docs/evidence/b07/` | Actual usage/prerequisites, resolved design decisions, recorded failures/results and remaining gates |

Thirteen critical B02–B06 implementation/data files remain byte-identical, including both diagnostics, RPC transport, pure evaluator, CLI wrappers, all claim/capability/source/address/runtime-evidence collections and frozen routing fixtures. See [preserved-foundation.json](evidence/b07/preserved-foundation.json). The baseline suite was rerun before changes: **164/164 PASS**.

## Resolved engineering decisions

1. `recipe_paths` is a required bounded selector for `recipes/<task>/recipe.md`. The builder copies the selected contained tree with its relative references/assets. It rejects escapes, symlinks, missing recipes/assets and broken static imports; no workflow runtime or DSL was introduced.
2. `operational` is a third generated-reference artifact alongside the unchanged `coverage` and `network-profiles` mechanisms. It provides task-selected evidence and `data/network-claims.json`, reusing the snapshot path expected by B06 helpers without forcing unrelated profile/coverage pages into topical skills.
3. Schema/policy version is explicitly 1.2.0 because selector/catalogue shape changed. Old selector documents missing `recipe_paths` are not silently accepted. Diagnostic report channel versions remain unchanged. Recipe assets retain canonical bytes and manifest hashes; recipe Markdown and generated references carry DO NOT EDIT markers.
4. Shared recipes are authored once and selected into each independent bundle. The wallet asset imports the same packaged pure effective-status evaluator. Helper sources are reused unchanged, with no checkout or sibling-file dependency.
5. Availability and QIE compatibility remain separate. Publishing a skill or a preparation recipe does not promote a capability, populate an address or create a runtime ValidationRun. Capability recipe pointers remain null rather than advertising unverified executable integration support.

## QIE compatibility evidence and limits

| Item | Evidence actually available | Operational interpretation |
|---|---|---|
| Mainnet/Testnet settings | Eleven existing DOCUMENTED claims from S03, the [official QIE network page](https://docs.qie.digital/getting-started-with-qie-blockchain/4.-access-mainnet-or-testnet) | Published configuration only; selected network is never silently substituted |
| EVM/native distinction | Existing S04 [official architecture overview](https://docs.qie.digital/what-is-qie/qie-v3-key-features), canonical navigation scope and frozen routing fixtures | No invented native chain identity, CLI or delegation commands |
| Foundry/compiler | Forge 1.8.1 at commit `982849d3140c01fd3b72905759581a132df7aa98`; native solc `0.8.37+commit.f401782d`; local `paris` target; actual local build/test/inspect | LOCAL_REPLAY, not evidence of QIE opcode/gas/compiler/deployment support |
| Wallet/provider reads | Executed original TypeScript controller with mock [EIP-1193](https://eips.ethereum.org/EIPS/eip-1193) providers and selected packaged chain records | Interface-level mock behavior only; no wallet/connector/provider version is certified on QIE |
| Transactions/deployment | Existing B06 scoped observer, malformed/wrong-chain/reverted/missing-data fixtures and new isolated installations | Receipt facts and limited observations only; code at latest is not inclusion-block code, issuer identity, canonical continuity or finality |
| Ecosystem contracts/APIs | Existing discovery leads; zero canonical addresses and runtime validation runs | No SDK, factory, explorer-verifier endpoint, token address or QIE product integration invented |

All **eight capabilities remain UNKNOWN** and all **eleven claims remain DOCUMENTED**. Generic tool syntax is linked to primary tool/interface references and executed locally where stated. A working workflow on another EVM chain is never accepted as QIE evidence.

The read controller checks the selected provider's chain before requesting accounts and before/after a contract read, clears stale display state on accounts/chain/disconnect, rejects malformed ABI output, discards in-flight invalidated results and permits explicit refresh. It has no signing/broadcast path. Its bounded UI wait cannot cancel an underlying third-party provider operation. A changed read after an external transaction does not by itself prove that transaction caused the effect.

## Commands executed and outcomes

Environment: Node 24.20.0, npm 11.19.0, existing Skills CLI 1.7.2, Forge/compiler pins above. Shell commands below ran in this workspace; helper/installer/replay tests create separate temporary consumer projects.

| Command | Actual result |
|---|---|
| `npm test` before changes | **164/164 PASS**, no skips; [baseline log](evidence/b07/baseline-tests.txt) |
| `npm run build` | PASS; eight generated skills; no live checks; [log](evidence/b07/build.txt) |
| `npm run validate` | PASS; 15 domains, 6 sources, 11 claims, 8 capabilities; all eight bundles validate; [log](evidence/b07/validate.txt) |
| `npm run build:check` | PASS; reproduced publication bytes; separate-root/staging/manifest tests also pass; [log](evidence/b07/build-check.txt) |
| `npm run lint` | PASS for JavaScript syntax; not a TypeScript typecheck; [log](evidence/b07/lint.txt) |
| `node --test --test-isolation=none tests/wallet-read.test.mjs` | **26/26 PASS**; generated TypeScript asset executed with local import closure; [log](evidence/b07/wallet-tests.txt) |
| `node --test --test-isolation=none tests/operational-skills.test.mjs` | **6/6 PASS**; includes actual Skills CLI installation followed by deleted-source offline Foundry replay; [log](evidence/b07/operational-tests.txt) |
| Final `npm test` | **208/208 PASS**, zero failed/cancelled/skipped; includes all prior regressions and 18 installer cases; [log](evidence/b07/tests.txt) |
| `npm run test:coverage` after final recipe/data changes | **208/208 PASS**; scripts-only coverage 96.76% lines, 87.71% branches, 97.20% functions; TypeScript asset coverage is not included in these percentages; [log](evidence/b07/coverage.txt) |
| `npm run test:install` | **18/18 PASS**; suite plus eight individual selections × copy/symlink; clean consumer homes, denied network, source deletion, both Codex/Claude target directories, manifest/reference/helper checks; [log](evidence/b07/installation.txt) |
| `forge --version`, explicit native `solc --version` | Exact pins matched in the real recipe replay |
| `forge build --offline --use <explicit-native-solc>` | PASS, original source compiled in a clean consumer project |
| `forge test --offline --use <explicit-native-solc> -vv` | **5/5 Solidity tests PASS**, including 256 fuzz runs; no downloaded libraries |
| `forge inspect --offline --use <explicit-native-solc> Counter abi --json` | PASS; ABI matches `increment` and `value` |
| `forge inspect --offline --use <explicit-native-solc> Counter methodIdentifiers --json` | PASS; method identifiers and creation/runtime artifacts produced |
| Same Forge test after intentionally changing expected increment state | Expected nonzero exit, incorrect effect detected; this deliberate rejection is a passing negative test |

The replay tests record actual executable argv, exit statuses, compiler/artifact hashes and Solidity output in the logs. Compiler artifact digest was `7fd0b784d28103a266070b0d6ae1c8eac7fb078a9f445e2d23224307ab5884d3`; local native compiler digest was `5de843c2c93563cc66425c99a4fb13fdbf32b4c4ae07469480faaf126e14404a`. These identify local artifacts, not vendor attestation or QIE compatibility.

The 12 new frozen wallet negatives cover wrong chain, malformed chain, empty/malformed accounts, rejected connection, offline provider, empty/odd/oversized ABI result, a silent chain change during a read, an account event during a read and a hanging provider. Additional tests reject native scope, invalid/duplicate/missing claims, blocking statuses, expired VERIFIED evidence, missing listeners and invalid targets/calldata. Existing 21 transaction negative fixtures remain intact. No negative may produce an application-verification claim.

A single subagent forward test followed the generated contract skill and only its necessary resources to build/test a local project for an intended Mainnet task. All seven recorded commands exited 0 and the same five Solidity tests passed. [Receipt](evidence/b07/forward-test/receipt.json), [findings](evidence/b07/forward-test/findings.md), [artifact checks](evidence/b07/forward-test/artifact-checks.json). This is one local task replay, not an independent human audit, actual host/discovery matrix or cross-model benchmark.

### Failures observed and handled

- Initial selector serialization emitted YAML aliases for reused arrays. The strict loader rejected them (`Alias resolution is disabled`). Canonical serialization was corrected to emit independent plain arrays; subsequent build/validation/determinism checks pass. No alias support or coercion was added to weaken validation.
- The first expanded full suite had **207/208 PASS, one failure**: the PATH solc-select wrapper tried to download after its HOME/cache was isolated and failed DNS. [Actual failure log](evidence/b07/compiler-wrapper-failure.txt). Replay now uses an already installed native binary copied into the clean fixture, passed explicitly with `--use`; no global install/configuration change was made. The recipe documents `SOLC_BIN`, and contributor tests accept `QIE_FORGE_SOLC` with the existing pinned solc-select artifact as a workstation fallback.
- Skill-creator `quick_validate.py` was attempted and could not run: Python PyYAML is absent. [Log](evidence/b07/skill-creator-validator.txt). This is not reported as a successful additional validator.
- Official `skills-ref` was attempted through offline uv. Its first cache access was read-only; redirecting cache/tool storage to `/tmp` removed that filesystem obstacle, but the package was not cached and network was disabled. [Initial failure](evidence/b07/official-validator-cache-failure.txt), [offline resolution result](evidence/b07/official-validator-offline.txt). Official validation remains NOT_RUN; the project's successful independent validator is not a substitute.

## Mocked versus live verification and remaining gates

**Actually executed:** schema/reference/manifest validation, byte reproducibility across roots, clean Skills CLI installation/removal isolation, bounded mocked diagnostics, generated TypeScript execution with mock providers, real local Solidity build/test/artifact inspection, deliberate wrong-state rejection and one subagent local task replay.

**Not executed or established:** any live QIE RPC/provider test, actual browser/wallet connection, live `eth_call`, signing or broadcast, gas/funding assumptions, deployment, explorer source verification, action/finality proof, TypeScript compiler/framework build, published immutable Git-ref installation/update/rollback or four-host activation/discovery. No database, website, reference dApp, custom CLI product, MCP or Build Registry was added.

Remaining release gates:

- **B08:** component-specific catalogue curation and source/evidence review; publish `qie-ecosystem` without inventing supported integration recipes or trusted addresses. Address identity still needs issuer/ABI provenance, scoped chain binding, human review and conflict handling.
- **B09:** complete nine-entry suite, exact official validator, public source/ref, update/rollback and mixed-release behavior. Local installer directories do not prove actual agent discovery.
- **G2/B11:** actual frontend/framework build and browser wallet-read evidence plus the separately scoped reference application. The local tooling fixture and mock controller do not satisfy the full app/wallet gate.
- **AT-03/04/05 and B12:** independently tested tool/network operations, fee/spend semantics, selected external signer with concrete developer approval, transaction/action identity/effect and evidence-based finality before stronger live or Mainnet success labels. No arbitrary confirmation count is supplied.
- **B13 onward:** actual four-host discovery, two-host same-journey execution, frozen per-environment model evaluation, independent developer pilot and remaining publication/ownership gates remain unchanged.

The next engineering dependency is B08 curation alongside evidence collection for the required tool/wallet operation. Successful local commands can support further local development now; unsupported live integrations remain explicit blockers. [Execution receipt](evidence/b07/execution-receipt.json) records scope, results and evidence hashes.
