import { defineConfig, devices } from "@playwright/test";

// Smoke tests: spin up the Vite dev server and exercise the dashboard
// with the backend mocked at the network layer (page.route). The point
// is to catch obvious render/regression failures, not to validate API
// contracts — those live in the backend's vitest suite.
export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  reporter: "list",
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
