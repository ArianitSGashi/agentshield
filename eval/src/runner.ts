import { analyze as analyzeAnthropic } from "../../proxy/src/analyzer/anthropic.js";
import { analyze as analyzeGemini } from "../../proxy/src/analyzer/gemini.js";
import { normalize } from "../../proxy/src/analyzer/normalize.js";
import {
  renderHeuristicHints,
  runHeuristics,
} from "../../proxy/src/analyzer/heuristics.js";
import { MAX_LLM_INPUT_CHARS } from "../../proxy/src/config.js";
import type {
  CascadeMode,
  CorpusSample,
  ProviderId,
  SampleResult,
} from "./types.js";
import { fakeSourceUrl, readSampleContent } from "./corpus.js";

function truncateContent(content: string): string {
  if (content.length <= MAX_LLM_INPUT_CHARS) return content;
  return content.slice(0, MAX_LLM_INPUT_CHARS) + "\n\n[...content truncated at 100,000 characters]";
}

function analyzerFor(provider: ProviderId) {
  return provider === "anthropic" ? analyzeAnthropic : analyzeGemini;
}

interface PreparedInput {
  llmInput: string;
  hints: string;
  heuristicSignalCount: number | null;
  hiddenSegmentCount: number | null;
}

// Reproduce the production cascade from `proxy/src/analyzer/index.ts`. We
// can't import that function directly because it resolves the provider once
// at module load and the eval needs to run both providers in one process.
// Keeping this in lock-step with index.ts is enforced by the fact that
// any divergence shows up as a delta in the headline metrics.
function prepare(truncated: string, mode: CascadeMode): PreparedInput {
  if (mode === "bare") {
    return {
      llmInput: truncated,
      hints: "",
      heuristicSignalCount: null,
      hiddenSegmentCount: null,
    };
  }
  const normalized = normalize(truncated);
  const heuristics = runHeuristics(truncated, normalized);
  return {
    llmInput: normalized.annotated,
    hints: renderHeuristicHints(heuristics),
    heuristicSignalCount: heuristics.signals.length,
    hiddenSegmentCount: normalized.hiddenSegments.length,
  };
}

export async function runProvider(
  provider: ProviderId,
  mode: CascadeMode,
  samples: CorpusSample[],
  onProgress?: (done: number, total: number, last: SampleResult) => void,
  delayMs = 0,
): Promise<SampleResult[]> {
  const analyze = analyzerFor(provider);
  const results: SampleResult[] = [];

  // Sequential. The point of the harness is reproducible numbers; running in
  // parallel makes latency p50/p95 meaningless because requests would queue
  // inside the provider client, and free-tier API quotas would throttle us
  // into noise.
  for (let i = 0; i < samples.length; i++) {
    const sample = samples[i];
    const content = await readSampleContent(sample);
    const truncated = truncateContent(content);
    const url = fakeSourceUrl(sample);

    const prepared = prepare(truncated, mode);

    const start = Date.now();
    let predicted: SampleResult["predicted"] = "unscanned";
    let confidence: number | null = null;
    let explanation = "";
    let suspiciousSegments: string[] = [];
    let attackType: SampleResult["attackType"] = null;
    let error: string | null = null;

    try {
      const result = await analyze(url, prepared.llmInput, prepared.hints);
      if (result) {
        predicted = result.verdict;
        confidence = result.confidence;
        explanation = result.explanation;
        suspiciousSegments = result.suspiciousSegments;
        attackType = result.attackType;
      } else {
        error = "analyzer returned null (failed open)";
      }
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    }

    const latencyMs = Date.now() - start;
    const r: SampleResult = {
      sample,
      provider,
      mode,
      predicted,
      confidence,
      explanation,
      suspiciousSegments,
      attackType,
      latencyMs,
      contentBytes: Buffer.byteLength(content, "utf8"),
      heuristicSignalCount: prepared.heuristicSignalCount,
      hiddenSegmentCount: prepared.hiddenSegmentCount,
      error,
    };
    results.push(r);
    onProgress?.(i + 1, samples.length, r);

    // Pause between calls to stay under per-minute API quotas. Free-tier keys
    // otherwise get rate-limited after the first few samples, the analyzer
    // fails open, and the run reports those samples as unscanned. The pause
    // sits outside the timed window, so latency numbers are unaffected.
    if (delayMs > 0 && i < samples.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return results;
}
