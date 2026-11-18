---
name: qie-debug
description: Troubleshoot QIE builds, deployments, RPC, wallet and transaction problems — symptom → check → fix for invalid opcode (Cancun) errors, wrong chain / legacy chain IDs 5656/9731, RPC down, eth_getLogs range errors, missing Multicall3/CREATE2 deployer, gas overpayment, nonce and fee rejections, stuck or reverted txs, OpenZeppelin mcopy compile errors, QIE Wallet 4902, request-timeout and testnet toggle issues. Use whenever something on QIE fails or behaves differently than on Ethereum.
license: MIT
---

Find the failing stage first: local build → RPC/network → wallet → transaction → application effect. Use the smallest check that tells you which stage failed, then fix only that stage. Never ask for private keys, seed phrases or credential-bearing RPC URLs while debugging.

```bash
export QIE_RPC=https://rpc1mainnet.qie.digital/      # or https://rpc1testnet.qie.digital/
export ETH_RPC_URL=$QIE_RPC                          # cast uses it when --rpc-url is omitted (checks below)
cast chain-id --rpc-url $QIE_RPC && cast block-number --rpc-url $QIE_RPC
```

## Symptom → check → fix

| Symptom | Check | Fix |
|---|---|---|
| Deploy or call fails with `invalid opcode: opcode 0x5e not defined` (`0x5c`/`0x5d`/`0x49`/`0x4a`) | `grep evm_version foundry.toml` / Hardhat `evmVersion` | QIE supports opcodes up to **Shanghai**. Recompile with `evm_version = "shanghai"`. Remove transient storage (`tstore`/`tload`, e.g. OpenZeppelin `ReentrancyGuardTransient`) and any `mcopy` inline assembly. |
| Compile fails: `Error (7755): The "mcopy" instruction is only available for Cancun-compatible VMs` (or `Error (6243)` for `tload`) | Which dependency: usually OpenZeppelin ≥ 5.4 (`grep '"version"' lib/openzeppelin-contracts/package.json`; Hardhat: `npm ls @openzeppelin/contracts`) | Keep `shanghai`, never switch to `cancun`. Pin OpenZeppelin v5.4.0 (v5.3.0 if you need Governor/SignatureChecker); use `ReentrancyGuard`, not `ReentrancyGuardTransient`. See `qie-scaffold`. |
| Works locally, fails on QIE right after compiler upgrade | Same as above | solc ≥ 0.8.25 defaults to Cancun or later and emits `MCOPY` for everyday code such as `string.concat`, `bytes.concat` and dynamic `abi.encode`. Pin `shanghai` explicitly. Local tests pass because Anvil/forge default to newer hardforks. |
| `cast chain-id` prints something other than 1990 / 1983 | Endpoint belongs to another chain | Stop. Use the official RPC list in `qie-networks`. Never continue on the wrong chain. |
| Wallet/dApp shows wrong balances; txs rejected | App configured with chain ID `5656` or `9731` (pre-V3/legacy) | Use `1990` (mainnet) or `1983` (testnet). |
| RPC timeout / DNS error / 5xx | `cast chain-id --rpc-url <other official RPC of the same network>` | Switch to another official RPC of the **same** network (`rpc1`–`rpc5mainnet`; `rpc1/2/4/5/6testnet`; `rpc3testnet` doesn't resolve). Never fall back to the other network. |
| `maximum [from, to] blocks distance: 10000` | Your `eth_getLogs` range | Query in windows of ≤ 10,000 blocks (`toBlock − fromBlock ≤ 10000`). |
| `the method … does not exist/is not available` | Method name | Public RPCs lack `eth_getBlockReceipts`, `eth_createAccessList`, `debug_traceCall`, `trace_*`, `eth_blobBaseFee`. Use per-tx receipts, `eth_call` simulation, and `debug_traceTransaction` (available). |
| WebSocket connection fails (404/405) | `wss://` URL | No public WebSocket endpoint. Poll over HTTP (`eth_newFilter`/`eth_getFilterChanges`, block polling). |
| viem `multicall` error / chain does not support `multicall3` | `cast code 0xcA11bde05977b3631167028862bE2a173976CA11` → `0x` | Canonical Multicall3 isn't deployed on QIE. On mainnet, set `contracts.multicall3.address` to the compatible `0x13305ab992c3BA30a3f2c4B92727eb4cA64063e8` (undocumented, from QIEDEX app config; no code on testnet), use individual reads, or deploy your own. `0x7E055…` only supports v1 `aggregate`. |
| `forge script` with `new C{salt: …}` or CreateX/Create2 fails | `cast code 0x4e59b44847b379578588920ca78fbf26c0b4956c` → `0x` | No deterministic-deployment proxy, CreateX or Create2Deployer on QIE. Deploy with plain `CREATE` (no salt), or deploy your own factory first. |
| Safe / ERC-4337 / Permit2 integration fails | `cast code <canonical address>` → `0x` | Nothing is at the canonical addresses on QIE; don't hardcode them. For Safe, use QIE's own deployment (`qie-addresses` → Safe). There is no ERC-4337 EntryPoint or Permit2. |
| Fees much higher than expected | `cast tx <hash> gas` vs `cast receipt <hash> gasUsed` | You're billed at least 50% of the gas limit. Set `gasLimit ≈ estimate × 1.2`; plain transfers `21000`. |
| Tx "not found" | `cast tx <hash>` on the selected network; explorer of that network | Wrong network, never broadcast, or dropped. Confirm the network, then compare `cast nonce <addr> --block pending` with `cast nonce <addr>`: equal means nothing from that sender is pending. **Don't resend blindly**: if it's actually pending you'll execute twice. |
| Submission rejected: `invalid nonce; got N, expected M` | `cast nonce <addr> --block pending` | QIE needs exactly the next nonce: no gaps, and no replacing a pending tx (no replace-by-fee). Wait for the pending tx, then send with the next nonce. |
| Submission rejected: `max fee per gas less than block base fee` | `cast base-fee` | Set `maxFeePerGas` ≥ the base fee (mainnet 1 gwei), or let the wallet/`cast` fill fees. |
| Tx pending for more than a minute | `cast tx <hash>`; `cast nonce <addr> --block pending` vs latest; mainnet `curl https://rpc.qie.digital/num_unconfirmed_txs` | Rare: gapped and underpriced txs are rejected at submission. Don't use `txpool_status` (always 0 on QIE). If the tx is gone, it was dropped; re-sign only with user approval. |
| `status 0` (reverted) | `cast call <to> <data> --from <from> --block <blockNumber-1>`; `cast rpc debug_traceTransaction <hash> '{"tracer":"callTracer"}'` | Read the revert reason and trace, fix locally, then send a new tx with user approval. |
| Receipt OK but app shows no change | Network, contract address, ABI/event, block used by the UI | A receipt proves inclusion, not your app's effect. Read the state at the receipt block and decode the expected event. |
| Contract call returns empty `0x` / decode error | `cast code <addr> --rpc-url $QIE_RPC` | No contract there on this network (wrong address or wrong network). See `qie-addresses`. |
| Oracle price looks stale | `cast call <feed> "latestRoundData()(uint80,int256,uint256,uint256,uint80)"` and compare `updatedAt` to now | Feeds update at different cadences (QIE/USDT was ~20 h old on 2026-11-16 while BTC was 3 min). Enforce a max age in your contract and fail closed. |
| Explorer verification fails | Compiler version, `evm_version`, optimizer runs, constructor args | They must match the deployed build exactly. See `qie-scaffold` → Verify. |

## Wallet problems (QIE Wallet)

| Symptom | Fix |
|---|---|
| `4902` switching to testnet | User must enable **Testnet** in QIE Wallet settings first. `wallet_addEthereumChain` won't help. |
| `4902` switching to mainnet | Call `wallet_addEthereumChain` (params in `qie-wallet-integration`). |
| `4001` | User rejected. Offer a retry and don't loop. |
| `Error('Request timeout')` with no `code` | QIE Wallet rejects any request after 60 s in the page, while its popup can stay open for 5 min. The user may still approve: for a send, check the nonce and explorer before retrying. Remove your own short timeouts. (`-32002`, "request already pending", comes from other wallets.) |
| ethers: gas estimation reverts for a token transfer that works on a public RPC | QIE Wallet's `eth_estimateGas` drops `from` (v4.2.4). Estimate on a public RPC with `from` and pass `gasLimit` (see `qie-wallet-integration` §4). |
| `4200` | Unsupported method (`eth_sign`, v1 `eth_signTypedData`). Use `personal_sign` or `eth_signTypedData_v4`. |
| Popup never opens / wrong wallet opens | Another wallet owns `window.ethereum`. Detect via EIP-6963 `rdns: me.qiewallet` or `window.qie`. |
| App never notices disconnect | QIE Wallet never emits `disconnect`. Handle `accountsChanged` with `[]`. |
| Chain check always fails | You compared `'0x7C6'` as a string. QIE Wallet returns lowercase `0x7c6`, so compare numerically. |
| Provider `undefined` | Page served from `file://`, extension missing, or checked before injection. Serve over HTTPS/localhost and detect on click. |

## Native layer (validators, delegation, `qied`)

EVM tools can't fix native problems. Use `qie-concepts` for native chain ID, denom and command shapes, and the official validator/delegator docs: https://docs.qie.digital/llms.txt.

## Rules while fixing

- Change one thing, re-run the same check, report what is fixed and what is still unknown.
- Never switch the user's target network as a "fix".
- Get explicit approval before any action that signs, spends, deploys, or publishes.
