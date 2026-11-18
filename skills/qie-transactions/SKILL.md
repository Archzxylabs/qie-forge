---
name: qie-transactions
description: Read, check and send transactions on QIE EVM (mainnet 1990 / testnet 1983) — receipts, status, fees, the 50%-of-gas-limit charging rule, nonces, logs (10,000-block limit), traces, contract-creation checks and what a receipt does and does not prove. Use when inspecting a tx hash, estimating or explaining fees, debugging pending/reverted txs, or preparing a send with cast/ethers/viem.
license: MIT
---

All commands use Foundry's `cast`. Pick the network explicitly; examples use mainnet.

```bash
export QIE_RPC=https://rpc1mainnet.qie.digital/      # testnet: https://rpc1testnet.qie.digital/
cast chain-id --rpc-url $QIE_RPC                     # 1990 mainnet / 1983 testnet — stop if different
```

## Fees on QIE — read this before setting gas

**You are charged for at least 50% of the gas limit.** On every mainnet transaction sampled (2026-11-16), the receipt's `gasUsed` was exactly half the gas limit whenever real execution used less. For example, a tx with limit 2,500,000 executed about 99k gas but was charged 1,250,000. This matches the Cosmos EVM "min gas multiplier" of 0.5.

- `fee = receipt.gasUsed × effectiveGasPrice`, where `gasUsed = max(actual execution gas, gasLimit / 2)`.
- Set tight limits: `gasLimit ≈ cast estimate × 1.2`. A plain QIE transfer is exactly `21000`.
- Never use "safe" defaults like 3,000,000 or a wallet's big padding. Half of it is billed.
- `receipt.gasUsed` is not the EVM execution cost; use a trace if you need real usage.

Observed fee market (2026-11-16):

| | Mainnet | Testnet |
|---|---|---|
| Tx type | EIP-1559 (type 2) | EIP-1559 (type 2) |
| `baseFeePerGas` | 1 gwei (flat across samples) | 7 wei |
| `eth_maxPriorityFeePerGas` | 0.125 gwei | 0 |
| `eth_gasPrice` | 1.125 gwei | 7 wei |

Native currency is QIE with 18 decimals. Let wallets estimate prices; don't hardcode them.

## Inspect a transaction

```bash
cast tx      <TX_HASH> --rpc-url $QIE_RPC       # from, to, nonce, gas (limit), type, fees, input
cast receipt <TX_HASH> --rpc-url $QIE_RPC       # status, blockNumber, gasUsed, effectiveGasPrice, logs, contractAddress
cast receipt <TX_HASH> status --rpc-url $QIE_RPC
```

| Observation | Meaning |
|---|---|
| receipt `status 1 (success)` (`cast receipt <h> status` prints `true`) | Included and executed successfully. |
| receipt `status 0 (failed)` (`… status` prints `false`) | Included but reverted. The fee was still charged, including the 50% floor. |
| no receipt, `cast tx` found | Pending in the node's mempool. QIE has no replace-by-fee, so it is normally included within a few blocks or dropped. Don't use `txpool_status` (always empty on QIE); use the nonce check below. |
| neither found | Unknown to this node: wrong network, never broadcast, or dropped. Check the hash on the explorer for the network you selected. |

Explorers: https://mainnet.qie.digital/tx/<hash> · https://testnet.qie.digital/tx/<hash>

**Finality.** QIE runs CometBFT consensus. The docs state there is finality on each block (no probabilistic finality). A receipt in a block is final; no confirmation count is needed. For high-value flows, also read the receipt from a second official RPC of the same network.

## What a receipt proves (and doesn't)

- Proves: the tx was included, and whether it executed or reverted.
- Doesn't prove: that your application effect happened. Check state (`cast call`) or decode the expected event with the real ABI.
- Doesn't prove: that the `to` contract is the product it claims to be. See `qie-addresses`.
- For a deployment: `contractAddress` in the receipt, then `cast code <addr> --rpc-url $QIE_RPC`. Non-empty code means the deploy executed; it is not source verification.

## Why did it revert?

```bash
# Re-simulate the same call against the parent block to get the revert reason
cast call <TO> <CALLDATA> --from <FROM> --value <WEI> --block <BLOCK-1> --rpc-url $QIE_RPC

# Full call trace (available on the public RPC: debug_traceTransaction with callTracer)
cast rpc debug_traceTransaction <TX_HASH> '{"tracer":"callTracer"}' --rpc-url $QIE_RPC
```

`debug_traceCall`, `trace_*`, `eth_createAccessList` and `eth_getBlockReceipts` are **not** available on the public RPCs. Simulate with `cast call` / `eth_call` instead.

## Logs and events

`eth_getLogs` accepts a range with `toBlock − fromBlock` ≤ **10,000** (error: `maximum [from, to] blocks distance: 10000`) and returns at most 10,000 logs (node defaults). Page in windows of 5,000–10,000 blocks and always filter by address/topics.

```bash
cast logs --from-block <A> --to-block <A+9999> --address <CONTRACT> \
  'Transfer(address indexed from, address indexed to, uint256 value)' --rpc-url $QIE_RPC
```

There is no WebSocket endpoint on the public RPC hosts, so subscriptions aren't available. Poll with filters (`eth_newFilter` / `eth_getFilterChanges` work over HTTP) or by block range. Historical state is available back to genesis (block 1) on both networks (observed 2026-11-17).

## Nonces and stuck transactions

```bash
cast nonce <ADDRESS> --rpc-url $QIE_RPC                 # latest (confirmed)
cast nonce <ADDRESS> --block pending --rpc-url $QIE_RPC # also counts the sender's txs in the node's mempool
curl -s https://rpc.qie.digital/num_unconfirmed_txs     # mainnet mempool size (CometBFT)
```

QIE uses CometBFT's mempool, not geth's, and checks nonces strictly when a tx is submitted (QIE's node source, `qieadmin/QIE-Blockchain`):
- A tx must use exactly the sender's next nonce. A gap is rejected at submission (`invalid nonce; got N, expected M`), so nothing is ever queued behind a missing nonce.
- There is **no replace-by-fee**. A second tx with the nonce of a pending one is rejected the same way. Wait for the first one to be included.
- `maxFeePerGas` below the base fee is rejected (`max fee per gas less than block base fee`), so no tx waits for fees to drop.
- If a hash is unknown and `--block pending` equals latest, the tx was dropped or never accepted. Re-sign only with the user's approval.
- Never "retry" by sending the same action again while the first may still be pending: you would do it twice.

## Sending (only with explicit user approval — testnet first)

```bash
export QIE_RPC=https://rpc1testnet.qie.digital/ # testnet first; --chain below must match
cast wallet import qie-dev --interactive        # one-time: key goes into an encrypted Foundry keystore, never into chat/files
GAS=$(cast estimate <TO> "setValue(uint256)" 42 --from <SENDER> --rpc-url $QIE_RPC)
cast send <TO> "setValue(uint256)" 42 \
  --account qie-dev --rpc-url $QIE_RPC --chain 1983 \
  --gas-limit $(( GAS * 12 / 10 ))
```

- Show the user the network, target, function and args, value and maximum fee before sending.
- Use `--chain 1983` for testnet and `--chain 1990` for mainnet. It must match the RPC.
- Never ask for a private key or seed phrase; never put keys in source, `.env` committed to git, or command history.
