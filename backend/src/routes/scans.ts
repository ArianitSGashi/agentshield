import { type FastifyInstance, type FastifyRequest, type FastifyReply } from "fastify";
import { timingSafeEqual } from "node:crypto";
import { z } from "zod/v4";
import { and, eq, desc, ilike, count, type SQL } from "drizzle-orm";
import { db } from "../db/index.js";
import { scans } from "../db/schema.js";

const INGEST_TOKEN = process.env.INGEST_TOKEN?.trim() || "";

if (!INGEST_TOKEN) {
  console.warn(
    "[backend] INGEST_TOKEN is not set — POST /api/scans is unauthenticated. " +
      "Set INGEST_TOKEN in .env to require a Bearer token from the proxy.",
  );
}

function constantTimeEquals(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, "utf8");
  const bBuf = Buffer.from(b, "utf8");
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

async function requireIngestToken(request: FastifyRequest, reply: FastifyReply) {
  if (!INGEST_TOKEN) return; // disabled — see startup warning
  const header = request.headers.authorization;
  const match = header?.match(/^Bearer\s+(.+)$/i);
  if (!match || !constantTimeEquals(match[1], INGEST_TOKEN)) {
    return reply.status(401).send({ error: "Unauthorized" });
  }
}

const createScanSchema = z.object({
  sourceUrl: z.url(),
  agentName: z.string().min(1),
  verdict: z.enum(["safe", "suspicious", "malicious"]),
  confidence: z.int().min(0).max(100),
  explanation: z.string().min(1),
  suspiciousSegments: z.array(z.string()).optional(),
  contentHash: z.string().min(1),
  responseTimeMs: z.int().min(0),
});

const listQuerySchema = z.object({
  verdict: z.enum(["safe", "suspicious", "malicious"]).optional(),
  // Optional substring search against source_url. Trimmed; empty string ignored.
  q: z.string().trim().min(1).max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// Escape characters that have meaning in SQL LIKE patterns so user input
// like "_" or "%" matches literally.
function escapeLikePattern(input: string): string {
  return input.replace(/[\\%_]/g, (c) => `\\${c}`);
}

export async function scanRoutes(app: FastifyInstance) {
  // POST /api/scans — create a new scan (proxy → backend)
  app.post("/api/scans", { preHandler: requireIngestToken }, async (request, reply) => {
    const parsed = createScanSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Validation failed", issues: parsed.error.issues });
    }

    const [scan] = await db
      .insert(scans)
      .values({
        ...parsed.data,
        timestamp: new Date(),
      })
      .returning();

    return reply.status(201).send(scan);
  });

  // GET /api/scans — list scans with filtering and pagination
  app.get("/api/scans", async (request, reply) => {
    const parsed = listQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Validation failed", issues: parsed.error.issues });
    }

    const { verdict, q, page, limit } = parsed.data;
    const offset = (page - 1) * limit;

    const filters: SQL[] = [];
    if (verdict) filters.push(eq(scans.verdict, verdict));
    if (q) filters.push(ilike(scans.sourceUrl, `%${escapeLikePattern(q)}%`));
    const where = filters.length === 0 ? undefined : filters.length === 1 ? filters[0] : and(...filters);

    const [items, [total]] = await Promise.all([
      db
        .select()
        .from(scans)
        .where(where)
        .orderBy(desc(scans.timestamp))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: count() })
        .from(scans)
        .where(where),
    ]);

    return reply.send({
      data: items,
      pagination: {
        page,
        limit,
        total: total.count,
        totalPages: Math.ceil(total.count / limit),
      },
    });
  });

  // GET /api/scans/:id — single scan detail
  app.get("/api/scans/:id", async (request, reply) => {
    const params = z.object({ id: z.uuid() }).safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: "Invalid scan ID" });
    }

    const [scan] = await db
      .select()
      .from(scans)
      .where(eq(scans.id, params.data.id));

    if (!scan) {
      return reply.status(404).send({ error: "Scan not found" });
    }

    return reply.send(scan);
  });
}
