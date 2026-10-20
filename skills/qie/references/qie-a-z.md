<!-- GENERATED — DO NOT EDIT. Change canonical authoring or knowledge. -->

# QIE A–Z coverage map

This map is navigation derived from the canonical catalogue, not tested support. Statuses use the canonical vocabulary (VERIFIED, DOCUMENTED, CLAIMED, UNKNOWN, CONFLICTED, STALE, UNSUPPORTED, DEPRECATED) and never upgrade because this file exists. A skill labelled `published in this release` is an installable release artifact that may still be missing from the local installation; a skill labelled `catalogued; not published in this release` or `planned; not a published artifact` is NOT installable and must never be offered as a release artifact or read as a local path.

## Domains

## D01 — Fundamentals and architecture

- User intents: Understand EVM versus native QIE
- Navigation scope: qie-mainnet, qie-testnet, qie-native
- Coverage level: NAVIGATION; verification status: DOCUMENTED
- Entry skill: `qie` (published in this release); planned skill: same as entry skill
- Sources: [S00: QIE documentation overview](https://docs.qie.digital/) (T1); [S04: QIE V3 architecture overview](https://docs.qie.digital/what-is-qie/qie-v3-key-features) (T1)
- Known gaps:
  - Detailed architecture and native account procedures require technical release evidence.

## D02 — Networks and RPC

- User intents: Choose an explicit network; Inspect published RPC settings
- Navigation scope: qie-mainnet, qie-testnet
- Coverage level: LOCAL_REFERENCE; verification status: DOCUMENTED
- Entry skill: `qie-networks` (published in this release); planned skill: same as entry skill
- Sources: [S03: Published QIE EVM network settings](https://docs.qie.digital/getting-started-with-qie-blockchain/4.-access-mainnet-or-testnet) (T1)
- Known gaps:
  - Endpoint liveness, network identity, native currency decimals and RPC method limits are untested.

## D03 — Accounts and wallets

- User intents: Find a wallet connection path
- Navigation scope: qie-mainnet, qie-testnet
- Coverage level: LOCAL_REFERENCE; verification status: UNKNOWN
- Entry skill: `qie-wallets` (published in this release); planned skill: same as entry skill
- Sources: [S01: Official ecosystem discovery and builder entry points](https://hackathon.qie.digital/) (T4); [S03: Published QIE EVM network settings](https://docs.qie.digital/getting-started-with-qie-blockchain/4.-access-mainnet-or-testnet) (T1); [S04: QIE V3 architecture overview](https://docs.qie.digital/what-is-qie/qie-v3-key-features) (T1)
- Known gaps:
  - No wallet or SDK version has been exercised on QIE.

## D04 — Smart-contract development

- User intents: Find contract build and test guidance
- Navigation scope: qie-mainnet, qie-testnet
- Coverage level: LOCAL_REFERENCE; verification status: DOCUMENTED
- Entry skill: `qie-smart-contracts` (published in this release); planned skill: same as entry skill
- Sources: [S01: Official ecosystem discovery and builder entry points](https://hackathon.qie.digital/) (T4); [S08: QIE admin organization repositories](https://github.com/qieadmin) (T1); [S04: QIE V3 architecture overview](https://docs.qie.digital/what-is-qie/qie-v3-key-features) (T1)
- Known gaps:
  - Local toolchain recipe is separate from unverified QIE compiler/EVM-target support and deployment compatibility.

## D05 — Tokens and assets

- User intents: Locate token specifications and issuer addresses
- Navigation scope: qie-mainnet, qie-testnet
- Coverage level: LOCAL_REFERENCE; verification status: DOCUMENTED
- Entry skill: `qie-ecosystem` (published in this release); planned skill: same as entry skill
- Sources: [S00: QIE documentation overview](https://docs.qie.digital/) (T1); [S01: Official ecosystem discovery and builder entry points](https://hackathon.qie.digital/) (T4); [S13: QIE V3 Native Delegation and Staking Guide](https://docs.qie.digital/delegators-in-qie-v3/how-to-delegate-qie-coins-and-earn-rewards.md) (T1); [S15: QIE Cosmos Chain Registry Configuration](https://raw.githubusercontent.com/qieadmin/chain-registry/master/qie/chain.json) (T1)
- Known gaps:
  - Canonical token contract addresses and ERC-20 mappings are documented in official oracle and bridge docs, but contract addresses have not undergone on-chain identity verification and address inventory remains unverified.

## D06 — Transactions and gas

- User intents: Understand fees and transaction states
- Navigation scope: qie-mainnet, qie-testnet
- Coverage level: LOCAL_REFERENCE; verification status: UNKNOWN
- Entry skill: `qie-transactions` (published in this release); planned skill: same as entry skill
- Sources: [S03: Published QIE EVM network settings](https://docs.qie.digital/getting-started-with-qie-blockchain/4.-access-mainnet-or-testnet) (T1); [S04: QIE V3 architecture overview](https://docs.qie.digital/what-is-qie/qie-v3-key-features) (T1)
- Known gaps:
  - Fee rules, supported block tags and operational finality policy are not established.

## D07 — Frontend and full-stack

- User intents: Connect a TypeScript app to QIE
- Navigation scope: qie-mainnet, qie-testnet
- Coverage level: LOCAL_REFERENCE; verification status: UNKNOWN
- Entry skill: `qie-frontend` (published in this release); planned skill: same as entry skill
- Sources: [S01: Official ecosystem discovery and builder entry points](https://hackathon.qie.digital/) (T4); [S03: Published QIE EVM network settings](https://docs.qie.digital/getting-started-with-qie-blockchain/4.-access-mainnet-or-testnet) (T1); [S04: QIE V3 architecture overview](https://docs.qie.digital/what-is-qie/qie-v3-key-features) (T1)
- Known gaps:
  - The generic read controller is mock-tested; browser UI, actual wallet and Viem/Wagmi compatibility remain unverified.

## D08 — Ecosystem products

- User intents: Find QIE Wallet, QIE Pass and exchange products
- Navigation scope: qie-mainnet, qie-testnet
- Coverage level: LOCAL_REFERENCE; verification status: DOCUMENTED
- Entry skill: `qie-ecosystem` (published in this release); planned skill: same as entry skill
- Sources: [S01: Official ecosystem discovery and builder entry points](https://hackathon.qie.digital/) (T4); [S10: QIE Wallet Integration Guide for Websites](https://docs.qie.digital/qie-wallet-integration-guide-for-websites.md) (T1); [S11: Deploy Smart Contract Using Hardhat on QIE](https://docs.qie.digital/developer-docs/smart-contract-deployment/deploy-using-hardhat.md) (T1); [S12: QIE Oracle Deployed Contracts and Asset Mapping](https://docs.qie.digital/qie-oracle/deployed-contracts/table-of-assets-contract-mapping.md) (T1); [S16: QIE Cosmos Asset List and Precompile Specification](https://raw.githubusercontent.com/qieadmin/chain-registry/master/qie/assetlist.json) (T1); [S17: QIE Wallet Official Web Portal](https://qiewallet.me/) (T4); [S19: QIE Wallet Browser Extension Chrome Web Store Listing](https://chromewebstore.google.com/detail/qie-wallet-%E2%80%93-non-custodia/oljchdcgmibnjbbopolafbjncfhdacjb) (T2); [S20: QIE EVM Chain Registry Repository](https://github.com/qieadmin/chains) (T1)
- Known gaps:
  - QIE Wallet extension interfaces and deployment frameworks (Hardhat, Remix) are officially documented; browser extension live integration, API contract verification and automated tests remain unverified.

## D09 — DeFi and liquidity

- User intents: Find exchange interfaces and liquidity data
- Navigation scope: qie-mainnet, qie-testnet
- Coverage level: LOCAL_REFERENCE; verification status: DOCUMENTED
- Entry skill: `qie-ecosystem` (published in this release); planned skill: same as entry skill
- Sources: [S01: Official ecosystem discovery and builder entry points](https://hackathon.qie.digital/) (T4); [S14: QIE V3 Blockchain Governance Step-by-Step Guide](https://docs.qie.digital/what-are-validators/qie-blockchain-governance-step-by-step-guide.md) (T1); [S18: QIE Official Ecosystem and dApp Directory](https://qie.digital/) (T4)
- Known gaps:
  - Web swap interface is claimed at swap.dex.qie.digital and qie-lend-sdk exists on GitHub, but no published npm package, canonical router address, or factory ABI is verified.

## D10 — Indexing, data and analytics

- User intents: Find historical event access
- Navigation scope: qie-mainnet, qie-testnet
- Coverage level: NAVIGATION; verification status: UNKNOWN
- Entry skill: none in this release; planned skill: `qie-indexing` (planned; not a published artifact)
- Sources: [S00: QIE documentation overview](https://docs.qie.digital/) (T1); [S09: QIE blockchain repository entry point](https://github.com/qie-blockchain) (T1)
- Known gaps:
  - No supported indexing service or RPC historical log range has been measured.

## D11 — Native QIE and Cosmos

- User intents: Distinguish delegation from EVM contract staking
- Navigation scope: qie-native
- Coverage level: NAVIGATION; verification status: DOCUMENTED
- Entry skill: none in this release; planned skill: `qie-native` (planned; not a published artifact)
- Sources: [S04: QIE V3 architecture overview](https://docs.qie.digital/what-is-qie/qie-v3-key-features) (T1); [S09: QIE blockchain repository entry point](https://github.com/qie-blockchain) (T1); [S12: QIE Oracle Deployed Contracts and Asset Mapping](https://docs.qie.digital/qie-oracle/deployed-contracts/table-of-assets-contract-mapping.md) (T1); [S15: QIE Cosmos Chain Registry Configuration](https://raw.githubusercontent.com/qieadmin/chain-registry/master/qie/chain.json) (T1)
- Known gaps:
  - Native Cosmos chain identifier and CLI commands (qied tx staking delegate, qied tx gov submit-proposal) are documented via chain-registry and official docs; live Cosmos node connectivity and delegation execution remain unverified.

## D12 — Security and operations

- User intents: Find signing and secret-handling boundaries
- Navigation scope: general
- Coverage level: NAVIGATION; verification status: UNKNOWN
- Entry skill: `qie` (published in this release); planned skill: same as entry skill
- Sources: [S00: QIE documentation overview](https://docs.qie.digital/) (T1); [S01: Official ecosystem discovery and builder entry points](https://hackathon.qie.digital/) (T4)
- Known gaps:
  - QIE-specific operational security procedures and audited contract integrations are not validated.

## D13 — Debugging and diagnostics

- User intents: Investigate wrong-chain or unavailable RPC reports
- Navigation scope: qie-mainnet, qie-testnet
- Coverage level: LOCAL_REFERENCE; verification status: DOCUMENTED
- Entry skill: `qie-debug` (published in this release); planned skill: same as entry skill
- Sources: [S03: Published QIE EVM network settings](https://docs.qie.digital/getting-started-with-qie-blockchain/4.-access-mainnet-or-testnet) (T1); [S04: QIE V3 architecture overview](https://docs.qie.digital/what-is-qie/qie-v3-key-features) (T1)
- Known gaps:
  - Read-only diagnostics and failure branches use mocked regression evidence; actual QIE RPC behavior remains unverified.

## D14 — Deployment and production

- User intents: Find a staged contract deployment path
- Navigation scope: qie-mainnet, qie-testnet
- Coverage level: LOCAL_REFERENCE; verification status: UNKNOWN
- Entry skill: `qie-deployment` (published in this release); planned skill: same as entry skill
- Sources: [S01: Official ecosystem discovery and builder entry points](https://hackathon.qie.digital/) (T4); [S08: QIE admin organization repositories](https://github.com/qieadmin) (T1); [S04: QIE V3 architecture overview](https://docs.qie.digital/what-is-qie/qie-v3-key-features) (T1)
- Known gaps:
  - No application, deployment, explorer source-verification API or chain finality has been tested.

## D15 — Governance, ecosystem and contribution

- User intents: Locate public repositories and native governance references
- Navigation scope: general
- Coverage level: NAVIGATION; verification status: UNKNOWN
- Entry skill: none in this release; planned skill: `qie-native` (planned; not a published artifact)
- Sources: [S04: QIE V3 architecture overview](https://docs.qie.digital/what-is-qie/qie-v3-key-features) (T1); [S08: QIE admin organization repositories](https://github.com/qieadmin) (T1); [S09: QIE blockchain repository entry point](https://github.com/qie-blockchain) (T1)
- Known gaps:
  - Governance interface, current proposals and maintainer ownership are not confirmed.

## Catalogued capabilities

### bridge-transfer: unidentified-bridge — bridge_assets

- Effective status: **UNKNOWN** (stored: UNKNOWN); networks: unscoped (network unknown); tool version: UNKNOWN
- Limitations:
  - Architecture references interoperability; no operational bridge interface or trust model is verified.

### chain-id-5656-conflict: qie-legacy — resolve_mainnet_chain_id

- Effective status: **CONFLICTED** (stored: CONFLICTED); networks: qie-mainnet; tool version: UNKNOWN
- Limitations:
  - Historical aggregators list chain ID 5656 while official QIE V3 documentation defines the canonical V3 chain ID; resolved by treating canonical V3 as Mainnet and 5656 as deprecated pre-V3.

### contract-deploy: foundry — deploy_contract

- Effective status: **UNKNOWN** (stored: UNKNOWN); networks: qie-mainnet, qie-testnet; tool version: UNKNOWN
- Limitations:
  - Official builder guidance mentions Foundry; no QIE build or deployment was executed.

### dex-swap: qiedex — swap

- Effective status: **UNKNOWN** (stored: UNKNOWN); networks: qie-mainnet, qie-testnet; tool version: UNKNOWN
- Limitations:
  - Canonical router addresses, ABI, liquidity and executable swap path are unknown.

### explorer-verification-api: qie-explorer — verify_contract_api

- Effective status: **UNKNOWN** (stored: UNKNOWN); networks: qie-mainnet, qie-testnet; tool version: UNKNOWN
- Limitations:
  - Post-deployment docs mention explorer verification, but programmatic verification API, endpoint, and tool plugins (e.g. hardhat-verify, forge verify-contract) are not documented or confirmed.

### hardhat-deploy: hardhat — deploy_contract

- Effective status: **DOCUMENTED** (stored: DOCUMENTED); networks: qie-mainnet; tool version: UNKNOWN
- Limitations:
  - Official developer docs document Hardhat configuration for QIE Mainnet with Solidity 0.8.20 and JSON-RPC URL; live network execution not run.

### identity-auth: qie-pass — authenticate

- Effective status: **UNKNOWN** (stored: UNKNOWN); networks: qie-mainnet, qie-testnet; tool version: UNKNOWN
- Limitations:
  - Product is mentioned publicly; production SDK, API, and authentication flow are not confirmed.

### indexer-query: unidentified-indexer — query_events

- Effective status: **UNKNOWN** (stored: UNKNOWN); networks: unscoped (network unknown); tool version: UNKNOWN
- Limitations:
  - No QIE-specific indexer provider, supported network, API, or version has been confirmed.

### legacy-chain-5656: qie-legacy — evm_connect_chain_5656

- Effective status: **DEPRECATED** (stored: DEPRECATED); networks: qie-mainnet; tool version: UNKNOWN
- Limitations:
  - Pre-V3 chain ID 5656 is deprecated; official wallet guide explicitly warns not to use it, as current QIE V3 Mainnet uses the canonical V3 chain ID.

### legacy-chain-9731: qie-legacy — evm_connect_chain_9731

- Effective status: **DEPRECATED** (stored: DEPRECATED); networks: qie-mainnet; tool version: UNKNOWN
- Limitations:
  - Legacy chain ID 9731 is deprecated; official wallet guide explicitly warns not to use it, as current QIE V3 Mainnet uses the canonical V3 chain ID.

### native-delegate: qie-native — delegate_native

- Effective status: **UNKNOWN** (stored: UNKNOWN); networks: unscoped (network unknown); tool version: UNKNOWN
- Limitations:
  - Current native CLI release, account mapping and delegation commands are not established.

### qie-bridge-web: qie-bridge — bridge_assets_web

- Effective status: **CLAIMED** (stored: CLAIMED); networks: qie-mainnet; tool version: UNKNOWN
- Limitations:
  - Web bridge interface hosted at bridge.qie.digital connects QIE, Ethereum, and BSC; programmatic smart contract API and relayer architecture are unknown.

### qie-oracle-price-feed: qie-oracle — read_price_feed

- Effective status: **DOCUMENTED** (stored: DOCUMENTED); networks: qie-mainnet; tool version: UNKNOWN
- Limitations:
  - Deployed contract table and Solidity query example are officially documented for BTC, ETH, XRP, SOL, QIE, XAUt, BNB on Layer 1; address identity is not verified on-chain, and address records remain UNKNOWN.

### qied-gov-submit: qied — submit_governance_proposal

- Effective status: **DOCUMENTED** (stored: DOCUMENTED); networks: qie-mainnet; tool version: v4
- Limitations:
  - Official guide documents 'qied tx gov submit-proposal ./proposal.json --chain-id <native-chain-id>'; requires 10,000 QIE minimum deposit in aqie units.

### qied-staking-delegate: qied — delegate_native

- Effective status: **DOCUMENTED** (stored: DOCUMENTED); networks: qie-mainnet; tool version: v4
- Limitations:
  - Official guide documents 'qied tx staking delegate <validator> <amount>aqie --chain-id <native-chain-id>'; operates on native Cosmos layer, not EVM smart contracts.

### qiedex-web-swap: qiedex — swap_web

- Effective status: **CLAIMED** (stored: CLAIMED); networks: qie-mainnet; tool version: UNKNOWN
- Limitations:
  - Web exchange UI hosted at dex.qie.digital; smart contract router, factory, and liquidity pool addresses are unconfirmed and must not be guessed.

### qiewallet-disconnect-event: qie-wallet — listen_disconnect_event

- Effective status: **UNSUPPORTED** (stored: UNSUPPORTED); networks: qie-mainnet, qie-testnet; tool version: 4.2.2
- Limitations:
  - Official integration guide explicitly warns that QIE Wallet never emits the 'disconnect' event; site disconnection arrives solely as 'accountsChanged' with an empty array.

### qiewallet-eip1193-connect: qie-wallet — connect_eip1193

- Effective status: **DOCUMENTED** (stored: DOCUMENTED); networks: qie-mainnet, qie-testnet; tool version: 4.2.2
- Limitations:
  - Official guide documents EIP-1193 provider injection, EIP-6963 discovery with rdns 'me.qiewallet', and 'window.qie'; live browser extension connection untested in this environment.

### qiewallet-non-evm-eip1193: qie-wallet — access_non_evm_via_eip1193

- Effective status: **UNSUPPORTED** (stored: UNSUPPORTED); networks: qie-mainnet, qie-testnet; tool version: 4.2.2
- Limitations:
  - Official integration guide explicitly states non-EVM accounts (Bitcoin, Solana) in QIE Wallet are not exposed through the EIP-1193 provider.

### qiewallet-switch-chain: qie-wallet — switch_chain

- Effective status: **DOCUMENTED** (stored: DOCUMENTED); networks: qie-mainnet, qie-testnet; tool version: 4.2.2
- Limitations:
  - Documented via wallet_switchEthereumChain (0x7C6 for mainnet, 0x7BF for testnet). Switching to testnet returns error 4902 unless the user has manually enabled the testnet toggle in wallet settings.

### remix-deploy: remix — deploy_via_injected_provider

- Effective status: **DOCUMENTED** (stored: DOCUMENTED); networks: qie-mainnet; tool version: UNKNOWN
- Limitations:
  - Official Remix guide documents deployment through the 'Injected Web3' environment with MetaMask on the QIE network; browser environment and manual wallet approval required, and no EVM compiler target is specified by the guide.

### rpc-identity: qie-rpc — read_chain_identity

- Effective status: **UNKNOWN** (stored: UNKNOWN); networks: qie-mainnet, qie-testnet; tool version: UNKNOWN
- Limitations:
  - Listed endpoints have not been contacted; JSON-RPC availability and chain identity are unknown.

### viem-custom-chain: viem — define_chain

- Effective status: **DOCUMENTED** (stored: DOCUMENTED); networks: qie-mainnet; tool version: UNKNOWN
- Limitations:
  - Official guide documents viem custom chain definition with canonical mainnet chain ID, rpcUrls, and explorer; live RPC call through viem transport untested on active chain.

### wagmi-injected: wagmi — injected_connector

- Effective status: **DOCUMENTED** (stored: DOCUMENTED); networks: qie-mainnet; tool version: UNKNOWN
- Limitations:
  - Documented via wagmi injected() connector utilizing EIP-6963 discovery for QIE Wallet; React runtime untested in this environment.

### wallet-connect: external-evm-wallet — connect_external_wallet

- Effective status: **UNKNOWN** (stored: UNKNOWN); networks: qie-mainnet, qie-testnet; tool version: UNKNOWN
- Limitations:
  - No wallet, connector version, or QIE transaction flow has been tested.
