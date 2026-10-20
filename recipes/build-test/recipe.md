# Build and test a local Solidity project

**Scope:** local EVM tooling replay for an intended QIE EVM project; no QIE RPC, signing or deployment. Toolchain pins are in [toolchain.json](toolchain.json): Forge 1.8.1 at the recorded commit, solc 0.8.37. `paris` is this fixture's local EVM target, not a claim about supported QIE opcodes. Mainnet/Testnet compatibility remains UNKNOWN. Native QIE procedures are separate.

**Inputs/prerequisites:** an installed skill path `SKILL_DIR`, an empty new `PROJECT_DIR`, existing exact tools, an explicit absolute `SOLC_BIN` path to the installed native compiler, Node 24.20.0 and permission for local file creation. Inspect an existing project's source/dependencies before adapting this recipe; do not overwrite it. Do not install or upgrade tools globally as an implicit step.

1. Check `forge --version` and `"$SOLC_BIN" --version` against the pins. Reject mismatches (DEPENDENCY_MISMATCH); a different version requires a separately recorded replay. A `solc-select` wrapper may try to download a compiler when its HOME/cache changes; pass the existing native binary explicitly for the offline replay. Forge's offline flag cannot prevent a separate wrapper from downloading.
2. Materialize the original fixture from [assets](assets/foundry.toml), [contract](assets/src/Counter.sol) and [tests](assets/test/Counter.t.sol):

```sh
mkdir "$PROJECT_DIR"
cp -R "$SKILL_DIR/recipes/build-test/assets/." "$PROJECT_DIR/"
cd "$PROJECT_DIR"
test -x "${SOLC_BIN:?Set an absolute path to the pinned native compiler}"
forge build --offline --use "$SOLC_BIN"
forge test --offline --use "$SOLC_BIN" -vv
forge inspect --offline --use "$SOLC_BIN" Counter abi --json > abi.json
forge inspect --offline --use "$SOLC_BIN" Counter methodIdentifiers --json > methods.json
```

Run each command only after the preceding command passes. Expected artifacts: `out/Counter.sol/Counter.json`, ABI, creation/runtime bytecode, `abi.json`, `methods.json` and the five Solidity test results (including a 256-run bounded fuzz test). No forge-std, registry package or network dependency is required. Commands are local build/test/inspection only.

3. Inspect the ABI and compiler artifact. Confirm `increment()` and `value()` match the intended fixture, compiler version and EVM target. Derive calldata from the ABI/method artifact, never from guessed hashes. Save source/configuration/artifact digests and the actual command outputs as LOCAL_REPLAY evidence; that evidence does not enter the QIE compatibility catalogue as VERIFIED.
4. Adapt source/tests to the requested application. Add behavior-specific positive and negative tests; a working counter is not evidence that a different NFT, token, custody or permission model works. Libraries, licenses and exact dependencies require independent review; Hardhat is discovery only until replayed.

**Failures/recovery:** no compiler → acquire the exact release deliberately from its primary source, then replay. Compile failure → fix the first diagnostic before proceeding. A failed assertion → inspect the trace and expected state; do not suppress the test. Existing files → choose a new empty fixture directory or review a targeted patch. Drift in output → compare source/compiler/configuration and dependency versions before changing assertions.

**Success:** the exact local project compiles, all tests pass and expected ABI/bytecode artifacts exist. No deployment, wallet, explorer source verification, QIE execution compatibility or security audit is implied. Stop before operational claims without that independent evidence.

Primary command/configuration references: [Foundry CLI build options](https://foundry-rs.github.io/foundry/foundry_cli/opts/build/core/struct.BuildOpts.html), [Foundry artifact inspection](https://getfoundry.sh/forge/reference/forge-inspect/), [Solidity compiler documentation](https://docs.soliditylang.org/en/latest/using-the-compiler.html). Local executable help and recorded command results establish this pinned replay's syntax.
