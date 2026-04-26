import { useCallback, useEffect, useRef, useState } from "react"
import { ApiError } from "@/lib/api"

export interface UseFetchResult<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export interface UseFetchOptions {
  pollMs?: number
}

function formatError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 0)
      return "Unable to reach backend. Is it running on the API URL?"
    return `API error (${err.status}): ${err.message}`
  }
  return "Unexpected error"
}

export function useFetch<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  deps: unknown[],
  options: UseFetchOptions = {}
): UseFetchResult<T> {
  const { pollMs } = options
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const run = useCallback(async () => {
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    try {
      const result = await fetcher(ctrl.signal)
      if (ctrl.signal.aborted) return
      setData(result)
      setError(null)
    } catch (err) {
      if (ctrl.signal.aborted) return
      setError(formatError(err))
    } finally {
      if (!ctrl.signal.aborted) setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    setLoading(true)
    run()
    if (!pollMs) return
    const id = setInterval(run, pollMs)
    return () => {
      clearInterval(id)
      abortRef.current?.abort()
    }
  }, [run, pollMs])

  return { data, loading, error, refetch: run }
}
