import type {
  ConfusionMatrix,
  PerClassMetrics,
  SampleResult,
} from "./types.js";
import type { Verdict } from "../../proxy/src/types.js";

const LABELS: Verdict[] = ["safe", "suspicious", "malicious"];

export function buildConfusionMatrix(results: SampleResult[]): ConfusionMatrix {
  const rows = LABELS;
  const cols: Array<Verdict | "unscanned"> = [...LABELS, "unscanned"];
  const counts: number[][] = rows.map(() => cols.map(() => 0));

  for (const r of results) {
    const ri = rows.indexOf(r.sample.label);
    const ci = cols.indexOf(r.predicted);
    if (ri >= 0 && ci >= 0) counts[ri][ci] += 1;
  }
  return { rows, cols, counts };
}

function safeDiv(a: number, b: number): number {
  return b === 0 ? 0 : a / b;
}

export function perClassMetrics(results: SampleResult[]): PerClassMetrics[] {
  // Only scanned samples count toward precision/recall. Unscanned predictions
  // are counted separately (the provider failed open). They neither help nor
  // hurt the classifier's measured accuracy on the labels it actually emitted.
  const scanned = results.filter((r) => r.predicted !== "unscanned");

  return LABELS.map((label) => {
    let tp = 0;
    let fp = 0;
    let fn = 0;
    let support = 0;

    for (const r of scanned) {
      const actual = r.sample.label;
      const pred = r.predicted as Verdict;
      if (actual === label) support += 1;
      if (pred === label && actual === label) tp += 1;
      else if (pred === label && actual !== label) fp += 1;
      else if (pred !== label && actual === label) fn += 1;
    }

    const precision = safeDiv(tp, tp + fp);
    const recall = safeDiv(tp, tp + fn);
    const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);
    return { label, precision, recall, f1, support };
  });
}

export function accuracy(results: SampleResult[]): number {
  const scanned = results.filter((r) => r.predicted !== "unscanned");
  if (scanned.length === 0) return 0;
  const correct = scanned.filter((r) => r.predicted === r.sample.label).length;
  return correct / scanned.length;
}

export function macroF1(perClass: PerClassMetrics[]): number {
  if (perClass.length === 0) return 0;
  return perClass.reduce((sum, c) => sum + c.f1, 0) / perClass.length;
}

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

export function latencyStats(results: SampleResult[]): { p50: number; p95: number; mean: number } {
  const lats = results
    .filter((r) => r.error === null)
    .map((r) => r.latencyMs)
    .sort((a, b) => a - b);
  if (lats.length === 0) return { p50: 0, p95: 0, mean: 0 };
  const mean = lats.reduce((s, v) => s + v, 0) / lats.length;
  return {
    p50: Math.round(quantile(lats, 0.5)),
    p95: Math.round(quantile(lats, 0.95)),
    mean: Math.round(mean),
  };
}
