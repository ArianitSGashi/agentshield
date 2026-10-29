import type { AttackType, Verdict } from "../../proxy/src/types.js";

export type GroundTruth = Verdict;

export type ProviderId = "anthropic" | "gemini";

export type CascadeMode = "cascade" | "bare";

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
  mode: CascadeMode;
  predicted: Verdict | "unscanned";
  confidence: number | null;
  explanation: string;
  suspiciousSegments: string[];
  attackType: AttackType | null;
  latencyMs: number;
  contentBytes: number;
  // Cascade observability — null when running in `--bare` mode.
  heuristicSignalCount: number | null;
  hiddenSegmentCount: number | null;
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
  // The model the analyzer actually called, so a report can be traced back
  // to it (GEMINI_MODEL changes it without any code change).
  model: string;
  // Report file whose scanned results were reused by --resume, if any.
  resumedFrom: string | null;
  mode: CascadeMode;
  totalSamples: number;
  scanned: number;
  unscanned: number;
  accuracy: number;
  macroF1: number;
  perClass: PerClassMetrics[];
  confusion: ConfusionMatrix;
  latency: { p50: number; p95: number; mean: number };
  // Average number of heuristic signals per sample (null in bare mode).
  avgHeuristicSignals: number | null;
  results: SampleResult[];
}
