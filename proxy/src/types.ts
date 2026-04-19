export type Verdict = "safe" | "suspicious" | "malicious";

export interface AnalysisResult {
  verdict: Verdict;
  confidence: number;
  explanation: string;
  suspiciousSegments: string[];
}

export interface ScanReport {
  sourceUrl: string;
  agentName: string;
  verdict: Verdict;
  confidence: number;
  explanation: string;
  suspiciousSegments: string[];
  contentHash: string;
  responseTimeMs: number;
}

export interface CachedScan {
  result: AnalysisResult;
  timestamp: number;
}
