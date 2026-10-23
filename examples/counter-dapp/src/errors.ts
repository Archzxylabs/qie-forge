// Error copy for the reference app. Every controller failure gets an explanation
// and one deliberate recovery action; no failure silently switches execution mode.
export type FailureCopy = { title: string; recovery: string };

export function describeError(code: string, expectedChainId: bigint): FailureCopy {
  switch (code) {
    case 'USER_REJECTED':
      return {
        title: 'The wallet rejected the connection request.',
        recovery: 'Approve the connection in the wallet, then use Retry connection. Nothing was requested automatically.',
      };
    case 'WRONG_CHAIN':
      return {
        title: 'The wallet is on a different chain.',
        recovery: `Switch the wallet to the selected QIE network (chain ID ${expectedChainId}) and use Retry connection. No other network or endpoint is tried.`,
      };
    case 'RPC_UNAVAILABLE':
      return {
        title: 'The provider did not answer.',
        recovery: 'Check that the wallet or provider is running and responsive, then use Retry connection.',
      };
    case 'RPC_MALFORMED':
      return {
        title: 'The provider returned a malformed response.',
        recovery: 'The previous value has been discarded. Retry the connection and read again; do not trust an unvalidated response.',
      };
    case 'DEPENDENCY_MISMATCH':
      return {
        title: 'The session configuration is not usable.',
        recovery: 'Check the selected network and the configured contract address, reinstall a known QIE Forge release if the packaged snapshot is suspect, then retry.',
      };
    case 'SOURCE_STALE':
      return {
        title: 'The packaged network record is not current.',
        recovery: 'Reads are blocked until a reviewed snapshot is reinstalled from a known release.',
      };
    case 'SESSION_CHANGED':
    case 'SESSION_NOT_READY':
      return {
        title: 'The session changed before the operation completed.',
        recovery: 'Any late result was discarded. Connect again deliberately before reading.',
      };
    case 'PROVIDER_MISSING':
      return {
        title: 'No injected EIP-1193 provider was found.',
        recovery: 'Enable an EIP-1193 wallet in this browser profile, or select the labelled mock demonstration. Real mode never falls back to mock automatically.',
      };
    case 'INVALID_ADDRESS':
      return {
        title: 'The contract address is not valid.',
        recovery: 'Correct the address in the field above: 0x followed by 40 hexadecimal characters for the selected QIE network. Changing the target disconnects the current session, so connect and read again deliberately. Nothing reconnects automatically.',
      };
    default:
      return {
        title: 'The operation failed.',
        recovery: 'Inspect the browser console and the provider, then use Retry connection. The previous value has been cleared.',
      };
  }
}
