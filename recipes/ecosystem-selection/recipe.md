# Select a QIE ecosystem product

**Scope:** choose a source-grounded implementation path without treating a product catalogue, web UI or SDK repository as deployment proof.

## Decision sequence

1. Identify the developer operation: read, token transfer, mint/redeem, lending read, swap, bridge, identity resolution, oracle read, native delegation or deployment.
2. Identify the exact network and layer: QIE EVM Mainnet, QIE EVM Testnet or native Cosmos. Never merge native and EVM account formats.
3. Load the matching integration record and its operation. State what is DOCUMENTED, CLAIMED, UNKNOWN, CONFLICTED or DEPRECATED.
4. Prefer the source-backed interface: pinned SDK source, ABI fragment, EIP-1193 guide, JSON-RPC read or native registry record.
5. Use a generic EVM local pattern only as a fallback, clearly labelled generic and mock-only.
6. Return the strongest safe next action, exact blocker and source that would resolve it. Do not invent an address, endpoint, ABI or package publication.

## Product-specific fallback

- QUSDC: build a mock WUSDC/QUSDC vault and escrow; block live writes until vault, WUSDC and QUSDC identity passes the address gate.
- Lending: build a provider-only adapter and mock market responses; never approve or borrow while market metadata is unresolved.
- DEX/Bridge: use the web product only as a discovery lead; do not synthesize routers, factories, bridge contracts or relayer calls.
- QIE ID/Pass: treat names and verification claims as identity inputs requiring a documented resolver and replay-protected consent flow.
- Oracle: use dynamic feed decimals and updatedAt checks; block collateral decisions on unverified feed identity.
- Native staking: route to native Cosmos sources and `aqie`; do not substitute an EVM staking contract.
