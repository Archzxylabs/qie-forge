# QUSDC

QUSDC is QIE's USDC-backed receipt token. Official docs: https://docs.stable.qie.digital/ (pages also as `.md`). Official SDK: [qieadmin/qusdc-sdk @ `0877597`](https://github.com/qieadmin/qusdc-sdk/tree/0877597f8bd51f7c21bb04e70009d3e9cab86944).

## Model (documented)

```
USDC (Ethereum) ──bridge──▶ WUSDC (QIE) ──vault.depositAndMint(amount)──▶ QUSDC (QIE)
                                  ◀──vault.burnAndWithdraw(amount)────────
```

- Keep **USDC**, **WUSDC** and **QUSDC** separate in code and UI. They are different tokens and contracts.
- Vault interface used by the SDK: `depositAndMint(uint256)` and `burnAndWithdraw(uint256)`. Deposits need a prior WUSDC `approve(vault, amount)`.
- "1:1 backed", permissionless minting, redemption and transparency are **issuer claims**. They don't guarantee market price, reserves or redemption liquidity. Say so when it matters.

## Contracts (mainnet)

Published by the official reserves API https://reserves.qie.digital/api/reserves. Full table in `qie-addresses`.

| Role | Address |
|---|---|
| QUSDC (6 decimals) | `0x3F43DA82eC9A4f5285F10FaF1F26EcA7319E5DA5` |
| WUSDC (6 decimals, collateral) | `0xA6d5BadE588699aD37dc29110aca0852575e26cb` |
| Vault | `0xdC20F1fee9e03184ddabcCe96F01E3c570E43D45` |

Observed 2026-11-16:
- `vault.invariantHolds()` returned `true`.
- WUSDC held by the vault exactly equals QUSDC `totalSupply()` (9,022.132).

Check it yourself:

```bash
R=https://rpc1mainnet.qie.digital/
cast call 0x3F43DA82eC9A4f5285F10FaF1F26EcA7319E5DA5 "totalSupply()(uint256)" --rpc-url $R
cast call 0xA6d5BadE588699aD37dc29110aca0852575e26cb "balanceOf(address)(uint256)" 0xdC20F1fee9e03184ddabcCe96F01E3c570E43D45 --rpc-url $R
```

Trust model: the reserves API states that the admin can grant or revoke the vault's minting role, and that the USDC↔WUSDC bridges are run by a designated operator address (trusted, not trustless). On-chain (verified QUSDC source, observed 2026-11-17), the admin `0xe1ac…8D28` is an EOA holding `DEFAULT_ADMIN_ROLE`, and `VAULT_ROLE`, held only by the vault today, can both `mint(to, amount)` and `burn(from, amount)` with no allowance. The docs' "No admin key that can mint tokens" and "There is no admin key or discretionary minting capability" describe today's role assignment, not a hard limit. **WUSDC ≠ wUSDC.eth**: wUSDC.eth (`0x0e93…aec7`) comes from the separate stablecoin bridge and is not QUSDC collateral.

## SDK (documented, source-reviewed)

- ESM, ethers v6: `new QUSDCSdk({ signer, vaultAddress, wusdcAddress, confirmations })`, then `sdk.mint(amount)` / `sdk.burn(amount)`.
- The SDK ships **no addresses**: you must pass `vaultAddress` and `wusdcAddress`. Take them only from an official source and verify them (`qie-addresses` checklist).
- It reads WUSDC `decimals()` and uses it for both mint and burn parsing. Equal decimals for QUSDC aren't guaranteed by the SDK; read both tokens' `decimals()`.
- It validates amounts with `Number(amount) > 0`. Validate large inputs yourself (use `bigint`/`parseUnits`).
- **Not on npm.** Install from a pinned commit: `npm install github:qieadmin/qusdc-sdk#0877597f8bd51f7c21bb04e70009d3e9cab86944`.

## Accepting QUSDC payments / escrow

Accounting rules:
- Integer raw units only, and read `decimals()` from the token. QUSDC on mainnet reported 6 decimals.
- Credit the **balance delta** you actually received, not the requested amount.
- Use SafeERC20-style transfers.
- Every settlement can happen once, by an authorized party. Effects come before the transfer.

Minimal escrow that follows those rules (compile with `evm_version = "shanghai"`; uses OpenZeppelin v5, pinned to v5.4.0 as in `qie-scaffold`):

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol"; // not ReentrancyGuardTransient: no TSTORE on QIE

/// A payer locks tokens for a payee; the arbiter (or the payer) releases, the arbiter (or the payee) refunds.
contract TokenEscrow is ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum State { None, Funded, Released, Refunded }
    struct Deal { address payer; address payee; uint256 amount; State state; }

    IERC20 public immutable token;
    address public immutable arbiter;
    uint256 public nextId;
    mapping(uint256 => Deal) public deals;

    event Funded(uint256 indexed id, address indexed payer, address indexed payee, uint256 amount);
    event Released(uint256 indexed id);
    event Refunded(uint256 indexed id);

    constructor(IERC20 token_, address arbiter_) {
        require(address(token_) != address(0) && arbiter_ != address(0), "zero address");
        token = token_;
        arbiter = arbiter_;
    }

    function fund(address payee, uint256 amount) external nonReentrant returns (uint256 id) {
        require(payee != address(0) && amount > 0, "bad args");
        uint256 before = token.balanceOf(address(this));
        token.safeTransferFrom(msg.sender, address(this), amount);
        uint256 received = token.balanceOf(address(this)) - before; // what actually arrived
        require(received > 0, "nothing received");
        id = nextId++;
        deals[id] = Deal(msg.sender, payee, received, State.Funded);
        emit Funded(id, msg.sender, payee, received);
    }

    function release(uint256 id) external nonReentrant {
        Deal storage d = deals[id];
        require(d.state == State.Funded, "not funded");
        require(msg.sender == arbiter || msg.sender == d.payer, "not allowed");
        d.state = State.Released;
        token.safeTransfer(d.payee, d.amount);
        emit Released(id);
    }

    function refund(uint256 id) external nonReentrant {
        Deal storage d = deals[id];
        require(d.state == State.Funded, "not funded");
        require(msg.sender == arbiter || msg.sender == d.payee, "not allowed");
        d.state = State.Refunded;
        token.safeTransfer(d.payer, d.amount);
        emit Refunded(id);
    }
}
```

Test at least:
- unauthorized `release`/`refund`
- double release
- refund after release
- zero amount
- insufficient allowance
- a fee-on-transfer mock (balance delta < amount)
- a token that returns no bool (SafeERC20 path)
- multiple concurrent deals not interfering

Adapt the authorization model (deadlines, disputes, partial releases) to the product. Keep the "one settlement per deal" invariant.
