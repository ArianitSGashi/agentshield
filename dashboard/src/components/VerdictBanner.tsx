import { AlertOctagon, AlertTriangle, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Verdict } from "@/lib/types"
import { formatTimestamp } from "@/lib/format"

interface VerdictBannerProps {
  verdict: Verdict
  confidence: number
  agentName: string
  timestamp: string
}

const styles: Record<
  Verdict,
  {
    wrap: string
    title: string
    icon: React.ComponentType<{ className?: string }>
  }
> = {
  safe: {
    wrap: "border-emerald-500/30 bg-emerald-500/5",
    title: "text-emerald-400",
    icon: ShieldCheck,
  },
  suspicious: {
    wrap: "border-amber-500/30 bg-amber-500/5",
    title: "text-amber-400",
    icon: AlertTriangle,
  },
  malicious: {
    wrap: "border-red-500/40 bg-red-500/5",
    title: "text-red-400",
    icon: AlertOctagon,
  },
}

export function VerdictBanner({
  verdict,
  confidence,
  agentName,
  timestamp,
}: VerdictBannerProps) {
  // Safe verdicts get a subtle one-line treatment.
  if (verdict === "safe") {
    const Icon = styles.safe.icon
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-md border px-3 py-2 text-xs",
          styles.safe.wrap
        )}
      >
        <Icon className={cn("h-4 w-4", styles.safe.title)} />
        <span className={cn("font-medium uppercase tracking-wide", styles.safe.title)}>
          Safe
        </span>
        <span className="text-muted-foreground">
          · {confidence}% confidence · agent{" "}
          <span className="font-mono text-foreground/80">{agentName}</span> ·{" "}
          {formatTimestamp(timestamp)}
        </span>
      </div>
    )
  }

  const s = styles[verdict]
  const Icon = s.icon
  const word = verdict === "malicious" ? "Malicious" : "Suspicious"
  const summary =
    verdict === "malicious"
      ? "The analyzer flagged this content as a prompt injection attempt."
      : "The analyzer flagged this content as potentially instruction-like."

  return (
    <div className={cn("rounded-md border p-4", s.wrap)}>
      <div className="flex items-start gap-3">
        <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", s.title)} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span
              className={cn(
                "text-lg font-semibold uppercase tracking-wide",
                s.title
              )}
            >
              {word}
            </span>
            <span className="font-mono text-xs tabular-nums text-muted-foreground">
              {confidence}% confidence
            </span>
          </div>
          <div className="mt-1 text-sm text-foreground/90">{summary}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            agent{" "}
            <span className="font-mono text-foreground/80">{agentName}</span> ·{" "}
            {formatTimestamp(timestamp)}
          </div>
        </div>
      </div>
    </div>
  )
}
