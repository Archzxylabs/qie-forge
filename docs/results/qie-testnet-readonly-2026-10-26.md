# QIE testnet read-only observations — 2026-10-26

**Outcome:** RPC2 matched the documented QIE EVM testnet chain ID and returned advancing blocks. RPC1 timed out and RPC3 could not be reached from this machine. These are endpoint-specific observations at the times below, not a network-wide availability or deployment certification.

**Capture window:** `2026-10-26T06:46:37.616Z`–`2026-10-26T06:53:53.843Z` (UTC).  
**Tool source commit:** `209ebda231a216e818c6a836c3ba1f9c25a3262d`; the worktree was clean before capture.  
**Runtime:** Node.js `24.20.0`.  
**Skill snapshot:** `0.6.0-ecosystem.1`, identity `838a1e0952fe8da3bc6bbe746bb83754aba40acbd13611ae1ec46e8430103309`.  
**Artifacts:** [run metadata](../evidence/qie-testnet-readonly/2026-10-26T06-46-37-616Z/run.json) and [SHA-256 inventory](../evidence/qie-testnet-readonly/2026-10-26T06-46-37-616Z/SHA256SUMS).

## Selected network and provenance

The [official QIE network page](https://docs.qie.digital/getting-started-with-qie-blockchain/4.-access-mainnet-or-testnet) was retrieved successfully before the RPC checks. It lists testnet chain ID `1983` (`0x7bf`), RPC1 as the recommended endpoint, and RPC2–RPC6 as alternatives. Its receipt timestamp and body digest are retained in `run.json` under source S03. The expected chain ID and original RPC1 endpoint came from the hashed `skills/qie-networks/data/network-claims.json` snapshot.

RPC2 and RPC3 were deliberately checked as explicit same-testnet overrides after RPC1 failed. Each helper independently checked identity before reading a block; there was no automatic endpoint or network substitution. RPC4–RPC6 were not checked. Packaged configuration and source-review timestamps were not changed by this capture.

## Endpoint observations

| Attempt | Endpoint | Result | Process exit | Artifact |
|---|---|---|---|---|
| Initial packaged preflight | `rpc1testnet.qie.digital` | `UNKNOWN / RPC_UNAVAILABLE`; 10-second request timeout | `1` | [report](../evidence/qie-testnet-readonly/2026-10-26T06-46-37-616Z/preflight-before.json) |
| Independent curl diagnostic | `rpc1testnet.qie.digital` | Connection timed out after 5 seconds; no HTTP response | `28` | [stderr](../evidence/qie-testnet-readonly/2026-10-26T06-46-37-616Z/rpc1-curl-chain-id.stderr.txt) |
| Explicit RPC2 preflight | `rpc2testnet.qie.digital` | `PASS`; chain `1983`, block `9378989` | `0` | [report](../evidence/qie-testnet-readonly/2026-10-26T06-46-37-616Z/preflight-rpc2.json) |
| Explicit RPC3 preflight | `rpc3testnet.qie.digital` | `UNKNOWN / RPC_UNAVAILABLE`; fetch failed before identity was observed | `1` | [report](../evidence/qie-testnet-readonly/2026-10-26T06-46-37-616Z/preflight-rpc3.json) |
| Second RPC2 preflight | `rpc2testnet.qie.digital` | `PASS`; chain `1983`, block `9379051` | `0` | [report](../evidence/qie-testnet-readonly/2026-10-26T06-46-37-616Z/preflight-after.json) |

RPC1 resolved to an IPv4 address, and neither Node nor curl could establish the read. Proxy-environment presence was recorded as booleans only in [the transport diagnostic](../evidence/qie-testnet-readonly/2026-10-26T06-46-37-616Z/transport-environment.json). These failures do not establish that the endpoints were unavailable to every client.

## Block progression

| Sample | Check time (UTC) | Block | Block timestamp (UTC) |
|---|---|---|---|
| First RPC2 preflight | `06:49:20.859` | `9378989` | `06:49:15` |
| Bounded method probe | `06:50:23.929` | `9379003` | Not retained by this probe |
| Second RPC2 preflight | `06:53:52.732` | `9379051` | `06:53:45` |

The two preflight samples advanced by **62 blocks** across **271.873 seconds** between check start times. This demonstrates progression during the sample window. No freshness threshold, normal block interval, finality predicate or uptime percentage is inferred.

## Read-only method observations

The [bounded probe](../evidence/qie-testnet-readonly/2026-10-26T06-46-37-616Z/rpc2-capabilities.json) made 14 requests and returned `OBSERVED` for each. It included two latest-block queries, so that report covers 13 distinct methods. A separate [gas-estimation observation](../evidence/qie-testnet-readonly/2026-10-26T06-46-37-616Z/rpc2-estimate-gas.json), gated by the second passing preflight, adds the fourteenth distinct method.

| Method | Observed result with the recorded parameters |
|---|---|
| `eth_chainId` | `0x7bf` |
| `eth_blockNumber` | Nonzero block height |
| `eth_getBlockByNumber` | Latest block object |
| `eth_getBalance` | Hex quantity for the zero address |
| `eth_getCode` | `0x` for the zero address |
| `eth_call` | `0x` for empty data to the zero address |
| `eth_getLogs` | Empty array for the latest-block query |
| `eth_getTransactionByHash` | `null` for the synthetic zero hash |
| `eth_getTransactionReceipt` | `null` for the synthetic zero hash |
| `eth_feeHistory` | Object for one latest block |
| `eth_gasPrice` | `0x7` |
| `eth_getTransactionCount` | `0x0` for the zero address |
| `eth_getStorageAt` | Zero-filled word for slot zero of the zero address |
| `eth_estimateGas` | `0x5208` / `21000` gas units for a zero-value, empty-data synthetic request |

Method responses establish only the recorded requests. Empty logs and null transaction results do not prove historical coverage or real receipt inspection. The empty-data call does not exercise Counter bytecode or an ecosystem ABI. The synthetic estimate and gas-price response do not establish a deployment budget or QIE fee policy.

## Reproduce a new observation

From the repository root at the recorded source commit, run the public read-only commands below. Capture new output in a new directory and preserve exit codes alongside the JSON; live results can change.

```sh
node skills/qie-networks/scripts/verify-network.mjs qie-testnet
node skills/qie-networks/scripts/verify-network.mjs qie-testnet --rpc https://rpc2testnet.qie.digital/
node scripts/probe-rpc-capabilities.mjs qie-testnet --rpc https://rpc2testnet.qie.digital/ --claims skills/qie-networks/data/network-claims.json --max-requests 14
```

Run the bounded method probe only after a passing selected-endpoint preflight. The default RPC1 command is retained above to reproduce the initial attempt, not as a claim that it must still fail. Exact commands, UTC start/finish times and process exit codes for each captured attempt, including the supplemental curl estimate, are in the adjacent `*.execution.json` files. Node requests used a 10-second timeout and 1 MiB response ceiling; curl used a 5-second connection timeout, 12-second total timeout and the same response ceiling.

To check the captured file inventory without making a network request:

```sh
cd docs/evidence/qie-testnet-readonly/2026-10-26T06-46-37-616Z
sha256sum --check SHA256SUMS
```

## Acceptance boundary and next dependency

The read-only network-observation step has evidence. Canonical claims remain `DOCUMENTED`, capability statuses and `knowledge/validation-runs.yaml` remain unchanged, and reviewer approval is not fabricated. Automated tests continue to use mock transports and do not call this endpoint in CI. Frozen generated skill snapshots still describe their build-time evidence.

Contract deployment, wallet signing, application effects, explorer source verification and QIE finality remain unproven. B12a still needs an actual reviewed testnet deployment and state change. The next step is to prepare the Counter artifacts and a concrete deployment review with independently established tool compatibility, a developer-controlled signer, fee evidence and a maximum spend; obtain a fresh preflight for any later write.
