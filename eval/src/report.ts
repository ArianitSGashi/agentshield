import { writeFile, mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { ProviderReport, SampleResult } from "./types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const RESULTS_DIR = resolve(__dirname, "..", "results");

function pct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

function verdictIcon(predicted: string, actual: string): string {
  if (predicted === "unscanned") return "?";
  return predicted === actual ? "OK" : "X";
}

function renderConfusion(report: ProviderReport): string {
  const { rows, cols, counts } = report.confusion;
  const header = ["actual \\ predicted", ...cols].join(" | ");
  const sep = ["---", ...cols.map(() => "---")].join(" | ");
  const body = rows.map((label, i) => [label, ...counts[i].map(String)].join(" | "));
  return ["| " + header + " |", "| " + sep + " |", ...body.map((r) => "| " + r + " |")].join("\n");
}

function renderPerClass(report: ProviderReport): string {
  const header = "| label | precision | recall | F1 | support |";
  const sep = "| --- | --- | --- | --- | --- |";
  const rows = report.perClass.map(
    (c) =>
      `| ${c.label} | ${pct(c.precision)} | ${pct(c.recall)} | ${pct(c.f1)} | ${c.support} |`,
  );
  return [header, sep, ...rows].join("\n");
}

function renderSampleTable(results: SampleResult[]): string {
  const header =
    "| id | actual | predicted | attack | conf | signals | latency | error |";
  const sep = "| --- | --- | --- | --- | --- | --- | --- | --- |";
  const rows = results.map((r) => {
    const conf = r.confidence === null ? "-" : `${r.confidence}`;
    const icon = verdictIcon(r.predicted, r.sample.label);
    const err = r.error ? r.error.replace(/\|/g, "\\|").slice(0, 60) : "";
    const attack = r.attackType ?? "-";
    const signals = r.heuristicSignalCount === null ? "-" : `${r.heuristicSignalCount}`;
    return `| ${r.sample.id} | ${r.sample.label} | ${icon} ${r.predicted} | ${attack} | ${conf} | ${signals} | ${r.latencyMs}ms | ${err} |`;
  });
  return [header, sep, ...rows].join("\n");
}

export function renderMarkdown(reports: ProviderReport[]): string {
  const lines: string[] = [];
  lines.push("# AgentShield evaluation report");
  lines.push("");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push("");

  lines.push("## Summary");
  lines.push("");
  lines.push(
    "| provider | mode | samples | scanned | unscanned | accuracy | macro F1 | avg signals | p50 | p95 |",
  );
  lines.push(
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
  );
  for (const r of reports) {
    const avgSig =
      r.avgHeuristicSignals === null ? "-" : r.avgHeuristicSignals.toFixed(2);
    lines.push(
      `| ${r.provider} | ${r.mode} | ${r.totalSamples} | ${r.scanned} | ${r.unscanned} | ${pct(r.accuracy)} | ${pct(r.macroF1)} | ${avgSig} | ${r.latency.p50}ms | ${r.latency.p95}ms |`,
    );
  }
  lines.push("");

  for (const report of reports) {
    lines.push(`## Provider: ${report.provider} (${report.mode})`);
    lines.push("");
    lines.push("### Per-class metrics");
    lines.push("");
    lines.push(renderPerClass(report));
    lines.push("");
    lines.push("### Confusion matrix");
    lines.push("");
    lines.push(renderConfusion(report));
    lines.push("");
    lines.push("### Latency");
    lines.push("");
    lines.push(`- p50: ${report.latency.p50}ms`);
    lines.push(`- p95: ${report.latency.p95}ms`);
    lines.push(`- mean: ${report.latency.mean}ms`);
    lines.push("");
    lines.push("### Per-sample results");
    lines.push("");
    lines.push(renderSampleTable(report.results));
    lines.push("");

    const misses = report.results.filter(
      (r) => r.predicted !== "unscanned" && r.predicted !== r.sample.label,
    );
    if (misses.length > 0) {
      lines.push("### Disagreements");
      lines.push("");
      for (const r of misses) {
        lines.push(`- **${r.sample.id}** (actual=${r.sample.label}, predicted=${r.predicted}, confidence=${r.confidence ?? "?"})`);
        lines.push(`  - ${r.explanation.slice(0, 300).replace(/\s+/g, " ")}`);
      }
      lines.push("");
    }
  }

  return lines.join("\n");
}

export async function writeReports(reports: ProviderReport[]): Promise<{ md: string; json: string }> {
  await mkdir(RESULTS_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const mdPath = resolve(RESULTS_DIR, `report-${stamp}.md`);
  const jsonPath = resolve(RESULTS_DIR, `report-${stamp}.json`);
  const latestMd = resolve(RESULTS_DIR, "latest.md");
  const latestJson = resolve(RESULTS_DIR, "latest.json");

  const md = renderMarkdown(reports);
  const json = JSON.stringify(reports, null, 2);
  await writeFile(mdPath, md, "utf8");
  await writeFile(jsonPath, json, "utf8");
  await writeFile(latestMd, md, "utf8");
  await writeFile(latestJson, json, "utf8");
  return { md: mdPath, json: jsonPath };
}
