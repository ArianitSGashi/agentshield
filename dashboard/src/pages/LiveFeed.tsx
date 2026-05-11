import { useEffect, useMemo, useRef } from "react"
import { useSearchParams } from "react-router-dom"
import { Inbox, Radio } from "lucide-react"
import { PageHeader } from "@/components/PageHeader"
import { ScanRow } from "@/components/ScanRow"
import { ScanTableSkeleton } from "@/components/ScanTableSkeleton"
import { ErrorState } from "@/components/ErrorState"
import { EmptyState } from "@/components/EmptyState"
import { SummaryStrip } from "@/components/SummaryStrip"
import { ScanDetailModal } from "@/components/ScanDetailModal"
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
  const [params, setParams] = useSearchParams()
  const selected = params.get("scan")

  // scanStatus=scanned hides fail-open events from the main feed; they have
  // their own dedicated page at /unscanned.
  const { data, loading, error, refetch } = useScans({
    limit: 25,
    scanStatus: "scanned",
    pollIntervalMs: POLL_MS,
  })

  const seenRef = useRef<Set<string>>(new Set())
  const scans = data?.data ?? []

  useEffect(() => {
    for (const s of scans) seenRef.current.add(s.id)
  })

  const counts = useMemo(() => {
    const c: Record<Verdict, number> = { safe: 0, suspicious: 0, malicious: 0 }
    for (const s of scans) c[s.verdict]++
    return c
  }, [scans])

  const select = (id: string) => {
    const next = new URLSearchParams(params)
    next.set("scan", id)
    setParams(next, { replace: false })
  }
  const closeModal = () => {
    const next = new URLSearchParams(params)
    next.delete("scan")
    setParams(next, { replace: true })
  }

  return (
    <div>
      <PageHeader
        title="Live Feed"
        description="Real-time stream of scans. Polls every 5 seconds."
        actions={
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-50" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
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
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
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
                      onSelect={select}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      <ScanDetailModal scanId={selected} onClose={closeModal} />
    </div>
  )
}
