<!-- GENERATED — DO NOT EDIT. Change canonical authoring or knowledge. -->

# Investigate a QIE contract address

**Scope:** read-only provenance and compatibility review. This recipe never signs, broadcasts, approves, transfers or promotes an address to executable configuration.

## Identity gate

For a claimed product, address and network, record:

1. **Published candidate:** exact address, claimed role, claimed network, source URL, review time and pinned repository commit when applicable.
2. **Network identity:** selected QIE network and one fresh `eth_chainId` observation. Never substitute another network.
3. **Code presence:** `eth_getCode` at an exact block or latest-block observation, with code hash when available. Empty code rejects contract-specific integration; nonempty code proves only code presence.
4. **ABI correspondence:** exact ABI source, selectors, proxy/implementation review and bounded read-only calls. A successful call is not enough by itself.
5. **Issuer provenance:** reviewed official issuer channel linking the address and role to the claimed product.
6. **Conflicts:** compare SDK, docs, explorer, old/new deployment and proxy candidates. Preserve disagreement as CONFLICTED.
7. **Authorization:** only a reviewed deployment record may enable a write. Candidate, explorer and bytecode observations never authorize a transfer.

## QUSDC and Lending application

The pinned Lending SDK publishes a QUSDC market underlying candidate and other market addresses. The QUSDC SDK publishes no deployment address and requires separate vault/WUSDC inputs. Therefore the candidate table must not label the Lending address as the QUSDC token, WUSDC token or vault.

## Report format

Return `PASS`, `FAIL`, `NOT_RUN`, `BLOCKED` or `UNSUPPORTED` per gate; include the exact source and observation block. A blocked address still supports local ABI mocks and source review.
