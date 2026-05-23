import { Link } from "react-router-dom"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Verdict } from "@/lib/types"
import { VERDICT_STYLES } from "@/lib/labels"

interface SummaryStripProps {
  counts: Record<Verdict, number>
  className?: string
  /**
   * If provided, chips act as in-place filter buttons instead of navigating.
   * `selected` highlights the active filter; clicking the active chip again
   * clears the filter (handled by the parent).
   */
  onSelect?: (verdict: Verdict | null) => void
  selected?: Verdict | null
}

const order: Verdict[] = ["safe", "suspicious", "malicious"]

export function SummaryStrip({
  counts,
  className,
  onSelect,
  selected,
}: SummaryStripProps) {
  const isInteractive = typeof onSelect === "function"

  return (
    <div className={cn("mb-4 flex flex-wrap items-center gap-2", className)}>
      {order.map((v) => {
        const s = VERDICT_STYLES[v]
        const isActive = selected === v
        const baseClasses = cn(
          "group inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs transition-all hover:opacity-90",
          s.surface,
          s.border,
          // Highlight the active chip with a thicker ring and a tiny lift.
          isActive && "ring-2 ring-offset-2 ring-offset-background",
          isActive && "ring-[color:var(--ring)]",
        )

        const body = (
          <>
            <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
            <span className="font-mono tabular-nums text-foreground">
              {counts[v]}
            </span>
            <span className={cn("uppercase tracking-wide", s.text)}>{v}</span>
          </>
        )

        if (isInteractive) {
          return (
            <button
              key={v}
              type="button"
              onClick={() => onSelect(isActive ? null : v)}
              className={baseClasses}
              aria-pressed={isActive}
            >
              {body}
            </button>
          )
        }

        return (
          <Link key={v} to={`/history?verdict=${v}`} className={baseClasses}>
            {body}
          </Link>
        )
      })}

      {isInteractive && selected ? (
        <button
          type="button"
          onClick={() => onSelect(null)}
          className="inline-flex items-center gap-1 rounded-md border border-border/80 bg-card/60 px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
        >
          <X className="h-3 w-3" />
          clear
        </button>
      ) : null}

      <span className="ml-auto text-xs text-muted-foreground">
        {isInteractive ? "in view · click to filter" : "in view · click to filter"}
      </span>
    </div>
  )
}
