// Example-only configuration. The canonical contract source stays in
// recipes/build-test/assets; this module only reads the packaged network snapshot
// and exposes clearly labelled mock fixtures.
import snapshot from '../../../skills/qie-wallets/data/network-claims.json';

export type NetworkId = 'qie-mainnet' | 'qie-testnet';

export const NETWORKS: ReadonlyArray<{ id: NetworkId; label: string }> = [
  { id: 'qie-testnet', label: 'QIE testnet' },
  { id: 'qie-mainnet', label: 'QIE mainnet' },
];

export const networkSnapshot = snapshot;

export function isNetworkId(value: string): value is NetworkId {
  return NETWORKS.some((network) => network.id === value);
}

// The chain binding is read from the packaged canonical snapshot, never guessed
// in the example. A missing or non-numeric claim is a hard configuration error.
export function chainIdFor(network: NetworkId): bigint {
  const claim = snapshot.claims.find(
    (record) => record.network_id === network && record.predicate === 'chain_id',
  );
  if (!claim || typeof claim.value !== 'number' || !Number.isSafeInteger(claim.value) || claim.value <= 0) {
    throw new Error('The packaged network snapshot is missing the selected chain ID.');
  }
  return BigInt(claim.value);
}

// Synthetic fixtures. They are not deployed contracts and are never presented as
// QIE evidence; the mock banner and the contract label say so in the UI.
export const MOCK_ACCOUNT = `0x${'11'.repeat(20)}`;
export const MOCK_CONTRACT_ADDRESS = `0x${'10'.repeat(20)}`;
export const MOCK_COUNTER_VALUE = 7n;

export const ADDRESS_PATTERN = /^0x[0-9a-fA-F]{40}$/;

export function isValidContractAddress(value: string): boolean {
  return ADDRESS_PATTERN.test(value) && !/^0x0{40}$/.test(value);
}
