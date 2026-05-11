import { MAX_LLM_INPUT_CHARS } from "../config.js";
import type { AnalysisResult } from "../types.js";
import { analyze as analyzeAnthropic } from "./anthropic.js";
import { analyze as analyzeGemini } from "./gemini.js";

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

export async function analyzeContent(
  url: string,
  content: string,
): Promise<AnalysisResult | null> {
  const truncated = truncateContent(content);
  const fn = PROVIDER === "anthropic" ? analyzeAnthropic : analyzeGemini;
  return fn(url, truncated);
}
