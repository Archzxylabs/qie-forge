# QIE developer domain inventory

[`knowledge/domains.yaml`](../knowledge/domains.yaml) is the canonical D01–D15 inventory. Each entry includes user intents, network/navigation scope, official source IDs, available entry skill, planned target, coverage level, capability IDs, validation test IDs, verification status, missing information and an explicit nullable maintainer. All fifteen domains are present. D01 and D12 route through `qie`; D02 uses `qie-networks`. B07 adds local-reference entry skills for D03, D04, D06, D07, D13 and D14, with scoped recipes and explicit limits. The remaining domains retain planned routes and official source navigation. A released skill is not evidence that its QIE capabilities are verified.

Read status in its scope. `coverage_level: NAVIGATION` describes a source entry point, not an executable workflow. A DOCUMENTED product name, architecture overview or published endpoint is not tested integration support. Domain capability records carry their own statuses in [`capabilities.yaml`](../knowledge/capabilities.yaml); all eight are UNKNOWN. Named QIE ecosystem products and familiar EVM tools remain research targets for QIE interoperability; a successful local tool replay has narrower authority.

The source registry is [`sources.yaml`](../knowledge/sources.yaml). The current primary entry points are:

| ID | Source | Use and limit |
|---|---|---|
| S00 | [Official documentation](https://docs.qie.digital/) | Documentation discovery; not blanket coverage evidence |
| S03 | [Mainnet/testnet access](https://docs.qie.digital/getting-started-with-qie-blockchain/4.-access-mainnet-or-testnet) | Published EVM network facts; no endpoint liveness or runtime proof |
| S04 | [QIE V3 features](https://docs.qie.digital/what-is-qie/qie-v3-key-features) | Published architecture and EVM/native distinction; no tested native procedure |
| S01 | [Official builder entry point](https://hackathon.qie.digital/) | Marketing/discovery tier T4; no sole-source operational promotion |
| S08 | [qieadmin repositories](https://github.com/qieadmin) | Repository navigation; individual project versions not validated |
| S09 | [qie-blockchain repositories](https://github.com/qie-blockchain) | Chain-source discovery; no release/native CLI compatibility claim |

The eleven scalar facts in [`claims.yaml`](../knowledge/claims.yaml) use S03, retain DOCUMENTED status and have no fabricated runtime `checked_at`. Mainnet/testnet native-currency display symbols follow the published page; decimals, active chain identity and provider compatibility remain gaps. [`addresses.yaml`](../knowledge/addresses.yaml) now retains source-published discovery candidates, all blocked from execution because [`validation-runs.yaml`](../knowledge/validation-runs.yaml) is empty and local packaging tests are not QIE runtime observations.

Source review timestamps record the actual documentation inspection. Null source hashes, publication timestamps and licenses disclose unavailable metadata. No external documentation text or third-party skill code was copied into a skill. Names and factual network settings are represented as attributed structured facts; workflow prose and all QIE Forge code are original.

Future curation should replace broad entry-point leads with component-specific official documentation and release evidence, fill a domain's recorded gap, assign a real maintainer, and add relevant validation evidence before promoting an operation. Do not infer UNSUPPORTED from missing documentation. Run `npm run build` and `npm run validate` after changing canonical records so the installed snapshot stays derived from the same data.
