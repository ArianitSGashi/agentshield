import { useEffect, useState } from "react"
import type { AttackTypeCount } from "@/lib/types"
import { ATTACK_TYPE_COLOR, ATTACK_TYPE_META } from "@/lib/labels"
import { Card, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/EmptyState"

interface AttackTypeBreakdownProps {
  rows: AttackTypeCount[]
}

// Horizontal bar list with bars that grow in on first render so the
// breakdown feels alive when the page mounts. Each bar also responds to
// hover with a soft brightness lift.
export function AttackTypeBreakdown({ rows }: AttackTypeBreakdownProps) {
  // Two-pass render so the bars animate from 0% → target on mount instead
  // of appearing already filled.
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [rows])

  if (rows.length === 0) {
    return (
      <EmptyState
        title="No attacks classified yet"
        description="The breakdown will populate once the analyzer flags suspicious or malicious content with an attack type."
      />
    )
  }
  const max = rows.reduce((m, r) => Math.max(m, r.count), 0)

  return (
    <Card className="border-border">
      <CardContent className="p-6">
        <ul className="space-y-4">
          {rows.map((row) => {
            const meta = ATTACK_TYPE_META[row.attackType]
            const color = ATTACK_TYPE_COLOR[row.attackType]
            const pct = max === 0 ? 0 : (row.count / max) * 100
            return (
              <li key={row.attackType} className="group">
                <div className="flex items-baseline justify-between gap-3">
                  <span
                    className="text-sm font-medium text-foreground/90 transition-colors group-hover:text-foreground"
                    title={meta.description}
                  >
                    {meta.label}
                  </span>
                  <span className="font-mono text-xs tabular-nums text-muted-foreground">
                    {row.count}
                  </span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted/60">
                  <div
                    className="h-full rounded-full transition-all duration-[900ms] ease-out group-hover:brightness-125"
                    style={{
                      width: mounted ? `${pct}%` : "0%",
                      backgroundColor: color,
                      boxShadow: `0 0 12px -4px ${color}`,
                    }}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}
