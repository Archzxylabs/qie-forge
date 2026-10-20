# Source retrieval receipt — S21 (Remix deployment guide)

Independent re-retrieval performed by the OpenCode session while verifying the B08
final-audit remediation (finding F-FINAL-01, source-review provenance).

| Field | Value |
|---|---|
| Canonical source ID | `S21` |
| URL | `https://docs.qie.digital/developer-docs/smart-contract-deployment/deploy-using-remix.md` |
| Observed (UTC) | `2026-10-19T21:44:49Z` (server `Date` header and local clock agree) |
| HTTP status | `200` |
| Content-Type | `text/markdown; charset=utf-8` |
| Content-Length | `684` bytes |
| SHA-256 of body | `507912dba2dc16f40b3a6ed62e2d5bd9c5d39aade07144407cf02bc09f932852` |
| Retained artifacts | `s21-remix-guide-body.md` (exact body), `s21-remix-guide-headers.txt` (response headers) |

## What the retrieved page confirms

The page is reachable, is the official QIE developer documentation, and states
exactly what the canonical `remix-deploy` capability record claims:

1. the `Deploy & Run Transactions` tab with **Environment = `Injected Web3`**,
2. connecting **MetaMask while on the QIE network**,
3. clicking **Deploy**, after which the contract address is shown.

It states **no compiler version** and **no EVM target**, which is why the
canonical record keeps `tool_version_range: null` and the canonical limitation
says the guide specifies no compiler version or EVM target. No new claim was
discovered, and no claim was promoted: `remix-deploy` remains `DOCUMENTED` (not
`VERIFIED`), because a documentation page is not execution evidence and no
transaction was signed or broadcast.

## Relation to the canonical record

- `knowledge/sources.yaml` records `reviewed_at: 2026-10-19T21:37:00Z` for S21
  (the review observed during the remediation itself) and
  `content_sha256: null`.
- The observation recorded here is a **second, independent** retrieval 7m48s
  later, before the current release cut (`2026-10-19T22:35:15Z`). It therefore
  does not contradict the canonical review time and does not require a re-cut.
- The digest above is evidence for the exact bytes that were reviewed. It is
  deliberately **not** written into `knowledge/sources.yaml` here: changing
  canonical data would change every bundle digest, and that promotion belongs
  to a deliberate release cut rather than to a verification side-channel.
  Recording it in `sources.yaml` is the recommended follow-up at the next cut.
