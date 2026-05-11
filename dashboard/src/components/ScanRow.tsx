import { useNavigate } from "react-router-dom"
import { TableCell, TableRow } from "@/components/ui/table"
import { VerdictBadge } from "@/components/VerdictBadge"
import { ScanStatusBadge } from "@/components/ScanStatusBadge"
import { formatTimestamp, truncateUrl } from "@/lib/format"
import type { Scan } from "@/lib/types"
import { ATTACK_TYPE_META } from "@/lib/labels"
import { cn } from "@/lib/utils"

interface ScanRowProps {
  scan: Scan
  isNew?: boolean
}

export function ScanRow({ scan, isNew }: ScanRowProps) {
  const navigate = useNavigate()
  const unscanned = scan.scanStatus === "unscanned"

  return (
    <TableRow
      onClick={() => navigate(`/scans/${scan.id}`)}
      className={cn(
        "cursor-pointer",
        isNew && "animate-in fade-in slide-in-from-top-1 duration-500",
      )}
    >
      <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
        {formatTimestamp(scan.timestamp)}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1.5">
          {unscanned ? (
            <ScanStatusBadge status="unscanned" />
          ) : (
            <VerdictBadge verdict={scan.verdict} />
          )}
        </div>
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">
        {scan.attackType ? ATTACK_TYPE_META[scan.attackType].label : "—"}
      </TableCell>
      <TableCell className="font-mono text-xs text-foreground/90 max-w-[420px] truncate">
        {truncateUrl(scan.sourceUrl, 70)}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {scan.agentName}
      </TableCell>
      <TableCell className="text-right font-mono text-xs tabular-nums">
        {unscanned ? "—" : `${scan.confidence}%`}
      </TableCell>
      <TableCell className="text-right font-mono text-xs tabular-nums text-muted-foreground">
        {scan.responseTimeMs} ms
      </TableCell>
    </TableRow>
  )
}
