import { Link } from "react-router-dom"
import { cn } from "@/lib/utils"
import type { Verdict } from "@/lib/types"
import { VERDICT_STYLES } from "@/lib/labels"

interface SummaryStripProps {
  counts: Record<Verdict, number>
  className?: string
}

const order: Verdict[] = ["safe", "suspicious", "malicious"]

export function SummaryStrip({ counts, className }: SummaryStripProps) {
  return (
    <div className={cn("mb-4 flex flex-wrap items-center gap-2", className)}>
      {order.map((v) => {
        const s = VERDICT_STYLES[v]
        return (
          <Link
            key={v}
            to={`/history?verdict=${v}`}
            className={cn(
              "group inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs transition-colors hover:opacity-90",
              s.surface,
              s.border,
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
            <span className="font-mono tabular-nums text-foreground">
              {counts[v]}
            </span>
            <span className={cn("uppercase tracking-wide", s.text)}>{v}</span>
          </Link>
        )
      })}
      <span className="ml-auto text-xs text-muted-foreground">
        in view · click to filter
      </span>
    </div>
  )
}
