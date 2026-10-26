# Counter testnet preparation — 2026-10-26

**Result:** local build and tests passed, and a read-only creation simulation returned the exact compiled runtime on QIE EVM testnet RPC2. The [unsigned deployment review](../deployment/counter-testnet-review.json) is `BLOCKED` because an actual signer, signer-specific quote, fee limits and wallet submission path remain unresolved.

This is deployment preparation for the existing canonical Counter fixture. The simulation produced neither a deployment transaction nor a persisted contract address. Canonical capability statuses were not promoted.

## Inputs and reproducible local build

**Source commit:** `608952e7169b825ede56e943dc177ee217993850`, clean before capture.  
**Capture began:** `2026-10-26T07:27:58.544Z`.  
**Toolchain:** Node.js `24.20.0`, Forge `1.8.1` / commit `982849d3140c01fd3b72905759581a132df7aa98`, native solc `0.8.37+commit.f401782d`.  
**Configuration:** EVM target `paris`, optimizer disabled, metadata bytecode hash `none`.  
**Canonical source:** [Counter.sol](../../recipes/build-test/assets/src/Counter.sol), [tests](../../recipes/build-test/assets/test/Counter.t.sol) and [Foundry configuration](../../recipes/build-test/assets/foundry.toml).

The canonical assets were copied into a new isolated temporary project. The existing compiler resolver selected an already installed native binary; build and test commands used `--offline --use <resolved-native-solc>`. All five Solidity tests passed, including 256 fuzz runs. Commands, exits, tool versions and output are retained in the [capture directory](../evidence/counter-testnet-preparation/2026-10-26T07-27-58-544Z/run.json).

| Artifact | Result |
|---|---|
| [ABI](../evidence/counter-testnet-preparation/2026-10-26T07-27-58-544Z/Counter.abi.json) | `increment()` and `value()`; no constructor arguments |
| [Method identifiers](../evidence/counter-testnet-preparation/2026-10-26T07-27-58-544Z/Counter.methods.json) | `d09de08a` and `3fa4f245`, respectively |
| [Creation bytecode](../evidence/counter-testnet-preparation/2026-10-26T07-27-58-544Z/Counter.creation.hex) | 327 bytes, with no unresolved library references |
| [Runtime bytecode](../evidence/counter-testnet-preparation/2026-10-26T07-27-58-544Z/Counter.runtime.hex) | 296 bytes |
| [Unmodified Forge artifact](../evidence/counter-testnet-preparation/2026-10-26T07-27-58-544Z/Counter.artifact.json) | ABI, bytecode, compiler metadata and source mapping |
| [Standard JSON input](../evidence/counter-testnet-preparation/2026-10-26T07-27-58-544Z/Counter.standard-input.json) | Original source and matching compiler settings |
| [Standard JSON output](../evidence/counter-testnet-preparation/2026-10-26T07-27-58-544Z/Counter.standard-output.json) | Creation/runtime bytes match Forge exactly; ABI matches structurally |

Forge serializes ABI object keys in a different order from solc's standard JSON output. ABI parity was therefore checked structurally; creation and runtime hex bytes were compared exactly. The prepared standard JSON input is a reproducible compiler input, not evidence that an explorer has accepted or verified it.

## Read-only creation simulation

The [simulation report](../evidence/counter-testnet-preparation/2026-10-26T07-27-58-544Z/creation-simulation.json) was captured from `2026-10-26T07:35:07.135Z` to `07:35:08.171Z`. A fresh selected-network preflight passed for chain `1983` (`0x7bf`) on `https://rpc2testnet.qie.digital/`.

The script omitted `to` and supplied the exact 327-byte initcode, native value zero and the explicitly synthetic sender `0x0000000000000000000000000000000000000000`. It used `eth_call` and `eth_estimateGas` at the recorded block. These JSON-RPC methods simulate execution without submitting a transaction; see the [execution API reference](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_call).

| Check | Observation |
|---|---|
| Simulation block | `9379619` / `0x8f1f23` |
| Block hash | `0xafb6b834f8efe0ceb8fd50b6ff92f35956236444511c2d497af534312e7e4c28` |
| Block timestamp | `2026-10-26T07:34:59Z` |
| Creation-call result | All 296 returned runtime bytes match the compiled runtime |
| Block reread | The same block number still returned the same hash |
| Gas estimate | `116739` / `0x1c803` gas units |
| RPC gas-price quote | `7` / `0x7` native base units per gas |
| Sampled block base fee | `7` / `0x7` native base units per gas |
| Estimate × quoted gas price | `817173` native base units |
| Formatting with documented 18 decimals | `0.000000000000817173` QIE |

The [official wallet guide](https://docs.qie.digital/qie-wallet-integration-guide-for-websites.md) explicitly documents 18 decimals for QIE testnet. Its retrieval receipt and digest are in `run.json`; the currency configuration remains documented source information. All quote arithmetic uses integers. The quote has no safety margin, selected fee mode or approved spend cap, and it is not an estimate for the future developer account. It does not establish fee acceptance by a wallet or validator.

The RPC client-version response identifies a development build without release identifiers. The observation therefore proves only that this exact initcode executed in this endpoint's simulation at the sampled block; it does not qualify every QIE opcode, tool version or deployment provider. The block reread does not establish finality.

## Unsigned review and signer handoff

The review binds the canonical source digest, Forge artifact digest, ABI digest, complete creation data, zero native value and selected testnet. Constructor arguments are empty. The public `from` account, nonce, transaction type, gas limit, fee parameters and maximum spend remain `null`; the all-zero simulation sender is not assigned as the deployment signer. Approval is `NOT_REQUESTED`.

The selected signer route is a **developer-controlled injected EIP-1193 wallet**. The account is selected through that wallet when connected. The next preparation pass must record the actual public account and provider/version, query its balance and nonce, repeat the creation simulation and estimate for that account, and construct a reviewed fee/spend envelope. A real submission additionally needs an explicitly approved wallet action and a qualified submission path.

After an externally approved deployment, proof must bind the actual transaction and created address to this initcode, compare runtime and initial state, and link any increment transaction to its observed effect. Explorer source verification and a reviewed QIE finality policy remain separate proof requirements. `APPLICATION_VERIFIED` is not established by these simulations.

## Replay and integrity

The [evidence replay script](../evidence/counter-testnet-preparation/2026-10-26T07-27-58-544Z/simulate-creation.mjs) verifies input fingerprints before making bounded read-only requests. It uses only the selected public testnet endpoint, a 10-second per-request timeout and a 1 MiB response ceiling. It retains the synthetic sender for this captured experiment. Replaying produces a new observation; it does not refresh an actual-signer quote.

From the repository root, write a new report outside the captured directory:

```sh
node docs/evidence/counter-testnet-preparation/2026-10-26T07-27-58-544Z/simulate-creation.mjs > /tmp/qie-counter-new-creation-simulation.json
```

To verify retained artifacts without contacting the network:

```sh
cd docs/evidence/counter-testnet-preparation/2026-10-26T07-27-58-544Z
sha256sum --check SHA256SUMS
```

The [run metadata](../evidence/counter-testnet-preparation/2026-10-26T07-27-58-544Z/run.json) preserves canonical input and compiler artifact hashes. The [checksum inventory](../evidence/counter-testnet-preparation/2026-10-26T07-27-58-544Z/SHA256SUMS) covers the capture files. CI keeps live QIE simulations separate from deterministic tests and does not run this replay.
