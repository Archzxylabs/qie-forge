import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const routes = ['/', '/get-started/', '/skills/', '/topics/', '/ecosystem/', '/recipes/', '/reference/networks/', '/troubleshooting/', '/verification/', '/contribute/', '/status/'];

test('all required routes render without page errors, horizontal overflow or WCAG A/AA violations', async ({ page }, testInfo) => {
  test.setTimeout(120000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const audits = [];
  for (const route of routes) {
    const response = await page.goto(route);
    expect(response?.status(), route).toBe(200);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Documentation' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), route).toBe(true);
    const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    audits.push({ route, violations: audit.violations, incomplete: audit.incomplete.map((item) => ({ id: item.id, impact: item.impact })) });
    expect(audit.violations, route).toEqual([]);
  }
  expect(errors).toEqual([]);
  await testInfo.attach('accessibility-audits', { body: JSON.stringify(audits, null, 2), contentType: 'application/json' });
});

test('homepage exposes install and first task; networks are one navigation step away', async ({ page }, testInfo) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Start building', exact: true })).toBeVisible();
  await expect(page.locator('#install-home')).toContainText('--agent auto --copy');
  const command = await page.locator('#install-home').boundingBox();
  expect(command!.y + command!.height).toBeLessThanOrEqual(page.viewportSize()!.height);
  await expect(page.getByText('Codex · Claude Code · Cursor · OpenCode', { exact: false })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('overview.png'), fullPage: true });
  await page.getByRole('navigation').getByRole('link', { name: 'Networks', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'qie-testnet', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'qie-mainnet', exact: true })).toBeVisible();
  await expect(page.getByText('Stored DOCUMENTED', { exact: false }).first()).toBeVisible();
});

test('catalogue filters include unknown support and recover from an empty result', async ({ page }, testInfo) => {
  await page.goto('/ecosystem/');
  await page.getByLabel('Effective status').selectOption('UNKNOWN');
  const entries = page.locator('[data-search]:visible');
  expect(await entries.count()).toBeGreaterThan(0);
  for (const entry of await entries.all()) await expect(entry).toHaveAttribute('data-status', 'UNKNOWN');
  await page.getByRole('searchbox').fill('no-such-capability-zzzz');
  await expect(page.getByText('No matches. Try a broader search.')).toBeVisible();
  await page.getByRole('button', { name: 'Reset filters' }).click();
  await expect(page.getByRole('searchbox')).toHaveValue('');
  await expect(page.getByLabel('Effective status')).toHaveValue('');
  await expect(page.locator('[data-empty]')).toBeHidden();
  await page.screenshot({ path: testInfo.outputPath('ecosystem.png'), fullPage: true });
});

test('copy reports success and offers manual recovery when the clipboard is denied', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => {} } }));
  await page.goto('/');
  await page.getByRole('button', { name: 'Copy command' }).click();
  await expect(page.getByRole('status')).toHaveText('Copied.');
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('denied'); } } }));
  await page.getByRole('button', { name: 'Copy command' }).click();
  await expect(page.getByRole('status')).toContainText('copy it manually');
});

test('keyboard navigation exposes skip link and visible focus', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Skip to content' });
  await expect(skip).toBeFocused();
  await expect(skip).toBeVisible();
  expect(await skip.evaluate((node) => getComputedStyle(node).outlineStyle)).toBe('solid');
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
});

test('documents and raw files work without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
  const page = await context.newPage();
  await page.goto('/skills/qie-smart-contracts/');
  await page.getByRole('link', { name: 'Read the skill', exact: true }).click();
  await expect(page.locator('article.document')).toContainText('build');
  const raw = await page.getByRole('link', { name: 'Open byte-identical raw Markdown' }).getAttribute('href');
  const response = await context.request.get(raw!);
  expect(response.headers()['content-type']).toContain('text/markdown');
  expect(await response.text()).toContain('name: qie-smart-contracts');
  await context.close();
});

test('reduced motion remains readable and unavailable routes return a real 404', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/status/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  const response = await page.goto('/not-a-real-route/');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('link', { name: 'Return to the documentation overview' })).toBeVisible();
});
