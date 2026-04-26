import { api } from "@/lib/api"
import type { StatsResponse } from "@/lib/types"
import { useFetch, type UseFetchResult } from "./useFetch"

export function useStats(): UseFetchResult<StatsResponse> {
  return useFetch(() => api.getStats(), [])
}
