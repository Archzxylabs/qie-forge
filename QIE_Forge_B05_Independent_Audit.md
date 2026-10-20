# QIE Forge B05 — Independent Source Audit

**Artifact inspected:** `QIE-FORGE-B05-review.zip` uploaded by the project owner. **Scope:** B05 router and multi-skill distribution; independent static/isolated validation and review of authored code/tests. **Not a live-network or full runtime-host certification.**

## Verdict

**GO with two focused fixes before expanding the skill catalogue.** B05 is materially implemented: router authoring, generated A–Z catalogue, independent `qie` and `qie-networks` bundles, manifest hashes, content parity between staging and publication, and tests. No grounds for a B05 rewrite.

## Independent checks executed

| Check | Outcome | Evidence / limitation |
|---|---|---|
| ZIP contents | PASS | 130 entries; no ZIP path traversal or symlink entries found |
| Published bundle integrity | PASS | Recomputed SHA-256 hashes for 5 manifest members in `qie`, 9 in `qie-networks`; complete inventories |
| Staging equals publication | PASS | All `dist/skills/<id>` bytes matched `skills/<id>` for both skills |
| Manifest time ordering | PASS | `sources_checked_at = 2026-10-19T00:08:45Z` before `built_at = 2026-10-19T01:00:00Z` |
| Local relative file links | PASS | No unresolved Markdown inline relative paths in distributed bundles |
| JavaScript syntax | PASS | All identified source, test and bundled helper `.mjs` files pass `node --check` using Node v22.16.0 |
| Bundled network inspector | PASS | Executed on both mainnet and testnet profiles offline; outputs published chain information with `DOCUMENTED`/`NOT_RUN`, not invented live verification |
| Claimed `npm test` | LOG CONFIRMED | Uploaded `docs/evidence/b05-checks.txt` reports **107 passed / 0 failed**. Not independently rerun |
| Claimed Skills CLI install matrix | LOG CONFIRMED | Uploaded log reports **6 passed / 0 failed**. Not independently rerun |
| Full npm dependency install / test rerun | NOT RUN | Audit container Node v22.16.0, repo requires Node >=24.20.0 <25; npm registry tarballs unavailable in offline npm cache; `npm ci --offline` failed `ENOTCACHED` for `yaml@2.9.1` |
| Live QIE RPC and cross-host LLM routing | NOT RUN | No live RPC or Codex/Claude/Cursor/OpenCode behavioral evaluation in this archive |

## Findings

### F-01 — Routing table wrongly assumes entry skills are released (Medium, expansion blocker)

**Location:** `scripts/lib/release.mjs:102–105`.

`routingReference()` writes `(released)` whenever `domain.entry_skill` is truthy, without checking `skills.yaml.enabled_for_release` and whether it exists in the emitted bundle. `coverageReference()` correctly uses `skillState()` but the routing table does not. This is harmless for the two currently enabled entry skills, but will misinform users if an entry skill is disabled or not published in a future release. **Fix:** use `skillState(catalogue, id)` consistently; add a test with a catalogue entry that exists but `enabled_for_release=false`, asserting both published routing and A–Z references say it is unavailable.

### F-02 — Remediation offered for not-yet-published skills (Medium, UX correctness)

**Locations:** `authoring/qie/SKILL.md.in`, “Missing topical skills”; generated `references/routing.md` in `scripts/lib/release.mjs:114–118`.

A missing locally installed but **published** skill can be installed. A planned skill that does not yet exist in the release cannot. The current message offers the same `skills add ... --skill ...` remediation for both, risking failed installs. **Fix:** distinguish `released but not installed` from `planned/unpublished`. Offer the install command only for published skill IDs. For unpublished skill IDs direct the agent to bundled domain-source references and state executable workflows are unavailable. Include regression fixtures for both conditions.

### F-03 — Multi-skill builder still only understands two artifact types (Low/Medium, B07 readiness)

**Location:** `scripts/lib/release.mjs:13–20,123–160`; `knowledge/schema/skill.schema.json`.

Multiple installed skills work, but every enabled skill must select exactly one of `coverage` or `network-profiles`. The smart-contract/frontend/debug skills proposed for later cannot yet produce domain-specific recipes via this contract. This is not a B05 regression: it is explicitly a narrow vertical slice. **Fix when B07 starts:** add generic skill-local reference/recipe bundling (without forcing network-profile pages on unrelated skills), preserving self-contained install and deterministic build. Avoid building a generic plugin framework prematurely.

### F-04 — Static routing fixtures do not prove host-agent routing accuracy (Evidence gap, not B05 defect)

**Location:** `tests/routing.test.mjs`.

The 23 routing fixtures compare canonical expected domain/skill sets to generated routing tables and check presence of safety strings. They do not send prompts to any LLM or measure the model's choices. **Fix:** retain the fixtures for later behavioral evaluation; report per-host results and block claims of verified four-host routing until actual agent tests have run.

### F-05 — External release gates remain open (Not a B05 defect)

`skills-ref` official validation, remote Git tag/install/rollback, live RPC, QIE wallet/provider capability, and source/ABI identity verification are still untested. Current `UNKNOWN` states and read-only outputs are appropriately conservative. The organizer's subsequently supplied message should be recorded as an eligibility decision with conditions: reference dApp built by team and included in repo, mainnet deployed contract, demo showing Forge workflow and contract source verified on explorer. None implies B05 technical regression.

## Strengths to retain

- `authoring/` and `knowledge/` remain the canonical source; `skills/` is generated and checked.
- Both bundles contain all their declared files and do not rely on repository-root relative links.
- Router separates mainnet/testnet and EVM/native tasks and discloses unknown provider/address capabilities.
- There is no custom MCP, database, chain-signing service or custody requirement.
- B05 docs distinguish unit/fixture success from live QIE/agent behavior.

## Recommendation

**Proceed with B06 in parallel with fixes F-01/F-02.** Before implementing many new topical skills in B07, extend packaging to generic recipes and validate a third skill end-to-end. Keep network reality, verification statuses, and cross-host behavioral tests evidence-based; do not replace the A–Z developer-knowledge mission with a single demo app.
