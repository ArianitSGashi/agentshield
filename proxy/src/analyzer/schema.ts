import { z } from "zod";

// The shape every provider must return. Validated after we parse JSON out
// of whatever the model emitted — defensive even when the API supports
// structured output natively, because the values still need range-checking.
export const analysisSchema = z.object({
  verdict: z.enum(["safe", "suspicious", "malicious"]),
  confidence: z.number().int().min(0).max(100),
  explanation: z.string(),
  suspiciousSegments: z.array(z.string()),
});
