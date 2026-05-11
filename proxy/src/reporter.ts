import { REPORT_TIMEOUT_MS } from "./config.js";
import type { ScanReport } from "./types.js";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";
const INGEST_TOKEN = process.env.INGEST_TOKEN?.trim() || "";

export function reportScan(report: ScanReport): void {
  const url = `${BACKEND_URL}/api/scans`;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (INGEST_TOKEN) headers.Authorization = `Bearer ${INGEST_TOKEN}`;

  fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      sourceUrl: report.sourceUrl,
      agentName: report.agentName,
      verdict: report.verdict,
      confidence: report.confidence,
      explanation: report.explanation,
      suspiciousSegments: report.suspiciousSegments,
      contentHash: report.contentHash,
      responseTimeMs: report.responseTimeMs,
      attackType: report.attackType,
      scanStatus: report.scanStatus,
    }),
    signal: AbortSignal.timeout(REPORT_TIMEOUT_MS),
  })
    .then((res) => {
      if (res.status === 401) {
        console.warn(
          "[agentshield] Backend rejected scan: 401 Unauthorized. " +
            "Set INGEST_TOKEN in the proxy environment to match the backend.",
        );
        return;
      }
      if (!res.ok) {
        console.warn(`[agentshield] Backend returned ${res.status} for scan report`);
      }
    })
    .catch((err) => {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`[agentshield] Failed to report scan (non-blocking): ${message}`);
    });
}
