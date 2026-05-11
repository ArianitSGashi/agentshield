import { z } from "zod";

// The shape every provider must return. Validated after we parse JSON out
// of whatever the model emitted — defensive even when the API supports
// structured output natively, because the values still need range-checking.
//
// `attackType` is nullable: when verdict is safe, the model is instructed
// to return null. Providers that don't yet emit the field at all are
// tolerated via the .nullish() — older provider code paths still parse.
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
      ])
      .nullish(),
  })
  .transform((v) => ({
    ...v,
    // Normalize: missing/undefined → null. Also clear attackType when verdict
    // is safe — the LLM occasionally hallucinates an attack label even after
    // calling the content safe; the safest reading is "no attack".
    attackType: v.verdict === "safe" ? null : v.attackType ?? null,
  }));
