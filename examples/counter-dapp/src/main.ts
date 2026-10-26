// Reference app wiring. The guarded session logic is imported from the canonical
// recipe asset; this file owns only rendering and explicit user actions.
import './style.css';
import { COUNTER_VALUE_SELECTOR } from './generated/counter';
import {
  MOCK_CONTRACT_ADDRESS,
  NETWORKS,
  chainIdFor,
  isNetworkId,
  isValidContractAddress,
  networkSnapshot,
  type NetworkId,
} from './config';
import { describeError } from './errors';
import { getInjectedProvider } from './injected-provider';
import { MockProvider } from './mock-provider';
import { ReadError, createReadSession } from '../../../recipes/wallet-read/assets/wallet-read';

type Session = ReturnType<typeof createReadSession>;
type SessionState = ReturnType<Session['snapshot']>;
type ExecutionMode = 'mock' | 'injected';

const VALUE_CALLDATA = `0x${COUNTER_VALUE_SELECTOR}`;

const element = <T extends HTMLElement>(id: string): T => {
  const found = document.getElementById(id);
  if (!found) throw new Error(`Missing element #${id}`);
  return found as T;
};

const modeSelect = element<HTMLSelectElement>('mode');
const networkSelect = element<HTMLSelectElement>('network');
const addressInput = element<HTMLInputElement>('address');
const addressHint = element<HTMLParagraphElement>('address-hint');
const walletHint = element<HTMLParagraphElement>('wallet-hint');
const walletInstall = element<HTMLAnchorElement>('wallet-install');
const connectButton = element<HTMLButtonElement>('connect');
const readButton = element<HTMLButtonElement>('read');
const retryButton = element<HTMLButtonElement>('retry');
const banner = element<HTMLParagraphElement>('simulation-banner');
const modeLabel = element<HTMLElement>('mode-label');
const networkLabel = element<HTMLElement>('network-label');
const phaseOutput = element<HTMLElement>('phase');
const accountOutput = element<HTMLElement>('account');
const contractOutput = element<HTMLElement>('contract');
const readStatus = element<HTMLElement>('read-status');
const valueOutput = element<HTMLElement>('value');
const errorBox = element<HTMLDivElement>('error');
const errorTitle = element<HTMLParagraphElement>('error-title');
const errorCode = element<HTMLParagraphElement>('error-code');
const errorRecovery = element<HTMLParagraphElement>('error-recovery');

class UiFailure extends Error {
  readonly code: string;
  constructor(code: string) {
    super(code);
    this.code = code;
  }
}

let session: Session | null = null;
let sessionKey = '';
let generation = 0;
let state: SessionState = { phase: 'disconnected', account: null, value: null, error: null };
let localErrorCode: string | null = null;

const selectedMode = (): ExecutionMode => (modeSelect.value === 'injected' ? 'injected' : 'mock');
const selectedNetwork = (): NetworkId => (isNetworkId(networkSelect.value) ? networkSelect.value : 'qie-testnet');

function disposeSession(): void {
  generation += 1;
  session?.dispose();
  session = null;
  sessionKey = '';
}

function resetState(): void {
  state = { phase: 'disconnected', account: null, value: null, error: null };
  localErrorCode = null;
}

function currentAddress(): string {
  return selectedMode() === 'mock' ? MOCK_CONTRACT_ADDRESS : addressInput.value.trim();
}

function ensureSession(): Session {
  const key = `${selectedMode()}:${selectedNetwork()}`;
  if (session && sessionKey === key) return session;
  disposeSession();
  const provider = selectedMode() === 'mock'
    ? new MockProvider(chainIdFor(selectedNetwork()))
    : getInjectedProvider();
  if (!provider) throw new UiFailure('PROVIDER_MISSING');
  try {
    session = createReadSession(provider, networkSnapshot, selectedNetwork(), {
      onState(next) {
        state = next;
        localErrorCode = null;
        render();
      },
    });
  } catch (error) {
    throw new UiFailure(errorCodeOf(error));
  }
  sessionKey = key;
  return session;
}

function errorCodeOf(error: unknown): string {
  if (error instanceof ReadError) return error.code;
  if (error instanceof UiFailure) return error.code;
  return 'UNKNOWN';
}

async function connect(): Promise<void> {
  localErrorCode = null;
  let active: Session;
  try {
    active = ensureSession();
  } catch (error) {
    localErrorCode = errorCodeOf(error);
    render();
    return;
  }
  // Mode/network changes dispose the session and bump the generation. Any late
  // connection outcome belongs to the discarded session and must not surface.
  const attempt = generation;
  try {
    await active.connect();
  } catch (error) {
    const code = errorCodeOf(error);
    if (attempt !== generation || session !== active || code === 'SESSION_CHANGED') return;
    if (!active.snapshot().error) localErrorCode = code;
    render();
  }
}

async function read(): Promise<void> {
  const active = session;
  if (!active || state.phase !== 'ready') return;
  const address = currentAddress();
  if (!isValidContractAddress(address)) {
    // This is an input problem, not a session failure. Keep the ready session
    // intact and send recovery to the address field; Retry is deliberately not
    // offered because calling connect() on a ready session would replace this
    // understandable error with SESSION_NOT_READY.
    localErrorCode = 'INVALID_ADDRESS';
    render();
    addressInput.focus();
    return;
  }
  localErrorCode = null;
  const attempt = generation;
  try {
    await active.readUint256(address, VALUE_CALLDATA);
  } catch (error) {
    if (attempt !== generation || session !== active) return; // Invalidated; onState already cleared the view.
    const code = errorCodeOf(error);
    if (code === 'SESSION_CHANGED') return;
    if (!state.error) localErrorCode = code;
    render();
  }
}

function phaseText(): string {
  switch (state.phase) {
    case 'connecting': return 'Connecting…';
    case 'ready': return 'Connected';
    case 'reading': return 'Reading…';
    case 'error': return 'Error — session not ready';
    case 'disposed': return 'Disposed';
    default: return 'Disconnected';
  }
}

function readStatusText(): string {
  if (state.phase === 'reading') return 'Reading…';
  if (state.error) return `Failed: ${state.error}`;
  if (state.value !== null) return 'Success: eth_call returned one uint256';
  return 'No read yet';
}

function render(): void {
  const mode = selectedMode();
  const network = selectedNetwork();
  const mock = mode === 'mock';
  const code = state.error ?? localErrorCode;

  banner.hidden = !mock;
  modeLabel.textContent = mock ? 'Mock demonstration (simulated)' : 'Injected wallet (real provider)';
  networkLabel.textContent = `${network} (chain ID ${chainIdFor(network).toString()})`;
  phaseOutput.textContent = phaseText();
  accountOutput.textContent = state.account ?? 'Not connected';
  contractOutput.textContent = mock
    ? `${MOCK_CONTRACT_ADDRESS} (simulated fixture — not deployed)`
    : (addressInput.value.trim() || 'Not configured');
  readStatus.textContent = readStatusText();
  valueOutput.textContent = state.value !== null ? `${state.value.toString()} (uint256)` : '—';

  addressInput.disabled = mock;
  walletHint.hidden = mock;
  walletInstall.hidden = mock || code !== 'PROVIDER_MISSING';
  addressHint.textContent = mock
    ? 'Mock mode uses a labelled synthetic fixture address; no contract is deployed and no RPC is contacted.'
    : 'Paste the deployed Counter address for the selected QIE network. The session fails closed on a wrong chain.';
  readButton.disabled = state.phase !== 'ready';
  connectButton.disabled = ['connecting', 'ready', 'reading'].includes(state.phase);
  // Only a session-level failure is recoverable by connecting again. Local
  // validation failures keep the current session and direct the user to the
  // input that caused them.
  retryButton.hidden = state.error === null;
  addressInput.setAttribute('aria-invalid', String(code === 'INVALID_ADDRESS'));

  if (code !== null) {
    const copy = describeError(code, chainIdFor(network));
    errorTitle.textContent = copy.title;
    errorCode.textContent = `Code: ${code}`;
    errorRecovery.textContent = copy.recovery;
    errorBox.hidden = false;
  } else {
    errorBox.hidden = true;
  }
}

function renderNetworkOptions(): void {
  // Chain IDs are rendered from the packaged snapshot, not duplicated in HTML.
  for (const option of networkSelect.options) {
    if (!isNetworkId(option.value)) continue;
    const network = NETWORKS.find((candidate) => candidate.id === option.value);
    if (network) option.textContent = `${network.label} (chain ID ${chainIdFor(network.id).toString()})`;
  }
}

modeSelect.addEventListener('change', () => {
  disposeSession();
  resetState();
  render();
});
networkSelect.addEventListener('change', () => {
  disposeSession();
  resetState();
  render();
});
addressInput.addEventListener('input', () => {
  // A different contract target invalidates any displayed value and any read
  // already in flight, and clears an obsolete address-validation error. The
  // user reconnects deliberately before reading again.
  disposeSession();
  resetState();
  render();
});
connectButton.addEventListener('click', () => { void connect(); });
retryButton.addEventListener('click', () => { void connect(); });
readButton.addEventListener('click', () => { void read(); });

addressInput.value = '';
networkSelect.value = NETWORKS[0]?.id ?? 'qie-testnet';
renderNetworkOptions();
modeSelect.value = 'mock';
render();
