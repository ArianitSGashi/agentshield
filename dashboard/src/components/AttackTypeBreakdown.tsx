import type { AttackTypeCount } from "@/lib/types"
import { ATTACK_TYPE_COLOR, ATTACK_TYPE_META } from "@/lib/labels"
import { Card, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/EmptyState"

interface AttackTypeBreakdownProps {
  rows: AttackTypeCount[]
}

// Horizontal bar list. Easier to read than a donut at the small counts we
// expect during a thesis demo, and degrades gracefully to the empty state
// before the first attack is recorded.
export function AttackTypeBreakdown({ rows }: AttackTypeBreakdownProps) {
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
      <CardContent className="p-5">
        <ul className="space-y-3">
          {rows.map((row) => {
            const meta = ATTACK_TYPE_META[row.attackType]
            const color = ATTACK_TYPE_COLOR[row.attackType]
            const pct = max === 0 ? 0 : (row.count / max) * 100
            return (
              <li key={row.attackType}>
                <div className="flex items-baseline justify-between gap-3">
                  <span
                    className="text-sm font-medium text-foreground/90"
                    title={meta.description}
                  >
                    {meta.label}
                  </span>
                  <span className="font-mono text-xs tabular-nums text-muted-foreground">
                    {row.count}
                  </span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted/50">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, backgroundColor: color }}
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
