import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { VerdictBanner } from "@/components/VerdictBanner"
import { AttackTypeBadge } from "@/components/AttackTypeBadge"
import { ScanStatusBadge } from "@/components/ScanStatusBadge"
import { CopyButton } from "@/components/CopyButton"
import { EmptyState } from "@/components/EmptyState"
import type { Scan } from "@/lib/types"
import { formatTimestamp } from "@/lib/format"

interface ScanDetailBodyProps {
  scan: Scan
}

/**
 * Shared body for /scans/:id (route) and ScanDetailModal (in-row). Stays
 * dumb / presentational so it can live in either container.
 */
export function ScanDetailBody({ scan }: ScanDetailBodyProps) {
  return (
    <>
      <VerdictBanner
        verdict={scan.verdict}
        confidence={scan.confidence}
        agentName={scan.agentName}
        timestamp={scan.timestamp}
      />

      {(scan.attackType || scan.scanStatus === "unscanned") && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {scan.attackType && <AttackTypeBadge attackType={scan.attackType} />}
          <ScanStatusBadge status={scan.scanStatus} />
        </div>
      )}

      <div className="mt-4 rounded-lg border border-border bg-card p-3">
        <div className="flex items-start gap-2">
          <div className="mt-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            URL
          </div>
          <div className="min-w-0 flex-1 break-all font-mono text-sm text-foreground/90">
            {scan.sourceUrl}
          </div>
          <CopyButton value={scan.sourceUrl} label="Copy URL" />
        </div>
        <div className="mt-1 pl-10 text-xs text-muted-foreground">
          analyzed in{" "}
          <span className="font-mono text-foreground/80">
            {scan.responseTimeMs} ms
          </span>
        </div>
      </div>

      <Separator className="my-6" />

      <section>
        <h2 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Analyzer explanation
        </h2>
        <Card className="border-border">
          <CardContent className="p-5">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
              {scan.explanation}
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="mt-6">
        <h2 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Suspicious segments
        </h2>
        {scan.suspiciousSegments && scan.suspiciousSegments.length > 0 ? (
          <div className="space-y-2">
            {scan.suspiciousSegments.map((seg, i) => (
              <pre
                key={i}
                className="overflow-x-auto whitespace-pre-wrap break-words rounded-md border border-amber-500/25 border-l-4 border-l-amber-400 bg-amber-500/5 p-3 font-mono text-xs leading-relaxed text-amber-100"
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
        <h2 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Metadata
        </h2>
        <Card className="border-border">
          <CardContent className="p-5">
            <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-xs sm:grid-cols-2">
              <MetaRow label="Scan ID" value={scan.id} mono />
              <MetaRow label="Content hash" value={scan.contentHash} mono />
              <MetaRow label="Scan status" value={scan.scanStatus} />
              <MetaRow label="Attack type" value={scan.attackType ?? "—"} />
              <MetaRow
                label="Timestamp"
                value={formatTimestamp(scan.timestamp)}
              />
              <MetaRow
                label="Created at"
                value={formatTimestamp(scan.createdAt)}
              />
            </dl>
          </CardContent>
        </Card>
      </section>
    </>
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
      <dd
        className={
          mono ? "break-all font-mono text-foreground/90" : "text-foreground/90"
        }
      >
        {value}
      </dd>
    </div>
  )
}
