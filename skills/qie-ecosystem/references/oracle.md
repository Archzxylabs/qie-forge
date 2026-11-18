# QIE Oracle

Price feeds on QIE mainnet with a Chainlink-compatible **AggregatorV3** interface: `latestRoundData()`, `getRoundData(uint80)`, `decimals()`, `description()`. Feed addresses are listed in `qie-addresses`. They are documented in the [official contract table](https://docs.qie.digital/qie-oracle/deployed-contracts/table-of-assets-contract-mapping.md). The [query examples](https://docs.qie.digital/qie-oracle/deployed-contracts/query-examples.md) show `latestRoundData`, `getRoundData` and `decimals`; `description()` and `version()` come from the verified ABI. Mainnet only: no testnet feed addresses are published.

## Observed behaviour (2026-11-16 and 2026-11-17)

- All 7 feeds return 8 decimals.
- `description()` reads e.g. `BTC / USDT`. Quotes are in **USDT** (gold: `Gold / USD`).
- Updates are irregular. One snapshot (2026-11-16): BTC/ETH/XRP/SOL/BNB had been updated ~3 min earlier and gold ~9 min earlier, but **QIE / USDT was ~20 h old**. Over ~60 h of `AnswerUpdated` logs (2026-11-15 to 11-17), the longest gap between updates was:

  | Feed | BTC | ETH | XRP | SOL | BNB | Gold | QIE |
  |---|---|---|---|---|---|---|---|
  | Longest gap | 85 min | 86 min | 84 min | 60 min | 2.8 h | 14.3 h | 20 h |

  Docs say crypto feeds update "every few minutes"; treat that as a goal, not a guarantee.
- Feeds are updated by transactions from an off-chain updater. A feed can lag during outages.

## Solidity consumer (compile with `evm_version = "shanghai"`)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface AggregatorV3Interface {
    function decimals() external view returns (uint8);
    function description() external view returns (string memory);
    function latestRoundData()
        external
        view
        returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound);
}

contract PriceReader {
    AggregatorV3Interface public immutable feed;
    uint256 public immutable maxAge; // seconds, per feed: measure its real update gaps first (BTC went 85 min without one)

    constructor(AggregatorV3Interface feed_, uint256 maxAge_) {
        feed = feed_;
        maxAge = maxAge_;
    }

    /// @return price scaled to 18 decimals
    function price18() public view returns (uint256) {
        (uint80 roundId, int256 answer,, uint256 updatedAt, uint80 answeredInRound) = feed.latestRoundData();
        require(answer > 0, "oracle: non-positive");
        require(updatedAt != 0 && answeredInRound >= roundId, "oracle: incomplete round");
        require(block.timestamp - updatedAt <= maxAge, "oracle: stale");
        uint8 d = feed.decimals();
        return d <= 18 ? uint256(answer) * 10 ** (18 - d) : uint256(answer) / 10 ** (d - 18);
    }
}
```

Rules:
- **Fail closed** when stale or invalid. Never fall back to the last good price silently.
- Pick `maxAge` per feed from observed cadence. The QIE/USDT feed can be hours old, so either accept a long window explicitly or pause QIE-collateral actions.
- Integer math only. Off-chain, never do `Number(answer) / 1e8` for money: use `bigint` and `formatUnits`.
- Check `description()` at deploy or config time to make sure the address is the feed you think it is.
- USDT ≠ USD. If your app needs USD, document the assumption or add a USDT/USD source.

## Read off-chain (viem)

```ts
import { parseAbi, formatUnits } from 'viem';
const abi = parseAbi([
  'function decimals() view returns (uint8)',
  'function description() view returns (string)',
  'function latestRoundData() view returns (uint80, int256, uint256, uint256, uint80)',
]);
const [, answer, , updatedAt] = await client.readContract({ address: FEED, abi, functionName: 'latestRoundData' });
const ageSec = BigInt(Math.floor(Date.now() / 1000)) - updatedAt;
const price = formatUnits(answer, 8);
```

```bash
cast call <FEED> "latestRoundData()(uint80,int256,uint256,uint256,uint80)" --rpc-url https://rpc1mainnet.qie.digital/
```

## Local testing

Use a mock aggregator in tests (fresh, stale, zero, negative, very large answers). The docs suggest deploying your own `AggregatorV3` mock with `updateAnswer(int256)`. In Foundry, `vm.warp` lets you push `block.timestamp` past `maxAge`. Fork tests against the real feeds: `forge test --fork-url https://rpc1mainnet.qie.digital/`.

## The Lending protocol's own oracle

QIE Lending uses its own Compound-style price oracle contract (`getUnderlyingPrice(qToken)`, see [lending.md](lending.md)). It prices WQIE, WETH and WBNB at exactly the QIE/USDT, ETH/USDT and BNB/USDT feed answers (× 1e10, observed 2026-11-17) and fixes QUSDC at 1.00, so feed staleness flows straight into QIELend.
