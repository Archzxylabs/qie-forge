---
name: qie-scaffold
description: End-to-end guide to build and ship a dApp on QIE — project layout, Foundry setup with the required Shanghai EVM target, contracts and tests, testnet deployment with a keystore, explorer verification, a viem/wagmi frontend with QIE Wallet, and the mainnet go-live checklist. Fetch first when starting a QIE app from scratch or taking a prototype to production.
license: MIT
---

Workflow: **plan → contracts → test locally → deploy to testnet → verify → frontend → mainnet**. Fetch `qie-networks` for endpoints, `qie-concepts` for chain differences, and `qie-wallet-integration` for the wallet.

## 0. Plan what goes on-chain

- On-chain: ownership, balances, permissions, rules that must be trustless. Keep it minimal, since every write costs gas and you pay for at least half the gas limit.
- Off-chain: metadata, media, search, analytics, notifications.
- History and feeds: QIE has no confirmed hosted indexer. Read events with `eth_getLogs` in ≤ 10,000-block windows and cache them in your backend. See `qie-ecosystem` → Indexing and data.
- Need a price? Use QIE Oracle feeds (`qie-addresses`) with a freshness check.

## 1. Project layout

```
my-qie-app/
├── contracts/          # Foundry
│   ├── src/
│   ├── test/
│   ├── script/
│   └── foundry.toml
└── web/                # Vite or Next.js + viem/wagmi
```

## 2. Contracts with Foundry

```bash
forge init contracts && cd contracts
forge install OpenZeppelin/openzeppelin-contracts@v5.4.0   # pinned: newer releases need Cancun (see rules below)
```

`foundry.toml`:

```toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
solc_version = "0.8.28"
evm_version = "shanghai"        # REQUIRED: QIE rejects Cancun opcodes (TSTORE/TLOAD/MCOPY)
optimizer = true
optimizer_runs = 200
remappings = ["@openzeppelin/=lib/openzeppelin-contracts/"]

[rpc_endpoints]
qie_testnet = "https://rpc1testnet.qie.digital/"
qie_mainnet = "https://rpc1mainnet.qie.digital/"
```

Rules for QIE contracts:
- Keep `evm_version = "shanghai"`. A dependency that uses `tstore`/`tload`/`mcopy` fails to compile (`Error (7755)` for `mcopy`, `Error (6243)` for `tload`). Never "fix" that by switching to `cancun`: the deploy would then fail on QIE.
- **OpenZeppelin Contracts: pin v5.4.0** (Hardhat: `npm i @openzeppelin/contracts@5.4.0`). From v5.4 its shared utilities use `mcopy`. Observed 2026-11-17 with `shanghai`:
  - v5.4.0: everything common compiles (ERC20/721/1155, ERC20Permit, EIP712, ECDSA, AccessControl, Ownable, ReentrancyGuard, SafeERC20, ERC4626, proxies) except Governor, SignatureChecker and ReentrancyGuardTransient.
  - v5.7.0 (what an unpinned `forge install` gets): ERC721, ERC1155, ERC20Permit, EIP712 and Strings fail too.
  - Need Governor or SignatureChecker? Use v5.3.0, and don't call `Bytes.lastIndexOf` with a position argument there ([GHSA-9rcw-c2f9-2j55](https://github.com/advisories/GHSA-9rcw-c2f9-2j55), fixed in 5.4.0).
  - Use `ReentrancyGuard`, never `ReentrancyGuardTransient`.
- Don't rely on Multicall3, Permit2, ERC-4337 EntryPoint or CREATE2 factories: they are not at their canonical addresses on QIE. Safe exists only as QIE's own deployment (`qie-addresses` → Safe).
- Price data: read QIE Oracle (AggregatorV3-style) and reject stale or non-positive answers:

```solidity
(, int256 answer,, uint256 updatedAt,) = feed.latestRoundData();
require(answer > 0, "bad price");
require(block.timestamp - updatedAt <= MAX_AGE, "stale price"); // feeds update at different cadences
```

Test locally (no chain needed):

```bash
forge build
forge test -vvv
forge test --fork-url qie_testnet   # optional: test against real testnet state
```

## 3. Deploy to testnet first

Get test QIE from https://www.qie.digital/faucet. It gives 2 test QIE per day, arriving in about a minute. Budget testnet deploys accordingly: testnet gas is nearly free (base fee 7 wei), but the daily drip is small.

```bash
# One-time: store the deployer key in Foundry's encrypted keystore (never in chat, code or a committed .env)
cast wallet import qie-deployer --interactive
cast wallet address --account qie-deployer
cast balance $(cast wallet address --account qie-deployer) --ether --rpc-url qie_testnet

# Simple deploy (Foundry ≥1.0 needs --broadcast; without it this is a dry run)
forge create src/Counter.sol:Counter --rpc-url qie_testnet --account qie-deployer --broadcast

# Scripted deploy (forge init's template script; write your own the same way)
forge script script/Counter.s.sol:CounterScript --rpc-url qie_testnet --account qie-deployer --broadcast --slow
```

- Always confirm with the user before `--broadcast`, and state network, contract, constructor args and estimated cost.
- Use plain `new Contract(...)` in scripts. `new Contract{salt: ...}` needs the CREATE2 deployer proxy, which doesn't exist on QIE.
- `--slow` sends one transaction at a time and waits for each receipt. It is safer on QIE, which rejects nonce gaps and has no replace-by-fee (see `qie-transactions`).
- Check the result:

```bash
cast receipt <TX_HASH> --rpc-url qie_testnet            # status 1, contractAddress
cast code <DEPLOYED_ADDRESS> --rpc-url qie_testnet       # non-empty
cast call <DEPLOYED_ADDRESS> "number()(uint256)" --rpc-url qie_testnet
```

Hardhat and Remix also work; both have official QIE guides. In Remix, set Compiler → Advanced → EVM version **shanghai** and use the "Injected Provider" environment with QIE Wallet. In Hardhat set `evmVersion: 'shanghai'` (configs in `qie-networks`).

## 4. Verify on the explorer

Both explorers run **Blockscout** (backend v7.0.2, observed 2026-11-16). Verification is free and needs no API key. It accepts standard-JSON input, flattened and multi-part Solidity. Vyper works on mainnet only: the testnet explorer lists no Vyper compilers (observed 2026-11-17).

```bash
# Testnet (Foundry reaches Blockscout at this URL; observed 2026-11-17)
forge verify-contract <ADDRESS> src/Counter.sol:Counter \
  --chain-id 1983 --verifier blockscout --verifier-url https://testnet.qie.digital/api/

# Mainnet
forge verify-contract <ADDRESS> src/Counter.sol:Counter \
  --chain-id 1990 --verifier blockscout --verifier-url https://mainnet.qie.digital/api/

# Constructor args: --constructor-args $(cast abi-encode "constructor(address,uint256)" 0x... 42)
```

Or verify in one go while deploying: add `--verify --verifier blockscout --verifier-url https://testnet.qie.digital/api/` to `forge create` / `forge script`.

Hardhat 2 (`@nomicfoundation/hardhat-verify`):

```js
etherscan: {
  apiKey: { qieMainnet: 'empty', qieTestnet: 'empty' },         // any non-empty string
  customChains: [
    { network: 'qieMainnet', chainId: 1990, urls: { apiURL: 'https://mainnet.qie.digital/api', browserURL: 'https://mainnet.qie.digital' } },
    { network: 'qieTestnet', chainId: 1983, urls: { apiURL: 'https://testnet.qie.digital/api', browserURL: 'https://testnet.qie.digital' } },
  ],
},
```

Hardhat 3 (`@nomicfoundation/hardhat-verify` 3.x; type-checked with Hardhat 3.22). Add to the config from `qie-networks`:

```ts
import hardhatVerify from '@nomicfoundation/hardhat-verify';
// inside defineConfig({ … }):
  plugins: [hardhatVerify],
  chainDescriptors: {
    1990: { name: 'QIE Mainnet', blockExplorers: { blockscout: { name: 'QIE Explorer', url: 'https://mainnet.qie.digital', apiUrl: 'https://mainnet.qie.digital/api' } } },
    1983: { name: 'QIE Testnet', blockExplorers: { blockscout: { name: 'QIE Testnet Explorer', url: 'https://testnet.qie.digital', apiUrl: 'https://testnet.qie.digital/api' } } },
  },
  verify: { etherscan: { enabled: false }, sourcify: { enabled: false } }, // both are on by default; only Blockscout knows QIE
```

`name` is required in each chain descriptor.

Verification must use the exact deployed settings: compiler version, `evm_version = "shanghai"`, optimizer runs and constructor args. Explorer APIs (Etherscan-style `https://<net>.qie.digital/api?module=…`, plus `/api/v2/…`) also return ABIs and sources of verified contracts, e.g. `?module=contract&action=getabi&address=<ADDRESS>`.

## 5. Frontend

```bash
npm create vite@latest web -- --template react-ts && cd web
npm install viem wagmi @tanstack/react-query
```

- Chain definitions: copy `qieMainnet` / `qieTestnet` from `qie-networks`. The canonical Multicall3 is absent. Use the compatible mainnet address from `qie-addresses` if you need batching (none on testnet).
- Wallet: wagmi's `createConfig` discovers QIE Wallet via EIP-6963 by default (connector `id` `me.qiewallet`); a bare `injected()` targets `window.ethereum`. Handle `accountsChanged([])` as disconnect, and the testnet toggle (`4902`). See `qie-wallet-integration`.
- ABI: import from `contracts/out/<Contract>.sol/<Contract>.json` (or `forge inspect <Contract> abi --json`).
- Reads: individual `readContract` calls, or multicall via the compatible contract on mainnet. Writes: `writeContract` → `waitForTransactionReceipt`, then re-read state.
- Swaps: call the official QIEDEX Swap API (`qie-ecosystem`). It returns unsigned transactions for the user's wallet to sign.
- Event history: page `getLogs` in ≤ 10,000-block chunks; there is no WebSocket, so poll.
- Show the selected network and account at all times. Disable actions on the wrong chain.

## 6. Go live on mainnet

- [ ] Same commit and build settings that passed on testnet (`evm_version = "shanghai"`, same solc/optimizer).
- [ ] `cast chain-id --rpc-url qie_mainnet` → `1990`.
- [ ] Deployer balance covers the fee. Gas limits are tight (estimate × ~1.2), because at least 50% of the limit is billed.
- [ ] Admin/owner keys planned: a multisig on QIE's official Safe{Wallet} (https://safe.qie.digital; testnet https://safe-testnet.qie.digital), a hardware wallet, and/or a timelock. Document who controls upgrades and pauses.
- [ ] External addresses (oracle feeds, tokens, lending markets) are taken from `qie-addresses`, checked with `cast code`, and pass the identity checks there.
- [ ] Contracts verified on https://mainnet.qie.digital/.
- [ ] Frontend points at mainnet chain ID 1990 and mainnet addresses, never testnet leftovers.
- [ ] User explicitly approved the mainnet broadcast.

## Never

- Never ask for, print or store private keys or seed phrases. Use `--account` (keystore), a hardware wallet (`--ledger`), or the user's browser wallet.
- Never deploy to mainnet before testnet, or broadcast without explicit approval.
- Never invent contract addresses (routers, tokens, factories). If it isn't in `qie-addresses`, it's unknown.
