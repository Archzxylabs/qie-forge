# MIT candidate cut — 2026-10-28

The owner selected MIT after reviewing the local documentation portal. Original
QIE Forge code and documentation now carry the canonical [MIT notice](../../LICENSE).
Third-party source and dependency license terms are retained separately.

| Identity | Value |
|---|---|
| Release | `0.6.0-ecosystem.2` |
| Schema/policy | `1.4.0` |
| Frozen build clock | `2026-10-28T09:57:38Z` |
| Payload | `3aa11f7a34b9db51b1b9de243a4642af4eed6fe734c24e287ad0bd93888bd11b` |

Every authored skill declares `license: MIT`. The builder copies the canonical
notice into all nine bundles and covers it in their manifests and shared payload
identity. A missing notice blocks generation. Standalone copies retain the
notice after the source checkout is removed.

The licensed cut changes the release version, build clock, projected snapshots,
metadata and notice inventory. Source review dates, canonical stored claims,
capability evidence and the original Counter bytecode are not revalidated by
this packaging change. Historical B08/B09, agent evaluations, chain captures and
the earlier portal report remain tied to their original payloads.

## Local gates

- Twenty-nine multi-skill/ecosystem checks passed, including notice retention
  after source removal and missing-notice rejection.
- Eight documentation unit checks passed, including exact root/bundled license
  bytes, raw digests, status/clock scope and publication rejection for tampered input.
- Fourteen desktop/mobile browser checks passed for the licensed portal, with
  zero detected WCAG A/AA violations on the eleven main routes.
- The full repository coverage run passed 348/348 tests, with 93.81% lines,
  84.31% branches and 98.37% functions in the local capture.
- A fresh four-profile install matched the pinned payload and retained all nine
  MIT notices; see [the installed-license capture](../evidence/release-preparation/2026-10-28-mit/installed-licenses.json).
- Generated bundle parity passed. The portal has its own deterministic build
  and version-qualified raw release tree, plus a visible MIT notice link.

Full current-head CI and hosted acceptance are linked from the active PR. A
passing run from an earlier commit does not certify later changes. The
[readiness checklist](../release-readiness.md) tracks remaining host/model,
wallet, pilot, governance and public-distribution gates.
