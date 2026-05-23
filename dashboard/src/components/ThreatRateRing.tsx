import { cn } from "@/lib/utils"

interface ThreatRateRingProps {
  percent: number
  size?: number
  className?: string
}

export function ThreatRateRing({
  percent,
  size = 84,
  className,
}: ThreatRateRingProps) {
  const clamped = Math.max(0, Math.min(100, percent))
  const stroke = 6
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c - (clamped / 100) * c

  // Threshold-tinted stroke; the % readout always reads cobalt for legibility
  // with a tiny color hint via a glow filter on the active arc.
  const ringClass =
    clamped >= 20
      ? "stroke-rose-500 dark:stroke-rose-400"
      : clamped >= 5
        ? "stroke-amber-500 dark:stroke-amber-300"
        : "stroke-emerald-500 dark:stroke-emerald-300"

  const glow =
    clamped >= 20
      ? "drop-shadow(0 0 6px rgba(244,63,94,0.55))"
      : clamped >= 5
        ? "drop-shadow(0 0 6px rgba(217,119,6,0.5))"
        : "drop-shadow(0 0 6px rgba(16,185,129,0.5))"

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
          className="stroke-border"
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
          className={cn(ringClass, "transition-[stroke-dashoffset] duration-700 ease-out")}
          style={{ filter: glow }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span
        className={cn(
          "absolute inset-0 flex items-center justify-center font-display text-xl font-semibold tabular-nums leading-none text-foreground",
        )}
      >
        {clamped}%
      </span>
    </div>
  )
}
