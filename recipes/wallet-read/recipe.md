# Wallet connection and guarded contract read

**Scope/evidence:** a framework-neutral TypeScript controller with mock EIP-1193 provider tests. Node 24.20.0 executes its erasable types; this is not a TypeScript typecheck, real browser UI test or proof that a wallet/SDK/RPC works on QIE. `wallet-connect` remains UNKNOWN on both QIE EVM networks. Native accounts/delegation are excluded.

**Inputs:** explicitly selected EVM Mainnet/Testnet; installed `SKILL_DIR`; existing frontend/provider selected by the developer; actual provider/version evidence for live use; supplied contract address with issuer/ABI provenance; reviewed ABI-derived calldata for a single uint256 getter. Missing target identity or live compatibility blocks production integration. No contract address, wallet brand, native currency decimals or supported SDK is invented.

1. Read the [packaged network/evidence snapshot](../../data/network-claims.json). Set `NETWORK_ID` to the explicit `qie-mainnet` or `qie-testnet` selection and `PUBLIC_RPC_URL` to its documented public endpoint (or a deliberately selected same-network alternative). Run the [preflight helper](../../scripts/verify-network.mjs):

```sh
node "$SKILL_DIR/scripts/verify-network.mjs" "$NETWORK_ID" --rpc "$PUBLIC_RPC_URL"
```

An exit 0 requires an identity/responsiveness PASS; exit 1/2 stops this flow. Inspect effective claims as well: stale/conflicted records block dependent use. A matching RPC observation does not test the wallet's provider or signing behavior.
2. Inspect [the read controller](assets/wallet-read.ts). Materialize it and the [shared status evaluator](../../scripts/lib/effective-status.mjs) in the existing frontend, preserving their relative import layout (or explicitly rebase that import and run the app's compiler). Include the selected snapshot as local configuration. Never ship a private RPC credential to the browser.
3. Create one session with `createReadSession(selectedProvider, snapshot, networkId, { onState: render })`. `selectedProvider` must expose request/on/removeListener. Call `connect()` only from the user's Connect button; never at page load. Before requesting accounts and after receiving them, the controller checks the provider's actual chain. It does not request network switching, signing or transactions.
4. Bind the view using text-safe rendering. Disable Read unless `phase === 'ready'`; disable any application's write controls until their independent prerequisites pass. Render account, selected network, pending/error state and returned value. Example wiring for an existing UI:

```ts
const session = createReadSession(selectedProvider, snapshot, networkId, {
  onState(state) {
    readButton.disabled = state.phase !== 'ready';
    output.textContent = state.error ?? state.value?.toString() ?? state.phase;
  },
});
connectButton.onclick = () => session.connect().catch(showClassifiedError);
readButton.onclick = () => session.readUint256(reviewedAddress, abiDerivedCalldata).catch(showClassifiedError);
// On unmount: session.dispose();
```

The names for DOM nodes, provider, network, artifact calldata and error renderer are supplied by the existing app; this excerpt is integration wiring, not a standalone app. Only a getter returning exactly one ABI-encoded uint256 is supported by this fixture. Use the app's separately tested ABI decoder for other types/functions.

5. Accounts/chain/disconnect events clear the old account/value and require an explicit reconnect. Chain identity is checked before and after each read; in-flight results from an invalidated session are discarded. Requests bound the UI wait; they cannot cancel an underlying third-party provider operation. A thrown request or malformed result clears displayed state and reports a class instead of retaining a plausible old value.
6. After an external approved transaction, obtain scoped receipt/target/effect evidence first, then call `readUint256` again to refresh. A changed read alone does not prove transaction causality or finality; do not label the application verified.

**Failures/recovery:** 4001 → USER_REJECTED, allow deliberate reconnect. WRONG_CHAIN → clear state; developer selects the intended network externally then reconnects. Empty/malformed call/account/chain data → RPC_MALFORMED. Provider event during work → SESSION_CHANGED; discard the result. Missing listeners/invalid inputs → DEPENDENCY_MISMATCH. Offline/timeout/unsupported request → unavailable observation, not a supported alternative. Stale/conflicted chain evidence blocks the read. No automatic writes or retries.

**Success:** local/mock tests prove explicit connection, correct-chain gating, uint256 decoding, invalidation and refresh. Live success additionally requires a recorded selected wallet/version/network, real account/chain UI, observed contract read and app-specific tests; those remain NOT_RUN. A genuine app also needs its framework build/typecheck, DOM/browser smoke tests and independently approved write path.

Primary interface reference: [EIP-1193](https://eips.ethereum.org/EIPS/eip-1193). The standard defines the interface; it does not establish QIE support.
