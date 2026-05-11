import "./env.js";
import { loadCorpus } from "./corpus.js";
import { runProvider } from "./runner.js";
import {
  accuracy,
  buildConfusionMatrix,
  latencyStats,
  macroF1,
  perClassMetrics,
} from "./metrics.js";
import { writeReports } from "./report.js";
import type { ProviderId, ProviderReport, SampleResult } from "./types.js";

interface CliOptions {
  providers: ProviderId[];
  filter?: string;
  limit?: number;
}

function parseArgs(argv: string[]): CliOptions {
  const opts: CliOptions = { providers: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--provider" || a === "-p") {
      const v = argv[++i];
      if (v !== "anthropic" && v !== "gemini") {
        throw new Error(`unknown provider: ${v}`);
      }
      opts.providers.push(v);
    } else if (a === "--filter") {
      opts.filter = argv[++i];
    } else if (a === "--limit") {
      opts.limit = Number(argv[++i]);
    } else if (a === "--help" || a === "-h") {
      printHelp();
      process.exit(0);
    }
  }
  if (opts.providers.length === 0) {
    if (process.env.ANTHROPIC_API_KEY) opts.providers.push("anthropic");
    if (process.env.GEMINI_API_KEY) opts.providers.push("gemini");
  }
  if (opts.providers.length === 0) {
    throw new Error(
      "No provider selected and no API key found. " +
        "Set ANTHROPIC_API_KEY or GEMINI_API_KEY, or pass --provider anthropic|gemini.",
    );
  }
  return opts;
}

function printHelp() {
  process.stdout.write(
    [
      "Usage: pnpm --filter eval eval -- [options]",
      "",
      "Options:",
      "  -p, --provider <name>  Provider to evaluate (anthropic|gemini). Repeatable.",
      "                         Defaults to whichever API keys are present in the env.",
      "      --filter <substr>  Only run samples whose id contains <substr>.",
      "      --limit <n>        Stop after the first <n> samples (after filtering).",
      "  -h, --help             Print this help.",
      "",
    ].join("\n"),
  );
}

function buildReport(provider: ProviderId, results: SampleResult[]): ProviderReport {
  const unscanned = results.filter((r) => r.predicted === "unscanned").length;
  const perClass = perClassMetrics(results);
  return {
    provider,
    totalSamples: results.length,
    scanned: results.length - unscanned,
    unscanned,
    accuracy: accuracy(results),
    macroF1: macroF1(perClass),
    perClass,
    confusion: buildConfusionMatrix(results),
    latency: latencyStats(results),
    results,
  };
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  let samples = await loadCorpus();
  if (opts.filter) samples = samples.filter((s) => s.id.includes(opts.filter!));
  if (opts.limit) samples = samples.slice(0, opts.limit);

  if (samples.length === 0) {
    console.error("No samples matched the filter.");
    process.exit(1);
  }

  console.log(`[eval] corpus: ${samples.length} samples`);
  console.log(`[eval] providers: ${opts.providers.join(", ")}`);
  console.log();

  const reports: ProviderReport[] = [];
  for (const provider of opts.providers) {
    console.log(`--- ${provider} ---`);
    const results = await runProvider(provider, samples, (done, total, last) => {
      const tag = last.predicted === last.sample.label ? "OK" : last.predicted === "unscanned" ? "??" : "XX";
      console.log(
        `[${provider}] ${done}/${total} ${tag} ${last.sample.id} actual=${last.sample.label} predicted=${last.predicted} (${last.latencyMs}ms)`,
      );
    });
    reports.push(buildReport(provider, results));
    console.log();
  }

  const paths = await writeReports(reports);
  console.log(`[eval] wrote ${paths.md}`);
  console.log(`[eval] wrote ${paths.json}`);

  // Brief summary at the end so a CI run shows the numbers at a glance.
  console.log();
  console.log("Summary:");
  for (const r of reports) {
    console.log(
      `  ${r.provider}: accuracy=${(r.accuracy * 100).toFixed(1)}% macroF1=${(r.macroF1 * 100).toFixed(1)}% p50=${r.latency.p50}ms p95=${r.latency.p95}ms`,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
