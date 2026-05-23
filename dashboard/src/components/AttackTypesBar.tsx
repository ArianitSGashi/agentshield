import { useEffect, useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/EmptyState"
import { cn } from "@/lib/utils"
import type { AttackType, AttackTypeCount } from "@/lib/types"
import { ATTACK_TYPE_COLOR, ATTACK_TYPE_META } from "@/lib/labels"

interface AttackTypesBarProps {
  rows: AttackTypeCount[]
  className?: string
}

/**
 * Horizontal stacked bar that splits the flagged total into one colored
 * segment per attack class. Sized proportionally and animated on mount so
 * the segments slide out from the left.
 *
 * Hover is bidirectional: hovering a bar segment highlights the matching
 * legend row, and hovering a legend row highlights its segment in the bar.
 * Both routes dim the non-focused items so it's easy to single out one
 * category without losing the surrounding context.
 */
export function AttackTypesBar({ rows, className }: AttackTypesBarProps) {
  const total = useMemo(() => rows.reduce((s, r) => s + r.count, 0), [rows])
  const sorted = useMemo(
    () => [...rows].sort((a, b) => b.count - a.count),
    [rows],
  )
  const [focused, setFocused] = useState<AttackType | null>(null)

  // Two-pass render so the segment widths animate from 0 → target instead
  // of appearing already filled.
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [sorted])

  return (
    <Card className={cn("card-interactive border-border", className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-medium text-foreground">Attack types</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {sorted.length} categor{sorted.length === 1 ? "y" : "ies"} ·{" "}
              {total} flagged
            </p>
          </div>
          {focused && (
            <div className="text-right">
              <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Focused
              </div>
              <div className="text-xs font-medium text-foreground">
                {ATTACK_TYPE_META[focused].label}
              </div>
            </div>
          )}
        </div>

        {sorted.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="No attacks classified yet"
              description="The breakdown will populate once the analyzer flags suspicious or malicious content."
            />
          </div>
        ) : (
          <>
            {/* Stacked bar. Each segment carries an inner highlight gradient
                so it reads as more than a flat block. The thin gap between
                segments comes from a tiny border in the card background
                color. */}
            <div
              className="mt-5 flex h-5 w-full overflow-hidden rounded-full bg-muted/40 shadow-inner"
              onMouseLeave={() => setFocused(null)}
            >
              {sorted.map((r) => {
                const pct = total === 0 ? 0 : (r.count / total) * 100
                const isFocused = focused === r.attackType
                const dim = focused != null && !isFocused
                const color = ATTACK_TYPE_COLOR[r.attackType]
                return (
                  <button
                    key={r.attackType}
                    type="button"
                    onMouseEnter={() => setFocused(r.attackType)}
                    onFocus={() => setFocused(r.attackType)}
                    onBlur={() => setFocused(null)}
                    aria-label={`${ATTACK_TYPE_META[r.attackType].label}: ${r.count} (${Math.round(pct)}%)`}
                    style={{
                      width: mounted ? `${pct}%` : "0%",
                      backgroundColor: color,
                      transition:
                        "width 800ms cubic-bezier(0.22,1,0.36,1), opacity 180ms ease, filter 180ms ease, transform 180ms ease",
                      opacity: dim ? 0.35 : 1,
                      filter: isFocused
                        ? "brightness(1.1) saturate(1.1)"
                        : "none",
                      transformOrigin: "center",
                      transform: isFocused ? "scaleY(1.12)" : "scaleY(1)",
                    }}
                    className={cn(
                      "relative h-full border-r border-card/60 last:border-r-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-card",
                    )}
                  >
                    {/* Soft top highlight so the segment doesn't look flat. */}
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-0 rounded-[inherit]"
                      style={{
                        backgroundImage:
                          "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, transparent 55%)",
                      }}
                    />
                  </button>
                )
              })}
            </div>

            {/* Tick rail under the bar — small marks at 0/25/50/75/100% give
                the eye a scale without crowding the chart. */}
            <div className="mt-1 flex justify-between px-0.5 text-[10px] font-mono tabular-nums text-muted-foreground/70">
              <span>0%</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>

            {/* Two-column legend. Each row is hover-linked to its bar
                segment via the shared `focused` state. */}
            <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
              {sorted.map((r) => {
                const meta = ATTACK_TYPE_META[r.attackType]
                const color = ATTACK_TYPE_COLOR[r.attackType]
                const pct = total === 0 ? 0 : Math.round((r.count / total) * 100)
                const isFocused = focused === r.attackType
                const dim = focused != null && !isFocused
                return (
                  <li
                    key={r.attackType}
                    onMouseEnter={() => setFocused(r.attackType)}
                    onMouseLeave={() => setFocused(null)}
                    className={cn(
                      "group flex min-w-0 cursor-default items-center gap-2 rounded-md px-1.5 py-0.5 transition-all duration-150",
                      dim ? "opacity-45" : "opacity-100",
                      isFocused && "bg-accent/60",
                    )}
                    title={meta.description}
                  >
                    <span
                      className={cn(
                        "h-2 w-2 shrink-0 rounded-full transition-transform duration-150",
                        isFocused && "scale-125",
                      )}
                      style={{ backgroundColor: color }}
                    />
                    <span className="min-w-0 flex-1 truncate text-foreground/90">
                      {meta.label}
                    </span>
                    <span className="font-mono tabular-nums text-foreground">
                      {r.count}
                    </span>
                    <span className="w-8 text-right font-mono tabular-nums text-muted-foreground">
                      {pct}%
                    </span>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  )
}
