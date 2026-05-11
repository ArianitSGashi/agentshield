import { cn } from "@/lib/utils"
import type { Verdict } from "@/lib/types"
import { VERDICT_STYLES } from "@/lib/labels"

interface VerdictBadgeProps {
  verdict: Verdict
  className?: string
}

export function VerdictBadge({ verdict, className }: VerdictBadgeProps) {
  const s = VERDICT_STYLES[verdict]
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium uppercase tracking-wide",
        s.surface,
        s.border,
        s.text,
        className,
      )}
    >
      {verdict}
    </span>
  )
}
