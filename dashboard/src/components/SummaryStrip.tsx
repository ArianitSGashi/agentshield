import { Link } from "react-router-dom"
import { cn } from "@/lib/utils"
import type { Verdict } from "@/lib/types"

interface SummaryStripProps {
  counts: Record<Verdict, number>
  className?: string
}

const styles: Record<Verdict, { pill: string; dot: string; label: string }> = {
  safe: {
    pill: "border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10",
    dot: "bg-emerald-500",
    label: "text-emerald-400",
  },
  suspicious: {
    pill: "border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10",
    dot: "bg-amber-500",
    label: "text-amber-400",
  },
  malicious: {
    pill: "border-red-500/30 bg-red-500/5 hover:bg-red-500/10",
    dot: "bg-red-500",
    label: "text-red-400",
  },
}

const order: Verdict[] = ["safe", "suspicious", "malicious"]

export function SummaryStrip({ counts, className }: SummaryStripProps) {
  return (
    <div className={cn("mb-4 flex flex-wrap items-center gap-2", className)}>
      {order.map((v) => {
        const s = styles[v]
        return (
          <Link
            key={v}
            to={`/history?verdict=${v}`}
            className={cn(
              "group inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs transition-colors",
              s.pill
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
            <span className="font-mono tabular-nums text-foreground">
              {counts[v]}
            </span>
            <span className={cn("uppercase tracking-wide", s.label)}>{v}</span>
          </Link>
        )
      })}
      <span className="ml-auto text-xs text-muted-foreground">
        in view · click to filter
      </span>
    </div>
  )
}
