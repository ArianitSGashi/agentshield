import { MAX_LLM_INPUT_CHARS } from "../config.js";
import type { AnalysisResult } from "../types.js";
import { analyze as analyzeAnthropic } from "./anthropic.js";
import { analyze as analyzeGemini } from "./gemini.js";
import { normalize } from "./normalize.js";
import { renderHeuristicHints, runHeuristics } from "./heuristics.js";

type Provider = "anthropic" | "gemini";

function resolveProvider(): Provider {
  const raw = process.env.LLM_PROVIDER?.trim().toLowerCase();
  if (raw === "anthropic" || raw === "gemini") return raw;

  // Auto-detect from which key is set. If both keys are set we default to
  // Anthropic to preserve the original behavior; users can force Gemini by
  // setting LLM_PROVIDER=gemini explicitly.
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.GEMINI_API_KEY) return "gemini";

  throw new Error(
    "No LLM provider configured. Set ANTHROPIC_API_KEY or GEMINI_API_KEY, " +
      "or set LLM_PROVIDER=anthropic|gemini explicitly.",
  );
}

// Resolved once at module load; the proxy logs which provider is active.
const PROVIDER: Provider = resolveProvider();
console.log(`[agentshield] LLM provider: ${PROVIDER}`);

function truncateContent(content: string): string {
  if (content.length <= MAX_LLM_INPUT_CHARS) return content;
  return content.slice(0, MAX_LLM_INPUT_CHARS) + "\n\n[...content truncated at 100,000 characters]";
}

/**
 * Cascade analysis:
 *
 *   1. Normalize the page — surface HTML comments, hidden divs, zero-width
 *      character clusters into an annotated copy that the LLM will read.
 *   2. Run cheap regex heuristics against the original bytes. Their output
 *      is rendered as a `PRE-DETECTED SIGNALS` block appended to the user
 *      prompt below the untrusted content. The block is delimited and the
 *      system prompt instructs the model that it must still adjudicate the
 *      verdict — heuristics are hints, not labels.
 *   3. Send to the configured provider.
 *
 * Cost effect: roughly zero. The heuristics run in O(content length) and add
 * a few hundred bytes to the prompt.
 * Recall effect: pages where the LLM previously missed an attack (e.g.
 * because the malicious instruction was buried inside an HTML comment the
 * model glossed over) now arrive at the LLM with that comment surfaced.
 */
export async function analyzeContent(
  url: string,
  content: string,
): Promise<AnalysisResult | null> {
  const truncated = truncateContent(content);
  const normalized = normalize(truncated);
  const heuristics = runHeuristics(truncated, normalized);
  const hints = renderHeuristicHints(heuristics);

  const fn = PROVIDER === "anthropic" ? analyzeAnthropic : analyzeGemini;
  return fn(url, normalized.annotated, hints);
}

// Exported for unit-testing the cascade independently of any provider call.
export const __cascade = { normalize, runHeuristics, renderHeuristicHints };
