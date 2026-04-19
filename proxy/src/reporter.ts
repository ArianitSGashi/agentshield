import { REPORT_TIMEOUT_MS } from "./config.js";
import type { ScanReport } from "./types.js";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";

export function reportScan(report: ScanReport): void {
  const url = `${BACKEND_URL}/api/scans`;

  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sourceUrl: report.sourceUrl,
      agentName: report.agentName,
      verdict: report.verdict,
      confidence: report.confidence,
      explanation: report.explanation,
      suspiciousSegments: report.suspiciousSegments,
      contentHash: report.contentHash,
      responseTimeMs: report.responseTimeMs,
    }),
    signal: AbortSignal.timeout(REPORT_TIMEOUT_MS),
  })
    .then((res) => {
      if (!res.ok) {
        console.warn(`[agentshield] Backend returned ${res.status} for scan report`);
      }
    })
    .catch((err) => {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`[agentshield] Failed to report scan (non-blocking): ${message}`);
    });
}
