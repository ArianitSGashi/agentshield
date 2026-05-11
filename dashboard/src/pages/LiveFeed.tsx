import { useEffect, useMemo, useRef } from "react"
import { Inbox, Radio } from "lucide-react"
import { PageHeader } from "@/components/PageHeader"
import { ScanRow } from "@/components/ScanRow"
import { ScanTableSkeleton } from "@/components/ScanTableSkeleton"
import { ErrorState } from "@/components/ErrorState"
import { EmptyState } from "@/components/EmptyState"
import { SummaryStrip } from "@/components/SummaryStrip"
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useScans } from "@/hooks/useScans"
import { apiUrl } from "@/lib/api"
import type { Verdict } from "@/lib/types"

const POLL_MS = 5000

export function LiveFeed() {
  const { data, loading, error, refetch } = useScans({
    limit: 25,
    pollIntervalMs: POLL_MS,
  })

  const seenRef = useRef<Set<string>>(new Set())
  const scans = data?.data ?? []

  // After each render, mark the current scans as seen. On the next render
  // only genuinely new IDs will have isNew=true.
  useEffect(() => {
    for (const s of scans) seenRef.current.add(s.id)
  })

  const counts = useMemo(() => {
    const c: Record<Verdict, number> = { safe: 0, suspicious: 0, malicious: 0 }
    for (const s of scans) c[s.verdict]++
    return c
  }, [scans])

  return (
    <div>
      <PageHeader
        title="Live Feed"
        description="Real-time stream of scans. Polls every 5 seconds."
        actions={
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <Radio className="h-3.5 w-3.5" />
            live
          </div>
        }
      />

      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : (
        <>
          <SummaryStrip counts={counts} />
          <div className="rounded-md border border-border/80 bg-card/30">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[190px]">Timestamp</TableHead>
                  <TableHead className="w-[110px]">Verdict</TableHead>
                  <TableHead className="w-[160px]">Attack type</TableHead>
                  <TableHead>Source URL</TableHead>
                  <TableHead className="w-[140px]">Agent</TableHead>
                  <TableHead className="w-[90px] text-right">Confidence</TableHead>
                  <TableHead className="w-[90px] text-right">Latency</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && !data ? (
                  <ScanTableSkeleton rows={8} />
                ) : scans.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <td colSpan={7} className="p-0">
                      <EmptyState
                        className="m-4"
                        icon={<Inbox className="h-5 w-5" />}
                        title="No scans yet"
                        description={
                          <>
                            When the proxy analyzes a request, it will show up
                            here in real time.
                            <div className="mt-2 font-mono text-[11px] text-muted-foreground/80">
                              polling{" "}
                              <span className="text-foreground/80">
                                {apiUrl}/api/scans
                              </span>
                            </div>
                          </>
                        }
                      />
                    </td>
                  </TableRow>
                ) : (
                  scans.map((scan) => (
                    <ScanRow
                      key={scan.id}
                      scan={scan}
                      isNew={!seenRef.current.has(scan.id)}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  )
}
