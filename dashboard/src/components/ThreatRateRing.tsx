import { cn } from "@/lib/utils"

interface ThreatRateRingProps {
  percent: number
  size?: number
  className?: string
}

export function ThreatRateRing({
  percent,
  size = 76,
  className,
}: ThreatRateRingProps) {
  const clamped = Math.max(0, Math.min(100, percent))
  const stroke = 5
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c - (clamped / 100) * c

  const ringColor =
    clamped >= 20
      ? "stroke-red-400"
      : clamped >= 5
        ? "stroke-amber-400"
        : "stroke-emerald-400"

  const textColor =
    clamped >= 20
      ? "text-red-400"
      : clamped >= 5
        ? "text-amber-400"
        : "text-emerald-400"

  return (
    <div
      className={cn("relative inline-flex shrink-0", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Threat rate ${clamped}%`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="block"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          className="stroke-border/60"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className={ringColor}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span
        className={cn(
          "absolute inset-0 flex items-center justify-center font-mono text-xl font-semibold tabular-nums leading-none",
          textColor
        )}
      >
        {clamped}%
      </span>
    </div>
  )
}
