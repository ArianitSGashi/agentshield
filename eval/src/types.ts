import type { Verdict } from "../../proxy/src/types.js";

export type GroundTruth = Verdict;

export type ProviderId = "anthropic" | "gemini";

export interface CorpusSample {
  id: string;
  file: string;
  label: GroundTruth;
  description: string;
  source: string;
}

export interface SampleResult {
  sample: CorpusSample;
  provider: ProviderId;
  predicted: Verdict | "unscanned";
  confidence: number | null;
  explanation: string;
  suspiciousSegments: string[];
  latencyMs: number;
  contentBytes: number;
  error: string | null;
}

export interface ConfusionMatrix {
  // rows = actual, columns = predicted
  rows: Verdict[];
  cols: Array<Verdict | "unscanned">;
  counts: number[][];
}

export interface PerClassMetrics {
  label: Verdict;
  precision: number;
  recall: number;
  f1: number;
  support: number;
}

export interface ProviderReport {
  provider: ProviderId;
  totalSamples: number;
  scanned: number;
  unscanned: number;
  accuracy: number;
  macroF1: number;
  perClass: PerClassMetrics[];
  confusion: ConfusionMatrix;
  latency: { p50: number; p95: number; mean: number };
  results: SampleResult[];
}
