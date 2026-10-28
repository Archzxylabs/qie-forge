import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, devices } from '@playwright/test';

const exampleRoot = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(exampleRoot, '../..');

// Deterministic browser checks. The wallet in every test is an injected
// fixture; this does not establish compatibility with any real wallet or QIE RPC.
export default defineConfig({
  testDir: path.join(exampleRoot, 'tests'),
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: path.join(exampleRoot, 'playwright-report') }],
  ],
  outputDir: path.join(exampleRoot, 'test-results'),
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'node node_modules/vite/bin/vite.js examples/counter-dapp --host 127.0.0.1 --port 4173 --strictPort',
    cwd: repositoryRoot,
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
    timeout: 60_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], channel: 'chromium' } }],
});
