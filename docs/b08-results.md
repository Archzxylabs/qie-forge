# QIE Forge — Milestone B08 Implementation Results
## Canonical QIE Knowledge, Ecosystem Intelligence & Evidence-Based Compatibility

- **Milestone**: B08 (PRD v2.1 FR-004, Architecture Study B08, QF-008) — remediated per independent audits
- **Status**: Complete & Verified (post-remediation; see [b08-remediation-results.md](b08-remediation-results.md))
- **Release Version**: `0.5.1-ecosystem.1`
- **Schema & Policy Version**: `1.4.0`
- **Release Date**: 2026-10-19T22:35:15Z
- **Test Suite Results**: 270/270 tests passing (100%)
- **Skills CLI Installation Tests**: 20/20 installation fixtures passing (all 9 skills in symlink and copy modes)
- **Test Coverage**: 97.72% lines, 88.37% branches, 98.92% functions (executed run; see [b08-remediation-results.md](b08-remediation-results.md))

---

## 1. Executive Summary

Milestone B08 delivers the ninth and final P0 skill to QIE Forge: **`qie-ecosystem`**, completing the canonical P0 agent skills suite alongside `qie`, `qie-networks`, `qie-smart-contracts`, `qie-frontend`, `qie-wallets`, `qie-transactions`, `qie-deployment`, and `qie-debug`.

The core mission of B08 is answering the developer and agent question:
> **"What should I use, how should I use it on QIE, and how do I know it actually works?"**

Rather than inflating marketing claims or aggregating generic EVM documentation, B08 enriches the canonical knowledge base with primary technical evidence, establishes granular operation-specific compatibility classifications, enforces strict negative-evidence and refusal boundaries, and packages an independently installable, self-contained `qie-ecosystem` skill.

---

## 2. Baseline Reconciliation & Scope Compliance

### Baseline Reconciled from B07
- Prior released skills: 8 independently installable skills.
- Prior canonical sources: 6 source records (S00, S01, S03, S04, S08, S09).
- Prior capabilities: 8 records, all `UNKNOWN`.
- Prior addresses: 0 records (`knowledge/addresses.yaml: []`).
- Prior test suite: 208/208 tests passing; 18 Skills CLI installation fixtures passing.

### B08 Delivered Scope
- **Published Skills**: Expanded from 8 to **9 P0 skills** (addition of `qie-ecosystem`).
- **Knowledge Domains**: Mapped domains D05 (Tokens and assets), D08 (Ecosystem products), and D09 (DeFi and liquidity) to `entry_skill: qie-ecosystem`, `planned_skill: qie-ecosystem`, and `coverage_level: LOCAL_REFERENCE`.
- **Primary Technical Sources**: Expanded from 6 to **18 primary sources** (S00–S21, including the dedicated Remix deployment guide S21).
- **Capability Catalogue**: Expanded from 8 to **25 granular capability records**, each carrying an explicit canonical `category` association and classified using the exact canonical vocabulary. Counts below are computed from `knowledge/capabilities.yaml`, not copied prose:

  | Status | Count |
  |---|---:|
  | VERIFIED | 0 |
  | DOCUMENTED | 9 |
  | CLAIMED | 2 |
  | UNKNOWN | 9 |
  | CONFLICTED | 1 |
  | STALE | 0 |
  | UNSUPPORTED | 2 |
  | DEPRECATED | 2 |

- **Zero Verified Capabilities**: Zero capabilities are marked `VERIFIED`, as no live on-chain execution tests have been executed in this milestone.
- **Identity Blocker Upheld**: `knowledge/addresses.yaml` remains strictly empty (`[]`). Refusal rules for unverified contract addresses and DEX routers are enforced, and the generated catalogue publishes no contract address literal.
- **Test Suite**: Skills CLI installation fixtures cover 20 fixtures (all passing). Test counts and coverage are recorded in [b08-remediation-results.md](b08-remediation-results.md) from executed runs.

---

## 3. Official Source Acquisition & Grounded Provenance

All ecosystem facts were acquired from primary technical sources. The latest source review in this release is `2026-10-19T21:37:00Z` (source `S21`); every source review precedes the release build timestamp `2026-10-19T22:35:15Z`, and the release-cut chronology gate enforces that ordering against the real clock. Source IDs below are the canonical identities in `knowledge/sources.yaml`:

1. **Official QIE Developer Documentation** (`docs.qie.digital`):
   - Injected provider integration guide (`S10`): Explains `window.qie`, EIP-6963 RDNS `me.qiewallet`, `window.ethereum` (`isMetaMask: true`), absence of `disconnect` event, error `4902` on switching to testnet without manual extension toggle, and non-EVM account isolation.
   - Hardhat smart contract deployment guide (`S11`): Documents `solidity: "0.8.20"` with the mainnet RPC URL `https://rpc1mainnet.qie.digital/`. The guide states no chain ID and no EVM compiler target.
   - Remix IDE deployment guide (`S21`): Documents deployment through the `Injected Web3` environment with MetaMask on the QIE network; no compiler version or EVM target is stated.
   - Native delegation (`S13`): Documents Cosmos SDK CLI `qied tx staking delegate <valoper> <amount>aqie --chain-id <native-chain-id>`.
   - Governance proposals (`S14`): Documents `qied tx gov submit-proposal` with 10,000 QIE minimum deposit.
   - Oracle contract tables (`S12`): Documents L1 mapping tables for BTC, ETH, XRP, SOL, QIE, XAUt, BNB.
2. **Official GitHub Repositories** (`github.com/qieadmin`):
   - `chain-registry/qie/assetlist.json` (`S16`): Documents Cosmos denom `aqie` ($10^{18}\text{ aqie} = 1\text{ QIE}$) and a source-claimed conversion precompile address that is **not** published or recommended here (no identity observation exists; the canonical address inventory stays empty).
   - `chains/_data/chains/eip155-1990.json` (`S20`): Documents official EIP-155 chain definition for QIE Mainnet EVM.
3. **Wallet Web Store Listing** (`chromewebstore.google.com`):
   - QIE Wallet extension listing (`S19`, full store URL with extension identifier `oljchdcgmibnjbbopolafbjncfhdacjb`): Publishes extension listing metadata attributed to VortX Capital.
4. **Negative Evidence & Grounded Realities**:
   - **Unpublished npm packages**: GitHub repositories `qie-lend-sdk` and `qusdc-sdk` exist under `qieadmin`, but neither is published on npm. Coding agents are instructed not to advise `npm install`.
   - **Indexer coverage unsubstantiated, not disproven**: No QIE indexer deployment was located in the sources reviewed for this release, so `indexer-query` is `UNKNOWN`. `UNKNOWN` is an evidence state, not proof of absence. Direct JSON-RPC `eth_getLogs` remains the fallback, and **no provider-specific block-range limit has been measured** for QIE endpoints; guides must say so rather than publish a fixed bound.
   - **Contract Address Identity Blocker**: Contract addresses in S12 and S16 have not undergone on-chain identity observation runs. The canonical address collection remains empty, and the generated catalogue publishes no address literal.
   - **Legacy Chain ID Conflicts**: Pre-V3 chain IDs 5656 and 9731 are documented as deprecated. Outdated aggregators showing 5656 represent a conflict resolved authoritatively in favor of canonical V3 Mainnet (1990).

---

## 4. Canonical Data Model & Schema Evolution

The schema evolution adheres strictly to the controlled evolution principles in PRD v2.1:
1. **`knowledge/schema/skill.schema.json`**: Added `"ecosystem"` to `generated_references.items.enum`.
2. **`knowledge/schema/manifest.schema.json`**: Added `"data/ecosystem-catalogue.json"` to `snapshot_path.enum`.
3. **`knowledge/schema/common.schema.json`**: Added the canonical `category` enum (the explicit product-to-category vocabulary).
4. **`knowledge/schema/capability.schema.json`**: Requires a `category` association on every capability record — category membership is canonical data, never substring matching.
5. **`knowledge/schema/policy.schema.json`** and **`knowledge/policy.yaml`**: Versioned to schema version `1.4.0` (B08 audit remediation).
6. **`release-context.json`**: Versioned to `0.5.1-ecosystem.1` with `schema_version: "1.4.0"` and `built_at: "2026-10-19T22:35:15Z"`.
7. **`package.json`**: Versioned to `0.5.1-ecosystem.1`.

No competing schemas, secondary databases, or parallel metadata registries were introduced.

---

## 5. Granular Compatibility Classification

All 25 capabilities evaluate compatibility at the strict granularity of **Tool + Version + Operation + Network + Evidence**, and every capability carries an explicit canonical `category`. The list below mirrors `knowledge/capabilities.yaml` verbatim:

- **Wallets & Injected Providers** (`wallets`):
  - `qiewallet-eip1193-connect` (`qie-wallet` 4.2.2, `connect_eip1193`, Mainnet/Testnet): `DOCUMENTED`
  - `qiewallet-switch-chain` (`qie-wallet` 4.2.2, `switch_chain`, Mainnet/Testnet): `DOCUMENTED` (prerequisite: Testnet toggle in extension settings)
  - `qiewallet-disconnect-event` (`qie-wallet` 4.2.2, `listen_disconnect_event`, Mainnet/Testnet): `UNSUPPORTED` (must use `accountsChanged: []`)
  - `qiewallet-non-evm-eip1193` (`qie-wallet` 4.2.2, `access_non_evm_via_eip1193`, Mainnet/Testnet): `UNSUPPORTED`
  - `wallet-connect` (`external-evm-wallet`, `connect_external_wallet`, Mainnet/Testnet): `UNKNOWN`
  - `viem-custom-chain` (`viem`, `define_chain`, Mainnet): `DOCUMENTED`
  - `wagmi-injected` (`wagmi`, `injected_connector`, Mainnet): `DOCUMENTED`
- **Smart Contract Development & Deployment** (`frameworks`):
  - `contract-deploy` (`foundry`, `deploy_contract`, Mainnet/Testnet): `UNKNOWN` (local replay evidence is LOCAL_REPLAY, not QIE support; live deployment untested)
  - `hardhat-deploy` (`hardhat`, `deploy_contract`, Mainnet): `DOCUMENTED` (official guide pins Solidity 0.8.20)
  - `remix-deploy` (`remix`, `deploy_via_injected_provider`, Mainnet): `DOCUMENTED` (S21; injected Web3 environment)
- **Identity & Authentication** (`identity`):
  - `identity-auth` (`qie-pass`, `authenticate`, Mainnet/Testnet): `UNKNOWN`
- **Explorers & Contract Verification** (`explorers`):
  - `explorer-verification-api` (`qie-explorer`, `verify_contract_api`, Mainnet/Testnet): `UNKNOWN` (no programmatic verification API is documented or confirmed)
- **Decentralized Finance & Swaps** (`defi`):
  - `dex-swap` (`qiedex`, `swap`, Mainnet/Testnet): `UNKNOWN`
  - `qiedex-web-swap` (`qiedex`, `swap_web`, Mainnet): `CLAIMED`
- **Cross-Chain Bridges & Conversion** (`bridges`):
  - `bridge-transfer` (`unidentified-bridge`, `bridge_assets`, unscoped): `UNKNOWN`
  - `qie-bridge-web` (`qie-bridge`, `bridge_assets_web`, Mainnet): `CLAIMED`
- **Oracles & Asset Feeds** (`oracles`):
  - `qie-oracle-price-feed` (`qie-oracle`, `read_price_feed`, Mainnet): `DOCUMENTED`
- **Indexing & Historical Data** (`indexing`):
  - `indexer-query` (`unidentified-indexer`, `query_events`, unscoped): `UNKNOWN`
- **Native Cosmos & Validator Operations** (`native-cosmos`):
  - `native-delegate` (`qie-native`, `delegate_native`, unscoped): `UNKNOWN`
  - `qied-staking-delegate` (`qied`, `delegate_native`, Mainnet native layer): `DOCUMENTED`
  - `qied-gov-submit` (`qied`, `submit_governance_proposal`, Mainnet native layer): `DOCUMENTED`
- **Networks & Chain Identity** (`networks`):
  - `rpc-identity` (`qie-rpc`, `read_chain_identity`, Mainnet/Testnet): `UNKNOWN`
  - `legacy-chain-5656` (`qie-legacy`, `evm_connect_chain_5656`, Mainnet): `DEPRECATED`
  - `legacy-chain-9731` (`qie-legacy`, `evm_connect_chain_9731`, Mainnet): `DEPRECATED`
  - `chain-id-5656-conflict` (`qie-legacy`, `resolve_mainnet_chain_id`, Mainnet): `CONFLICTED`

---

## 6. The `qie-ecosystem` Skill Bundle

The `qie-ecosystem` skill is packaged with complete offline closure:

```
skills/qie-ecosystem/
├── SKILL.md                          # 7-step decision procedure, navigation, safety invariants
├── MANIFEST.json                     # Cryptographically sealed release manifest with SHA-256 hashes
├── data/
│   └── ecosystem-catalogue.json      # Immutable snapshot of claims, capabilities, domains, sources
├── references/
│   ├── catalogue.md                  # Generated catalogue breakdown by product category
│   ├── compatibility.md              # Generated complete compatibility matrix
│   ├── decision-guide.md             # Grounded decision trees covering Cases A through H
│   └── release-info.md               # Build and review timestamps, schema metadata
└── scripts/
    └── lib/
        └── effective-status.mjs      # Bundled pure status evaluator for runtime freshness checks
```

### 7-Step Decision Procedure
1. Classify task & product category.
2. Identify specific tool & version.
3. Identify specific atomic operation.
4. Identify target network (Mainnet vs Testnet vs Cosmos native).
5. Check canonical compatibility status in bundled catalogue and matrix.
6. Evaluate limitations, risks, and refusal rules in the decision guide.
7. Provide safe recommendation or hand off to dedicated topical skill.

### Decision Guide Cases A through H
- **Case A**: Wallet selection, EIP-6963 RDNS `me.qiewallet`, `window.qie`, handling disconnect via `accountsChanged: []`, error 4902 testnet switch toggle requirement, non-EVM account isolation.
- **Case B**: DEX routing, web swap UI status, strict refusal rule against hallucinating router addresses or ABIs, the full address-identity gate (issuer provenance, ABI provenance, scoped identity observation, human review, conflict checks), and the rule that an explorer page or nonempty bytecode never establishes product identity.
- **Case C**: Foundry local replay labelled LOCAL_REPLAY (not QIE support), Hardhat and Remix official guides with correct source IDs (S11, S21), Solidity 0.8.20 as documented, and `shanghai` qualified as local-replay-derived guidance.
- **Case D**: Indexer coverage uncertainty (UNKNOWN is not proof of absence), safe fallback to direct `eth_getLogs` with probe-then-bound ranges — no provider block-range limit is claimed, because none has been measured.
- **Case E**: Clarification rule between native Cosmos validator delegation (`qied tx staking delegate`) and EVM smart contract staking; no fixed native transaction fee is published.
- **Case F**: Network substitution refusal between Mainnet (1990) and Testnet (1983), resolution of deprecated chain IDs 5656 and 9731, and canonical RPC/explorer hostnames taken from the network claims.
- **Case G**: Differentiating repository discovery leads (`qie-lend-sdk`, `qusdc-sdk`) from published executable packages.
- **Case H**: Evidence freshness evaluation, TTL expiration, and handling of UNKNOWN, STALE, or CONFLICTED statuses.

---

## 7. Verification & Engineering Evidence

### 1. Test Suite Execution
- **Command**: `npm test`
- **Result**: `pass: 270`, `fail: 0`, `cancelled: 0` (full log: `docs/evidence/b08/tests.txt`)
- **Coverage**: 100% of test assertions passing across all 20 test modules (11 pre-existing modules preserved; `consistency.test.mjs` for cross-artifact and adversarial regression checks, plus `chronology.test.mjs`, `canonical-facts.test.mjs`, `authored-facts-guard.test.mjs` and `status-projection.test.mjs` for the final-audit remediation).

### 2. Skills CLI Integration Testing
- **Command**: `npm run test:install`
- **Result**: 20/20 installation fixtures passing:
  - Full suite (`*`) installs all 9 skills in both symlink and copy modes.
  - Individual installs for each of the 9 skills (`qie`, `qie-debug`, `qie-deployment`, `qie-ecosystem`, `qie-frontend`, `qie-networks`, `qie-smart-contracts`, `qie-transactions`, `qie-wallets`) verified in clean temporary consumers.
  - Verification of self-contained operation, manifest integrity, and deny-network guard isolation.

### 3. Build & Drift Check
- **Command**: `npm run build:check`
- **Result**: `Reproduced qie, qie-networks, qie-smart-contracts, qie-frontend, qie-wallets, qie-transactions, qie-deployment, qie-debug, qie-ecosystem; no live network checks performed.`
- `skills/` and `dist/skills/` are 100% byte-identical (`diff -qr` clean).
- **Command**: `npm run docs:check` — the B08 evidence catalogue matches canonical knowledge records.

### 4. Code Coverage
- **Command**: `npm run test:coverage`
- **Results** (executed run, logs in `docs/evidence/b08/coverage.txt`):
  - `bundle.mjs`: 93.18% lines, 82.61% branches
  - `canonical-facts.mjs`: 98.92% lines, 92.05% branches
  - `chronology.mjs`: 98.63% lines, 90.00% branches
  - `effective-status.mjs`: 100% lines, 100% branches
  - `evidence-doc.mjs`: 100% lines, 95.00% branches
  - `knowledge.mjs`: 97.12% lines, 80.49% branches
  - `placeholders.mjs`: 100% lines, 100% branches
  - `release.mjs`: 98.77% lines, 86.74% branches
  - `transaction-diagnostic.mjs`: 96.90% lines, 92.25% branches
  - **Overall**: **97.72% lines**, **88.37% branches**, **98.92% functions**.

### 5. Preserved Invariants
- `qie` router does not contain chain IDs `1990` or `1983` in its text, preserving the architectural invariant that the router never carries chain facts of its own.
- Read-only diagnostics expose zero signing, broadcasting, or private key handling.
- Manifest hashes strictly match all contained file contents.

---

## 8. Milestone B08 Deliverables Summary

| Artifact | Path | Purpose |
|---|---|---|
| Authoring Entry | `authoring/qie-ecosystem/SKILL.md.in` | Human-authored skill definition and 7-step procedure |
| Decision Guide | `authoring/qie-ecosystem/references/decision-guide.md` | Authoring guide for Cases A through H |
| Published Skill | `skills/qie-ecosystem/` | Generated self-contained release skill bundle |
| Staged Skill | `dist/skills/qie-ecosystem/` | Staging tree identical to published bundle |
| Ecosystem Tests | `tests/ecosystem.test.mjs` | B08 test suite covering catalogue, cases, and offline install |
| Evidence Ledger | `docs/evidence/b08/source-ledger.md` | Primary source acquisition and provenance records (reconciled to canonical source identities) |
| Capability Matrix | `docs/evidence/b08/capability-catalogue.md` | Generated capability breakdown and limitation audit (`npm run docs:generate`) |
| Evidence Generator | `scripts/lib/evidence-doc.mjs`, `scripts/generate-evidence-doc.mjs` | Canonical-derived rendering of the B08 capability evidence catalogue |
| Consistency Tests | `tests/consistency.test.mjs` | Cross-artifact reconciliation and adversarial mutation regressions |
| Test Logs | `docs/evidence/b08/tests.txt` | Complete test runner execution output |
| Install Logs | `docs/evidence/b08/installation.txt` | Skills CLI fixture execution output |
| Coverage Logs | `docs/evidence/b08/coverage.txt` | V8 experimental test coverage breakdown |
| Decisions Log | `docs/decisions.md` | Architectural decisions recorded for B08 and the B08 remediation |
| Results Report | `docs/b08-results.md` | This formal milestone completion report |
| Remediation Report | `docs/b08-remediation-results.md` | Finding-by-finding audit resolution record |

Milestone B08 is fully implemented and verified post-remediation. B09 may proceed only against this reconciled release (`0.5.1-ecosystem.1`); the earlier `0.5.0-ecosystem.1` evidence is superseded.
