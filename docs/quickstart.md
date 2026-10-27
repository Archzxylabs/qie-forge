# QIE Forge developer quickstart

This is the shortest supported path from a clean Linux checkout to the verified local workflows. It is written for the environment the repository tests: **Ubuntu 24.04**, **Node.js 24.20.0**, **npm 11.19.0**, **Forge 1.8.1** and native **solc 0.8.37** (`0.8.37+commit.f401782d`).

Nothing here contacts a QIE RPC endpoint, uses a wallet, signs a transaction or broadcasts one. Every required check is local. Mock and fixture scopes are labelled where they appear.

## 1. Install the supported toolchain

### Node.js and npm

Use Node.js 24.20.0. With `nvm`:

```sh
nvm install 24.20.0
nvm use 24.20.0
npm install --global npm@11.19.0
```

Confirm both exact versions:

```sh
node --version  # v24.20.0
npm --version   # 11.19.0
```

### Foundry 1.8.1

```sh
curl -L https://foundry.paradigm.xyz | bash
foundryup --install 1.8.1
forge --version # Version: 1.8.1; Commit SHA: 982849d3140c…
```

The commit must match `recipes/build-test/toolchain.json`. `npm run doctor` checks it.

### Native solc 0.8.37

Download the official Linux AMD64 binary and verify its SHA-256 before making it executable:

```sh
curl --fail --location \
  --output /tmp/solc-linux-amd64-v0.8.37+commit.f401782d \
  https://binaries.soliditylang.org/linux-amd64/solc-linux-amd64-v0.8.37+commit.f401782d
echo '5de843c2c93563cc66425c99a4fb13fdbf32b4c4ae07469480faaf126e14404a  /tmp/solc-linux-amd64-v0.8.37+commit.f401782d' | sha256sum --check
chmod +x /tmp/solc-linux-amd64-v0.8.37+commit.f401782d
mkdir -p "$HOME/.local/bin"
mv /tmp/solc-linux-amd64-v0.8.37+commit.f401782d "$HOME/.local/bin/solc-0.8.37"
export QIE_FORGE_SOLC="$HOME/.local/bin/solc-0.8.37"
```

`QIE_FORGE_SOLC` is authoritative when set: an unusable override fails instead of silently falling back to another compiler. If you prefer not to set it, put a native `solc` earlier on `PATH`; the shared resolver accepts that existing binary. A solc-select installation also works when you point the variable at the native artifact, for example `~/.solc-select/artifacts/solc-0.8.37/solc-0.8.37`. If a solc-select wrapper is on `PATH`, discovery inspects it and uses an existing artifact without executing the wrapper; it never downloads one. Do not rely on a wrapper that downloads on demand.

## 2. Install and check this checkout

```sh
git clone <repository-url> QIE-FORGE
cd QIE-FORGE
npm ci --ignore-scripts --no-audit --no-fund
npm run doctor
```

A ready environment ends with:

```text
[PASS] Node.js: 24.20.0 satisfies ">=24.20.0 <25".
[PASS] npm: 11.19.0 matches the pinned package manager "npm@11.19.0".
[PASS] Forge: 1.8.1 (commit 982849d3140c…) matches recipes/build-test/toolchain.json.
[PASS] solc (QIE_FORGE_SOLC): 0.8.37+commit.f401782d…; native compile probe succeeded.
# or: [PASS] solc (PATH): …        # when a native solc leads PATH
# or: [PASS] solc (solc-select artifact): …  # wrapper resolved safely
[PASS] Skill bundles: Nine coherent bundles; release <release-id>.

doctor: READY — required prerequisites passed. This does not prove QIE network or wallet compatibility.
```

`doctor` only observes the machine. It never installs, upgrades, downloads or contacts a network.

## 3. Build and verify the repository

Run the non-mutating consistency check before any build that writes generated output:

```sh
npm run build:check          # committed bundles match canonical sources
npm run example:prepare:check # committed Counter ABI asset matches the contract
npm run validate
npm run docs:check
npm run lint
npm test
npm run typecheck
```

Then build and exercise the example:

```sh
npx playwright install --with-deps --no-shell chromium
npm run example:build
npm run test:browser
```

`--no-shell` matches the example's `channel: 'chromium'` configuration; it installs the full Chromium build, not the headless shell. Expected browser result for the current candidate: **22 passed**. The earlier [developer-experience remediation](results/developer-experience-remediation.md) retains its historical 16-test result.

`npm run build:check` and `npm run example:prepare:check` must run against the checkout as committed. They fail instead of rewriting files. `npm run build` and `npm run example:prepare` are the explicit regeneration commands.

## 4. Run the Counter reference app

```sh
npm run example:prepare
npm run example:dev
```

Open the printed URL. The default **Mock demonstration** mode is deliberately labelled `SIMULATED DEMONSTRATION — deterministic mock adapter. No wallet, RPC endpoint, funds or QIE compatibility evidence is involved.` It connects and reads only after you click the buttons.

To exercise **Injected wallet** mode:

1. Enable the [QIE Wallet extension](https://chromewebstore.google.com/detail/oljchdcgmibnjbbopolafbjncfhdacjb) in the browser profile. Enable its Testnet setting when using QIE testnet.
2. Select `Injected wallet (real provider)` and the intended QIE network in the app.
3. Click **Connect** and approve account access in the wallet. The connected public address is displayed even before a Counter address is configured.
4. To read a deployed Counter, enter its address for the selected network. Changing the address clears the old session; Connect again, then click **Read counter value**.

The app prefers QIE Wallet's EIP-6963 announcement, then `window.qie`, then the legacy `window.ethereum` provider. Missing providers produce an installation link. Discovery stays separate from account permission requests.

The session rejects a wrong chain, clears account and value on `accountsChanged`, `chainChanged` and `disconnect`, invalidates on a changed contract address, discards late in-flight results, and fails closed when no injected provider exists. It never falls back to mock mode. No transaction is signed or broadcast. An invalid or missing address is reported as an input error without replacing a ready session: **Retry connection** is not offered, the address field is focused, and changing the target disconnects and clears the old value. Correct the address, then connect and read again deliberately.

The browser tests use a deterministic injected-provider fixture and a fixture-only mock adapter. They do **not** establish compatibility with any real wallet or QIE endpoint.

## 5. Bootstrap a consumer project for any coding agent

The generated skills are installed with the pinned Skills CLI. Build the
release first (`npm run build`) so the source contains `skills/qie/SKILL.md`.
The bootstrap wrapper adds agent-native instruction files and a post-install
verification step. Replace the checkout path with the absolute path to this
repository.

```sh
cd /path/to/consumer
node /absolute/path/to/QIE-FORGE/scripts/bootstrap-consumer.mjs \
  --source /absolute/path/to/QIE-FORGE \
  --target . \
  --agent auto \
  --copy
```

`auto` always installs the canonical `.agents/skills` suite and adds every agent
detected in the consumer project. Use `--agent matrix` to install the curated
agent set in `templates/consumer/agents.json`, or `--agent '*'` to pass `*` to
the pinned Skills CLI (every agent it supports). Named agents can be combined:
`--agent claude-code --agent kiro-cli`. `--global` installs skills in the
user-level directories and intentionally skips project instruction files.
`--copy` is the default; use `--symlink` to request symlinked agent
projections. The pinned CLI may copy instead when only one target directory is
involved, and the JSON report records both the requested and actual mode.

The bootstrap writes managed blocks, so existing `AGENTS.md`, `CLAUDE.md`,
`GEMINI.md`, Cursor/Windsurf/Kiro/Continue rules, Copilot instructions and
other agent files keep their content. It writes `opencode.jsonc` only when no
OpenCode config exists; use `--merge-opencode-config` to merge QIE entries into
an existing `opencode.json(c)` with a timestamped backup. `--force` overwrites
an existing OpenCode config after a timestamped backup. Comments are not
preserved by those rewrites.

Verify the plan without writing anything first:

```sh
node /absolute/path/to/QIE-FORGE/scripts/bootstrap-consumer.mjs \
  --source /absolute/path/to/QIE-FORGE \
  --target . \
  --agent matrix \
  --dry-run --json
```

The default post-install check runs `scripts/verify-installed-release.mjs
--expect-suite` against the canonical `.agents/skills` tree and structurally
checks every non-canonical agent projection. This proves the installed payload
and projection shape; it does **not** launch each agent or prove that a host
loads its instruction file. Use `--no-verify` only when you are deliberately
deferring that check.

The pinned Skills CLI remains available for a manual install:

```sh
node /absolute/path/to/QIE-FORGE/node_modules/skills/bin/cli.mjs add /absolute/path/to/QIE-FORGE --list
node /absolute/path/to/QIE-FORGE/node_modules/skills/bin/cli.mjs add /absolute/path/to/QIE-FORGE \
  --skill qie-smart-contracts qie-wallets qie-networks \
  -a codex -a claude-code -y
```

For a Git source, pin an immutable tag or a full commit SHA:

```sh
node /absolute/path/to/QIE-FORGE/node_modules/skills/bin/cli.mjs add \
  https://github.com/OWNER/REPO.git#<full-commit-sha> \
  --skill '*' -a codex -a claude-code -y
```

Add `--copy` when copied projections are required. Verify a complete install without modifying it:

```sh
node /absolute/path/to/QIE-FORGE/scripts/verify-installed-release.mjs \
  --root .agents/skills --expect-suite
```

Use the full suite for `--expect-suite`. A deliberate subset reports `COHERENT_PARTIAL`, not a full-suite claim. The report's `publisherAuthenticity` is `NOT_ESTABLISHED` unless you pass a separately trusted `--release-id`.

## 6. Use installed resources without the checkout

Offline network inspection:

```sh
node .agents/skills/qie-networks/scripts/inspect-network.mjs qie-testnet
```

Expected shape: the chain ID claim is `1983`, statuses remain `DOCUMENTED`, and `live_check` is `NOT_RUN`. The installed bundle reads its packaged snapshot by default and needs no option. A source checkout can use `--claims <network-claims.json>` for the same command.

Local Counter build/test from installed bundles:

```sh
cp -R .agents/skills/qie-smart-contracts/recipes/build-test/assets ./counter
cd counter
SOLC_BIN="${QIE_FORGE_SOLC:-$(command -v solc)}"
forge build --offline --use "$SOLC_BIN"
forge test --offline --use "$SOLC_BIN" -vv
```

Expected: `5 passed; 0 failed` with `runs: 256`. The compiled ABI exposes `increment()` (selector `0xd09de08a`) and `value()` (selector `0x3fa4f245`). `forge build` may print non-fatal Solidity lint diagnostics; trust the exit status and the test summary, not warning text. This is a **local compiler/EVM replay** only; it does not prove QIE deployment compatibility.

The repository includes a repeatable clean-consumer check that installs only `qie-networks`, `qie-smart-contracts` and `qie-wallets`, deletes the source fixture, verifies the installed payloads, runs the inspector, drives the installed read controller with a mock provider, and replays the real Forge build/test. It runs as part of `npm test` (`tests/consumer-journey.test.mjs`).

## 7. Agent workflow prompts

After installing the skills, an agent can be pointed at a concrete task. These prompts are examples, not proof of any specific client's behavior. A prompt that names a skill requires that skill to be installed; the subset in step 5 is intentionally partial, so install any additional named skill the same way.

- **Build/test the Counter locally:** "Use the installed `qie-smart-contracts` skill. Follow its recipe to copy the Counter assets into a fresh directory, build and test offline with `QIE_FORGE_SOLC`, and report the exact commands and pass counts. Do not contact QIE."
- **Integrate a guarded read:** "Use the installed `qie-wallets` and `qie-frontend` skills. Integrate the canonical read controller into my app, keep connect user-initiated, bind the selected QIE chain, invalidate on account/chain/disconnect events, and do not add signing or mock fallback."
- **Diagnose a wrong-chain failure:** "Use the installed `qie-networks` and `qie-debug` skills. Inspect the packaged chain ID, explain the wrong-chain guard, and give the exact recovery step. Do not invent live RPC evidence."

A six-task evaluation rubric and the results of the runs performed for this change are in [`docs/agent-evaluation.md`](agent-evaluation.md).

## 8. Failure recovery

| Symptom | Recovery |
| --- | --- |
| `doctor: NOT_READY` with a Node or npm mismatch | Install Node.js 24.20.0 and run `npm install --global npm@11.19.0`. |
| Forge missing or wrong commit | Run `foundryup --install 1.8.1`; confirm `forge --version`. |
| solc missing or unusable | Re-download native 0.8.37, verify the checksum, and set `QIE_FORGE_SOLC` to the absolute path or put the native binary first on `PATH`. A broken override intentionally fails; a wrapper is not executed during discovery. |
| Dependencies absent | `npm ci --ignore-scripts --no-audit --no-fund`. |
| `build:check` fails | Run `npm run build`, review the regenerated diff, rerun the check. Do not hand-edit `skills/`. |
| `example:prepare:check` fails | Run `npm run example:prepare`, review `examples/counter-dapp/src/generated/counter.ts`, rerun the check. |
| Browser tests cannot launch | Run `npx playwright install --with-deps --no-shell chromium`. |
| `npm test` fails on Forge | The suite executes real local tools; re-run `npm run doctor` first. |
| App shows `WRONG_CHAIN` | Switch the wallet to the selected QIE network and use **Retry connection**. The app does not try another network. |
| App shows `INVALID_ADDRESS` | Correct the address field; the target change clears the old value and disconnects. Connect and read again deliberately. There is no session retry for this input error. |
| App shows `NO injected provider` | Enable an EIP-1193 wallet, or select the labelled mock demonstration. There is no silent fallback. |

## 9. What the checks do not prove

- No required check contacts QIE. `NOT_RUN` from the inspector and `UNKNOWN` capability statuses remain `NOT_RUN` and `UNKNOWN`.
- Mock mode and the injected browser fixture are deterministic demonstrations, not wallet interoperability evidence.
- Local Counter compilation and tests do not prove QIE deployment, RPC compatibility or finalized transactions.
- The doctor verifies the local environment and bundle identity; it does not verify a publisher signature or network behavior.
- `verify:evidence` and `verify:b09-evidence` are historical evidence generators, not the developer workflow. Do not use them to certify a new checkout.
