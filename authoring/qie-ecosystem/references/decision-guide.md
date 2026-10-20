# QIE Ecosystem Decision Guide

Operational decision rules, risk controls, and technical patterns for integrating with tools, libraries, and protocols in the QIE ecosystem.

This guide provides actionable decision trees for Cases A through H, referenced by the [SKILL entry](../SKILL.md), [Ecosystem Catalogue](catalogue.md), and [Compatibility Matrix](compatibility.md). Check [Release information](release-info.md) for evidence freshness.

---

## Case A: Wallet Selection and Integration

### Available Wallets
1. **QIE Wallet Extension** (`qiewallet`, v4.2.2):
   - Official browser extension developed by VortX Capital.
   - Injects `window.qie` and announces itself via EIP-6963 with RDNS `me.qiewallet`.
   - Also populates `window.ethereum` with `isMetaMask: true` for backwards compatibility.
2. **MetaMask / Generic EIP-6963 Wallets** (`metamask`):
   - Standard EVM wallets work when configured with custom RPC endpoints (Mainnet: Chain ID `{{claim:qie-mainnet:chain_id}}`; Testnet: Chain ID `{{claim:qie-testnet:chain_id}}`).

### Critical Limitations & Nuances
- **No Disconnect Event**: QIE Wallet does **not** emit the standard EIP-1193 `disconnect` event upon user disconnect. Applications must listen to `accountsChanged` and treat an empty array (`[]`) as an explicit disconnection:
  ```typescript
  provider.on('accountsChanged', (accounts: string[]) => {
    if (accounts.length === 0) {
      // Handle user disconnect
      resetSession();
    } else {
      updateActiveAccount(accounts[0]);
    }
  });
  ```
- **Testnet Chain Switch Restriction**: Attempting to switch to QIE Testnet (`wallet_switchEthereumChain` with `{{hex:qie-testnet:chain_id}}` / `{{claim:qie-testnet:chain_id}}`) will return error code `4902` unless the user has explicitly enabled the **"Testnet"** toggle in the QIE Wallet extension settings. Guide developers to display this prerequisite in their UI error handling:
  ```typescript
  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '{{hex:qie-testnet:chain_id}}' }],
    });
  } catch (error: any) {
    if (error.code === 4902) {
      notifyUser('Please enable "Testnet" in QIE Wallet settings before switching to QIE Testnet.');
    }
  }
  ```
- **Non-EVM Account Isolation**: QIE Wallet supports Bitcoin and Solana accounts internally, but these are isolated from EIP-1193 provider requests. Only EVM (`0x...`) accounts are returned by `eth_requestAccounts`.

---

## Case B: DEX / Swap Routing and Address Refusal

### Ecosystem Status
- **Web Swap Interface**: Claimed at `https://swap.dex.qie.digital/` and `https://dex.qie.digital/` (`status: {{effective:qiedex-web-swap}}`).
- **Programmatic Swapping**: Contract router and factory identities have **not** been verified on-chain (`status: {{effective:dex-swap}}`).
- **Canonical Address Collection**: The canonical address inventory in this release is **empty** (`knowledge/addresses.yaml: []`).

### Strict Refusal Rule
> [!CAUTION]
> **Refusal to Hallucinate DEX Router Addresses:**
> When asked for the QIEDex router contract address, factory address, or swap ABI, coding agents **MUST REFUSE** to generate or guess an address.
> Never provide a plausible `0x...` UniswapV2Router address.

### Address Identity Is Never Established by an Explorer Page or Bytecode
> [!CAUTION]
> A source-verified listing on [QIE Explorer]({{claim:qie-mainnet:explorer_url}}), a successful transaction receipt, or a nonempty `eth_getCode` response **does not** establish that a contract is the official router (or any other product component) for a named product. Bytecode proves code exists at an address; it never proves issuer identity, ABI correspondence, or product ownership. The release address-identity blocker (`docs/decisions.md`, "Release blocker: contract-address identity validation") applies to every ecosystem contract address without exception.

### Safe Guidance
1. Direct the developer to the official web swap UI: `https://swap.dex.qie.digital/`. This interface is `{{effective:qiedex-web-swap}}`; its smart-contract layer is not.
2. If programmatic integration is required, state that the canonical router address is currently `{{effective:dex-swap}}` in QIE Forge. Any address a developer obtains — from the QIE team, an explorer page, a blog post, or a chat message — is an **unverified lead**, not an authorized integration target.
3. Before any product-specific transaction, the full identity gate must be satisfied and recorded:
   - **Issuer provenance**: an address record whose issuer sources are the project's official, reviewed channels (`issuer_source_ids`).
   - **ABI provenance**: reviewed sources for the exact ABI claimed to correspond to the deployed bytecode (`abi_source_ids`).
   - **Scoped identity observation**: a reviewed validation run that binds `(chain_id, address)` via an `eth_getCode`-style observation at a known block, with expected/observed results matching.
   - **Human review**: explicit confirmation that the issuer sources are the actual product owner's official channels — this cannot be automated away.
   - **Conflict checks**: multi-source handling that detects divergent published addresses.
4. Until that gate is satisfied end-to-end, treat every supplied address as `UNKNOWN`: you may relay it clearly labelled as unverified and discovery-only, but you must not build, endorse, or walk through an executable integration (approve, swap, send) against it.

---

## Case C: Foundry, Hardhat, and Remix Toolchains

### Framework Matrix
| Framework | Local Build/Test | RPC Deployment | Compiler / EVM Target Guidance | Primary Source |
|---|---|---|---|---|
| **Foundry (`forge`)** | LOCAL_REPLAY evidence (B07 recipe; not QIE support) | {{effective:contract-deploy}} | `shanghai` used by the local replay recipe | Local replay recipe (`LOCAL_REPLAY`) |
| **Hardhat** | not run here | {{effective:hardhat-deploy}} | Official guide pins `solidity: "0.8.20"`; it specifies no EVM target | Official QIE Docs (S11) |
| **Remix IDE** | not run here | {{effective:remix-deploy}} | Official guide specifies no compiler version or EVM target | Official QIE Docs (S21) |

Statuses in this matrix are rendered at build time from the canonical capability records and their effective-status projection; do not hand-edit them.

### Operational Rules
- **Compilation Target**: The `shanghai` EVM target in local recipes is **local-replay-derived guidance from B07, not documented QIE deployment support**. The official deployment guides reviewed here do not state a supported EVM target; newer opcode sets (such as cancun `MCOPY` or `TSTORE`) have not been evaluated against QIE RPC nodes. Treat the target choice as an unverified parameter and validate on testnet first.
- **Foundry Usage**: Foundry compiles and tests Solidity contracts locally without network dependency. For deployment, `forge create` requires an explicit `--rpc-url` and `--chain-id`. Because live RPC broadcast has not been validated in this release, deployment remains `{{effective:contract-deploy}}`.
- **Hardhat Setup**: Use the official network configuration from the canonical network claims (`qie-mainnet.rpc_url`, `qie-testnet.rpc_url`):
  ```javascript
  module.exports = {
    solidity: "0.8.20",
    networks: {
      qieMainnet: {
        url: "{{claim:qie-mainnet:rpc_url}}",
        chainId: {{claim:qie-mainnet:chain_id}},
      },
      qieTestnet: {
        url: "{{claim:qie-testnet:rpc_url}}",
        chainId: {{claim:qie-testnet:chain_id}},
      }
    }
  };
  ```
  The URLs and chain IDs above are build-time renderings of the canonical claims `qie-mainnet.rpc_url`, `qie-mainnet.chain_id`, `qie-testnet.rpc_url` and `qie-testnet.chain_id`; the official Hardhat guide itself only publishes the mainnet RPC URL and compiler version.

---

## Case D: Indexer Coverage Uncertainty and Historical Event Querying

### Ecosystem Status
- **Subgraphs / Hosted Indexers**: No deployment of The Graph, Envio HyperIndex, SubQuery, or Goldsky for QIE was substantiated **in the sources reviewed for this release** (`indexer-query: {{effective:indexer-query}}`). `UNKNOWN` is an evidence statement, not proof of absence: unreviewed or newly launched deployments may exist. Never claim categorically that "no QIE indexer exists"; claim only that none was substantiated in the reviewed evidence.
- **Refusal Rule**: Never provide a fabricated subgraph URL or claim that an indexing service supports QIE natively without evidence.

### Recommended Fallback: Bounded RPC Queries
Developers needing historical events can query the JSON-RPC directly using `eth_getLogs`, subject to the provider-verification rules below:
1. **No Provider Limit Is Known**: The canonical `rpc-identity` capability is `{{effective:rpc-identity}}`: no QIE RPC endpoint in this release has been contacted, and **no provider-specific `eth_getLogs` block-range or result-size limit has been measured**. Do not repeat any specific block count as an established QIE limit — it would be an invented compatibility fact.
2. **Probe, Then Bound**: Start with a deliberately small block range, expand gradually, and treat rate-limit (`429`), timeout, or oversized-response errors as the actual boundary reported by the chosen provider. Record which endpoint and limit were observed.
   ```typescript
   const logs = await provider.request({
     method: 'eth_getLogs',
     params: [{
       fromBlock: '0x1000',
       toBlock: '0x1064', // deliberately small probe range
       address: contractAddress,
       topics: [eventTopic],
     }],
   });
   ```
3. **Chunking & Pagination**: Iterate over historical ranges in sequential chunks with retry and backoff, halving the chunk size on provider errors.

---

## Case E: Native QIE Staking vs EVM Staking

### Dual Architecture
QIE operates a dual-layer Cosmos SDK + EVM architecture:
1. **Native Cosmos Staking (Validator Delegation)**:
   - Operates on Cosmos chain ID `qie_1990-1` (published by the Cosmos chain registry source `S15`, not by the EVM network claims).
   - Token denomination is `aqie` ($1\text{ QIE} = 10^{18}\text{ aqie}$).
   - Executed via native Cosmos CLI (`qied`):
     ```bash
     qied tx staking delegate <validator_valoper_address> <amount>aqie \
       --from <key_name> \
       --chain-id qie_1990-1 \
       --fees <fee_in_aqie>
     ```
   - **No fixed fee is published by this guide.** Transaction fees and gas parameters for native operations are live network facts that this release has never measured; query current parameters from a trusted source before executing, and never hardcode a fee amount learned from this guide.
2. **EVM Contract Staking**:
   - Operates on EVM chain ID `{{claim:qie-mainnet:chain_id}}` (`{{hex:qie-mainnet:chain_id}}`).
   - Uses standard Solidity ERC-20 staking contracts deployed to `0x` addresses.

### Clarification Rule
When a developer asks "how do I stake QIE?", the agent **MUST CLARIFY** the intent:
- Are they looking to delegate native QIE to a validator to secure the network (Native Cosmos)?
- Or interact with an EVM smart contract staking dApp?
Never answer a validator delegation question with EVM contract instructions, and never answer an EVM contract question with `qied tx staking` commands.

---

## Case F: Network Substitution Refusal & Legacy Chain IDs

### Canonical Chain IDs
- **QIE EVM Mainnet**: Chain ID `{{claim:qie-mainnet:chain_id}}` (`{{hex:qie-mainnet:chain_id}}`). RPC: `{{claim:qie-mainnet:rpc_url}}` (canonical claim `qie-mainnet.rpc_url`, source `S03`).
- **QIE EVM Testnet**: Chain ID `{{claim:qie-testnet:chain_id}}` (`{{hex:qie-testnet:chain_id}}`). RPC: `{{claim:qie-testnet:rpc_url}}` (canonical claim `qie-testnet.rpc_url`, source `S03`).
- The canonical explorers are `{{claim:qie-mainnet:explorer_url}}` and `{{claim:qie-testnet:explorer_url}}` (claims `qie-mainnet.explorer_url`, `qie-testnet.explorer_url`). Alternate hostnames that are not selected in the canonical claims must not be published as configuration.

### Deprecated Chain IDs & Conflicts
- **Legacy Chain ID 5656**: Pre-V3 mainnet chain ID. `{{effective:legacy-chain-5656}}`.
- **Legacy Chain ID 9731**: Pre-V3 testnet chain ID. `{{effective:legacy-chain-9731}}`.
- **Conflict Resolution**: Some external aggregators or outdated tools list `5656` as QIE Mainnet. This is a known conflict (`chain-id-5656-conflict`: `{{effective:chain-id-5656-conflict}}`). The canonical V3 Mainnet chain ID is **{{claim:qie-mainnet:chain_id}}**.

### Strict Refusal Rules
- **No Cross-Network Fallback**: Never silently substitute Testnet when Mainnet fails, or Mainnet when Testnet fails.
- **Network-RPC Mismatch**: If a developer provides a Testnet RPC URL but requests Mainnet deployment, refuse to proceed until the mismatch is explicitly resolved.

---

## Case G: Discovery vs Execution Proof

### Differentiating Repositories from Published Packages
- A repository on GitHub under `qieadmin` or `qie-blockchain` does **not** mean the code is published on npm or executable on QIE.
- Example: `qie-lend-sdk` and `qusdc-sdk` exist as GitHub repositories, but neither is published on npm (not published as an npm package). Attempting `npm install qie-lend-sdk` fails.
- Example: QIE Oracle documents contract mapping tables for BTC, ETH, SOL, etc., but contract addresses have not undergone on-chain identity verification; capability is classified as `{{effective:qie-oracle-price-feed}}`, not `VERIFIED`.

### Rule for Coding Agents
- Classify repository discovery leads as `DOCUMENTED` or `CLAIMED`.
- Never suggest `npm install <package>` for unpublished repositories.
- If a package is not on npm, guide the developer to clone the repository or use direct GitHub dependency syntax, warning that execution status is unverified.

---

## Case H: Evidence Freshness, Expiry, and Effective Status

### Evaluating Freshness
1. Read the `checked_at` and `expires_at` fields for the capability in [Compatibility Matrix](compatibility.md).
2. If `current_time > expires_at`, the evidence has expired; the effective status drops from `DOCUMENTED` or `VERIFIED` to `STALE` or `UNKNOWN`.
3. If an upstream source has unresolved technical contradictions, the status is `CONFLICTED`.

### Action Rules for UNKNOWN or Expired Status
- When capability status is `UNKNOWN`, `STALE`, or `CONFLICTED`:
  1. Clearly disclose the limitation to the developer.
  2. Stop any automated write guidance.
  3. Require testnet verification before executing on mainnet.
