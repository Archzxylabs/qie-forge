# QIE FORGE
## Product Requirements Document (PRD) — Version 2.0

**Product designation:** QIE Forge — Universal Developer Intelligence for QIE Blockchain  
**Tagline:** *One skill system. The QIE ecosystem at your agent's fingertips.*  
**Document status:** Engineering-ready product specification; no implementation is implied  
**Document owner:** Founding product / engineering team (to assign)  
**Prepared:** 19 October 2026  
**Target program:** QIE Hackathon 3.0, Developer Infrastructure & Tooling  
**Submission target:** 30 November 2026; internal release candidate by 27 November 2026  
**Implementation model:** New, independently authored open-source repository  
**Initial language:** English for canonical engineering/agent content; additional translations later  
**Decision baseline:** Approved product direction from project discussion; final competition eligibility requires organizer confirmation

> **Positioning decision (binding for v2.0):** QIE Forge remains an **Agent Skills-first** developer infrastructure product. Its mission is to make QIE's network knowledge, ecosystem tooling, implementation procedures, and troubleshooting discoverable and actionable through compatible coding agents. **Do not build a Build Registry, invent a new token, fork a third-party skill suite, or require a custom MCP/CLI in v2.0.** On-chain evidence verification is a supporting safety capability, not the entire product identity.

---

## 0. Document control and decision log

| Field | Value |
|---|---|
| PRD revision | 2.0 / initial approved-scope candidate |
| Product direction | Universal QIE developer knowledge and action layer |
| Primary delivery | Cross-agent Agent Skills package + validated knowledge catalogue |
| Secondary delivery | Public documentation portal + integration recipes + verification helpers |
| Deployment surface | QIE EVM Mainnet and Testnet; native/Cosmos topics covered in a carefully staged manner |
| Audience | QIE-first developers, experienced EVM developers, AI-assisted builders, ecosystem maintainers |
| Open decision D-01 | Organizer eligibility and contract-address expectations for skills-led tooling |
| Open decision D-02 | Public GitHub organization/repository and maintainers |
| Open decision D-03 | Which QIE ecosystem tools have publishable, verified integration paths |

**Revision history.** v1.0 centered on an evidence-first ERC-721 deployment MVP. v2.0 deliberately broadens the *product architecture and knowledge model* to QIE A–Z while retaining a narrow, demonstrable end-to-end release path. It removes the proposed Build Registry and makes source freshness, tool discovery, compatibility assertions, and task routing first-class capabilities. This is a substantive product revision rather than a cosmetic rebrand.

**Normative language.** MUST = mandatory before the relevant release gate; SHOULD = expected unless explicitly waived; MAY = optional. P0 = critical hackathon release; P1 = follow-up if P0 passes; P2 = post-hackathon. Proposed business and KPI figures are targets, not current achievements.

---

## 1. Executive summary

**QIE Forge** is an open-source, agent-agnostic development knowledge system for the QIE blockchain. A developer installs one portable collection of Agent Skills, then uses a compatible coding agent—such as Codex, Claude Code, Cursor, or OpenCode—to obtain task-specific, current, evidence-linked instructions for developing on QIE EVM Mainnet/Testnet and for navigating the broader QIE ecosystem.

The experience should answer three questions consistently: **(1) What should I use? (2) How do I use it correctly on QIE? (3) How do I check that it actually works?** QIE Forge combines a skills router, a source-grounded knowledge catalogue, a tool and capability directory, reusable workflows, diagnostic recipes, optional read-only verification scripts, and a documentation portal. It uses existing developer tooling (e.g., Foundry, Hardhat, Viem, Wagmi) instead of unnecessarily rebuilding it.

QIE Forge is **not** the primary source of truth for QIE consensus or project claims. Official documentation, repository releases, and verified chain observations remain authoritative. QIE Forge is the **trusted operational access layer** that connects them with developer tasks. Unknown facts must remain unknown; outdated or unsupported integrations must be identified, not hallucinated.

**Long-term vision:** the most useful QIE developer reference across EVM, native/Cosmos, wallets, tokens, on-chain products, infrastructure, integrations, security, deployment, and troubleshooting. **Release promise:** comprehensive *navigation* of QIE developer domains, with deep executable support only for domains that have validated source and test evidence. Do not market untested A–Z completeness.

**North-star outcome:** an independent developer can go from “I have never built on QIE” to a reproducible, functioning QIE application using the same skills across multiple coding agents, and can discover the correct next tool when their task becomes more specialized.

---

## 2. Strategic context and competition fit

### 2.1 Verified context

The QIE Hackathon 3.0 homepage explicitly lists **Developer Infrastructure & Tooling** as a track, including examples such as SDKs, wallet tooling, APIs, analytics, explorers, indexers and security tools [S01]. The published terms require QIE integration, original work during the hackathon, a functional demo/prototype, GitHub source and comprehensive documentation [S02]. The homepage instructs builders to submit a repository, demo URL, contract address and track, and emphasizes mainnet and traction [S01].

**Important date interpretation:** the homepage describes an event continuing through 10 December 2026, but separately states a **submission deadline of 30 November**, demo week **1–5 December**, and winners **10 December**. Engineer against the earlier submission deadline unless the organizers explicitly revise it.

### 2.2 Eligibility dependency (not a resolved fact)

The track description does **not** explicitly guarantee that a predominantly off-chain Agent Skills library qualifies or that a deployed reference dApp's contract address satisfies the required field. The team MUST obtain a written clarification from organizer Riad/QIE. Do not manufacture a contract solely to satisfy a field; if eligibility requires a different deliverable, make an explicit product decision before changing the architecture.

### 2.3 Originality policy

QIE Forge MUST be independently authored. Existing open-source Agent Skills projects MAY be researched to understand standards, ergonomics and known mistakes. They MUST NOT be cloned and relabeled. The team MUST keep human-reviewed commit history, implementation rationale, test evidence and an attribution file for any third-party material actually reused. Follow the license terms of any reused material.

### 2.4 Strategic wedge

A generic blockchain documentation wrapper is easy to copy. QIE Forge's defensible initial wedge is its **QIE-specific capability truth system**: task routing + provenance + compatibility status + executable recipes + negative-path tests. As a result, the agent not only recommends tools but knows which QIE claims are documented, directly verified, outdated, unsupported or unknown.

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

### 3.3 Discovery plan

Within the first seven days, interview 5–8 developers who have tried QIE or are attempting their first QIE dApp. For at least three, observe an actual workflow (fresh environment → network check → simple contract). Record setup time, information sources, errors, security concerns and what they would voluntarily reuse. Maintain redacted transcripts or summarized notes with consent. **Decision gate:** if fewer than three developers encounter concrete issues addressed by the proposed P0 package, adjust task selection—not the universal-skill architecture—before adding more content.

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

**P-09. A–Z means coverage map first, not unsupported feature claims.** Every domain is discoverable, while capabilities clearly indicate support level.

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

**Cross-cutting requirement:** ecosystem capability directory MUST say whether an integration is `CONFIRMED_TESTED`, `OFFICIALLY_DOCUMENTED`, `THIRD_PARTY_CLAIM`, `UNVERIFIED`, `UNSUPPORTED`, or `DEPRECATED`, with scope for each network and software version.

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

**Packaging rule:** code and documents MUST use one canonical skill copy per name. Maintain a tested compatibility matrix rather than forking per agent. Agent-specific installation notes are adapters, not forks of skill content.

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

### 9.2 Data entities

**`Source`**: stable ID, title, canonical URL, owner, class/tier, reviewed timestamp, published/updated timestamp if known, fetch method, content fingerprint, license, scope, maintainer.

**`Claim`**: ID, subject, property, expected value, chain/network, context, evidence source IDs, reviewer, last_checked_at, `claim_status`, risk level, runtime validator ID, expiry policy.

**`ToolCapability`**: provider/product, exact operation, `supported_networks`, transport/API, version constraints, integration recipe location, evidence test ID, status, tested_at, limitations, alternatives.

**`AddressRecord`**: address, chain_id, contract/product identifier, publisher, explorer, source proof, `eth_getCode` observation, ABI provenance, verification state, last_checked_at; no ungrounded canonical labels.

**`ValidationRun`**: test ID, tool version, network, RPC identity, timestamp, outcome, redacted stdout/stderr summary, artifact hashes, reviewer; should be reproducible.

### 9.3 State taxonomy

`VERIFIED_LIVE`: direct observation/test from expected chain, with referenced evidence.  
`DOCUMENTED`: source states a fact, not independently verified now.  
`CONFLICTED`: contradictory authoritative evidence; must not present as settled.  
`STALE`: exceeded freshness policy or known breaking dependency change.  
`UNKNOWN`: no adequate evidence to support an assertion.  
`UNSUPPORTED`: explicit credible evidence of unavailable feature; do not infer from silence.  
`DEPRECATED`: officially sunset/removed or replaced.

**No confidence laundering:** fetching a page or looking up a block number does not upgrade an integration to `VERIFIED_LIVE` without an operation-specific test.

### 9.4 Freshness policies (product targets)

| Data class | Review target | Runtime check required? |
|---|---|---|
| Chain ID / RPC endpoint / latest block | Every execution | Yes for write-bound flows |
| High-risk addresses / external protocol contract references | ≤7 days for actively used P0 paths | Yes, plus issuer/ABI provenance |
| SDK/CLI commands and versions | ≤14 days during hackathon | Run test when possible |
| Wallet, bridge, stable asset, QIE Pass, DEX compatibility | ≤14 days while actively used | End-to-end test before VERIFIED_LIVE |
| Static conceptual docs | ≤60 days or after chain upgrade | Re-review on change |
| Historical descriptions / context | ≤90 days | No, unless used for operations |

These are internal service goals, not proofs of ongoing monitoring. Scheduled CI may detect stale records, but human review controls publication.

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
**Acceptance:** install command succeeds in clean fixture; all P0 skill names discovered; malformed YAML, duplicate names and broken relative references fail CI; rollback procedure exists.  
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
**Acceptance:** 100% of published `CONFIRMED_TESTED` capabilities have test IDs and timestamps; unknown contract addresses are not rendered as trusted; each entry identifies a source and supported network or `UNKNOWN`.  
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

**Requirement.** Agent SHALL interpret RPC failures, receipt status, chain mismatch, nonce/gas issues, explorer disagreement and unsupported methods without invented success.  
**Acceptance:** ≥12 negative-path fixtures; no FAIL classified as PASS; inability to determine transaction outcome yields PENDING/UNKNOWN.  
**Evidence:** fixture suite, documented troubleshooting decision tree.

### FR-008 — Human-approved deployment workflow [P0]

**Requirement.** Official QIE Forge examples MUST keep broadcasting in user-controlled tools and require the developer to review/approve network, transaction type, signer, contract/call and anticipated maximum spend. The bundled QIE Forge helper scripts MUST remain read-only and MUST NOT collect raw keys. Agent instruction text alone cannot technically prevent a host agent from violating permissions; explicit human signing is an external release precondition.  
**Acceptance:** no unattended mainnet write in documented workflow; no secret in logs; wrong chain stops deployment; dry-run path available.  
**Evidence:** redacted manual walkthrough and security tests.

### FR-009 — Chain evidence helper [P0 support]

**Requirement.** Provide portable read-only verification examples/helpers for `eth_chainId`, `eth_getTransactionReceipt`, `eth_getCode` and optionally `eth_call`. Helpers output structured states and do not perform writes.  
**Acceptance:** fabricated tx hash cannot PASS; reverted transaction marked FAIL; missing bytecode marked FAIL/UNKNOWN per context; status is reproducible.  
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
**Acceptance:** source registry validation passes; simulated stale RPC address causes visible stale flag; PR template requires provenance and test results.  
**Evidence:** CI rule tests and review logs.

### FR-013 — Cross-agent compatibility [P0]

**Requirement.** One skill library SHALL be tested for Codex, Claude Code, Cursor and OpenCode. Skills MUST NOT require Claude-only hooks.  
**Acceptance:** all four installation/discovery checks succeed; at least two independently executed full workflow demos if available; runtime limitations recorded explicitly rather than hidden.  
**Evidence:** compatibility matrix with version and test date.

### FR-014 — Contributor workflow and feedback [P0]

**Requirement.** Provide an issue template for broken command, outdated source, incompatible tool, missing capability and security concern; feedback submission MUST be opt-in and redact secrets.  
**Acceptance:** a contributor can add a reference and see lint failure for missing provenance; no automatic collection of prompts or account details.  
**Evidence:** contributor guide and pull request template.

### FR-015 — Minimal adoption measurement [P0]

**Requirement.** Record opt-in developer usability outcomes rather than unconsented telemetry. Separate installs, activations, completed verified tasks and repeat usage.  
**Acceptance:** a publicly explainable pilot summary includes sample sizes, outcome definitions, and failed tests; wallet creation is not reported as productive developer adoption.  
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

**Requirement.** Automated source freshness checks SHOULD open issues/PR suggestions and alert maintainers, but MUST NOT silently rewrite critical network data or auto-merge.  
**Acceptance:** simulated external change generates a review-needed report; no unreviewed critical update lands in main.  
**Evidence:** workflow logs.

---

## 11. End-to-end user journeys and edge cases

### UJ-01 — First-time install and navigation

**Preconditions:** developer has a supported coding agent, Node/npm or equivalent installer access, and network access to GitHub. **Steps:** visit QIE Forge site → copy `npx skills add OWNER/qie-forge` → run installation → agent discovers `qie` → ask “How do I build on QIE?” → router returns relevant workflow and clearly states available/unknown capabilities. **Failure branches:** offline install, incompatible CLI, invalid frontmatter, conflicting prior skill name. **Done:** all required P0 skills discoverable and first developer task correctly routed.

### UJ-02 — Build an ERC-721 dApp from scratch

**Preconditions:** clean workspace, approved developer toolchain. **Steps:** task prompt → resolve network (testnet default for experiments) → create Solidity contract/test project → create TypeScript frontend → validate wallet/chain → run contract tests → deploy to testnet with developer-approved signing → smoke test mint → assemble evidence → prepare mainnet launch. **Failure branches:** missing faucet funds, signer not set, failed compilation, wrong chain, revert. **Done:** testnet app works and outputs reproducible evidence before mainnet approval.

### UJ-03 — Verify QIE Mainnet transaction and contract

**Preconditions:** tx hash, expected chain, optional contract address. **Steps:** use read-only RPC → obtain actual `eth_chainId` → retrieve receipt → classify pending/success/fail → retrieve deployed bytecode if applicable → correlate explorer link → state whether source verification is actually confirmed. **Failure branches:** node behind, 429, wrong chain, receipt absent, proxy contract mismatch, no bytecode. **Done:** machine-readable evidence + truthful human explanation.

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

---

## 13. Repository layout and ownership

```text
qie-forge/
├── skills/
│   ├── qie/SKILL.md
│   ├── qie-networks/{SKILL.md,references/,scripts/}
│   ├── qie-smart-contracts/{SKILL.md,references/,assets/}
│   ├── qie-frontend/{SKILL.md,references/}
│   ├── qie-wallets/{SKILL.md,references/}
│   ├── qie-transactions/{SKILL.md,references/}
│   ├── qie-deployment/{SKILL.md,references/}
│   ├── qie-ecosystem/{SKILL.md,references/}
│   └── qie-debug/{SKILL.md,references/}
├── knowledge/
│   ├── sources.yaml
│   ├── claims.yaml
│   ├── capabilities.yaml
│   ├── addresses.yaml
│   └── schema/
├── scripts/
│   ├── validate-skills.mjs
│   ├── validate-knowledge.mjs
│   ├── verify-network.mjs
│   └── verify-deployment.mjs
├── examples/
│   └── nft-reference/
│       ├── contracts/              # Foundry
│       └── web/                    # TypeScript frontend
├── tests/
│   ├── fixtures/
│   ├── skills/
│   ├── sources/
│   ├── rpc/
│   └── agent-compatibility/
├── apps/
│   └── docs/                      # Static portal
├── docs/
│   ├── PRD.md
│   ├── architecture.md
│   ├── source-map.md
│   ├── compatibility.md
│   ├── security.md
│   ├── contribution-guide.md
│   ├── roadmap.md
│   └── adr/
├── .github/
│   ├── workflows/
│   ├── ISSUE_TEMPLATE/
│   └── PULL_REQUEST_TEMPLATE.md
├── LICENSE
├── NOTICE.md
├── CONTRIBUTING.md
├── SECURITY.md
├── CHANGELOG.md
├── README.md
└── package.json
```

**Ownership model.** `knowledge/` owns canonical structured claims; `skills/` owns task instructions; `scripts/` owns reproducible validation; `examples/` owns demonstrable reference software; `apps/docs/` owns presentation and should not duplicate technical truth. Human maintainer approval is mandatory for network addresses, protocol integrations, signing flows and security-sensitive claims.

---

## 14. Data contracts and interface examples

### 14.1 Capability record (illustrative schema, not a verified QIE integration)

```yaml
id: cap-wallet-example-01
product: example-wallet-provider
operation: connect_external_evm_wallet
networks: [qie-mainnet]
status: UNVERIFIED
source_ids: []
integration_recipe: null
last_checked_at: null
validation_test_id: null
limitations:
  - No confirmed QIE-specific production test yet
```

**Rule:** a record with `status: VERIFIED_LIVE` MUST reference a reproducible validation test and valid checked timestamp. A missing URL or unknown contract address MUST not be filled from the model's intuition.

### 14.2 Claim record (documented network configuration)

```yaml
id: qie-evm-mainnet-chain-id
subject: qie-evm-mainnet
property: chain_id
value: 1990
source_ids: [S03]
status: DOCUMENTED
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

### 14.4 Deployment evidence output

```json
{
  "schemaVersion": "1.0",
  "network": "qie-mainnet",
  "chainIdCheck": "NOT_RUN",
  "transaction": {
    "hash": null,
    "receiptStatus": "NOT_RUN",
    "blockNumber": null
  },
  "contract": {
    "address": null,
    "runtimeCodeStatus": "NOT_RUN",
    "sourceVerificationStatus": "NOT_RUN"
  },
  "checks": [],
  "generatedAt": null
}
```

The sample intentionally contains no fake successful transaction or invented deployed address. Runtime outputs MAY contain verified public data but never private signing material.

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

The docs website MUST render source metadata and capability statuses from the canonical files. Factual content should be changed via reviewed PR, not a disconnected website CMS. Example screenshots should be labeled example unless independently verified. Logs may be linked as demonstration artifacts but never contain keys, internal env values or identifiable private information.

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

Security policy includes reporting email/channel TBD, triage within 72 hours as a project target, private disclosure option, and emergency quarantine of an affected skill or reference. A skill package can cause financial harm even without hosting a smart contract, so security reviews apply to instructions as well as executable code.

---

## 17. Quality attributes and SLO targets

| ID | Non-functional requirement | P0 target / method |
|---|---|---|
| NFR-01 | Portability | Single canonical skill set; four named agents install and discover |
| NFR-02 | Correctness | Zero known critical network/address hallucinations in published P0 recipes |
| NFR-03 | Truthfulness | No `UNKNOWN`/`PENDING` reported as verified success |
| NFR-04 | Safety | Zero known path to unattended mainnet financial write in official workflow |
| NFR-05 | Documentation usability | Install + first skill activation documented in ≤10 minutes for prepared machine (target) |
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
| NEG-10 | Unsupported provider claims EVM-general compatibility | Remain UNVERIFIED until QIE-specific test |
| NEG-11 | Invalid skill frontmatter or broken file link | CI fails |
| NEG-12 | Mainnet deploy with no explicit user approval | Block action |

### 18.4 Benchmark methodology

Run a baseline task without Forge and a comparable task with Forge for consenting developers; counterbalance order if feasible to reduce learning effects. Measure time to valid first action, number of wrong-chain/provider corrections, successful deploy/verification, assistance required, and whether the developer would reuse Forge. Do not report model-created tokens, repository stars or raw skill downloads as proof of application adoption.

---

## 19. Metrics and adoption strategy

### 19.1 North-star metric

**Verified QIE developer completions (VQDC):** unique, consenting external developers who complete a QIE development task with an independently verifiable result and provide sufficient non-sensitive evidence to reproduce assessment. One wallet address alone does not establish a unique developer.

### 19.2 Proposed hackathon targets (not yet achieved)

| Metric | Proposed target | Evidence |
|---|---|---|
| Developer discovery interviews | 5–8 | Consent-based summary |
| External independent testers | ≥5 | Redacted test records |
| Verified completed developer tasks | ≥3 | Reproducible reports + consent |
| Codex, Claude, Cursor, OpenCode installation tests | 4/4 | Compatibility matrix |
| Full app demo | 1 deployed to QIE Mainnet | Live frontend + contract + receipts |
| High-risk source claims missing provenance | 0 | Automated report |
| Known critical security violations in shipped workflows | 0 | Manual review + negative tests |
| Cross-agent routed-intent fixtures | ≥20 | Test matrix |

### 19.3 Ecosystem distribution

Open-source README, skills directory discovery, QIE builders/community channels, hackathon teams and targeted technical tutorials. Encourage actual QIE applications by publishing reproducible examples and contributor recipes. Organic reuse is prioritized over token rewards, quests or incentivized wallet creation.

### 19.4 Commercial model

Keep skills and base knowledge free/open-source at launch. Possible future offerings (verified CI integration, managed freshness monitoring, professional team support) are **hypotheses**, not PRD commitments. Do not add a billing backend during the hackathon merely to imply traction.

---

## 20. Engineering backlog and sprint deliverables

| Work ID | Priority | Deliverable | Depends on | Acceptance owner |
|---|---|---|---|---|
| QF-001 | P0 | Contest eligibility decision recorded | Organizer response | Product lead |
| QF-002 | P0 | User research and workflow baseline | Interview access | Product lead |
| QF-003 | P0 | Source map + canonical knowledge schemas | Docs and repos | Technical lead |
| QF-004 | P0 | Repository, CI, contribution/security files | QF-003 baseline | Platform engineer |
| QF-005 | P0 | Agent Skills router + metadata validation | QF-003 | Agent DX engineer |
| QF-006 | P0 | Networks, tx, contracts, deployment skills | QF-005 | Blockchain engineer |
| QF-007 | P0 | Frontend, wallets, debug skills | QF-005 | Full-stack engineer |
| QF-008 | P0 | Ecosystem capability directory | QF-003 | Research/engineer |
| QF-009 | P0 | Read-only chain verification helpers | QF-003 | Blockchain engineer |
| QF-010 | P0 | ERC-721 reference contract/tests | QF-006 | Blockchain engineer |
| QF-011 | P0 | Reference frontend + UX | QF-010 | Full-stack engineer |
| QF-012 | P0 | Testnet E2E proof, then mainnet approval/deploy | QF-009–011 | Maintainer |
| QF-013 | P0 | Docs site + source/status display | QF-005–008 | Full-stack engineer |
| QF-014 | P0 | Cross-agent test matrix and negative tests | QF-005–012 | QA/maintainer |
| QF-015 | P0 | Pilot, usability evidence, iteration | QF-013–014 | Product + testers |
| QF-016 | P0 | Hackathon submission package | QF-012–015 | Product lead |
| QF-017 | P1 | Native QIE deep references | Current docs/release proof | Blockchain engineer |
| QF-018 | P1 | First verified ecosystem product integration | Verified API/ABI/provider | Integration engineer |
| QF-019 | P1 | Freshness issue-bot / docs update alerts | QF-003 | Platform engineer |
| QF-020 | P2 | Advanced indexing/DeFi recipes and expanded language support | External demand | Maintainer |

**Dependency critical path:** eligibility/source registry → router/core skills → reference dApp/tests → chain verification/mainnet demo → cross-agent and external pilot → submission. If eligibility remains unanswered near the end of Sprint 0, explicitly document risk and avoid committing to unverifiable compliance claims.

---

## 21. Delivery timeline and release gates

| Sprint | Dates (2026) | Outcome | Exit gate |
|---|---|---|---|
| S0 — Evidence and scope | Oct 19–25 | Eligibility request, user interviews, source inventory, repo, architecture decisions | G0: risks documented and workstream approved |
| S1 — Knowledge foundation | Oct 26–Nov 1 | Provenance schemas, router, networks, ecosystem directory, skill CI | G1: valid install and zero missing P0 source IDs |
| S2 — Core development | Nov 2–8 | Contracts, wallet/frontend, transaction/debug/deployment skills and reference contracts | G2: local build and unit tests green |
| S3 — QIE verification | Nov 9–15 | Testnet E2E, read-only verification helpers, public docs beta | G3: evidence verified, no fake success paths |
| S4 — Universal compatibility | Nov 16–22 | Four-agent installation tests, external developer pilots, bug fixes | G4: documented compatibility and pilot outcomes |
| S5 — Submission hardening | Nov 23–27 | Public mainnet reference app, security review, release notes, video/demo | G5: reproducible mainnet workflow and submission complete |
| Buffer & submit | Nov 28–30 | Repair critical issues, freeze content, submit before deadline | G6: organizer checklist confirmed and submission receipt retained |

### 21.1 Gate definitions

**G0:** Product owner approved v2 scope; sponsor eligibility question sent to Riad; source hierarchy documented.  
**G1:** Installer works, router passes high-risk intent tests, claimed data backed by sources.  
**G2:** Smart-contract and frontend build reproducible locally; security guardrails reviewed.  
**G3:** Testnet chain evidence demonstrably matches claimed contract behavior.  
**G4:** Agent compatibility and external usability evidence exists with failures reported.  
**G5:** Public mainnet app and chain evidence exist; no known critical issues; release artifacts published.  
**G6:** Official submission meets actual form and deadline, not merely assumptions in this PRD.

---

## 22. Definition of Done (release and hackathon)

QIE Forge v2.0 hackathon release is **DONE** only if all below are true:

1. P0 skills are independently authored, validate and install from a public repository.
2. All four target coding agents have documented install/discovery results; limitations are explicit.
3. The router handles QIE EVM vs native and high-risk network intents correctly.
4. Every critical network/tool/address claim has provenance and status; unknowns remain explicitly unknown.
5. A developer can create, compile and test the reference Solidity project from clean setup.
6. A public reference application is deployed on QIE Mainnet, and its actual contract, transaction and UI are independently checkable.
7. Verification helpers never infer success from absent or contradictory blockchain evidence.
8. No official workflow requires giving private keys or seed phrases to a coding agent.
9. Website is live, discoverable, accessible, and linked to source/install/docs.
10. CI checks skill metadata, schemas, references, tests and secret patterns.
11. External tester evidence and real limitations are disclosed honestly.
12. The project has written contest eligibility guidance or a documented outstanding decision, and the team satisfies actual submission requirements before submitting.
13. User-facing claims do not state that all QIE ecosystem integrations are production-ready when untested.
14. Attribution/licensing is appropriate and hackathon originality rules have been reviewed.

**A–Z vision is not synonymous with P0 deep implementation of every domain.** A topic is honestly complete only once verified references and runnable recipes support its described capabilities. An informational index plus “unknown” status is preferable to a false promise.

---

## 23. Risk register and response plans

| Risk ID | Severity | Trigger | Response |
|---|---|---|---|
| R-01 | Critical | Organizer rejects skills-led submission or reference contract | Seek official approved criteria; reconsider submission packaging, not a cosmetic registry |
| R-02 | High | QIE docs conflict with live chain | Block write action; publish warning; escalate source issue |
| R-03 | High | Third-party wallet/SDK has no QIE support | Mark UNVERIFIED/UNSUPPORTED; substitute verified generic EVM option if valid |
| R-04 | High | Skill frontmatter breaks installer | Gate all frontmatter and installation via CI |
| R-05 | High | AI action leaks secret or writes without approval | Block, revoke compromised credential, security disclosure, remediation |
| R-06 | High | Agent behavior differs by host | Minimal portable contract and per-host compatibility notes |
| R-07 | Medium | A–Z scope expands beyond deadline | Maintain discoverable index; deepen only validated critical paths |
| R-08 | Medium | Documentation copied, not original | Original implementation, clear source link, licenses, human review |
| R-09 | High | Reference app only works on testnet | Early testnet gates, then controlled mainnet demonstration with buffer |
| R-10 | Medium | No real testers found | Recruit builders via QIE community early, report actual sample honestly |
| R-11 | Medium | RPC outage or stale explorer | Multi-endpoint preflight with identity verification; explicit no-result status |
| R-12 | Medium | Provider version drift | Pin/test versions, show expiry, do not auto-promote tested status |

---

## 24. Immediate decisions and first 72 hours

**Day 1:** (a) Confirm project owner/repo, (b) send Riad the precise eligibility question and retain the reply, (c) create the independent repository, (d) lock five core P0 agent tasks and toolchain versions, (e) publish ADRs for no Build Registry/no custom MCP.

**Day 2:** (a) Map official QIE docs and ecosystem repos to D01–D15; (b) create claim/capability/address schemas; (c) implement source status validator; (d) author `qie/SKILL.md` and `qie-networks/SKILL.md`; (e) test network read commands against each documented RPC where possible.

**Day 3:** (a) implement routing fixtures and install tests; (b) start Foundry reference fixture; (c) write contribution guide and safety rules; (d) recruit first developer interviews; (e) publish early compatibility status as NOT_RUN until tested.

**Decisions requiring sign-off:** repo owner; canonical license; explicit mainnet gas budget; reference app choice; if and when native QIE deep skills ship; which ecosystem products qualify for verified integration; whether multi-language skills are worthwhile before the deadline.

---

## 25. Traceability matrix

| User outcome | Core requirements | Tests | Release gate |
|---|---|---|---|
| Install once across agents | FR-001, FR-013 | T1, T6 | G1, G4 |
| Find the right QIE tool | FR-002, FR-004, FR-016 | T2, routing fixtures | G1 |
| Trust network/addresses | FR-003, FR-012 | T2, T4, T7 | G1, G3 |
| Build a real dApp | FR-005, FR-006, FR-010 | T3, T5 | G2, G5 |
| Troubleshoot safely | FR-007, FR-008, FR-009 | T4, T7 | G3 |
| Maintain source truth | FR-004, FR-012, FR-014, FR-018 | T1, T2 | G1, ongoing |
| Discover product and contribute | FR-011, FR-014, FR-015 | Web QA, pilot | G4, G5 |
| Win eligibility and produce real evidence | FR-010, FR-015 | Submission checklist | G6 |

---

## Appendix A. Product-specific network baseline

**Documented only (check live identity before operational use):**

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

