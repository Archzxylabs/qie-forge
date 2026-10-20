# QIE Forge B08 — Unified Independent Audit Remediation Results

Remediation date: 2026-10-20 (Asia/Jakarta). Remediated release: **`0.5.1-ecosystem.1`** (schema/policy `1.4.0`). Superseded audited release: `0.5.0-ecosystem.1` (schema `1.3.0`).

**Final verdict: B08 PASS (accepted post-remediation).** All findings from both independent audits were reproduced against the workspace, resolved in canonical data / generator / authored guidance, and locked behind adversarial regression tests. A subsequent final independent audit (`docs/audit/QIE_Forge_B08_Final_Independent_Audit.md`) confirmed those defects closed and raised three focused release gates (F-FINAL-01/02/03); those are resolved in §8. B09 is unblocked against `0.5.1-ecosystem.1` only.

## 0. Report availability disclosure

The task named `docs/audits/b08-independent-audit.md` and `docs/audits/b08-consolidated-findings.md`. **Neither path exists in this repository.** The available reports (read in full) are:

- `docs/audit/QIE_Forge_B08_Independent_Review.md` (the "Codex" review; findings B08-R01…R06)
- `docs/audit/QIE_Forge_B08_Consolidated_Findings.md` (concordance + additional findings F-B08-01…F-B08-06)

The consolidated file cites an earlier `QIE_Forge_B08_Independent_Audit.md` that is **not present in the workspace**; its findings were taken from the consolidated concordance table (F-B08-01…F-B08-05) rather than invented. Repository source, canonical knowledge, PRD v2.1 (FR-004), the architecture study, `docs/decisions.md`, and all generated artifacts were inspected directly.

## 1. Finding-by-finding resolution

### B08-R01 / F-B08-01 (P1) — Published network instructions disagreed with canonical claims

- **Reproduced:** Yes. `scripts/lib/release.mjs` hard-coded `https://rpc-main1.qie.digital/`, `https://rpc-testnet.qie.digital/`, `https://mainnet.qiescan.org/`, `https://testnet.qiescan.org/`; the authored decision guide repeated them (Hardhat config, Case F, Case B explorer link). Canonical claims (`knowledge/claims.yaml`) publish `rpc1mainnet.qie.digital`, `rpc1testnet.qie.digital`, `mainnet.qie.digital`, `testnet.qie.digital`. Re-verified against source S03 on 2026-10-20 via the live documentation (markdown page confirms the canonical hostnames; no `rpc-main1`/`qiescan.org` in official docs).
- **Root cause:** The catalogue's "Network Profiles" section and guide examples restated network facts as literals instead of projecting the selected canonical claim records.
- **Fix:** `catalogueReference()` now renders the network section exclusively from `snapshot.claims` (per-network predicate/value/status/source rows) plus claim-sourced links. The guide uses the canonical values with claim/source attribution. A negative regression forbids the non-canonical hostnames anywhere in published/authored artifacts; a mutation test rewrites a canonical RPC claim in a fixture copy and proves the stale literal cannot survive.
- **Files:** `scripts/lib/release.mjs`, `authoring/qie-ecosystem/references/decision-guide.md`, `tests/ecosystem.test.mjs`, `tests/consistency.test.mjs`, rebuilt `skills/` + `dist/skills/`.

### B08-R02 / F-B08-03 (P1) — Product summaries bypassed canonical compatibility status and scope

- **Reproduced:** Yes. The independent reviewer's mutation experiment (flip `qiewallet-*` to `CONFLICTED`; `buildRelease()` still rendered `DOCUMENTED`) was replicated conceptually and is now a permanent test. Root cause: `toolsSummary` in `scripts/lib/release.mjs` was a second, hand-maintained status registry with product-wide verdicts (`DOCUMENTED` generic wallet, `DOCUMENTED` precompile, `DOCUMENTED` explorer notes contradicting canonical `UNKNOWN`, invented hostnames, etc.).
- **Fix:** `toolsSummary` was deleted. The catalogue overview is now one row per canonical capability (Tool + Operation + Network + Version + primary limitation), with the status computed by the shared non-promoting `effectiveStatus()` evaluator against the frozen build clock. Product display-name registries were removed entirely; presentation metadata is limited to category titles/scope descriptions that assert no statuses. Two mutation tests (`capability status mutations project into catalogue and matrix`, `no hardcoded product-wide status survives a canonical status flip`) lock this in.
- **Files:** `scripts/lib/release.mjs`, `tests/ecosystem.test.mjs`.

### B08-R03 / F-B08-03 subfinding (P1) — Address guidance weakened the recorded identity release blocker

- **Reproduced:** Yes. Case B's "safe guidance" ended at a developer-supplied address plus `eth_getCode`; the renderer published a literal `0xD4949664cD82660AaE99bEdc034a0deA8A0bd517` as a `DOCUMENTED` precompile with no capability record, and `tests/ecosystem.test.mjs` demanded that literal — defeating the empty-address publication gate (`docs/decisions.md`, "Release blocker: contract-address identity validation").
- **Fix:**
  - Case B now states an explorer page / receipt / nonempty bytecode **never** establishes issuer, ABI, or product identity, and requires the full gate before any product-specific transaction: issuer provenance (`issuer_source_ids`), ABI provenance (`abi_source_ids`), scoped `(chain_id, address)` identity observation via reviewed validation run, human review of official channels, and conflict checks. Supplied addresses are unverified leads and may not enter executable flows.
  - The renderer publishes **no contract address literal**; a new "Address Publication Policy" section is generated. The source-claimed precompile (S16) is recorded in the evidence ledger as source-claimed and explicitly unpublished.
  - The test that required the literal was replaced by `assert.doesNotMatch(catalogue, /0x[0-9a-fA-F]{40}/)` plus an adversarial test that injects a schema-valid source-claimed address record into a fixture copy and proves the build succeeds while the catalogue still publishes no address.
- **Files:** `authoring/qie-ecosystem/references/decision-guide.md`, `scripts/lib/release.mjs`, `tests/ecosystem.test.mjs`, `docs/evidence/b08/source-ledger.md`.

### B08-R04 / F-B08-02 (P2) — Source IDs assigned different resources across artifacts

- **Reproduced:** Yes. The ledger swapped S08/S09 relative to `knowledge/sources.yaml`, labelled S12 as Remix (canonical S12 = oracle table), S15 as oracle docs (canonical S15 = Cosmos `chain.json`), and gave S13/S14/S18 different URLs. The guide cited S10 for Hardhat and S11 for Remix; `remix-deploy` cited only the documentation root S00; S19 lacked the store extension identifier.
- **Fix:** See the full reconciliation table in §2. `remix-deploy` now cites the dedicated, re-reviewed T1 source **S21** (`deploy-using-remix.md`, re-retrieved and confirmed at `2026-10-19T21:37:00Z`). S19 now carries the complete Chrome Web Store URL (`…/qie-wallet-%E2%80%93-non-custodia/oljchdcgmibnjbbopolafbjncfhdacjb`). The S08 title was corrected to match its URL. A consistency test parses the ledger table and enforces exact ID→URL equality with canonical data, with adversarial swap/relabel/truncation tests.
- **Files:** `knowledge/sources.yaml`, `knowledge/capabilities.yaml`, `docs/evidence/b08/source-ledger.md`, `authoring/qie-ecosystem/references/decision-guide.md`, `docs/b08-results.md`, `tests/consistency.test.mjs`, `tests/multi-skill.test.mjs`.

### B08-R05 (P2) — Substring category matching misrouted DEX operations and hid the indexer

- **Reproduced:** Yes. `c.tool_id.includes('qied')` matched `qiedex`, placing `dex-swap` and `qiedex-web-swap` under Native Cosmos; `indexer-query` (`unidentified-indexer`) matched no indexing token, so the indexing section read "no entries" although the capability was in the snapshot.
- **Fix:** Category membership is now canonical data: a required `category` field on every capability record, validated against a new canonical enum (`networks`, `wallets`, `frameworks`, `identity`, `explorers`, `defi`, `bridges`, `oracles`, `indexing`, `native-cosmos`) in `common.schema.json`. The renderer filters by exact `cap.category` equality and throws on unknown values. Tests assert QIEDex caps are `defi` (and absent from the native section), `indexer-query` is discoverable under indexing, and unknown/missing categories fail validation and the build.
- **Files:** `knowledge/schema/common.schema.json`, `knowledge/schema/capability.schema.json`, `knowledge/capabilities.yaml` (all 25 records), `scripts/lib/release.mjs`, `tests/ecosystem.test.mjs`, `tests/consistency.test.mjs`. Schema/policy version → `1.4.0`.

### B08-R06 / F-B08-04 (P2) — Reports and evidence described different data than shipped

- **Reproduced:** Yes. `docs/b08-results.md` claimed `DOCUMENTED: 11, UNKNOWN: 8` (summing to 26 with other categories); the evidence catalogue called `explorer-verification-api` `DOCUMENTED` (canonical: `UNKNOWN`), supplied versions `^2.22.0` / `^2.0.0` absent from canonical records, invented tool/operation identifiers (`json-rpc`, `blockscout`, `subgraph`, `cosmos-sdk`, `evm-toolchain`, `swap_exact_tokens`, `verify_source_code`, …), and cited wrong sources (e.g. `qiedex-web-swap` → S14).
- **Fix:** `docs/evidence/b08/capability-catalogue.md` is now **generated** from canonical records by `scripts/lib/evidence-doc.mjs` (`npm run docs:generate`; drift-checked by `npm run docs:check` and by test). The results report's status table is parsed by test and must equal the computed distribution; §3/§5 were rewritten to canonical identifiers, versions (`null` preserved), statuses, and source IDs. See §3 for the correct counts.
- **Files:** `scripts/lib/evidence-doc.mjs` (new), `scripts/generate-evidence-doc.mjs` (new), `docs/evidence/b08/capability-catalogue.md`, `docs/b08-results.md`, `package.json` (`docs:check`/`docs:generate`), `tests/consistency.test.mjs`.

### F-B08-05 (P2) — Unsafe operational certainty

- **Reproduced:** Yes, all three instances:
  1. Fixed native staking fee `--fees 20000000000000000aqie` → replaced with `--fees <fee_in_aqie>` plus an explicit rule that fees are live, unmeasured network facts that must never be hardcoded from this guide.
  2. `eth_getLogs` "2,000–5,000 blocks" presented as a provider limit → replaced: no QIE provider limit has been measured (`rpc-identity` is `UNKNOWN`); guidance is probe-then-bound with recorded provider errors; repeating any specific bound is declared an invented compatibility fact. The literal is now forbidden by tests.
  3. Categorical "no indexer deployments exist" → reworded everywhere (guide Case D retitled to "Indexer Coverage Uncertainty…", ledger invariant, results report) to "no deployment was substantiated in the reviewed sources; UNKNOWN is not proof of absence."
  - Additional evidence hygiene from the consolidated review: `shanghai`/Foundry replay guidance is now labelled LOCAL_REPLAY-derived (B07), not documented QIE support; the Hardhat example matches the official guide (Solidity **0.8.20**, no invented `evmVersion` or chain IDs — the docs' "0.8.28 + shanghai" claim was unsourced and is gone); the Remix row states the guide specifies no compiler/EVM target.
- **Files:** `authoring/qie-ecosystem/references/decision-guide.md`, `authoring/qie-ecosystem/SKILL.md.in`, `docs/evidence/b08/source-ledger.md`, `docs/b08-results.md`, `tests/ecosystem.test.mjs`, `tests/consistency.test.mjs`.

### F-B08-06 (P2) — Missing invariant/adversarial tests

- **Reproduced:** Yes — 216 passing tests did not detect any of the injected contradictions above.
- **Fix:** 18 new tests (234 total) deliberately inject: divergent RPC claims (projection re-run), status flips (projection + no hardcoded summary), category tampering (schema rejection + frozen placement expectations), source-ID swaps/relabels/truncations (ledger diff checker), inflated/deflated reported counts (computed-vs-parsed diff), forged evidence-catalogue rows (regeneration drift), unverifiable address records (no publication), and missing/unknown categories (build refusal). All are local fixture mutations; the canonical checkout is never modified by a test.
- **Files:** `tests/ecosystem.test.mjs` (+6), `tests/consistency.test.mjs` (new, 12).

**Preserved (requirement 10):** nine independently installable skills; B06 read-only diagnostics and refusal branches (all pre-existing tests untouched and passing); B07 operational recipes and packaging; deterministic build/drift architecture (`build:check` clean; `diff -qr dist/skills skills` clean). No CLI, MCP server, backend, database, or Build Registry was introduced; no signing or broadcasting occurs anywhere; `knowledge/validation-runs.yaml` remains empty and no capability is `VERIFIED`.

## 2. Canonical source ID reconciliation

Canonical authority: `knowledge/sources.yaml` (18 sources). The ledger, guide, results report, and evidence catalogue now agree with it exactly (enforced by test).

| ID | Canonical resource (post-remediation) | Pre-remediation defect | Resolution |
|---|---|---|---|
| S08 | `github.com/qieadmin` — QIE admin organization repositories | Ledger described S09's URL; title implied a hackathon portal | Ledger row rewritten; canonical title corrected to match URL |
| S09 | `github.com/qie-blockchain` — core blockchain repositories | Ledger described S08's URL | Ledger row rewritten |
| S11 | Hardhat deployment guide (`deploy-using-hardhat.md`) | Guide (Case C) cited S10 for Hardhat | Guide now cites S11; observed claim corrected (Solidity 0.8.20; no chain ID/EVM target in guide) |
| S12 | Oracle deployed-contracts table | Ledger labelled S12 as the Remix guide | Ledger/results/evidence aligned; oracle capability citation `S12` now meaningful |
| S13 | Native delegation guide (`delegators-in-qie-v3/…`) | Ledger used a validator-node URL | Ledger aligned; capability `qied-staking-delegate` cites S13 (+S15 for chain identity) |
| S14 | Governance step-by-step guide | Ledger used `qie-governance/how-to-create-a-proposal.md` | Ledger aligned; `qied-gov-submit` cites S14 (+S15) |
| S15 | Cosmos `chain.json` registry | Ledger labelled S15 as oracle docs | Ledger aligned; native capabilities cite S15 for chain identity |
| S18 | `qie.digital` ecosystem directory | Ledger used `swap.dex.qie.digital` as the S18 URL | Ledger aligned; DEX/bridge web claims are attributed to directory entries (CLAIMED) |
| S19 | Chrome Web Store listing, full URL incl. extension ID `oljchdcgmibnjbbopolafbjncfhdacjb` | Truncated URL without identifier | Canonical URL completed; ledger notes adoption date |
| S21 (new) | Remix deployment guide (`deploy-using-remix.md`) | Remix evidence was the docs root (S00) or the mislabelled S12 | Source added (T1, reviewed `2026-10-19T21:37:00Z`, retrievability verified); `remix-deploy` cites S21 |

## 3. Correct capability counts and classifications

Computed from `knowledge/capabilities.yaml` (25 records; enforced equal to `docs/b08-results.md` and the generated evidence catalogue by test):

| Status | Count |
|---|---:|
| VERIFIED | 0 |
| DOCUMENTED | 9 |
| CLAIMED | 2 |
| UNKNOWN | 9 |
| CONFLICTED | 1 |
| STALE | 0 |
| UNSUPPORTED | 2 |
| DEPRECATED | 2 |

Key corrections vs the audited artifacts: `explorer-verification-api` = **UNKNOWN** (was `DOCUMENTED` in the evidence catalogue); `qiedex-web-swap` = CLAIMED (evidence catalogue had counted 1 CLAIMED total); no capability carries a version range (`4.2.2` on the four `qie-wallet` records is the only recorded version; `^2.22.0`/`^2.0.0` were inventions). Category distribution (new canonical field): wallets 7, networks 4, frameworks 3, native-cosmos 3, defi 2, bridges 2, oracles 1, indexing 1, identity 1, explorers 1.

## 4. Before/after: generated catalogue output

**Before (B08-R01/R02/R03/R05 defects, `skills/qie-ecosystem/references/catalogue.md`):**

```markdown
## Overview of Catalogued Tools
| QIE Wallet | `qiewallet` | Wallets | DOCUMENTED | Extension v4.2.2. … |      ← hand-maintained status
| QIE Explorer | `blockscout` | Explorers | DOCUMENTED | … mainnet.qiescan.org … | ← wrong host + wrong status
| ERC-20 Precompile | `qie-precompile` | Precompiles | DOCUMENTED | Address 0xD494…517 … |   ← uncatalogued address verdict

### Native Cosmos & Validator Operations
- `dex-swap` (swap): **UNKNOWN** …                                 ← substring misclassification
- `qiedex-web-swap` (swap_web): **CLAIMED** …
### Indexing & Historical Data
- No specific capability entries recorded in this release snapshot. ← indexer hidden

## Network Profiles and Chain Identities
- **QIE EVM Mainnet**: Chain ID `1990`, RPC `https://rpc-main1.qie.digital/`, Explorer `https://mainnet.qiescan.org/`
```

**After (canonical projection, release 0.5.1-ecosystem.1):**

```markdown
## Operation-Scoped Compatibility Overview
| Capability | Tool | Operation | Category | Network(s) | Effective Status | Primary Limitation |
| `dex-swap` | `qiedex` | `swap` | Decentralized Finance & Swaps | qie-mainnet, qie-testnet | **UNKNOWN** | Canonical router addresses, ABI, liquidity and executable swap path are unknown. |
| `explorer-verification-api` | `qie-explorer` | `verify_contract_api` | Explorers & Contract Verification | qie-mainnet, qie-testnet | **UNKNOWN** | … not documented or confirmed. |
| `qiewallet-eip1193-connect` | `qie-wallet` | `connect_eip1193` | Wallets & Injected Providers | qie-mainnet, qie-testnet | **DOCUMENTED** | … |

### Native Cosmos & Validator Operations
- `native-delegate`, `qied-gov-submit`, `qied-staking-delegate` only — no DEX entries.
### Indexing & Historical Data
- `indexer-query` (`unidentified-indexer`, `query_events`): **UNKNOWN** — …

## Published Network Profiles
| Network | Property | Published value | Stored status | Source |
| `qie-mainnet` | `rpc_url` | `https://rpc1mainnet.qie.digital/` | DOCUMENTED | [S03: …](https://docs.qie.digital/getting-started-with-qie-blockchain/4.-access-mainnet-or-testnet) (T1) |
| `qie-mainnet` | `explorer_url` | `https://mainnet.qie.digital/` | DOCUMENTED | [S03: …] (T1) |

## Address Publication Policy
The canonical address inventory in this release is empty. No ecosystem contract address … is published or recommended by this catalogue.
```

## 5. Executed verification results (all on 2026-10-20, remediated tree)

| Gate | Command | Outcome |
|---|---|---|
| Knowledge/schema validation | `npm run validate` | **PASS** — 15 domains, 18 sources, 11 claims, 25 capabilities; 9 self-contained bundles valid |
| Build | `npm run build` | **PASS** — 9 skills rebuilt deterministically |
| Deterministic build & drift | `npm run build:check` | **PASS** — `Reproduced qie … qie-ecosystem; no live network checks performed.`; `diff -qr dist/skills skills` clean |
| Evidence-doc drift | `npm run docs:check` | **PASS** — evidence catalogue matches canonical records |
| Lint | `npm run lint` | **PASS** — JS syntax checks pass (repo has no TS compiler/style linter by design) |
| Full unit/integration tests | `npm test` | **PASS — 270/270, 0 failed** (logs: `docs/evidence/b08/tests.txt`) |
| Coverage | `npm run test:coverage` | **PASS — 270/270; 97.72% lines, 88.37% branches, 98.92% functions** (`release.mjs` 98.77/86.74; `evidence-doc.mjs` 100/95; `canonical-facts.mjs` 98.92/92.05; logs: `docs/evidence/b08/coverage.txt`) |
| Skills CLI installation fixtures | `npm run test:install` | **PASS — 20/20** (full suite + each of 9 skills, symlink and copy modes; logs: `docs/evidence/b08/installation.txt`) |
| Cross-artifact consistency | `tests/consistency.test.mjs` (in `npm test`) | **PASS — 12/12**: ledger↔canonical ID/URL equality, results-report counts↔computed, evidence catalogue regeneration drift, forbidden-literal scans |
| Negative-path / adversarial regressions | `tests/ecosystem.test.mjs` mutations (in `npm test`) | **PASS — 6/6 new** + 18 pre-existing B08 tests updated and passing; all B02–B07 suites (routing, packaging, rpc, diagnostics, wallet-read, multi-skill, operational, knowledge, installation) unchanged and passing |

## 6. Remaining limitations and unverified capabilities

- **No live QIE execution**: no RPC endpoint was contacted, no transaction signed or broadcast, no extension loaded in a browser. `VERIFIED` remains 0 and `knowledge/validation-runs.yaml` remains empty by design; documentation evidence, mocked/local testing, and live verification stay strictly separated.
- **Unverified capabilities remain UNKNOWN/CLAIMED** (not fixed by remediation, correctly represented): `rpc-identity`, `wallet-connect`, `contract-deploy` (deploy), `identity-auth`, `dex-swap`, `bridge-transfer`, `native-delegate`, `indexer-query`, `explorer-verification-api`; CLAIMED web products `qiedex-web-swap`, `qie-bridge-web`.
- **Indexer absence is not proven** — only unsubstantiated in reviewed sources; provider `eth_getLogs` limits are unmeasured; native staking fees/gas are unmeasured.
- **Source-claimed addresses (S12 oracle table, S16 precompile) stay unpublished** until the full address-identity gate (issuer + ABI provenance, scoped observation, human review, conflict handling) is satisfied; the S19 listing version metadata was not treated as a compatibility claim.
- **Browser/wallet behavior** (QIE Wallet v4.2.2 nuances) rests on official documentation, not executed browser tests.
- The historical B08 entry in `docs/decisions.md` retains the original `2,000–5,000 blocks` and precompile statements as recorded history; the appended "B08 remediation decisions" section supersedes them explicitly.

## 7. B08 acceptance verdict

**PASS.** Packaging and local test execution (already sound in both audits) are preserved; every knowledge-integrity, provenance, network-fact, category, count, address-gate, and operational-guidance defect from both reviews is resolved in canonical data, generator, and authored artifacts, and each class of defect now has an adversarial regression test that fails when the inconsistency is re-injected. **B09 is unblocked** for distribution/update/rollback work against release `0.5.1-ecosystem.1`.

## 8. Final independent audit: remaining findings and their resolution

A final independent audit of the remediated bundle (`docs/audit/QIE_Forge_B08_Final_Independent_Audit.md`, archive received and audited 2026-10-19T20:52–20:57Z) verified the nine bundles, the 103-file byte-identical `skills/`/`dist/skills/` trees, the manifest hashes, the local link graph, the 18/18 source-ledger identity match, the 25 capability records, and the removal of the hand-maintained product summary and the precompile address. It found the original B08 defects substantially closed and raised three remaining findings, all now resolved. The remediation was applied to the same release cut (`0.5.1-ecosystem.1`, schema/policy `1.4.0`).

### F-FINAL-01 (P1) — release and source-review timestamps were in the future

- **Reproduced:** Yes. `release-context.json` recorded `built_at: 2026-10-20T08:00:00Z` and source S21 `reviewed_at: 2026-10-20T06:00:00Z`, both later than the archive's own existence. The earlier remediation had written local calendar dates into UTC fields; the check only compared `reviewed_at <= built_at`, so a matching pair of future timestamps passed.
- **Fix:** The release context is re-cut to the real build time (`2026-10-19T22:35:15Z`). S21's review timestamp is set to the time the source was actually re-retrieved and confirmed (`2026-10-19T21:37:00Z`); the retrieved content matches the canonical record (an `Injected Web3` deployment guide, no compiler version, no EVM target). A release-cut chronology gate (`scripts/lib/chronology.mjs`, five-minute documented clock-skew tolerance) compares the release cut and every source review timestamp against the real wall clock, and the deterministic validators keep a separate injected-clock path so frozen fixtures never depend on real time. No timestamp was invented to make a check pass: an unknown review time is recorded as `null` and the dependent operation stays conservative.
- **Tests:** `tests/chronology.test.mjs` proves the gate rejects a future build, a future review, a review after the release cut, invalid timestamps and an invalid clock, and accepts grounded records, tolerated skew and an unknown review time. A frozen-time fixture proves the knowledge validators pass with an injected clock and no real-world dependency.
- **Files:** `release-context.json`, `knowledge/sources.yaml`, `scripts/lib/chronology.mjs`, `scripts/lib/knowledge.mjs`, `scripts/validate-knowledge.mjs`, `scripts/lib/release.mjs`, `docs/b08-results.md`, `docs/evidence/b08/source-ledger.md`, `tests/chronology.test.mjs`.

### F-FINAL-02 (P1) — inconsistent effective-status projection between views

- **Reproduced:** Yes. The catalogue rendered `effectiveStatus(...)` while the compatibility summary rendered the stored `cap.status`, so an expired record would have produced two different support verdicts in one bundle. The audit's probe (`DOCUMENTED`, checked 2026-10-10, expires 2026-10-18, now 2026-10-20 -> STALE) showed the divergence; with no expiring record in the current snapshot it was latent, not a wrong published verdict.
- **Fix:** One shared projection now drives every developer-facing status. The compatibility summary and the detailed cards publish `Stored Status` and `Effective Status` side by side, explicitly labelled; the catalogue overview does the same; the coverage map, the network profiles and the selected-evidence page project through the same evaluator at the same frozen build clock. The authored framework matrix uses the same projection, so an authored page cannot disagree with a generated one.
- **Tests:** A mutation test expires `hardhat-deploy` and asserts the catalogue row, the matrix row, the matrix card and the authored framework row all downgrade to `STALE` together, while the stored status stays visible as `DOCUMENTED`.
- **Files:** `scripts/lib/release.mjs`, `authoring/qie-ecosystem/references/decision-guide.md`, `tests/ecosystem.test.mjs`.

### F-FINAL-03 (P2) — authored examples duplicated canonical network and compatibility facts

- **Reproduced:** Yes, as a recurrence risk. The authored decision guide and skill entry restated RPC URLs, chain IDs, hex chain identifiers and framework deployment statuses by hand, so a canonical change could leave the published guide silently stale with no build drift. The guide was copied into the bundle verbatim.
- **Fix:** Authored content now states canonical network facts and canonical statuses only through placeholders resolved from the skill's own canonical snapshot at build time -- `{{claim:<network_id>:<predicate>}}`, `{{hex:<network_id>:<predicate>}}`, `{{stored:<capability_id>}}`, `{{effective:<capability_id>}}`. The grammar is fixed and strict: an unsupported kind, a malformed claim token, a token matching no canonical claim and a token naming no selected capability all fail the build rather than publishing as literal text. In addition, a build-time traceability gate rejects any authored or published absolute URL whose host no canonical record attests, and rejects the endpoints this release retires (`qiescan.org`, `rpc-main1.qie.digital`, `rpc-testnet.qie.digital`); the QIE-owned domains it checks are derived from the canonical claim values rather than hand-listed, and third-party reference links remain legal in a published bundle because they are not claims about QIE.
- **Tests:** `tests/canonical-facts.test.mjs` proves a hand-edited stale endpoint, a retired endpoint and an invented endpoint each fail the build, that a canonical claim change projects into the published guide while the bundle stays traceable, and that the authored guide contains no hand-written canonical endpoint. `tests/ecosystem.test.mjs` proves a canonical claim change and a canonical status change both reach the published guide, that an unknown placeholder fails publication instead of leaking, and that malformed, unsupported and unresolved placeholders are rejected.
- **Files:** `scripts/lib/canonical-facts.mjs`, `scripts/lib/placeholders.mjs`, `scripts/lib/release.mjs`, `authoring/qie-ecosystem/references/decision-guide.md`, `authoring/qie-ecosystem/SKILL.md.in`, `tests/canonical-facts.test.mjs`, `tests/ecosystem.test.mjs`.

### 8.1 Verification of the final-audit remediation

| Gate | Command | Outcome |
|---|---|---|
| Knowledge/schema validation | `npm run validate` | **PASS** -- 15 domains, 18 sources, 11 claims, 25 capabilities; 9 self-contained bundles valid |
| Build | `npm run build` | **PASS** -- 9 skills rebuilt deterministically |
| Deterministic build & drift | `npm run build:check` | **PASS** -- `Reproduced qie ... qie-ecosystem`; `diff -qr dist/skills skills` clean (103 files each) |
| Evidence-doc drift | `npm run docs:check` | **PASS** -- evidence catalogue matches canonical records |
| Lint | `npm run lint` | **PASS** -- JS syntax checks pass (no TS compiler/style linter by design) |
| Full unit/integration tests | `npm test` | **PASS -- 270/270, 0 failed** (full log: `docs/evidence/b08/tests.txt`) |
| Coverage | `npm run test:coverage` | **PASS -- 270/270; 97.72% lines, 88.37% branches, 98.92% functions** (full log: `docs/evidence/b08/coverage.txt`) |
| Skills CLI installation fixtures | `npm run test:install` | **PASS -- 20/20** (full log: `docs/evidence/b08/installation.txt`) |

### 8.2 What the remediation does not claim

- No live QIE execution: no RPC endpoint was contacted, no transaction signed or broadcast, no extension loaded in a browser. `VERIFIED` remains 0 and `knowledge/validation-runs.yaml` remains empty by design.
- The chronology gate proves only that recorded timestamps are not in the future and that the release cut follows the source reviews. It does not attest that a source was read; the source ledger remains the record of what was reviewed.
- The traceability gate proves that every published QIE endpoint is attested by canonical data. It does not prove that an attested endpoint is reachable, correct, or live-verified -- published configuration remains `DOCUMENTED`, not `VERIFIED`.
- Provider `eth_getLogs` limits, native staking fees and gas, indexer coverage, DEX router identity, and the source-claimed addresses remain unmeasured or unverified, exactly as the earlier sections state.

## 9. Re-audit of the final remediation, and the guard it required

A re-audit of the remediated tree (`docs/audit/QIE_Forge_B08_Final_Remediation_Reaudit.md`, 2026-10-19T22:07Z–22:18Z, Node 24.20.0, read-only) accepted F-FINAL-01, F-FINAL-02 and F-FINAL-03 as closed and re-ran every gate green. It accepted the projection mechanism but held sign-off on one gap in the guard itself.

### 9.1 The gap: authored facts were projected, not guard-locked

The placeholder mechanism prevents a *canonical change* from silently staling the authored guide: a changed claim or status reaches the published page at build time. It did not prevent a *handwritten literal* from re-entering the authored guide. The re-audit demonstrated that replacing a single placeholder with the literal it renders — a chain ID, a support verdict — leaves the build green and every test passing, and that writing `CLAIMED` by hand while the canonical record says `UNKNOWN` publishes two contradictory verdicts in one bundle. That is the F-FINAL-02 failure mode, reintroduced by one token.

- **Fix:** a build-time gate (`assertNoHandWrittenCanonicalFacts` in `scripts/lib/canonical-facts.mjs`) runs on authored content with the placeholders removed, so it sees only what a human typed. It rejects a chain identifier (decimal or `0x`-hex) written literally in a chain or network sentence; a canonical endpoint written literally instead of projected; and a support verdict written by hand — after `status:`/`verdict:`, after a canonical capability identifier, or next to a canonical capability or tool identifier whose canonical statuses do not include it. A general statement about the status vocabulary names no canonical record and stays allowed, so prose is not forced into placeholders it cannot project.
- **Result on the current tree:** the gate found exactly one hand-written canonical fact — the explorer link in the address-identity section of the decision guide — which was replaced with a placeholder. The rendered output is byte-identical, so the published bundle did not change.
- **Tests:** `tests/authored-facts-guard.test.mjs` proves a hand-written chain ID, a hand-written `status:` verdict, a hand-written verdict for a named capability, and a hand-written canonical endpoint each fail the build, that a general statement about the vocabulary stays allowed, and that the authored guide passes the guard as it stands.

### 9.2 Hardening applied from the re-audit notes

- **One chronology implementation.** The release-cut gate and the knowledge validator carried two copies of the same rule with two tolerance constants. `scripts/lib/chronology.mjs` is now the only implementation, and the knowledge validator delegates to it with an injected clock. The knowledge suite is hermetic (a fixed clock); the real-clock behaviour stays covered by `tests/chronology.test.mjs`.
- **One projection, carried by the snapshot.** The effective status and its reason are computed once per release and attached to every claim and capability in the published knowledge snapshot, so every published view reads the same value.
- **The blocking-state list publishes the effective status** and labels the stored status only when the two differ.
- **The executed evidence is regenerated, not hand-copied.** `npm run verify:evidence` runs every gate and writes the complete output of each run to `docs/evidence/b08/<gate>.txt`; the same script then compares the figures the milestone reports quote against the logs the run just wrote and fails when they disagree.

### 9.3 Accepted residual items (recorded, not silently dropped)

- The traceability gate is host-granular for source-derived hosts: a fabricated repository or file path under an attested third-party host would still pass. Recorded as follow-up work.
- A domain's `verification_status` is deliberately not projected: a domain is verified by scoped validation runs rather than by an expiry window, so projecting it would publish a wrong verdict.
- The internal evidence catalogue is a verbatim dump of the canonical records and is labelled as such.
- The native Cosmos chain ID `qie_1990-1` cannot be projected: the claim vocabulary is restricted to the operational EVM networks, and the guide attributes the native chain ID to the Cosmos chain registry source.
- The official Agent Skills validator and a published-git-source installation remain separate release checks.
