import { NavLink } from "react-router-dom"
import { Activity, History, BarChart3, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  to: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const navItems: NavItem[] = [
  { to: "/", label: "Live Feed", icon: Activity },
  { to: "/history", label: "History", icon: History },
  { to: "/stats", label: "Stats", icon: BarChart3 },
]

const isMac =
  typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/.test(navigator.platform)

export function Sidebar() {
  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4">
        <ShieldCheck className="h-5 w-5 text-sidebar-primary" />
        <span className="text-sm font-semibold tracking-tight text-sidebar-foreground">
          AgentShield
        </span>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-2">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isActive &&
                  "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-sidebar-border px-4 py-3 text-xs text-muted-foreground">
        <div className="flex items-center justify-between">
          <span>v0.0.1</span>
          <span className="inline-flex items-center gap-1 text-muted-foreground/80">
            <kbd className="rounded border border-sidebar-border bg-sidebar-accent/60 px-1.5 py-0.5 font-mono text-[10px] text-sidebar-foreground">
              {isMac ? "⌘" : "Ctrl"}
            </kbd>
            <kbd className="rounded border border-sidebar-border bg-sidebar-accent/60 px-1.5 py-0.5 font-mono text-[10px] text-sidebar-foreground">
              K
            </kbd>
          </span>
        </div>
      </div>
    </aside>
  )
}
