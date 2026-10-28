---
name: qie-deployment
license: MIT
description: Prepare a QIE EVM testnet or mainnet contract release with local artifacts, network preflight, explicit capability blockers, signing review and scoped post-submission observations. Use for deployment readiness and production checklists. No tested QIE broadcast, signer or explorer-verification integration is supplied.
compatibility: Local build preparation uses Forge 1.8.1 and solc 0.8.37; read-only checks require Node 24.20.0. QIE EVM-target support, wallet signing, fees and operational finality remain unverified.
---

# QIE deployment preparation

Own the release checklist and artifact handoff, not contract design or wallet custody. Preserve an explicit Mainnet target; testnet qualification does not silently replace it.

1. Read [selected evidence](references/evidence.md) and [release metadata](references/release-info.md). Native deployment/delegation does not use this EVM path.
2. Follow [deployment preparation](recipes/deployment/recipe.md). For a new local tooling fixture use [build/test](recipes/build-test/recipe.md); for an existing app use its reviewed build and tests.
3. Run the selected-network [preflight recipe](recipes/network/recipe.md). Passing identity/responsiveness does not verify compiler target, fee policy, signer or deployment capability.
4. Create a concrete unsigned review record with artifact digest, constructor/configuration, selected chain, expected action, signer, maximum spend and compatibility evidence. Unknown values are explicit blockers. Never turn a placeholder into a deployment command.
5. For ArchademyVault/QUSDC or Lending integrations, attach the address-candidate review, ABI provenance, token-unit assumptions, allowance/role changes and application-effect checks. A local mock or SDK method does not satisfy the production identity gate.
6. Stop before signing/broadcast while the relevant capability remains UNKNOWN. No deploy command, gas constant, factory address, explorer API or signer provider is invented here. A dry preparation is useful even when live rollout is blocked.
7. If the developer supplies an independently approved and externally submitted transaction, follow the recipe's read-only observation procedure. A receipt, code existence or explorer page is not source verification, application proof or finality.

Failure recovery: wrong chain stops immediately; missing funds/fees/signer must be resolved outside this skill; never request keys or automatically resubmit. Reverted or pending transactions are diagnosed before any new action. Missing identity/effect/finality evidence blocks a full success label. Return actual local results, preparation artifacts and explicit release blockers.

<!-- GENERATED — DO NOT EDIT. Change canonical authoring or knowledge. -->
