import { z } from "zod";

// The shape every provider must return. Validated after we parse JSON out
// of whatever the model emitted — defensive even when the API supports
// structured output natively, because the values still need range-checking.
//
// `attackType` accepts the literal string "none" alongside the real
// categories. Gemini's structured-output schema cannot express a nullable
// enum, so the shared prompt asks the model to emit "none" for safe
// verdicts; this transform maps "none" → null so both providers feed the
// same shape downstream. Anthropic emits either "none" or null and is
// handled identically.
export const analysisSchema = z
  .object({
    verdict: z.enum(["safe", "suspicious", "malicious"]),
    confidence: z.number().int().min(0).max(100),
    explanation: z.string(),
    suspiciousSegments: z.array(z.string()),
    attackType: z
      .enum([
        "override",
        "exfil",
        "code_injection",
        "jailbreak",
        "social_eng",
        "indirect_tool",
        "obfuscation",
        "other",
        "none",
      ])
      .nullish(),
  })
  .transform((v) => {
    const raw = v.attackType;
    // "none" or missing → null. Also clear attackType when verdict is
    // safe — models occasionally still pick a category even after
    // calling the content safe; the safest reading is "no attack".
    const attackType =
      v.verdict === "safe" || raw == null || raw === "none" ? null : raw;
    return { ...v, attackType };
  });
