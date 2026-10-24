<!-- GENERATED — DO NOT EDIT. Change canonical authoring or knowledge. -->

# Integrate a QIE ERC-20 asset safely

**Scope:** read-only token integration and local accounting preparation. This recipe does not select or authorize a production address, approve a spender, or broadcast a transaction.

## Inputs

- Explicit QIE Mainnet or QIE Testnet target.
- Token identity and claimed role, kept separate from its address candidate.
- Application operation: read, transfer, deposit, escrow, lending or redemption.
- Decimals obtained from the selected contract or a source-grounded published claim.
- Required permissions: balance read, allowance, approval, transfer or `transferFrom`.

## Procedure

1. Run the selected-network read-only preflight. Never substitute Mainnet and Testnet when an endpoint fails.
2. Treat a published address as a candidate until it passes the shared address identity gate. An explorer page, SDK config entry or nonempty `eth_getCode` result is not issuer proof.
3. Read `decimals()`, `symbol()`, `name()`, `totalSupply()` and `balanceOf()` separately. Record the block and endpoint for every observation.
4. Keep accounting in integer raw units. Parse human-readable values with the observed token decimals; do not use JavaScript floating point for balances or rewards. Store the accounting denomination explicitly.
5. Before a write, show the user the selected network, token role, spender, raw amount, human amount, allowance change, gas/fee estimate and maximum spend. Stop when identity or capability evidence is UNKNOWN, STALE or CONFLICTED.
6. For deposits, prefer actual balance-delta accounting when token behavior is not independently verified. A transfer return value alone does not prove the recipient received the requested amount.

## Defensive boundaries

- Do not infer Permit or Permit2 support from ERC-20 methods; verify the exact interface first.
- Treat fee-on-transfer, rebasing, pausable and transfer-restricted tokens as separate compatibility questions.
- Prefer exact approvals for a narrowly scoped action. An unlimited allowance requires a separate explicit review.
- `decimals()` is contract metadata at an observed block, not a statement of USD value or issuer authenticity.
- A local mock token is a test fixture, never deployed QIE asset evidence.

## Safe outputs

Return a table with: selected network, candidate address, identity status, observed metadata, raw amount, human amount, accounting denomination, required approval, and unresolved checks. If the target is unverified, provide the local adapter and mock tests while blocking live writes.
