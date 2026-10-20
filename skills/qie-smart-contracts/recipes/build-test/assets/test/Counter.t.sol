// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.37;

import {Counter} from "../src/Counter.sol";

contract CounterTest {
    function testStartsAtZero() public {
        Counter counter = new Counter();
        require(counter.value() == 0, "initial state");
    }

    function testIncrementChangesState() public {
        Counter counter = new Counter();
        counter.increment();
        require(counter.value() == 1, "increment effect");
    }

    function testInstancesHaveIndependentState() public {
        Counter first = new Counter();
        Counter second = new Counter();
        first.increment();
        require(second.value() == 0, "state isolation");
    }

    function testUnknownFunctionReverts() public {
        Counter counter = new Counter();
        (bool ok,) = address(counter).call(hex"ffffffff");
        require(!ok, "unknown function accepted");
    }

    function testFuzzIncrementCount(uint8 count) public {
        Counter counter = new Counter();
        uint256 steps = uint256(count) % 16;
        for (uint256 i; i < steps; ++i) counter.increment();
        require(counter.value() == steps, "count mismatch");
    }
}
