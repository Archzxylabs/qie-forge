# P0 release readiness

This is an acceptance checklist, not a percentage derived from test counts.
The current payload is identified by `skills/qie/MANIFEST.json`; each reviewed
CI run must name the actual PR head. Historical results retain their own scope.

| Gate | Current position | Required next evidence |
|---|---|---|
| Canonical knowledge and portable skills | Implemented; nine coherent bundles with pinned tools and deterministic packaging | Current-head CI, review and integration |
| Consumer bootstrap | Implemented; canonical and curated projections, preserved instructions, safe config targets and permission precedence | Actual host discovery and workflow evaluations remain separate |
| Static documentation | Implemented locally; all eleven required routes, readable skill/recipe pages and byte-identical raw release files | Hosting review, stable public URL and hosted MIME/cache/accessibility checks |
| Reference app | Local build and deterministic browser fixtures pass | Actual wallet/version connection and deployed contract reads |
| Testnet Counter | Compiled artifacts and read-only constructor simulation exist | Actual signer, fresh quote, reviewed maximum spend, wallet submission and action-linked receipt/code/state evidence |
| Mainnet demonstration | NOT_RUN | Testnet qualification, reviewed signer/budget/action, developer-controlled submission and scoped application evidence |
| QIE finality | UNKNOWN | Trusted QIE policy and observations matching that policy |
| Four-host evaluation | PARTIAL; pinned payload installed into all four profiles; three native host versions observed; Cursor executable absent | Actual Codex, Claude Code, Cursor and OpenCode discovery; same golden workflow completed by at least two hosts with recorded host/model/version |
| External pilot | NOT_RUN | Consented users and the preregistered outcomes in [the pilot protocol](pilot-protocol.md) |
| Publication governance | MIT selected by the owner; notice included in standalone bundles | Named owner/reviewer, public distribution acceptance and an approved private security-reporting channel |
| Release artifacts | Candidate only | Reviewed immutable ref, consistent docs/package identity, update/rollback evidence and known limitations |
| Contest readiness | OPEN | Organizer eligibility and actual submission requirements resolved |

## Working order

1. Keep the current engineering and audit jobs green, review PR #1 first, then
   rebase PR #2 without dropping either job and rerun the complete gates.
2. Finish local documentation and its hosted acceptance while the wallet owner
   connects the selected testnet account. MIT is selected; record the remaining publication decisions.
3. Complete the actual signer-specific Counter review. Wallet approval covers
   the displayed chain, creation bytecode, native value and maximum fee.
4. Observe the externally submitted testnet transaction and contract state.
   Preserve unknown finality rather than turning a receipt into full success.
5. Run the host matrix and consented pilot. Record absent hosts, quotas and
   incomplete attempts separately; a filesystem projection is not host evidence.
6. Prepare the separately reviewed mainnet action and final publication only
   after their prerequisites are satisfied.

## Commands for the local documentation gate

```sh
npm run build:check
npm run site:build
npm run site:check
node --test --test-isolation=none tests/documentation.test.mjs
npm run test:site
npm run site:preview
```

The preview binds to loopback at `http://127.0.0.1:5174/`. It provides no write,
wallet, account, analytics or RPC endpoint. Build output in `dist/docs` can be
reviewed and hosted as ordinary static files. The local server's MIME/cache/CSP
checks must be repeated against the actual chosen host before public acceptance.
