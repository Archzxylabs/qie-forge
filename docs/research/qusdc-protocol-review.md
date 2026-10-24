# QUSDC protocol review

**Reviewed:** 2026-10-24T20:00:51Z  
**SDK commit:** `qieadmin/qusdc-sdk@0877597f8bd51f7c21bb04e70009d3e9cab86944`

## Architecture map

```text
USDC on Ethereum
      │ bridge / lock-release dependency
      ▼
WUSDC on QIE  ── approve(vault, raw amount) ──► QUSDC Vault
                                                    │
                              depositAndMint(amount)│
                                                    ▼
                                              QUSDC receipt token
                                                    │
                              burnAndWithdraw(amount)│
                                                    ▼
WUSDC on QIE ◄────────────── released backing asset
```

The QUSDC documentation describes QUSDC as a 1:1 receipt for deposited USDC. Its detailed flow clarifies that native Circle USDC is not present on QIE in the described model: bridged value appears as WUSDC, WUSDC is deposited to mint QUSDC, and burning QUSDC releases WUSDC. QUSDC is therefore not the same token as USDC or WUSDC.

## SDK implementation facts

The pinned repository is an ESM package named `qusdc-sdk`, version `1.0.0`, using ethers `^6.0.0`. `QUSDCSdk` requires `signer`, `vaultAddress`, `wusdcAddress`, and optional `confirmations` defaulting to `1`.

The exact ABI fragments are:

```solidity
function depositAndMint(uint256 amount) external;
function burnAndWithdraw(uint256 amount) external;
function approve(address spender,uint256 amount) returns(bool);
function allowance(address owner,address spender) view returns(uint256);
function decimals() view returns(uint8);
```

Implementation behavior:

- Reads WUSDC decimals once and caches them.
- Parses string/number amounts using `ethers.parseUnits` with WUSDC decimals.
- Treats bigint input as already-raw units.
- Rejects undefined/null and values that fail its positive check.
- Reads allowance for signer → vault and sends an exact approval when needed.
- Calls `estimateGas` before mint and burn.
- Waits for configured confirmations and returns the receipt.

Important source limitations:

- No deployment address appears in the SDK source or package metadata.
- The SDK does not instantiate or validate a QUSDC token contract.
- The same WUSDC-derived parsing scale is used for burn; deployed QUSDC unit equality is not established.
- A receipt is not proof that QUSDC was minted, WUSDC was redeemed, or reserves remain available.
- The positive check uses `Number(amount)` for non-bigint inputs; callers should validate large values before passing them.

## Economic evidence boundary

The issuer documents full reserve backing, permissionless minting and redemption, no algorithmic mechanism, and on-chain supply/reserve accounting. Those are DOCUMENTED issuer claims. They do not independently establish:

- current reserve reconciliation;
- deployed contract ownership or upgrade controls;
- pause/emergency/fee behavior;
- redemption liquidity or delay under stress;
- bridge security;
- QUSDC market price stability;
- the legal or economic value of underlying USDC.

The documentation itself discloses dependencies on USDC, fiat reserves and external bridging. A developer must not turn “1 QUSDC represents 1 USDC” into “QUSDC/USD market value is guaranteed.”

## Address candidates and conflicts

The Lending SDK publishes `0x3F43DA82eC9A4f5285F10FaF1F26EcA7319E5DA5` as the QUSDC market underlying candidate. The QUSDC SDK does not identify it as WUSDC, QUSDC or the vault. This candidate is recorded as `CONFLICTED`/discovery-only in `knowledge/addresses.yaml` and `knowledge/conflicts.yaml`.

No QUSDC vault, WUSDC token or QUSDC token is executable in this release. No live `eth_getCode`, ABI match, proxy inspection or issuer-authenticated deployment observation was run.

## Safe integration outputs

The `qusdc-escrow` recipe contains a clearly labelled local mock token, vault and escrow. It uses integer raw units, tests allowance/mint/burn/claim/pause/failure paths, and makes no claim that the mock is deployed QUSDC. The correct production next step is an identity-gate review, not a guessed address.
