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
4. Added `knowledge/conflicts.yaml` for QUSDC terminology, QUSDC candidate role, RPC list and Oracle identity conflicts.
5. Extended `skills.yaml` with `integration_ids`; validation now checks integration/interface/operation references and rejects unverified execution permissions.
6. Retained address candidates in `knowledge/addresses.yaml` with CLAIMED/CONFLICTED statuses. They are discovery-only, not trusted addresses.

## Generated release changes

- Ecosystem snapshots now include integrations, conflicts and candidate addresses.
- `qie-ecosystem` generates `references/address-candidates.md` and detailed integration sections.
- Selected topical bundles receive only their transitive integration records; address literals are kept out of non-ecosystem bundles.
- New recipes cover ERC-20 assets, QUSDC escrow, Lending read adapters, identity gates, ecosystem selection, Oracle collateral, read-only transactions and bounded RPC capability probes.
- All nine existing skills received proportionate routing or topical guidance; no new installable skill was added.

## Safety design

- `execution_allowed` is false for every new integration, interface and operation.
- No live RPC, signer, wallet, bridge, oracle, DEX or contract write is executed.
- The shared identity gate remains the only path to address-bound write eligibility.
- Candidate addresses are shown in a separate discovery table and never in the generated catalogue's executable guidance.
- Historical B08/B09 evidence remains historical; active source review is recorded in the new inventory.

## Known implementation trade-offs

- Integration records are intentionally additive rather than a full entity graph rewrite.
- The existing capability model remains unchanged; protocol operations use the new integration model to avoid pretending that a product-wide capability status is precise enough.
- The RPC probe is a contributor/installed-helper tool and never promotes evidence automatically.
- Real coding-agent host/model execution was not available in this workspace; golden-task execution is therefore NOT_RUN.
