# QIE Forge

[![Check skills](https://github.com/Archzxylabs/qie-forge/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/Archzxylabs/qie-forge/actions/workflows/ci.yml)
[![Latest release](https://img.shields.io/github/v/release/Archzxylabs/qie-forge?sort=semver)](https://github.com/Archzxylabs/qie-forge/releases/latest)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Agent skills for building on the **QIE blockchain** (QIE V3): EVM mainnet `1990`, testnet `1983`, and the native Cosmos layer.

Coding agents usually have stale or no knowledge of QIE. They guess chain IDs, copy Ethereum-only addresses and compile for opcodes QIE doesn't support. QIE Forge gives them current, sourced QIE facts and the QIE-specific gotchas, as plain Markdown. There is nothing to run: the agent reads the files.

## Quick start

Install with the open [`skills`](https://github.com/vercel-labs/skills) CLI, which needs Node.js 22 or newer:

```bash
npx skills add Archzxylabs/qie-forge --skill '*'      # all nine skills, for the current project
npx skills add Archzxylabs/qie-forge --skill '*' -g   # or for your user, in every project
```

Then describe your QIE task to your agent as usual. The `qie` router skill points it to the right skills. Some prompts to try:

- "Deploy an ERC-20 to QIE testnet with Foundry and verify it on the explorer."
- "Add a Connect QIE Wallet button with network switching to my React app."
- "Read the BTC/USDT price from QIE Oracle and reject stale answers."
- "My deployment fails on QIE with `invalid opcode: opcode 0x5e not defined`. Why?"

More install options:

```bash
npx skills add Archzxylabs/qie-forge                        # choose skills and agents interactively
npx skills add Archzxylabs/qie-forge --skill qie-networks   # a single skill
npx skills add 'Archzxylabs/qie-forge#v1.0.0' --skill '*'   # a pinned release
npx skills add ./path/to/qie-forge --skill '*'              # from a local checkout
npx skills update                                           # update installed skills (add -g for global)
```

## Skills

| Skill | Use it for |
|---|---|
| [`qie`](skills/qie/SKILL.md) | Router: which skill to fetch for a task, plus the QIE ground rules |
| [`qie-networks`](skills/qie-networks/SKILL.md) | Chain IDs, all official RPCs with live status, explorers, faucet, RPC limits, viem/wagmi/ethers/Hardhat/Foundry configs |
| [`qie-concepts`](skills/qie-concepts/SKILL.md) | How QIE differs from Ethereum: Shanghai-only EVM, gas charging, finality, missing canonical contracts, EVM vs native, staking |
| [`qie-addresses`](skills/qie-addresses/SKILL.md) | Every known QIE contract address with its source and on-chain checks, QIE's own Safe deployment, and how to verify an address |
| [`qie-scaffold`](skills/qie-scaffold/SKILL.md) | Idea → contracts → testnet → verify → frontend → mainnet |
| [`qie-wallet-integration`](skills/qie-wallet-integration/SKILL.md) | QIE Wallet and injected-wallet connection, network switching, events, quirks |
| [`qie-transactions`](skills/qie-transactions/SKILL.md) | Receipts, fees, strict nonces, logs, traces, sending safely |
| [`qie-ecosystem`](skills/qie-ecosystem/SKILL.md) | QIE Oracle, Lending, QUSDC, DEX, Bridge, QIE ID/Pass, Safe, explorer API, indexing, third-party support |
| [`qie-debug`](skills/qie-debug/SKILL.md) | Symptom → check → fix for build, RPC, wallet and transaction problems |

## How facts are verified

Every fact in the skills carries one of these labels:

| Label | Meaning |
|---|---|
| **Documented** | Stated by official QIE docs or official QIE repositories (linked). |
| **Observed** | Checked by QIE Forge with read-only RPC or API calls on the stated date. |
| **Claimed** | Product or marketing page only; no technical specification. |
| **Unknown** | No reliable source. Agents must say so instead of guessing. |

Observations in this release were taken on **2026-11-16** and re-verified on **2026-11-17**. Observed facts carry their date, and most carry the exact read-only command, so anyone can re-check them. For anything newer, the skills tell agents to read the official docs index at https://docs.qie.digital/llms.txt (every page is also available as `.md`).

## Safety

The skills tell agents to:

- pick mainnet or testnet explicitly and never fall back from one to the other;
- never invent contract addresses;
- never ask for keys or seed phrases;
- get explicit approval before any transaction;
- go to testnet before mainnet.

## Versioning

Releases follow [Semantic Versioning](https://semver.org/):

| Release | What it means |
|---|---|
| Major | A skill is renamed or removed |
| Minor | A skill or section is added |
| Patch | Facts are corrected or re-verified |

See the [changelog](CHANGELOG.md) for what changed in each release.

## Contributing

Corrections are welcome, especially when they come with a source. Read [CONTRIBUTING.md](CONTRIBUTING.md), and report wrong facts with the [issue form](https://github.com/Archzxylabs/qie-forge/issues/new?template=wrong-fact.yml). This project follows a [Code of Conduct](CODE_OF_CONDUCT.md).

## Security

A wrong contract address can cost real funds. Report wrong or malicious addresses, and instructions that could expose keys, privately as described in [SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE)
