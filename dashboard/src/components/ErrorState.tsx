import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ErrorStateProps {
  message: string
  onRetry?: () => void
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-rose-500/25 bg-rose-500/5 px-6 py-10 text-center">
      <AlertTriangle className="mb-3 h-5 w-5 text-rose-300" />
      <div className="text-sm font-medium text-rose-200">Something went wrong</div>
      <div className="mt-1 max-w-md text-xs text-muted-foreground">{message}</div>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          className="mt-4 border-rose-500/30 text-rose-200 hover:bg-rose-500/10"
          onClick={onRetry}
        >
          Retry
        </Button>
      )}
    </div>
  )
}
