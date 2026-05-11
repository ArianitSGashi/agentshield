export type Verdict = "safe" | "suspicious" | "malicious";

export type AttackType =
  | "override"
  | "exfil"
  | "code_injection"
  | "jailbreak"
  | "social_eng"
  | "indirect_tool"
  | "obfuscation"
  | "other";

export type ScanStatus = "scanned" | "unscanned";

export interface AnalysisResult {
  verdict: Verdict;
  confidence: number;
  explanation: string;
  suspiciousSegments: string[];
  // Populated when verdict is suspicious or malicious. Null for safe content.
  attackType: AttackType | null;
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
  attackType: AttackType | null;
  // 'scanned' for normal analyzer-produced rows; 'unscanned' for fail-open
  // events where the LLM call failed and the body was passed through.
  scanStatus: ScanStatus;
}

export interface CachedScan {
  result: AnalysisResult;
  timestamp: number;
}
