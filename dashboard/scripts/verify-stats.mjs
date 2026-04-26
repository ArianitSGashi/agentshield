import { chromium } from "playwright"
import { mkdir } from "node:fs/promises"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, "..", "screenshots")
const BASE = "http://localhost:5173"

const MOCK_STATS = {
  totalScans: 1247,
  threatsBlocked: 138,
  threatRate: 11,
  scansPerDay: Array.from({ length: 30 }, (_, i) => {
    const d = new Date()
    d.setUTCHours(0, 0, 0, 0)
    d.setUTCDate(d.getUTCDate() - (29 - i))
    return {
      date: d.toISOString().slice(0, 10),
      count: Math.round(20 + Math.sin(i / 3) * 15 + (i % 5) * 3),
    }
  }),
}

await mkdir(OUT, { recursive: true })

const browser = await chromium.launch()
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  colorScheme: "dark",
})
const page = await context.newPage()
const errors = []
const consoleErrors = []
page.on("pageerror", (e) => errors.push(e.message))
page.on("console", (m) => {
  if (m.type() === "error") consoleErrors.push(m.text())
})

await page.route("**/api/**", async (route) => {
  const url = new URL(route.request().url())
  if (url.pathname === "/api/stats") {
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_STATS),
    })
  }
  return route.continue()
})

try {
  await page.goto(BASE + "/stats", { waitUntil: "networkidle", timeout: 15000 })
} catch (e) {
  console.log(`[stats] goto timed out: ${e.message}`)
}
await page.waitForTimeout(900)

const shot = join(OUT, "stats.png")
await page.screenshot({ path: shot, fullPage: true })
console.log(`[stats] -> ${shot}`)
if (errors.length) console.log(`  pageerror:`, errors)
if (consoleErrors.length) console.log(`  console.error:`, consoleErrors)

await page.close()
await context.close()
await browser.close()
console.log("done")
