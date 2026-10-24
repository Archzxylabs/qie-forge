<!-- GENERATED — DO NOT EDIT. Change canonical authoring or knowledge. -->

# QUSDC payment or escrow integration

**Scope:** local-only payment, escrow and revenue-sharing design using a clearly labelled mock. The QUSDC production vault, WUSDC token and QUSDC token remain address-gated.

## Source-grounded protocol flow

The reviewed QUSDC documentation describes a receipt model: USDC value bridged from Ethereum appears on QIE as WUSDC; WUSDC is deposited to mint QUSDC; QUSDC is burned to release WUSDC. The reviewed official SDK calls `depositAndMint(uint256)` and `burnAndWithdraw(uint256)`, accepts separate `vaultAddress` and `wusdcAddress` inputs, reads WUSDC decimals and waits for configured confirmations.

Do not collapse USDC, WUSDC and QUSDC into one symbol. The product pages use generic USDC language in places, while the detailed flow and SDK require WUSDC at the implementation boundary.

## Local implementation

1. Copy [the local mock Foundry configuration](assets/foundry.toml) and the adjacent `assets/src` and `assets/test` trees into a new empty Forge project.
2. Run the exact compiler and Forge pins from `recipes/build-test/toolchain.json`.
3. Run the mock tests. They prove only local transfer, allowance, mint, burn and escrow accounting behavior.
4. Adapt the escrow contract to the application's claim authorization, refund, pause, role and revenue-sharing rules.
5. Keep the production adapter address-free until the identity gate passes.

## Production blockers

- Current production identities for WUSDC, QUSDC and the vault are unresolved.
- The SDK does not publish a deployment address or prove that the deployed vault accepts the same unit scale for mint and burn.
- A receipt cannot prove QUSDC delivery, WUSDC redemption, reserve backing, market price or finality.
- Confirm pause, fee, emergency, upgrade and redemption-liquidity behavior from the deployed contracts before relying on them.
- A QUSDC 1:1 receipt claim is not a guarantee that the market price stays at one dollar.

## Accounting and failure cases

Use raw integer units and an explicit denomination for each asset. Test wrong decimals, insufficient allowance, insufficient balance, transfer failure, paused vault, failed redemption, duplicate claims, refund after expiry, reentrancy, zero amount and integer rounding. Never put a real private key, credential or KYC payload in the fixture.
