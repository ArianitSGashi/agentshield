import { api } from "@/lib/api"
import type { ScanListQuery, ScanListResponse } from "@/lib/types"
import { useFetch, type UseFetchResult } from "./useFetch"

interface UseScansOptions extends ScanListQuery {
  pollIntervalMs?: number
}

export function useScans(
  options: UseScansOptions = {},
): UseFetchResult<ScanListResponse> {
  const { pollIntervalMs, verdict, q, page, limit, attackType, scanStatus } =
    options
  return useFetch(
    () => api.listScans({ verdict, q, page, limit, attackType, scanStatus }),
    [verdict, q, page, limit, attackType, scanStatus],
    { pollMs: pollIntervalMs },
  )
}
