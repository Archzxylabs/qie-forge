# B06 execution results — shared-status read-only diagnostics

B06 is implemented and executed against PRD v2.1 and the approved architecture study. The shared effective-status evaluator is now exercised by read-only live-check helpers: an RPC transport, a network preflight, a scoped transaction observer, two CLI wrappers and three §14.4/§14.5 schemas. The independent audit findings F-01–F-06 were fixed before this report was written and the fixes are covered by tests. This report records only what was actually run.

**Mock vs live, stated up front.** Every diagnostic test and install fixture uses an **injected mock transport**; no command, test or probe in this report contacted a real QIE endpoint. Network-denied runs use a loading guard that makes `fetch` throw. Live output therefore cannot and does not exist yet; any future live check must be recorded separately with its own environment, endpoint and timestamp. `inspect-network.mjs` remains fully offline (`live_check.outcome: NOT_RUN`).

## Working artifacts

| Component | Executed result |
|---|---|
| RPC transport | `scripts/lib/rpc.mjs` — one request per call on the injected transport; no signing, no retry, no cross-endpoint fallback; bounded streaming read with a hard UTF-8 byte ceiling; response must declare JSON-RPC 2.0, echo the request ID and carry exactly one of `result`/`error`; HTTP 429 → `RPC_RATE_LIMITED`, other non-2xx/transport failures → `RPC_UNAVAILABLE`, `-32601` → `UNSUPPORTED_PROVIDER`, unparsable/oversized/inconsistent payloads → `RPC_MALFORMED` |
| Network preflight | `scripts/lib/network-diagnostic.mjs` — `eth_chainId` + latest-block responsiveness on one explicitly selected network; endpoint default = packaged documented endpoint, `--rpc` override is re-verified against the packaged chain ID; identity mismatch → `FAIL`/`WRONG_CHAIN` after one request, no fallback; malformed quantities/block headers and zero height → explicit `UNKNOWN`; `PASS` carries standing never-promotes and no-freshness warnings; `effective_claims` computed by the shared evaluator on the same clock as `checked_at` |
| Transaction observer | `scripts/lib/transaction-diagnostic.mjs` — §14.4 scoped report; chain binding authoritative from the packaged network profile (no caller-chosen chain ID); receipt must echo the requested hash, carry a 32-byte block hash, a hex quantity block number, exactly one of call-target/created-contract and a canonical status before `inclusion: PASS`; runtime code accepted only as nonempty even-length `0x`-prefixed hex (`0x` → valid empty → `CONTRACT_NO_CODE`/FAIL; malformed → UNKNOWN, never PASS); passing code reads warn that the observation is at the latest block, not the inclusion block; `finality` frozen `UNKNOWN`; `MINT` is a recognized-but-refused kind that makes no network call |
| CLI wrappers | `scripts/verify-network.mjs` (exit 0 PASS / 1 FAIL,UNKNOWN — fail-closed / 2 usage) and `scripts/verify-transaction.mjs` (exit 0 report produced / 2 usage); both read the installed skill's packaged claims by default and accept `--claims <network-claims.json>` for maintainer runs from the checkout |
| Schemas | `knowledge/schema/error-code.schema.json` (fourteen §14.5 classes), `live-check.schema.json` (snake_case channel), `evidence-report.schema.json` (§14.4 camelCase channel) — fifteen schema files total; the evidence schema freezes `finality: UNKNOWN` and makes `APPLICATION_VERIFIED` structurally unreachable |
| Bundle | `qie-networks` now ships `scripts/verify-network.mjs`, `scripts/lib/network-diagnostic.mjs`, `scripts/lib/rpc.mjs` beside the existing offline inspector and evaluator (12 manifest files); manifest and release context at `0.3.0-diagnostics.1` |
| Canonical data | `skills.yaml` helper paths extended; `authoring/qie-networks` preflight prose regenerated into the published `SKILL.md`; no claim, capability or domain status changed |

## Commands actually executed

Environment: Node `v24.20.0`, npm `11.19.0`, Skills CLI `1.7.2` (unchanged).

| Command from project root | Outcome |
|---|---|
| `npm run build` | PASS; `Built qie, qie-networks; no live network checks performed.` |
| `npm run validate` | PASS; `15 domains, 6 sources, 11 claims, 8 capabilities`; `Validated 2 self-contained skill bundle(s)` |
| `npm run build:check` | PASS; `Reproduced qie, qie-networks` — published bundles are byte-equal to a regeneration |
| `npm run lint` | PASS; JavaScript syntax checks only |
| `npm test` | PASS; **164 tests, 164 passed, 0 failed** (B05 reported 107; all pre-existing suites retained, 57 new diagnostics tests added) |
| `npm run test:coverage` | PASS; **96.69% lines, 87.57% branches, 97.12% functions** across all exercised `scripts/` files; diagnostics specifically: `network-diagnostic.mjs` 100% lines, `rpc.mjs` 95.42, `transaction-diagnostic.mjs` 96.90, source CLIs 95.12/93.88 (bundled CLI copies exercised by separate install tests) |
| `npm run test:install` | PASS; **6** actual installer fixtures; single-skill installs validate offline with the new helper sources present, and the bundled preflight CLI fails closed under a network-denied child |
| `node skills/qie-networks/scripts/inspect-network.mjs qie-testnet` | PASS; offline, `live_check.outcome: NOT_RUN`, exit 0 |
| `verify-network` bundled CLI under deny-network guard | PASS; `expected_chain_id` 1983 bound from the packaged profile, `outcome UNKNOWN`, `RPC_UNAVAILABLE`, exit 1 |
| `verify-network` usage probe | exit 2 with usage message |
| `verify-network` source CLI via `--claims` | PASS; `expected_chain_id` 1990 bound from the named snapshot, exit 1 under denied network |
| `verify-transaction` source CLI via `--claims` | PASS; report produced with `expectedChainId` 1983 (canonical, not caller-chosen), `applicationOutcome UNKNOWN`, exit 0 |

Saved actual output: [docs/evidence/b06-checks.txt](evidence/b06-checks.txt).

## Frozen negative fixtures

`tests/transaction-diagnostic.test.mjs` freezes **21 negative fixtures** (the architecture study requires ≥ 12) plus adversarial and structural tests. Each fixture asserts its stable error class, keeps `applicationOutcome` different from `APPLICATION_VERIFIED`, and validates against `evidence-report.schema.json`:

1. wrong chain on a mainnet-labelled task (`WRONG_CHAIN`, exactly one request)
2. receipt lookup unavailable (`RPC_UNAVAILABLE`)
3. receipt lookup rate-limited (`RPC_RATE_LIMITED`)
4. fabricated transaction — absent receipt (`TX_NOT_FOUND`); a fabricated or noncanonical hash never counts as inclusion
5. pending transaction (`TX_PENDING`, `PENDING`, never PASS)
6. reverted creation (`TX_REVERTED` preserved as the first error class; effect FAIL)
7. receipt created a different contract than expected (`ADDRESS_UNVERIFIED`)
8. receipt carries no created-contract address (`ADDRESS_UNVERIFIED`)
9. valid empty code at the expected contract (`CONTRACT_NO_CODE`, `codePresent: false`) — distinguished from malformed
10. `eth_getCode` returned malformed bytecode (`RPC_MALFORMED`, linkage UNKNOWN, no false PASS)
11. `eth_getCode` returned odd-length bytecode (`RPC_MALFORMED`)
12. receipt block hash is not a hash (`RPC_MALFORMED`, `inclusion` stays UNKNOWN, `execution` stays NOT_RUN)
13. receipt block number is not a quantity (`RPC_MALFORMED`)
14. receipt status is not canonical (`RPC_MALFORMED` — no execution finding is awarded on malformed status)
15. receipt does not echo the requested transaction hash (`RPC_MALFORMED`)
16. receipt claims both a call target and a created contract (`RPC_MALFORMED`)
17. receipt target is not the expected target (`ADDRESS_UNVERIFIED`)
18. unbound generic receipt (`identityLinkage`/`applicationEffect` NOT_RUN, generic facts only)
19. unsupported chain snapshot method (`UNSUPPORTED_PROVIDER`)
20. malformed chain quantity (`RPC_MALFORMED`)
21. transport failure instead of chain data (`RPC_UNAVAILABLE`, exactly one request)

Structural and adversarial tests cover: `expectedChainId` rejected when it disagrees with the packaged chain ID (audit F-02); a testnet-labelled task shown a mainnet chain reply stops after one request and never reads mainnet receipts; a fully scoped deployment passes every check yet stays `UNKNOWN` with `limitedObservation: CONFIRMED_AT_BLOCK`; `MINT` refusal with zero network calls; a forged `APPLICATION_VERIFIED` outcome rejected by the schema (finality cannot pass in this schema version); the exact action-kind set; a static scan proving no diagnostic source references any signing, broadcast or secret-handling surface (FR-008); and the transport-level envelope tests (wrong/missing protocol version, wrong response ID, result+error and neither, invalid JSON, oversized streamed and plain-text responses, HTTP/JSON-RPC error mapping, request-ID echo, no-retry).

## Audit findings resolution

| Finding | Resolution and evidence |
|---|---|
| F-01 authored vs published drift | Rebuilt: bundle manifest at `0.3.0-diagnostics.1` with 12 files including the new helpers; `build:check` byte parity PASS; package manifests match the release context; preflight prose regenerated; source CLIs are bundle-only by default and accept `--claims` (verified by the source-CLI probes above) |
| F-02 arbitrary chain ID | Binding now comes from the packaged network profile; mismatching `expectedChainId` is a usage error; the CLI takes no chain argument; testnet↔mainnet substitution tests assert one-request stop (`tests/transaction-diagnostic.test.mjs`) |
| F-03 unchecked `eth_getCode` | Strict runtime-code format enforced; valid empty vs malformed distinguished; malformed output → UNKNOWN/`RPC_MALFORMED`; passing reads warn about latest-block semantics (fixtures 9–11) |
| F-04 unchecked receipts | Receipt shape, hash echo, block hash/number/status, address formats and call/create exclusivity validated before any `inclusion: PASS`; every produced report schema-validated in every test (fixtures 12–16, 5, 15) |
| F-05 transport reads | Bounded byte-level stream read with mid-stream rejection; JSON-RPC 2.0 version + request-ID echo + result/error exclusivity enforced; per-HTTP-status and JSON-RPC error mapping tested in `tests/rpc.test.mjs` |
| F-06 missing B06 tests | Three new suites (`rpc`, `network-diagnostic`, `transaction-diagnostic`) totalling 57 tests, 21 frozen negative fixtures plus offline/bundled CLI checks; full suite 164/164; install matrix re-run|

## What this report does not claim

- **No live network evidence.** No command here reached a real QIE endpoint. Mocked reports and deny-guarded runs are labelled as such everywhere.
- **No official `skills-ref` validation.** Still unavailable in this environment (no network/PyPI); the independent validator and installer checks do not replace it.
- **No published source installation.** Git-source install/update/rollback stays NOT_RUN with no public repository.
- **Unchanged blocker.** Ecosystem contract-address identity (issuer/ABI provenance, scoped `(chain_id, address)` binding, human review) still gates any VERIFIED promotion — including the reference dApp contract under the recorded organizer clarification in [decisions.md](decisions.md).
- **No dates, durations or schedules** were added to any knowledge record.
