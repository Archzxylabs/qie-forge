# QIE ecosystem source inventory

**Research cut:** 2026-10-24T20:00:51Z  
**Release branch:** `feat/qie-ecosystem-intelligence`  
**Evidence rule:** this inventory records research provenance. Canonical developer facts are stored in `knowledge/sources.yaml`, `knowledge/integrations.yaml`, `knowledge/conflicts.yaml`, and the address candidate records.

## Source review

| ID | Source / revision | Scope supported | Result and remaining limit |
|---|---|---|---|
| S03 | QIE network access documentation | Published EVM chain IDs, RPC and explorer configuration | Supports DOCUMENTED configuration; no liveness or method-limit proof. |
| S10 | QIE Wallet integration guide | EIP-1193, EIP-6963, `window.qie`, chain switching and event behavior | Supports DOCUMENTED interface guidance; extension runtime not tested here. |
| S12 | QIE Oracle asset mapping | Product discovery and published feed candidates | Supports discovery and address provenance only; no identity observation. |
| S13–S16 | QIE native guides and Cosmos registry | Native chain, `aqie`, staking/governance command shapes and registry metadata | Supports DOCUMENTED native navigation; no live native execution. |
| S18, S31 | QIE product directory and `https://swap.dex.qie.digital/` | DEX product discovery and web surface | Web UI is a CLAIMED lead; router/factory ABI and address remain UNKNOWN. |
| S32 | `https://bridge.qie.digital/` | Bridge product and displayed route discovery | Web UI is a CLAIMED lead; contracts, relayer, fee and recovery model remain UNKNOWN. |
| S33–S34 | QIE ID portal and QIE product catalogue | `.qie`, QIE ID and QIE Pass discovery | Product names are CLAIMED; resolver, credential and authentication interfaces remain UNKNOWN. |
| S22 | QUSDC introduction | Product and receipt-token model | Documents 1:1 receipt language; page uses generic USDC terminology. |
| S23 | QUSDC “How it works” | WUSDC backing flow, mint and redemption concepts | Documents Ethereum USDC → QIE WUSDC → QUSDC and reverse flow; bridge claims remain issuer documentation. |
| S24–S26 | QUSDC transparency, decentralization and FAQ | Reserve, control and risk claims | Useful economic and dependency disclosures; no independent reserve, audit or deployment proof. |
| S27 | `qieadmin/qusdc-sdk` tree at `0877597f8bd51f7c21bb04e70009d3e9cab86944` | Repository/package provenance | ESM, package `1.0.0`, ethers v6, GitHub install; no production address. |
| S28 | `qusdc-sdk/index.js` at the same commit | Exact SDK and ABI behavior | `depositAndMint`, `burnAndWithdraw`, allowance, decimals, exact approval, estimateGas and wait behavior inspected. |
| S29 | `qieadmin/qie-lend-sdk` tree at `21d2ef2d5c4e9ac82f7e5d72e628341bd0b15262` | Lending SDK source, package and ABI provenance | CommonJS, package `1.0.0`, ethers v6; operations and source limitations inspected. |
| S30 | `qie-lend-sdk/config.js` at the same commit | Market and Comptroller candidate roles | WBNB, WETH, QUSDC and WQIE candidate configuration retained; no issuer authentication. |
| S35–S38 | QIE Oracle query, Solidity integration, edge-case and aggregation pages | AggregatorV3-style reads, decimals, freshness and design claims | Supports local/read-only ABI pattern; feed identity, scale and update behavior remain deployment questions. |

## Claim suitability

- **Product discovery:** QIE product pages, QUSDC docs, DEX/Bridge portals and GitHub repository roots are suitable.
- **Technical interface:** pinned SDK implementation files, QIE Wallet guide, QIE Oracle integration pages and the native registry are suitable.
- **Economic claims:** QUSDC documentation and Oracle documentation are issuer claims only; they do not establish independent safety or value guarantees.
- **Address publication:** S12, S16 and S30 can publish discovery candidates, never executable configuration in this release.
- **ABI provenance:** S28, S29, S35 and S36 support source-level ABI fragments; deployed bytecode correspondence is not established.
- **Read-only checks:** S03 and S15 identify network/registry settings; the optional local probe records observations but does not promote status.
- **Mainnet execution authorization:** no reviewed source satisfies the full issuer, ABI, chain-observation, conflict and human-approval gate.

## Contradictions and issuer questions

1. QUSDC pages use generic “USDC” wording while the detailed flow and SDK use WUSDC. Confirm the exact current production token/vault roles and unit scale.
2. The lending SDK labels `0x3F43…` as the QUSDC underlying candidate, but the QUSDC SDK requires separate WUSDC and vault inputs and publishes no addresses. Confirm the candidate’s role.
3. QIE’s published RPC list contains inconsistent RPC-number labels. Confirm provider priority and current availability.
4. Oracle mapping pages publish feed addresses and AggregatorV3 examples without a reviewed deployment identity. Confirm current addresses, proxy relationships, decimals and update policy.

## Research outcome

**PASS for source collection; BLOCKED for production execution.** The release now contains pinned source facts and usable local/read-only guidance. No candidate address, SDK README, explorer page, bytecode observation or local test is promoted to issuer-authenticated production support.
