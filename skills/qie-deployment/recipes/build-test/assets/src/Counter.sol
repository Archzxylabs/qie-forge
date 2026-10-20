// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.37;

/// @notice Original local teaching fixture. No custody, token or admin interface.
/// @dev Anyone may increment. This is not an audited production application.
contract Counter {
    uint256 public value;

    function increment() external {
        value += 1;
    }
}
