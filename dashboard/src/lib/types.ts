export type Verdict = "safe" | "suspicious" | "malicious"

export type AttackType =
  | "override"
  | "exfil"
  | "code_injection"
  | "jailbreak"
  | "social_eng"
  | "indirect_tool"
  | "obfuscation"
  | "other"

export type ScanStatus = "scanned" | "unscanned"

export interface Scan {
  id: string
  timestamp: string
  sourceUrl: string
  agentName: string
  verdict: Verdict
  confidence: number
  explanation: string
  suspiciousSegments: string[] | null
  contentHash: string
  responseTimeMs: number
  scanStatus: ScanStatus
  attackType: AttackType | null
  createdAt: string
}

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface ScanListResponse {
  data: Scan[]
  pagination: Pagination
}

export interface ScanPerDay {
  date: string
  count: number
}

export interface AttackTypeCount {
  attackType: AttackType
  count: number
}

export interface AgentBreakdown {
  agentName: string
  count: number
  threats: number
}

export interface TopThreatSource {
  sourceUrl: string
  threats: number
}

export interface StatsResponse {
  totalScans: number
  threatsBlocked: number
  threatRate: number
  unscanned: number
  avgResponseTimeMs: number
  scansPerDay: ScanPerDay[]
  attackTypes: AttackTypeCount[]
  verdictBreakdown: Record<Verdict, number>
  agents: AgentBreakdown[]
  topThreatSources: TopThreatSource[]
}

export interface ScanListQuery {
  verdict?: Verdict
  q?: string
  page?: number
  limit?: number
  attackType?: AttackType
  scanStatus?: ScanStatus
  agentName?: string
}
