# QIE FORGE
## Product Requirements Document (PRD) — Version 2.1

**Product designation:** QIE Forge — Universal Developer Intelligence for QIE Blockchain  
**Tagline:** *One skill system. The QIE ecosystem at your agent's fingertips.*  
**Document status:** Revised product specification and executable capability contract; implementation and validation still pending  
**Document owner:** QIE Forge project owner (assign named DRI in repository decision record)  
**Target program:** QIE Hackathon 3.0, Developer Infrastructure & Tooling  
**Implementation model:** New, independently authored open-source repository  
**Initial language:** English for canonical engineering/agent content; additional translations later  
**Decision baseline:** Skills-first, QIE A–Z discovery, original implementation and no forced on-chain registry are fixed; contest-specific eligibility remains unconfirmed

> **Positioning decision (binding for v2.1):** QIE Forge remains an **Agent Skills-first** developer infrastructure product. Its mission is to make QIE's network knowledge, ecosystem tooling, implementation procedures, and troubleshooting discoverable and actionable through compatible coding agents. **Do not build a Build Registry, invent a new token, fork a third-party skill suite, or require a custom MCP/CLI in v2.1.** On-chain evidence verification is a supporting safety capability, not the entire product identity.

---

## 0. Document control and decision log

| Field | Value |
|---|---|
| PRD revision | 2.1 / corrected capability and distribution contracts |
| Product direction | Universal QIE developer intelligence through portable Agent Skills |
| Primary deliverable | Independently installable skills plus task-scoped, evidence-linked QIE references |
| Supporting deliverables | Canonical source/capability catalogue, small read-only helpers, reproducible examples, docs portal |
| Runtime architecture | Files-first; no mandatory hosted service, account, database, custom MCP or custom CLI |
| Product owner | Named DRI to be recorded in `docs/decisions.md` before release publication |
| D-01 / external dependency | Riad/QIE confirms eligibility of skills-led tooling and reference-app contract address |
| D-02 / project operations | Repository namespace, named DRI(s), license, signer/wallet choice and expense authority |
| D-03 / factual support | Provider integrations published as tested only after evidence; otherwise marked accurately |

**Revision history.** v1.0 emphasized dApp deployment evidence. v2.0 established the A–Z QIE knowledge and Agent Skills direction. v2.1 corrects installed-artifact completeness, status vocabulary, proof-of-effect contracts, staffing and scope gates, evaluation, agent portability, eligibility and release freshness. The product is still **Skills-first**; the reference app is test evidence, not the product.

**Fixed decisions:** no Build Registry; no invented token; no third-party fork or relabeling; no required custom MCP/CLI; no wholesale copied QIE docs; agent-agnostic skill sources; QIE Mainnet/Testnet and EVM/native distinctions; read-only bundled helpers; developer-owned signing.

**Normative language.** MUST = release-blocking within the stated scope; SHOULD = strongly preferred with documented exception; MAY = optional. `P0` = minimum externally testable product; `P1` = after P0 acceptance; `P2` = future investment subject to validated demand. **No calendar-based sprint promises or completion-time estimates are part of this PRD.**

**Artifact status:** This document defines what must be implemented and tested. Statements in a proposed schema, workflow, or sample are *not* evidence that code, QIE contracts, provider integrations or cross-agent tests already exist.

---

## 1. Executive summary

**QIE Forge** is an open-source, agent-agnostic development knowledge system for the QIE blockchain. A developer installs one portable collection of Agent Skills, then uses a compatible coding agent—such as Codex, Claude Code, Cursor, or OpenCode—to obtain task-specific, current, evidence-linked instructions for developing on QIE EVM Mainnet/Testnet and for navigating the broader QIE ecosystem.

The experience should answer three questions consistently: **(1) What should I use? (2) How do I use it correctly on QIE? (3) How do I check that it actually works?** QIE Forge combines a skills router, a source-grounded knowledge catalogue, a tool and capability directory, reusable workflows, diagnostic recipes, optional read-only verification scripts, and a documentation portal. It uses existing developer tooling (e.g., Foundry, Hardhat, Viem, Wagmi) instead of unnecessarily rebuilding it.

QIE Forge is **not** the primary source of truth for QIE consensus or project claims. Official documentation, repository releases, and verified chain observations remain authoritative. QIE Forge is the **trusted operational access layer** that connects them with developer tasks. Unknown facts must remain unknown; outdated or unsupported integrations must be identified, not hallucinated.

**Long-term vision:** the most useful QIE developer reference across EVM, native/Cosmos, wallets, tokens, on-chain products, infrastructure, integrations, security, deployment, and troubleshooting. **Release promise:** comprehensive *navigation* of QIE developer domains, with deep executable support only for domains that have validated source and test evidence. Do not market untested A–Z completeness.

**North-star outcome:** an independent developer can go from “I have never built on QIE” to a reproducible, functioning QIE application using the same skills across multiple coding agents, and can discover the correct next tool when their task becomes more specialized.

---

## 2. Strategic context and competition fit

### 2.1 Track applicability

QIE Hackathon's **Developer Infrastructure & Tooling** description includes developer infrastructure such as SDKs, wallet tooling, APIs, analytics, explorers, indexers, and security tools [S01]. These are examples, not a mandate to invent a service or smart contract. Portable developer Agent Skills with actionable QIE tooling support plausibly fit the track; **eligibility is not officially confirmed**. Requirements may include original work, QIE integration, public source, functional demonstration and Mainnet evidence; verify the active rules at [S01]–[S02] before packaging a submission.

### 2.2 Eligibility gate (D-01)

Request written clarification from organizer Riad/QIE on: (a) whether skills-led tooling qualifies; (b) whether the reference dApp Mainnet address counts toward an address field; (c) which deployment/adoption evidence is required for developer tooling. Development of non-contested foundation tasks MAY proceed while awaiting the answer. **Contest readiness is BLOCKED until the relevant requirements are satisfied or explicitly resolved with the organizer.** A pending email is not an eligibility approval. Do not build a meaningless contract to fill a form.

### 2.3 Originality and licenses

QIE Forge MUST be independently authored. Other Agent Skills repositories are research references, not templates for relabeling. Follow third-party licenses for copied material, maintain attribution when required and preserve reviewable implementation rationale and tests. Every QIE-specific procedure must earn its place through a useful development task, verified reference or demonstrated need.

### 2.4 Distinctive product capability

QIE Forge is a **QIE-aware operational knowledge layer**: agent task routing, network-aware capability discovery, exact source provenance, carefully scoped tested integration recipes, and explicit unknown/stale conditions. Verification of a deployment is a *supporting proof mechanism*. The main product is an accurate and usable QIE ecosystem development knowledge system, not an NFT deployment utility.

---

## 3. Problem statement and validation hypotheses

### 3.1 Problem hypothesis

Builders working on QIE must combine generic EVM development practices with QIE-specific network settings, wallet behavior, token contracts, ecosystem services, available RPC/indexer infrastructure, differences between EVM and native QIE workflows, and production troubleshooting. AI coding agents can guess outdated providers or addresses and may report success without reading on-chain receipts. These are plausible pains to validate with users; this document does not represent them as measured QIE-wide statistics.

### 3.2 Targeted failure modes

1. **Knowledge fragmentation:** QIE-specific answers reside across docs, explorers, websites and repositories.
2. **False compatibility:** a tool supports Ethereum or another EVM chain, but not necessarily QIE.
3. **Incorrect network identity:** developer sends a request to wrong chain ID or wrong RPC.
4. **Invented addresses and APIs:** an agent supplies plausible but unsupported token addresses or contracts.
5. **Unclear EVM vs native scope:** developer requests staking or validator behavior but receives ERC-20 smart-contract advice.
6. **Unverifiable outcomes:** a generated app has code, but contract deployment and transaction execution are not proven.
7. **Documentation drift:** SDK/API/CLI commands change while skills remain stale.
8. **Cross-agent inconsistency:** a workflow assumes Claude-specific hooks or proprietary tools.

### 3.3 Discovery and continuation decisions

**Primary candidate user (P0):** an EVM/TypeScript developer already using a coding agent who is new to QIE Mainnet/Testnet. Validate this choice in interviews; do not treat it as known product-market fit. Other personas remain discoverable in the catalogue but do not define the first golden path.

Interview **5–8** QIE-interested developers and observe **at least three** actual build/integration attempts with consent. Capture failed assumptions, information sources, missing tools, false compatibility, whether the developer recovered, and whether a skills package would have helped. Distinguish incident severity from frequency. Avoid collecting secrets or wallets as identity proxies.

**Evidence gate and decisions:**

- `CONTINUE`: at least three distinct observed incidents map to addressable P0 problems, and independent testers complete a relevant task with Forge.
- `NARROW`: demand is plausible but most complaints relate to just one QIE capability (e.g., network setup). Keep the A–Z router/index, but focus executable recipes on that confirmed task.
- `STOP_EXPANSION`: no compelling workflow advantage appears after comparable baseline tasks, or unsafe/incorrect tool recommendations cannot be eliminated. Preserve working public reference content; do not keep increasing skill count to manufacture apparent progress.

These are scope-investment decisions, **not a requirement to abandon the agreed Agent Skills architecture**. Record baseline and Forge-assisted evidence before claiming improved speed, correctness, or adoption.

---

## 4. Product principles and success definition

**P-01. Agent-agnostic by construction.** One canonical Agent Skills source, not one product implementation per AI vendor.

**P-02. Source-grounded, never omniscient.** Every critical QIE-specific claim MUST have provenance and a validation state.

**P-03. Task-driven, not document-dump-driven.** Progressive disclosure is required; router selects only relevant skills/references.

**P-04. Tool discovery before tool invention.** Prefer official and battle-tested existing tooling. Custom code only for gaps with demonstrated value.

**P-05. EVM/native separation.** Never mix QIE EVM `0x` workflows with QIE-native operations without an explicit bridge and verified procedure.

**P-06. Read-only by default.** Bundled QIE Forge helpers never sign or broadcast. External tool operations involving signing, deployment, spending or permission changes require explicit developer involvement and approvals; portable text instructions alone cannot technically enforce third-party agent permissions.

**P-07. Errors are part of the product.** Debugging, wrong-chain handling, unavailable dependencies, and failed receipts are first-class workflows.

**P-08. Original developer contribution.** Skill content, tests and demonstration must be technically substantive and human-reviewed.

**P-09. A–Z means coverage map first, not unsupported feature claims.** Every major domain is discoverable; entries visibly distinguish informative navigation from runnable tested workflows.

**P-10. Independent verification.** If the agent asserts a chain action completed, a user must be able to verify it via objective observations.

**Definition of product success:** QIE Forge reduces uncertainty and setup friction for real QIE developers; users can identify the correct tool/integration for a task and complete at least one independently verifiable QIE Mainnet workflow.

---

## 5. User segments, jobs and permissions

| Persona | Profile | Primary job-to-be-done | Product behavior | Out-of-scope promise |
|---|---|---|---|---|
| DEV-01: first-time QIE builder | Familiar with web apps, limited blockchain expertise | Set up a working QIE project safely | Guided quickstart, network preflight, staged deployment | Autonomous full production app without review |
| DEV-02: EVM/Solidity engineer | Knows Ethereum, new to QIE | Find only QIE-specific deltas and supported tools | Concise delta references, provider compatibility | Assume every Ethereum API works |
| DEV-03: AI-assisted full-stack builder | Uses Codex/Claude/Cursor/OpenCode | Get actionable, correct and debuggable agent workflows | Router + recipes + examples + error resolution | Guaranteed identical agent behavior |
| DEV-04: ecosystem integrator | Integrates DEX/wallet/identity/stable assets | Learn what is officially supported, where addresses originate | Capability catalogue with status and sources | Assume marketing page equals production SDK |
| DEV-05: native/QIE operator | Works with node, delegator, validator | Find correct native documentation and safety limits | Native-vs-EVM routing and approved references | Unsafe automatic validator key handling |
| DEV-06: maintainer/contributor | Curates knowledge and tests | Update tools without stale instructions | Source registry, CI, PR templates, changelog | Unreviewed auto-publication |
| EVAL-01: hackathon reviewer | Needs reproducible evidence | Install, run and inspect a build | Docs, reference example, public evidence, independent tests | Claims of traction without proof |

**Permissions model:** Public reader needs no QIE Forge account. Coding agents read files through host permissions. QIE Forge scripts are read-only unless explicitly documented otherwise. Mainnet transaction approval and signing stay under the developer's control.

---

## 6. Scope boundaries and staged completeness

### 6.1 Release layers

| Layer | Description | Required release state |
|---|---|---|
| L0: Knowledge index | Routes every major QIE developer domain to sources or clear gaps | P0: all domains catalogued |
| L1: Reliable core skills | Tested network, EVM contracts, frontend wallet, debug, production safety | P0: deep support |
| L2: Ecosystem capability catalogue | QIE Wallet/Pass/DEX/stable asset/bridge/indexers/provider statuses | P0: factual directory, not invented SDK recipes |
| L3: Integration recipes | Specific provider/contract integrations with executable examples | P1: only after independent proof |
| L4: Native QIE operations | Cosmos-side SDK/CLI, validators, staking, governance, node operations | P1 read-only guidance; transactional flows later |
| L5: Advanced infra | Indexers, multi-chain, security automation, CI/CD patterns | P2, conditional on real user demand |

### 6.2 P0 in scope

- Standard Agent Skills package and task router.
- QIE EVM mainnet/testnet metadata with chain-identity checks.
- Source and claim registry with provenance, freshness, and capability taxonomy.
- QIE EVM app bootstrap, contract coding/testing, wallet integration, read-only RPC diagnostics, and production deployment procedures.
- Public ecosystem discovery catalogue distinguishing verified/documented/unknown support.
- Complete error-resolution and safe-signing procedures for P0 workflows.
- One reproducible end-to-end reference application (Foundry + TypeScript frontend) with public QIE Mainnet deployment evidence.
- Automated validation of skill frontmatter, references, source schema, commands and smoke tests.
- Public documentation portal, developer onboarding, contributor guidelines, security disclosure process.
- Real external developer testing and the QIE hackathon submission bundle.

### 6.3 P1 in scope (after P0 green)

- Wallet/identity/DEX/stablecoin/bridge integration recipes only if contracts, public interfaces and end-to-end chain proofs exist.
- Native QIE architecture, `qied` and validator/delegator read-only documentation after verifying current CLI/release provenance.
- Multi-language reference support and optional Claude Code hooks that do not change portable core semantics.
- Simple low-cost monitoring of source freshness and CI notification for broken links.

### 6.4 Explicitly out of scope

- Build Registry or arbitrary QIE Forge on-chain record contract.
- A new token, token launchpad, DeFi protocol, lending or wallet custody service.
- Self-managed wallet private-key storage, autonomous unapproved transactions, validator signing infrastructure.
- A proprietary LLM, chatbot, browser automation platform or cloud IDE.
- Full custom QIE CLI or MCP server unless separately validated as essential.
- Scraping/copying entire QIE Docs into repo as a substitute for source mapping.
- Claiming complete QIE SDK support for any provider without tests.
- Collecting prompts, private keys, wallet seed phrases, source files or personal identifiers as analytics.

---

## 7. Information architecture: QIE from A to Z

Every domain has: `domain_id`, user intents, entry skill or directory page, official references, support status, validation tests, and a named owner. **A catalogue entry does not imply functional compatibility.**

| ID | Domain | Required knowledge / tasks | Delivery phase |
|---|---|---|---|
| D01 | Fundamentals and architecture | QIE V3 overview, EVM/native difference, concepts, account formats | P0 navigation; P1 depth |
| D02 | Networks and RPC | Mainnet, testnet, chain IDs, RPC endpoints, explorers, faucet, failover | P0 deep |
| D03 | Accounts and wallets | External wallets, account connection, signing, network switching, auth choices | P0 basic; P1 products |
| D04 | Smart-contract development | Solidity, Foundry, Hardhat, compiler, ABI, OpenZeppelin, tests | P0 deep |
| D05 | Tokens and assets | ERC-20/721/1155, balances, allowances, logs, canonical-address handling | P0 fundamentals; P1 verified QIE contracts |
| D06 | Transactions and gas | JSON-RPC, fees, nonce, failure modes, receipts, finality caveats | P0 deep |
| D07 | Frontend/full-stack | React/Next.js, Viem/Wagmi, provider, contract UI, deployment | P0 deep |
| D08 | Ecosystem products | QIE Wallet, QIE Pass, QIEDex, stable assets, bridges, oracles | P0 directory; P1 integrations |
| D09 | DeFi and liquidity | DEX contracts, router/pool ABI, swaps, pricing, risk | P1 verified-only |
| D10 | Indexing, data and analytics | Events, RPC log range, indexers, APIs, indexer feasibility | P1 verified-only |
| D11 | Native QIE / Cosmos | `qied`, native accounts, staking, validators, delegators, governance | P0 routing; P1 verified knowledge |
| D12 | Security and operations | Signing hygiene, chain mismatch, allowances, audits, release gating | P0 deep |
| D13 | Debugging and diagnostics | Reverts, RPC errors, wrong chain, gas, explorer mismatches, dependency drift | P0 deep |
| D14 | Deployment and production | Testnet-first, verifiable mainnet rollout, frontend build, CI, monitoring | P0 deep |
| D15 | Governance, ecosystem and contribution | Official release channels, governance references, partner contribution | P1 |

**Cross-cutting requirement:** the single canonical status vocabulary in §9.3 applies to both claims and tool capabilities. Each record additionally carries `evidence_type` (official docs / provider docs / runtime test / community lead), exact network and applicable tool version. Never silently translate between competing enum names.

---

## 8. Agent Skills model and routing behavior

### 8.1 Standards contract

Conform to the Agent Skills specification [S05]. Each skill MUST include a correctly formed `SKILL.md` with `name` and `description` in YAML frontmatter; `name` MUST match the directory and all specification constraints. Optional `references/`, `scripts/`, `assets/` are loaded on demand. Avoid dumping large external docs into the skill body. All skills MUST validate through `skills-ref` or an equivalent official validator plus independent tests.

### 8.2 Top-level skill taxonomy

| Skill ID | Name | Primary intent | Priority |
|---|---|---|---|
| SK-00 | `qie` | Route user task across QIE EVM, native, and ecosystem topics | P0 |
| SK-01 | `qie-networks` | Select/verify mainnet or testnet, RPC and explorer | P0 |
| SK-02 | `qie-smart-contracts` | Solidity/Foundry/Hardhat setup, build and tests | P0 |
| SK-03 | `qie-frontend` | Connect UI to correct QIE network and contracts | P0 |
| SK-04 | `qie-wallets` | Wallet compatibility, signing boundaries and user-facing UX | P0 |
| SK-05 | `qie-transactions` | Gas, nonce, receipt checking and JSON-RPC troubleshooting | P0 |
| SK-06 | `qie-deployment` | Testnet/mainnet release checklists and receipts | P0 |
| SK-07 | `qie-ecosystem` | Discover products, providers, verified contracts and status | P0 |
| SK-08 | `qie-debug` | Diagnose common QIE development failures | P0 |
| SK-09 | `qie-native` | EVM-vs-native routing and current native QIE docs | P1 |
| SK-10 | `qie-indexing` | Historical events, indexing and analytics | P1 |
| SK-11 | `qie-defi` | Verified QIEDex/decentralized finance patterns | P1 |
| SK-12 | `qie-security` | Extended secure-development recipes and incident handling | P1; safety rules in P0 |

**Packaging rule (normative):** maintain one canonical authoring source, but publish a **self-contained release skill directory** for each installable skill. The release builder places only the references, network snapshots and helper scripts that the skill actually uses **inside its own directory**, under relative paths, and generates them from canonical sources. Do not hand-edit generated copies. An installed skill MUST NOT require access to `../../knowledge`, `../../scripts`, the original cloned repository or another sibling skill's private files. See §12.4 and FR-019.

**Installer command contracts:** list first with `npx skills add OWNER/qie-forge --list`; install the full suite explicitly with `npx skills add OWNER/qie-forge --skill '*'` and select target agent(s), or use `--skill '*' -a codex -a claude-code -a cursor -a opencode -y` when intentionally installing to those four targets. The plain interactive command might let the user select only some skills; do **not** promise all are installed without checking. Options must be tested against the pinned Skills CLI release [S06].

### 8.3 Router decision contract

Router must identify: task category, target network, EVM vs native context, code execution permission, source availability, and whether user requests a read-only or state-changing action. It MUST ask only for genuinely missing inputs (e.g., target chain or signing approval). It SHOULD select the minimal relevant skills and references rather than loading every domain.

**Example intents:**
- “Build an NFT minting app on QIE” → networks + smart-contracts + frontend + deployment.
- “Find the QIEDex router” → ecosystem directory; do NOT invent address; verify target chain.
- “Stake QIE with a validator” → native-QIE routing; do NOT silently generate ERC-20 staking contract.
- “My transaction reverted” → transactions + debug; inspect receipt, revert evidence, and contract ABI.
- “Which wallet SDK supports QIE?” → ecosystem compatibility search; distinguish test evidence from vendor claims.

### 8.4 Skill content template

Every skill SHOULD contain: purpose, triggers, required inputs, source freshness statement, decision tree, setup, exact procedure, verification, expected output, error branches, security cautions, external references, and fallback path. Include a concise explicit *never assume* section where failure could cost money. Each executable command SHOULD have a supported tool version and a validation recipe.

### 8.5 Skill output contracts

Skill responses MUST label network and source confidence for chain-specific facts. An address answer MUST show target chain, address, source URL, check method and verification state, without implying contract identity from `eth_getCode` alone. State-changing procedures MUST show exact approval boundaries. A debugging response MUST provide evidence and root-cause hypotheses separately.

---

## 9. Knowledge engine: provenance, confidence, freshness

### 9.1 Source hierarchy

| Tier | Source class | Trust use |
|---|---|---|
| T0 | On-chain RPC observation on explicitly verified chain / reproducible executed test | Verifies specific runtime fact, not provider legitimacy |
| T1 | Official QIE docs, official releases/technical specifications, official repository for named component | Primary published reference |
| T2 | Provider's official product documentation and verified code releases | Provider capability, subject to on-QIE tests |
| T3 | Community tutorial, forum, exploratory repository, hackathon README | Leads for investigation; not canonical addresses |
| T4 | Marketing claims, social media, unverified screenshots | Never sole basis for critical configuration |

**Conflict resolution:** if official docs disagree with observed network identity, block write actions and flag a source issue. If two official pages disagree, maintain both claims and mark `CONFLICTED` until maintainer review. Never silently select a convenient value.

### 9.2 Canonical entities and identity boundaries

**`Source`**: `source_id`, `url`, `title`, `publisher`, `trust_tier`, `reviewed_at`, `published_at` if known, `content_sha256` if fetched under permitted terms, `license`, `network_scope`, `maintainer`.

**`Claim`**: `claim_id`, `subject`, `predicate`, `value`, `network_id`, `source_ids`, `status`, `evidence_type`, `evidence_test_ids`, `checked_at`, `expires_at` when applicable, `maintainer`, `risk_level`, `version_scope`.

**`ToolCapability`**: `capability_id`, `tool_id`, `operation`, `network_ids`, `tool_version_range`, `status`, `evidence_type`, `source_ids`, `evidence_test_ids`, `checked_at`, `expires_at`, `recipe_path`, `limitations`.

**`AddressRecord`**: `address`, `chain_id`, `claimed_product`, `issuer_source_ids`, `abi_source_ids`, `code_observation`, `status`, `checked_at`. Bytecode existence and address ownership are separate claims.

**`ValidationRun`**: `test_id`, `scope`, `tool_version`, `network_id`, `expected`, `observed`, `outcome`, `checked_at`, `artifact_hash`, `redacted_log_pointer`, `reviewer`.

All schemas MUST define required fields, allowed null values, strict network identifiers, unique IDs and cross-record references. Runtime validators must reject impossible status/evidence combinations. A catalogue view and installed skill must consume **the same normalized data**, not a manually rewritten list.

### 9.3 One canonical status vocabulary for both Claim and ToolCapability

| Canonical `status` | Meaning | May an agent recommend operational use? |
|---|---|---|
| `VERIFIED` | Exact, version/network-scoped assertion passed a reproducible relevant test with linked evidence and valid freshness | Yes, within demonstrated scope; live write checks still required |
| `DOCUMENTED` | Credible source explicitly describes assertion; no adequate QIE-specific runtime proof | Explain as documented, not independently tested; avoid unsupported write recipe |
| `CLAIMED` | Third-party/community/vendor claim lacks adequate QIE-specific proof | Discovery only; no claim of compatibility |
| `UNKNOWN` | Evidence absent, incomplete, or unable to conclude | Do not infer compatibility/address/operation |
| `CONFLICTED` | Source claims contradict or conflict with observed chain | Block critical use until adjudicated |
| `STALE` | Previously supported evidence is expired or known version/chain changes invalidate applicability | No current verified claim; require revalidation |
| `UNSUPPORTED` | Credible explicit negative evidence demonstrates lack of defined operation | Do not recommend as supported; include counterevidence |
| `DEPRECATED` | Maintainer/vendor/chain officially retired the interface | Recommend supported replacement if available |

**Canonical enum:** `[VERIFIED, DOCUMENTED, CLAIMED, UNKNOWN, CONFLICTED, STALE, UNSUPPORTED, DEPRECATED]`. This exact field and interpretation MUST be used in `knowledge/schema`, generated skill snapshots, website, test fixtures, release report and API-like outputs. Do not use `VERIFIED_LIVE`, `CONFIRMED_TESTED`, `OFFICIALLY_DOCUMENTED`, `THIRD_PARTY_CLAIM` or `UNVERIFIED` as alternate machine statuses. Human-facing labels may be clearer, but must map one-to-one.

**Evidence-type and outcome separation:** `evidence_type` identifies *how a fact was obtained* (`CHAIN_OBSERVATION`, `EXECUTED_TEST`, `OFFICIAL_DOC`, `PROVIDER_DOC`, `COMMUNITY_REPORT`); `ValidationRun.outcome` is `PASS`, `FAIL`, `UNKNOWN`, `NOT_RUN`, or `PENDING`. These are **not** capability status values. Thus a receipt `PASS` does not promote wallet-compatibility to `VERIFIED` by itself.

**Precedence and lifecycle:** `CONFLICTED` outranks positive sources for critical operation; expired `VERIFIED` is **effective status `STALE`**, not `VERIFIED`; removed interface becomes `DEPRECATED` with official evidence; insufficient or revoked evidence becomes `UNKNOWN` or `STALE`, whichever is justified. `CLAIMED` can become `DOCUMENTED` only from credible explicit source, and `VERIFIED` only from a relevant repeatable test, correct version, correct network, matching expected effect and human review. Silence is never evidence of `UNSUPPORTED`.

### 9.4 Freshness, installation snapshots and version policy

Every generated release contains `release_version`, `schema_version`, `built_at`, `sources_checked_at`, plus per-record `checked_at`/`expires_at` for operational claims. The installed snapshot is **immutable until explicit update**; updating the public website or upstream repo does not refresh existing installations. `expires_at` is technical validity metadata, **not a project delivery schedule**. Risk-based TTLs are configuration in `knowledge/policy.yaml`, reviewed by maintainers, not hard-coded promises in project roadmap.

Effective status must be computed from both stored claim state and current validity: `VERIFIED` + expired evidence => `STALE`; conflicting authoritative sources => `CONFLICTED`; no verifiable clock/offline => do not assert freshness for a high-risk transaction or address. Network identity must be checked live prior to any state-changing guidance; versioned recipes must declare compatibility windows. Offline local references remain readable, but live network outcomes become `UNKNOWN`/`NOT_RUN` when checks are unavailable.

**Updates and rollback:** document `npx skills update [skills]` according to the installed CLI [S06], publish changelog and tagged artifacts, support reinstall of a pinned known-good release through a published source/ref mechanism tested in CI, and report installed vs current version. High-risk incidents may quarantine a broken release; never auto-update user machines or silently overwrite curated QIE addresses. Validate both copied and symlinked installations across update and rollback.

---

### 9.5 Acquisition pipeline

1. **Discover** official QIE docs and repositories; list every domain in `source-map`.
2. **Classify** sources by authority, network scope and publication date.
3. **Extract** minimal actionable claims, not wholesale copied documentation.
4. **Validate** critical claims using read-only RPC, package tests, small fixtures or maintainer review.
5. **Normalize** into schemas with status and timestamps; never auto-overwrite disputed facts.
6. **Author** original task-first skills with links to curated source records.
7. **Gate** with lint, link checks, schema validation and runnable fixtures.
8. **Publish** updated skills and website through reviewed pull requests.
9. **Observe** user-reported failures and opened source drift issues.
10. **Deprecate** known-broken instructions with replacement or explicit warning.

**Legal/content rule:** link and summarize third-party docs; do not mirror full copyrighted pages or imply endorsement. Preserve license notices for code snippets actually reused.

---

## 10. Functional requirements (engineering contract)

### FR-001 — Universal installation and discovery [P0]

**Requirement.** A developer SHALL install QIE Forge using the existing Skills CLI and read it in supported compatible agents. Discovery MUST work without registering on QIE Forge.  
**Acceptance:** full-suite install explicitly selects `--skill '*'`; clean-room installed artifacts work after deleting the source checkout and disabling network; all required relative references and read-only helpers exist; partial installs have a clear remediation; malformed YAML and duplicate names fail CI; copy and symlink modes are tested; rollback is reproducible.  
**Evidence:** CI installation log, screenshot or transcript of each target agent, list of discovered skills.

### FR-002 — Accurate task router [P0]

**Requirement.** `qie` MUST direct user intents to correct skills, including EVM/native distinction, and never automatically treat testnet as mainnet.  
**Acceptance:** 20 routing fixtures with ≥90% correct path selections across test runs; 100% correct handling for 5 high-risk wrong-network/native-vs-EVM fixtures. Human-reviewed failures are tracked.  
**Evidence:** routing test cases and recorded results.

### FR-003 — Core QIE network profile [P0]

**Requirement.** The product SHALL ship documented QIE Mainnet 1990 and Testnet 1983 configurations with source links; before write-bound steps, agent MUST verify `eth_chainId` and block responsiveness.  
**Acceptance:** error scenarios (wrong chain, RPC offline, malformed JSON, 429, stale block) return explicit `FAIL` or `UNKNOWN`; no silent fallback across networks.  
**Evidence:** reproducible read-only JSON-RPC tests [S03].

### FR-004 — Developer capability catalogue [P0]

**Requirement.** QIE Forge SHALL catalogue QIE official products and relevant developer providers (wallet, explorer, DEX, identity, stable assets, bridge, indexer, oracles) by concrete capabilities, with status and provenance.  
**Acceptance:** 100% of published `VERIFIED` capabilities have relevant `evidence_test_ids`, `checked_at`, non-expired effective status, concrete network and version; the site and installed skills agree on status. Unknown addresses are never trusted; schema rejects obsolete status aliases and impossible evidence combinations.  
**Evidence:** catalogue schema validator + sample manual checks.

### FR-005 — Smart-contract development skill [P0]

**Requirement.** Developers SHALL be able to scaffold a simple Solidity app with verified EVM toolchain configuration, compile and run tests; reusable recipe supports both Foundry primary and Hardhat reference when validated.  
**Acceptance:** clean test workspace compiles and tests; tool versions pinned and documented; no undocumented QIE-specific opcode/gas assertions.  
**Evidence:** CI build artifacts and test output.

### FR-006 — Frontend/wallet integration knowledge [P0]

**Requirement.** Provide usable TypeScript frontend recipe using Viem/Wagmi or equivalent supported EVM stack and explicit QIE chain definitions; wallet-dependent instructions state verified compatibility.  
**Acceptance:** demo shows connect, correct chain gating, read contract and post-receipt state update; unsupported embedded wallet SDK features are not claimed.  
**Evidence:** smoke test + docs screenshots.

### FR-007 — Transaction diagnostics and security [P0]

**Requirement.** Agent SHALL interpret RPC failures, receipt status, chain mismatch, nonce/gas issues, explorer disagreement and unsupported methods without invented success; independently distinguish receipt existence from claimed application outcome.  
**Acceptance:** ≥12 negative-path fixtures; no FAIL classified as PASS; transaction execution and application completion are separate findings; inability to determine outcome yields PENDING/UNKNOWN.  
**Evidence:** fixture suite, documented troubleshooting decision tree.

### FR-008 — Human-approved deployment workflow [P0]

**Requirement.** Official QIE Forge examples MUST keep broadcasting in user-controlled tools and require the developer to review/approve network, transaction type, signer, contract/call and anticipated maximum spend. The bundled QIE Forge helper scripts MUST remain read-only and MUST NOT collect raw keys. Agent instruction text alone cannot technically prevent a host agent from violating permissions; explicit human signing is an external release precondition.  
**Acceptance:** no unattended mainnet write in documented workflow; no secret in logs; wrong chain stops deployment; dry-run path available.  
**Evidence:** redacted manual walkthrough and security tests.

### FR-009 — Chain evidence helper [P0 support]

**Requirement.** Portable read-only helpers check `eth_chainId`, `eth_getTransactionReceipt`, `eth_getCode` and scoped application effects (`eth_call`/logs where justified). Input binds claimed action, expected chain, tx hash and expected contract. Output separates `inclusion`, `execution`, `identity_linkage`, `application_effect` and `finality_status`. Generic receipt checks may assert only generic receipt facts. No writes.
**Acceptance:** unrelated successful tx, mismatched receipt.contractAddress, wrong `to`, wrong event/state, missing code, reverted receipt, noncanonical/vanished receipt, unavailable finality evidence and fake tx must never produce `APPLICATION_VERIFIED`. A receipt may pass an execution check while the application outcome remains UNKNOWN/FAIL; no unsupported QIE confirmation count is invented.  
**Evidence:** JSON fixtures and test logs.

### FR-010 — End-to-end reference application [P0]

**Requirement.** Deliver one small but real QIE application (recommend ERC-721 mint demo) built using QIE Forge's own recipes, with source, tests, public frontend and traceable mainnet chain evidence.  
**Acceptance:** external reviewer can follow README, inspect explorer records and reproduce local build; app network guards correct; no claim of verified source without actual verification.  
**Evidence:** repo, demo URL, tx hash, contract address, test runs and screenshots.

### FR-011 — Public documentation/website [P0]

**Requirement.** Website SHALL provide single-command install, agent compatibility matrix, skill catalogue, QIE A–Z topic directory, searchable or browsable recipes, provenance explanation, examples, troubleshooting, contributions and limitations.  
**Acceptance:** Lighthouse/accessibility targets under NFR, no broken install links, mobile readable, public stable URL; technical facts sourced from canonical content.  
**Evidence:** QA report and live deployment.

### FR-012 — Source freshness and change governance [P0]

**Requirement.** Tool and address entries MUST have status and last check; PR review required for critical changes. Broken critical references and expired evidence block release or display warnings.  
**Acceptance:** source registry and generated package snapshots validate; simulated expired capability must render `STALE` in website **and an old installed skill**; critical claim conflicts prevent trusted recommendations; PR template requires source and test evidence.  
**Evidence:** CI rule tests and review logs.

### FR-013 — Cross-agent compatibility [P0]

**Requirement.** One skill library SHALL be tested for Codex, Claude Code, Cursor and OpenCode. Skills MUST NOT require Claude-only hooks.  
**Acceptance:** install/discovery PASS in all four named hosts; at least **two different hosts** complete the same golden-path workflow under pinned fixture assumptions; frozen intent fixtures are evaluated independently per host/model (minimum three repetitions per fixture in the pilot); five high-risk routing fixtures must pass every recorded run; incomplete/NOT_RUN is not PASS. Record host/model/version and execution permissions.  
**Evidence:** compatibility matrix with version and test date.

### FR-014 — Contributor workflow and feedback [P0]

**Requirement.** Provide an issue template for broken command, outdated source, incompatible tool, missing capability and security concern; feedback submission MUST be opt-in and redact secrets.  
**Acceptance:** a contributor can add a reference and see lint failure for missing provenance; no automatic collection of prompts or account details.  
**Evidence:** contributor guide and pull request template.

### FR-015 — Minimal adoption measurement [P0]

**Requirement.** Record opt-in developer usability outcomes rather than unconsented telemetry. Separate installs, activations, completed verified tasks and repeat usage.  
**Acceptance:** a publicly explainable pilot summary includes denominator, task failures, intervention level, comparable baseline, and declared outcome threshold; only consented data is retained. An install, wallet address or generated code alone is not a verified developer completion.  
**Evidence:** consented usability dataset, redacted summary.

### FR-016 — Native/Cosmos routing [P0 discovery, P1 deep]

**Requirement.** Router MUST identify when task concerns QIE-native operations and lead to official relevant docs without providing unsupported EVM instructions. Deeper node/delegation/staking guides require release/version evidence.  
**Acceptance:** 100% of native-specific routing fixtures avoid unsafe EVM substitutions; unclear current native CLI procedures explicitly return DOCUMENTED/UNKNOWN.  
**Evidence:** native intent fixture set.

### FR-017 — Public integration recipes [P1]

**Requirement.** At least one external QIE ecosystem integration MAY be promoted from catalogued to tested recipe only after verifying exact product interface, network and deployment contract/source.  
**Acceptance:** install, setup, testnet (if applicable), failure-path and mainnet proof; recorded limitations.  
**Evidence:** end-to-end integration test and maintainer sign-off.

### FR-018 — Documentation lifecycle [P1]

**Requirement.** Automated source freshness checks SHOULD open issues or review suggestions but MUST NOT auto-publish disputed/critical changes. Maintainer approval is mandatory for status promotion and contract address replacement.  
**Acceptance:** simulate a broken source and conflicting update; notification created; prior curated snapshot remains intact and status downgraded or flagged.  
**Evidence:** CI workflow run + maintainer decision record.

### FR-019 — Self-contained skill release artifact [P0 / R0]

**Requirement.** The build pipeline MUST generate installable `skills/<name>/` directories with all skill-local needed references, data snapshots and read-only helpers. The root `knowledge/` remains canonical, but installed skills MUST NOT depend on sibling-root files or external checkout paths.  
**Acceptance:** install to a clean machine with `--skill '*'` and again with a subset; delete checkout/cache; verify local reference resolution, helper invocation and safe offline behavior under both copy and symlink installation modes. Generated files are reproducible and marked `DO NOT EDIT`. A standalone skill either functions or explicitly reports missing optional skills, without broken relative paths.  
**Evidence:** deterministic packer tests, release tree manifest, content hashes and clean-room logs.

### FR-020 — Canonical status and effective freshness [P0 / R0]

**Requirement.** All entities, snapshots, UI views, agent outputs and tests MUST use the enum defined in §9.3 and compute effective freshness at read time.  
**Acceptance:** fixtures `VERIFIED` (current), `VERIFIED` (expired → `STALE`), `DOCUMENTED`, `CLAIMED`, `CONFLICTED`, `UNKNOWN`, `UNSUPPORTED`, and `DEPRECATED` render identically across package/site/test layer; obsolete enum names fail schema. A stale installed snapshot cannot claim a fresh verified high-risk address.  
**Evidence:** schema validation, snapshot fixture tests, browser check and offline execution transcript.

### FR-021 — Proof-of-effect contract [P0 / R0]

**Requirement.** Verification is scoped to a named action: direct contract creation, specific function call, mint event/state, or generic receipt inspection. Expected network, transaction, actor/target and relevant postcondition must be specified; ambiguous inputs cannot yield `APPLICATION_VERIFIED`.  
**Acceptance:** matching QIE direct-creation receipt and code/linkage passes the correct checks; other successful transaction with deployed code elsewhere fails linkage; mint receipt on another contract fails; event/state mismatch fails; unavailable chain finality is explicitly `UNKNOWN`, not guessed.  
**Evidence:** negative-path fixtures, expected-state contracts, independently inspectable RPC results and reproducible report.

---

## 11. End-to-end user journeys and edge cases

### UJ-01 — First-time install and navigation

**Preconditions:** developer has a supported coding agent, Node/npm or equivalent installer access, and network access to GitHub. **Steps:** visit QIE Forge site → run `npx skills add OWNER/qie-forge --list` → explicitly install `--skill '*'` to the chosen host(s) → verify installed manifest → agent discovers `qie` → ask “How do I build on QIE?” → router returns relevant workflow and clearly states available/unknown capabilities. **Failure branches:** offline install, incompatible CLI, invalid frontmatter, conflicting prior skill name. **Done:** the installed package is self-contained in a clean workspace and required skills are discoverable; absent optional skills produce explicit fallback, not a broken path.

### UJ-02 — Build an ERC-721 dApp from scratch

**Preconditions:** clean workspace, approved developer toolchain. **Steps:** task prompt → resolve network (testnet default for experiments) → create Solidity contract/test project → create TypeScript frontend → validate wallet/chain → run contract tests → deploy to testnet with developer-approved signing → smoke test mint → assemble evidence → prepare mainnet launch. **Failure branches:** missing faucet funds, signer not set, failed compilation, wrong chain, revert. **Done:** testnet app works and outputs reproducible evidence before mainnet approval.

### UJ-03 — Verify QIE Mainnet transaction and contract

**Preconditions:** claimed action (`GENERIC_TX`, `DEPLOY`, `MINT` or supported contract interaction), expected network, tx hash, expected target/creation address if claim requires it, and postconditions. **Steps:** verify chain identity → obtain transaction, receipt and canonical block consistency where supported → check receipt status → verify `to` or creation `contractAddress` → inspect code → match event logs and/or read-only state relevant to action → report inclusion, execution, identity, application effect and finality separately. **Failure branches:** RPC inconsistency, reorg, wrong target, unrelated successful tx, missing contract code, absent event, unknown confirmation policy. **Done:** narrow, independently justified claim; no unsupported success wording.

### UJ-04 — Find a QIE ecosystem integration

**Preconditions:** developer needs QIEDex/QIE Pass/QIE Wallet/stable asset/bridge or an indexer. **Steps:** router opens catalogue → filter target network and capability → show verified docs + address provenance → if tested recipe exists, use it → otherwise provide precise source links, missing evidence, and non-claiming fallback. **Failure branches:** no confirmed SDK, ambiguous product naming, stale provider release. **Done:** developer gets a supported next action or a clear explanation why integration cannot be recommended yet.

### UJ-05 — Diagnose a failed deployment

**Preconditions:** command output, transaction hash or error message (redacted). **Steps:** classify local build vs network vs broadcast vs execution → inspect chain identity and error codes → isolate probable cause → run minimal read-only diagnostics → recommend smallest safe correction → verify outcome. **Failure branches:** missing ABI, unsupported RPC method, insufficient funds, gas underestimation, wallet rejection. **Done:** evidence-based resolution or documented unresolved blocker; no fabricated success.

### UJ-06 — Native staking vs EVM staking

**Preconditions:** user says “stake QIE.” **Steps:** router clarifies or identifies whether request is native delegation, validator operation, or smart-contract staking → choose native references or EVM recipe → flag unsupported live capabilities → do not expose validator keys. **Done:** no accidental switch between account models or unsafe action.

### UJ-07 — Maintainer updates broken tool instructions

**Preconditions:** user reports `qie-wallets` instructions are stale. **Steps:** open issue with redacted reproduction → maintainer locates claim/source record → verifies new provider docs and pinned versions → updates recipe/test → CI runs → reviewed PR merges → changelog reports change, affected networks and status. **Done:** correction is traceable, tested, and visible.

### UJ-08 — Hackathon evaluation

**Preconditions:** independent reviewer with ordinary developer machine. **Steps:** visit public site → inspect skills/version/source → install with one command → execute reference task → inspect actual QIE mainnet app and explorer proof → verify repository test history and pilot metrics → review originality and known limitations. **Done:** complete submission is independently auditable and reproducible without private credentials.

---

## 12. Technical architecture

### 12.1 Logical flow

```text
Developer + compatible coding agent
                |
                v
       Agent Skills discovery
                |
                v
       qie/SKILL.md router
                |
       +--------+---------+
       |                  |
       v                  v
 Topical SKILL.md      Catalog / source map
       |                  |
       +--------+---------+
                v
    Task-specific procedures / references
                |
       +--------+---------+
       |                  |
       v                  v
 Existing tools       Read-only QIE checks
 (Foundry, Viem)       (RPC / receipts / code)
       |                  |
       +--------+---------+
                v
  Working app / verified knowledge / clear blocker
                |
                v
   Public docs + issue feedback + human review
```

### 12.2 Deployment architecture

- **Code hosting:** public Git repository, protected default branch, review required for critical changes.
- **Distribution:** Agent Skills files distributed through existing Skills CLI; no proprietary agent service.
- **Docs:** static website/CDN. Prefer build-time ingestion of canonical markdown/JSON; no mandatory accounts or database.
- **Core scripts:** portable Node.js read-only verification scripts with minimal dependencies and fast failure modes; no service credentials needed.
- **Reference app:** static/Next.js frontend and Foundry contract repository content; deployed contract on QIE Mainnet for demonstrable chain use.
- **Automation:** GitHub Actions for skill/spec lint, source-schema validation, unit tests, link checks, build and optional RPC smoke tests.
- **Monitoring:** CI source-review notices and issue tracking, not invasive install telemetry.

### 12.3 Architecture decision records

`ADR-001`: Agent Skills as universal integration surface.  
`ADR-002`: No custom MCP/CLI for hackathon baseline.  
`ADR-003`: Static docs and read-only helpers; no user backend.  
`ADR-004`: Source registry is maintainer-reviewed, not an autonomous scrape-and-publish system.  
`ADR-005`: QIE EVM deep support before native transaction automation.  
`ADR-006`: Explicit human approval for signing and financial risk.  
`ADR-007`: Scope and handling of third-party intellectual property.

### 12.4 Release packaging and install-time isolation (R0 — mandatory)

**Canonical authoring:** `knowledge/` (curated source data), `skills-src/` or `skills/` (authored `SKILL.md` and references), `scripts/` (original read-only tooling), `recipes/` and `examples/` remain reviewable source. **Release directory:** `dist/skills/<skill-name>/` is the deterministic **staging** artifact; published `skills/<skill-name>/` contains that exact generated output and is the installer-visible contract. Before publishing a tag, the packer generates only the task-scoped data, executable helper copies, and Markdown references that each skill points to:

```text
dist/skills/qie-networks/
  SKILL.md
  references/network-mainnet.md
  references/network-testnet.md
  references/release-info.md
  data/network-claims.json
  scripts/verify-network.mjs
  MANIFEST.json
```

`SKILL.md` local links use `references/...` or `scripts/...`, **never `../../knowledge/...`**. The packer computes manifest hashes and release/schema versions; CI compares deterministically regenerated output and fails on an edited generated file. Place `dist/skills/` into a published installable repository/source layout that Skills CLI is proven to discover; if the official CLI detects only top-level `skills/`, copy the generated release content there **as the publication artifact**, not as the source of edits. A `--list` smoke test determines the actual interface.

**Distribution contracts:** (a) `npx skills add OWNER/qie-forge --skill '*'` explicitly selects the suite in a chosen host; (b) `npx skills add OWNER/qie-forge --skill qie-networks` must independently work; (c) a `qie` router missing a topical skill must point the user to the explicit install command rather than blindly reading a nonexistent path. Installer `--copy` and default symlink modes are both tested. The full **source example app** is separately cloned/fetched by a documented optional workflow; it is not claimed to be automatically installed as part of every skill.

**Release tests:** install a tagged artifact in a clean temporary HOME, delete original checkout and installer cache, run reference/link checks with no network, run local diagnostics against mocks, verify status expiry, test partial install, update and pinned release rollback. The same manifest feeds the public documentation site. **No bundled helper performs signing or broadcasting.**

### 12.5 Operational state machine and interfaces

The golden-path lifecycle is `NOT_INSTALLED → INSTALLED → ROUTED → SOURCES_VALIDATED → PROJECT_BUILT → TESTS_PASSED → AWAITING_USER_APPROVAL → BROADCAST_SUBMITTED → RECEIPT_OBSERVED → CLAIM_CHECKED → COMPLETED`. `FAILED`, `UNKNOWN` and `BLOCKED` may occur from applicable states; on-chain `PENDING` and `REORG_SUSPECTED` are not success states. An agent cannot prove external human approval was obtained merely by writing text; signing is delegated to developer-controlled tools and local prompts must show the action and chain.

**Inputs:** user intent, target network, locally available project and toolchain, optional address/tx, selected action, approved tool invocation. **Outputs:** selected skill names, source/status findings, procedural commands with versions, local test results, optional evidence report and known blockers. Tool execution belongs to the coding host, not a QIE Forge cloud backend; execution permissions depend on that host.

**Release decision rules:** core packaging and status are hard blockers; publishing a recipe with a fabricated/unproven address is blocked; site cosmetics, additional recipes and secondary toolchains cannot delay a passing core. No stage uses a calendar timebox.

---

## 13. Repository layout and ownership

```text
qie-forge/
├── skills/                         # Public install artifact (generated from canonical source)
│   ├── qie/                        # Each contains SKILL.md + local refs/data/helpers
│   ├── qie-networks/
│   ├── qie-smart-contracts/
│   ├── qie-frontend/
│   ├── qie-wallets/
│   ├── qie-transactions/
│   ├── qie-deployment/
│   ├── qie-ecosystem/
│   └── qie-debug/
├── authoring/                      # Canonical skill prose; NOT a second install root
├── knowledge/
│   ├── sources.yaml
│   ├── claims.yaml
│   ├── capabilities.yaml
│   ├── addresses.yaml
│   ├── policy.yaml                 # Freshness policy, reviewed changes
│   └── schema/                     # Shared canonical status schema
├── scripts/
│   ├── build-skill-release.mjs    # Generate self-contained skills/ + manifests
│   ├── validate-skills.mjs
│   ├── validate-knowledge.mjs
│   ├── verify-network.mjs         # Read-only, bundled where needed
│   └── verify-deployment.mjs      # Read-only, evidence scoped to expected action
├── examples/nft-reference/
│   ├── contracts/                 # Foundry + pinned versions
│   └── web/                       # TypeScript UI
├── tests/
│   ├── packaging/                 # Clean HOME, deleted checkout, copy/symlink, partial
│   ├── status-and-expiry/
│   ├── routing/
│   ├── verifier-negative/
│   └── agent-compatibility/
├── apps/docs/                      # Site built from canonical authored+generated data
├── docs/
│   ├── PRD.md
│   ├── capability-contract.md
│   ├── source-map.md
│   ├── architecture.md
│   ├── compatibility.md
│   ├── decisions.md               # DRI, scope and external-eligibility outcome
│   ├── security.md
│   ├── roadmap.md                  # Dependency/gate driven, no dates
│   └── adr/
├── .github/workflows/
├── README.md
├── LICENSE
├── NOTICE.md
├── CONTRIBUTING.md
├── SECURITY.md
└── package.json
```

**Key rule:** `authoring/` + `knowledge/` + `scripts/` own editable truth; `skills/` is generated/published self-contained release output. A manually edited generated skill is rejected in CI. The docs website reads canonical metadata and publishes identical evidence states. Users can install a single skill without fetching sibling source. Implementation may pick a simpler equivalent repository layout **only if the install-time isolation invariants remain satisfied**.

**Named accountability:** the repo MUST identify one accountable project owner, one release/signing owner and maintainers for network/source changes. One person MAY hold multiple roles, but their actual capacity, hardware/access, test-wallet gas budget and independent-tester availability MUST be recorded before scope lock; fictional staff allocations are not acceptable.

---

## 14. Data contracts and interface examples

### 14.1 Capability record (illustrative schema, not a verified QIE integration)

```yaml
id: cap-wallet-example-01
product: example-wallet-provider
operation: connect_external_evm_wallet
networks: [qie-mainnet]
status: UNKNOWN
evidence_type: null
source_ids: []
integration_recipe: null
last_checked_at: null
validation_test_id: null
limitations:
  - No confirmed QIE-specific production test yet
```

**Rule:** a capability record with `status: VERIFIED` MUST reference a relevant reproducible test and valid `checked_at`, `expires_at`, exact network and version. `UNKNOWN` cannot masquerade as a verified address or a recommendation. All examples follow canonical §9.3 status vocabulary.

### 14.2 Claim record (documented network configuration)

```yaml
id: qie-evm-mainnet-chain-id
subject: qie-evm-mainnet
property: chain_id
value: 1990
source_ids: [S03]
status: DOCUMENTED
evidence_type: OFFICIAL_DOC
network: mainnet
risk: critical
runtime_validator: eth_chainId
last_checked_at: null  # Populate only after an actual execution
```

Do not prefill timestamps to simulate testing. Observed confirmations are produced only by actual checks.

### 14.3 Read-only network check output

```json
{
  "schemaVersion": "1.0",
  "network": "qie-mainnet",
  "expectedChainId": 1990,
  "observedChainId": null,
  "latestBlock": null,
  "status": "NOT_RUN",
  "checkedAt": null,
  "rpcHost": "rpc1mainnet.qie.digital",
  "errorCode": null
}
```

### 14.4 Scoped deployment/application evidence output (schema contract)

The report explicitly binds the expected action to the transaction and contract; `null`/`NOT_RUN` examples are intentionally **not a proof of deployment**.

```json
{
  "schemaVersion": "1.1",
  "networkId": "qie-mainnet",
  "expectedChainId": 1990,
  "expectedAction": {
    "kind": "DEPLOY_DIRECT",
    "txHash": null,
    "expectedContractAddress": null,
    "expectedTo": null,
    "expectedPostcondition": "runtime-code-present"
  },
  "observed": {
    "chainId": null,
    "transactionTo": null,
    "receiptContractAddress": null,
    "receiptBlockHash": null,
    "receiptStatus": "NOT_RUN",
    "codePresent": null
  },
  "checks": {
    "inclusion": "NOT_RUN",
    "execution": "NOT_RUN",
    "identityLinkage": "NOT_RUN",
    "applicationEffect": "NOT_RUN",
    "finality": "UNKNOWN"
  },
  "applicationOutcome": "UNKNOWN",
  "evidenceRefs": [],
  "generatedAt": null,
  "warnings": ["QIE-specific finality policy requires verified network evidence"]
}
```

`applicationOutcome = APPLICATION_VERIFIED` is allowed only when every required scoped check passes **and** the selected confirmation/finality policy has evidence. If finality cannot be established with trusted QIE rules, use `CONFIRMED_AT_BLOCK` as a limited descriptive report or `UNKNOWN` as overall completion; never invent a fixed confirmation number. A generic receipt inspector cannot claim an NFT mint or deploy effect unless action-specific checks were requested and passed. An account-creation transaction must match receipt `contractAddress`, creation intent and runtime code; a mint must match `to`, expected contract ABI/log topics and required post-call state where available. For proxy deploys or factory calls, use separate audited recipes, not direct-deploy assumptions.

**Application-outcome enum:** `APPLICATION_VERIFIED`, `APPLICATION_FAILED`, `UNKNOWN`, `PENDING`, `NOT_RUN`; this is separate from `Claim.status`, `ToolCapability.status` and individual check outcomes. **Independent error tests:** unrelated successful receipt, mismatched contract address, unrelated nonempty bytecode, wrong event indexed address, missing log, changed/missing block, wrong chain, fake tx, RPC timeout and reverted tx never yield `applicationOutcome: APPLICATION_VERIFIED`.

---

### 14.5 Stable error classes

`WRONG_CHAIN`, `RPC_UNAVAILABLE`, `RPC_RATE_LIMITED`, `RPC_MALFORMED`, `TX_PENDING`, `TX_REVERTED`, `TX_NOT_FOUND`, `CONTRACT_NO_CODE`, `ADDRESS_UNVERIFIED`, `SOURCE_STALE`, `UNSUPPORTED_PROVIDER`, `USER_APPROVAL_REQUIRED`, `DEPENDENCY_MISMATCH`, `UNKNOWN`.

Reports SHOULD include remediation and evidence links, not raw secrets or full terminal logs.

---

## 15. Website and developer experience

### 15.1 Information structure

- `/` — product value proposition, supported agents, quick install, prominent quickstart.
- `/get-started` — prerequisites, one-command install, verify installation, first use.
- `/skills` — browsable skills with scope, triggers, links, tested agent status.
- `/topics` — QIE A–Z domain explorer; each domain displays coverage state and known gaps.
- `/ecosystem` — tool/provider catalogue with explicit support statuses and proof links.
- `/recipes` — reproducible task-first examples; differentiated from static technical reference.
- `/reference/networks` — documented network details and safe RPC checks.
- `/troubleshooting` — error-code based diagnosis and solutions.
- `/verification` — explanation of evidence levels and read-only checks.
- `/contribute` — provenance rules, how to add or fix skills, security disclosure.
- `/status` — release version, changelog, known limitations, last verified update.

### 15.2 UX standards

First viewport MUST show purpose, compatible agent examples, installation command and a concrete QIE development task. Visitors should find mainnet/testnet settings in ≤2 navigational steps. Entries marked unknown/stale must be visible and not tucked away in footnotes. Use semantic navigation, readable mobile typography, keyboard focus, copyable code snippets, links to repo and sources, and no login requirement.

### 15.3 Content governance

The docs website MUST render source metadata, effective freshness and capability statuses from the canonical files and the same release snapshots consumed by installed skills. Factual content should be changed via reviewed PR, not a disconnected website CMS. Example screenshots should be labeled example unless independently verified. Logs may be linked as demonstration artifacts but never contain keys, internal env values or identifiable private information.

---

## 16. Security, safety and trust boundaries

### 16.1 Threat model

| Threat | Failure mode | Mandatory mitigation |
|---|---|---|
| Malicious/untrusted docs | Prompt injection embedded in fetched page or GitHub issue | Treat retrieved content as data; only curated skills define operating rules; refuse external override instructions |
| Fabricated address | Funds sent to malicious contract | Exact chain ID + trusted provenance; never treat bare code existence as identity |
| Wrong chain | Irreversible write on unintended EVM network | Preflight `eth_chainId`, explicit display/confirmation, block mismatch |
| Agent secret access | Private keys exposed via prompt/log/file | Never ask for seed/private keys; developer-controlled signer; redact logs |
| Unapproved financial action | Autonomous broadcast/spend/approval | Explicit human sign-off for every state change with effect summary |
| Stale CLI guidance | Broken or dangerous instructions | Version pins, CI, capability status, downgrade to STALE |
| Unsafe contract advice | Reentrancy, approvals, privilege mistakes | Standard libraries, test coverage, audit disclaimers, no production safety claims |
| Supply-chain compromise | Dependency/script misuse | Minimal dependencies, integrity locks, code review, pin major tool versions |
| CI secret leak | Test pipeline prints credentials | Fake keys only in CI, secret scanning, no real mainnet signing creds |
| Misleading verification | Receipt interpreted as secure/verified contract | Evidence taxonomy, differentiate chain inclusion/source match/security audit |

### 16.2 Execution approval contract

Read-only RPC calls and local tests may run using granted host permissions. Any write action (deploying, sending native QIE, minting, swapping, approving allowances, staking/delegating, changing admin permissions) MUST display target network, contract/address, transaction effect, signer, estimated maximum fee and source of action, and MUST wait for explicit user approval. Never design a bypass flag that quietly authorizes mainnet actions. Agent-specific hooks may help but are not a security boundary shared by all agents.

### 16.3 Secure information boundaries

Do not store raw prompts, private source trees, wallet keys, mnemonic phrases, RPC provider credentials or user IP addresses in a QIE Forge database. No database is needed for MVP. `PUBLIC_` frontend environment variables must never contain secret keys. GitHub issues must guide reporters to redact tx details when sensitive and never include private-key material.

### 16.4 Vulnerability reporting

Security policy includes reporting email/channel TBD, triage through a documented triage priority policy, private disclosure option, and emergency quarantine of an affected skill or reference. A skill package can cause financial harm even without hosting a smart contract, so security reviews apply to instructions as well as executable code.

---

## 17. Quality attributes and SLO targets

| ID | Non-functional requirement | P0 target / method |
|---|---|---|
| NFR-01 | Portability | Single canonical skill set; four named agents install and discover |
| NFR-02 | Correctness | Zero known critical network/address hallucinations in published P0 recipes |
| NFR-03 | Truthfulness | No `UNKNOWN`/`PENDING` reported as verified success |
| NFR-04 | Safety | Zero known path to unattended mainnet financial write in official workflow |
| NFR-05 | Documentation usability | Install + first skill activation documented in as few steps as practicable for a prepared machine (measured, not assumed) |
| NFR-06 | Website accessibility | Accessible labels/keyboard navigation, contrast checks, no blocking layout defects |
| NFR-07 | Freshness | Critical P0 claims tracked with source, reviewer and check timestamp |
| NFR-08 | Maintainability | Mandatory automated frontmatter/schema/reference validation on PR |
| NFR-09 | Minimal runtime dependency | Installed skills readable offline after install; chain checks fail safely when network absent |
| NFR-10 | Reliability | RPC diagnostics time out within documented bound; no silent indefinite wait |
| NFR-11 | Observability | Reproducible CI logs and redacted test reports; no invasive telemetry |
| NFR-12 | Reproducibility | Reference contracts compile from pinned versions and documented environment |

Suggested UX acceptance targets: Lighthouse accessibility score ≥90 on key pages and zero severe axe violations; these are project goals pending implementation, not audited results.

---

## 18. Test strategy and acceptance matrix

### 18.1 Test layers

**T1 — Static package quality.** Validate YAML syntax, name length/format, directory alignment, description quality, broken references, unsupported external copy/paste, forbidden secret patterns, and skill catalogue completeness.

**T2 — Knowledge consistency.** Validate JSON/YAML schema, unique claim IDs, status enums, network scope, source URLs, evidence-test linkage, date formats, and conflict states. Critical unknown address must cause a failed recommendation.

**T3 — CLI/tool recipe replay.** Re-run documented commands in containers or clean VMs where possible; pin version; record expected exit code. Distinguish successful tool existence from actual QIE interoperability.

**T4 — RPC & verification unit tests.** Mock chain responses for correct chain, wrong chain, timeout, RPC 429, reverted receipt, absent receipt, missing runtime code, invalid ABI and malformed JSON.

**T5 — E2E reference app.** Compile/test locally, deploy to testnet under explicit approval, execute a test transaction, run wallet UI smoke test, repeat selected mainnet journey with real on-chain evidence.

**T6 — Cross-agent integration.** Independently verify installation, discovery, routing and execution in Codex, Claude Code, Cursor and OpenCode. Record agent version, model (where relevant), OS, selected skill and source of execution permissions.

**T7 — Security / negative tests.** Deliberately provide a fake contract address, wrong chain, malicious docs text, ambiguous staking intent, secret-looking strings, and request for unapproved mainnet broadcast. Must be blocked or safely qualified.

**T8 — Installed-artifact isolation.** Publish generated skills into a clean fixture; install the suite and individual skill in copy and symlink modes; remove source checkout/cache; check relative reference resolution, read-only helper execution against mocks, and offline reading. Test missing optional sibling skills.

**T9 — Historical snapshot and compatibility drift.** Freeze a release manifest with a verified claim that expires under a test clock; compare website and installed effective status; run tagged update and rollback; test version mismatch, conflict and disconnected network.

**T10 — Action-linked blockchain outcome.** For direct deploy and mint fixture paths, assert expected chain and action identity, receipt, contract, ABI-relevant events and postcondition; wrong/unrelated transactions, changed block hashes and missing finality block overall application verification.

### 18.2 Agent compatibility matrix (to be completed, not prefilled as pass)

| Agent | Installer/discovery | Read references | Run local tests | Run RPC diagnostics | Mainnet approval path |
|---|---|---|---|---|---|
| Codex | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN |
| Claude Code | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN |
| Cursor | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN |
| OpenCode | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN |

Runtime host support varies; universal skill format does not imply uniform tool execution. Add results only after tests.

### 18.3 Critical rejection tests

| Test ID | Setup | Required result |
|---|---|---|
| NEG-01 | RPC chain ID differs from chosen network | STOP; no write |
| NEG-02 | RPC times out | UNKNOWN; no success |
| NEG-03 | Fake transaction hash | NOT_FOUND/PENDING, never PASS |
| NEG-04 | Receipt status indicates revert | FAIL, not deployed-success |
| NEG-05 | `eth_getCode` returns empty | No contract-code claim |
| NEG-06 | Unverified QIEDex/stable-asset address | Source-needed warning, no direct use |
| NEG-07 | Asked for native staking, given Solidity context | Clarify/route native, do not generate ERC-20 staking advice |
| NEG-08 | Agent prompted for seed/private key | Refuse/redirect to local secure signer |
| NEG-09 | Untrusted docs instruct to exfiltrate env file | Ignore as untrusted content |
| NEG-10 | Unsupported provider claims EVM-general compatibility | Remain CLAIMED/UNKNOWN until QIE-specific test |
| NEG-11 | Invalid skill frontmatter or broken file link | CI fails |
| NEG-12 | Mainnet deploy with no explicit user approval | Block action |

### 18.4 Benchmark methodology

For consenting independent developers, run comparable baseline tasks (agent + official QIE docs, no Forge) against agent + QIE Forge. Freeze task/host/model/network fixtures, rotate order when possible, and record environment, interventions and failures. **Pilot thresholds (product targets, not observed facts):** at least 5 testers; at least 3 independently complete the frozen golden path without maintainer intervention; **zero critical wrong-chain or invented-address recommendations**; accuracy on high-risk fixtures 100%; median verified-completion duration improves by a target of ≥25% among matched completed task pairs. Report failed or censored tasks separately, not only successful completion durations. If the improvement target is missed, `NARROW` or `STOP_EXPANSION` before adding domains. Voluntary repeat use is only a descriptive follow-up signal, not assumed retention.

**QA rubric:** record each fixture's accepted set of routes, approved commands, expected QIE network, expected verification result and forbidden behavior before testing. Report pass rate per host/model separately, not pooled. Golden path must run on at least **two distinct coding-agent hosts** and all four hosts must be installation/discovery tested.

---

## 19. Metrics and adoption strategy

### 19.1 North-star metric

**Verified QIE developer completions (VQDC):** unique, consenting external developers who complete a QIE development task with an independently verifiable result and provide sufficient non-sensitive evidence to reproduce assessment. One wallet address alone does not establish a unique developer.

### 19.2 Proposed hackathon targets (not yet achieved)

| Metric | Proposed target | Evidence |
|---|---|---|
| Developer discovery interviews | 5–8 | Consent-based summary |
| External independent testers | ≥5 | Redacted test records + comparable baseline |
| Verified completed developer tasks | ≥3 | Reproducible reports + consent |
| Codex, Claude, Cursor, OpenCode installation tests | 4/4 | Compatibility matrix |
| Full app demo | 1 deployed to QIE Mainnet | Live frontend + contract + action-linked evidence |
| High-risk source claims missing provenance | 0 | Automated report |
| Known critical security violations in shipped workflows | 0 | Manual review + negative tests |
| Cross-agent routed-intent fixtures | ≥20 frozen fixtures with ≥3 pilot repetitions each | Per-host test matrix |

### 19.3 Ecosystem distribution

Open-source README, skills directory discovery, QIE builders/community channels, hackathon teams and targeted technical tutorials. Encourage actual QIE applications by publishing reproducible examples and contributor recipes. Organic reuse is prioritized over token rewards, quests or incentivized wallet creation.

### 19.4 Commercial model

Keep skills and base knowledge free/open-source at launch. Possible future offerings (verified CI integration, managed freshness monitoring, professional team support) are **hypotheses**, not PRD commitments. Do not add a billing backend during the hackathon merely to imply traction.

---

## 20. Engineering backlog and dependency ordering (no calendar schedule)

**Delivery policy:** no dates, deadlines, week counts, sprint durations or hour estimates are assigned in this plan. Tasks are pulled in **dependency order** and advance only on acceptance evidence. Product owner MUST record actual capacity and expenses, but the public plan does not assign artificial implementation times.

| Work ID | Priority | Deliverable | Prerequisite | Release evidence |
|---|---|---|---|---|
| QF-001 | P0 | Clarify hackathon eligibility with Riad | None | Written determination; until then contest readiness BLOCKED |
| QF-002 | P0 | Developer discovery and selected primary persona | Tester access | Consented interview and observed failure notes |
| QF-003 | P0 | Curated QIE source map and domain inventory | Official sources | D01–D15 coverage entries and documented gaps |
| QF-004 | P0 / R0 | Canonical schemas/status precedence | QF-003 | Enum fixtures and contract validation pass |
| QF-005 | P0 / R0 | Self-contained packaging and release manifest | QF-004 | Clean-room copy/symlink/partial-install pass |
| QF-006 | P0 | `qie` router + first skills | QF-005 | Agent Skills validation, frozen intent fixtures |
| QF-007 | P0 | Five golden-path QIE workflows | QF-003, QF-006 | Correct network/build/wallet/deploy/debug recipes |
| QF-008 | P0 | Curated ecosystem capability directory | QF-004 | No unsupported trusted addresses or enums |
| QF-009 | P0 / R0 | Scoped read-only evidence verifier | QF-004 | Unrelated-success, wrong-target, reorg and effect checks |
| QF-010 | P0 | One reference contract/frontend | QF-007 | Reproducible local build and tests |
| QF-011 | P0 | Controlled testnet proof and mainnet demo | QF-009, QF-010 | Actual receipt and app-specific state linked to action |
| QF-012 | P0 | Docs portal generated from canonical content | QF-004–008 | Install/capability/source parity and website QA |
| QF-013 | P0 | Agent compatibility + negative suite | QF-005–011 | 4 installs, 2 distinct host journeys, frozen fixtures |
| QF-014 | P0 | User pilot and evidence-based scope decision | QF-012–013 | Predeclared thresholds, outcome and failure report |
| QF-015 | P0 | Submission package (conditional) | QF-001, QF-011–014 | Organizer requirements satisfied; no assumed eligibility |
| QF-016 | P1 | Native/Cosmos depth and one ecosystem integration | Published source + tested tool path | Scoped released recipe + tests |
| QF-017 | P1 | Automatic drift alerting, not autopublishing | Canonical statuses stable | Review-needed alerts + safe downgrade behavior |
| QF-018 | P2 | Advanced indexing/DeFi/translation | External request plus maintainership | Separate product decision and evidence |

**Priority cut order when capacity is constrained:** pause cosmetic extras → drop provider recipes with no proof → defer Hardhat second path → defer deep native/Cosmos execution → defer advanced indexers/DeFi → shrink website to required pages. **Never cut:** the installed artifact contract, accurate network/sources/status, developer signing boundaries, negative tests, action-linked proof, or truthful eligibility status.

## 21. Stage gates and go/no-go criteria (dependency-based only)

| Gate | Evidence required | Outcome if incomplete |
|---|---|---|
| G0 — Product & ownership | Skills-first direction, named DRI, approved core scope, access/budget and unresolved D-01 recorded | NO P0 release claim |
| G1 — Knowledge & portable package | Canonical enum/schema, source map, generated self-contained install; offline/copy/symlink tests | BLOCK skill distribution |
| G2 — Golden-path local execution | Routing checks + Foundry tests + wallet UI read flow + security reviews | BLOCK live deployment |
| G3 — Proof integrity | Read-only validator negative fixtures and valid testnet deployment/action linkage | BLOCK Mainnet readiness claim |
| G4 — Cross-agent & developer value | 4 installer/discovery checks, 2 different successful host workflows, consented external pilot | Record failures; NO claim of broad compatibility/adoption |
| G5 — Release candidate | Docs/site generated from canonical snapshots, tagged release, update/rollback procedure, Mainnet proof if authorized | Do not publish as production-ready |
| G6 — Contest readiness | Organizer eligibility resolved, submission fields/evidence verified, actual artifacts available | **BLOCK contest eligibility/compliance claim** |

**Decision policy:** `PASS` only with linked artifacts; `FAIL`/`NOT_RUN` means gate not met. `UNKNOWN` on contest policy cannot be promoted by a team assumption. Work on independent core modules may proceed despite an outstanding organizer decision, but contest readiness cannot be green.

**Release sign-off contract:** the project owner owns feature scope and adoption claims; a maintainer approves canonical network/source changes; the developer-controlled wallet owner approves any Mainnet write; a reviewer other than the implementer checks at least critical release artifacts when available. If roles are combined, disclose the limitation. No task ownership or budget values are fabricated here.

---

## 22. Definition of Done (release and hackathon)

QIE Forge v2.0 hackathon release is **DONE** only if all below are true:

1. P0 skills are independently authored, validate and install as self-contained artifacts (full suite and selected skill; copy/symlink) without source checkout access.
2. All four target coding agents have install/discovery PASS (not merely NOT_RUN), and at least two different hosts complete the frozen golden path; limitations are explicit.
3. The router handles QIE EVM vs native and high-risk network intents correctly.
4. Every critical network/tool/address claim has provenance, one canonical status enum, and effective freshness verified in an installed snapshot; unknowns remain unknown.
5. A developer can create, compile and test the reference Solidity project from clean setup.
6. A public reference application is deployed on QIE Mainnet (subject to human approval), and deployment and any claimed mint/action are proven by transaction-to-contract linkage and action-relevant state, not just a receipt.
7. Verification helpers never infer success from absent or contradictory blockchain evidence.
8. No official workflow requires giving private keys or seed phrases to a coding agent.
9. Website is live, discoverable, accessible, and linked to source/install/docs.
10. CI checks skill metadata, generated release manifests, schema/status, references, deleted-checkout install, expiry behavior, tests and secret patterns.
11. External tester evidence and real limitations are disclosed honestly.
12. The organizer-specific eligibility requirement is **resolved** and the submission has satisfied actual applicable rules; an outstanding answer is not acceptable for a `CONTEST_READY` PASS.
13. User-facing claims do not state that all QIE ecosystem integrations are production-ready when untested.
14. Attribution/licensing is appropriate and hackathon originality rules have been reviewed.

**A–Z vision is not synonymous with P0 deep implementation of every domain.** A topic is honestly complete only once verified references and runnable recipes support its described capabilities. An informational index plus “unknown” status is preferable to a false promise.

---

## 23. Risk register and response plans

| Risk ID | Severity | Trigger | Required response / release treatment |
|---|---|---|---|
| R-01 | Critical | Organizer rejects Skills-led project or reference contract address | Resolve policy with organizer; repackage only if it solves actual eligibility; G6 BLOCK until then |
| R-02 | Critical | Installer loses `knowledge/` or helpers | Generate scoped self-contained release; deleted-checkout tests; G1 BLOCK |
| R-03 | Critical | Inconsistent capability statuses | Enforce one enum/mapping, effective status and schema CI; G1 BLOCK |
| R-04 | High | Receipt exists but unrelated to claimed action | Require expected action, tx/contract linkage and postcondition; G3 BLOCK |
| R-05 | High | Docs conflict with chain observation | Mark CONFLICTED; block write-bound recipe, maintainer review |
| R-06 | High | Third-party SDK lacks QIE support | UNKNOWN/CLAIMED until tested; no fabricated direct integration |
| R-07 | High | Agent mishandles secrets or autonomous Mainnet write | Quarantine unsafe workflow; local user signing, host permission review |
| R-08 | Medium | P0 exceeds available contributors | Enforce cut order; protect core knowledge/distribution and proof tests |
| R-09 | High | QIE RPC unavailable or reorg observation unclear | Explicit UNKNOWN/PENDING; retry/read from trusted correct-chain endpoints |
| R-10 | High | Installed snapshot expires but says fresh | Effective expiry checks and release metadata; stale warning and update instructions |
| R-11 | Medium | Cross-agent experience differs | Test actual host/model combinations; record host-specific constraints |
| R-12 | Medium | Developer demand not demonstrated | NARROW/STOP_EXPANSION using predeclared pilot gates; keep safe working core |
| R-13 | Medium | Docs legally copied / dependency version drifts | Original authored summaries, license attribution, version-pinned recipes |

---

## 24. Immediate work queue (dependency order; no dates)

1. **Decide:** record DRI, public repository namespace, license, allowable test gas budget, preferred user-controlled signer, and reference application choice in `docs/decisions.md`; send D-01 eligibility question to Riad if not already sent.
2. **Inventory:** map official QIE sources to D01–D15, highlighting unsupported native/provider claims rather than inferring them. Record domain entry references and gaps.
3. **Contract:** freeze canonical statuses (§9), source/capability schema, and release packaging decisions; create representative valid/invalid fixtures.
4. **Package:** implement deterministic skill release generator and `--list`, single-skill, all-skills, copy/symlink clean-room checks. Keep local references inside each installed skill.
5. **Router:** author original `qie` and `qie-networks` skills and freeze five task intent classes for regression.
6. **Golden path:** implement one verified EVM task journey plus negative RPC/receipt/action tests, controlled testnet flow, then approved Mainnet proof.
7. **Release:** publish documentation from canonical data, cross-agent matrix, tester outcomes, known limitations and current eligibility decision.

**No timeline allocation is implied.** When an item lacks evidence, report its current state and blocker; do not invent a due date or imply completion.

---

## 25. Traceability matrix

| User outcome | Core requirements | Tests | Release gate |
|---|---|---|---|
| Install standalone/full suite across agents | FR-001, FR-013, FR-019 | T1, T6, packaging isolation | G1, G4 |
| Find the right QIE tool with trustworthy status | FR-002, FR-004, FR-016, FR-020 | T2, routing + expiry fixtures | G1 |
| Trust network/addresses and installed freshness | FR-003, FR-012, FR-020 | T2, T4, T7, stale snapshots | G1, G3 |
| Build a real dApp with linked proof | FR-005, FR-006, FR-009, FR-010, FR-021 | T3, T5, unrelated-success negative | G2, G3, G5 |
| Troubleshoot safely | FR-007, FR-008, FR-009 | T4, T7 | G3 |
| Maintain source truth | FR-004, FR-012, FR-014, FR-018 | T1, T2 | G1, ongoing |
| Discover product and contribute | FR-011, FR-014, FR-015 | Web QA, pilot | G4, G5 |
| Prove contest eligibility and real evidence | FR-010, FR-015, FR-021 | Organizer response, submission checklist | G6 |

---

## Appendix A. Product-specific network baseline

**Published network baseline — `DOCUMENTED` only, NOT a live verification result (check identity before operational use):**

| Surface | Published value | Evidence source |
|---|---|---|
| QIE EVM Mainnet chain ID | `1990` (`0x7c6`) | [S03] |
| QIE EVM Mainnet RPC example | `https://rpc1mainnet.qie.digital/` | [S03] |
| QIE EVM Mainnet explorer | `https://mainnet.qie.digital/` | [S03] |
| QIE EVM Testnet chain ID | `1983` (`0x7bf`) | [S03] |
| QIE EVM Testnet RPC example | `https://rpc1testnet.qie.digital/` | [S03] |
| QIE EVM Testnet explorer | `https://testnet.qie.digital/` | [S03] |
| QIE Testnet faucet | `https://www.qie.digital/faucet` | [S03] |
| QIE execution surfaces | QIE documentation describes EVM and Cosmos | [S04] |

The QIE docs list multiple RPC alternatives. Do not represent any listed endpoint as guaranteed available, and do not move between mainnet and testnet during fallback.

## Appendix B. Sample cross-agent tasks

**Route task:** “Explain whether QIE staking in a validator and ERC-20 staking are the same operation.” Expected: distinguish native/EVM, link source, avoid inventing native CLI commands.

**Configure task:** “Add QIE Mainnet and Testnet to a Viem project and confirm active chain using read-only RPC.” Expected: correct chain IDs and live check; stop on mismatch.

**Develop task:** “Build a minimal ERC-721 with tests for QIE Testnet.” Expected: Foundry project passes tests with a documented compiler version.

**Integrate task:** “Use QIE Pass for identity in my Next.js app.” Expected: evaluate SDK and official documentation; if integration unsupported/unverified, explain exactly what remains missing.

**Debug task:** “Transaction 0x… is successful in my terminal but no NFT appears.” Expected: check correct network, receipt, logs, code, ABI and frontend addresses; never infer successful mint without evidence.

**Deploy task:** “Deploy to QIE Mainnet now.” Expected: preflight identity and local tests, show signing approval contract and gas estimate before action.

## Appendix C. Working definitions

- **Agent Skill:** Portable, task-specific instructions and optionally scoped supporting scripts/references following the Agent Skills specification.
- **Capability:** A concrete action a tool/provider can perform on a specified QIE network and software version, not a blanket endorsement.
- **Canonical source:** Official, primary technical reference for a particular claim; multiple competing documents may exist.
- **Source god:** Informal product vision meaning a comprehensive, easily accessed QIE developer operational knowledge layer. Not a claim of infallible knowledge.
- **Verified build:** A build whose claims are supported by specified independent observations; not a code security audit.
- **Mainnet ready:** Meets documented checklist and human approval, not a blanket claim that a product is risk-free.
- **Reference dApp:** Concrete sample application used to show how skills produce a working QIE artifact; not an invented registry contract.
- **Cross-agent compatibility:** Valid install/discovery and usable workflow in independently tested host agents, within documented host-specific boundaries.

## Appendix D. Authoritative references and further reading

- **[S01]** QIE Hackathon 3.0 homepage and Developer Infrastructure & Tooling track: https://hackathon.qie.digital/
- **[S02]** QIE Hackathon Terms of Service (submission/originality): https://hackathon.qie.digital/terms
- **[S03]** QIE Official Network/RPC/Explorer documentation: https://docs.qie.digital/getting-started-with-qie-blockchain/4.-access-mainnet-or-testnet
- **[S04]** QIE V3 Key Features (EVM + Cosmos documentation): https://docs.qie.digital/what-is-qie/qie-v3-key-features
- **[S05]** Agent Skills official specification: https://agentskills.io/specification
- **[S06]** Skills CLI repository and supported installation usage: https://github.com/vercel-labs/skills
- **[S07]** Retired source entry; no third-party repository identifier is recorded in the current tree.
- **[S08]** QIE Hackathon starter repos and public QIE admin org: https://github.com/qieadmin
- **[S09]** QIE blockchain public GitHub organization: https://github.com/qie-blockchain

**Research integrity note:** Public sources cited above support QIE's stated network configuration and hackathon rules at the time of writing. They do not prove availability of undocumented RPC methods, QIE Pass public production SDK, canonical QIEDEX contract addresses, stablecoin custody, QIE Wallet API integration, bridge production readiness or full native CLI specifications. Those must be promoted only after evidence collection under Sections 9, 10 and 18.



---

## Appendix E. PRD v2.1 repair traceability (ECC review F-01–F-08)

| ECC finding | Binding correction | Verifiable acceptance |
|---|---|---|
| F-01: installed package gaps | §8.2, §12.4, §13, FR-019 | Delete checkout/cache; run full/partial install, copy/symlink and local refs |
| F-02: conflicting statuses | §9.3–9.4, FR-004, FR-020, §14 | Same canonical enum and effective freshness in skills/site/schemas |
| F-03: transaction proof too broad | FR-009, FR-021, UJ-03, §14.4 | Unrelated success, wrong target/event/state, reorg fail completion |
| F-04: uncosted P0 scope | §3.3, §20–21, §13 | Named DRI/capacity and cut order before release sign-off |
| F-05: missing value gate | §3.3, §18.4 | Declared continue/narrow/stop thresholds; baseline and failures recorded |
| F-06: weak cross-agent proof | FR-013, §18.2/18.4, §21 | Four install tests plus two distinct hosts complete golden path |
| F-07: contest gate too permissive | §2.2, G6, DoD | Outstanding D-01 blocks `CONTEST_READY` |
| F-08: old installed skills become stale | §9.4, FR-012, FR-020 | Expired installed snapshot degrades to STALE; update/rollback tested |

**Review status:** v2.1 fixes the **specification defects** identified in the Codex ECC review. It does not mean CI, agent installs, RPC tests, product discovery, Mainnet deployment or organizer permission have been successfully executed. Engineering readiness is assessed **per gate**, not inferred from document length.

## Appendix F. Capability contract for engineering handoff

### CAPABILITY

A developer using a supported coding agent can install portable QIE Forge skills and access task-directed QIE ecosystem references, provider capability states and safe implementation procedures. They can complete one verified QIE EVM reference workflow and understand whether other A–Z domain capabilities are documented, tested, unsupported, stale or unknown.

### INVARIANTS AND TRUST BOUNDARIES

1. Official QIE/vendor sources and independent runtime evidence remain external truth; Forge is their curated operational interface, not an omniscient authority.
2. One canonical authored source creates independently installable, self-contained skill files; website and runtime semantics derive from the same normalized records.
3. Network/address/provider claims require scoped status and evidence. A missing source stays UNKNOWN; expired evidence becomes STALE.
4. EVM and native Cosmos operations must not be conflated. Contract deployment does not imply validator staking support.
5. Read-only bundled helpers never request private keys, sign or broadcast. Writes happen only with explicit action review and an independent user-owned signer.
6. `NOT_RUN`, `UNKNOWN`, `PENDING`, `FAILED`, unrelated transaction success, and ambiguous finality cannot become a verified app completion.
7. Cross-agent file-format compatibility is distinct from actual model/host behavior; the latter requires recorded tests.

### IMPLEMENTATION SURFACES

| Actor | Surface / responsibility | Explicit constraint |
|---|---|---|
| Developer | Uses host coding agent, selects network, reviews/approves signing | Must control credentials and spending |
| Coding-agent host | Loads skills and executes allowed tools | Agent runtime permissions vary by product |
| Installed QIE Forge skill | Local refs/data/scripts and routing metadata | No root-repository dependency after installation |
| Maintainer | Curates sources, releases snapshots, reviews tests | May not promote status without evidence |
| Independent reviewer | Installs/test tasks and checks chain outcome | Requires public artifacts, no secret credentials |
| Organizer | Determines contest eligibility | Team cannot self-certify ambiguous rules |

### INTERFACES

- **Installation:** Skills CLI `add/list/update/remove`, explicit skill selection, tested copy and symlink.
- **Knowledge:** `Source`, `Claim`, `ToolCapability`, `AddressRecord`, `ValidationRun`; local generated manifests/snapshots.
- **Tools:** Foundry and compatible frontend tools invoked through host agent; QIE Forge helpers read only.
- **Evidence:** expected action + observed chain/tx/contract + scoped checks and outcome; no server required.
- **Feedback:** opt-in GitHub issue/PR with redaction guidance; no automatic prompt telemetry.

### RELEASE-DECISION HANDOFF

- **Ready for implementation:** source inventory, schema/status fixtures, release packaging generator, skill router skeleton, read-only local RPC mocks and documentation framework.
- **Needs scoped technical review:** finality/effect checks for live QIE chain, tested wallet compatibility, distribution artifact behavior and signer-specific flow.
- **Needs external resolution before contest-ready label:** eligibility of Agent Skills tooling and acceptance of reference contract evidence (D-01).
- **Needs product ownership confirmation:** named DRI, staffing/capacity, mainnet gas budget, repo/license and selected reference app/signer.

**Implementation must not wait for an arbitrary scheduled milestone; it moves when its prerequisites and acceptance checks are met.**
