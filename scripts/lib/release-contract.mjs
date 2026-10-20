// Trusted local release contract for the published QIE Forge suite.
//
// The installed verifier must not infer "the nine skills" from a directory
// count. This list is the one canonical inventory used by validation,
// installation tests and post-install verification. It is intentionally
// duplicated from knowledge/skills.yaml and cross-checked by validate-skills.
export const CANONICAL_SKILLS = Object.freeze([
  'qie',
  'qie-debug',
  'qie-deployment',
  'qie-ecosystem',
  'qie-frontend',
  'qie-networks',
  'qie-smart-contracts',
  'qie-transactions',
  'qie-wallets',
]);

export const CANONICAL_SKILL_SET = new Set(CANONICAL_SKILLS);

// Only schema versions this verifier understands may be reported coherent.
// B08/B09 publish schema 1.4.0. A future schema bump must extend this list
// deliberately after the verifier has been taught the new contract.
export const SUPPORTED_SCHEMA_VERSIONS = Object.freeze(['1.4.0']);

export const SNAPSHOT_PATHS = Object.freeze([
  'data/network-claims.json',
  'data/qie-a-z.json',
  'data/ecosystem-catalogue.json',
]);
