# Local documentation portal acceptance — 2026-10-28

This report captures the pre-license `0.6.0-ecosystem.1` portal. The subsequent [MIT candidate cut](mit-release-2026-10-28.md) records the licensed payload separately.

The B10 implementation now builds a local, original static portal. Public
hosting is still a separate gate. The source contract is
[PRD 15.1/15.2](../../QIE_Forge_PRD_v2.1.md) and the
[design contract](../../site/design-contract.md).

## Implemented surface

All eleven required routes are present: overview, get-started, skills, QIE A–Z,
ecosystem, recipes, network reference, troubleshooting, verification,
contribution and release status. Nine skill detail pages and readable views of
the bundled Markdown are generated alongside them.

The build verifies the installed nine-skill suite before projecting any content.
It reads the released snapshots, retains stored/effective status, source links,
explicit unknowns and the frozen evaluation clock, and refuses incoherent or
tampered bundles. It does not refresh evidence or promote capabilities.

Original raw bundle files, including Markdown, JSON, manifests and recipe
assets, are byte-identical under
`/releases/<release_version>/<release_id>/skills/`. The release index records
their SHA-256 digests. Relative source links remain within the copied closure.
The payload identity remains
`838a1e0952fe8da3bc6bbe746bb83754aba40acbd13611ae1ec46e8430103309`.

## Local checks

| Check | Observed result |
|---|---|
| Documentation unit tests | 8/8 passed: routes, raw byte/digest parity, status scope, local links, determinism, escaped HTML, tampered-input rejection and HTTP/path boundary |
| Browser checks | 14/14 passed across 390x844 and 1440x900 |
| Axe 4.14.0 | Zero detected WCAG 2 A/AA and 2.1 A/AA violations on all eleven main routes at both viewports |
| Keyboard and layout | Skip/focus access, scrollable code, client-width overflow, first-viewport install code and reduced motion checked |
| Interaction states | Status/search filtering, empty/reset, clipboard success/rejection and real 404 recovery checked |
| No-JavaScript path | Skill documents and raw Markdown remain readable |
| MIME and cache | Local raw Markdown/JSON content types and version-qualified immutable cache checked |
| Security boundary | No account/RPC/write endpoint; local preview stays on loopback; static paths cannot read an outside symlink target |

Rendered review caught intrinsic mobile-grid overflow. The grid was constrained,
navigation made locally scrollable, and the browser check corrected to compare
document scroll width with client width. Scrollable code was made keyboard
focusable after the axe check identified that requirement. The affected checks
were rerun successfully.

Screenshots, actual browser output and the design evidence record are in
[the evidence directory](../evidence/documentation-portal/2026-10-28/design-evidence.json).
The skill evidence checker passed after actual rendered inspection. Automated
axe results do not replace all manual accessibility checks or establish a
Lighthouse score.

## Other prepared release work

A fresh bootstrap installed the pinned candidate into the four target profiles
(Codex, Claude Code, Cursor and OpenCode), verified all nine bundles against the
expected payload identity, and created the corresponding instruction surfaces.
[Native version and installation observations](../evidence/release-preparation/2026-10-28/host-installation.json)
record Codex 0.164.0, Claude Code 2.1.309 and OpenCode 2.1.0. Cursor's executable
was absent from PATH. These are installation and availability observations;
native skill discovery and host/model workflows are not established by them.

The [release-readiness checklist](../release-readiness.md) identifies the remaining
gates. The [pilot protocol](../pilot-protocol.md) freezes consent, task comparison,
outcome fields and acceptance thresholds before external testing begins.

## Remaining acceptance

- Choose and review the actual static host, then recheck public URL, MIME/cache,
  security headers, mobile layout and accessibility against that deployment.
- Resolve repository licensing, owner/reviewer and private disclosure channel.
- Complete actual host/model workflows and the consented external pilot.
- Complete wallet-owned testnet/mainnet actions and their scoped observations;
  retain unknown QIE finality until supported by evidence.
- Require successful CI on the actual PR head and preserve the B09-first
  integration order. Current acceptance is linked from the PR, rather than
  treating an earlier commit's successful run as proof of later bytes.
