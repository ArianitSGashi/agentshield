import type {
  Scan,
  ScanListQuery,
  ScanListResponse,
  StatsResponse,
} from "./types"

const API_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:3000").replace(
  /\/$/,
  ""
)

export const apiUrl = API_URL

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    })
  } catch (err) {
    // Network/CORS/DNS errors — backend likely unreachable.
    throw new ApiError(0, err instanceof Error ? err.message : "Network error")
  }

  if (!res.ok) {
    let message = res.statusText
    try {
      const body = await res.json()
      if (body?.error) message = body.error
    } catch {
      // ignore
    }
    throw new ApiError(res.status, message)
  }

  return res.json() as Promise<T>
}

export const api = {
  listScans: (query: ScanListQuery = {}) => {
    const qs = new URLSearchParams()
    if (query.verdict) qs.set("verdict", query.verdict)
    if (query.q) qs.set("q", query.q)
    if (query.page) qs.set("page", String(query.page))
    if (query.limit) qs.set("limit", String(query.limit))
    if (query.attackType) qs.set("attackType", query.attackType)
    if (query.scanStatus) qs.set("scanStatus", query.scanStatus)
    if (query.agentName) qs.set("agentName", query.agentName)
    const s = qs.toString()
    return request<ScanListResponse>(`/api/scans${s ? `?${s}` : ""}`)
  },
  getScan: (id: string) => request<Scan>(`/api/scans/${id}`),
  getStats: () => request<StatsResponse>(`/api/stats`),
}
