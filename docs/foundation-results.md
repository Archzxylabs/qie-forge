# B02–B04 execution results

The engineering foundation is implemented and executed against PRD v2.1 and the approved architecture. B02 provides all fifteen inventory entries; B03 provides strict schemas and evidence/status checks; B04 provides one deterministic, locally installable standalone `qie-networks` bundle. Official specification validation remains blocked, so this report does **not** declare G1, public distribution, agent-workflow compatibility or production readiness complete.

## Working artifacts

| Component | Executed result |
|---|---|
| Canonical inventory | D01–D15, six official entry-point sources, eleven DOCUMENTED scalar network facts, eight UNKNOWN capabilities |
| Address/runtime evidence records | Empty; no fabricated contract identity or live observation |
| Schema validation | Twelve JSON Schema files, strict Ajv compilation, formats, required/null rules, unique identities and cross-record references |
| Promotion checks | Reject unrelated results, wrong network/operation/version, mock-only or failed evidence, missing review and unsupported freshness metadata |
| Deterministic package | Same canonical inputs and frozen context produce byte-equal outputs across different source roots; staging equals publication |
| Manifest | All nine non-manifest files hashed; knowledge/policy digests and exact file inventory checked |
| Installed skill | Local entry, five references, JSON data, helper and imported evaluator remain inside the skill |
| Offline behavior | Helper runs after fixture checkout removal; documented facts stay DOCUMENTED and live outcome stays NOT_RUN |
| Actual installer | Skills CLI 1.7.2 discovery plus four suite/single × symlink/copy combinations pass; targets Codex and Claude Code directories |

Resolved schema aliases, identity boundaries, null rules, policy and tooling choices are recorded in [decisions.md](decisions.md). Source navigation and coverage semantics are in [source-map.md](source-map.md). Neither PRD nor the approved architecture study was edited.

## Commands actually executed

Environment: Node `v24.20.0`, npm `11.19.0`, Skills CLI `1.7.2`. Direct development dependencies are Ajv `8.20.0`, ajv-formats `3.0.1`, yaml `2.9.1`, and the existing Skills CLI. The lockfile includes fourteen installed packages. No production runtime dependency is needed by the installed helper beyond the tested Node runtime.

| Command from project root | Outcome |
|---|---|
| `npm install --offline --ignore-scripts --no-audit --no-fund --cache /tmp/qie-forge-npm-cache` | Initial ENOTCACHED failure; succeeded after task-local cache repair, fourteen packages added |
| `npm ci --offline --ignore-scripts --no-audit --no-fund --cache /tmp/qie-forge-npm-cache` | PASS; clean dependency installation from lockfile, fourteen packages added |
| `node node_modules/skills/bin/cli.mjs --version` | PASS; `1.7.2` |
| `npm run build` | PASS; one skill generated in staging and publication |
| `npm run validate` | PASS; 15 domains, 6 sources, 11 claims, 8 capabilities, 1 standalone bundle |
| `npm run build:check` | PASS; publication regenerated without byte or inventory drift |
| `npm run lint` | PASS; JavaScript syntax only; style lint/type compilation not configured |
| `npm test` | Initial subprocess-related failure; after harness fix the then-current 51 tests passed; subsequent expanded final suite executed below |
| `npm run test:coverage` | Final PASS; **63 tests, 63 passed, 0 failed, 0 skipped** |
| `npm run test:install` | PASS; four actual installer fixtures, not a mocked installer |
| `node skills/qie-networks/scripts/inspect-network.mjs qie-testnet` | PASS; chain ID 1983 as DOCUMENTED, `live_check.outcome: NOT_RUN` |
| `sha256sum QIE_Forge_PRD_v2.1.md docs/architecture-study.md` | Recorded baseline hashes below |
| `git status --short` | Unavailable: this workspace is not a Git repository |

Final coverage for the six exercised `scripts/lib/` modules: **96.58% lines, 83.59% branches, 97.06% functions**. The pure status evaluator has 100% measured coverage. Node's parent-process coverage report does not include the helper/installer child-process internals or the thin command wrappers; those are executed separately. This is not a whole-product coverage claim or an independent security audit.

Saved actual output:

- [Build, schema, bundle, reproducibility and syntax checks](evidence/foundation-checks.txt)
- [Final expanded tests and coverage](evidence/foundation-tests.txt)
- [Dedicated actual installer tests](evidence/skills-installation.txt)
- [Offline inspector output](evidence/offline-inspection.json)

The installer test source records the concrete commands, with temporary source/consumer paths created per fixture:

```sh
node /checkout/node_modules/skills/bin/cli.mjs add /tmp/source-fixture --list
node /checkout/node_modules/skills/bin/cli.mjs add /tmp/source-fixture --skill '*' -a codex -a claude-code -y
node /checkout/node_modules/skills/bin/cli.mjs add /tmp/source-fixture --skill qie-networks -a codex -a claude-code -y
```

Both installation commands are also executed with `--copy`. The test clears inherited environment values except the minimal PATH/test settings, sets `DISABLE_TELEMETRY=1` and `DO_NOT_TRACK=1`, and loads a test-only guard denying HTTP/socket/fetch use. It removes the entire source fixture after installation, verifies only `qie-networks` was installed, checks the real copied/symlinked directories, validates every installed file hash/link, and executes the helper from the consumer directory. The local CLI executable is contributor tooling; the installed helper never imports it or uses an npm cache.

## Failures and corrections

1. **Offline npm resolution:** cached Skills package metadata varied on the registry Accept header. Only required cached package entries were copied into a task-local `/tmp` cache; its Skills/Ajv packument metadata was normalized for the request. The user's cache was not changed. No dependency source, integrity or lockfile URL was rewritten. Installation and clean `npm ci` then passed.
2. **Strict JSON Schema compilation:** conditional `minItems` rules lacked an explicit array type under strict Ajv. The schemas were corrected; all schemas now compile and execute with strict validation.
3. **Subprocess sandbox behavior:** captured `execFileSync` pipes raised EPERM, and default Node test-process isolation hid useful failures. Tests now run with `--test-isolation=none`, independent temporary filesystem fixtures, and real child output redirected to temporary regular files. Child failures still throw with stdout/stderr attached. The actual installer and helper now run successfully; they are not replaced with stubs.
4. **Negative-test assertion:** an invalid chain ID was correctly rejected as `must be >= 1`; the new test initially expected the word `minimum`. Its error assertion was corrected without weakening numeric validation. The final expanded suite passes.
5. **Official validator remains unavailable:** the first `uv` attempt targeted a read-only default tool directory. Explicit task-local tool/cache directories fixed that setup issue. An offline attempt then reported that `skills-ref` was absent from cache; the online attempt failed DNS resolution to PyPI. No official validator version was installed or executed. Independent frontmatter validation and Skills CLI discovery are not reported as official validation.
6. **Git diff unavailable:** `.git` is not a usable Git repository here. Changes were reviewed from created files, generated inventory, hashes and executed checks. No repository was initialized and no commit was created.

The final attempted official-validator command was:

```sh
UV_TOOL_DIR=/tmp/qie-forge-uv-tools \
UV_TOOL_BIN_DIR=/tmp/qie-forge-uv-bin \
UV_PYTHON_INSTALL_DIR=/tmp/qie-forge-uv-python \
UV_HTTP_TIMEOUT=10 UV_HTTP_RETRIES=0 \
uv --cache-dir /tmp/qie-forge-uv-cache tool run --from skills-ref \
  skills-ref validate skills/qie-networks
```

Observed error: `Failed to fetch: https://pypi.org/simple/skills-ref/` → `Temporary failure in name resolution`. An exact official-validator version must be pinned and its check executed before the corresponding distribution gate can pass. The [official reference validator](https://github.com/agentskills/agentskills/tree/main/skills-ref) remains an independent check.

## Remaining unverified work and blockers

- No live RPC request, chain identity, block freshness, native CLI, wallet/SDK compatibility, provider integration, contract deployment, address ownership or finality policy has been tested. Existing canonical runtime evidence stays empty.
- Actual Codex, Claude Code, Cursor and OpenCode activation/workflow behavior has not been exercised. Installer targets are not proof of host behavior; the four-host matrix and routed-task suite remain later work.
- Official `skills-ref` validation is blocked by unavailable dependencies/network access. Public source/ref install, immutable tag install, update and rollback remain NOT_RUN because no published repository/ref is available. No production release is declared.
- Maintainer identities, repository namespace, licensing and release authority remain unset rather than fabricated. They block public publication under B01/G0, while local foundation work is functional.
- Risk-specific TTLs, native network identifiers, scoped operation version coverage and multi-source conflict adjudication require evidence before expansion. The current policy is explicit-record expiry with conservative read-time downgrade.
- No website, router, remaining P0 skills, application, custom MCP, product CLI, registry, database or backend was added.

**Next engineering dependency: B05**, the original `qie` router and generated catalogue/coverage references, using the proven local bundle contract and this inventory. B06 can subsequently extend the shared status prerequisite with scoped read-only runtime checks before operational golden-path recipes. Official validation and publication ownership remain explicit release gates during that work.

Baseline document hashes:

```text
99a50b3ec03416ab81d1e4cab7ce313e15c8efc4e9acaeb05055c23bcd062755  QIE_Forge_PRD_v2.1.md
02b6d7bec32b0c675a67f8805b888ec38e554b565b180bde352406b75f662e9b  docs/architecture-study.md
```

**Historical baseline note (2026-10-20):** these hashes record the pre-cleanup documents. PRD v2.1 was subsequently revised only to remove third-party repository identifiers, and the architecture study was replaced by `docs/architecture.md` after the third-party research notes were archived outside the repository. The current files therefore do not match these historical hashes; the hash record itself is preserved.

## Files created

All implementation files below were created for this foundation. Existing product/research documents were left intact. `dist/skills/qie-networks/` contains a generated duplicate of the ten published bundle files and is ignored; `node_modules/` is a local dependency installation and is also ignored.

64 created source, published and evidence files:

```text
.gitignore
.node-version
README.md
authoring/qie-networks/SKILL.md.in
authoring/qie-networks/references/preflight.md
authoring/qie-networks/references/scope.md
docs/decisions.md
docs/evidence/foundation-checks.txt
docs/evidence/foundation-tests.txt
docs/evidence/offline-inspection.json
docs/evidence/skills-installation.txt
docs/foundation-results.md
docs/source-map.md
knowledge/addresses.yaml
knowledge/capabilities.yaml
knowledge/claims.yaml
knowledge/domains.yaml
knowledge/policy.yaml
knowledge/schema/address.schema.json
knowledge/schema/capability.schema.json
knowledge/schema/claim.schema.json
knowledge/schema/common.schema.json
knowledge/schema/domain.schema.json
knowledge/schema/manifest.schema.json
knowledge/schema/policy.schema.json
knowledge/schema/release.schema.json
knowledge/schema/skill.schema.json
knowledge/schema/source.schema.json
knowledge/schema/status.schema.json
knowledge/schema/validation-run.schema.json
knowledge/skills.yaml
knowledge/sources.yaml
knowledge/validation-runs.yaml
package-lock.json
package.json
release-context.json
scripts/build-skill-release.mjs
scripts/check-syntax.mjs
scripts/inspect-network.mjs
scripts/lib/bundle.mjs
scripts/lib/effective-status.mjs
scripts/lib/io.mjs
scripts/lib/knowledge.mjs
scripts/lib/release.mjs
scripts/lib/schemas.mjs
scripts/validate-knowledge.mjs
scripts/validate-skills.mjs
skills/qie-networks/MANIFEST.json
skills/qie-networks/SKILL.md
skills/qie-networks/data/network-claims.json
skills/qie-networks/references/network-mainnet.md
skills/qie-networks/references/network-testnet.md
skills/qie-networks/references/preflight.md
skills/qie-networks/references/release-info.md
skills/qie-networks/references/scope.md
skills/qie-networks/scripts/inspect-network.mjs
skills/qie-networks/scripts/lib/effective-status.mjs
tests/installation.test.mjs
tests/knowledge.test.mjs
tests/packaging.test.mjs
tests/status.test.mjs
tests/support/deny-network.cjs
tests/support/fixtures.mjs
tests/support/process.mjs
```
