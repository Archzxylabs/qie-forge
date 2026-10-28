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

## Protocol, SDK and Product Integration Records

These records preserve useful implementation details without promoting their addresses or write operations. Every record is scoped to a product, operation and evidence source; `execution_allowed: false` is intentional in this release.

### QIE Bridge (`qie-bridge`)

- Entity status: **CLAIMED**; scope: qie-mainnet, general; execution allowed: `false`
- Officially branded cross-chain bridge web interface discovered for Ethereum, BSC and QIE routes; contract and relayer details remain unresolved.
- Interfaces:
- `qie-bridge-web` (WEB, CLAIMED): QIE Bridge web interface — Browser interface with route selection and transfer history surfaces.
- `qie-bridge-programmatic` (ABI, UNKNOWN): Programmatic bridge contract and relay interface — No public contract, message ID, fee or recovery interface was established in the reviewed material.
- Operations:
| Operation | Action | Status | Description | Primary limitation |
|---|---|---|---|---|
| `bridge-web-transfer` | bridge | CLAIMED | Transfer assets through web bridge | No live transfer was attempted. |
| `bridge-programmatic-transfer` | write | UNKNOWN | Execute programmatic bridge transfer | Do not synthesize bridge contracts, relay calls or refund flows. |
- Known limitations:
  - Website existence does not establish a safe programmatic bridge route or trust model.
- Unresolved questions:
  - Which source/destination chains and assets are canonical?
  - What are the lock/mint/burn/release, relayer, finality and recovery models?
- Sources: [S32: QIE Bridge web interface](https://bridge.qie.digital/), [S34: QIE ecosystem product catalogue](https://www.qie.digital/)

### QIE DEX / QIDEX (`qie-dex`)

- Entity status: **CLAIMED**; scope: qie-mainnet, general; execution allowed: `false`
- QIE DEX web product discovered through the official ecosystem surface; programmatic router identity was not established.
- Interfaces:
- `qie-dex-web` (WEB, CLAIMED): QIE Swap web interface — Browser interface exposing token, pair, swap and liquidity surfaces.
- `qie-dex-router` (ABI, UNKNOWN): Programmatic router/factory interface — No issuer-authenticated router address or ABI was found in the reviewed sources.
- Operations:
| Operation | Action | Status | Description | Primary limitation |
|---|---|---|---|---|
| `dex-web-swap` | discover | CLAIMED | Swap through web interface | Website availability is not programmatic router compatibility. |
| `dex-programmatic-swap` | write | UNKNOWN | Execute a programmatic swap | Router, factory, pair model, fee, price impact and route selection are unresolved. |
- Known limitations:
  - The reviewed web surface is a product-discovery lead and not a technical integration specification.
- Unresolved questions:
  - Are router and factory contracts published through an issuer-authenticated channel?
  - What pool, route, fee, slippage and MEV protections are supported?
- Sources: [S31: QIE DEX web interface](https://swap.dex.qie.digital/), [S34: QIE ecosystem product catalogue](https://www.qie.digital/)

### QIE Explorer (`qie-explorer`)

- Entity status: **DOCUMENTED**; scope: qie-mainnet, qie-testnet; execution allowed: `false`
- Official explorer URLs are documented; API, ABI retrieval and source-verification automation were not technically established.
- Interfaces:
- `qie-explorer-web` (WEB, DOCUMENTED): Explorer web interface — Browser destination for transaction, address and block inspection.
- `qie-explorer-api` (JSON_RPC, UNKNOWN): Programmatic explorer API — No official API endpoint or verification plugin was found in the reviewed sources.
- Operations:
| Operation | Action | Status | Description | Primary limitation |
|---|---|---|---|---|
| `explorer-transaction-lookup` | discover | DOCUMENTED | Look up a transaction in the web explorer | Explorer display is not issuer authentication, ABI correspondence or finality proof. |
| `explorer-source-verification` | prepare | UNKNOWN | Verify contract source programmatically | Do not invent Blockscout/Etherscan endpoints or CLI plugins. |
- Known limitations:
  - Explorer URLs are documented configuration, not a verified API or source-verification capability.
- Unresolved questions:
  - Is there a supported API, proxy implementation view or ABI retrieval endpoint?
- Sources: [S03: Published QIE EVM network settings](https://docs.qie.digital/getting-started-with-qie-blockchain/4.-access-mainnet-or-testnet), [S34: QIE ecosystem product catalogue](https://www.qie.digital/)

### QIE ID (`qie-id`)

- Entity status: **CLAIMED**; scope: general; execution allowed: `false`
- Official product-discovery identity service associated with human-readable .qie names and payment/address use cases.
- Interfaces:
- `qie-id-portal` (WEB, CLAIMED): QIE ID portal — Product portal and marketing surface; resolver, registry ABI and authentication endpoints were not found.
- Operations:
| Operation | Action | Status | Description | Primary limitation |
|---|---|---|---|---|
| `qie-id-resolve` | discover | UNKNOWN | Resolve a .qie identifier | No public resolver API or ABI was established. |
- Known limitations:
  - Product claims are not a technical identity-resolution interface.
- Unresolved questions:
  - What registry, resolution, ownership, revocation and network-mapping interfaces are published?
  - Are QIE Pass credentials bound to identity resolution or a separate consent flow?
- Sources: [S33: QIE ID web portal](https://id.qie.digital/), [S34: QIE ecosystem product catalogue](https://www.qie.digital/)

### QIE event indexing surface (`qie-indexing`)

- Entity status: **UNKNOWN**; scope: qie-mainnet, qie-testnet; execution allowed: `false`
- Direct JSON-RPC event reads are a generic fallback; no QIE-specific hosted indexer was substantiated in the reviewed sources.
- Interfaces:
- `qie-eth-getlogs` (JSON_RPC, UNKNOWN): eth_getLogs direct RPC query — Safe integration pattern requires explicit endpoint, bounded ranges, cursor persistence and idempotent processing.
- Operations:
| Operation | Action | Status | Description | Primary limitation |
|---|---|---|---|---|
| `indexing-direct-logs` | read | UNKNOWN | Query historical logs with eth_getLogs | Provider range, result-size and rate limits have not been measured in this release. |
- Known limitations:
  - No hosted QIE indexer or provider-specific historical query contract was confirmed.
- Unresolved questions:
  - Which indexer providers support QIE today and with what API/version scope?
- Sources: [S00: QIE documentation overview](https://docs.qie.digital/), [S09: QIE blockchain repository entry point](https://github.com/qie-blockchain)

### QIE Lending Protocol (`qie-lending-protocol`)

- Entity status: **DOCUMENTED**; scope: qie-mainnet; execution allowed: `false`
- Compound-style lending interface described by the official QIE Lending SDK with comptroller and cToken market roles.
- Interfaces:
- `qie-lending-ctoken` (ABI, DOCUMENTED): mint(uint256), borrow(uint256), repayBorrow(uint256), redeemUnderlying(uint256) — cToken function fragments shipped in the pinned SDK ABI.
- `qie-lending-comptroller` (ABI, DOCUMENTED): enterMarkets(address[]) and getAccountLiquidity(address) — Comptroller fragments used for borrow preparation and portfolio health display.
- Operations:
| Operation | Action | Status | Description | Primary limitation |
|---|---|---|---|---|
| `lending-supply` | write | DOCUMENTED | Supply an underlying asset | SDK calls approveIfNeeded and then cToken.mint without a configured receipt wait in supply.js. |
| `lending-borrow` | write | DOCUMENTED | Borrow a market asset | The SDK enters the market as a state-changing side effect before borrow simulation. |
| `lending-repay` | write | DOCUMENTED | Repay a loan | repay.js approves every time and does not wait for or validate a receipt after repayBorrow. |
| `lending-withdraw` | write | DOCUMENTED | Withdraw supplied underlying | No local simulation, allowance check or receipt wait is performed by withdraw.js. |
| `lending-read-portfolio` | read | DOCUMENTED | Read user portfolio | balanceOfUnderlying is marked nonpayable in the shipped ABI but called with staticCall. |
| `lending-read-totals` | read | DOCUMENTED | Read protocol totals | Totals sum cToken totalSupply values across markets with different decimals and do not normalize to a common denomination. |
- Known limitations:
  - Published addresses and ABI fragments are discovery evidence, not proof of current deployed compatibility.
  - Borrow and collateral safety requires live market metadata and oracle evidence not supplied by the SDK.
  - No npm registry publication was found; the README instructs GitHub installation.
- Unresolved questions:
  - Which deployment, implementation and proxy addresses are current on QIE Mainnet?
  - What are the live collateral factors, liquidation thresholds, caps, rates and oracle sources?
  - Does the deployed ABI match the shipped minimal JSON fragments?
- Sources: [S29: QIE Lending SDK pinned source tree](https://github.com/qieadmin/qie-lend-sdk/tree/21d2ef2d5c4e9ac82f7e5d72e628341bd0b15262), [S30: QIE Lending SDK market configuration at pinned commit](https://raw.githubusercontent.com/qieadmin/qie-lend-sdk/21d2ef2d5c4e9ac82f7e5d72e628341bd0b15262/config.js)

### qieadmin/qie-lend-sdk (`qie-lending-sdk`)

- Entity status: **DOCUMENTED**; scope: qie-mainnet; execution allowed: `false`
- Official CommonJS JavaScript SDK exporting LendingSDK and a static config object built on ethers v6.
- Interfaces:
- `qie-lending-sdk-export` (SDK, DOCUMENTED): require('qie-lend-sdk') -> { LendingSDK, config } — Read and write methods are thin wrappers around the shipped ABI fragments and config entries.
- Operations:
| Operation | Action | Status | Description | Primary limitation |
|---|---|---|---|---|
| `lending-sdk-read-adapter` | read | DOCUMENTED | Read through provider-only LendingSDK | The config object is static and contains address and decimal candidates that must be independently reviewed. |
- Known limitations:
  - Package metadata declares CommonJS and ethers ^6.0.0; no registry publication or lockfile was reviewed.
  - No live QIE read or write was executed.
- Unresolved questions:
  - Are all configured markets still active and correctly scaled?
  - Does the protocol expose additional metadata required for a safe dashboard?
- Sources: [S29: QIE Lending SDK pinned source tree](https://github.com/qieadmin/qie-lend-sdk/tree/21d2ef2d5c4e9ac82f7e5d72e628341bd0b15262), [S30: QIE Lending SDK market configuration at pinned commit](https://raw.githubusercontent.com/qieadmin/qie-lend-sdk/21d2ef2d5c4e9ac82f7e5d72e628341bd0b15262/config.js)

### QIE Native Cosmos layer (`qie-native-cosmos`)

- Entity status: **DOCUMENTED**; scope: qie-native, general; execution allowed: `false`
- Native Cosmos SDK layer with aqie denomination, validator delegation and governance operations distinct from EVM transactions.
- Interfaces:
- `qie-native-registry` (CLI, DOCUMENTED): qied native Cosmos interface — Registry and official guides provide native chain, denom and command-shape references.
- Operations:
| Operation | Action | Status | Description | Primary limitation |
|---|---|---|---|---|
| `native-staking-delegate` | stake | DOCUMENTED | Delegate native QIE to a validator | Native account format and current CLI release require separate environment verification. |
| `native-governance-submit` | stake | DOCUMENTED | Submit a native governance proposal | No live Cosmos node or governance execution was tested. |
- Known limitations:
  - Native registry facts and EVM chain facts must not be merged into one transaction workflow.
- Unresolved questions:
  - Which native CLI/account versions are current and compatible with the live network?
  - What IBC and conversion-precompile behavior is live and issuer-authenticated?
- Sources: [S13: QIE V3 Native Delegation and Staking Guide](https://docs.qie.digital/delegators-in-qie-v3/how-to-delegate-qie-coins-and-earn-rewards.md), [S14: QIE V3 Blockchain Governance Step-by-Step Guide](https://docs.qie.digital/what-are-validators/qie-blockchain-governance-step-by-step-guide.md), [S15: QIE Cosmos Chain Registry Configuration](https://raw.githubusercontent.com/qieadmin/chain-registry/master/qie/chain.json), [S16: QIE Cosmos Asset List and Precompile Specification](https://raw.githubusercontent.com/qieadmin/chain-registry/master/qie/assetlist.json)

### QIE Oracle (`qie-oracle`)

- Entity status: **DOCUMENTED**; scope: qie-mainnet; execution allowed: `false`
- Officially documented asset feed product with a published mapping table and AggregatorV3-style read examples.
- Interfaces:
- `qie-oracle-aggregator-v3` (ABI, DOCUMENTED): latestRoundData(), getRoundData(uint80), decimals() — Source-documented read interface for price and round metadata.
- Operations:
| Operation | Action | Status | Description | Primary limitation |
|---|---|---|---|---|
| `oracle-read-latest` | read | DOCUMENTED | Read latestRoundData | Feed addresses in the official mapping remain candidates until the shared identity gate passes. |
- Known limitations:
  - Official docs describe AggregatorV3 compatibility but no QIE runtime call or ABI/bytecode match was executed.
  - Aggregation and manipulation-resistance statements are issuer documentation, not an independent audit.
- Unresolved questions:
  - Are all mapped feed contracts current and issuer-owned on QIE Mainnet?
  - What update interval and outage fallback policy applies to each feed?
- Sources: [S12: QIE Oracle Deployed Contracts and Asset Mapping](https://docs.qie.digital/qie-oracle/deployed-contracts/table-of-assets-contract-mapping.md), [S35: QIE Oracle query examples](https://docs.qie.digital/qie-oracle/deployed-contracts/query-examples.md), [S36: QIE Oracle Solidity integration guide](https://docs.qie.digital/qie-oracle/developer-guide/how-to-integrate-qie-oracle-in-smart-contracts.md), [S37: QIE Oracle edge-case and freshness guidance](https://docs.qie.digital/qie-oracle/developer-guide/handling-edge-cases-and-best-practices.md), [S38: QIE Oracle aggregation description](https://docs.qie.digital/qie-oracle/how-qie-oracle-works/aggregation-and-validation.md)

### QIE Pass (`qie-pass`)

- Entity status: **CLAIMED**; scope: general; execution allowed: `false`
- Product-discovery identity and verification brand referenced by QIE's ecosystem site and described as part of QIE ID.
- Interfaces:
- `qie-pass-product` (WEB, CLAIMED): QIE Pass verification product — Marketing-level product reference without a reviewed SDK, credential schema or authentication endpoint.
- Operations:
| Operation | Action | Status | Description | Primary limitation |
|---|---|---|---|---|
| `qie-pass-verify` | authenticate | UNKNOWN | Verify a QIE Pass credential | Do not invent KYC, credential, OAuth, JWT or resolver semantics. |
- Known limitations:
  - QIE Pass capability is product discovery only in this release.
- Unresolved questions:
  - What is the credential provenance, consent, privacy and replay-protection protocol?
- Sources: [S34: QIE ecosystem product catalogue](https://www.qie.digital/)

### QIE EVM JSON-RPC endpoints (`qie-rpc`)

- Entity status: **DOCUMENTED**; scope: qie-mainnet, qie-testnet; execution allowed: `false`
- Published QIE EVM RPC endpoint set and read-only method surface for explicit network preflight and bounded capability probing.
- Interfaces:
- `qie-json-rpc` (JSON_RPC, DOCUMENTED): JSON-RPC 2.0 over HTTPS — Endpoint selection, eth_chainId and latest block checks are documented; individual method support is not live-verified.
- Operations:
| Operation | Action | Status | Description | Primary limitation |
|---|---|---|---|---|
| `rpc-identity-preflight` | read | DOCUMENTED | eth_chainId plus latest block observation | A passing observation never promotes a canonical capability status. |
| `rpc-capability-probe` | read | UNKNOWN | Bounded read-only JSON-RPC method probe | No provider rate limits, historical range limits or WebSocket behavior are documented in the reviewed sources. |
- Known limitations:
  - The source list is documentation, not endpoint liveness or provider compatibility proof.
  - The official page's RPC list labels do not establish priority beyond the selected canonical endpoint.
- Unresolved questions:
  - Which read methods, block tags, log ranges and subscriptions are supported by each current provider?
  - What provider-specific rate limits and retry guidance apply?
- Sources: [S03: Published QIE EVM network settings](https://docs.qie.digital/getting-started-with-qie-blockchain/4.-access-mainnet-or-testnet), [S15: QIE Cosmos Chain Registry Configuration](https://raw.githubusercontent.com/qieadmin/chain-registry/master/qie/chain.json)

### QIE Wallet EIP-1193 integration (`qie-wallet`)

- Entity status: **DOCUMENTED**; scope: qie-mainnet, qie-testnet; execution allowed: `false`
- Officially documented browser-wallet integration through EIP-1193, EIP-6963 discovery and QIE-specific provider behavior.
- Interfaces:
- `qie-wallet-eip1193` (EIP1193, DOCUMENTED): EIP-6963 rdns me.qiewallet, window.qie, injected EIP-1193 — Provider discovery, account requests, chain reads, chain switching and provider events.
- Operations:
| Operation | Action | Status | Description | Primary limitation |
|---|---|---|---|---|
| `wallet-discover` | discover | DOCUMENTED | Discover QIE Wallet provider | Actual extension injection and version behavior were not tested in this environment. |
| `wallet-connect` | authenticate | DOCUMENTED | Request EVM account access | The provider reports isMetaMask for compatibility; use rdns or window.qie for identity. |
| `wallet-switch-network` | prepare | DOCUMENTED | Switch or add a QIE EVM network | QIE Testnet switch may return 4902 until the wallet's Testnet toggle is enabled. |
- Known limitations:
  - Browser extension, host version, provider runtime and transaction flow remain untested.
  - A successful mock provider test is not real wallet evidence.
- Unresolved questions:
  - Which current extension release implements the documented guide?
  - Does the current extension preserve all documented event and testnet-toggle behavior?
- Sources: [S10: QIE Wallet Integration Guide for Websites](https://docs.qie.digital/qie-wallet-integration-guide-for-websites.md)

### QUSDC (`qusdc-protocol`)

- Entity status: **DOCUMENTED**; scope: qie-mainnet, general; execution allowed: `false`
- Issuer-documented QIE receipt-token protocol whose detailed flow uses WUSDC as the QIE-side backing asset and QUSDC as the receipt asset.
- Interfaces:
- `qusdc-vault-abi` (ABI, DOCUMENTED): depositAndMint(uint256) / burnAndWithdraw(uint256) — Minimal vault ABI fragment used by the official JavaScript SDK.
- `qusdc-erc20-input` (ABI, DOCUMENTED): ERC-20 allowance, approve and decimals — ERC-20 methods the SDK uses to prepare WUSDC allowance and parse human-readable amounts.
- Operations:
| Operation | Action | Status | Description | Primary limitation |
|---|---|---|---|---|
| `qusdc-mint` | write | DOCUMENTED | Mint QUSDC from WUSDC | SDK requires separate vaultAddress and wusdcAddress inputs. |
| `qusdc-redeem` | write | DOCUMENTED | Redeem QUSDC to WUSDC | The SDK uses the WUSDC decimals lookup for both mint and burn parsing; QUSDC decimal equality is not independently established. |
| `qusdc-read-decimals` | read | DOCUMENTED | Read WUSDC decimals | A contract-returned decimals value is observation metadata, not proof of token identity or economic denomination. |
- Known limitations:
  - Issuer documentation uses both generic USDC language and the more specific WUSDC implementation flow.
  - The official SDK contains no deployment address and no reserve-proof or upgrade-authority inspection.
  - 1:1 receipt semantics are issuer-documented claims, not an independently verified market-price guarantee.
- Unresolved questions:
  - Which exact QIE contracts are the current production QUSDC token, WUSDC token and vault on each network?
  - Are minting, redemption, pause, fee and upgrade controls present in the deployed bytecode?
  - What independent reserve or supply reconciliation evidence is currently published?
- Sources: [S22: QUSDC protocol introduction](https://docs.stable.qie.digital/introduction.md), [S23: QUSDC minting, WUSDC backing and redemption flow](https://docs.stable.qie.digital/how-qusdc-works.md), [S24: QUSDC supply and reserve transparency claims](https://docs.stable.qie.digital/transparency-and-verifiability.md), [S25: QUSDC decentralization and dependency disclosures](https://docs.stable.qie.digital/decentralization-model.md), [S26: QUSDC FAQ and risk disclosures](https://docs.stable.qie.digital/frequently-asked-questions-faq.md), [S28: QUSDC SDK implementation file at pinned commit](https://raw.githubusercontent.com/qieadmin/qusdc-sdk/0877597f8bd51f7c21bb04e70009d3e9cab86944/index.js)

### qieadmin/qusdc-sdk (`qusdc-sdk`)

- Entity status: **DOCUMENTED**; scope: qie-mainnet, qie-testnet, general; execution allowed: `false`
- Official GitHub JavaScript SDK exposing an ESM QUSDCSdk class built on ethers v6.
- Interfaces:
- `qusdc-sdk-class` (SDK, DOCUMENTED): QUSDCSdk({ signer, vaultAddress, wusdcAddress, confirmations }) — Constructor accepts a signer, separate vault and WUSDC addresses, and an optional confirmation count.
- Operations:
| Operation | Action | Status | Description | Primary limitation |
|---|---|---|---|---|
| `qusdc-sdk-mint` | write | DOCUMENTED | sdk.mint(amount) | _parseAmount uses Number(amount) for the positive check, so very large numeric inputs require caller-side validation. |
| `qusdc-sdk-burn` | write | DOCUMENTED | sdk.burn(amount) | SDK does not construct or validate a QUSDC token contract; it calls the configured vault only. |
- Known limitations:
  - Repository dependency is not an npm registry package in the reviewed metadata; use a pinned Git source only after dependency review.
  - No SDK unit tests, deployment addresses or live QIE execution evidence were found in the pinned tree.
- Unresolved questions:
  - Does the published implementation remain current after the reviewed commit?
  - Does the vault accept the same raw unit scale for QUSDC burn as for WUSDC deposit?
- Sources: [S27: QUSDC SDK pinned source tree](https://github.com/qieadmin/qusdc-sdk/tree/0877597f8bd51f7c21bb04e70009d3e9cab86944), [S28: QUSDC SDK implementation file at pinned commit](https://raw.githubusercontent.com/qieadmin/qusdc-sdk/0877597f8bd51f7c21bb04e70009d3e9cab86944/index.js)

Native Cosmos chain identity and denominations are registry facts, not EVM claims; they are published by the native-layer sources of the canonical native capabilities below and are never mixed into the EVM profiles:

- Native layer sources: [S04: QIE V3 architecture overview](https://docs.qie.digital/what-is-qie/qie-v3-key-features); [S09: QIE blockchain repository entry point](https://github.com/qie-blockchain); [S13: QIE V3 Native Delegation and Staking Guide](https://docs.qie.digital/delegators-in-qie-v3/how-to-delegate-qie-coins-and-earn-rewards.md); [S14: QIE V3 Blockchain Governance Step-by-Step Guide](https://docs.qie.digital/what-are-validators/qie-blockchain-governance-step-by-step-guide.md); [S15: QIE Cosmos Chain Registry Configuration](https://raw.githubusercontent.com/qieadmin/chain-registry/master/qie/chain.json)

## Deprecated & Conflicted Chain Identities

- `chain-id-5656-conflict` (**CONFLICTED**, `qie-legacy`): Historical aggregators list chain ID 5656 while official QIE V3 documentation defines the canonical V3 chain ID; resolved by treating canonical V3 as Mainnet and 5656 as deprecated pre-V3.
- `legacy-chain-5656` (**DEPRECATED**, `qie-legacy`): Pre-V3 chain ID 5656 is deprecated; official wallet guide explicitly warns not to use it, as current QIE V3 Mainnet uses the canonical V3 chain ID.
- `legacy-chain-9731` (**DEPRECATED**, `qie-legacy`): Legacy chain ID 9731 is deprecated; official wallet guide explicitly warns not to use it, as current QIE V3 Mainnet uses the canonical V3 chain ID.

## Address Publication Policy

The canonical address inventory contains discovery-only candidates, not approved configuration. No candidate is published or recommended by this catalogue as an executable DEX router, factory, pool, token, oracle, bridge, vault or conversion target. An explorer page, a source-verified listing, or nonempty bytecode never establishes issuer identity, ABI correspondence, or product ownership; see the release address-identity blocker in the [Ecosystem Decision Guide](decision-guide.md) and the generated [address candidate table](address-candidates.md).

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
- [S22: QUSDC protocol introduction](https://docs.stable.qie.digital/introduction.md) (T1) — QUSDC, reviewed 2026-10-24T20:00:51Z
- [S23: QUSDC minting, WUSDC backing and redemption flow](https://docs.stable.qie.digital/how-qusdc-works.md) (T1) — QUSDC, reviewed 2026-10-24T20:00:51Z
- [S24: QUSDC supply and reserve transparency claims](https://docs.stable.qie.digital/transparency-and-verifiability.md) (T1) — QUSDC, reviewed 2026-10-24T20:00:51Z
- [S25: QUSDC decentralization and dependency disclosures](https://docs.stable.qie.digital/decentralization-model.md) (T1) — QUSDC, reviewed 2026-10-24T20:00:51Z
- [S26: QUSDC FAQ and risk disclosures](https://docs.stable.qie.digital/frequently-asked-questions-faq.md) (T1) — QUSDC, reviewed 2026-10-24T20:00:51Z
- [S27: QUSDC SDK pinned source tree](https://github.com/qieadmin/qusdc-sdk/tree/0877597f8bd51f7c21bb04e70009d3e9cab86944) (T1) — QIE, reviewed 2026-10-24T20:00:51Z
- [S28: QUSDC SDK implementation file at pinned commit](https://raw.githubusercontent.com/qieadmin/qusdc-sdk/0877597f8bd51f7c21bb04e70009d3e9cab86944/index.js) (T1) — QIE, reviewed 2026-10-24T20:00:51Z
- [S29: QIE Lending SDK pinned source tree](https://github.com/qieadmin/qie-lend-sdk/tree/21d2ef2d5c4e9ac82f7e5d72e628341bd0b15262) (T1) — QIE, reviewed 2026-10-24T20:00:51Z
- [S30: QIE Lending SDK market configuration at pinned commit](https://raw.githubusercontent.com/qieadmin/qie-lend-sdk/21d2ef2d5c4e9ac82f7e5d72e628341bd0b15262/config.js) (T1) — QIE, reviewed 2026-10-24T20:00:51Z
- [S31: QIE DEX web interface](https://swap.dex.qie.digital/) (T4) — QIE, reviewed 2026-10-24T20:00:51Z
- [S32: QIE Bridge web interface](https://bridge.qie.digital/) (T4) — QIE, reviewed 2026-10-24T20:00:51Z
- [S33: QIE ID web portal](https://id.qie.digital/) (T4) — QIE, reviewed 2026-10-24T20:00:51Z
- [S34: QIE ecosystem product catalogue](https://www.qie.digital/) (T4) — QIE, reviewed 2026-10-24T20:00:51Z
- [S35: QIE Oracle query examples](https://docs.qie.digital/qie-oracle/deployed-contracts/query-examples.md) (T1) — QIE, reviewed 2026-10-24T20:00:51Z
- [S36: QIE Oracle Solidity integration guide](https://docs.qie.digital/qie-oracle/developer-guide/how-to-integrate-qie-oracle-in-smart-contracts.md) (T1) — QIE, reviewed 2026-10-24T20:00:51Z
- [S37: QIE Oracle edge-case and freshness guidance](https://docs.qie.digital/qie-oracle/developer-guide/handling-edge-cases-and-best-practices.md) (T1) — QIE, reviewed 2026-10-24T20:00:51Z
- [S38: QIE Oracle aggregation description](https://docs.qie.digital/qie-oracle/how-qie-oracle-works/aggregation-and-validation.md) (T1) — QIE, reviewed 2026-10-24T20:00:51Z

Refer to [Release information](release-info.md) for build timestamp and review freshness.
