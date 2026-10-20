# Select and inspect a QIE EVM network

**Scope:** EVM Mainnet or Testnet, explicitly chosen; native QIE is outside this procedure. Published configuration is DOCUMENTED (source S03), RPC compatibility UNKNOWN. Executed regression evidence is MOCK, not live. Node 24.20.0 is the tested runtime.

**Inputs:** intended network, installed skill directory `SKILL_DIR`, optional public same-network HTTPS endpoint. Ask for a missing target; preserve an explicit Mainnet request. No signer or funds are needed. Never paste a credential-bearing endpoint into logs.

1. Inspect the selected records in [packaged claims](../../data/network-claims.json); match `network_id`, `chain_id`, `rpc_url` and source records. Do not infer native identifiers, token decimals, gas rules or provider-wide support.
2. From any working directory, run exactly the selected-network command, substituting the installed path and the selected ID:

```sh
node "$SKILL_DIR/scripts/verify-network.mjs" qie-testnet
```

For an explicit Mainnet task the argument is `qie-mainnet`. Optional `--rpc "$RPC_URL"` replaces only the endpoint, never the canonical expected chain ID. There is no automatic failover.

3. Capture the JSON report and the process exit separately. `0` requires `live_check.outcome: PASS`; `1` means FAIL/UNKNOWN; `2` is a usage/dependency error. The checks observe only `eth_chainId` plus a nonzero latest block, under the B06 bounded read transport. A report existing is not a passing preflight.
4. Record network, endpoint host, observed chain/block, source status, errors and limits. PASS never promotes a catalogue record and makes no freshness/finality claim. A future write still requires separately established tool compatibility, fees, explicit review and an external signer.

**Failures/recovery:** WRONG_CHAIN stops after identity lookup; inspect configuration without switching networks. RPC_UNAVAILABLE/RPC_RATE_LIMITED leaves UNKNOWN; deliberately retry a read or evaluate another official endpoint on the same network. RPC_MALFORMED requires preserving a redacted minimal reproduction. UNSUPPORTED_PROVIDER establishes only that method failure, not that another provider works. Missing packaged files require reinstalling a coherent release; no root-checkout fallback.

**Success:** a correctly scoped identity/responsiveness observation, or an explicit blocker. Offline/mock reports are labelled as such; they cannot satisfy a live-write prerequisite.
