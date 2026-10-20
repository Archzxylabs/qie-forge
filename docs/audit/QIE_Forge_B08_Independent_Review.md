# QIE Forge B08 Independent Review

Review date: 2026-10-20 (Asia/Jakarta). Reviewed release: `0.5.0-ecosystem.1`.

**Verdict: changes required before accepting B08 as complete and verified.** The current release reproduces and passes its existing tests, but published guidance contradicts canonical network knowledge, bypasses canonical status selection, and weakens the recorded address-identity gate.

This review covers the current workspace against PRD v2.1 FR-004, Architecture Study B08, and the recorded project decisions. Git history is unavailable in this workspace, so findings identify current-file locations rather than commit-relative changes. No implementation files were changed during review.

## Findings

### B08-R01 — P1: Published network instructions disagree with the bundled canonical claims

Locations: `scripts/lib/release.mjs:230`, `authoring/qie-ecosystem/references/decision-guide.md:89`, and `authoring/qie-ecosystem/references/decision-guide.md:155`.

The new catalogue and guide tell consumers to configure `rpc-main1.qie.digital`, `rpc-testnet.qie.digital`, and `mainnet.qiescan.org` / `testnet.qiescan.org`. The canonical records in `knowledge/claims.yaml:19`, `:34`, `:94`, and `:109` instead publish:

| Setting | Canonical value |
|---|---|
| Mainnet RPC | `https://rpc1mainnet.qie.digital/` |
| Testnet RPC | `https://rpc1testnet.qie.digital/` |
| Mainnet explorer | `https://mainnet.qie.digital/` |
| Testnet explorer | `https://testnet.qie.digital/` |

The bundled JSON retains those canonical values, so a standalone installation already contains contradictory instructions. The [official network documentation](https://docs.qie.digital/getting-started-with-qie-blockchain/4.-access-mainnet-or-testnet) and [wallet integration guide](https://docs.qie.digital/qie-wallet-integration-guide-for-websites) also support the canonical hostnames. This review does not establish whether the alternate hosts are operational; they are not the selected canonical configuration.

**Required change:** derive generated network facts from selected claims and reconcile the authored examples with that same selection. Add an assertion comparing the network values shown to users with the bundled claims.

### B08-R02 — P1: Product summaries bypass canonical compatibility status and scope

Location: `scripts/lib/release.mjs:186`.

`catalogueReference()` defines a separate hard-coded `toolsSummary` containing product-wide statuses and operational claims. It does not obtain those values from `snapshot.capabilities`. This contradicts both the canonical-source architecture and the requirement to assess a concrete operation, version, and network. Examples include a `DOCUMENTED` generic-wallet summary while `wallet-connect` remains `UNKNOWN`, and a documented conversion-precompile product without a corresponding capability record.

**Reproduced:** in a temporary copy, all four `qiewallet-*` capabilities were changed to `CONFLICTED`. `buildRelease()` succeeded, the JSON and detailed matrix correctly contained the conflicts, but the QIE Wallet overview still rendered `DOCUMENTED`. Changing the canonical mainnet RPC similarly changed the JSON while leaving the rendered profile unchanged. The source checkout was not modified by this experiment.

**Required change:** remove the independent status registry from the renderer. Generate operation-scoped entries from canonical records, retaining their network, version, evidence, and limitations. Any product metadata needed for presentation must have an explicit canonical representation rather than independently asserted support statuses. Add mutation-based projection checks.

### B08-R03 — P1: Address guidance does not preserve the recorded identity release blocker

Locations: `authoring/qie-ecosystem/references/decision-guide.md:61` and `scripts/lib/release.mjs:198`.

Case B's safe-guidance steps end with a developer-supplied purportedly verified address and `eth_getCode` before sending transactions. They do not carry forward the required issuer and ABI provenance, scoped identity observation, human review, and conflict checks. Source verification on an explorer or code presence alone does not establish that a contract is the official router for the named product.

Separately, the renderer publishes a literal address as a `DOCUMENTED` conversion precompile even though the canonical address inventory and observation-run inventory are empty, and there is no corresponding capability. The existing test explicitly requires this literal in the generated catalogue (`tests/ecosystem.test.mjs:109`). Keeping `addresses.yaml` empty therefore does not enforce the publication gate.

The existing decision in `docs/decisions.md:94` explicitly requires identity review before publishing an ecosystem contract address and says bytecode does not prove issuer identity or ABI correspondence. B08's unconditional-blocker claim is inconsistent with these instructions.

**Required change:** keep programmatic address recommendations blocked until the full identity requirements are satisfied. Remove the uncatalogued operational precompile recommendation, or explicitly resolve the publication policy and represent any permitted discovery-only address with its unverified identity and source scope. Do not treat a user assertion plus code presence as authorization to proceed with a product-specific transaction.

### B08-R04 — P2: Provenance documents assign different resources to the same source IDs

Locations: `docs/evidence/b08/source-ledger.md:19`, `docs/evidence/b08/source-ledger.md:23`, and `authoring/qie-ecosystem/references/decision-guide.md:74`.

The ledger swaps S08 and S09 relative to `sources.yaml`. It labels S12 as Remix and S15 as oracle documentation, whereas canonical S12 is the oracle table and S15 is Cosmos `chain.json`. S13, S14, and S18 also have different canonical URLs in the ledger. The guide cites S10 (wallet integration) for Hardhat and S11 (Hardhat) for Remix. The canonical Remix capability cites only the documentation root, not a selected Remix deployment guide.

Consequently, these artifacts do not provide a consistent audit trail for their technical claims, despite valid foreign-key references in the schemas. The S19 URL also lacks the extension identifier present in the [discoverable Chrome Web Store listing](https://chromewebstore.google.com/detail/qie-wallet-%E2%80%93-non-custodia/oljchdcgmibnjbbopolafbjncfhdacjb).

**Required change:** reconcile source identities and per-claim citations across canonical data, the ledger, the guide, and the results report. Record a complete store URL. Use specific reviewed evidence for Remix rather than assigning an unrelated source ID or the documentation root.

### B08-R05 — P2: Substring matching places DEX operations under native Cosmos and hides the indexer entry

Location: `scripts/lib/release.mjs:207`.

Category membership uses `includes()` on tool and capability identifiers. The native category contains `qied`, which also matches `qiedex`. The actual published catalogue therefore lists `dex-swap` and `qiedex-web-swap` under Native Cosmos & Validator Operations. Conversely, `indexer-query` / `unidentified-indexer` matches none of the indexing identifiers, and that section says no entries exist despite the capability being in the snapshot.

This misroutes the ecosystem directory at exactly the EVM/native boundary the skill is intended to clarify.

**Required change:** use explicit category membership or exact canonical identifier mappings. Check that native operations exclude DEX capabilities and that the indexing section includes `indexer-query`.

### B08-R06 — P2: The completion report and capability evidence describe different data from the shipped release

Locations: `docs/b08-results.md:39` and `docs/evidence/b08/capability-catalogue.md:27`.

The current 25 canonical capabilities have this distribution:

| Status | Actual count |
|---|---:|
| VERIFIED | 0 |
| DOCUMENTED | 9 |
| CLAIMED | 2 |
| UNKNOWN | 9 |
| UNSUPPORTED | 2 |
| DEPRECATED | 2 |
| CONFLICTED | 1 |

The results report instead claims 11 documented and 8 unknown; its listed counts sum to 26. The evidence catalogue calls `explorer-verification-api` `DOCUMENTED`, while both canonical YAML and the installed matrix correctly mark it `UNKNOWN`. It also supplies Hardhat `^2.22.0`, Viem `^2.0.0`, and testnet deployment scopes absent from their canonical records, and changes several tool/operation identifiers. These are material differences in compatibility claims, not formatting differences.

**Required change:** regenerate the capability evidence and reported totals from the actual release data. Preserve the narrower canonical statuses and scopes unless new supporting evidence is explicitly reviewed and selected.

## Independently repeated verification

| Check | Result |
|---|---|
| `npm test` | 216 passed, 0 failed |
| Installation cases within `npm test` | All 20 passed; full suite and each of nine skills in both modes |
| `npm run validate` | 15 domains, 17 sources, 11 claims, 25 capabilities; nine valid bundles |
| `npm run lint` | JavaScript syntax passed; command explicitly reports no TypeScript compiler or style linter |
| `npm run build:check` | Published release reproduced |
| `diff -qr dist/skills skills` | No differences |
| `npm run test:coverage` | 216 passed; 96.99% lines, 87.80% branches, 96.75% functions |
| Canonical address / validation-run inventories | Both empty |
| Temporary canonical-change experiment | Confirmed renderer status and network drift described in B08-R02 |

These checks reproduce the engineering metrics in the completion report. They do not establish semantic agreement between all generated prose and canonical data. The B08 tests primarily check required strings, a few stored statuses, closure, hashes, and a synthetic expiry example; they do not exercise canonical-change propagation, category correctness, source-ID agreement, or the complete address refusal procedure.

## Verification limits and acceptance

No live QIE execution, signing, or broadcast was performed. Several external source URLs were unavailable through the browsing tool, and shell network access could not resolve the documentation host. This review does not independently confirm package-registry absence, the absence of every indexing deployment, or the conversion-precompile semantics. Those claims need retrievable, scoped acquisition evidence; inability to confirm them is not proof they are false. The wallet guide supports the documented provider nuances, but it does not replace an executed browser-compatibility test.

Accept the passing build, package installation, and coverage results as reproduced. Keep B08 acceptance open until the three P1 findings and the provenance/report discrepancies are corrected and semantic regression checks pass. No implementation fixes are included in this review.
