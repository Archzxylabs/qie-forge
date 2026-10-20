---
name: qie-frontend
description: Integrate a TypeScript frontend with explicit QIE EVM network selection, wallet account and chain gating, ABI-bound reads and invalidation after provider changes. Use for an existing frontend or its read controller; does not scaffold a new dApp or claim untested Viem, Wagmi or wallet-provider compatibility.
compatibility: The framework-neutral TypeScript read controller is executed using Node 24.20.0 type stripping and mock EIP-1193 providers. Actual browser/wallet and QIE RPC support remain unverified.
---

# QIE frontend integration

Own the UI's network/account/read state; preserve the existing application framework. Use logical skill `qie-wallets` for provider selection and signing UX, and `qie-smart-contracts` for source/ABI generation when present. Their private files are not dependencies.

1. Read [selected evidence](references/evidence.md) and [release information](references/release-info.md). Select the intended Mainnet/Testnet profile from packaged data; native account operations do not use this EVM procedure.
2. Inspect the app's dependencies and existing provider. A Viem/Wagmi/Ethers brand or an EVM chain object does not prove QIE support. Require exact version, operation, network and evidence; otherwise keep work local and label compatibility UNKNOWN.
3. Follow [wallet read and UI state](recipes/wallet-read/recipe.md). Bind reads to an explicitly supplied contract, reviewed ABI and derived calldata. No address is provided by this skill.
4. Disable actions while disconnected, wrong-chain, changing accounts, fetching or after an error. Invalidate old reads on provider events; display the chosen network and current account. Do not put credentials in client configuration.
5. After an externally approved action, obtain its scoped receipt/identity evidence and explicitly refresh relevant state. A refresh is an observation, not proof that an unrelated transaction caused the change or that finality passed.

Deliver the changed integration, local/mock test results and the remaining actual-browser/provider checks. The recipe's mock harness is not a demonstrated wallet UI or live QIE compatibility result.

## Recovery

Wallet rejected connection: leave the UI disconnected and allow a deliberate retry. Wrong chain: clear reads, ask the developer to select the intended network in their wallet, then recheck; never silently switch networks. Missing ABI, unknown address provenance or stale/conflicting evidence: stop that read/write integration rather than fabricate a target. Unsupported methods require independently evaluated alternatives, not guessed provider fallbacks.

<!-- GENERATED — DO NOT EDIT. Change canonical authoring or knowledge. -->
