# QIE Wallet discovery — 2026-10-26

The Counter reference app now prefers the QIE Wallet provider documented in the [official integration guide](https://docs.qie.digital/qie-wallet-integration-guide-for-websites). This fixes the case where another extension owns `window.ethereum` while QIE Wallet is also available.

## Wallet identity and implementation

The user-supplied [Chrome Web Store listing](https://chromewebstore.google.com/detail/oljchdcgmibnjbbopolafbjncfhdacjb) resolved successfully to QIE Wallet's named listing. Extension ID `oljchdcgmibnjbbopolafbjncfhdacjb` matches the existing source S19. Listing identity does not establish which extension version is installed in a developer's browser.

Discovery follows the official guide's order:

1. A usable EIP-6963 announcement declaring `rdns: me.qiewallet`.
2. A usable `window.qie` provider.
3. The legacy `window.ethereum` provider.

Candidates must expose the `request`, `on` and `removeListener` methods used by the canonical read controller. Malformed and unrelated announcements are ignored. The announcement listener remains active for the page lifetime; Connect requests re-announcement to recover an event emitted before the app loaded. Announcements do not request accounts, create a session or replace an active session. Discovery metadata is a hint, not proof of authenticity or operation support; the chain/account guards still apply.

The missing-provider error links to the supplied listing. Injected mode explains the QIE Wallet Testnet setting, while mock mode keeps its existing labelled, explicit behavior. Connect can display a public account before a contract address exists; an address is required for a read.

## Verification

Three new browser cases reproduced the original bug before the source change: an announced QIE provider, a `window.qie` provider and a provider discovered on Connect all lost to a competing `window.ethereum` provider on the wrong chain.

After the fix, **22/22 deterministic Chromium checks passed**, including all 16 previous cases and six additional cases:

- QIE's announced provider is selected when another wallet owns the legacy global.
- `window.qie` takes priority over a competing legacy provider.
- Explicit Connect triggers re-announcement after a missed initial event.
- Malformed/unrelated announcements preserve a usable legacy fallback.
- A missing provider shows the supplied QIE Wallet installation link.
- `accountsChanged([])` clears the account, read value and ready state without requiring a `disconnect` event.

TypeScript strict checking passed. Tests use browser fixtures and do not install an extension or contact QIE. The captured Counter creation experiment and its gas quote remain separate historical evidence.

## Deployment review boundary

The active [Counter review](../deployment/counter-testnet-review.json) records QIE Wallet as the preferred provider using the supplied extension ID. Its actual account and installed version remain unobserved, and its readiness remains `BLOCKED`. The earlier preparation snapshot and quote are retained unchanged in their capture directory.

Actual extension connection, account ownership, signing, deployment and explorer confirmation still require a user-controlled wallet session and separate evidence. This change does not promote canonical capability statuses or change generated skill payloads.
