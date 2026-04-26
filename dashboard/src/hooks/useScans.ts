import { api } from "@/lib/api"
import type { ScanListQuery, ScanListResponse } from "@/lib/types"
import { useFetch, type UseFetchResult } from "./useFetch"

interface UseScansOptions extends ScanListQuery {
  pollIntervalMs?: number
}

export function useScans(
  options: UseScansOptions = {}
): UseFetchResult<ScanListResponse> {
  const { pollIntervalMs, verdict, page, limit } = options
  return useFetch(
    () => api.listScans({ verdict, page, limit }),
    [verdict, page, limit],
    { pollMs: pollIntervalMs }
  )
}
