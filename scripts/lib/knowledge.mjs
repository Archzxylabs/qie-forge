import path from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { readFile } from 'node:fs/promises';
import { readYaml } from './io.mjs';
import { loadValidators } from './schemas.mjs';
import { checkReleaseChronology, CLOCK_SKEW_TOLERANCE_MS } from './chronology.mjs';

const collections = {
  sources: ['sources', 'source', 'source_id'],
  claims: ['claims', 'claim', 'claim_id'],
  capabilities: ['capabilities', 'capability', 'capability_id'],
  addresses: ['addresses', 'address', null],
  validationRuns: ['validation-runs', 'validation-run', 'test_id'],
  domains: ['domains', 'domain', 'domain_id'],
  skills: ['skills', 'skill', 'skill_id'],
  integrations: ['integrations', 'integration', 'entity_id'],
  conflicts: ['conflicts', 'conflict', 'conflict_id'],
};

export async function loadKnowledge(root) {
  const entries = await Promise.all(Object.entries(collections).map(async ([key, [file]]) => [
    key, await readYaml(path.join(root, 'knowledge', `${file}.yaml`)),
  ]));
  return {
    ...Object.fromEntries(entries),
    policy: await readYaml(path.join(root, 'knowledge/policy.yaml')),
    release: JSON.parse(await readFile(path.join(root, 'release-context.json'), 'utf8')),
  };
}

function indexRecords(records, key, label) {
  const index = new Map();
  for (const record of records) {
    const id = key ? record[key] : `${record.chain_id}:${record.address.toLowerCase()}:${record.claimed_product}`;
    if (index.has(id)) throw new Error(`Duplicate ${label}: ${id}`);
    index.set(id, record);
  }
  return index;
}

function requireReferences(ids, index, label) {
  for (const id of ids) if (!index.has(id)) throw new Error(`Missing ${label}: ${id}`);
}

function checkValidity(record) {
  if (record.expires_at && (!record.checked_at || Date.parse(record.expires_at) <= Date.parse(record.checked_at))) {
    throw new Error('Evidence expiry must follow checked_at');
  }
}

function checkEvidence(record, indexes, networkIds, operation, version) {
  requireReferences(record.source_ids, indexes.sources, 'source');
  requireReferences(record.evidence_test_ids, indexes.validationRuns, 'validation test');
  checkValidity(record);
  if (['DOCUMENTED', 'UNSUPPORTED', 'DEPRECATED'].includes(record.status)) {
    if (!record.source_ids.some((id) => ['T0', 'T1', 'T2'].includes(indexes.sources.get(id).trust_tier))) {
      throw new Error('Documented/negative evidence needs a technical primary source, not marketing alone');
    }
  }
  if (record.status !== 'VERIFIED') return;
  if (!version || !networkIds.length) throw new Error('VERIFIED requires exact network and version scope');
  for (const network of networkIds) {
    const matching = record.evidence_test_ids.some((id) => {
      const test = indexes.validationRuns.get(id);
      return test.outcome === 'PASS' && test.scope.kind !== 'MOCK' && test.reviewer
        && test.network_id === network && test.scope.operation === operation && test.tool_version === version
        && (record.evidence_type !== 'CHAIN_OBSERVATION' || test.scope.kind === 'CHAIN_OBSERVATION')
        && Date.parse(test.checked_at) >= Date.parse(record.checked_at)
        && isDeepStrictEqual(test.expected, test.observed)
        && (!Object.hasOwn(record, 'claim_id') || isDeepStrictEqual(test.observed, record.value));
    });
    if (!matching) throw new Error('VERIFIED requires reviewed, non-mock, operation/network/version-matched PASS evidence');
  }
}

function checkAddresses(data, indexes) {
  const chainIds = new Map(data.claims.filter((c) => c.predicate === 'chain_id').map((c) => [c.network_id, c.value]));
  for (const address of data.addresses) {
    requireReferences(address.issuer_source_ids, indexes.sources, 'issuer source');
    requireReferences(address.abi_source_ids, indexes.sources, 'ABI source');
    checkValidity(address);
    if (address.code_observation) {
      const observation = address.code_observation;
      requireReferences([observation.evidence_test_id], indexes.validationRuns, 'address observation');
      const run = indexes.validationRuns.get(observation.evidence_test_id);
      if (chainIds.get(observation.network_id) !== address.chain_id || run.network_id !== observation.network_id) {
        throw new Error('Address observation chain mismatch');
      }
    }
    if (address.status === 'VERIFIED') {
      const run = indexes.validationRuns.get(address.code_observation?.evidence_test_id);
      if (!address.issuer_source_ids.length || !address.abi_source_ids.length || !address.checked_at
        || !address.expires_at || !address.code_observation?.code_present || run?.outcome !== 'PASS'
        || run.scope.kind !== 'CHAIN_OBSERVATION' || run.scope.operation !== 'eth_getCode' || !run.reviewer
        || !isDeepStrictEqual(run.expected, run.observed)
        || run.observed?.address?.toLowerCase() !== address.address.toLowerCase()
        || run.observed?.code_present !== true) {
        throw new Error('Address identity cannot be VERIFIED from bytecode alone');
      }
    }
  }
}

function requireExecutionBlocked(value, label) {
  if (value !== false) {
    throw new Error(`${label} execution_allowed must remain false until a tested promotion mechanism exists`);
  }
}

function checkIntegrations(data, indexes) {
  const integrationIds = new Set(data.integrations.map((entry) => entry.entity_id));
  const conflictIds = new Set(data.conflicts.map((entry) => entry.conflict_id));
  for (const conflict of data.conflicts) requireReferences(conflict.source_ids, indexes.sources, 'conflict source');
  for (const integration of data.integrations) {
    requireExecutionBlocked(integration.execution_allowed, `Integration ${integration.entity_id}`);
    requireReferences(integration.source_ids, indexes.sources, 'integration source');
    requireReferences(integration.conflict_ids, indexes.conflicts, 'integration conflict');
    requireReferences(integration.related_entity_ids, indexes.integrations, 'related integration');
    for (const iface of integration.interfaces) {
      requireExecutionBlocked(iface.execution_allowed, `Interface ${iface.interface_id}`);
      requireReferences(iface.source_ids, indexes.sources, 'interface source');
    }
    const interfaceIds = new Set(integration.interfaces.map((iface) => iface.interface_id));
    const operationIds = new Set();
    for (const operation of integration.operations) {
      requireExecutionBlocked(operation.execution_allowed, `Operation ${operation.operation_id}`);
      if (operationIds.has(operation.operation_id)) throw new Error(`Duplicate integration operation: ${operation.operation_id}`);
      operationIds.add(operation.operation_id);
      if (!interfaceIds.has(operation.interface_id)) throw new Error(`Missing integration interface: ${operation.interface_id}`);
      requireReferences(operation.source_ids, indexes.sources, 'operation source');
    }
    if (integration.status === 'DOCUMENTED' && !integration.source_ids.some((id) => ['T0', 'T1', 'T2'].includes(indexes.sources.get(id).trust_tier))) {
      throw new Error('Documented integration needs a technical primary source');
    }
    if (integration.status === 'CONFLICTED' && !integration.conflict_ids.length) throw new Error('Conflicted integration needs conflict records');
    if (integration.status === 'VERIFIED') throw new Error('Integration verification is not enabled without a dedicated runtime gate');
    if (!integrationIds.has(integration.entity_id)) throw new Error('Unreachable integration');
    if (integration.conflict_ids.some((id) => !conflictIds.has(id))) throw new Error('Missing integration conflict');
  }
}

// The release-cut chronology rule has exactly one implementation
// (scripts/lib/chronology.mjs). The knowledge validator calls it with an
// injected clock so frozen fixtures never depend on the wall clock, and the
// release path calls it with the real clock.
export async function validateKnowledge(data, schemaRoot, { now = Date.now(), clockSkewMs = CLOCK_SKEW_TOLERANCE_MS } = {}) {
  const validate = await loadValidators(schemaRoot);
  const indexes = {};
  for (const [name, [, schema, key]] of Object.entries(collections)) {
    if (!Array.isArray(data[name])) throw new Error(`${name} must be an array`);
    for (const record of data[name]) validate(schema, record, `${name}/${record[key] ?? 'record'}`);
    indexes[name] = indexRecords(data[name], key, name);
  }
  validate('policy', data.policy);
  validate('release', data.release);
  if (data.release.schema_version !== data.policy.schema_version) throw new Error('Release and policy schema versions differ');
  if (data.release.sources_checked_at !== null) throw new Error('sources_checked_at is derived; keep the release context field null');
  checkReleaseChronology(data, { now, toleranceMs: clockSkewMs });
  for (const claim of data.claims) checkEvidence(claim, indexes, [claim.network_id], claim.predicate, claim.version_scope);
  for (const cap of data.capabilities) checkEvidence(cap, indexes, cap.network_ids, cap.operation, cap.tool_version_range);
  checkAddresses(data, indexes);
  checkIntegrations(data, indexes);
  const expectedDomains = Array.from({ length: 15 }, (_, i) => `D${String(i + 1).padStart(2, '0')}`);
  requireReferences(expectedDomains, indexes.domains, 'domain');
  for (const domain of data.domains) {
    requireReferences(domain.source_ids, indexes.sources, 'domain source');
    requireReferences(domain.capability_ids, indexes.capabilities, 'domain capability');
    requireReferences(domain.validation_test_ids, indexes.validationRuns, 'domain test');
    if (domain.entry_skill) requireReferences([domain.entry_skill], indexes.skills, 'entry skill');
    if (domain.verification_status === 'VERIFIED' && !domain.validation_test_ids.length) {
      throw new Error('VERIFIED domain coverage needs scoped validation evidence');
    }
  }
  for (const skill of data.skills) {
    requireReferences(skill.claim_ids, indexes.claims, 'selected claim');
    requireReferences(skill.capability_ids, indexes.capabilities, 'selected capability');
    requireReferences(skill.domain_ids, indexes.domains, 'selected domain');
    requireReferences(skill.integration_ids, indexes.integrations, 'selected integration');
  }
  return indexes;
}
