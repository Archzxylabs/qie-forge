---
name: qie-wallets
license: MIT
description: Evaluate QIE EVM wallet capabilities, connect accounts deliberately, handle wrong-chain/account changes and prepare developer-controlled signing review. Use for choosing a wallet or connector, connection errors and signing boundaries. Does not supply native delegation commands, custody keys or claim a tested QIE wallet integration.
compatibility: Bundled wallet-read TypeScript is locally tested with mock EIP-1193 providers on Node 24.20.0. A real wallet/version/network must be evaluated separately before operational use.
---

# QIE wallet selection and connection

Own wallet/provider selection and permission boundaries. Frontend layout remains the application's responsibility.

1. Classify EVM versus native accounts and preserve the supplied Mainnet/Testnet target. Native signing/account formats are UNKNOWN here; consult official native sources instead of adding an EVM wallet.
2. Read [selected evidence](references/evidence.md). Match each candidate's primary source, exact version, target network and requested operation: connection, read, signing and broadcast are separate capabilities. No QIE wallet/connector has runtime evidence in this release.
3. For local frontend connection/read behavior, use [wallet read](recipes/wallet-read/recipe.md). Select the provider explicitly; a global object is not proof of provider identity. Connect only on a developer action and invalidate state on account/chain changes.
4. For QUSDC or Lending writes, show the token role, raw integer amount, observed decimals, spender, allowance delta and selected network before handing control to the signer. SDK discovery is not address authorization.
5. For a requested write, prepare the review below, then stop at the developer-controlled signer. There is no tested signer command or automatic broadcast recipe in this release.

## Signing review

Show the network and observed chain ID, verified target/creation intent, calldata/function/arguments, native value, signer account, permission or allowance change, fee estimate and maximum spend in explicit units, evidence sources and unresolved checks. Approval must cover this concrete action; a changed network/target/amount invalidates that approval. Obtain missing fee semantics and estimates instead of inventing a QIE gas multiplier.

Keep keys, seed phrases, session secrets and spending authority outside the agent and frontend configuration. Do not ask the developer to paste them, log them, or place them in a PUBLIC environment variable. Host permissions and the external wallet enforce signing; instruction text cannot do so.

If rejected/disconnected, clear local account/read state and wait for a deliberate retry. If chain identity mismatches, stop before reading or signing. Missing support stays UNKNOWN; an unsupported method does not justify claiming a different wallet works. Check [release information](references/release-info.md) before combining procedures from different snapshots.

<!-- GENERATED — DO NOT EDIT. Change canonical authoring or knowledge. -->
