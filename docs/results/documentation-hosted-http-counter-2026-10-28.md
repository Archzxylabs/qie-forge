# Hosted HTTP installation and Counter observation — 2026-10-28

The MIT candidate portal now serves the existing Skills CLI's HTTP discovery
format and the original read-only Counter app. This capture is separate from
the [initial hosted observation](documentation-hosted-2026-10-28.md).

- Stable portal: <https://qie-forge-docs-fao2-5364s-projects.vercel.app/>.
- Stable Counter: <https://qie-forge-docs-fao2-5364s-projects.vercel.app/counter/>.
- Captured deployment: <https://qie-forge-docs-5eqg24rws-fao2-5364s-projects.vercel.app/>.
- Deployment ID: `dpl_JCdpqshEsos8UdrZrQNMNT1svbbK`; environment: production.
- Captured source: `683e98de928468ee2a8db8f3adf7728dc0535c11`.
- Supporting CI: [40675390569](https://github.com/Archzxylabs/qie-forge/actions/runs/40675390569).
- Release: `0.6.0-ecosystem.2`; frozen build clock: `2026-10-28T09:57:38Z`.
- Payload: `3aa11f7a34b9db51b1b9de243a4642af4eed6fe734c24e287ad0bd93888bd11b`.

The deployment contains 395 static build files. All 393 publicly served files
matched the local build bytes, including 149 canonical raw bundle files and
their 149 HTTP discovery aliases. The other two files, `vercel.json` and
`_headers`, are host configuration rather than public content. Anonymous
requests used no authentication headers. All eleven portal routes and
`/counter/` returned 200; the stable Counter alias returned 200 and an
unavailable route returned 404. The capture retains MIME, caching and CSP
headers alongside each observed file digest.

All sixteen existing portal/Counter browser checks passed against the captured
HTTPS deployment at desktop `1440x900` and mobile `390x844`. They cover routes,
axe scans, first-viewport installation, filtering/reset, clipboard recovery,
keyboard focus, no-JavaScript documents, reduced motion and the Counter's mock
and missing-wallet states. Overview screenshots were visually inspected at both
sizes. Automated accessibility scans do not constitute a complete audit.

## Anonymous installation

The existing pinned Skills CLI `1.7.2` installed the entire suite from this source
into a clean temporary consumer with an isolated home:

```sh
npx --yes skills@1.7.2 add \
  'https://qie-forge-docs-5eqg24rws-fao2-5364s-projects.vercel.app/releases/0.6.0-ecosystem.2/3aa11f7a34b9db51b1b9de243a4642af4eed6fe734c24e287ad0bd93888bd11b' \
  --skill '*' --agent codex --agent claude-code --agent cursor --agent opencode \
  --copy --yes
```

The captured run invoked the already installed pinned CLI directly with Node,
rather than downloading the CLI again through `npx`. It exited 0. The independent
installed-release verifier then returned `verificationComplete: true` and
`PINNED_MATCH` for the expected payload: nine coherent canonical bundles and
nine Claude projections, with no problems. Codex, Cursor and OpenCode share the
canonical `.agents/skills` layout; these are four selected installer profiles,
not four executed model workflows. All nine installed bundles retained MIT.

The supporting CI run passed 349 repository tests, 349 coverage tests (93.80%
lines, 84.25% branches, 98.37% functions), 20 installation cases, 22 original
Counter browser cases and 16 portal/Counter browser cases. The separate audit
job found zero vulnerabilities. CI acceptance for later commits must name those
commits; this report keeps the deployed source above.

Raw HTTP observations, installer output, pinned verification, browser output,
overview screenshots and checksums are retained in
[the evidence directory](../evidence/documentation-hosted/2026-10-28-http-counter/acceptance.json).
Only trailing blank lines were normalized in the retained installer stdout.
Later documentation-only evidence commits do not change which source produced
the captured deployment. Stable aliases can advance; reproduction uses its
immutable deployment URL and exact payload.

Actual wallet/version connection, signer-specific transaction review, contract
deployment, host/model workflow qualification, external pilot and final release
integration remain open in the [readiness checklist](../release-readiness.md).
