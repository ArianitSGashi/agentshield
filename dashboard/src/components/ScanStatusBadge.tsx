import { cn } from "@/lib/utils"
import type { ScanStatus } from "@/lib/types"

interface ScanStatusBadgeProps {
  status: ScanStatus
  className?: string
}

// Distinct from VerdictBadge on purpose: "unscanned" is an operational outcome
// ("we couldn't reach the LLM"), not a security classification. Coloring it
// neutral grey keeps it clearly separate from the safe-green / malicious-red
// scale.
export function ScanStatusBadge({ status, className }: ScanStatusBadgeProps) {
  if (status === "scanned") return null
  return (
    <span
      title="The analyzer could not reach the LLM for this fetch; the content was passed through unanalyzed."
      className={cn(
        "inline-flex items-center rounded-md border border-border/60 bg-muted/40 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-muted-foreground",
        className,
      )}
    >
      unscanned
    </span>
  )
}
