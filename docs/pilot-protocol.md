# Preregistered developer pilot

Status: **NOT_RUN**. This protocol prepares the external test; it records no
participants or outcomes. It implements PRD sections 18.4 and 19 rather than
substituting maintainer tests for independent users.

## Consent and scope

Before starting, give each participant this explanation:

> We are evaluating whether QIE Forge helps complete a reproducible development
> task. Participation is optional. You can stop at any point. We record a random
> participant code, tool versions, task completion, elapsed task time, errors and
> requested help. We do not collect wallet secrets, credentials, private source
> code, raw private prompts or identifying account details. Results are reported
> in aggregate. Tell the evaluator whether you consent before continuing.

Do not start a scored session without consent. Store consent records outside the
public repository. Use randomly assigned participant codes in the result table.
Local test tasks require no funds or on-chain submission.

## Frozen task and comparison

Record the exact release identity, host/model/version, native compiler and Forge
version before the first scored session. Keep the environment and task wording
fixed for comparable attempts. Recruit at least five consenting developers.

Task: create a clean Counter project, compile it with the pinned native compiler,
run the five canonical Solidity tests, inspect the ABI/selectors, and describe
the evidence still required before a real QIE deployment. Passing requires real
command output, expected contract behavior and no invented address or live claim.

Compare two conditions on equivalent clean workspaces:

1. The participant's coding agent plus the official QIE documentation.
2. The same host/model/tool versions plus the pinned QIE Forge release.

Alternate the order across participant codes and record the actual assignment.
Keep failed, stopped and quota-limited attempts in the record. Start timing when
the participant receives the task; stop on accepted completion or recorded exit.
Record maintainer interventions separately and explain any environment mismatch.

## Routing and host checks

The target hosts are Codex, Claude Code, Cursor and OpenCode. Record real
installation/discovery on each, and the same golden workflow completed by at
least two different hosts. Run the frozen routing fixtures independently per
host/model, at least three repetitions per fixture during the pilot. Preserve
the accepted routes and prohibited behaviors defined in the existing fixtures.
All five high-risk fixtures must pass every scored run.

## Result fields

| Field | Recorded value |
|---|---|
| Participant | Random code; no identity |
| Consent | Confirmed externally / declined / withdrawn |
| Release and condition | Exact payload identity or baseline; order |
| Host/model/toolchain | Exact observed versions |
| Outcome | PASS / FAIL / INCOMPLETE / NOT_RUN |
| Task duration | Measured elapsed time; never estimated |
| Independent completion | Yes only when no maintainer intervention occurred |
| Evidence | Redacted commands, exit codes, test/ABI results and artifact digests |
| Failure or intervention | What happened and its effect on the result |
| Critical error | Wrong network, fabricated address, false evidence or unauthorized action |

## Predeclared decision

Targets: at least five testers, at least three independent golden-path
completions, zero critical wrong-chain or invented-address recommendations,
100% success on the high-risk routing fixtures, and a median verified-completion
duration improvement of at least 25% among matched completed pairs.

Publish denominators, failures, stopped attempts and unmatched observations
alongside completed pairs. If the benefit target is missed, record a
`NARROW` or `STOP_EXPANSION` decision before adding domains. Missing participants
or incomplete evidence keep acceptance open. Report repeat use only when
actually observed; it is not assumed retention.
