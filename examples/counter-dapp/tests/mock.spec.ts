import { expect, test } from '@playwright/test';

// This file deliberately installs no wallet fixture: the mock demonstration is a
// separate, deliberate adapter and must work without any injected provider.
test('mock demonstration is clearly labelled and requires no wallet or RPC', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#simulation-banner')).toBeVisible();
  await expect(page.locator('#simulation-banner')).toContainText('SIMULATED DEMONSTRATION');
  await expect(page.locator('#mode-label')).toHaveText('Mock demonstration (simulated)');
  expect(await page.evaluate(() => (window as Window & { ethereum?: unknown }).ethereum)).toBeUndefined();

  await page.getByRole('button', { name: 'Connect' }).click();
  await expect(page.locator('#phase')).toHaveText('Connected');
  await expect(page.locator('#account')).toHaveText(`0x${'11'.repeat(20)}`);
  await page.getByRole('button', { name: 'Read counter value' }).click();
  await expect(page.locator('#value')).toHaveText('7 (uint256)');
  await expect(page.locator('#contract')).toContainText('simulated fixture — not deployed');
  await expect(page.locator('#network-label')).toContainText('qie-testnet');
});
