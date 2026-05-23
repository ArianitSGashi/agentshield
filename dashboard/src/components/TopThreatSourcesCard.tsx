import { Link } from "react-router-dom"
import { ArrowUpRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/EmptyState"
import { truncateUrl } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { TopThreatSource } from "@/lib/types"

interface TopThreatSourcesCardProps {
  sources: TopThreatSource[]
  className?: string
}

/**
 * Ranked list of the URLs that have been flagged the most times. Each entry
 * deep-links into History pre-filtered to that URL, so the user can drill
 * down from a high-level view into the underlying scans.
 */
export function TopThreatSourcesCard({
  sources,
  className,
}: TopThreatSourcesCardProps) {
  const max = sources.reduce((m, s) => Math.max(m, s.threats), 0)

  return (
    <Card className={cn("card-interactive border-border", className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-medium text-foreground">
              Top threat sources
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              URLs flagged most often. Click to drill down.
            </p>
          </div>
        </div>

        {sources.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="No flagged URLs yet"
              description="Suspicious or malicious URLs will appear here as the proxy logs them."
            />
          </div>
        ) : (
          <ol className="mt-4 space-y-2">
            {sources.map((s, i) => {
              const pct = max === 0 ? 0 : (s.threats / max) * 100
              return (
                <li key={s.sourceUrl}>
                  <Link
                    to={`/history?q=${encodeURIComponent(s.sourceUrl)}`}
                    className="group block rounded-md border border-transparent px-2 py-1.5 transition-colors hover:border-border hover:bg-accent/40"
                  >
                    <div className="flex items-center gap-2 text-xs">
                      <span className="w-5 shrink-0 font-mono tabular-nums text-muted-foreground">
                        #{i + 1}
                      </span>
                      <span className="min-w-0 flex-1 truncate font-mono text-foreground/90">
                        {truncateUrl(s.sourceUrl, 60)}
                      </span>
                      <span className="font-mono tabular-nums text-rose-600 dark:text-rose-300">
                        {s.threats}
                      </span>
                      <ArrowUpRight className="h-3 w-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                    <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted/40">
                      <div
                        className="h-full rounded-full bg-rose-500/70 transition-all duration-700 dark:bg-rose-400/70"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </Link>
                </li>
              )
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  )
}
