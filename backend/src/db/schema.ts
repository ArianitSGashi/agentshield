import { pgTable, uuid, timestamp, text, integer, pgEnum } from "drizzle-orm/pg-core";

export const verdictEnum = pgEnum("verdict", ["safe", "suspicious", "malicious"]);

export const scans = pgTable("scans", {
  id: uuid("id").primaryKey().defaultRandom(),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull(),
  sourceUrl: text("source_url").notNull(),
  agentName: text("agent_name").notNull(),
  verdict: verdictEnum("verdict").notNull(),
  confidence: integer("confidence").notNull(),
  explanation: text("explanation").notNull(),
  suspiciousSegments: text("suspicious_segments").array(),
  contentHash: text("content_hash").notNull(),
  responseTimeMs: integer("response_time_ms").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
