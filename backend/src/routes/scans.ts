import { type FastifyInstance } from "fastify";
import { z } from "zod/v4";
import { and, eq, desc, ilike, count, type SQL } from "drizzle-orm";
import { db } from "../db/index.js";
import { scans } from "../db/schema.js";

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
  // POST /api/scans — create a new scan
  app.post("/api/scans", async (request, reply) => {
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
