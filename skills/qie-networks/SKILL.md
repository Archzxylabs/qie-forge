---
name: qie-networks
description: Find published QIE EVM mainnet and testnet settings, distinguish documented configuration from live network evidence, inspect packaged network references offline, and run an optional read-only live preflight against the selected network. Use when choosing a QIE network, locating RPC or explorer settings, or investigating a possible wrong-chain configuration.
compatibility: Local references and the offline inspector require no account or network. The optional read-only preflight helper contacts the selected QIE RPC endpoint and requires Node.js 24.20 or newer in the tested Node 24 line.
---

# QIE network references

Use this skill to choose an explicit QIE EVM network and read its published settings. This foundation release provides local documentation, an offline inspector and an optional read-only live preflight helper. Packaged values remain documented configuration; the preflight helper produces live observations only, and this skill has not tested a wallet, provider SDK, or native CLI.

## Inputs and decisions

1. Establish whether the task concerns EVM mainnet, EVM testnet, or native QIE. If the target is missing, ask before supplying operational settings.
2. For an EVM task, read only the selected [mainnet reference](references/network-mainnet.md) or [testnet reference](references/network-testnet.md).
3. For validator, delegation, native account or governance work, stop the EVM procedure and use the official sources in [scope and limitations](references/scope.md). A native operation is not ERC-20 staking.
4. Inspect [release information](references/release-info.md) and [network claims](data/network-claims.json) before presenting configuration as current evidence.

## Offline inspection

From the installed skill directory, run the [offline inspector](scripts/inspect-network.mjs) with either network identifier:

```sh
node scripts/inspect-network.mjs qie-mainnet
node scripts/inspect-network.mjs qie-testnet
```

Run only the command relevant to the requested network. The helper locates packaged data relative to itself, so invoking it by an absolute path also works from another directory. Its [status evaluator](scripts/lib/effective-status.mjs) is bundled locally.

Expected output is JSON containing the selected network, published values, evidence status and source URLs. `live_check.outcome` is always `NOT_RUN`. This command does not establish endpoint availability or active chain identity.

## Read-only live preflight

Before a write-bound step, run the bundled [preflight helper](scripts/verify-network.mjs) from the installed skill directory against the explicitly selected network:

```sh
node scripts/verify-network.mjs qie-mainnet
node scripts/verify-network.mjs qie-testnet
node scripts/verify-network.mjs qie-mainnet --rpc https://alternative-mainnet-endpoint.example/
```

- The helper reads `eth_chainId` and the latest block header from the packaged documented endpoint, or from the `--rpc` override, and prints one JSON report. Each call makes at most two bounded requests (10-second timeout, 1 MiB response limit).
- An `--rpc` override must stay on the selected network: observed chain identity is checked against the packaged chain ID either way. There is no retry and no fallback to the other network's endpoint. A mismatch returns `live_check.outcome: FAIL` with `error_code: WRONG_CHAIN` and stops the flow.
- RPC offline, timeout, HTTP 429, malformed JSON, malformed quantities, an unreadable block header or block height zero return `live_check.outcome: UNKNOWN` with the matching `error_code` (`RPC_UNAVAILABLE`, `RPC_RATE_LIMITED`, `RPC_MALFORMED`, `UNSUPPORTED_PROVIDER`). `UNKNOWN` never reads as success.
- `live_check.outcome: PASS` means only that observed chain identity matched the selected network and a nonzero block was read. `effective_claims` evaluates the packaged claims with the bundled status evaluator on the same clock; a live observation never promotes a claim or capability status, and block freshness is not claimed (no reviewed threshold exists).
- Exit codes are fail-closed: `0` for PASS, `1` for a FAIL or UNKNOWN report, `2` for a usage error. Gate a write-bound step on `PASS`, never on the report merely existing.
- The helper is read-only: it never signs, broadcasts, requests a key, or reads a secret. It cannot authorize a transaction.

## Before operational use

For the reusable network workflow, read [select and inspect a network](recipes/network/recipe.md). It states inputs, command outcomes, recovery and the boundary between documented settings and an observed preflight.

Follow the [preflight checklist](references/preflight.md). A host must obtain a fresh `eth_chainId` and responsive-block observation from the chosen endpoint before a write-bound workflow; the read-only preflight helper above performs exactly those two reads. Endpoint settings alone do not prove identity, and a passing preflight observation is not evidence promotion. This skill never signs, broadcasts, requests a key, or authorizes another agent to spend.

Report the target network, value, source, evidence status and missing checks. Keep observed runtime evidence separate from documented settings. If a live check cannot run, report `UNKNOWN` or `NOT_RUN`; never report a successful preflight from this offline helper.

## Failure branches and fallback

- Missing or ambiguous network: request the missing target; never silently switch mainnet and testnet.
- Missing or corrupt packaged files: stop and reinstall a known release; do not read repository-root paths or invent settings.
- RPC unavailable, rate-limited, malformed or mismatched: the preflight helper reports `UNKNOWN` or `FAIL` explicitly; stop the operational flow. Any alternative endpoint must remain on the same explicitly selected network and be checked independently.
- Unsupported native task or provider interface: explain the missing evidence and link the relevant official source. No sibling skill is required for the local reference task.
- Stale or conflicting evidence: explain the effective status and require maintainer review or new relevant evidence.

<!-- GENERATED — DO NOT EDIT. Change canonical authoring or knowledge. -->
