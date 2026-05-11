import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { ChevronLeft, ChevronRight, Inbox, Search, X } from "lucide-react"
import { PageHeader } from "@/components/PageHeader"
import { ScanRow } from "@/components/ScanRow"
import { ScanTableSkeleton } from "@/components/ScanTableSkeleton"
import { ErrorState } from "@/components/ErrorState"
import { EmptyState } from "@/components/EmptyState"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ScanDetailModal } from "@/components/ScanDetailModal"
import { useScans } from "@/hooks/useScans"
import type { Verdict } from "@/lib/types"
import { cn } from "@/lib/utils"

type VerdictFilter = "all" | Verdict
const VERDICT_VALUES: VerdictFilter[] = ["all", "safe", "suspicious", "malicious"]

const PAGE_SIZE = 25

function isVerdictFilter(v: string | null): v is VerdictFilter {
  return !!v && VERDICT_VALUES.includes(v as VerdictFilter)
}

export function History() {
  const [params, setParams] = useSearchParams()
  const urlVerdict = params.get("verdict")
  const verdict: VerdictFilter = isVerdictFilter(urlVerdict) ? urlVerdict : "all"

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  // Debounce the search input so we don't hammer the API on every keystroke.
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [agent, setAgent] = useState<string>("all")

  useEffect(() => {
    setPage(1)
  }, [verdict, debouncedSearch])

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search.trim()), 250)
    return () => clearTimeout(id)
  }, [search])

  const query = useMemo(
    () => ({
      verdict: verdict === "all" ? undefined : verdict,
      q: debouncedSearch || undefined,
      page,
      limit: PAGE_SIZE,
      // History excludes fail-open events by default; they have their own
      // /unscanned page so they don't dilute the security signal here.
      scanStatus: "scanned" as const,
    }),
    [verdict, debouncedSearch, page]
  )

  const { data, loading, error, refetch } = useScans(query)
  const raw = data?.data ?? []
  const pagination = data?.pagination

  const agentOptions = useMemo(() => {
    const set = new Set<string>()
    for (const s of raw) set.add(s.agentName)
    return Array.from(set).sort()
  }, [raw])

  // Agent filter still runs client-side over the current page — agent
  // names are low-cardinality and the alternative (a server endpoint
  // for distinct agents) is overkill for a thesis.
  const filtered = useMemo(
    () => (agent === "all" ? raw : raw.filter((s) => s.agentName === agent)),
    [raw, agent],
  )

  const setVerdictParam = (v: VerdictFilter) => {
    const next = new URLSearchParams(params)
    if (v === "all") next.delete("verdict")
    else next.set("verdict", v)
    setParams(next, { replace: true })
  }

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

  const activePills: { key: string; label: string; clear: () => void }[] = []
  if (verdict !== "all")
    activePills.push({
      key: "verdict",
      label: `verdict: ${verdict}`,
      clear: () => setVerdictParam("all"),
    })
  if (agent !== "all")
    activePills.push({
      key: "agent",
      label: `agent: ${agent}`,
      clear: () => setAgent("all"),
    })
  if (debouncedSearch)
    activePills.push({
      key: "search",
      label: `url: "${debouncedSearch}"`,
      clear: () => setSearch(""),
    })

  return (
    <div>
      <PageHeader
        title="History"
        description="All scans recorded by the proxy."
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by URL…"
            className="h-8 w-[260px] pl-8 text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Verdict</span>
          <Select
            value={verdict}
            onValueChange={(v) => setVerdictParam(v as VerdictFilter)}
          >
            <SelectTrigger className="h-8 w-[140px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="safe">Safe</SelectItem>
              <SelectItem value="suspicious">Suspicious</SelectItem>
              <SelectItem value="malicious">Malicious</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Agent</span>
          <Select value={agent} onValueChange={setAgent}>
            <SelectTrigger className="h-8 w-[160px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {agentOptions.map((a) => (
                <SelectItem key={a} value={a}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {activePills.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Active:</span>
          {activePills.map((p) => (
            <button
              key={p.key}
              onClick={p.clear}
              className={cn(
                "group inline-flex items-center gap-1 rounded-md border border-border/80 bg-card/60 px-2 py-0.5 text-xs text-foreground/90 transition-colors hover:bg-card"
              )}
            >
              <span className="font-mono tabular-nums">{p.label}</span>
              <X className="h-3 w-3 text-muted-foreground group-hover:text-foreground" />
            </button>
          ))}
        </div>
      )}

      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
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
                  <ScanTableSkeleton rows={10} />
                ) : filtered.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <td colSpan={7} className="p-0">
                      <EmptyState
                        className="m-4"
                        icon={<Inbox className="h-5 w-5" />}
                        title="No scans match these filters"
                        description="Try a different verdict, clear the URL search, or wait for the proxy to log new scans."
                      />
                    </td>
                  </TableRow>
                ) : (
                  filtered.map((scan) => (
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
                    pagination.total
                  )}
                </span>{" "}
                of{" "}
                <span className="font-mono tabular-nums text-foreground">
                  {pagination.total}
                </span>
                {agent !== "all" && (
                  <span className="ml-2 text-muted-foreground/80">
                    ({filtered.length} after agent filter)
                  </span>
                )}
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
