import { type FastifyInstance } from "fastify";
import { count, isNotNull, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { scans } from "../db/schema.js";

export async function statsRoutes(app: FastifyInstance) {
  // GET /api/stats — aggregated statistics
  app.get("/api/stats", async (_request, reply) => {
    const [totals] = await db
      .select({
        totalScans: count(),
        threatsBlocked: count(
          sql`CASE WHEN ${scans.verdict} IN ('suspicious', 'malicious') AND ${scans.scanStatus} = 'scanned' THEN 1 END`,
        ),
        unscanned: count(
          sql`CASE WHEN ${scans.scanStatus} = 'unscanned' THEN 1 END`,
        ),
      })
      .from(scans);

    // Threat rate is computed against successfully-scanned content only —
    // counting "unscanned" toward either bucket would dilute the signal.
    const scanned = totals.totalScans - totals.unscanned;
    const threatRate = scanned > 0 ? Math.round((totals.threatsBlocked / scanned) * 100) : 0;

    const scansPerDay = await db
      .select({
        date: sql<string>`DATE(${scans.timestamp})`.as("date"),
        count: count(),
      })
      .from(scans)
      .where(sql`${scans.timestamp} >= NOW() - INTERVAL '30 days'`)
      .groupBy(sql`DATE(${scans.timestamp})`)
      .orderBy(sql`DATE(${scans.timestamp})`);

    // Attack-type breakdown. Only counts rows with an attack_type set, which
    // by construction means verdict was suspicious or malicious AND the
    // analyzer was able to classify the attack pattern.
    const attackTypes = await db
      .select({
        attackType: scans.attackType,
        count: count(),
      })
      .from(scans)
      .where(isNotNull(scans.attackType))
      .groupBy(scans.attackType)
      .orderBy(sql`count(*) DESC`);

    return reply.send({
      totalScans: totals.totalScans,
      threatsBlocked: totals.threatsBlocked,
      threatRate,
      unscanned: totals.unscanned,
      scansPerDay,
      attackTypes: attackTypes.map((r) => ({
        attackType: r.attackType,
        count: r.count,
      })),
    });
  });
}
