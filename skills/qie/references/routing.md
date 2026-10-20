<!-- GENERATED — DO NOT EDIT. Change canonical authoring or knowledge. -->

# QIE intent routing table

Derived from the canonical catalogue. Select the minimal set of routes for the task; do not load every domain. A route labelled `published in this release` is an installable release artifact: when it is missing from the local installation, install it from the same QIE Forge source this bundle came from (for example `skills add <qie-forge-source> --skill <skill-name>`), or use `--skill '*'` for the full published suite, replacing `<qie-forge-source>` with that source. A route labelled `catalogued; not published in this release` or `planned; not a published artifact` is NOT installable: never offer it as a release artifact, never imply that installing it is possible, never read it as a local path, and continue with this bundle's coverage map and source URLs. Never fabricate a missing skill's procedure.

## Intent to domain routes

| Catalogued intent | Domain | Route |
|---|---|---|
| Understand EVM versus native QIE | D01 Fundamentals and architecture | `qie` (published in this release) |
| Choose an explicit network; Inspect published RPC settings | D02 Networks and RPC | `qie-networks` (published in this release) |
| Find a wallet connection path | D03 Accounts and wallets | `qie-wallets` (published in this release) |
| Find contract build and test guidance | D04 Smart-contract development | `qie-smart-contracts` (published in this release) |
| Locate token specifications and issuer addresses | D05 Tokens and assets | `qie-ecosystem` (published in this release) |
| Understand fees and transaction states | D06 Transactions and gas | `qie-transactions` (published in this release) |
| Connect a TypeScript app to QIE | D07 Frontend and full-stack | `qie-frontend` (published in this release) |
| Find QIE Wallet, QIE Pass and exchange products | D08 Ecosystem products | `qie-ecosystem` (published in this release) |
| Find exchange interfaces and liquidity data | D09 DeFi and liquidity | `qie-ecosystem` (published in this release) |
| Find historical event access | D10 Indexing, data and analytics | `qie-indexing` (planned; not a published artifact) |
| Distinguish delegation from EVM contract staking | D11 Native QIE and Cosmos | `qie-native` (planned; not a published artifact) |
| Find signing and secret-handling boundaries | D12 Security and operations | `qie` (published in this release) |
| Investigate wrong-chain or unavailable RPC reports | D13 Debugging and diagnostics | `qie-debug` (published in this release) |
| Find a staged contract deployment path | D14 Deployment and production | `qie-deployment` (published in this release) |
| Locate public repositories and native governance references | D15 Governance, ecosystem and contribution | `qie-native` (planned; not a published artifact) |

## Skill handoffs

| Skill | Tier | Catalogue state | Bound domains |
|---|---|---|---|
| `qie` | P0 | published in this release | D01, D12 |
| `qie-debug` | P0 | published in this release | D13 |
| `qie-deployment` | P0 | published in this release | D14 |
| `qie-ecosystem` | P0 | published in this release | D05, D08, D09 |
| `qie-frontend` | P0 | published in this release | D07 |
| `qie-indexing` | — | planned; not a published artifact | D10 |
| `qie-native` | — | planned; not a published artifact | D11, D15 |
| `qie-networks` | P0 | published in this release | D02 |
| `qie-smart-contracts` | P0 | published in this release | D04 |
| `qie-transactions` | P0 | published in this release | D06 |
| `qie-wallets` | P0 | published in this release | D03 |
