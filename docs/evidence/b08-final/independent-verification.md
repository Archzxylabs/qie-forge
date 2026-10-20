# Independent post-remediation verification

**Session:** OpenCode, run after the B08 final-audit remediation
(`docs/audit/QIE_Forge_B08_Final_Independent_Audit.md`, findings F-FINAL-01,
F-FINAL-02, F-FINAL-03) was implemented.
**Release cut under test:** `0.5.1-ecosystem.1`, schema/policy `1.4.0`,
`built_at = 2026-10-19T22:35:15Z`.
**Toolchain:** Node `v24.20.0`, npm `11.19.0` (the versions declared in
`package.json` / `.node-version`).
**Artifacts in this directory:** `independent-checks.txt` (raw output),
`independent-verify.mjs` (the read-only checker, re-runnable),
`s21-remix-guide-receipt.md` + `s21-remix-guide-body.md` +
`s21-remix-guide-headers.txt` (source retrieval receipt).

**Verdict: the remediated release is internally consistent and reproducible.
No defect was found in this pass, and no capability, claim or address was
promoted.**

## 1. What was executed

| Command | Result |
|---|---|
| `npm run build:check` | PASS — all nine bundles reproduced byte-for-byte from the canonical inputs |
| `npm run validate` | PASS — 15 domains, 18 sources, 11 claims, 25 capabilities; 9 self-contained bundles validated |
| `npm run docs:check` | PASS — the generated evidence catalogue matches canonical data |
| `npm run lint` | PASS — JavaScript syntax checks |
| `npm test` | PASS — 270/270, 0 failed |
| `npm run test:coverage` | PASS — 270/270; 97.72% lines, 88.35% branches, 98.92% functions |
| `npm run test:install` | PASS — 20/20 Skills CLI installation fixtures |
| `npm run verify:evidence` | PASS — all nine gates green in one deterministic pass; the milestone reports quote the executed figures |
| `node docs/evidence/b08-final/independent-verify.mjs` | PASS — `No problems found.` |

## 2. Independent checks (not part of the project suite)

`independent-verify.mjs` is a read-only checker written for this pass. It
re-derives, from the canonical records and the published tree alone:

- **Chronology.** The release cut and every non-null source review are in the
  past relative to the run clock, and no review follows the cut.
- **Tree equality.** `skills/` and `dist/skills/` contain the same files with
  the same bytes.
- **Manifest integrity.** Every SHA-256 declared in the nine `MANIFEST.json`
  files matches the published file it describes, and every manifest records the
  canonical release cut.
- **Status parity (F-FINAL-02).** For all 25 capabilities, the effective status
  published in the compatibility matrix equals
  `effectiveStatus(capability, { now: built_at, offline: true })` computed
  independently from `knowledge/capabilities.yaml`. The catalogue and the matrix
  therefore cannot disagree about a support verdict.
- **Published-fact hygiene.** No published Markdown file contains a contract
  address literal, a retired endpoint (`qiescan.org`, `rpc-main1.qie.digital`,
  `rpc-testnet.qie.digital`), or an unresolved `{{…}}` placeholder.
- **Canonical facts are published.** Every canonical `chain_id`, `rpc_url` and
  `explorer_url` claim value appears in the generated catalogue, and all nine
  `references/release-info.md` pages state the release cut.

## 3. Residual observations (no action required for this release)

1. **The chronology rule has one implementation.** `scripts/lib/chronology.mjs`
   owns the release-cut gate, and `scripts/lib/knowledge.mjs` delegates to it
   with an injectable clock (so frozen fixtures never depend on the wall clock)
   while `scripts/validate-knowledge.mjs` and `buildRelease()` call it with the
   real clock. The tolerance is the documented five minutes in both paths.
   Verified in the final tree; an earlier revision of this pass had found the
   rule duplicated inline, and that duplication is gone.
2. **The S21 body digest is evidence, not canonical data.** The receipt in this
   directory preserves the exact bytes of the Remix guide that were reviewed
   (SHA-256 `507912db…`), and the observation precedes the current release cut.
   It was deliberately **not** written into `knowledge/sources.yaml`
   (`content_sha256` stays `null`), because that would change every bundle
   digest and belongs to a deliberate release cut rather than to a verification
   side-channel. Promoting it is the recommended next cut.
3. **The hand-written-fact guard is a heuristic.** It rejects the literal
   patterns the audits found (chain identifiers, canonical endpoints, support
   verdicts). It cannot prove that arbitrary prose is free of interpretation;
   the canonical projections remain authoritative.
4. **Unchanged release gates.** No QIE RPC endpoint was contacted, no wallet
   extension was loaded, no transaction was signed or broadcast, no contract was
   deployed, and no capability was promoted to `VERIFIED`
   (`knowledge/validation-runs.yaml` and `knowledge/addresses.yaml` are both
   empty). The official Skills validator, public git-source installation and
   the B09 distribution/update/rollback work remain outside this release.
