---
name: qie-concepts
description: How QIE differs from Ethereum and what that means for builders — QIE V3 architecture (Cosmos SDK + CometBFT + EVM), Shanghai-only EVM (no Cancun opcodes), 50%-of-gas-limit charging, single-block finality, missing canonical contracts (Multicall3, CREATE2 deployers, Permit2, Safe, ERC-4337), RPC limits, EVM vs native layer, staking/delegation and governance basics. Fetch before writing contracts, choosing compiler settings, estimating gas, or answering "how does X work on QIE".
license: MIT
---

QIE V3 is a Cosmos SDK chain with CometBFT consensus and an EVM execution layer. Official docs call it "fully EVM-compatible": Solidity/Vyper, MetaMask, Hardhat and Remix work. That holds for everyday code. The differences below are where Ethereum-trained instincts break. "Observed" means QIE Forge measured it with read-only calls on mainnet and testnet on 2026-11-16.

## 1. EVM version: Shanghai, not Cancun (observed)

| Opcode | Fork | QIE |
|---|---|---|
| `BASEFEE` | London | ✅ |
| `PUSH0` | Shanghai | ✅ |
| `TLOAD` / `TSTORE` | Cancun | ❌ `invalid opcode` |
| `MCOPY` | Cancun | ❌ |
| `BLOBHASH` / `BLOBBASEFEE` | Cancun | ❌ |
| `CLZ` | Osaka | ❌ |

- **Always compile with `evm_version = "shanghai"`** (Foundry) / `evmVersion: "shanghai"` (Hardhat, Remix "EVM version"). solc ≥ 0.8.25 defaults to Cancun or later and emits `MCOPY` for ordinary code. Example: a constructor using `string.concat` compiled for Cancun failed to deploy on QIE testnet with `invalid opcode: opcode 0x5e not defined`, while the identical Shanghai build deployed fine (simulated 2026-11-16).
- No transient storage: don't use `ReentrancyGuardTransient` or other `tstore`-based patterns; use the classic storage-based `ReentrancyGuard` (OpenZeppelin 5.x; OpenZeppelin plans to make it transient in v6).
- **Pin OpenZeppelin Contracts v5.4.0.** Later releases use `mcopy` in shared utilities: with `shanghai`, v5.7 fails to compile even ERC721, ERC1155, ERC20Permit and EIP712 (`Error (7755)`). In v5.4.0 only Governor, SignatureChecker and ReentrancyGuardTransient fail (observed 2026-11-17). Details in `qie-scaffold`.
- The official Hardhat guide pins `solidity: "0.8.20"`. Any 0.8.20+ compiler works if you set the EVM version to Shanghai.
- Strictly, QIE behaves like **London + PUSH0** rather than full Shanghai: the EIP-3860 initcode size limit isn't enforced, and `COINBASE` isn't pre-warmed (EIP-3651), so gas can differ slightly from a local Shanghai simulation (observed 2026-11-17). `shanghai` is still the right compiler target.
- `block.prevrandao` (`block.difficulty`) is always `0` on both networks (observed 2026-11-17). Never use it, or any block field, as a source of randomness.

## 2. Gas: you pay for at least half the gas limit (observed)

- Receipts report `gasUsed = max(actual execution gas, 50% of gasLimit)`. This matches the Cosmos EVM "min gas multiplier" of 0.5.
- Keep gas limits tight: estimate, then add about 20%. Plain transfers use exactly `21000`.
- EIP-1559 (type 2) transactions. Mainnet base fee 1 gwei, suggested tip 0.125 gwei. Testnet base fee 7 wei.
- The block gas limit reports as `4294967295` (2³²−1) on both networks. Don't infer throughput from it.
- QIE is the native gas currency (18 decimals). On the native layer the base unit is `aqie` (1 QIE = 10¹⁸ aqie).

## 3. Finality and block time

- Documented: CometBFT gives finality on each block, with no reorgs or probabilistic finality. Docs claim ~2 s blocks and "1–2 second finality".
- Observed average block time over 100 blocks: mainnet ~3.6 s, testnet ~4.3 s. Use measured times for UX timers, not the marketing number.
- A receipt in a block is final. For high-value flows, confirm it from a second official RPC.

## 4. Standard contracts you expect are NOT deployed (observed)

None of these exist at their canonical addresses on QIE mainnet or testnet: Multicall3 (`0xcA11…CA11`), CreateX, Create2Deployer, Arachnid deterministic-deployment proxy (`0x4e59…956C`), ERC-2470 and Safe singleton factories, Permit2, ERC-4337 EntryPoint v0.6/v0.7/v0.8/v0.9, Safe v1.3.0/v1.4.1 singletons and factories.

Consequences:
- No `multicall()` in viem/wagmi at the canonical address. On mainnet only, a Multicall3-compatible contract exists at `0x13305ab992c3BA30a3f2c4B92727eb4cA64063e8` (from official app config; undocumented). On testnet, make individual calls or deploy your own. See `qie-addresses` → Multicall. See `qie-addresses` → Multicall.
- No deterministic CREATE2 addresses from `forge script` (`new C{salt: …}`) or CreateX. Deploy with plain `CREATE`, or deploy your own CREATE2 factory first and pass it with `forge script --create2-deployer <ADDRESS>`.
- Safe isn't at its canonical addresses, but QIE runs an official **Safe{Wallet}** with Safe v1.4.1 contracts at its own addresses: https://safe.qie.digital (testnet: https://safe-testnet.qie.digital). See `qie-addresses` → Safe.
- There is no ERC-4337 EntryPoint, so no 4337 smart accounts out of the box.
- Never hardcode those canonical addresses for QIE.

## 5. JSON-RPC surface (observed on public RPCs)

- Works: standard `eth_*` reads/writes, `eth_feeHistory`, `eth_maxPriorityFeePerGas`, filters over HTTP, `txpool_status`, `debug_traceTransaction` (callTracer), archive reads (historical `eth_call` / `eth_getBalance`).
- Limits: `eth_getLogs` needs `toBlock − fromBlock` ≤ **10,000** and returns at most 10,000 logs. No documented WebSocket. The undocumented `wss://ws1mainnet.qie.digital/` answered, but don't depend on it.
- Missing: `eth_getBlockReceipts`, `eth_createAccessList`, `debug_traceCall`, `trace_*`, `eth_blobBaseFee`.
- `eth_getProof` returns Cosmos (IAVL/ICS-23) proofs, not Ethereum Merkle-Patricia proofs. Ethereum light-client/proof libraries won't verify them.
- `web3_clientVersion` is uninformative (`Version dev ()`), so don't feature-detect by client name.

## 6. Two layers, one key: EVM vs native

QIE has an EVM side (`0x…` addresses, chain IDs 1990/1983, Solidity, JSON-RPC) and a native Cosmos side (validators, delegation, governance, `qied` CLI). Under the hood it is an Evmos-derived stack: the native node reports `cosmos-sdk v0.50.9-evmos` and CometBFT 0.38.12 (observed). That explains the Shanghai EVM and the 50% gas floor.

| Native fact | Value | Source |
|---|---|---|
| Cosmos chain ID | `qie_1990-1` | chain registry, live node |
| Address prefix | `qie1…` accounts, `qievaloper1…` validators | chain registry, docs |
| Key | `ethsecp256k1`, coin type 60: **the same private key controls the `0x…` and `qie1…` address** | chain registry |
| Convert addresses | `qied debug addr <qie1…\|0x…>` | [docs](https://docs.qie.digital/how-to-become-a-validator-on-qie-v3/7.-get-some-qie-coins.md) |
| Denom | `aqie` (base), display `qie`, 1 QIE = 10¹⁸ aqie | asset list |
| Gas prices | docs examples use `10000000000aqie`; registry lists low/avg/high 20e9/25e9/40e9 aqie | docs, chain registry |
| Staking params | unbonding **14 days**, max 350 validators, min commission 5% | `api.qie.digital` (observed) |
| Endpoints | see `qie-networks` → Native layer | |
| `qied` binary | latest release `QIE-Mainnet-V6` (2026-08-27) at [qieadmin/qiev3-mainnet](https://github.com/qieadmin/qiev3-mainnet/releases); some docs pages still download older binaries | GitHub |
| IBC | an Osmosis channel exists (QIE `channel-0` ↔ Osmosis `channel-109956`), but the QIE-side client was **expired** on 2026-11-16. Don't send IBC transfers. | registry, live query |

On the EVM side, native QIE balances are also exposed through an ERC-20-like precompile at `0xD4949664cD82660AaE99bEdc034a0deA8A0bd517`. `totalSupply` and `balanceOf` match native balances, but `name`/`symbol`/`decimals` revert. It is not WQIE: use the official WQIE (`qie-addresses`) for wrapped QIE.

Never answer a native question with EVM steps or the reverse. If a user says "stake QIE", ask: delegate to a validator (native), or use an EVM staking contract/dApp (e.g. QIEDEX stake)?

Native commands from the official [delegator](https://docs.qie.digital/delegators-in-qie-v3/how-to-delegate-qie-coins-and-earn-rewards.md), [manage delegation](https://docs.qie.digital/delegators-in-qie-v3/manage-your-delegation.md) and [governance](https://docs.qie.digital/what-are-validators/qie-blockchain-governance-step-by-step-guide.md) guides:

```bash
FLAGS="--chain-id qie_1990-1 --gas auto --gas-adjustment 1.5 --gas-prices 10000000000aqie --node https://rpc.qie.digital:443"
qied tx staking delegate <qievaloper…> 1000000000000000000000aqie --from <key> $FLAGS   # 1000 QIE
qied tx staking unbond   <qievaloper…> <amount>aqie --from <key> $FLAGS                 # 14-day unbonding
qied tx distribution withdraw-rewards <qievaloper…> --from <key> $FLAGS
qied tx gov vote <proposal_id> yes|no|abstain|no_with_veto --from <key> $FLAGS   # docs write "nowithveto"; the SDK v0.50 CLI expects no_with_veto
qied tx gov submit-proposal ./proposal.json --from <key> $FLAGS                       # min deposit 10,000 QIE
qied query staking delegations <qie1…> --node https://rpc.qie.digital:443
```

- `submit-proposal` on SDK v0.50 expects `{"messages":[],"metadata":"","deposit":"10000000000000000000000aqie","title":"…","summary":"…","expedited":false}`. The governance guide's file (`title`, `description`, `type`, `deposit`) is the legacy format: `submit-proposal` rejects it with `proposal summary cannot be empty`.
- The delegator guides run these against a local node (`--node tcp://127.0.0.1:26657`). The governance guide uses `tcp://node5mainnet.qie.digital:26657`, which didn't answer (2026-11-17). The public CometBFT RPC above works for queries.
- Validator list: https://mainnet.qie.digital/validators. Delegations (REST): `https://api.qie.digital/cosmos/staking/v1beta1/delegations/<qie1…>`
- These commands sign with the user's key. Show them; never run them for the user or ask for their mnemonic (`qied keys add <name> --recover` happens on the user's machine).

## 7. Mainnet vs testnet

| | Mainnet | Testnet |
|---|---|---|
| EVM chain ID | 1990 (`0x7c6`) | 1983 (`0x7bf`) |
| Legacy IDs never to use | 5656 (pre-V3), 9731 (legacy) | — |
| Faucet | — | https://www.qie.digital/faucet (2 test QIE per day; arrives within ~1 min) |
| Official product deployments (DEX, Lending, Oracle, QUSDC, QIE ID) | yes | **none**: deploy your own mocks |
| Public chain registries | ethereum-lists has no 1990 entry | ethereum-lists lists 1983 as **"Krown Mainnet"** |

Never fall back from one network to the other. Testnet is where you validate the Shanghai build, gas limits and wallet flow before mainnet. Always define QIE chains explicitly rather than trusting registry lookups by chain ID.

## Official sources

- Docs index (every page also as `.md`): https://docs.qie.digital/llms.txt
- [Core concepts](https://docs.qie.digital/developer-docs/core-concepts.md) · [V3 key features](https://docs.qie.digital/what-is-qie/qie-v3-key-features.md) · [Access mainnet/testnet](https://docs.qie.digital/getting-started-with-qie-blockchain/4.-access-mainnet-or-testnet.md)
