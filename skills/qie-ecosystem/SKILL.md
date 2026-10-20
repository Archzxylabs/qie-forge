---
name: qie-ecosystem
description: QIE ecosystem intelligence, product catalogue, and evidence-based compatibility decision guide. Use when a developer asks which wallets, SDKs, development frameworks, DEXs, bridges, oracles, indexers, or tools work on QIE, or when evaluating whether a specific tool or operation is supported. Implements a 7-step decision procedure, provides grounded compatibility guidance, and enforces safety boundaries without guessing.
compatibility: Local references work offline without an account or network. This skill performs no on-chain transaction signing, broadcasting, or secret handling.
---

# QIE ecosystem intelligence & compatibility

This skill provides evidence-backed ecosystem intelligence and compatibility decision guidance for building on QIE. It helps coding agents and developers answer three core questions:

1. **What should I use on QIE?** (Catalogue of tools, libraries, products, and services).
2. **How should I use it?** (Correct configurations, prerequisites, and integration patterns).
3. **How do I know it actually works?** (Evidence-backed compatibility statuses, known limitations, and refusal rules).

This bundle works offline using its bundled [Ecosystem Catalogue](references/catalogue.md), [Compatibility Matrix](references/compatibility.md), and [Ecosystem Decision Guide](references/decision-guide.md).

## 7-step decision procedure

When evaluating any ecosystem tool, product, or integration for QIE, follow this procedure in order:

1. **Classify task and category**: Determine the product category (wallets, development frameworks, DEX/swaps, cross-chain bridges, oracles, indexers, native/Cosmos tooling).
2. **Identify tool and version**: Determine the exact tool identifier and requested version. If version is unspecified, treat as UNKNOWN.
3. **Identify specific operation**: Compatibility is operation-specific (e.g., EIP-1193 connect, chain switch, contract deploy, swap, delegate, log query). Do not evaluate blanket compatibility.
4. **Identify target network**: Determine whether the target is QIE Mainnet (Chain ID `1990`), QIE Testnet (Chain ID `1983`), or QIE Native Cosmos (`qie_1990-1`). Never substitute or blend networks.
5. **Check canonical status**: Look up the operation in the [Compatibility Matrix](references/compatibility.md) and [Ecosystem Catalogue](references/catalogue.md). The canonical statuses are:
   - `VERIFIED`: Proven by non-mock, reviewed execution evidence. (None in this release).
   - `DOCUMENTED`: Backed by official technical primary documentation.
   - `CLAIMED`: Stated by maintainers on websites or marketing pages without technical integration specs.
   - `UNKNOWN`: Unsubstantiated or untested.
   - `CONFLICTED`: Divergent technical evidence between sources.
   - `STALE`: Previously valid evidence past its expiration window.
   - `UNSUPPORTED`: Explicitly unsupported by the tool or protocol.
   - `DEPRECATED`: Superseded legacy standard or chain ID.
6. **Evaluate limitations and case rules**: Check the [Ecosystem Decision Guide](references/decision-guide.md) for applicable rules:
   - **Case A**: Wallet selection & EIP-6963 / EIP-1193 nuances.
   - **Case B**: DEX routing and strict contract address refusal.
   - **Case C**: Smart contract toolchains (Foundry, Hardhat, Remix).
   - **Case D**: Indexer coverage uncertainty & safe RPC log querying.
   - **Case E**: Native QIE Cosmos delegation vs EVM contract staking.
   - **Case F**: Network substitution refusal and legacy chain IDs.
   - **Case G**: Product discovery leads vs executable packages.
   - **Case H**: Evidence freshness, expiry, and effective status.
7. **Provide recommendation or safe handoff**: Recommend the best-supported approach, declare what is unverified, and hand off to the relevant topical skill when implementation begins.

## Core safety invariants

- **Documentation is not execution proof**: A product guide or GitHub repository does not prove that an API works on QIE.
- **Generic EVM is not QIE verified**: Do not assume an Ethereum library works out of the box on QIE without evidence.
- **Address identity blocker**: The canonical address inventory in this release is empty. Never hallucinate contract addresses, DEX routers, or token ABIs.
- **Zero signing & broadcasting**: This skill provides read-only guidance and diagnostics. It never requests private keys, signs transactions, or broadcasts state changes.
- **Freshness**: Check [Release information](references/release-info.md) for build timestamp and review dates.

## Logical handoffs

Handoff to dedicated topical skills for implementation workflows:
- `qie`: High-level intent classification and architecture routing.
- `qie-networks`: RPC endpoint configurations, network preflight, and chain ID verification.
- `qie-wallets`: Injected provider connection, read session management, and chain switching.
- `qie-smart-contracts`: Solidity compilation, local Foundry build/test recipes.
- `qie-frontend`: TypeScript dApp integration and read-only RPC calls.
- `qie-transactions`: Gas rules, transaction receipt inspection, and finality verification.
- `qie-deployment`: Staged contract deployment procedures.
- `qie-debug`: JSON-RPC error diagnostics and network troubleshooting.

<!-- GENERATED — DO NOT EDIT. Change canonical authoring or knowledge. -->
