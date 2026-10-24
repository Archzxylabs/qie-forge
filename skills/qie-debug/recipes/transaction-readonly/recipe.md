<!-- GENERATED — DO NOT EDIT. Change canonical authoring or knowledge. -->

# QIE read-only transaction troubleshooting

**Scope:** inspect an already supplied transaction hash without signing, resubmitting or assuming finality.

1. Confirm the selected network with `eth_chainId` and a responsive latest block. Stop on wrong chain; do not try another network.
2. Read the transaction and receipt, validate the requested hash, block number, status, target/created address and logs.
3. If a contract was created, read runtime code at the observed block context when available. Code presence is not issuer identity.
4. Decode logs only with the independently reviewed ABI. A generic receipt cannot prove a QUSDC mint, Lending supply, bridge delivery or application effect.
5. Report inclusion, execution, identity linkage, application effect and finality separately. The current helper keeps finality UNKNOWN.
6. Never resubmit merely because a receipt is missing or pending; classify transport, nonce and provider hypotheses first.

Use the bundled transaction observer and record endpoint, timestamp, selected network, exact scope and all unresolved checks. A report with exit code 0 means an observation was produced, not that the requested operation succeeded.
