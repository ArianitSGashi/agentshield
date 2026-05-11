import { AlertOctagon, AlertTriangle, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Verdict } from "@/lib/types"
import { VERDICT_STYLES } from "@/lib/labels"
import { formatTimestamp } from "@/lib/format"

interface VerdictBannerProps {
  verdict: Verdict
  confidence: number
  agentName: string
  timestamp: string
}

const ICONS: Record<Verdict, React.ComponentType<{ className?: string }>> = {
  safe: ShieldCheck,
  suspicious: AlertTriangle,
  malicious: AlertOctagon,
}

export function VerdictBanner({
  verdict,
  confidence,
  agentName,
  timestamp,
}: VerdictBannerProps) {
  const s = VERDICT_STYLES[verdict]
  const Icon = ICONS[verdict]

  // Safe verdicts get a subtle one-line treatment.
  if (verdict === "safe") {
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-md border px-3 py-2 text-xs",
          s.surface,
          s.border,
        )}
      >
        <Icon className={cn("h-4 w-4", s.text)} />
        <span className={cn("font-medium uppercase tracking-wide", s.text)}>
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

  const word = verdict === "malicious" ? "Malicious" : "Suspicious"
  const summary =
    verdict === "malicious"
      ? "The analyzer flagged this content as a prompt injection attempt."
      : "The analyzer flagged this content as potentially instruction-like."

  return (
    <div className={cn("rounded-lg border p-4", s.surface, s.border)}>
      <div className="flex items-start gap-3">
        <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", s.text)} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span
              className={cn(
                "text-lg font-semibold uppercase tracking-wide",
                s.text,
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
