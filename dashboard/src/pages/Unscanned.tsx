import { useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { ChevronLeft, ChevronRight, WifiOff } from "lucide-react"
import { PageHeader } from "@/components/PageHeader"
import { ScanRow } from "@/components/ScanRow"
import { ScanTableSkeleton } from "@/components/ScanTableSkeleton"
import { ErrorState } from "@/components/ErrorState"
import { EmptyState } from "@/components/EmptyState"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ScanDetailModal } from "@/components/ScanDetailModal"
import { useScans } from "@/hooks/useScans"

const PAGE_SIZE = 25

export function Unscanned() {
  const [params, setParams] = useSearchParams()
  const [page, setPage] = useState(1)

  const query = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      scanStatus: "unscanned" as const,
    }),
    [page],
  )

  const { data, loading, error, refetch } = useScans(query)
  const scans = data?.data ?? []
  const pagination = data?.pagination

  const selected = params.get("scan")
  const select = (id: string) => {
    const next = new URLSearchParams(params)
    next.set("scan", id)
    setParams(next)
  }
  const closeModal = () => {
    const next = new URLSearchParams(params)
    next.delete("scan")
    setParams(next, { replace: true })
  }

  return (
    <div>
      <PageHeader
        title="Unscanned"
        description="Fetches the analyzer could not reach in time. Content was passed through to the agent without analysis."
      />

      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="w-[190px]">Timestamp</TableHead>
                  <TableHead className="w-[110px]">Status</TableHead>
                  <TableHead className="w-[160px]">Attack type</TableHead>
                  <TableHead>Source URL</TableHead>
                  <TableHead className="w-[140px]">Agent</TableHead>
                  <TableHead className="w-[90px] text-right">Confidence</TableHead>
                  <TableHead className="w-[90px] text-right">Latency</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && !data ? (
                  <ScanTableSkeleton rows={10} />
                ) : scans.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <td colSpan={7} className="p-0">
                      <EmptyState
                        className="m-4"
                        icon={<WifiOff className="h-5 w-5" />}
                        title="All clear"
                        description="No unscanned fetches recorded. The analyzer reached every page the proxy intercepted."
                      />
                    </td>
                  </TableRow>
                ) : (
                  scans.map((scan) => (
                    <ScanRow key={scan.id} scan={scan} onSelect={select} />
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {pagination && pagination.total > 0 && (
            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
              <div>
                Showing{" "}
                <span className="font-mono tabular-nums text-foreground">
                  {(pagination.page - 1) * pagination.limit + 1}–
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total,
                  )}
                </span>{" "}
                of{" "}
                <span className="font-mono tabular-nums text-foreground">
                  {pagination.total}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Prev
                </Button>
                <span className="font-mono tabular-nums text-foreground">
                  {pagination.page} / {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <ScanDetailModal scanId={selected} onClose={closeModal} />
    </div>
  )
}
