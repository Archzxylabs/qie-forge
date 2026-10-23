import { expect, test, type Page } from '@playwright/test';

// Deterministic injected-wallet fixture. These tests prove the rendered app's
// guard behaviour against a controlled provider; they do not establish
// compatibility with any real wallet or QIE RPC endpoint.
type WalletFixture = {
  calls: string[];
  chain: string;
  accounts: string[];
  rejectNextAccounts: boolean;
  delayAccounts: boolean;
  pendingAccounts: (() => void) | null;
  callResult: string;
  delayCall: boolean;
  pendingCall: (() => void) | null;
  emit(event: string): void;
};

declare global {
  interface Window {
    __wallet?: WalletFixture;
    ethereum?: unknown;
  }
}

const ACCOUNT = `0x${'22'.repeat(20)}`;
const CONTRACT = `0x${'33'.repeat(20)}`;
const VALUE_42 = `0x${(42n).toString(16).padStart(64, '0')}`;

async function installWallet(page: Page): Promise<void> {
  await page.addInitScript(({ account, value }) => {
    const listeners = new Map<string, Set<(...args: unknown[]) => void>>();
    const wallet = {
      calls: [] as string[],
      chain: '0x7bf',
      accounts: [account],
      rejectNextAccounts: false,
      delayAccounts: false,
      pendingAccounts: null as (() => void) | null,
      callResult: value,
      delayCall: false,
      pendingCall: null as (() => void) | null,
      async request({ method }: { method: string }): Promise<unknown> {
        wallet.calls.push(method);
        if (method === 'eth_chainId') return wallet.chain;
        if (method === 'eth_requestAccounts') {
          if (wallet.delayAccounts) {
            return await new Promise((resolve) => {
              wallet.pendingAccounts = () => resolve(wallet.accounts);
            });
          }
          if (wallet.rejectNextAccounts) {
            wallet.rejectNextAccounts = false;
            throw Object.assign(new Error('User rejected the request'), { code: 4001 });
          }
          return wallet.accounts;
        }
        if (method === 'eth_call') {
          if (wallet.delayCall) {
            return await new Promise((resolve) => {
              wallet.pendingCall = () => resolve(wallet.callResult);
            });
          }
          return wallet.callResult;
        }
        throw Object.assign(new Error(`Unsupported method ${method}`), { code: 4200 });
      },
      on(event: string, listener: (...args: unknown[]) => void): void {
        const set = listeners.get(event) ?? new Set<(...args: unknown[]) => void>();
        set.add(listener);
        listeners.set(event, set);
      },
      removeListener(event: string, listener: (...args: unknown[]) => void): void {
        listeners.get(event)?.delete(listener);
      },
      emit(event: string): void {
        for (const listener of listeners.get(event) ?? []) listener();
      },
    };
    window.__wallet = wallet;
    window.ethereum = wallet;
  }, { account: ACCOUNT, value: VALUE_42 });
}

async function chooseInjected(page: Page): Promise<void> {
  await page.selectOption('#mode', 'injected');
  await page.fill('#address', CONTRACT);
}

async function connect(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Connect' }).click();
}

async function expectConnected(page: Page): Promise<void> {
  await expect(page.locator('#phase')).toHaveText('Connected');
  await expect(page.locator('#account')).toHaveText(ACCOUNT);
}

test.beforeEach(async ({ page }) => {
  await installWallet(page);
  await page.goto('/');
});

test('starts disconnected and does not request accounts on load', async ({ page }) => {
  await expect(page.locator('#phase')).toHaveText('Disconnected');
  await expect(page.locator('#account')).toHaveText('Not connected');
  await expect(page.locator('#value')).toHaveText('—');
  await expect(page.locator('#read')).toBeDisabled();
  await expect(page.locator('#connect')).toBeEnabled();

  await chooseInjected(page);
  await page.waitForTimeout(250);
  const calls = await page.evaluate(() => window.__wallet?.calls ?? []);
  expect(calls).toEqual([]);
});

test('connects only after an explicit user action', async ({ page }) => {
  await chooseInjected(page);
  await expect(page.locator('#phase')).toHaveText('Disconnected');
  await connect(page);
  await expectConnected(page);
  const calls = await page.evaluate(() => window.__wallet?.calls ?? []);
  expect(calls).toContain('eth_requestAccounts');
  expect(calls[0]).toBe('eth_chainId');
});

test('rejects a wrong-chain wallet, clears state and offers a deliberate retry', async ({ page }) => {
  await page.evaluate(() => { if (window.__wallet) window.__wallet.chain = '0x1'; });
  await chooseInjected(page);
  await connect(page);
  await expect(page.locator('#error')).toBeVisible();
  await expect(page.locator('#error-code')).toHaveText('Code: WRONG_CHAIN');
  await expect(page.locator('#account')).toHaveText('Not connected');
  await expect(page.locator('#value')).toHaveText('—');
  await expect(page.locator('#retry')).toBeVisible();
  const calls = await page.evaluate(() => window.__wallet?.calls ?? []);
  expect(calls).toEqual(['eth_chainId']);

  // Recovery stays on the selected network: fix the fixture chain, retry.
  await page.evaluate(() => { if (window.__wallet) window.__wallet.chain = '0x7bf'; });
  await page.getByRole('button', { name: 'Retry connection' }).click();
  await expectConnected(page);
});

test('a rejected connection is recoverable through a deliberate retry', async ({ page }) => {
  await page.evaluate(() => { if (window.__wallet) window.__wallet.rejectNextAccounts = true; });
  await chooseInjected(page);
  await connect(page);
  await expect(page.locator('#error-code')).toHaveText('Code: USER_REJECTED');
  await expect(page.locator('#phase')).toHaveText('Error — session not ready');
  await expect(page.locator('#retry')).toBeVisible();
  await page.getByRole('button', { name: 'Retry connection' }).click();
  await expectConnected(page);
});

test('a missing contract address produces input feedback without offering a session retry', async ({ page }) => {
  await page.selectOption('#mode', 'injected');
  await expect(page.locator('#address')).toHaveValue('');
  await connect(page);
  await expectConnected(page);
  await page.getByRole('button', { name: 'Read counter value' }).click();

  await expect(page.locator('#error-code')).toHaveText('Code: INVALID_ADDRESS');
  await expect(page.locator('#error-title')).toContainText('contract address is not valid');
  await expect(page.locator('#error-recovery')).toContainText('Correct the address');
  await expect(page.locator('#retry')).toBeHidden();
  await expect(page.locator('#phase')).toHaveText('Connected');
  await expect(page.locator('#read')).toBeEnabled();
  await expect(page.locator('#address')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#error-code')).not.toHaveText('Code: SESSION_NOT_READY');
});

test('correcting an invalid address clears the error and allows a deliberate connect and read', async ({ page }) => {
  await page.selectOption('#mode', 'injected');
  await page.fill('#address', '0x1234');
  await connect(page);
  await expectConnected(page);
  await page.getByRole('button', { name: 'Read counter value' }).click();
  await expect(page.locator('#error-code')).toHaveText('Code: INVALID_ADDRESS');
  await expect(page.locator('#retry')).toBeHidden();
  expect((await page.evaluate(() => window.__wallet?.calls ?? [])).filter((call) => call === 'eth_requestAccounts')).toHaveLength(1);

  await page.fill('#address', CONTRACT);
  await expect(page.locator('#phase')).toHaveText('Disconnected');
  await expect(page.locator('#error')).toBeHidden();
  await expect(page.locator('#value')).toHaveText('—');
  await expect(page.locator('#address')).toHaveAttribute('aria-invalid', 'false');
  await expect(page.locator('#retry')).toBeHidden();

  await connect(page);
  await page.getByRole('button', { name: 'Read counter value' }).click();
  await expect(page.locator('#value')).toHaveText('42 (uint256)');
  await expect(page.locator('#error')).toBeHidden();
});

test('a failed read is recoverable through a deliberate retry and reread', async ({ page }) => {
  await page.evaluate(() => { if (window.__wallet) window.__wallet.callResult = '0x'; });
  await chooseInjected(page);
  await connect(page);
  await page.getByRole('button', { name: 'Read counter value' }).click();
  await expect(page.locator('#error-code')).toHaveText('Code: RPC_MALFORMED');
  await expect(page.locator('#value')).toHaveText('—');
  await expect(page.locator('#retry')).toBeVisible();

  await page.evaluate(() => { if (window.__wallet) window.__wallet.callResult = `0x${(42n).toString(16).padStart(64, '0')}`; });
  await page.getByRole('button', { name: 'Retry connection' }).click();
  await expectConnected(page);
  await page.getByRole('button', { name: 'Read counter value' }).click();
  await expect(page.locator('#value')).toHaveText('42 (uint256)');
  await expect(page.locator('#error')).toBeHidden();
});

test('reads the Counter value after an explicit connection', async ({ page }) => {
  await chooseInjected(page);
  await connect(page);
  await expect(page.locator('#read')).toBeEnabled();
  await page.getByRole('button', { name: 'Read counter value' }).click();
  await expect(page.locator('#value')).toHaveText('42 (uint256)');
  await expect(page.locator('#read-status')).toHaveText('Success: eth_call returned one uint256');
  const calls = await page.evaluate(() => window.__wallet?.calls ?? []);
  expect(calls.filter((call) => call === 'eth_call')).toHaveLength(1);
});

for (const [event, label] of [
  ['accountsChanged', 'account change'],
  ['chainChanged', 'chain change'],
  ['disconnect', 'disconnect'],
] as const) {
  test(`${label} invalidates the session and clears the stale value`, async ({ page }) => {
    await chooseInjected(page);
    await connect(page);
    await page.getByRole('button', { name: 'Read counter value' }).click();
    await expect(page.locator('#value')).toHaveText('42 (uint256)');

    await page.evaluate((name) => window.__wallet?.emit(name), event);
    await expect(page.locator('#phase')).toHaveText('Disconnected');
    await expect(page.locator('#account')).toHaveText('Not connected');
    await expect(page.locator('#value')).toHaveText('—');
    await expect(page.locator('#read')).toBeDisabled();
    await expect(page.locator('#error')).toBeHidden();

    const readsBefore = await page.evaluate(() => window.__wallet?.calls.filter((call) => call === 'eth_call').length ?? 0);
    expect(readsBefore).toBe(1);
  });
}

test('a late in-flight read is discarded after invalidation', async ({ page }) => {
  await page.evaluate(() => { if (window.__wallet) window.__wallet.delayCall = true; });
  await chooseInjected(page);
  await connect(page);
  await page.getByRole('button', { name: 'Read counter value' }).click();
  await expect(page.locator('#phase')).toHaveText('Reading…');

  await page.evaluate(() => window.__wallet?.emit('chainChanged'));
  await expect(page.locator('#phase')).toHaveText('Disconnected');

  await page.evaluate(() => window.__wallet?.pendingCall?.());
  await page.waitForTimeout(250);
  await expect(page.locator('#value')).toHaveText('—');
  await expect(page.locator('#account')).toHaveText('Not connected');
  await expect(page.locator('#read')).toBeDisabled();
  await expect(page.locator('#error')).toBeHidden();
});

test('a late connection result is discarded after switching modes', async ({ page }) => {
  await page.evaluate(() => { if (window.__wallet) window.__wallet.delayAccounts = true; });
  await chooseInjected(page);
  await page.getByRole('button', { name: 'Connect' }).click();
  await expect(page.locator('#phase')).toHaveText('Connecting…');

  await page.selectOption('#mode', 'mock');
  await page.getByRole('button', { name: 'Connect' }).click();
  await expect(page.locator('#phase')).toHaveText('Connected');
  await page.evaluate(() => window.__wallet?.pendingAccounts?.());
  await page.waitForTimeout(250);

  await expect(page.locator('#phase')).toHaveText('Connected');
  await expect(page.locator('#mode-label')).toHaveText('Mock demonstration (simulated)');
  await expect(page.locator('#account')).toHaveText(`0x${'11'.repeat(20)}`);
  await expect(page.locator('#error')).toBeHidden();
});

test('changing the contract address invalidates the session and clears the value', async ({ page }) => {
  await chooseInjected(page);
  await connect(page);
  await page.getByRole('button', { name: 'Read counter value' }).click();
  await expect(page.locator('#value')).toHaveText('42 (uint256)');

  await page.fill('#address', `0x${'44'.repeat(20)}`);
  await expect(page.locator('#phase')).toHaveText('Disconnected');
  await expect(page.locator('#account')).toHaveText('Not connected');
  await expect(page.locator('#value')).toHaveText('—');
  await expect(page.locator('#read')).toBeDisabled();
  await expect(page.locator('#contract')).toHaveText(`0x${'44'.repeat(20)}`);
});

test('a malformed read clears the previous displayed value', async ({ page }) => {
  await page.evaluate(() => { if (window.__wallet) window.__wallet.callResult = `0x${'0'.repeat(63)}1`; });
  await chooseInjected(page);
  await connect(page);
  await page.getByRole('button', { name: 'Read counter value' }).click();
  await expect(page.locator('#value')).toHaveText('1 (uint256)');

  await page.evaluate(() => { if (window.__wallet) window.__wallet.callResult = '0x'; });
  await page.getByRole('button', { name: 'Read counter value' }).click();
  await expect(page.locator('#error-code')).toHaveText('Code: RPC_MALFORMED');
  await expect(page.locator('#value')).toHaveText('—');
  await expect(page.locator('#read-status')).toHaveText('Failed: RPC_MALFORMED');
  await expect(page.locator('#retry')).toBeVisible();
});
