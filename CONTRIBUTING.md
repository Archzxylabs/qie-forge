# Contributing to QIE Forge

Thanks for helping keep QIE Forge accurate. The skills are plain Markdown, so most contributions are edits to files under [`skills/`](skills/).

## Ways to contribute

- **Report a wrong or outdated fact** with the [issue form](https://github.com/Archzxylabs/qie-forge/issues/new?template=wrong-fact.yml), and include a source.
- **Propose a skill or section** with the [skill request form](https://github.com/Archzxylabs/qie-forge/issues/new?template=skill-request.yml).
- **Fix it yourself** with a pull request, as described below.
- **Report security problems privately.** A wrong or malicious contract address, for example, goes through the channel in [SECURITY.md](SECURITY.md), not a public issue.

## Rules for facts

These rules are what make the skills trustworthy. Pull requests that break them can't be merged.

1. **Source every fact.** Link an official QIE source, or record an observation. Official sources are:
   - the docs at https://docs.qie.digital, where every page is also available as `.md`;
   - official QIE apps, APIs and repositories.
2. **Label it** as in the README: Documented, Observed, Claimed or Unknown.
3. **Date observations** and give the exact read-only command, for example `cast chain-id --rpc-url https://rpc1testnet.qie.digital/`.
4. **Verify addresses on-chain** on the network you name:
   - `cast code` must return code;
   - an identity call (`symbol()`, `owner()`, `underlying()`, …) must match the role;
   - write the address in EIP-55 checksummed form.
5. **Name the network** for every address and endpoint. Never mix mainnet (1990) and testnet (1983).
6. **Never include secrets**, not even in examples. That means no private keys, seed phrases, API keys, personal data or local file paths.
7. **Prefer "unknown" to invented.** If you can't source a fact, say it is unknown.

## Writing style

Agents read the skills and act on them. So:

- Write short sentences, exact values, and commands that run as written.
- Put values in tables and commands in code blocks.
- Keep each skill focused on one task area. Refer to other skills by name instead of repeating them.
- In each `SKILL.md`:
  - the frontmatter `name` must match the directory;
  - the `description`, at most 1024 characters, must say when an agent should load the skill.

## Pull requests

1. Fork the repository and create a branch from `main`.
2. Make your change and run the consistency check. It needs Node.js 22 or newer and no dependencies:

   ```bash
   node .github/scripts/check-skills.mjs
   ```

3. If users will notice the change, add an entry under **Unreleased** in [CHANGELOG.md](CHANGELOG.md).
4. Open a pull request and complete the checklist. `main` only accepts changes through pull requests, and the CI check must pass before merge.

Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix | Use it for |
|---|---|
| `fix(skills):` | Corrections |
| `feat(skills):` | New content |
| `docs:` | Documentation outside the skills |
| `chore:` | Maintenance |
| `ci:` | CI configuration |

Mark breaking changes, such as a renamed or removed skill, with `!` (for example `feat(skills)!:`).

## Releases

Releases follow [Semantic Versioning](https://semver.org/), adapted to a knowledge pack:

| Version part | When it changes |
|---|---|
| Major | A skill is renamed or removed, or the layout changes |
| Minor | A new skill, reference file or section is added |
| Patch | Facts are corrected or re-verified |

To release, maintainers:

1. move the **Unreleased** entries in `CHANGELOG.md` under the new version;
2. tag `vX.Y.Z` on `main`;
3. publish a GitHub release with the same notes.

## Code of Conduct

Everyone taking part in this project is expected to follow the [Code of Conduct](CODE_OF_CONDUCT.md).
