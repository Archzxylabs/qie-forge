import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from '@playwright/test';

const directory = path.dirname(fileURLToPath(import.meta.url));
export default defineConfig({
  testDir: path.join(directory, 'tests'), workers: 1, retries: 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: path.join(directory, 'playwright-report') }]],
  outputDir: path.join(directory, 'test-results'),
  use: { baseURL: 'http://127.0.0.1:4174', channel: 'chromium', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  webServer: { command: 'node scripts/serve-docs.mjs --port 4174', cwd: path.join(directory, '..'), url: 'http://127.0.0.1:4174', reuseExistingServer: false, timeout: 30000 },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ],
});
