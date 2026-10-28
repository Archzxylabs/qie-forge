# Hosted documentation observation — 2026-10-28

The original MIT candidate portal was deployed to the dedicated Vercel project
`qie-forge-docs` after current-head CI succeeded. Vercel assigned the first
deployment to the production environment. This is a hosted candidate, with its
release status and evidence limits visible in the UI.

- Stable project URL: <https://qie-forge-docs-fao2-5364s-projects.vercel.app/>
- Captured deployment: <https://qie-forge-docs-noouux8br-fao2-5364s-projects.vercel.app/>
- Captured source: `de889d511a41484f35ba362a4d4483d26b78f921`.
- Supporting CI: [40670866339](https://github.com/Archzxylabs/qie-forge/actions/runs/40670866339).
- Payload: `3aa11f7a34b9db51b1b9de243a4642af4eed6fe734c24e287ad0bd93888bd11b`.

Anonymous requests, with no authentication headers, returned HTTP 200 for all
eleven required routes and for the stable alias. All 149 canonical raw bundle
files matched the published SHA-256 inventory. Markdown/JSON MIME types,
version-qualified immutable caching, CSP and `nosniff` were checked. The root
MIT notice matched the local bytes, and an unavailable route returned 404.

The existing fourteen browser checks also passed against the actual HTTPS
deployment on desktop and mobile, including route/axe scans, first-viewport
installation, filtering/reset, clipboard recovery, keyboard focus, no-JavaScript
documents, raw access and reduced motion. These observations establish the
captured hosted surface; they do not establish wallet, model-host or pilot results.

Raw observations and browser output are retained in
[the hosted evidence directory](../evidence/documentation-hosted/2026-10-28/acceptance.json).
Later HTTP discovery work is separately validated; it is not part of this first
deployment capture. Stable aliases can advance, so reproduction uses the
captured deployment URL and payload identity above.
