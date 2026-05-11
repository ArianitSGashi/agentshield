import { Link, useParams } from "react-router-dom"
import { ArrowLeft, FileQuestion } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { VerdictBanner } from "@/components/VerdictBanner"
import { AttackTypeBadge } from "@/components/AttackTypeBadge"
import { ScanStatusBadge } from "@/components/ScanStatusBadge"
import { CopyButton } from "@/components/CopyButton"
import { ErrorState } from "@/components/ErrorState"
import { EmptyState } from "@/components/EmptyState"
import { useScanDetail } from "@/hooks/useScanDetail"
import { formatTimestamp } from "@/lib/format"

export function ScanDetail() {
  const { id } = useParams<{ id: string }>()
  const { data, loading, error, notFound } = useScanDetail(id)

  return (
    <div>
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="-ml-2 h-7 px-2 text-muted-foreground">
          <Link to="/history">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to history
          </Link>
        </Button>
      </div>

      {loading ? (
        <ScanDetailSkeleton />
      ) : error ? (
        <ErrorState message={error} />
      ) : notFound || !data ? (
        <EmptyState
          icon={<FileQuestion className="h-5 w-5" />}
          title="Scan not found"
          description="This scan may have been removed, or the id is invalid."
        />
      ) : (
        <>
          <VerdictBanner
            verdict={data.verdict}
            confidence={data.confidence}
            agentName={data.agentName}
            timestamp={data.timestamp}
          />

          {(data.attackType || data.scanStatus === "unscanned") && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {data.attackType && <AttackTypeBadge attackType={data.attackType} />}
              <ScanStatusBadge status={data.scanStatus} />
            </div>
          )}

          <div className="mt-4 rounded-md border border-border/80 bg-card/30 p-3">
            <div className="flex items-start gap-2">
              <div className="mt-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                URL
              </div>
              <div className="min-w-0 flex-1 break-all font-mono text-sm text-foreground/90">
                {data.sourceUrl}
              </div>
              <CopyButton value={data.sourceUrl} label="Copy URL" />
            </div>
            <div className="mt-1 pl-10 text-xs text-muted-foreground">
              analyzed in{" "}
              <span className="font-mono text-foreground/80">
                {data.responseTimeMs} ms
              </span>
            </div>
          </div>

          <Separator className="my-6" />

          <section>
            <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Analyzer explanation
            </h2>
            <Card className="border-border/80">
              <CardContent className="p-5">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                  {data.explanation}
                </p>
              </CardContent>
            </Card>
          </section>

          <section className="mt-6">
            <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Suspicious segments
            </h2>
            {data.suspiciousSegments && data.suspiciousSegments.length > 0 ? (
              <div className="space-y-2">
                {data.suspiciousSegments.map((seg, i) => (
                  <pre
                    key={i}
                    className="overflow-x-auto whitespace-pre-wrap break-words rounded-md border border-border/80 border-l-2 border-l-amber-500/70 bg-card/50 p-3 font-mono text-xs leading-relaxed text-amber-100/90"
                  >
                    {seg}
                  </pre>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No segments flagged"
                description="The analyzer did not extract specific suspicious substrings for this scan."
              />
            )}
          </section>

          <section className="mt-6">
            <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Metadata
            </h2>
            <Card className="border-border/80">
              <CardContent className="p-5">
                <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-xs sm:grid-cols-2">
                  <MetaRow label="Scan ID" value={data.id} mono />
                  <MetaRow label="Content hash" value={data.contentHash} mono />
                  <MetaRow label="Scan status" value={data.scanStatus} />
                  <MetaRow
                    label="Attack type"
                    value={data.attackType ?? "—"}
                  />
                  <MetaRow
                    label="Timestamp"
                    value={formatTimestamp(data.timestamp)}
                  />
                  <MetaRow
                    label="Created at"
                    value={formatTimestamp(data.createdAt)}
                  />
                </dl>
              </CardContent>
            </Card>
          </section>
        </>
      )}
    </div>
  )
}

interface MetaRowProps {
  label: string
  value: string
  mono?: boolean
}

function MetaRow({ label, value, mono }: MetaRowProps) {
  return (
    <div className="flex gap-2">
      <dt className="w-32 shrink-0 text-muted-foreground">{label}</dt>
      <dd className={mono ? "break-all font-mono text-foreground/90" : "text-foreground/90"}>
        {value}
      </dd>
    </div>
  )
}

function ScanDetailSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="mt-6 h-32 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  )
}
