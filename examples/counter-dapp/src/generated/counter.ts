// GENERATED FILE — DO NOT EDIT. Derived from recipes/build-test/assets/src/Counter.sol
// by scripts/prepare-counter-example.mjs with the pinned local Forge 1.8.1
// and solc 0.8.37+commit.f401782d. Regenerate with: npm run example:prepare
//
// The canonical contract source and tests stay in recipes/build-test/assets.
export const COUNTER_SOURCE_SHA256 = 'd48a5a381722d110299b9ef71492c6e41ad6ef4f22a446a7fbe21b7c4c0f8070';

// value() selector from the compiled artifact; used as read-only eth_call calldata.
export const COUNTER_VALUE_SELECTOR = '3fa4f245';

export const COUNTER_ABI = [
  {
    "type": "function",
    "name": "increment",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "value",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  }
] as const;
