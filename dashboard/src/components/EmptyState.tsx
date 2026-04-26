import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
  title: string
  description?: ReactNode
  icon?: ReactNode
  className?: string
}

export function EmptyState({ title, description, icon, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-md border border-dashed border-border/80 bg-card/40 px-6 py-12 text-center",
        className
      )}
    >
      {icon && <div className="mb-3 text-muted-foreground">{icon}</div>}
      <div className="text-sm font-medium text-foreground">{title}</div>
      {description && (
        <div className="mt-1 max-w-md text-xs text-muted-foreground">
          {description}
        </div>
      )}
    </div>
  )
}
