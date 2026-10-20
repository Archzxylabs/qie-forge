---
name: qie-smart-contracts
description: Build and test original Solidity contracts locally for a QIE EVM project using the pinned Foundry recipe. Use for contract scaffolding, compiler configuration, ABI artifacts, tests and local failures. Local execution does not establish QIE deployment compatibility; native validator operations use a different account and execution model.
compatibility: Local recipe tested with Forge 1.8.1, solc 0.8.37 and Node 24.20.0. Requires those existing tools; no dependency download or chain access is required for the bundled fixture.
---

# QIE contract development

Own contract source, compiler settings, tests and ABI artifacts. Preserve the developer's application intent; the tiny counter fixture demonstrates tooling and is not a required product template or a security-audited contract.

1. Identify EVM versus native intent. Validator delegation, native accounts and governance do not become Solidity instructions. State the intended QIE Mainnet/Testnet target if supplied; local compilation does not need a wallet or a live network.
2. Read [selected evidence](references/evidence.md) and [release information](references/release-info.md). Discover tools by exact operation/network/version, not an EVM compatibility assumption. Foundry deployment remains UNKNOWN; Hardhat is an unvalidated alternative, not a second tested path.
3. For a new local project, follow [build and test](recipes/build-test/recipe.md). For an existing project, inspect its configuration and lockfiles first; do not overwrite it with the fixture. Review compiler and dependency changes explicitly.
4. Produce source, tests, compiler configuration, ABI/bytecode and actual command outcomes. Distinguish compilation, tests, deployment preparation, chain inclusion, application effects and finality.
5. Hand deployment preparation to logical skill `qie-deployment` if installed; otherwise provide the same-source installation remedy and keep local results usable. Never read a sibling skill path.

## Failure handling

- Missing/mismatching tools: report DEPENDENCY_MISMATCH, show the required versions and stop replay. Do not silently upgrade the machine or substitute a compiler.
- Compiler/test failure: isolate the first error; use test traces and ABI/source evidence. Change one cause and rerun the affected tests before the full local suite.
- Unknown library/contract: obtain primary release/license/ABI provenance; do not import a plausible address or claim QIE compatibility.
- Stale/conflicting evidence: retain local build work, block dependent operational claims pending review.

Never assume a passing local build validates QIE opcodes, gas, explorer verification, deployment, wallet support or a production security review. Keys and signing remain developer controlled.

<!-- GENERATED — DO NOT EDIT. Change canonical authoring or knowledge. -->
