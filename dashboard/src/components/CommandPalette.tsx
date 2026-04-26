import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Activity, BarChart3, History as HistoryIcon, ShieldAlert, ShieldCheck, TriangleAlert } from "lucide-react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import { DialogTitle } from "@/components/ui/dialog"

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState("")
  const navigate = useNavigate()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const close = () => {
    setOpen(false)
    setValue("")
  }

  const go = (to: string) => {
    navigate(to)
    close()
  }

  const trimmed = value.trim()
  const looksLikeUuid = UUID_RE.test(trimmed)

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <DialogTitle className="sr-only">Command palette</DialogTitle>
      <CommandInput
        value={value}
        onValueChange={setValue}
        placeholder="Search pages, paste a scan ID, or run a filter…"
      />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>

        {looksLikeUuid && (
          <>
            <CommandGroup heading="Jump to scan">
              <CommandItem
                value={`open-scan-${trimmed}`}
                onSelect={() => go(`/scans/${trimmed}`)}
              >
                <ShieldCheck />
                Open scan <span className="font-mono text-xs text-muted-foreground">{trimmed}</span>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        <CommandGroup heading="Navigate">
          <CommandItem value="live feed" onSelect={() => go("/")}>
            <Activity />
            Live Feed
            <CommandShortcut>G L</CommandShortcut>
          </CommandItem>
          <CommandItem value="history" onSelect={() => go("/history")}>
            <HistoryIcon />
            History
            <CommandShortcut>G H</CommandShortcut>
          </CommandItem>
          <CommandItem value="stats" onSelect={() => go("/stats")}>
            <BarChart3 />
            Stats
            <CommandShortcut>G S</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Filter">
          <CommandItem
            value="show malicious scans"
            onSelect={() => go("/history?verdict=malicious")}
          >
            <ShieldAlert className="text-red-400" />
            Show malicious
          </CommandItem>
          <CommandItem
            value="show suspicious scans"
            onSelect={() => go("/history?verdict=suspicious")}
          >
            <TriangleAlert className="text-amber-400" />
            Show suspicious
          </CommandItem>
          <CommandItem
            value="show safe scans"
            onSelect={() => go("/history?verdict=safe")}
          >
            <ShieldCheck className="text-emerald-400" />
            Show safe
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
