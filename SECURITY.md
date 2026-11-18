# Security policy

QIE Forge ships knowledge rather than code, but agents act on it. A wrong contract address or an unsafe instruction in a skill can cost users real funds, so we treat those as security issues.

## Report privately

Use GitHub's private reporting: open the repository's **Security** tab and choose **Report a vulnerability**, or go directly to https://github.com/Archzxylabs/qie-forge/security/advisories/new.

Report privately when a skill contains:

- a wrong, spoofed or malicious contract address, or a lookalike token presented as official;
- an instruction that could make an agent:
  - expose keys or seed phrases;
  - sign or send an unintended transaction;
  - skip a network or chain-ID check;
- a link or endpoint that has been compromised or now points somewhere unsafe.

Please include:

- the file and line;
- what is wrong;
- your evidence: an explorer link, a transaction, or the read-only command you ran and its output;
- the network.

Ordinary outdated facts, such as an RPC that went offline, can go in a public [issue](https://github.com/Archzxylabs/qie-forge/issues/new?template=wrong-fact.yml).

## What happens next

We aim to acknowledge a report within a few days. Confirmed address and safety problems are fixed before anything else. Once the fix is released, the changelog describes it.

## Supported versions

Only the latest release is supported. Fixes are released as a new version and are not backported.

## Out of scope

Vulnerabilities in QIE itself, in QIE Wallet, or in other QIE or third-party products belong to their owners. Report those to the QIE team through its official channels, listed on https://www.qie.digital/developers.
