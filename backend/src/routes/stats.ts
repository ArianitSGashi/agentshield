import { type FastifyInstance } from "fastify";
import { avg, count, eq, isNotNull, sql } from "drizzle-orm";
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
        // Average analyzer latency across only successfully-scanned rows —
        // unscanned events have responseTimeMs=0 which would skew the mean.
        avgResponseTimeMs: avg(
          sql<number>`CASE WHEN ${scans.scanStatus} = 'scanned' THEN ${scans.responseTimeMs} END`,
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

    // Verdict mix across scanned rows so the donut on the dashboard reflects
    // analyzer outcomes (excluding fail-open passes).
    const verdictRows = await db
      .select({
        verdict: scans.verdict,
        count: count(),
      })
      .from(scans)
      .where(eq(scans.scanStatus, "scanned"))
      .groupBy(scans.verdict);

    const verdictBreakdown = {
      safe: 0,
      suspicious: 0,
      malicious: 0,
    } as Record<"safe" | "suspicious" | "malicious", number>;
    for (const row of verdictRows) {
      verdictBreakdown[row.verdict] = row.count;
    }

    // Per-agent totals — drives the agent breakdown card AND populates the
    // agent dropdown on the History page so it isn't scoped to one server
    // page of results.
    const agents = await db
      .select({
        agentName: scans.agentName,
        count: count(),
        threats: count(
          sql`CASE WHEN ${scans.verdict} IN ('suspicious', 'malicious') AND ${scans.scanStatus} = 'scanned' THEN 1 END`,
        ),
      })
      .from(scans)
      .groupBy(scans.agentName)
      .orderBy(sql`count(*) DESC`);

    // Top URLs by threat count — only includes URLs that were flagged
    // suspicious or malicious at least once. Useful for the "where do
    // threats come from" panel on the dashboard.
    const topThreatSources = await db
      .select({
        sourceUrl: scans.sourceUrl,
        threats: count(),
      })
      .from(scans)
      .where(
        sql`${scans.verdict} IN ('suspicious', 'malicious') AND ${scans.scanStatus} = 'scanned'`,
      )
      .groupBy(scans.sourceUrl)
      .orderBy(sql`count(*) DESC`)
      .limit(6);

    return reply.send({
      totalScans: totals.totalScans,
      threatsBlocked: totals.threatsBlocked,
      threatRate,
      unscanned: totals.unscanned,
      avgResponseTimeMs: totals.avgResponseTimeMs
        ? Math.round(Number(totals.avgResponseTimeMs))
        : 0,
      scansPerDay,
      attackTypes: attackTypes.map((r) => ({
        attackType: r.attackType,
        count: r.count,
      })),
      verdictBreakdown,
      agents: agents.map((a) => ({
        agentName: a.agentName,
        count: a.count,
        threats: a.threats,
      })),
      topThreatSources: topThreatSources.map((t) => ({
        sourceUrl: t.sourceUrl,
        threats: t.threats,
      })),
    });
  });
}

