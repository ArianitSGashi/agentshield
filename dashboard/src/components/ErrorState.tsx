import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ErrorStateProps {
  message: string
  onRetry?: () => void
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-rose-200 bg-rose-50 px-6 py-10 text-center">
      <AlertTriangle className="mb-3 h-5 w-5 text-rose-600" />
      <div className="text-sm font-medium text-rose-700">Something went wrong</div>
      <div className="mt-1 max-w-md text-xs text-muted-foreground">{message}</div>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          className="mt-4 border-rose-200 text-rose-700 hover:bg-rose-100"
          onClick={onRetry}
        >
          Retry
        </Button>
      )}
    </div>
  )
}
