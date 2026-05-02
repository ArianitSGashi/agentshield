import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import { scanRoutes } from "./scans.js";
import { db } from "../db/index.js";
import { scans } from "../db/schema.js";

// Real-DB integration tests. They exercise the routes end-to-end against
// the same Postgres instance the app uses. Skip cleanly when DATABASE_URL
// is not configured so unrelated CI runs don't fail.
const skip = !process.env.DATABASE_URL;
const TEST_AGENT = "__vitest__";

describe.skipIf(skip)("scans routes", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = Fastify();
    await app.register(scanRoutes);
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await db.delete(scans).where(eq(scans.agentName, TEST_AGENT));
  });

  beforeEach(async () => {
    await db.delete(scans).where(eq(scans.agentName, TEST_AGENT));
  });

  const validBody = (overrides: Partial<Record<string, unknown>> = {}) => ({
    sourceUrl: "https://example.com/article",
    agentName: TEST_AGENT,
    verdict: "safe" as const,
    confidence: 95,
    explanation: "Looks fine.",
    contentHash: "deadbeef",
    responseTimeMs: 42,
    ...overrides,
  });

  describe("POST /api/scans", () => {
    it("creates a scan and returns 201 with id + createdAt", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/scans",
        payload: validBody(),
      });
      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(body.createdAt).toBeDefined();
      expect(body.verdict).toBe("safe");
    });

    it("rejects malformed payload with 400", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/scans",
        payload: { sourceUrl: "not-a-url" },
      });
      expect(res.statusCode).toBe(400);
      expect(res.json().error).toBeDefined();
    });

    it("rejects out-of-range confidence", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/scans",
        payload: validBody({ confidence: 150 }),
      });
      expect(res.statusCode).toBe(400);
    });
  });

  describe("GET /api/scans", () => {
    it("returns paginated results in reverse-timestamp order", async () => {
      // Seed three rows with distinct verdicts.
      for (const verdict of ["safe", "suspicious", "malicious"] as const) {
        await app.inject({
          method: "POST",
          url: "/api/scans",
          payload: validBody({ verdict, contentHash: `hash-${verdict}` }),
        });
      }

      const res = await app.inject({
        method: "GET",
        url: `/api/scans?limit=10`,
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      const ours = body.data.filter((s: { agentName: string }) => s.agentName === TEST_AGENT);
      expect(ours.length).toBe(3);
      // Most recent first
      const ts = ours.map((s: { timestamp: string }) => Date.parse(s.timestamp));
      expect(ts).toEqual([...ts].sort((a: number, b: number) => b - a));
    });

    it("filters by verdict", async () => {
      for (const verdict of ["safe", "malicious", "malicious"] as const) {
        await app.inject({
          method: "POST",
          url: "/api/scans",
          payload: validBody({ verdict, contentHash: `h-${Math.random()}` }),
        });
      }
      const res = await app.inject({
        method: "GET",
        url: `/api/scans?verdict=malicious&limit=10`,
      });
      const body = res.json();
      const ours = body.data.filter((s: { agentName: string }) => s.agentName === TEST_AGENT);
      expect(ours.length).toBe(2);
      expect(ours.every((s: { verdict: string }) => s.verdict === "malicious")).toBe(true);
    });

    it("rejects invalid pagination", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/scans?page=0",
      });
      expect(res.statusCode).toBe(400);
    });
  });

  describe("GET /api/scans/:id", () => {
    it("returns 404 for a well-formed but absent UUID", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/scans/00000000-0000-0000-0000-000000000000",
      });
      expect(res.statusCode).toBe(404);
    });

    it("returns 400 for a malformed id", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/scans/not-a-uuid",
      });
      expect(res.statusCode).toBe(400);
    });

    it("returns the scan after creating it", async () => {
      const created = (
        await app.inject({
          method: "POST",
          url: "/api/scans",
          payload: validBody(),
        })
      ).json();
      const got = await app.inject({
        method: "GET",
        url: `/api/scans/${created.id}`,
      });
      expect(got.statusCode).toBe(200);
      expect(got.json().id).toBe(created.id);
    });
  });
});
