import { useEffect } from "react"
import { ExternalLink, FileQuestion } from "lucide-react"
import { Link } from "react-router-dom"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ScanDetailBody } from "@/components/ScanDetailBody"
import { EmptyState } from "@/components/EmptyState"
import { ErrorState } from "@/components/ErrorState"
import { useScanDetail } from "@/hooks/useScanDetail"

interface ScanDetailModalProps {
  scanId: string | null
  onClose: () => void
}

/**
 * Modal that loads a scan by id and renders the same body the standalone
 * /scans/:id page renders. The `scanId` driver is a controlled prop so the
 * caller can lift the state into a URL search param (and the URL stays
 * shareable).
 */
export function ScanDetailModal({ scanId, onClose }: ScanDetailModalProps) {
  const { data, loading, error, notFound } = useScanDetail(scanId ?? undefined)

  // Close on Esc — Radix dialog already handles this; this guard exists so
  // a network error doesn't leave the modal stuck.
  useEffect(() => {
    if (error) {
      // intentionally no auto-close — let the user read the error
    }
  }, [error])

  return (
    <Dialog open={!!scanId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-3xl gap-0 overflow-hidden border-border bg-card p-0 sm:max-w-3xl"
      >
        <DialogHeader className="border-b border-border px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <DialogTitle className="font-display text-lg font-semibold tracking-tight">
              Scan detail
            </DialogTitle>
            {scanId && (
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <Link to={`/scans/${scanId}`} onClick={onClose}>
                  Open full page
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="max-h-[75vh] overflow-y-auto px-6 py-5">
          {loading ? (
            <ModalSkeleton />
          ) : error ? (
            <ErrorState message={error} />
          ) : notFound || !data ? (
            <EmptyState
              icon={<FileQuestion className="h-5 w-5" />}
              title="Scan not found"
              description="This scan may have been removed, or the id is invalid."
            />
          ) : (
            <ScanDetailBody scan={data} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ModalSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-20 w-full" />
    </div>
  )
}
