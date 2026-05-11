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
  onSelect?: (id: string) => void
}

export function ScanRow({ scan, isNew, onSelect }: ScanRowProps) {
  const unscanned = scan.scanStatus === "unscanned"

  return (
    <TableRow
      onClick={() => onSelect?.(scan.id)}
      className={cn(
        "cursor-pointer transition-colors duration-150 hover:bg-accent/60",
        isNew && "animate-in fade-in slide-in-from-top-1 duration-500",
      )}
    >
      <TableCell className="py-3.5 font-mono text-xs text-muted-foreground whitespace-nowrap">
        {formatTimestamp(scan.timestamp)}
      </TableCell>
      <TableCell className="py-3.5">
        <div className="flex items-center gap-1.5">
          {unscanned ? (
            <ScanStatusBadge status="unscanned" />
          ) : (
            <VerdictBadge verdict={scan.verdict} />
          )}
        </div>
      </TableCell>
      <TableCell className="py-3.5 text-xs text-muted-foreground">
        {scan.attackType ? ATTACK_TYPE_META[scan.attackType].label : "—"}
      </TableCell>
      <TableCell className="max-w-[420px] truncate py-3.5 font-mono text-xs text-foreground/90">
        {truncateUrl(scan.sourceUrl, 70)}
      </TableCell>
      <TableCell className="py-3.5 text-sm text-muted-foreground">
        {scan.agentName}
      </TableCell>
      <TableCell className="py-3.5 text-right font-mono text-xs tabular-nums">
        {unscanned ? "—" : `${scan.confidence}%`}
      </TableCell>
      <TableCell className="py-3.5 text-right font-mono text-xs tabular-nums text-muted-foreground">
        {scan.responseTimeMs} ms
      </TableCell>
    </TableRow>
  )
}
