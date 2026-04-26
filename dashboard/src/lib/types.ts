export type Verdict = "safe" | "suspicious" | "malicious"

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

export interface StatsResponse {
  totalScans: number
  threatsBlocked: number
  threatRate: number
  scansPerDay: ScanPerDay[]
}

export interface ScanListQuery {
  verdict?: Verdict
  page?: number
  limit?: number
}
