import { ArrowDown, ArrowRight, ArrowUp } from "lucide-react"
import type { ReactNode } from "react"
import { Area, AreaChart, ResponsiveContainer } from "recharts"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type Tone = "default" | "warn" | "danger" | "good"

interface Delta {
  pct: number
  // If true, a decreasing value is the desirable direction (e.g. threat rate).
  lowerIsBetter?: boolean
}

interface StatCardProps {
  label: string
  value: ReactNode
  hint?: string
  tone?: Tone
  sparkline?: number[]
  delta?: Delta
  aside?: ReactNode
  className?: string
}

const toneStyles: Record<Tone, string> = {
  default: "text-foreground",
  warn: "text-amber-400",
  danger: "text-red-400",
  good: "text-emerald-400",
}

const toneStroke: Record<Tone, string> = {
  default: "oklch(0.78 0.02 240)",
  warn: "oklch(0.78 0.16 85)",
  danger: "oklch(0.7 0.2 25)",
  good: "oklch(0.75 0.15 150)",
}

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
  sparkline,
  delta,
  aside,
  className,
}: StatCardProps) {
  const sparkData = sparkline?.map((v, i) => ({ i, v })) ?? []
  const strokeColor = toneStroke[tone]

  return (
    <Card className={cn("border-border/80", className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {label}
            </div>
            <div
              className={cn(
                "mt-2 font-mono text-3xl font-semibold tabular-nums leading-none",
                toneStyles[tone]
              )}
            >
              {value}
            </div>
            {(delta || hint) && (
              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                {delta && <DeltaPill delta={delta} />}
                {hint && <span>{hint}</span>}
              </div>
            )}
          </div>
          {aside && <div className="shrink-0">{aside}</div>}
        </div>

        {sparkData.length > 1 && (
          <div className="mt-3 h-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={sparkData}
                margin={{ top: 2, right: 0, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id={`spark-${label}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor={strokeColor} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke={strokeColor}
                  strokeWidth={1.5}
                  fill={`url(#spark-${label})`}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function DeltaPill({ delta }: { delta: Delta }) {
  const { pct, lowerIsBetter } = delta
  const rounded = Math.round(pct)
  const up = rounded > 0
  const down = rounded < 0
  const flat = rounded === 0
  const good = (up && !lowerIsBetter) || (down && lowerIsBetter)
  const color = flat
    ? "text-muted-foreground"
    : good
      ? "text-emerald-400"
      : "text-red-400"
  const Icon = flat ? ArrowRight : up ? ArrowUp : ArrowDown
  const sign = up ? "+" : ""
  return (
    <span className={cn("inline-flex items-center gap-0.5 font-mono tabular-nums", color)}>
      <Icon className="h-3 w-3" />
      {sign}
      {rounded}% vs last week
    </span>
  )
}
