# QIE knowledge expansion implementation notes

## Baseline and branch

- Base lineage: current `feat/qie-ecosystem-intelligence`, already containing B09 private-distribution work.
- B09 status: PR #1 remains open; no merge or public publication was performed.
- New branch intent: continue on `feat/qie-ecosystem-intelligence` without rewriting historical B08/B09 evidence.
- New release candidate: `0.6.0-ecosystem.1`.

## Canonical model changes

1. Added optional source provenance fields: revision, technical paths, claim scopes and research outcome.
2. Added strict `integration.schema.json` and `conflict.schema.json`.
3. Added `knowledge/integrations.yaml` for product, protocol, SDK, network-layer and service records.
4. Added `knowledge/conflicts.yaml` for the one genuine same-scope RPC documentation contradiction; QUSDC terminology and candidate-role uncertainty remain documented limitations instead of conflicts.
5. Extended `skills.yaml` with `integration_ids`; schema and runtime validation now reject every `execution_allowed: true` value until a tested promotion mechanism exists.
6. Retained address candidates in `knowledge/addresses.yaml` as CLAIMED discovery records unless technical sources genuinely disagree. They are never trusted addresses.

## Generated release changes

- Ecosystem snapshots now include integrations, conflicts and candidate addresses.
- `qie-ecosystem` generates `references/address-candidates.md` and detailed integration sections.
- Selected topical bundles receive only their transitive integration records; address literals are kept out of non-ecosystem bundles.
- New recipes cover ERC-20 assets, QUSDC escrow, Lending read adapters, identity gates, ecosystem selection, Oracle collateral, read-only transactions and bounded RPC capability probes.
- All nine existing skills received proportionate routing or topical guidance; no new installable skill was added.

## Safety design

- `execution_allowed` is false for every new integration, interface and operation.
- No live RPC, signer, wallet, bridge, oracle, DEX or contract write is executed.
- No address-bound write eligibility path exists in this release; the shared identity gate is a prerequisite for any future promotion mechanism.
- Candidate addresses are shown in a separate discovery table and never in the generated catalogue's executable guidance.
- Historical B08/B09 evidence remains historical; active source review is recorded in the new inventory.

## Known implementation trade-offs

- Integration records are intentionally additive rather than a full entity graph rewrite.
- The existing capability model remains unchanged; protocol operations use the new integration model to avoid pretending that a product-wide capability status is precise enough.
- The RPC probe is a contributor/installed-helper tool and never promotes evidence automatically.
- Real coding-agent host/model execution status is recorded in `docs/evidence/qie-knowledge-golden-tasks.md` and is never inferred from deterministic fixtures.

## Pull-request integration order

1. Approve and merge PR #1 (`feat/b09-distribution`) into `main` first, after owner review. It carries the B09 release/distribution hardening and commit `40ab7a7`, including the original engineering-gates workflow.
2. Rebase PR #2 (`feat/qie-ecosystem-intelligence`) onto the resulting `main`, preserving `4b10710`, the knowledge expansion, and this branch's unified CI workflow.
3. Resolve `.github/workflows/ci.yml` explicitly in favor of one workflow that retains B09's native-toolchain, coverage and installation gates plus the knowledge branch's browser/example checks. Do not let either branch silently replace the other's checks.
4. Re-run the full gates on the rebased PR #2 and keep both PRs unmerged until the owner approves the integration order.
