import { NavLink } from "react-router-dom"
import {
  Activity,
  History as HistoryIcon,
  BarChart3,
  ShieldCheck,
  WifiOff,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  to: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const navItems: NavItem[] = [
  { to: "/", label: "Live Feed", icon: Activity },
  { to: "/history", label: "History", icon: HistoryIcon },
  { to: "/stats", label: "Stats", icon: BarChart3 },
  { to: "/unscanned", label: "Unscanned", icon: WifiOff },
]

const isMac =
  typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/.test(navigator.platform)

export function Sidebar() {
  return (
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Brand. Cobalt ring on the shield gives the rail a single focal point. */}
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 ring-1 ring-primary/40">
          <ShieldCheck className="h-4 w-4 text-primary" />
        </span>
        <span className="font-display text-base font-semibold tracking-tight text-sidebar-foreground">
          AgentShield
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 p-3">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/75 transition-all duration-200",
                "hover:bg-sidebar-accent hover:text-sidebar-foreground",
                isActive &&
                  "bg-sidebar-accent text-sidebar-foreground font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
              )
            }
          >
            {({ isActive }) => (
              <>
                {/* Cobalt marker on the active item. */}
                <span
                  aria-hidden
                  className={cn(
                    "absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-primary transition-all duration-200",
                    isActive ? "opacity-100" : "opacity-0 scale-y-50",
                  )}
                />
                <Icon
                  className={cn(
                    "h-4 w-4 transition-colors",
                    isActive
                      ? "text-primary"
                      : "text-sidebar-foreground/55 group-hover:text-sidebar-foreground/90",
                  )}
                />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-sidebar-border px-5 py-4 text-xs text-muted-foreground">
        <div className="flex items-center justify-between">
          <span className="font-mono tabular-nums">v0.0.1</span>
          <span className="inline-flex items-center gap-1 text-muted-foreground/80">
            <kbd className="rounded-md border border-sidebar-border bg-sidebar-accent px-1.5 py-0.5 font-mono text-[10px] text-sidebar-foreground/90">
              {isMac ? "⌘" : "Ctrl"}
            </kbd>
            <kbd className="rounded-md border border-sidebar-border bg-sidebar-accent px-1.5 py-0.5 font-mono text-[10px] text-sidebar-foreground/90">
              K
            </kbd>
          </span>
        </div>
      </div>
    </aside>
  )
}
