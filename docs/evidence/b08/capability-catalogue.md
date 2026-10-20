<!-- GENERATED from canonical knowledge records — DO NOT EDIT. Change knowledge/capabilities.yaml and regenerate. -->

# QIE Forge B08 Capability Catalogue & Compatibility Classification

Total capabilities: 25 (derived from `knowledge/capabilities.yaml`; release `0.5.1-ecosystem.1`, schema `1.4.0`).

Status distribution (computed, not copied): `VERIFIED`: 0, `DOCUMENTED`: 9, `CLAIMED`: 2, `UNKNOWN`: 9, `CONFLICTED`: 1, `STALE`: 0, `UNSUPPORTED`: 2, `DEPRECATED`: 2.

Every capability remains non-VERIFIED: no live, reviewed, non-mock execution evidence exists in `knowledge/validation-runs.yaml` (the runtime-evidence inventory is empty).

---

## 1. Capability Breakdown

One row per canonical capability record. Tool IDs, operations, categories, network scopes, version ranges, statuses, evidence types, source IDs and limitations are verbatim canonical values; `null` versions and empty scopes are preserved as recorded.

| Capability ID | Tool ID | Operation | Category | Networks | Version | Status | Evidence Type | Sources | Limitations & Prerequisites |
|---|---|---|---|---|---|---|---|---|---|
| `bridge-transfer` | `unidentified-bridge` | `bridge_assets` | `bridges` | unscoped | null | `UNKNOWN` | null | S04 | Architecture references interoperability; no operational bridge interface or trust model is verified. |
| `chain-id-5656-conflict` | `qie-legacy` | `resolve_mainnet_chain_id` | `networks` | qie-mainnet | null | `CONFLICTED` | OFFICIAL_DOC | S03, S10 | Historical aggregators list chain ID 5656 while official QIE V3 documentation defines the canonical V3 chain ID; resolved by treating canonical V3 as Mainnet and 5656 as deprecated pre-V3. |
| `contract-deploy` | `foundry` | `deploy_contract` | `frameworks` | qie-mainnet, qie-testnet | null | `UNKNOWN` | null | S01, S08 | Official builder guidance mentions Foundry; no QIE build or deployment was executed. |
| `dex-swap` | `qiedex` | `swap` | `defi` | qie-mainnet, qie-testnet | null | `UNKNOWN` | null | S01 | Canonical router addresses, ABI, liquidity and executable swap path are unknown. |
| `explorer-verification-api` | `qie-explorer` | `verify_contract_api` | `explorers` | qie-mainnet, qie-testnet | null | `UNKNOWN` | null | S00 | Post-deployment docs mention explorer verification, but programmatic verification API, endpoint, and tool plugins (e.g. hardhat-verify, forge verify-contract) are not documented or confirmed. |
| `hardhat-deploy` | `hardhat` | `deploy_contract` | `frameworks` | qie-mainnet | null | `DOCUMENTED` | OFFICIAL_DOC | S11 | Official developer docs document Hardhat configuration for QIE Mainnet with Solidity 0.8.20 and JSON-RPC URL; live network execution not run. |
| `identity-auth` | `qie-pass` | `authenticate` | `identity` | qie-mainnet, qie-testnet | null | `UNKNOWN` | null | S01 | Product is mentioned publicly; production SDK, API, and authentication flow are not confirmed. |
| `indexer-query` | `unidentified-indexer` | `query_events` | `indexing` | unscoped | null | `UNKNOWN` | null | S00, S09 | No QIE-specific indexer provider, supported network, API, or version has been confirmed. |
| `legacy-chain-5656` | `qie-legacy` | `evm_connect_chain_5656` | `networks` | qie-mainnet | null | `DEPRECATED` | OFFICIAL_DOC | S10 | Pre-V3 chain ID 5656 is deprecated; official wallet guide explicitly warns not to use it, as current QIE V3 Mainnet uses the canonical V3 chain ID. |
| `legacy-chain-9731` | `qie-legacy` | `evm_connect_chain_9731` | `networks` | qie-mainnet | null | `DEPRECATED` | OFFICIAL_DOC | S10 | Legacy chain ID 9731 is deprecated; official wallet guide explicitly warns not to use it, as current QIE V3 Mainnet uses the canonical V3 chain ID. |
| `native-delegate` | `qie-native` | `delegate_native` | `native-cosmos` | unscoped | null | `UNKNOWN` | null | S04, S09 | Current native CLI release, account mapping and delegation commands are not established. |
| `qie-bridge-web` | `qie-bridge` | `bridge_assets_web` | `bridges` | qie-mainnet | null | `CLAIMED` | OFFICIAL_DOC | S18 | Web bridge interface hosted at bridge.qie.digital connects QIE, Ethereum, and BSC; programmatic smart contract API and relayer architecture are unknown. |
| `qie-oracle-price-feed` | `qie-oracle` | `read_price_feed` | `oracles` | qie-mainnet | null | `DOCUMENTED` | OFFICIAL_DOC | S12 | Deployed contract table and Solidity query example are officially documented for BTC, ETH, XRP, SOL, QIE, XAUt, BNB on Layer 1; address identity is not verified on-chain, and address records remain UNKNOWN. |
| `qied-gov-submit` | `qied` | `submit_governance_proposal` | `native-cosmos` | qie-mainnet | v4 | `DOCUMENTED` | OFFICIAL_DOC | S14, S15 | Official guide documents 'qied tx gov submit-proposal ./proposal.json --chain-id <native-chain-id>'; requires 10,000 QIE minimum deposit in aqie units. |
| `qied-staking-delegate` | `qied` | `delegate_native` | `native-cosmos` | qie-mainnet | v4 | `DOCUMENTED` | OFFICIAL_DOC | S13, S15 | Official guide documents 'qied tx staking delegate <validator> <amount>aqie --chain-id <native-chain-id>'; operates on native Cosmos layer, not EVM smart contracts. |
| `qiedex-web-swap` | `qiedex` | `swap_web` | `defi` | qie-mainnet | null | `CLAIMED` | OFFICIAL_DOC | S18 | Web exchange UI hosted at dex.qie.digital; smart contract router, factory, and liquidity pool addresses are unconfirmed and must not be guessed. |
| `qiewallet-disconnect-event` | `qie-wallet` | `listen_disconnect_event` | `wallets` | qie-mainnet, qie-testnet | 4.2.2 | `UNSUPPORTED` | OFFICIAL_DOC | S10 | Official integration guide explicitly warns that QIE Wallet never emits the 'disconnect' event; site disconnection arrives solely as 'accountsChanged' with an empty array. |
| `qiewallet-eip1193-connect` | `qie-wallet` | `connect_eip1193` | `wallets` | qie-mainnet, qie-testnet | 4.2.2 | `DOCUMENTED` | OFFICIAL_DOC | S10 | Official guide documents EIP-1193 provider injection, EIP-6963 discovery with rdns 'me.qiewallet', and 'window.qie'; live browser extension connection untested in this environment. |
| `qiewallet-non-evm-eip1193` | `qie-wallet` | `access_non_evm_via_eip1193` | `wallets` | qie-mainnet, qie-testnet | 4.2.2 | `UNSUPPORTED` | OFFICIAL_DOC | S10 | Official integration guide explicitly states non-EVM accounts (Bitcoin, Solana) in QIE Wallet are not exposed through the EIP-1193 provider. |
| `qiewallet-switch-chain` | `qie-wallet` | `switch_chain` | `wallets` | qie-mainnet, qie-testnet | 4.2.2 | `DOCUMENTED` | OFFICIAL_DOC | S10 | Documented via wallet_switchEthereumChain (0x7C6 for mainnet, 0x7BF for testnet). Switching to testnet returns error 4902 unless the user has manually enabled the testnet toggle in wallet settings. |
| `remix-deploy` | `remix` | `deploy_via_injected_provider` | `frameworks` | qie-mainnet | null | `DOCUMENTED` | OFFICIAL_DOC | S21 | Official Remix guide documents deployment through the 'Injected Web3' environment with MetaMask on the QIE network; browser environment and manual wallet approval required, and no EVM compiler target is specified by the guide. |
| `rpc-identity` | `qie-rpc` | `read_chain_identity` | `networks` | qie-mainnet, qie-testnet | null | `UNKNOWN` | null | S03 | Listed endpoints have not been contacted; JSON-RPC availability and chain identity are unknown. |
| `viem-custom-chain` | `viem` | `define_chain` | `wallets` | qie-mainnet | null | `DOCUMENTED` | OFFICIAL_DOC | S10 | Official guide documents viem custom chain definition with canonical mainnet chain ID, rpcUrls, and explorer; live RPC call through viem transport untested on active chain. |
| `wagmi-injected` | `wagmi` | `injected_connector` | `wallets` | qie-mainnet | null | `DOCUMENTED` | OFFICIAL_DOC | S10 | Documented via wagmi injected() connector utilizing EIP-6963 discovery for QIE Wallet; React runtime untested in this environment. |
| `wallet-connect` | `external-evm-wallet` | `connect_external_wallet` | `wallets` | qie-mainnet, qie-testnet | null | `UNKNOWN` | null | S01 | No wallet, connector version, or QIE transaction flow has been tested. |

## 2. Category Distribution

Category membership is the explicit canonical `category` field on each capability record.

| Category | Title | Capabilities | Status summary |
|---|---|---|---|
| `bridges` | Cross-Chain Bridges & Conversion | 2 | `CLAIMED`: 1, `UNKNOWN`: 1 |
| `defi` | Decentralized Finance & Swaps | 2 | `CLAIMED`: 1, `UNKNOWN`: 1 |
| `explorers` | Explorers & Contract Verification | 1 | `UNKNOWN`: 1 |
| `frameworks` | Smart Contract Development & Deployment | 3 | `DOCUMENTED`: 2, `UNKNOWN`: 1 |
| `identity` | Identity & Authentication | 1 | `UNKNOWN`: 1 |
| `indexing` | Indexing & Historical Data | 1 | `UNKNOWN`: 1 |
| `native-cosmos` | Native Cosmos & Validator Operations | 3 | `DOCUMENTED`: 2, `UNKNOWN`: 1 |
| `networks` | Networks & Chain Identity | 4 | `UNKNOWN`: 1, `CONFLICTED`: 1, `DEPRECATED`: 2 |
| `oracles` | Oracles & Asset Feeds | 1 | `DOCUMENTED`: 1 |
| `wallets` | Wallets & Injected Providers | 7 | `DOCUMENTED`: 4, `UNKNOWN`: 1, `UNSUPPORTED`: 2 |

## 3. Granularity & Integrity Compliance

- **Tool/Product + Version + Operation + Network + Evidence**: every row evaluates exactly one atomic operation for one tool; no blanket product verdict exists.
- **Status vocabulary**: only the canonical enum values are used, and they are never upgraded by this document.
- **Versions**: `null` is preserved where the canonical record has no reviewed version evidence; no version range is invented.
- **Sources**: every listed source ID resolves against `knowledge/sources.yaml`; per-claim citations live in the canonical records, not here.
- **Address identity**: the canonical address inventory is empty; no contract address is published or recommended by this catalogue, and bytecode or explorer listings never establish issuer/ABI/product identity.
- **Evidence separation**: documentation evidence, mocked/local testing, and live QIE Mainnet verification are distinct classes; this catalogue contains documentation evidence only.
