// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.37;

import {MockToken, MockQusdcVault, MockQusdcEscrow} from "../src/MockQusdcEscrow.sol";

contract MockQusdcEscrowTest {
    MockToken private wusdc;
    MockToken private qusdc;
    MockQusdcVault private vault;
    MockQusdcEscrow private escrow;

    function setUp() public {
        wusdc = new MockToken("Mock WUSDC", "mWUSDC", 6);
        qusdc = new MockToken("Mock QUSDC", "mQUSDC", 6);
        vault = new MockQusdcVault(wusdc, qusdc);
        qusdc.setMinter(address(vault));
        escrow = new MockQusdcEscrow(qusdc);
        wusdc.mint(address(this), 2_000_000);
    }

    function testMintAndRedeemKeepRawUnits() public {
        wusdc.approve(address(vault), 1_250_000);
        vault.depositAndMint(1_250_000);
        require(qusdc.balanceOf(address(this)) == 1_250_000, "mint scale");
        require(wusdc.balanceOf(address(vault)) == 1_250_000, "reserve scale");

        vault.burnAndWithdraw(250_000);
        require(qusdc.balanceOf(address(this)) == 1_000_000, "burn scale");
        require(wusdc.balanceOf(address(this)) == 1_000_000, "withdraw scale");
    }

    function testEscrowClaimAndPause() public {
        wusdc.approve(address(vault), 1_000_000);
        vault.depositAndMint(1_000_000);
        qusdc.approve(address(escrow), 1_000_000);
        escrow.deposit(1_000_000);
        escrow.award(address(this), 400_000);
        escrow.claim();
        require(qusdc.balanceOf(address(this)) == 400_000, "claim amount");

        escrow.setPaused(true);
        (bool ok,) = address(escrow).call(abi.encodeCall(MockQusdcEscrow.deposit, (1)));
        require(!ok, "paused deposit");
    }

    function testRejectsZeroAndUnknownCalls() public {
        (bool zeroOk,) = address(vault).call(abi.encodeCall(MockQusdcVault.depositAndMint, (0)));
        require(!zeroOk, "zero mint");
        (bool unknownOk,) = address(vault).call(hex"ffffffff");
        require(!unknownOk, "unknown selector");
    }
}
