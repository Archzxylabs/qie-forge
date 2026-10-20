import { renderCanonicalFacts } from './canonical-facts.mjs';

// Canonical fact placeholders for authored skill content.
//
// Authored entry files and reference files are copied into the published
// bundle, so a hand-written endpoint, chain identifier or status label in
// them can silently drift away from the canonical knowledge records. Authored
// content may therefore express canonical network facts and canonical
// statuses only through placeholders, which are resolved from the skill's own
// canonical snapshot during the build:
//
//   {{claim:<network_id>:<predicate>}}  -> the canonical claim value
//   {{hex:<network_id>:<predicate>}}    -> the canonical claim value as 0x-hex
//   {{stored:<capability_id>}}          -> the capability's stored canonical status
//   {{effective:<capability_id>}}       -> the capability's effective status
//   {{capability:<capability_id>[:<field>]}} -> a canonical capability field
//   {{source:<source_id>[:<field>]}}    -> a canonical source field
//
// This is the complete grammar; the implementation in canonical-facts.mjs
// rejects any other kind rather than ignoring it.
//
// The effective status is the shared non-promoting projection evaluated at the
// frozen release-build clock, exactly as the generated catalogue and
// compatibility matrix use it, so an authored page can never disagree with a
// generated page about the same capability.
//
// An unknown, malformed or unresolvable placeholder fails the build. A
// placeholder is never published unresolved.
//
// Fact resolution itself lives in canonical-facts.mjs, so a placeholder and a
// generated projection can never use two different grammars. This module only
// narrows the resolution scope to the facts selected into the bundle.

export function resolvePlaceholders(text, { snapshot, builtAt, label = 'authored content' }) {
  // A placeholder may only resolve to a fact selected into this bundle, so the
  // resolution scope is the skill's own canonical snapshot rather than the
  // whole knowledge base.
  const view = {
    claims: snapshot.claims,
    capabilities: snapshot.capabilities,
    sources: snapshot.sources,
  };
  return renderCanonicalFacts(text, view, { now: builtAt, label });
}
