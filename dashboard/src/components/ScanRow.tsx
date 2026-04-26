import { useNavigate } from "react-router-dom"
import { TableCell, TableRow } from "@/components/ui/table"
import { VerdictBadge } from "@/components/VerdictBadge"
import { formatTimestamp, truncateUrl } from "@/lib/format"
import type { Scan } from "@/lib/types"
import { cn } from "@/lib/utils"

interface ScanRowProps {
  scan: Scan
  isNew?: boolean
}

export function ScanRow({ scan, isNew }: ScanRowProps) {
  const navigate = useNavigate()

  return (
    <TableRow
      onClick={() => navigate(`/scans/${scan.id}`)}
      className={cn(
        "cursor-pointer",
        isNew && "animate-in fade-in slide-in-from-top-1 duration-500"
      )}
    >
      <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
        {formatTimestamp(scan.timestamp)}
      </TableCell>
      <TableCell>
        <VerdictBadge verdict={scan.verdict} />
      </TableCell>
      <TableCell className="font-mono text-xs text-foreground/90 max-w-[520px] truncate">
        {truncateUrl(scan.sourceUrl, 80)}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {scan.agentName}
      </TableCell>
      <TableCell className="text-right font-mono text-xs tabular-nums">
        {scan.confidence}%
      </TableCell>
      <TableCell className="text-right font-mono text-xs tabular-nums text-muted-foreground">
        {scan.responseTimeMs} ms
      </TableCell>
    </TableRow>
  )
}
