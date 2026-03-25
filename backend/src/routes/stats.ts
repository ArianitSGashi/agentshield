import { type FastifyInstance } from "fastify";
import { count, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { scans } from "../db/schema.js";

export async function statsRoutes(app: FastifyInstance) {
  // GET /api/stats — aggregated statistics
  app.get("/api/stats", async (_request, reply) => {
    const [totals] = await db
      .select({
        totalScans: count(),
        threatsBlocked: count(
          sql`CASE WHEN ${scans.verdict} IN ('suspicious', 'malicious') THEN 1 END`
        ),
      })
      .from(scans);

    const threatRate =
      totals.totalScans > 0
        ? Math.round((totals.threatsBlocked / totals.totalScans) * 100)
        : 0;

    const scansPerDay = await db
      .select({
        date: sql<string>`DATE(${scans.timestamp})`.as("date"),
        count: count(),
      })
      .from(scans)
      .where(sql`${scans.timestamp} >= NOW() - INTERVAL '30 days'`)
      .groupBy(sql`DATE(${scans.timestamp})`)
      .orderBy(sql`DATE(${scans.timestamp})`);

    return reply.send({
      totalScans: totals.totalScans,
      threatsBlocked: totals.threatsBlocked,
      threatRate,
      scansPerDay,
    });
  });
}
