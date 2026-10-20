<!-- GENERATED — DO NOT EDIT. Change canonical authoring or knowledge. -->

# QIE Compatibility Matrix

Operation-specific, network-specific, and version-specific compatibility classifications for the QIE ecosystem.

> [!IMPORTANT]
> **Granularity Requirement:** Compatibility is never evaluated as a blanket product property. > Each entry reflects **Tool + Version + Operation + Network + Evidence**. > Stored status is the canonical evidence record. Effective status is that record projected through the bundled non-promoting evaluator at the frozen build clock, so an expired or unverifiable record cannot keep a positive summary verdict. > Statuses cannot be upgraded without verified execution evidence. > For decision workflows and refusal rules, read the [Ecosystem Decision Guide](decision-guide.md) and [Ecosystem Catalogue](catalogue.md).

## Compatibility Summary Table

| Capability ID | Tool | Operation | Network(s) | Version | Stored Status | Effective Status | Primary Limitation | Sources |
|---|---|---|---|---|---|---|---|---|
| `bridge-transfer` | `unidentified-bridge` | `bridge_assets` | unscoped | UNKNOWN | `UNKNOWN` | **UNKNOWN** | Architecture references interoperability; no operational bridge interface or trust model is verified. | S04 |
| `chain-id-5656-conflict` | `qie-legacy` | `resolve_mainnet_chain_id` | qie-mainnet | UNKNOWN | `CONFLICTED` | **CONFLICTED** | Historical aggregators list chain ID 5656 while official QIE V3 documentation defines the canonical V3 chain ID; resolved by treating canonical V3 as Mainnet and 5656 as deprecated pre-V3. | S03, S10 |
| `contract-deploy` | `foundry` | `deploy_contract` | qie-mainnet, qie-testnet | UNKNOWN | `UNKNOWN` | **UNKNOWN** | Official builder guidance mentions Foundry; no QIE build or deployment was executed. | S01, S08 |
| `dex-swap` | `qiedex` | `swap` | qie-mainnet, qie-testnet | UNKNOWN | `UNKNOWN` | **UNKNOWN** | Canonical router addresses, ABI, liquidity and executable swap path are unknown. | S01 |
| `explorer-verification-api` | `qie-explorer` | `verify_contract_api` | qie-mainnet, qie-testnet | UNKNOWN | `UNKNOWN` | **UNKNOWN** | Post-deployment docs mention explorer verification, but programmatic verification API, endpoint, and tool plugins (e.g. hardhat-verify, forge verify-contract) are not documented or confirmed. | S00 |
| `hardhat-deploy` | `hardhat` | `deploy_contract` | qie-mainnet | UNKNOWN | `DOCUMENTED` | **DOCUMENTED** | Official developer docs document Hardhat configuration for QIE Mainnet with Solidity 0.8.20 and JSON-RPC URL; live network execution not run. | S11 |
| `identity-auth` | `qie-pass` | `authenticate` | qie-mainnet, qie-testnet | UNKNOWN | `UNKNOWN` | **UNKNOWN** | Product is mentioned publicly; production SDK, API, and authentication flow are not confirmed. | S01 |
| `indexer-query` | `unidentified-indexer` | `query_events` | unscoped | UNKNOWN | `UNKNOWN` | **UNKNOWN** | No QIE-specific indexer provider, supported network, API, or version has been confirmed. | S00, S09 |
| `legacy-chain-5656` | `qie-legacy` | `evm_connect_chain_5656` | qie-mainnet | UNKNOWN | `DEPRECATED` | **DEPRECATED** | Pre-V3 chain ID 5656 is deprecated; official wallet guide explicitly warns not to use it, as current QIE V3 Mainnet uses the canonical V3 chain ID. | S10 |
| `legacy-chain-9731` | `qie-legacy` | `evm_connect_chain_9731` | qie-mainnet | UNKNOWN | `DEPRECATED` | **DEPRECATED** | Legacy chain ID 9731 is deprecated; official wallet guide explicitly warns not to use it, as current QIE V3 Mainnet uses the canonical V3 chain ID. | S10 |
| `native-delegate` | `qie-native` | `delegate_native` | unscoped | UNKNOWN | `UNKNOWN` | **UNKNOWN** | Current native CLI release, account mapping and delegation commands are not established. | S04, S09 |
| `qie-bridge-web` | `qie-bridge` | `bridge_assets_web` | qie-mainnet | UNKNOWN | `CLAIMED` | **CLAIMED** | Web bridge interface hosted at bridge.qie.digital connects QIE, Ethereum, and BSC; programmatic smart contract API and relayer architecture are unknown. | S18 |
| `qie-oracle-price-feed` | `qie-oracle` | `read_price_feed` | qie-mainnet | UNKNOWN | `DOCUMENTED` | **DOCUMENTED** | Deployed contract table and Solidity query example are officially documented for BTC, ETH, XRP, SOL, QIE, XAUt, BNB on Layer 1; address identity is not verified on-chain, and address records remain UNKNOWN. | S12 |
| `qied-gov-submit` | `qied` | `submit_governance_proposal` | qie-mainnet | v4 | `DOCUMENTED` | **DOCUMENTED** | Official guide documents 'qied tx gov submit-proposal ./proposal.json --chain-id <native-chain-id>'; requires 10,000 QIE minimum deposit in aqie units. | S14, S15 |
| `qied-staking-delegate` | `qied` | `delegate_native` | qie-mainnet | v4 | `DOCUMENTED` | **DOCUMENTED** | Official guide documents 'qied tx staking delegate <validator> <amount>aqie --chain-id <native-chain-id>'; operates on native Cosmos layer, not EVM smart contracts. | S13, S15 |
| `qiedex-web-swap` | `qiedex` | `swap_web` | qie-mainnet | UNKNOWN | `CLAIMED` | **CLAIMED** | Web exchange UI hosted at dex.qie.digital; smart contract router, factory, and liquidity pool addresses are unconfirmed and must not be guessed. | S18 |
| `qiewallet-disconnect-event` | `qie-wallet` | `listen_disconnect_event` | qie-mainnet, qie-testnet | 4.2.2 | `UNSUPPORTED` | **UNSUPPORTED** | Official integration guide explicitly warns that QIE Wallet never emits the 'disconnect' event; site disconnection arrives solely as 'accountsChanged' with an empty array. | S10 |
| `qiewallet-eip1193-connect` | `qie-wallet` | `connect_eip1193` | qie-mainnet, qie-testnet | 4.2.2 | `DOCUMENTED` | **DOCUMENTED** | Official guide documents EIP-1193 provider injection, EIP-6963 discovery with rdns 'me.qiewallet', and 'window.qie'; live browser extension connection untested in this environment. | S10 |
| `qiewallet-non-evm-eip1193` | `qie-wallet` | `access_non_evm_via_eip1193` | qie-mainnet, qie-testnet | 4.2.2 | `UNSUPPORTED` | **UNSUPPORTED** | Official integration guide explicitly states non-EVM accounts (Bitcoin, Solana) in QIE Wallet are not exposed through the EIP-1193 provider. | S10 |
| `qiewallet-switch-chain` | `qie-wallet` | `switch_chain` | qie-mainnet, qie-testnet | 4.2.2 | `DOCUMENTED` | **DOCUMENTED** | Documented via wallet_switchEthereumChain (0x7C6 for mainnet, 0x7BF for testnet). Switching to testnet returns error 4902 unless the user has manually enabled the testnet toggle in wallet settings. | S10 |
| `remix-deploy` | `remix` | `deploy_via_injected_provider` | qie-mainnet | UNKNOWN | `DOCUMENTED` | **DOCUMENTED** | Official Remix guide documents deployment through the 'Injected Web3' environment with MetaMask on the QIE network; browser environment and manual wallet approval required, and no EVM compiler target is specified by the guide. | S21 |
| `rpc-identity` | `qie-rpc` | `read_chain_identity` | qie-mainnet, qie-testnet | UNKNOWN | `UNKNOWN` | **UNKNOWN** | Listed endpoints have not been contacted; JSON-RPC availability and chain identity are unknown. | S03 |
| `viem-custom-chain` | `viem` | `define_chain` | qie-mainnet | UNKNOWN | `DOCUMENTED` | **DOCUMENTED** | Official guide documents viem custom chain definition with canonical mainnet chain ID, rpcUrls, and explorer; live RPC call through viem transport untested on active chain. | S10 |
| `wagmi-injected` | `wagmi` | `injected_connector` | qie-mainnet | UNKNOWN | `DOCUMENTED` | **DOCUMENTED** | Documented via wagmi injected() connector utilizing EIP-6963 discovery for QIE Wallet; React runtime untested in this environment. | S10 |
| `wallet-connect` | `external-evm-wallet` | `connect_external_wallet` | qie-mainnet, qie-testnet | UNKNOWN | `UNKNOWN` | **UNKNOWN** | No wallet, connector version, or QIE transaction flow has been tested. | S01 |

## Detailed Capability Entries

### bridge-transfer: unidentified-bridge — bridge_assets

- **Stored Status**: `UNKNOWN`
- **Effective Status**: `UNKNOWN` — Stored evidence level; no live check or evidence promotion.
- **Network Scope**: unscoped (network unknown)
- **Tool Version**: `UNKNOWN`
- **Evidence Type**: `null`
- **Checked At**: `UNKNOWN`
- **Limitations & Prerequisites**:
  - Architecture references interoperability; no operational bridge interface or trust model is verified.
- **Sources**:
  - [S04: QIE V3 architecture overview](https://docs.qie.digital/what-is-qie/qie-v3-key-features)

### chain-id-5656-conflict: qie-legacy — resolve_mainnet_chain_id

- **Stored Status**: `CONFLICTED`
- **Effective Status**: `CONFLICTED` — Stored blocking or retired evidence state.
- **Network Scope**: qie-mainnet
- **Tool Version**: `UNKNOWN`
- **Evidence Type**: `OFFICIAL_DOC`
- **Checked At**: `UNKNOWN`
- **Limitations & Prerequisites**:
  - Historical aggregators list chain ID 5656 while official QIE V3 documentation defines the canonical V3 chain ID; resolved by treating canonical V3 as Mainnet and 5656 as deprecated pre-V3.
- **Sources**:
  - [S03: Published QIE EVM network settings](https://docs.qie.digital/getting-started-with-qie-blockchain/4.-access-mainnet-or-testnet)
  - [S10: QIE Wallet Integration Guide for Websites](https://docs.qie.digital/qie-wallet-integration-guide-for-websites.md)

### contract-deploy: foundry — deploy_contract

- **Stored Status**: `UNKNOWN`
- **Effective Status**: `UNKNOWN` — Stored evidence level; no live check or evidence promotion.
- **Network Scope**: qie-mainnet, qie-testnet
- **Tool Version**: `UNKNOWN`
- **Evidence Type**: `null`
- **Checked At**: `UNKNOWN`
- **Limitations & Prerequisites**:
  - Official builder guidance mentions Foundry; no QIE build or deployment was executed.
- **Sources**:
  - [S01: Official ecosystem discovery and builder entry points](https://hackathon.qie.digital/)
  - [S08: QIE admin organization repositories](https://github.com/qieadmin)

### dex-swap: qiedex — swap

- **Stored Status**: `UNKNOWN`
- **Effective Status**: `UNKNOWN` — Stored evidence level; no live check or evidence promotion.
- **Network Scope**: qie-mainnet, qie-testnet
- **Tool Version**: `UNKNOWN`
- **Evidence Type**: `null`
- **Checked At**: `UNKNOWN`
- **Limitations & Prerequisites**:
  - Canonical router addresses, ABI, liquidity and executable swap path are unknown.
- **Sources**:
  - [S01: Official ecosystem discovery and builder entry points](https://hackathon.qie.digital/)

### explorer-verification-api: qie-explorer — verify_contract_api

- **Stored Status**: `UNKNOWN`
- **Effective Status**: `UNKNOWN` — Stored evidence level; no live check or evidence promotion.
- **Network Scope**: qie-mainnet, qie-testnet
- **Tool Version**: `UNKNOWN`
- **Evidence Type**: `null`
- **Checked At**: `UNKNOWN`
- **Limitations & Prerequisites**:
  - Post-deployment docs mention explorer verification, but programmatic verification API, endpoint, and tool plugins (e.g. hardhat-verify, forge verify-contract) are not documented or confirmed.
- **Sources**:
  - [S00: QIE documentation overview](https://docs.qie.digital/)

### hardhat-deploy: hardhat — deploy_contract

- **Stored Status**: `DOCUMENTED`
- **Effective Status**: `DOCUMENTED` — Stored evidence level; no live check or evidence promotion.
- **Network Scope**: qie-mainnet
- **Tool Version**: `UNKNOWN`
- **Evidence Type**: `OFFICIAL_DOC`
- **Checked At**: `UNKNOWN`
- **Limitations & Prerequisites**:
  - Official developer docs document Hardhat configuration for QIE Mainnet with Solidity 0.8.20 and JSON-RPC URL; live network execution not run.
- **Sources**:
  - [S11: Deploy Smart Contract Using Hardhat on QIE](https://docs.qie.digital/developer-docs/smart-contract-deployment/deploy-using-hardhat.md)

### identity-auth: qie-pass — authenticate

- **Stored Status**: `UNKNOWN`
- **Effective Status**: `UNKNOWN` — Stored evidence level; no live check or evidence promotion.
- **Network Scope**: qie-mainnet, qie-testnet
- **Tool Version**: `UNKNOWN`
- **Evidence Type**: `null`
- **Checked At**: `UNKNOWN`
- **Limitations & Prerequisites**:
  - Product is mentioned publicly; production SDK, API, and authentication flow are not confirmed.
- **Sources**:
  - [S01: Official ecosystem discovery and builder entry points](https://hackathon.qie.digital/)

### indexer-query: unidentified-indexer — query_events

- **Stored Status**: `UNKNOWN`
- **Effective Status**: `UNKNOWN` — Stored evidence level; no live check or evidence promotion.
- **Network Scope**: unscoped (network unknown)
- **Tool Version**: `UNKNOWN`
- **Evidence Type**: `null`
- **Checked At**: `UNKNOWN`
- **Limitations & Prerequisites**:
  - No QIE-specific indexer provider, supported network, API, or version has been confirmed.
- **Sources**:
  - [S00: QIE documentation overview](https://docs.qie.digital/)
  - [S09: QIE blockchain repository entry point](https://github.com/qie-blockchain)

### legacy-chain-5656: qie-legacy — evm_connect_chain_5656

- **Stored Status**: `DEPRECATED`
- **Effective Status**: `DEPRECATED` — Stored blocking or retired evidence state.
- **Network Scope**: qie-mainnet
- **Tool Version**: `UNKNOWN`
- **Evidence Type**: `OFFICIAL_DOC`
- **Checked At**: `UNKNOWN`
- **Limitations & Prerequisites**:
  - Pre-V3 chain ID 5656 is deprecated; official wallet guide explicitly warns not to use it, as current QIE V3 Mainnet uses the canonical V3 chain ID.
- **Sources**:
  - [S10: QIE Wallet Integration Guide for Websites](https://docs.qie.digital/qie-wallet-integration-guide-for-websites.md)

### legacy-chain-9731: qie-legacy — evm_connect_chain_9731

- **Stored Status**: `DEPRECATED`
- **Effective Status**: `DEPRECATED` — Stored blocking or retired evidence state.
- **Network Scope**: qie-mainnet
- **Tool Version**: `UNKNOWN`
- **Evidence Type**: `OFFICIAL_DOC`
- **Checked At**: `UNKNOWN`
- **Limitations & Prerequisites**:
  - Legacy chain ID 9731 is deprecated; official wallet guide explicitly warns not to use it, as current QIE V3 Mainnet uses the canonical V3 chain ID.
- **Sources**:
  - [S10: QIE Wallet Integration Guide for Websites](https://docs.qie.digital/qie-wallet-integration-guide-for-websites.md)

### native-delegate: qie-native — delegate_native

- **Stored Status**: `UNKNOWN`
- **Effective Status**: `UNKNOWN` — Stored evidence level; no live check or evidence promotion.
- **Network Scope**: unscoped (network unknown)
- **Tool Version**: `UNKNOWN`
- **Evidence Type**: `null`
- **Checked At**: `UNKNOWN`
- **Limitations & Prerequisites**:
  - Current native CLI release, account mapping and delegation commands are not established.
- **Sources**:
  - [S04: QIE V3 architecture overview](https://docs.qie.digital/what-is-qie/qie-v3-key-features)
  - [S09: QIE blockchain repository entry point](https://github.com/qie-blockchain)

### qie-bridge-web: qie-bridge — bridge_assets_web

- **Stored Status**: `CLAIMED`
- **Effective Status**: `CLAIMED` — Stored evidence level; no live check or evidence promotion.
- **Network Scope**: qie-mainnet
- **Tool Version**: `UNKNOWN`
- **Evidence Type**: `OFFICIAL_DOC`
- **Checked At**: `UNKNOWN`
- **Limitations & Prerequisites**:
  - Web bridge interface hosted at bridge.qie.digital connects QIE, Ethereum, and BSC; programmatic smart contract API and relayer architecture are unknown.
- **Sources**:
  - [S18: QIE Official Ecosystem and dApp Directory](https://qie.digital/)

### qie-oracle-price-feed: qie-oracle — read_price_feed

- **Stored Status**: `DOCUMENTED`
- **Effective Status**: `DOCUMENTED` — Stored evidence level; no live check or evidence promotion.
- **Network Scope**: qie-mainnet
- **Tool Version**: `UNKNOWN`
- **Evidence Type**: `OFFICIAL_DOC`
- **Checked At**: `UNKNOWN`
- **Limitations & Prerequisites**:
  - Deployed contract table and Solidity query example are officially documented for BTC, ETH, XRP, SOL, QIE, XAUt, BNB on Layer 1; address identity is not verified on-chain, and address records remain UNKNOWN.
- **Sources**:
  - [S12: QIE Oracle Deployed Contracts and Asset Mapping](https://docs.qie.digital/qie-oracle/deployed-contracts/table-of-assets-contract-mapping.md)

### qied-gov-submit: qied — submit_governance_proposal

- **Stored Status**: `DOCUMENTED`
- **Effective Status**: `DOCUMENTED` — Stored evidence level; no live check or evidence promotion.
- **Network Scope**: qie-mainnet
- **Tool Version**: `v4`
- **Evidence Type**: `OFFICIAL_DOC`
- **Checked At**: `UNKNOWN`
- **Limitations & Prerequisites**:
  - Official guide documents 'qied tx gov submit-proposal ./proposal.json --chain-id <native-chain-id>'; requires 10,000 QIE minimum deposit in aqie units.
- **Sources**:
  - [S14: QIE V3 Blockchain Governance Step-by-Step Guide](https://docs.qie.digital/what-are-validators/qie-blockchain-governance-step-by-step-guide.md)
  - [S15: QIE Cosmos Chain Registry Configuration](https://raw.githubusercontent.com/qieadmin/chain-registry/master/qie/chain.json)

### qied-staking-delegate: qied — delegate_native

- **Stored Status**: `DOCUMENTED`
- **Effective Status**: `DOCUMENTED` — Stored evidence level; no live check or evidence promotion.
- **Network Scope**: qie-mainnet
- **Tool Version**: `v4`
- **Evidence Type**: `OFFICIAL_DOC`
- **Checked At**: `UNKNOWN`
- **Limitations & Prerequisites**:
  - Official guide documents 'qied tx staking delegate <validator> <amount>aqie --chain-id <native-chain-id>'; operates on native Cosmos layer, not EVM smart contracts.
- **Sources**:
  - [S13: QIE V3 Native Delegation and Staking Guide](https://docs.qie.digital/delegators-in-qie-v3/how-to-delegate-qie-coins-and-earn-rewards.md)
  - [S15: QIE Cosmos Chain Registry Configuration](https://raw.githubusercontent.com/qieadmin/chain-registry/master/qie/chain.json)

### qiedex-web-swap: qiedex — swap_web

- **Stored Status**: `CLAIMED`
- **Effective Status**: `CLAIMED` — Stored evidence level; no live check or evidence promotion.
- **Network Scope**: qie-mainnet
- **Tool Version**: `UNKNOWN`
- **Evidence Type**: `OFFICIAL_DOC`
- **Checked At**: `UNKNOWN`
- **Limitations & Prerequisites**:
  - Web exchange UI hosted at dex.qie.digital; smart contract router, factory, and liquidity pool addresses are unconfirmed and must not be guessed.
- **Sources**:
  - [S18: QIE Official Ecosystem and dApp Directory](https://qie.digital/)

### qiewallet-disconnect-event: qie-wallet — listen_disconnect_event

- **Stored Status**: `UNSUPPORTED`
- **Effective Status**: `UNSUPPORTED` — Stored blocking or retired evidence state.
- **Network Scope**: qie-mainnet, qie-testnet
- **Tool Version**: `4.2.2`
- **Evidence Type**: `OFFICIAL_DOC`
- **Checked At**: `UNKNOWN`
- **Limitations & Prerequisites**:
  - Official integration guide explicitly warns that QIE Wallet never emits the 'disconnect' event; site disconnection arrives solely as 'accountsChanged' with an empty array.
- **Sources**:
  - [S10: QIE Wallet Integration Guide for Websites](https://docs.qie.digital/qie-wallet-integration-guide-for-websites.md)

### qiewallet-eip1193-connect: qie-wallet — connect_eip1193

- **Stored Status**: `DOCUMENTED`
- **Effective Status**: `DOCUMENTED` — Stored evidence level; no live check or evidence promotion.
- **Network Scope**: qie-mainnet, qie-testnet
- **Tool Version**: `4.2.2`
- **Evidence Type**: `OFFICIAL_DOC`
- **Checked At**: `UNKNOWN`
- **Limitations & Prerequisites**:
  - Official guide documents EIP-1193 provider injection, EIP-6963 discovery with rdns 'me.qiewallet', and 'window.qie'; live browser extension connection untested in this environment.
- **Sources**:
  - [S10: QIE Wallet Integration Guide for Websites](https://docs.qie.digital/qie-wallet-integration-guide-for-websites.md)

### qiewallet-non-evm-eip1193: qie-wallet — access_non_evm_via_eip1193

- **Stored Status**: `UNSUPPORTED`
- **Effective Status**: `UNSUPPORTED` — Stored blocking or retired evidence state.
- **Network Scope**: qie-mainnet, qie-testnet
- **Tool Version**: `4.2.2`
- **Evidence Type**: `OFFICIAL_DOC`
- **Checked At**: `UNKNOWN`
- **Limitations & Prerequisites**:
  - Official integration guide explicitly states non-EVM accounts (Bitcoin, Solana) in QIE Wallet are not exposed through the EIP-1193 provider.
- **Sources**:
  - [S10: QIE Wallet Integration Guide for Websites](https://docs.qie.digital/qie-wallet-integration-guide-for-websites.md)

### qiewallet-switch-chain: qie-wallet — switch_chain

- **Stored Status**: `DOCUMENTED`
- **Effective Status**: `DOCUMENTED` — Stored evidence level; no live check or evidence promotion.
- **Network Scope**: qie-mainnet, qie-testnet
- **Tool Version**: `4.2.2`
- **Evidence Type**: `OFFICIAL_DOC`
- **Checked At**: `UNKNOWN`
- **Limitations & Prerequisites**:
  - Documented via wallet_switchEthereumChain (0x7C6 for mainnet, 0x7BF for testnet). Switching to testnet returns error 4902 unless the user has manually enabled the testnet toggle in wallet settings.
- **Sources**:
  - [S10: QIE Wallet Integration Guide for Websites](https://docs.qie.digital/qie-wallet-integration-guide-for-websites.md)

### remix-deploy: remix — deploy_via_injected_provider

- **Stored Status**: `DOCUMENTED`
- **Effective Status**: `DOCUMENTED` — Stored evidence level; no live check or evidence promotion.
- **Network Scope**: qie-mainnet
- **Tool Version**: `UNKNOWN`
- **Evidence Type**: `OFFICIAL_DOC`
- **Checked At**: `UNKNOWN`
- **Limitations & Prerequisites**:
  - Official Remix guide documents deployment through the 'Injected Web3' environment with MetaMask on the QIE network; browser environment and manual wallet approval required, and no EVM compiler target is specified by the guide.
- **Sources**:
  - [S21: Deploy Smart Contract Using Remix on QIE](https://docs.qie.digital/developer-docs/smart-contract-deployment/deploy-using-remix.md)

### rpc-identity: qie-rpc — read_chain_identity

- **Stored Status**: `UNKNOWN`
- **Effective Status**: `UNKNOWN` — Stored evidence level; no live check or evidence promotion.
- **Network Scope**: qie-mainnet, qie-testnet
- **Tool Version**: `UNKNOWN`
- **Evidence Type**: `null`
- **Checked At**: `UNKNOWN`
- **Limitations & Prerequisites**:
  - Listed endpoints have not been contacted; JSON-RPC availability and chain identity are unknown.
- **Sources**:
  - [S03: Published QIE EVM network settings](https://docs.qie.digital/getting-started-with-qie-blockchain/4.-access-mainnet-or-testnet)

### viem-custom-chain: viem — define_chain

- **Stored Status**: `DOCUMENTED`
- **Effective Status**: `DOCUMENTED` — Stored evidence level; no live check or evidence promotion.
- **Network Scope**: qie-mainnet
- **Tool Version**: `UNKNOWN`
- **Evidence Type**: `OFFICIAL_DOC`
- **Checked At**: `UNKNOWN`
- **Limitations & Prerequisites**:
  - Official guide documents viem custom chain definition with canonical mainnet chain ID, rpcUrls, and explorer; live RPC call through viem transport untested on active chain.
- **Sources**:
  - [S10: QIE Wallet Integration Guide for Websites](https://docs.qie.digital/qie-wallet-integration-guide-for-websites.md)

### wagmi-injected: wagmi — injected_connector

- **Stored Status**: `DOCUMENTED`
- **Effective Status**: `DOCUMENTED` — Stored evidence level; no live check or evidence promotion.
- **Network Scope**: qie-mainnet
- **Tool Version**: `UNKNOWN`
- **Evidence Type**: `OFFICIAL_DOC`
- **Checked At**: `UNKNOWN`
- **Limitations & Prerequisites**:
  - Documented via wagmi injected() connector utilizing EIP-6963 discovery for QIE Wallet; React runtime untested in this environment.
- **Sources**:
  - [S10: QIE Wallet Integration Guide for Websites](https://docs.qie.digital/qie-wallet-integration-guide-for-websites.md)

### wallet-connect: external-evm-wallet — connect_external_wallet

- **Stored Status**: `UNKNOWN`
- **Effective Status**: `UNKNOWN` — Stored evidence level; no live check or evidence promotion.
- **Network Scope**: qie-mainnet, qie-testnet
- **Tool Version**: `UNKNOWN`
- **Evidence Type**: `null`
- **Checked At**: `UNKNOWN`
- **Limitations & Prerequisites**:
  - No wallet, connector version, or QIE transaction flow has been tested.
- **Sources**:
  - [S01: Official ecosystem discovery and builder entry points](https://hackathon.qie.digital/)

## Evidence Freshness

Effective statuses above were evaluated at the release build clock recorded in [Release information](release-info.md). When capability status is `UNKNOWN` or effective status is `STALE`, coding agents must refuse to treat the operation as supported and guide the developer through testnet verification.
