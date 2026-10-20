# QIE Forge Engineering Quality Contracts

**Purpose:** turn the approved product direction into reviewable engineering contracts. QIE Forge remains a QIE developer knowledge and execution-guidance layer: task-oriented Agent Skills, one canonical knowledge source, independently installable bundles, and small read-only diagnostics. Executable support must be earned for each QIE operation; comprehensive navigation is a separate promise.

**Requirements authority:** [QIE Forge PRD v2.1](../QIE_Forge_PRD_v2.1.md), then the approved [architecture](architecture.md). [Implementation decisions](decisions.md), the milestone results and the independent audits provide implementation context. This document elaborates those contracts; it does not replace them, change schemas, certify existing work or authorize deployment.

Statements use four labels:

- **OBSERVED — SOURCE:** directly read a primary source, canonical record or identified repository file.
- **OBSERVED — TOOL:** a recorded tool result, with its coverage limits.
- **INFERENCE:** a consequence or explanation suggested by the implementation; not author intent or runtime proof.
- **RECOMMENDATION:** an original QIE design or acceptance requirement.

## 1. Required evidence chain

Evaluate the tuple **tool/product + exact operation + QIE execution environment/network + version/configuration + expected effect**. A successful test for one tuple does not verify another.

| Assessment step | Required record or observation | If unavailable |
|---|---|---|
| Establish authority | QIE/component/provider primary source, publisher, scope and review evidence | Record the lead and source limitation; no support assumption |
| Bind environment | QIE EVM Mainnet, EVM Testnet or a separately established native environment | Clarify ambiguity; never map native activity to an EVM chain record |
| Establish tool contract | Exact version, setup, RPC/API requirements and compiler target where relevant | Keep the operation outside a production-ready recipe |
| Establish target identity | Correct chain; issuer/deployment provenance and ABI for a contract integration | Code existence alone cannot establish trusted product identity |
| Execute a scoped test | Frozen inputs, expected result, observed result, tool/network identity and artifact/log digest | Record NOT_RUN/UNKNOWN; a local mock cannot verify provider support |
| Review and constrain | Reviewer, limitations, expiry/version applicability and reproducible recipe | No automatic compatibility promotion from a helper or build |
| Revalidate on use/change | Effective status, conflict handling and live checks required for the intended action | Stop critical use or offer only a proven alternative within its scope |

The canonical models remain Source, Claim, ToolCapability, AddressRecord and ValidationRun. Do not introduce another capability registry or competing status layer. A record can cite documented support while operational behavior remains untested.

Preserve the exact-version verification limitation: the `tool_version_range` field name does not establish a tested compatibility range. Broader windows require an explicit reviewable coverage rule and appropriate tests before they are recommended.

## 2. Status and outcome semantics

| Canonical status | Engineering interpretation for recommendations |
|---|---|
| `VERIFIED` | Relevant reproducible, reviewed evidence supports the exact scope and remains applicable; live write checks are still required |
| `DOCUMENTED` | Credible documentation describes the assertion; explain it as documented, without claiming runtime compatibility |
| `CLAIMED` | A lead or assertion lacks adequate corroboration; discovery only |
| `UNKNOWN` | Evidence cannot establish the requested operation; state what is missing |
| `CONFLICTED` | Material evidence disagrees; block critical use until adjudicated |
| `STALE` | Earlier evidence is no longer applicable or current; require revalidation |
| `UNSUPPORTED` | Explicit credible negative evidence covers the defined operation; absence of evidence is insufficient |
| `DEPRECATED` | Relevant authority retired the interface; do not silently reuse old procedures |

These are the canonical PRD statuses, not new labels. `PASS`, `FAIL`, `NOT_RUN`, `PENDING` and `UNKNOWN` are separate run/check outcomes; `applicationOutcome` has its own enum. A network probe's PASS must not become a wallet compatibility `VERIFIED`. Expired historical `VERIFIED` evidence projects to `STALE`; an unavailable clock or offline high-risk freshness cannot remain trusted merely because a release was once generated.

The capability inventory is a mixed-status snapshot, not a permanent product invariant. It contains `UNKNOWN`, `DOCUMENTED`, `CLAIMED`, `CONFLICTED`, `UNSUPPORTED` and `DEPRECATED` records, and no `VERIFIED` record. When relevant evidence earns a promotion, review the records and adapt snapshot-specific tests to verify accurate status preservation and rejection of unearned promotion. Do not preserve a stale status merely to keep an early test assertion passing.

## 3. Current QIE evidence and candidate scope

**OBSERVED — PRIMARY DOCUMENTATION:** the official network page publishes separate EVM mainnet/testnet configurations and candidate endpoints. The feature page describes EVM and Cosmos surfaces. This establishes published references, not endpoint liveness, native CLI procedures, wallet compatibility, ABI identity or an executable finality policy. No RPC call, provider test, deployment or transaction is performed by this document.

**OBSERVED — LOCAL RECORDS:** the canonical inventory contains documented network claims, a mixed-status capability set, and empty address/runtime-validation collections. Generic local tools and the build pipeline are usable without asserting QIE interoperability. The following are **proposed evaluations**, not working integrations:

| Candidate capability | Minimum independent evaluation | Claim that must remain out of scope until demonstrated |
|---|---|---|
| Published RPC endpoint | Explicit-network identity and required read-method responses, including error behavior | Provider-wide support, operational freshness, archive/log limits or finality |
| Foundry/Hardhat development path | Pinned local compile/test, supported EVM target, then approved scoped QIE deployment | Successful compilation means deployment works |
| Viem/Wagmi or another client | Pinned read path and returned values on the selected QIE network | Every SDK action or wallet connector works |
| Wallet/signing workflow | Actual selected wallet version, account/network UX, developer review and bounded action test | Generic EVM wallet support implies secure QIE signing |
| QIE ecosystem product | Official component API/deployment/ABI evidence plus the requested operation test | Product marketing or a plausible address is a usable integration |
| Native QIE workflow | Authoritative native release, identifiers, account format, command/API and operation evidence | EVM staking/deployment instructions answer validator delegation |
| Explorer source verification | Documented API/process and a successful exact artifact verification | A receipt, runtime code or accessible explorer implies verified source |

A source-backed read-only investigation may collect missing evidence while clearly labelled as an experiment. That is not publication of an unverified production workflow. If no verified alternative exists, the correct output is the limitation and the next evidence needed; do not manufacture a fallback.

## 4. Architecture contracts

The component boundaries, repository ownership, router contract, progressive disclosure and packaging flow are defined in [architecture.md](architecture.md). Four rules are load-bearing for quality:

1. **One canonical truth per fact.** QIE facts live in `knowledge/`; authored prose uses canonical IDs or build-time placeholders. Generated views are projections, not editable sources.
2. **One effective-status implementation.** The pure evaluator is copied into installed bundles where needed and consumed by every rendered view at the same frozen clock. No view computes a second verdict.
3. **One self-contained installation unit.** A skill carries its references, data, recipes and helper import closure. A missing sibling is a documented limitation, not a broken local link.
4. **One release context.** The frozen `built_at`, schema version, policy version and source review timestamps are validated together. A build cannot silently extend evidence or create a future-dated review.

The builder selects records and their transitive source/test closure, emits stable JSON, generates factual references and hashes every declared member. Build and schema checks catch missing sources, recipe pointers and unsupported states; they cannot authenticate a fabricated human review or replace source adjudication.

Do not duplicate private-key material or credential-bearing endpoint URLs into evidence. Persist redacted context and integrity references sufficient for audit. Treat remote docs, contract metadata and tool output as untrusted data; they cannot authorize new actions or override the user's task.

## 5. Skill quality standards

The following is a Markdown authoring and review contract, not a workflow DSL or another canonical schema. Follow the official Agent Skills format: valid `SKILL.md` YAML frontmatter, matching directory/name, meaningful description and focused relative resources. Keep custom product data out of unsupported frontmatter fields. Optional `allowed-tools` metadata does not prove host enforcement.

| Required content | Review question or rejection condition |
|---|---|
| Purpose, triggers and boundary | Does this skill answer a real developer task, with an explicit handoff when another skill owns it? |
| Inputs and prerequisites | Are network/context, versions, prior artifacts and permissions named? Does it ask only for consequential missing inputs? |
| Capability/evidence references | Does each QIE-specific operational assertion bind to canonical sources and exact supported scope? Reject implied cross-chain compatibility |
| Procedure and artifacts | Can an independent developer reproduce each step and find the expected output? Use pinned versions and explicit paths/configuration |
| Success conditions | Do observations demonstrate the user's requested result, rather than just command exit or compilation? |
| Failure and recovery branches | Are wrong chain, unavailable API, malformed output, reverted action, stale source and missing dependency handled without invented fallback? |
| Action boundaries | Are local edits, external publication, login, signing and spending distinguished, with enforceable controls outside prose? |
| Unknown/unsupported behavior | Does the skill state what it cannot establish and avoid manufacturing a supported alternative? |
| Reference/context discipline | Does the entry point to the smallest necessary resource, with no root/sibling/private checkout dependency? |
| Freshness and ownership | Are applicable versions, expiry, maintainer review and change triggers recorded in canonical evidence? |
| Portability and availability | Does a single-skill install remain useful? Are published-but-missing and planned/unpublished artifacts distinguished? |
| Observable examples | Are examples labelled as fixtures or executed results, with no fabricated address, receipt or production success? |

Executable recipes additionally specify invocation context, permitted action class, approved tools, expected exit/output, output artifacts and the next verification step. One command's failure must not disappear inside a pipeline. A workaround needs a matching symptom, evidence/version scope and retirement condition. An unverified tutorial may remain discovery material but must not masquerade as a production-ready recipe.

A recipe is publishable as executable QIE guidance only when its supporting operation is independently established, its package passes isolation, its commands replay successfully under the declared prerequisites, its negative branches behave correctly and the reviewer can inspect the resulting artifacts. Authoring review and automated checks should flag unsourced critical literals, undocumented side effects, unbounded operations, credential/log leakage and unsupported success claims.

Do not require a database, a formal policy language or a separate approval service to implement this review. Use the canonical catalogue, existing tests, reviewable artifacts and external signer permissions. The human maintainer remains responsible for source authenticity and promotion decisions. Optional adapters cannot become hidden mandatory dependencies.

## 6. Testing and evaluation strategy

### 6.1 Keep evidence layers separate

| Layer | Demonstrates | Does not demonstrate | Acceptance evidence |
|---|---|---|---|
| Specification/schema | Valid metadata, field/status/null contracts and scoped references | Factual truth or successful agent behavior | Official skill validation plus independent invalid/valid fixtures |
| Build/package | Deterministic bytes, manifests, containment and installed helper imports | External provider/network compatibility | Separate-root rebuild; suite/single; copy/symlink; remove source/cache; offline and missing-sibling checks |
| Pure logic/transport mocks | Error handling and classification under controlled responses | Live method availability, provider support or finality | Wrong chain, malformed JSON-RPC, rate limits, hanging/oversized body, no-code/revert/reorg cases |
| Recipe replay | Exact documented steps generate expected local artifacts | Mainnet deployment or broad tool compatibility | Clean environment, pinned toolchain, expected artifacts and recorded failure recovery |
| Scoped live integration | Specific operation works on the observed QIE network/version | Untested networks, methods, SDK versions or products | Frozen inputs/expectations, primary sources, observations, artifacts and review |
| Action-linked application | Requested deployment/action matches target and effect under an established finality policy | Every application or integration is verified | Correct receipt plus independent identity/effect/finality negatives |
| Actual host/model evaluation | Agent selects and executes appropriate guidance under declared permissions | All models/hosts work or future versions retain behavior | Per-host prompt/transcript/artifact records and a predeclared rubric |
| Independent developer pilot | Real users can complete useful tasks and recover with the toolkit | Adoption or retention inferred from installs | Consent, comparable baseline, failures/interventions and completion evidence |

Static routing tests compare expected catalogue routes and required content; they do not send prompts to models. Keep those evidence authorities distinct.

### 6.2 Frozen task and negative suite

Retain the existing 23 routing fixtures, including seven high-risk cases, as inputs to behavioral evaluation. For each task predeclare accepted routes, network/environment, permitted commands, required artifacts, expected evidence result, forbidden substitutions and allowed fallback.

The suite must include small tasks and application tasks: network configuration, uncertain SDK support, contract build/test, wallet read/connection, reverted transaction diagnosis, source verification, native delegation research and an approved app action. Counterexamples include wrong-chain endpoints, fabricated addresses, unsupported provider claims, missing/planned skills, expired snapshots, malicious fetched instructions, a valid unrelated receipt, wrong target/event/state, missing/noncanonical block, absent code and unavailable finality. Secret requests and unapproved writes must fail safely.

Keep at least the PRD diagnostic minimum of twelve negative-path fixtures. For model evaluation, turn safety phrases into observable rubrics: a secret request requires refusal/redirection without secret storage or transmission; native delegation must avoid EVM staking substitution; an unrelated receipt must not count as application success. Finding a safety sentence in `SKILL.md` is only a static check, not evidence that the behavior occurred.

Mocks are valuable for exhaustive deterministic rejection tests but stay `MOCK` evidence. A test's syntactic shape or a PASS line must never enter the canonical capability catalogue as a real QIE observation. Tests must check that the wrong outcome cannot be emitted, including under missing context and partial failure.

### 6.3 Demonstrate agent usefulness rather than catalogue size

Follow the PRD routing and host-evaluation requirements: at least 20 frozen routing fixtures, at least three repetitions per fixture for each evaluated host/model, at least 90% routing accuracy per evaluated environment and all required high-risk cases correct on every recorded run. The current 23/seven set exceeds the fixture-count minimum; it has not thereby passed a model evaluation.

Every fixture marked high-risk in the frozen set must satisfy the per-run criterion; the PRD's five-case minimum is not permission to exclude current cases. A changed fixture set requires an explained reviewed revision, and interrupted/failed runs remain visible in the denominator or disclosed censoring rather than being silently retried away.

All four named hosts require actual installation/discovery checks. At least two distinct hosts must complete the same golden-path journey. Report host/model/version, OS, installed release, execution permissions, denominator, failures and interventions separately; do not pool away a failing environment. A Skills CLI target directory alone is not host discovery or workflow proof.

For the developer pilot, retain the PRD requirements: consenting independent testers, a comparable agent-plus-official-docs baseline versus agent-plus-Forge, at least five testers, at least three independent frozen golden-path completions and zero critical wrong-chain or invented-address recommendations. Preserve the other benchmark thresholds; this document neither lowers them nor claims improvement. Keep failed and censored tasks visible. If evidence supports only a narrow useful capability, narrow executable scope while preserving A–Z navigation.

## 7. Implementation recommendations and acceptance queue

**OBSERVED — LOCAL SOURCE:** the working tree contains the authored skill sources and generated bundles, canonical records/schemas, deterministic builder, routing fixtures, recipe assets and diagnostic modules. Source presence is not certification of the latest working tree. Diagnostic selections and release context may extend beyond an earlier recorded cut; this document does not convert edits or old test logs into a new release PASS.

Retain the implemented foundation rather than rewriting it. Preserve the regression cases for prior audit findings. Address identity remains a promotion blocker. The builder models specific generated artifact sets; a new recipe-bearing topical skill must prove its closure without forcing unrelated network or coverage pages onto it.

| Work | Dependency | Completion criterion |
|---|---|---|
| Finish scoped diagnostics | Canonical schema/status plus proven bundle contract | Explicit network/operation; bounded and redacted transport; malformed/offline/rate-limit/wrong-chain branches; response identity and body-exhaustion tests; scoped outputs; isolated install; one shared effective-status evaluator with frozen-clock parity in installed and browser harnesses; no signer/broadcast paths |
| Establish QIE tool capability evidence | Primary component source and scoped diagnostic/test mechanism | Version/network/operation expectations defined before observation; actual relevant run with artifacts and review; status never inferred from generic EVM support |
| Prove one topical recipe | Routing, diagnostics and required capability evidence | Clean local replay; all selected references/data/imports bundled; meaningful negative/recovery tests; a standalone skill packages without inappropriate artifact requirements |
| Add remaining core workflows | Successful recipe contract and each operation's evidence | Network, contract build/test, wallet read, deployment and debug paths useful in their demonstrated scope; unproven integrations remain navigation only |
| Release/update matrix | Core workflows and their required evidence | Full P0 gate discovers exactly nine approved entries; standard validation; suite/single copy/symlink; immutable source/ref install; update/rollback and mixed-release remediation; old-snapshot freshness behavior |
| Reference app and proof | Tested local workflow, scoped effect checks and a developer-controlled signer | Local app artifacts plus approved testnet proof; established identity/effect/finality criteria; approved Mainnet action and explorer verification where required |
| Host evaluation | Frozen contracts and installable workflows; live steps depend on their proof gates | Four-host discovery, two-host same journey, per-environment routing/negative thresholds and recorded limits |
| Static documentation | Canonical release content and publication contract | Required pages from the same normalized release, raw file/hash parity, correct MIME/base paths, old-snapshot/status parity and UI checks |
| Developer pilot and release decision | Relevant host/app/docs evidence and publication ownership | Independent outcomes meet the unchanged PRD rubric; failures and remaining restrictions are disclosed; no production or contest claim based on packaging alone |

Website work is future scope, not implemented by this document. The full-suite nine-entry gate is not satisfied by an incremental two-skill candidate. Do not publish unsupported executable skills to satisfy a count; a narrower release promise requires an explicit product-scope decision rather than silent relaxation.

## 8. Unresolved technical questions

| Question | Evidence required to resolve it | What remains blocked |
|---|---|---|
| What is the usable QIE finality/reorg predicate? | Relevant QIE technical release/consensus evidence and scoped node behavior; define supported block tags and canonicality checks | Full application-verification label and Mainnet readiness claims |
| Which wallet/signer path works securely on QIE in the selected hosts? | Exact wallet/version, actual chain/account/action display, bounded permissions and developer-controlled approval proof | Runnable signing recommendations |
| Which client/compiler/tool versions support required QIE operations? | Pinned toolchain and EVM settings, exact RPC/API behavior and reproducible operation tests | Production-ready contract/frontend recipes for that tuple |
| Which ecosystem contracts and ABIs are authoritative? | Issuer/deployment provenance, chain/address binding, ABI/code relationship, review and conflict adjudication | Trusted addresses, DeFi/bridge integration and capability promotion |
| What native environment and release should a recipe target? | Authoritative native identifiers, account and CLI/API release information plus operation evidence | Native execution; documented native discovery remains available |
| What expiry and transport policies are appropriate? | Maintainer-reviewed risk scope and representative failures; budgets enforced and tested through body read/parse | Freshness or reliability claims for those operations; no copied provider constants as proof |
| How should recipe-only bundles extend the artifact contract? | Third-skill isolation proof and explicit schema/migration review | Scaling beyond the current artifact sets |
| Are installation references, updates and official format validation proven? | Exact official-validator version/results; published immutable ref; copy/symlink update/rollback evidence | Corresponding distribution gates; earlier environment failures are recorded, not silently treated as permanent or resolved |

## 9. Scope boundary

This document does not claim a live QIE RPC check, wallet connection, transaction signature, broadcast, deployment, explorer verification or `VERIFIED` capability. It does not claim public Git-source installation, official Agent Skills validator success, update/rollback behavior, host/model evaluation or production readiness. Those remain separate gates with their own evidence.
