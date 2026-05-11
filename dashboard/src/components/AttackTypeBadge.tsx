import { cn } from "@/lib/utils"
import type { AttackType } from "@/lib/types"
import { ATTACK_TYPE_META } from "@/lib/labels"

interface AttackTypeBadgeProps {
  attackType: AttackType
  className?: string
}

export function AttackTypeBadge({ attackType, className }: AttackTypeBadgeProps) {
  const meta = ATTACK_TYPE_META[attackType]
  return (
    <span
      title={meta.description}
      className={cn(
        "inline-flex items-center rounded-md border border-border/60 bg-muted/40 px-2 py-0.5 text-xs font-medium text-foreground/85",
        className,
      )}
    >
      {meta.label}
    </span>
  )
}
