import { describe, it, expect } from "vitest";
import { analysisSchema } from "./schema.js";

describe("analysisSchema", () => {
  const base = {
    verdict: "malicious" as const,
    confidence: 80,
    explanation: "x",
    suspiciousSegments: ["abc"],
  };

  it("accepts a real attackType for non-safe verdicts", () => {
    const parsed = analysisSchema.parse({ ...base, attackType: "exfil" });
    expect(parsed.attackType).toBe("exfil");
  });

  it("maps the 'none' sentinel to null", () => {
    const parsed = analysisSchema.parse({ ...base, attackType: "none" });
    expect(parsed.attackType).toBeNull();
  });

  it("treats null as null", () => {
    const parsed = analysisSchema.parse({ ...base, attackType: null });
    expect(parsed.attackType).toBeNull();
  });

  it("treats missing attackType as null (back-compat with older providers)", () => {
    const parsed = analysisSchema.parse({ ...base });
    expect(parsed.attackType).toBeNull();
  });

  it("clears attackType to null when verdict is safe, even if the model picked a category", () => {
    const parsed = analysisSchema.parse({
      ...base,
      verdict: "safe",
      attackType: "override",
    });
    expect(parsed.attackType).toBeNull();
  });

  it("rejects an unknown attackType string", () => {
    expect(() =>
      analysisSchema.parse({ ...base, attackType: "not-a-category" }),
    ).toThrow();
  });

  it("rejects out-of-range confidence", () => {
    expect(() => analysisSchema.parse({ ...base, confidence: 150 })).toThrow();
  });
});
