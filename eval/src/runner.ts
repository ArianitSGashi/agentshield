import { analyze as analyzeAnthropic } from "../../proxy/src/analyzer/anthropic.js";
import { analyze as analyzeGemini } from "../../proxy/src/analyzer/gemini.js";
import { MAX_LLM_INPUT_CHARS } from "../../proxy/src/config.js";
import type { CorpusSample, ProviderId, SampleResult } from "./types.js";
import { fakeSourceUrl, readSampleContent } from "./corpus.js";

function truncateContent(content: string): string {
  if (content.length <= MAX_LLM_INPUT_CHARS) return content;
  return content.slice(0, MAX_LLM_INPUT_CHARS) + "\n\n[...content truncated at 100,000 characters]";
}

function analyzerFor(provider: ProviderId) {
  return provider === "anthropic" ? analyzeAnthropic : analyzeGemini;
}

export async function runProvider(
  provider: ProviderId,
  samples: CorpusSample[],
  onProgress?: (done: number, total: number, last: SampleResult) => void,
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

    const start = Date.now();
    let predicted: SampleResult["predicted"] = "unscanned";
    let confidence: number | null = null;
    let explanation = "";
    let suspiciousSegments: string[] = [];
    let error: string | null = null;

    try {
      const result = await analyze(url, truncated);
      if (result) {
        predicted = result.verdict;
        confidence = result.confidence;
        explanation = result.explanation;
        suspiciousSegments = result.suspiciousSegments;
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
      predicted,
      confidence,
      explanation,
      suspiciousSegments,
      latencyMs,
      contentBytes: Buffer.byteLength(content, "utf8"),
      error,
    };
    results.push(r);
    onProgress?.(i + 1, samples.length, r);
  }

  return results;
}
