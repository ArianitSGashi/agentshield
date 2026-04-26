import { api, ApiError } from "@/lib/api"
import type { Scan } from "@/lib/types"
import { useFetch } from "./useFetch"

interface UseScanDetailResult {
  data: Scan | null
  loading: boolean
  error: string | null
  notFound: boolean
}

export function useScanDetail(id: string | undefined): UseScanDetailResult {
  const { data, loading, error, refetch } = useFetch<Scan | null>(
    async () => {
      if (!id) throw new Error("Missing scan id")
      try {
        return await api.getScan(id)
      } catch (err) {
        // Surface 404 as a successful "not found" payload instead of an error.
        if (err instanceof ApiError && err.status === 404) return null
        throw err
      }
    },
    [id]
  )

  void refetch
  return {
    data,
    loading,
    error,
    notFound: !loading && !error && data === null && !!id,
  }
}
