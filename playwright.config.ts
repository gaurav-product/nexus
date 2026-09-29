import { defineConfig, devices } from '@playwright/test';

// PW_CHROMIUM_PATH lets CI or sandboxes point at an existing Chromium.
const executablePath = process.env.PW_CHROMIUM_PATH || undefined;

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30_000,
  reporter: [['list']],
  use: { baseURL: 'http://localhost:4173', launchOptions: { executablePath } },
  webServer: {
    command: 'npm run build -w @nexus/web && npm run preview -w @nexus/web',
    url: 'http://localhost:4173',
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
});
