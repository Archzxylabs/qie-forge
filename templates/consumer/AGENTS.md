<!-- qie-forge:bootstrap:start -->
# QIE Forge bootstrap rules

This repository uses the QIE Forge skill suite. These rules apply to every
coding agent, regardless of vendor, and to every task involving QIE, QIE EVM,
QIE Native, QUSDC, QIE Wallet, QIE RPC, smart contracts, deployment, or
blockchain integration.

## Mandatory skill route

1. Load the `qie` skill before any other QIE skill or QIE-specific action.
2. Use the router's classification and routing result before loading a topical
   skill. Do not choose a topical skill from memory.
3. Load only the topical skills named by the route. Do not preload the whole
   suite.
4. If the `qie` skill is missing, stop and report the installation gap. Do not
   reconstruct its routing procedure from memory.
5. If a routed skill is missing, report it as missing. Do not restate or invent
   its procedure.

The canonical skill directory is `.agents/skills/`. Agent-specific projections
may exist; the canonical copy is authoritative.

## Evidence discipline

- Never invent addresses, RPC endpoints, chain IDs, ABI support, wallet support,
  deployment evidence, transaction results, or application effects.
- Treat `UNKNOWN`, `CLAIMED`, `STALE`, `CONFLICTED`, and discovery-only data as
  non-executable.
- A contract address is executable only after the shared identity gate has an
  issuer, ABI provenance, and a matching verified status. A plausible-looking
  address is not evidence.
- Cite the source and trust tier for ecosystem claims. Documentation, product
  pages, and marketing material are discovery leads, not runtime proof.
- A local build, a passing test, a receipt, or deployed bytecode does not prove
  QIE deployment compatibility, wallet compatibility, finality, or application
  effects.

## Network and execution context

- QIE Mainnet and QIE Testnet are different networks. Never silently substitute
  one for the other and never carry an endpoint fallback across the boundary.
- If a state-changing task has an undetermined network, ask one targeted
  question before proceeding.
- Distinguish EVM work (`0x` accounts, Solidity, JSON-RPC) from native QIE work
  (validator, delegation, native CLI, Cosmos side). Do not merge them.
- Before any state-changing flow, require a fresh `eth_chainId` and
  responsive-block check on the selected endpoint. If a live check cannot run,
  report `NOT_RUN` or `UNKNOWN`; never report a successful preflight.

## Approval boundary

- Signing, broadcasting, deploying, and spending stay behind explicit developer
  approval and developer-controlled tooling.
- Never request, print, store, or transmit a private key, seed phrase, keystore
  password, or signature.
- Do not make a write flow executable when its address, ABI, network, fee, or
  signer is unverified.
- For local implementation, prefer the mock or offline recipe before any live
  integration.

## Required report

At the end of a QIE task, report:

1. The skills loaded, in order.
2. The route selected and the target network/context.
3. The evidence used and its status.
4. What remains unverified or blocked.
5. The next safe action.

Do not claim a live check, deployment, transaction, or wallet integration that
did not actually run. If this host cannot load the `qie` skill, say so instead
of improvising a route.
<!-- qie-forge:bootstrap:end -->
