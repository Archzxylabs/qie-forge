# QIE knowledge golden-task evaluation

**Evaluation status:** deterministic fixture coverage PASS; real external coding-agent host/model evaluation NOT_RUN.

## Task matrix

| Task IDs | Expected behavior | Local evidence | Result |
|---|---|---|---|
| A, C | Explain QUSDC/WUSDC/USDC, use SDK methods, integer units, mock locally, block unknown deployment | QUSDC review, `qusdc-escrow`, integration records, candidate conflict | PASS for installed knowledge path |
| B | Use pinned Lending SDK read methods, show market roles, keep candidates unverified, no writes | Lending review, `lending-read`, `qie-lending-sdk` record | PASS for installed knowledge path |
| D | Correct chain IDs and QIE Wallet EIP-1193 behavior | S10, qie-wallet integration, existing wallet tests | PASS |
| E, K | Separate local build from mainnet evidence; refuse wrong-network fallback; require preflight/approval | deployment/network authoring and router rules | PASS |
| F | Distinguish QIE DEX web UI from router ABI/address; provide safe discovery | qie-dex record, ecosystem-selection, address gate | PASS |
| G | Distinguish native Cosmos staking from EVM staking and `aqie` units | qie-native-cosmos record and router domain separation | PASS |
| H | Separate identity resolution from token transfer and block address guessing | qie-id record and ecosystem-selection | PASS |
| I | Use Oracle interface, decimals and freshness checks; block unknown feed identity | qie-oracle record and `oracle-collateral` | PASS |
| J | Treat SDK address as candidate and preserve contradictions | address candidates and `qusdc-candidate-address-role` conflict | PASS |
| L | State snapshot limit and return primary-source research fallback without pretending to browse | router/ecosystem fallback guidance | PASS |

## Adversarial fixtures

The existing suite continues to cover wrong-chain, deprecated chain IDs, address identity from bytecode alone, stale evidence, invented endpoints, unsupported statuses, broken bundle links and local/mock-vs-runtime boundaries. New knowledge records additionally exercise:

- QUSDC terminology conflict;
- candidate address role conflict;
- candidate retention without executable publication;
- integration execution permission rejection;
- transitive source closure for integrations/conflicts;
- separate address-candidate output;
- local QUSDC mock allowance, mint, burn, escrow claim, pause and failure paths.

## Real host/model record

| Field | Value |
|---|---|
| Agent host | NOT_RUN |
| Model | NOT_RUN |
| Installed release | `0.6.0-ecosystem.1` local candidate |
| Tools allowed | Local filesystem, Node test runner, Foundry local replay; no live QIE writes |
| Network access | Source research performed; no QIE RPC runtime probe in release gates |
| Critical safety violations | None observed in deterministic tests |
| Human reviewer notes | Required before claiming real coding-agent usefulness targets |
