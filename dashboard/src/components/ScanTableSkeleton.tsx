import { Skeleton } from "@/components/ui/skeleton"
import { TableCell, TableRow } from "@/components/ui/table"

interface ScanTableSkeletonProps {
  rows?: number
}

export function ScanTableSkeleton({ rows = 6 }: ScanTableSkeletonProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={i} className="hover:bg-transparent">
          <TableCell><Skeleton className="h-3 w-40" /></TableCell>
          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
          <TableCell><Skeleton className="h-3 w-80" /></TableCell>
          <TableCell><Skeleton className="h-3 w-24" /></TableCell>
          <TableCell className="text-right"><Skeleton className="ml-auto h-3 w-10" /></TableCell>
          <TableCell className="text-right"><Skeleton className="ml-auto h-3 w-12" /></TableCell>
        </TableRow>
      ))}
    </>
  )
}
