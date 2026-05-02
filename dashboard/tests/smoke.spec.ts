import { test, expect, type Route } from "@playwright/test";

const FIXED_TIMESTAMP = "2026-01-15T12:00:00.000Z";

const mockScans = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    timestamp: FIXED_TIMESTAMP,
    sourceUrl: "https://example.com/safe-docs",
    agentName: "claude-code",
    verdict: "safe",
    confidence: 95,
    explanation: "Looks like ordinary technical docs.",
    suspiciousSegments: [],
    contentHash: "abc",
    responseTimeMs: 120,
    createdAt: FIXED_TIMESTAMP,
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    timestamp: FIXED_TIMESTAMP,
    sourceUrl: "https://evil.example/injection",
    agentName: "claude-code",
    verdict: "malicious",
    confidence: 92,
    explanation: "Content contains an explicit instruction to exfiltrate data.",
    suspiciousSegments: ["IGNORE PRIOR INSTRUCTIONS..."],
    contentHash: "def",
    responseTimeMs: 340,
    createdAt: FIXED_TIMESTAMP,
  },
];

async function mockApi(route: Route) {
  const url = route.request().url();
  if (url.includes("/api/stats")) {
    return route.fulfill({
      json: { totalScans: 2, threatsBlocked: 1, threatRate: 50, scansPerDay: [] },
    });
  }
  if (url.match(/\/api\/scans\/[0-9a-f-]{36}$/)) {
    return route.fulfill({ json: mockScans[0] });
  }
  if (url.includes("/api/scans")) {
    return route.fulfill({
      json: {
        data: mockScans,
        pagination: { page: 1, limit: 25, total: 2, totalPages: 1 },
      },
    });
  }
  return route.continue();
}

test.beforeEach(async ({ page }) => {
  await page.route("**/api/**", mockApi);
});

test("live feed renders with mocked scans", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Live Feed" })).toBeVisible();
  await expect(page.getByText("https://example.com/safe-docs")).toBeVisible();
  await expect(page.getByText("https://evil.example/injection")).toBeVisible();
});

test("history page lists scans and allows verdict filtering via URL", async ({ page }) => {
  await page.goto("/history?verdict=malicious");
  await expect(page.getByRole("heading", { name: "History" })).toBeVisible();
  // The "Active filters" pill confirms the URL state was picked up.
  await expect(page.getByText("verdict: malicious")).toBeVisible();
});

test("stats page renders with totals", async ({ page }) => {
  await page.goto("/stats");
  await expect(page.getByRole("heading", { name: "Stats" })).toBeVisible();
  await expect(page.getByText("Total scans")).toBeVisible();
});

test("clicking a scan navigates to its detail page", async ({ page }) => {
  await page.goto("/");
  await page.getByText("https://example.com/safe-docs").click();
  await expect(page).toHaveURL(/\/scans\/[0-9a-f-]{36}/);
  await expect(page.getByRole("heading", { name: /analyzer explanation/i })).toBeVisible();
});

test("error state shows when the backend is unreachable", async ({ page }) => {
  await page.unroute("**/api/**");
  await page.route("**/api/**", (route) => route.abort("connectionrefused"));
  await page.goto("/");
  await expect(page.getByText(/unable to reach backend/i)).toBeVisible();
});
