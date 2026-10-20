<!-- GENERATED — DO NOT EDIT. Change canonical authoring or knowledge. -->

# QIE Ecosystem Catalogue

Published tools, frameworks, products and integration interfaces across the QIE ecosystem.

> [!IMPORTANT]
> **Evidence Invariant:** Documentation is not execution proof. A product's existence on GitHub or a website does not prove its programmatic integration works on QIE. > Statuses are derived from primary evidence and follow canonical semantics: `VERIFIED`, `DOCUMENTED`, `CLAIMED`, `UNKNOWN`, `CONFLICTED`, `STALE`, `UNSUPPORTED`, `DEPRECATED`. > Every status below is the canonical record projected through the bundled effective-status evaluator at build time; it can never be upgraded by this file. > Generic EVM compatibility is never accepted as proof of QIE compatibility. > Consult the [Ecosystem Decision Guide](decision-guide.md) and [Compatibility Matrix](compatibility.md) before writing integration code.

## Operation-Scoped Compatibility Overview

One row per canonical capability record (Tool + Operation + Network + Evidence). There is no product-wide compatibility verdict anywhere in this release.

| Capability | Tool | Operation | Category | Network(s) | Effective Status | Primary Limitation |
|---|---|---|---|---|---|---|
| `bridge-transfer` | `unidentified-bridge` | `bridge_assets` | Cross-Chain Bridges & Conversion | unscoped (network unknown) | **UNKNOWN** | Architecture references interoperability; no operational bridge interface or trust model is verified. |
| `chain-id-5656-conflict` | `qie-legacy` | `resolve_mainnet_chain_id` | Networks & Chain Identity | qie-mainnet | **CONFLICTED** | Historical aggregators list chain ID 5656 while official QIE V3 documentation defines the canonical V3 chain ID; resolved by treating canonical V3 as Mainnet and 5656 as deprecated pre-V3. |
| `contract-deploy` | `foundry` | `deploy_contract` | Smart Contract Development & Deployment | qie-mainnet, qie-testnet | **UNKNOWN** | Official builder guidance mentions Foundry; no QIE build or deployment was executed. |
| `dex-swap` | `qiedex` | `swap` | Decentralized Finance & Swaps | qie-mainnet, qie-testnet | **UNKNOWN** | Canonical router addresses, ABI, liquidity and executable swap path are unknown. |
| `explorer-verification-api` | `qie-explorer` | `verify_contract_api` | Explorers & Contract Verification | qie-mainnet, qie-testnet | **UNKNOWN** | Post-deployment docs mention explorer verification, but programmatic verification API, endpoint, and tool plugins (e.g. hardhat-verify, forge verify-contract) are not documented or confirmed. |
| `hardhat-deploy` | `hardhat` | `deploy_contract` | Smart Contract Development & Deployment | qie-mainnet | **DOCUMENTED** | Official developer docs document Hardhat configuration for QIE Mainnet with Solidity 0.8.20 and JSON-RPC URL; live network execution not run. |
| `identity-auth` | `qie-pass` | `authenticate` | Identity & Authentication | qie-mainnet, qie-testnet | **UNKNOWN** | Product is mentioned publicly; production SDK, API, and authentication flow are not confirmed. |
| `indexer-query` | `unidentified-indexer` | `query_events` | Indexing & Historical Data | unscoped (network unknown) | **UNKNOWN** | No QIE-specific indexer provider, supported network, API, or version has been confirmed. |
| `legacy-chain-5656` | `qie-legacy` | `evm_connect_chain_5656` | Networks & Chain Identity | qie-mainnet | **DEPRECATED** | Pre-V3 chain ID 5656 is deprecated; official wallet guide explicitly warns not to use it, as current QIE V3 Mainnet uses the canonical V3 chain ID. |
| `legacy-chain-9731` | `qie-legacy` | `evm_connect_chain_9731` | Networks & Chain Identity | qie-mainnet | **DEPRECATED** | Legacy chain ID 9731 is deprecated; official wallet guide explicitly warns not to use it, as current QIE V3 Mainnet uses the canonical V3 chain ID. |
| `native-delegate` | `qie-native` | `delegate_native` | Native Cosmos & Validator Operations | unscoped (network unknown) | **UNKNOWN** | Current native CLI release, account mapping and delegation commands are not established. |
| `qie-bridge-web` | `qie-bridge` | `bridge_assets_web` | Cross-Chain Bridges & Conversion | qie-mainnet | **CLAIMED** | Web bridge interface hosted at bridge.qie.digital connects QIE, Ethereum, and BSC; programmatic smart contract API and relayer architecture are unknown. |
| `qie-oracle-price-feed` | `qie-oracle` | `read_price_feed` | Oracles & Asset Feeds | qie-mainnet | **DOCUMENTED** | Deployed contract table and Solidity query example are officially documented for BTC, ETH, XRP, SOL, QIE, XAUt, BNB on Layer 1; address identity is not verified on-chain, and address records remain UNKNOWN. |
| `qied-gov-submit` | `qied` | `submit_governance_proposal` | Native Cosmos & Validator Operations | qie-mainnet | **DOCUMENTED** | Official guide documents 'qied tx gov submit-proposal ./proposal.json --chain-id <native-chain-id>'; requires 10,000 QIE minimum deposit in aqie units. |
| `qied-staking-delegate` | `qied` | `delegate_native` | Native Cosmos & Validator Operations | qie-mainnet | **DOCUMENTED** | Official guide documents 'qied tx staking delegate <validator> <amount>aqie --chain-id <native-chain-id>'; operates on native Cosmos layer, not EVM smart contracts. |
| `qiedex-web-swap` | `qiedex` | `swap_web` | Decentralized Finance & Swaps | qie-mainnet | **CLAIMED** | Web exchange UI hosted at dex.qie.digital; smart contract router, factory, and liquidity pool addresses are unconfirmed and must not be guessed. |
| `qiewallet-disconnect-event` | `qie-wallet` | `listen_disconnect_event` | Wallets & Injected Providers | qie-mainnet, qie-testnet | **UNSUPPORTED** | Official integration guide explicitly warns that QIE Wallet never emits the 'disconnect' event; site disconnection arrives solely as 'accountsChanged' with an empty array. |
| `qiewallet-eip1193-connect` | `qie-wallet` | `connect_eip1193` | Wallets & Injected Providers | qie-mainnet, qie-testnet | **DOCUMENTED** | Official guide documents EIP-1193 provider injection, EIP-6963 discovery with rdns 'me.qiewallet', and 'window.qie'; live browser extension connection untested in this environment. |
| `qiewallet-non-evm-eip1193` | `qie-wallet` | `access_non_evm_via_eip1193` | Wallets & Injected Providers | qie-mainnet, qie-testnet | **UNSUPPORTED** | Official integration guide explicitly states non-EVM accounts (Bitcoin, Solana) in QIE Wallet are not exposed through the EIP-1193 provider. |
| `qiewallet-switch-chain` | `qie-wallet` | `switch_chain` | Wallets & Injected Providers | qie-mainnet, qie-testnet | **DOCUMENTED** | Documented via wallet_switchEthereumChain (0x7C6 for mainnet, 0x7BF for testnet). Switching to testnet returns error 4902 unless the user has manually enabled the testnet toggle in wallet settings. |
| `remix-deploy` | `remix` | `deploy_via_injected_provider` | Smart Contract Development & Deployment | qie-mainnet | **DOCUMENTED** | Official Remix guide documents deployment through the 'Injected Web3' environment with MetaMask on the QIE network; browser environment and manual wallet approval required, and no EVM compiler target is specified by the guide. |
| `rpc-identity` | `qie-rpc` | `read_chain_identity` | Networks & Chain Identity | qie-mainnet, qie-testnet | **UNKNOWN** | Listed endpoints have not been contacted; JSON-RPC availability and chain identity are unknown. |
| `viem-custom-chain` | `viem` | `define_chain` | Wallets & Injected Providers | qie-mainnet | **DOCUMENTED** | Official guide documents viem custom chain definition with canonical mainnet chain ID, rpcUrls, and explorer; live RPC call through viem transport untested on active chain. |
| `wagmi-injected` | `wagmi` | `injected_connector` | Wallets & Injected Providers | qie-mainnet | **DOCUMENTED** | Documented via wagmi injected() connector utilizing EIP-6963 discovery for QIE Wallet; React runtime untested in this environment. |
| `wallet-connect` | `external-evm-wallet` | `connect_external_wallet` | Wallets & Injected Providers | qie-mainnet, qie-testnet | **UNKNOWN** | No wallet, connector version, or QIE transaction flow has been tested. |

## Category Details

Category membership is the explicit canonical `category` association on each capability record, never substring matching on identifiers.

### Networks & Chain Identity

Published chain identity, RPC endpoints, explorers, and legacy chain-ID resolution for QIE EVM networks.

**Canonical capabilities:**
- `chain-id-5656-conflict` (`qie-legacy`, `resolve_mainnet_chain_id`): **CONFLICTED** — Historical aggregators list chain ID 5656 while official QIE V3 documentation defines the canonical V3 chain ID; resolved by treating canonical V3 as Mainnet and 5656 as deprecated pre-V3.
- `legacy-chain-5656` (`qie-legacy`, `evm_connect_chain_5656`): **DEPRECATED** — Pre-V3 chain ID 5656 is deprecated; official wallet guide explicitly warns not to use it, as current QIE V3 Mainnet uses the canonical V3 chain ID.
- `legacy-chain-9731` (`qie-legacy`, `evm_connect_chain_9731`): **DEPRECATED** — Legacy chain ID 9731 is deprecated; official wallet guide explicitly warns not to use it, as current QIE V3 Mainnet uses the canonical V3 chain ID.
- `rpc-identity` (`qie-rpc`, `read_chain_identity`): **UNKNOWN** — Listed endpoints have not been contacted; JSON-RPC availability and chain identity are unknown.

### Wallets & Injected Providers

Browser wallets, injected EIP-1193 providers, and connection libraries for interaction with QIE EVM networks.

**Canonical capabilities:**
- `qiewallet-disconnect-event` (`qie-wallet`, `listen_disconnect_event`): **UNSUPPORTED** — Official integration guide explicitly warns that QIE Wallet never emits the 'disconnect' event; site disconnection arrives solely as 'accountsChanged' with an empty array.
- `qiewallet-eip1193-connect` (`qie-wallet`, `connect_eip1193`): **DOCUMENTED** — Official guide documents EIP-1193 provider injection, EIP-6963 discovery with rdns 'me.qiewallet', and 'window.qie'; live browser extension connection untested in this environment.
- `qiewallet-non-evm-eip1193` (`qie-wallet`, `access_non_evm_via_eip1193`): **UNSUPPORTED** — Official integration guide explicitly states non-EVM accounts (Bitcoin, Solana) in QIE Wallet are not exposed through the EIP-1193 provider.
- `qiewallet-switch-chain` (`qie-wallet`, `switch_chain`): **DOCUMENTED** — Documented via wallet_switchEthereumChain (0x7C6 for mainnet, 0x7BF for testnet). Switching to testnet returns error 4902 unless the user has manually enabled the testnet toggle in wallet settings.
- `viem-custom-chain` (`viem`, `define_chain`): **DOCUMENTED** — Official guide documents viem custom chain definition with canonical mainnet chain ID, rpcUrls, and explorer; live RPC call through viem transport untested on active chain.
- `wagmi-injected` (`wagmi`, `injected_connector`): **DOCUMENTED** — Documented via wagmi injected() connector utilizing EIP-6963 discovery for QIE Wallet; React runtime untested in this environment.
- `wallet-connect` (`external-evm-wallet`, `connect_external_wallet`): **UNKNOWN** — No wallet, connector version, or QIE transaction flow has been tested.

### Smart Contract Development & Deployment

Frameworks and tooling for building, compiling, testing, and deploying Solidity contracts to QIE.

**Canonical capabilities:**
- `contract-deploy` (`foundry`, `deploy_contract`): **UNKNOWN** — Official builder guidance mentions Foundry; no QIE build or deployment was executed.
- `hardhat-deploy` (`hardhat`, `deploy_contract`): **DOCUMENTED** — Official developer docs document Hardhat configuration for QIE Mainnet with Solidity 0.8.20 and JSON-RPC URL; live network execution not run.
- `remix-deploy` (`remix`, `deploy_via_injected_provider`): **DOCUMENTED** — Official Remix guide documents deployment through the 'Injected Web3' environment with MetaMask on the QIE network; browser environment and manual wallet approval required, and no EVM compiler target is specified by the guide.

### Identity & Authentication

Identity and authentication products announced for the QIE ecosystem; programmatic interfaces remain unconfirmed.

**Canonical capabilities:**
- `identity-auth` (`qie-pass`, `authenticate`): **UNKNOWN** — Product is mentioned publicly; production SDK, API, and authentication flow are not confirmed.

### Explorers & Contract Verification

Block explorers and programmatic contract source-code verification.

**Canonical capabilities:**
- `explorer-verification-api` (`qie-explorer`, `verify_contract_api`): **UNKNOWN** — Post-deployment docs mention explorer verification, but programmatic verification API, endpoint, and tool plugins (e.g. hardhat-verify, forge verify-contract) are not documented or confirmed.

### Decentralized Finance & Swaps

Decentralized exchanges, liquidity pools, and lending interfaces in the QIE ecosystem.

**Canonical capabilities:**
- `dex-swap` (`qiedex`, `swap`): **UNKNOWN** — Canonical router addresses, ABI, liquidity and executable swap path are unknown.
- `qiedex-web-swap` (`qiedex`, `swap_web`): **CLAIMED** — Web exchange UI hosted at dex.qie.digital; smart contract router, factory, and liquidity pool addresses are unconfirmed and must not be guessed.

### Cross-Chain Bridges & Conversion

Cross-chain token transfer interfaces; contract-level bridge and conversion mechanics remain unverified.

**Canonical capabilities:**
- `bridge-transfer` (`unidentified-bridge`, `bridge_assets`): **UNKNOWN** — Architecture references interoperability; no operational bridge interface or trust model is verified.
- `qie-bridge-web` (`qie-bridge`, `bridge_assets_web`): **CLAIMED** — Web bridge interface hosted at bridge.qie.digital connects QIE, Ethereum, and BSC; programmatic smart contract API and relayer architecture are unknown.

### Oracles & Asset Feeds

On-chain price feeds and oracle contracts documented for asset valuation on QIE.

**Canonical capabilities:**
- `qie-oracle-price-feed` (`qie-oracle`, `read_price_feed`): **DOCUMENTED** — Deployed contract table and Solidity query example are officially documented for BTC, ETH, XRP, SOL, QIE, XAUt, BNB on Layer 1; address identity is not verified on-chain, and address records remain UNKNOWN.

### Indexing & Historical Data

Event indexing, subgraph hosting, and historical state querying solutions.

**Canonical capabilities:**
- `indexer-query` (`unidentified-indexer`, `query_events`): **UNKNOWN** — No QIE-specific indexer provider, supported network, API, or version has been confirmed.

### Native Cosmos & Validator Operations

Native Cosmos SDK operations, validator delegation, and governance proposals.

**Canonical capabilities:**
- `native-delegate` (`qie-native`, `delegate_native`): **UNKNOWN** — Current native CLI release, account mapping and delegation commands are not established.
- `qied-gov-submit` (`qied`, `submit_governance_proposal`): **DOCUMENTED** — Official guide documents 'qied tx gov submit-proposal ./proposal.json --chain-id <native-chain-id>'; requires 10,000 QIE minimum deposit in aqie units.
- `qied-staking-delegate` (`qied`, `delegate_native`): **DOCUMENTED** — Official guide documents 'qied tx staking delegate <validator> <amount>aqie --chain-id <native-chain-id>'; operates on native Cosmos layer, not EVM smart contracts.

## Published Network Profiles

The values below are projections of the canonical claim records selected into this bundle. They are published (DOCUMENTED) configuration, not live-verified network facts; no RPC endpoint in this release has been contacted.

| Network | Property | Published value | Stored status | Effective status | Source |
|---|---|---|---|---|---|---|
| `qie-mainnet` | `chain_id` | `1990` | DOCUMENTED | **DOCUMENTED** | [S03: Published QIE EVM network settings](https://docs.qie.digital/getting-started-with-qie-blockchain/4.-access-mainnet-or-testnet) (T1) |
| `qie-mainnet` | `explorer_url` | `https://mainnet.qie.digital/` | DOCUMENTED | **DOCUMENTED** | [S03: Published QIE EVM network settings](https://docs.qie.digital/getting-started-with-qie-blockchain/4.-access-mainnet-or-testnet) (T1) |
| `qie-mainnet` | `native_symbol` | `QIEV3` | DOCUMENTED | **DOCUMENTED** | [S03: Published QIE EVM network settings](https://docs.qie.digital/getting-started-with-qie-blockchain/4.-access-mainnet-or-testnet) (T1) |
| `qie-mainnet` | `network_name` | `QIEMainnet` | DOCUMENTED | **DOCUMENTED** | [S03: Published QIE EVM network settings](https://docs.qie.digital/getting-started-with-qie-blockchain/4.-access-mainnet-or-testnet) (T1) |
| `qie-mainnet` | `rpc_url` | `https://rpc1mainnet.qie.digital/` | DOCUMENTED | **DOCUMENTED** | [S03: Published QIE EVM network settings](https://docs.qie.digital/getting-started-with-qie-blockchain/4.-access-mainnet-or-testnet) (T1) |
| `qie-testnet` | `chain_id` | `1983` | DOCUMENTED | **DOCUMENTED** | [S03: Published QIE EVM network settings](https://docs.qie.digital/getting-started-with-qie-blockchain/4.-access-mainnet-or-testnet) (T1) |
| `qie-testnet` | `explorer_url` | `https://testnet.qie.digital/` | DOCUMENTED | **DOCUMENTED** | [S03: Published QIE EVM network settings](https://docs.qie.digital/getting-started-with-qie-blockchain/4.-access-mainnet-or-testnet) (T1) |
| `qie-testnet` | `faucet_url` | `https://www.qie.digital/faucet` | DOCUMENTED | **DOCUMENTED** | [S03: Published QIE EVM network settings](https://docs.qie.digital/getting-started-with-qie-blockchain/4.-access-mainnet-or-testnet) (T1) |
| `qie-testnet` | `native_symbol` | `QIE` | DOCUMENTED | **DOCUMENTED** | [S03: Published QIE EVM network settings](https://docs.qie.digital/getting-started-with-qie-blockchain/4.-access-mainnet-or-testnet) (T1) |
| `qie-testnet` | `network_name` | `QIE testnet` | DOCUMENTED | **DOCUMENTED** | [S03: Published QIE EVM network settings](https://docs.qie.digital/getting-started-with-qie-blockchain/4.-access-mainnet-or-testnet) (T1) |
| `qie-testnet` | `rpc_url` | `https://rpc1testnet.qie.digital/` | DOCUMENTED | **DOCUMENTED** | [S03: Published QIE EVM network settings](https://docs.qie.digital/getting-started-with-qie-blockchain/4.-access-mainnet-or-testnet) (T1) |

Claim sources: [S03: Published QIE EVM network settings](https://docs.qie.digital/getting-started-with-qie-blockchain/4.-access-mainnet-or-testnet) (T1).

Native Cosmos chain identity and denominations are registry facts, not EVM claims; they are published by the native-layer sources of the canonical native capabilities below and are never mixed into the EVM profiles:

- Native layer sources: [S04: QIE V3 architecture overview](https://docs.qie.digital/what-is-qie/qie-v3-key-features); [S09: QIE blockchain repository entry point](https://github.com/qie-blockchain); [S13: QIE V3 Native Delegation and Staking Guide](https://docs.qie.digital/delegators-in-qie-v3/how-to-delegate-qie-coins-and-earn-rewards.md); [S14: QIE V3 Blockchain Governance Step-by-Step Guide](https://docs.qie.digital/what-are-validators/qie-blockchain-governance-step-by-step-guide.md); [S15: QIE Cosmos Chain Registry Configuration](https://raw.githubusercontent.com/qieadmin/chain-registry/master/qie/chain.json)

## Deprecated & Conflicted Chain Identities

- `chain-id-5656-conflict` (**CONFLICTED**, `qie-legacy`): Historical aggregators list chain ID 5656 while official QIE V3 documentation defines the canonical V3 chain ID; resolved by treating canonical V3 as Mainnet and 5656 as deprecated pre-V3.
- `legacy-chain-5656` (**DEPRECATED**, `qie-legacy`): Pre-V3 chain ID 5656 is deprecated; official wallet guide explicitly warns not to use it, as current QIE V3 Mainnet uses the canonical V3 chain ID.
- `legacy-chain-9731` (**DEPRECATED**, `qie-legacy`): Legacy chain ID 9731 is deprecated; official wallet guide explicitly warns not to use it, as current QIE V3 Mainnet uses the canonical V3 chain ID.

## Address Publication Policy

The canonical address inventory in this release is empty. No ecosystem contract address — DEX router, factory, pool, token, oracle, bridge, or conversion precompile — is published or recommended by this catalogue. An explorer page, a source-verified listing, or nonempty bytecode never establishes issuer identity, ABI correspondence, or product ownership; see the release address-identity blocker in the [Ecosystem Decision Guide](decision-guide.md).

## Primary Sources and Provenance

- [S00: QIE documentation overview](https://docs.qie.digital/) (T1) — QIE, reviewed 2026-10-19T00:08:45Z
- [S01: Official ecosystem discovery and builder entry points](https://hackathon.qie.digital/) (T4) — QIE, reviewed 2026-10-19T00:08:45Z
- [S03: Published QIE EVM network settings](https://docs.qie.digital/getting-started-with-qie-blockchain/4.-access-mainnet-or-testnet) (T1) — QIE, reviewed 2026-10-19T00:08:45Z
- [S04: QIE V3 architecture overview](https://docs.qie.digital/what-is-qie/qie-v3-key-features) (T1) — QIE, reviewed 2026-10-19T00:08:45Z
- [S08: QIE admin organization repositories](https://github.com/qieadmin) (T1) — QIE, reviewed 2026-10-19T00:08:45Z
- [S09: QIE blockchain repository entry point](https://github.com/qie-blockchain) (T1) — QIE, reviewed 2026-10-19T00:08:45Z
- [S10: QIE Wallet Integration Guide for Websites](https://docs.qie.digital/qie-wallet-integration-guide-for-websites.md) (T1) — QIE, reviewed 2026-10-19T17:00:00Z
- [S11: Deploy Smart Contract Using Hardhat on QIE](https://docs.qie.digital/developer-docs/smart-contract-deployment/deploy-using-hardhat.md) (T1) — QIE, reviewed 2026-10-19T17:00:00Z
- [S12: QIE Oracle Deployed Contracts and Asset Mapping](https://docs.qie.digital/qie-oracle/deployed-contracts/table-of-assets-contract-mapping.md) (T1) — QIE, reviewed 2026-10-19T17:00:00Z
- [S13: QIE V3 Native Delegation and Staking Guide](https://docs.qie.digital/delegators-in-qie-v3/how-to-delegate-qie-coins-and-earn-rewards.md) (T1) — QIE, reviewed 2026-10-19T17:00:00Z
- [S14: QIE V3 Blockchain Governance Step-by-Step Guide](https://docs.qie.digital/what-are-validators/qie-blockchain-governance-step-by-step-guide.md) (T1) — QIE, reviewed 2026-10-19T17:00:00Z
- [S15: QIE Cosmos Chain Registry Configuration](https://raw.githubusercontent.com/qieadmin/chain-registry/master/qie/chain.json) (T1) — QIE, reviewed 2026-10-19T17:00:00Z
- [S16: QIE Cosmos Asset List and Precompile Specification](https://raw.githubusercontent.com/qieadmin/chain-registry/master/qie/assetlist.json) (T1) — QIE, reviewed 2026-10-19T17:00:00Z
- [S17: QIE Wallet Official Web Portal](https://qiewallet.me/) (T4) — QIE, reviewed 2026-10-19T17:00:00Z
- [S18: QIE Official Ecosystem and dApp Directory](https://qie.digital/) (T4) — QIE, reviewed 2026-10-19T17:00:00Z
- [S19: QIE Wallet Browser Extension Chrome Web Store Listing](https://chromewebstore.google.com/detail/qie-wallet-%E2%80%93-non-custodia/oljchdcgmibnjbbopolafbjncfhdacjb) (T2) — VortX Capital, reviewed 2026-10-19T17:00:00Z
- [S20: QIE EVM Chain Registry Repository](https://github.com/qieadmin/chains) (T1) — QIE, reviewed 2026-10-19T17:00:00Z
- [S21: Deploy Smart Contract Using Remix on QIE](https://docs.qie.digital/developer-docs/smart-contract-deployment/deploy-using-remix.md) (T1) — QIE, reviewed 2026-10-19T21:37:00Z

Refer to [Release information](release-info.md) for build timestamp and review freshness.
