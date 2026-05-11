import { Link, useParams } from "react-router-dom"
import { ArrowLeft, FileQuestion } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ScanDetailBody } from "@/components/ScanDetailBody"
import { ErrorState } from "@/components/ErrorState"
import { EmptyState } from "@/components/EmptyState"
import { useScanDetail } from "@/hooks/useScanDetail"

export function ScanDetail() {
  const { id } = useParams<{ id: string }>()
  const { data, loading, error, notFound } = useScanDetail(id)

  return (
    <div>
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="-ml-2 h-7 px-2 text-muted-foreground"
        >
          <Link to="/history">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to history
          </Link>
        </Button>
      </div>

      {loading ? (
        <ScanDetailSkeleton />
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
  )
}

function ScanDetailSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="mt-6 h-32 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  )
}
