# Documentation portal design contract

The primary user is a developer choosing a QIE workflow and checking the evidence
behind it. The primary action is opening the quickstart and installing the router.
The first viewport shows that action, a concrete Counter task, coding-agent
examples and the release's actual evidence boundary.

Direction: a quiet technical field guide. Use an ink navigation rail, warm paper
content, teal links, amber evidence labels, a compact type scale and numbered
workflow rows. A narrow release strip keeps the immutable snapshot visible.
This extends the existing Counter app's system typography, semantic controls and
explicit evidence labels without introducing a framework or remote assets.

Target viewports: 390x844 and 1440x900. Navigation scrolls within its row on mobile. Code blocks
scroll within their own width; long hashes, URLs and source titles wrap. All
controls have visible keyboard focus and accessible names. Status is written in
text as well as color. Respect reduced motion; content remains usable without JS.

The required routes come from PRD section 15.1. Installed JSON snapshots supply
QIE facts. The installed effective-status evaluator and frozen snapshot clock
supply evidence projections. Skill and recipe links lead to byte-identical raw
files under a version-and-payload-qualified release path.

Content states:

- Loading: not applicable to documents; HTML and content are served together.
- Empty: a filter with no matches displays an explicit reset action.
- Error: clipboard denial displays a manual-copy recovery instruction.
- Partial: unknown support, absent evidence and planned skills remain visible.
- Success: a successful explicit copy confirms completion in a live region.
- Permission: account/signing permissions are not requested by the portal;
  deployment guidance points to the developer-controlled wallet boundary.

Rendered evidence must cover both target viewports, keyboard focus, filtering,
copy success/failure, long content, navigation and status visibility. Public
hosting, host/model sessions, wallet execution and external pilots need their own
evidence and are not established by rendering this portal.
