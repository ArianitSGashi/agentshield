import { pgTable, uuid, timestamp, text, integer, pgEnum, index } from "drizzle-orm/pg-core";

export const verdictEnum = pgEnum("verdict", ["safe", "suspicious", "malicious"]);

// Operational outcome of the analysis attempt. Decoupled from `verdict` so
// the dashboard can show "we couldn't reach the LLM" distinct from "the LLM
// said safe". Fail-open events get `scan_status = 'unscanned'`; their
// `verdict` and `confidence` fields hold neutral defaults (verdict='safe',
// confidence=0) since the proxy still passed the content through unchanged.
export const scanStatusEnum = pgEnum("scan_status", ["scanned", "unscanned"]);

// Attack taxonomy. Populated by the analyzer when verdict is suspicious or
// malicious; null when verdict=safe or scan_status=unscanned.
//
//   override       — instruction-override ("ignore previous instructions")
//   exfil          — data-exfiltration request (read secrets, POST env)
//   code_injection — asks the agent to write/execute attacker-chosen code
//   jailbreak      — persona switch / safety-bypass framing (DAN, AIM)
//   social_eng     — polite/authority framing aimed at the assistant
//   indirect_tool  — asks the agent to invoke its tools destructively
//   obfuscation    — primarily delivered via hidden HTML / encoding tricks
//   other          — confirmed malicious but doesn't fit the above
export const attackTypeEnum = pgEnum("attack_type", [
  "override",
  "exfil",
  "code_injection",
  "jailbreak",
  "social_eng",
  "indirect_tool",
  "obfuscation",
  "other",
]);

export const scans = pgTable(
  "scans",
  {
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
    scanStatus: scanStatusEnum("scan_status").notNull().default("scanned"),
    attackType: attackTypeEnum("attack_type"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("idx_scans_timestamp").on(t.timestamp.desc()),
    index("idx_scans_verdict_timestamp").on(t.verdict, t.timestamp.desc()),
    index("idx_scans_status_timestamp").on(t.scanStatus, t.timestamp.desc()),
    index("idx_scans_attack_type").on(t.attackType),
  ],
);
