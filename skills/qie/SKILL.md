---
name: qie
license: MIT
description: Entry router for QIE blockchain development tasks. Use when a developer asks how to build, integrate, debug, deploy or research anything on QIE, or when the correct QIE topical skill, target network (mainnet vs testnet), or EVM-versus-native workflow is unclear. Classifies intent, selects the minimal topical skills or bundled QIE A–Z coverage references, and flags missing skills instead of guessing.
compatibility: Local references require no account or network; routing works offline from this bundle. This skill performs no chain interaction, signing or broadcasting.
---

# QIE task router

This skill is the entry point for QIE developer tasks. It classifies the task, names the minimal set of topical skills or bundled references that fit, and states what is unknown. It ships no chain facts of its own: network configuration comes from the `qie-networks` skill, and ecosystem facts come from the canonical catalogue snapshot in this bundle.

## Routing procedure

1. Classify the task: concept or discovery, contract build/test, frontend/wallet, transactions, deployment, debugging, ecosystem/product, native QIE operation, or governance/contribution.
2. Classify the network: QIE Mainnet, QIE Testnet, or undetermined. Never default between them; if the task is state-changing and the network is undetermined, ask.
3. Classify the execution context: EVM (`0x` accounts, Solidity, JSON-RPC) or native QIE (validator, delegation, native CLI, Cosmos side). If it stays unclear after one targeted question, present both paths without merging them.
4. Read the generated [routing table](references/routing.md) and the [QIE A–Z coverage map](references/qie-a-z.md). Match the intent to its domain (D01–D15) and take the listed route. Check [release information](references/release-info.md) before presenting this snapshot as current.
5. Check which routed skills are actually installed. For a missing skill, read its catalogue state in the routing table and follow "Missing topical skills" below; never read a path that does not exist and never restate a missing skill's procedure from memory.
6. Classify the requested action as read-only or state-changing. State-changing guidance must name the approval boundary and must not proceed without explicit developer approval.

For ecosystem integrations, route protocol questions to `qie-ecosystem` before refusing an unresolved address. The required response is: known source-grounded facts, available SDK/ABI or read pattern, unverified deployment/runtime facts, a safe local/mock next action, exact deployment blockers and sources. An unknown address blocks a write, not a useful local implementation.

Report: selected skill names, domain IDs, target network (or the single question that resolves it), EVM/native context, genuinely missing inputs, evidence constraints from the coverage map, and the next safe action. Ask only for inputs that actually change the route; a concept question does not need a wallet or signer.

## Network discipline

- QIE Mainnet and QIE Testnet are different networks with different consequences. Never silently substitute one for the other, and never carry an endpoint fallback across the network boundary.
- Chain IDs, RPC endpoints, explorer URLs and the testnet faucet are published in the `qie-networks` skill. Cite them from that skill's references, not from memory.
- Before any state-changing flow, require a fresh `eth_chainId` and responsive-block check on the selected endpoint using the `qie-networks` preflight checklist and its read-only preflight helper. If a live check cannot run, report `NOT_RUN` or `UNKNOWN` — never a successful preflight.

## EVM versus native discipline

- Native QIE intents (validator operation, delegation to a validator, native accounts, Cosmos-side governance) route to the official D11/D15 sources listed in the coverage map. They must not be answered with EVM instructions.
- Never present an EVM staking contract as an answer to native delegation, or native delegation steps as an answer to a smart-contract staking question. If "stake QIE" is ambiguous, ask whether the developer means validator delegation or an EVM staking program.
- Native CLI commands, native chain identifiers and release provenance are UNKNOWN in this bundle. Say so and point to the official sources; do not invent commands or identifiers.

## Missing topical skills

The routing table labels every routed skill with its catalogue state. Two cases must be handled differently.

### Published skill missing locally

A skill labelled `published in this release` (for example `qie-networks` after a router-only install) is an installable release artifact that is simply absent from this installation:

1. State exactly which published skill is missing and that its procedure is not available locally.
2. Offer the install remediation: install it from the same QIE Forge source this skill was installed from, for example `skills add <qie-forge-source> --skill <skill-name>`, or `--skill '*'` for the full published suite, replacing `<qie-forge-source>` with that source.
3. Until then, continue with what this bundle does contain: the coverage map, the routing table and their official source URLs.

### Planned skill — not installable

A skill labelled `planned; not a published artifact` (for example `qie-native`, `qie-indexing`) or `catalogued; not published in this release` does NOT exist as an installable release:

1. State that the skill is planned or unpublished and therefore not installable; do not offer an install command for it and do not imply that a release artifact exists.
2. Continue with the coverage map, the routing table and their official source URLs.
3. Never fabricate the planned skill's commands, versions or expected outputs.

## Never assume

- An `UNKNOWN` or `CLAIMED` catalogue status is not compatibility. Do not claim a wallet, SDK, indexer, bridge or provider supports QIE without a catalogue status backed by evidence, and do not upgrade a status in your answer.
- Do not offer a planned or unpublished skill as an installable release artifact, and do not present a published-but-missing skill's procedure as if it were installed.
- No contract address is authoritative unless the catalogue snapshot in this bundle carries it with issuer and ABI provenance plus a matching status. Never generate a plausible-looking QIE contract address; this release may retain discovery-only candidates, but none is executable.
- Documentation, product names and marketing pages are discovery leads, not runtime proof. Cite the source URL and its trust tier from the coverage map.
- A receipt, deployed bytecode or a passing local build does not verify application effects or finality.
- Nothing in this skill signs, broadcasts, requests keys or authorizes spending. Signing and spending stay with developer-controlled tooling behind explicit approval.

## Failure branches and fallback

- Ambiguous intent: ask one targeted question that would change the route; otherwise proceed with the best-fitting route and state the assumption.
- Domain with `NAVIGATION` coverage: answer with sources and recorded gaps; do not improvise an executable workflow.
- Conflicting, stale or expired evidence: report the effective status and stop write-bound guidance until it is reviewed.
- Corrupt or missing bundle files: stop and reinstall a known release; do not fall back to repository-root paths or to memory.

<!-- GENERATED — DO NOT EDIT. Change canonical authoring or knowledge. -->
