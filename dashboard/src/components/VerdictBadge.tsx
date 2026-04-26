import { cn } from "@/lib/utils"
import type { Verdict } from "@/lib/types"

interface VerdictBadgeProps {
  verdict: Verdict
  className?: string
}

const styles: Record<Verdict, string> = {
  safe: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  suspicious: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  malicious: "border-red-500/30 bg-red-500/10 text-red-400",
}

export function VerdictBadge({ verdict, className }: VerdictBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium uppercase tracking-wide",
        styles[verdict],
        className
      )}
    >
      {verdict}
    </span>
  )
}
