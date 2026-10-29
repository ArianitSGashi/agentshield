import Anthropic from "@anthropic-ai/sdk";
import { LLM_TIMEOUT_MS } from "../config.js";
import type { AnalysisResult } from "../types.js";
import { SYSTEM_PROMPT, userPrompt } from "./prompt.js";
import { analysisSchema } from "./schema.js";

export const MODEL = "claude-haiku-4-5-20251001";

// Lazy: only construct the SDK client if/when this provider is actually used.
// Lets the proxy boot without ANTHROPIC_API_KEY when LLM_PROVIDER=gemini.
let cached: Anthropic | null = null;
function client(): Anthropic {
  if (!cached) cached = new Anthropic();
  return cached;
}

export async function analyze(
  url: string,
  truncated: string,
  hints = "",
): Promise<AnalysisResult | null> {
  try {
    const response = await Promise.race([
      client().messages.create({
        model: MODEL,
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt(url, truncated, hints) }],
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("LLM timeout")), LLM_TIMEOUT_MS),
      ),
    ]);

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("");

    // Extract JSON from response (handles markdown code blocks).
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("[agentshield] LLM returned no JSON, failing open");
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return analysisSchema.parse(parsed);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[agentshield] Anthropic analysis failed (failing open): ${message}`);
    return null;
  }
}
