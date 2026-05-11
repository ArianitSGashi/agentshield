import { GoogleGenAI, Type } from "@google/genai";
import { LLM_TIMEOUT_MS } from "../config.js";
import type { AnalysisResult } from "../types.js";
import { SYSTEM_PROMPT, userPrompt } from "./prompt.js";
import { analysisSchema } from "./schema.js";

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

// Lazy client construction — see anthropic.ts for rationale.
let cached: GoogleGenAI | null = null;
function client(): GoogleGenAI {
  if (!cached) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
    cached = new GoogleGenAI({ apiKey });
  }
  return cached;
}

// Native structured-output schema. Gemini guarantees the response parses as
// this shape, which removes the need for the JSON-out-of-markdown regex we
// use for Anthropic. We still run the zod schema afterward to range-check
// `confidence` and enforce the enum.
const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    verdict: { type: Type.STRING, enum: ["safe", "suspicious", "malicious"] },
    confidence: { type: Type.INTEGER, minimum: 0, maximum: 100 },
    explanation: { type: Type.STRING },
    suspiciousSegments: { type: Type.ARRAY, items: { type: Type.STRING } },
    // Nullable enum. Gemini's structured output doesn't have a first-class
    // nullable type, so we model it as an enum that includes a "none"
    // sentinel; the zod schema downstream maps "none" → null. The model is
    // instructed in the system prompt to use "none" for safe verdicts.
    attackType: {
      type: Type.STRING,
      enum: [
        "override",
        "exfil",
        "code_injection",
        "jailbreak",
        "social_eng",
        "indirect_tool",
        "obfuscation",
        "other",
        "none",
      ],
    },
  },
  required: ["verdict", "confidence", "explanation", "suspiciousSegments", "attackType"],
  propertyOrdering: [
    "verdict",
    "confidence",
    "explanation",
    "suspiciousSegments",
    "attackType",
  ],
} as const;

export async function analyze(url: string, truncated: string): Promise<AnalysisResult | null> {
  try {
    const response = await Promise.race([
      client().models.generateContent({
        model: MODEL,
        contents: userPrompt(url, truncated),
        config: {
          systemInstruction: SYSTEM_PROMPT,
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA,
          // Disable thinking entirely. Gemini 2.5 models burn "thinking"
          // tokens against maxOutputTokens before producing the answer; for
          // a short JSON classification we want every token reserved for
          // output, not internal reasoning. Without this, the response is
          // truncated mid-string ("Unterminated string in JSON at position X").
          thinkingConfig: { thinkingBudget: 0 },
          // Generous ceiling for the JSON body. Real responses are ~200-500
          // tokens; the headroom protects against unusually long
          // suspiciousSegments arrays on big pages.
          maxOutputTokens: 2048,
          // Lower temperature for a classification task. Gemini Flash defaults
          // to 1.0 which is too creative for "is this an attack, yes/no."
          temperature: 0.2,
        },
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("LLM timeout")), LLM_TIMEOUT_MS),
      ),
    ]);

    const text = response.text;
    if (!text) {
      console.error("[agentshield] Gemini returned empty response, failing open");
      return null;
    }

    const raw = JSON.parse(text);
    // Map the "none" sentinel to null so it matches the analyzer's
    // null-or-enum contract. We do this here (not in zod) so the schema can
    // stay shared with Anthropic, which natively emits null.
    if (raw && raw.attackType === "none") raw.attackType = null;
    return analysisSchema.parse(raw);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[agentshield] Gemini analysis failed (failing open): ${message}`);
    return null;
  }
}
