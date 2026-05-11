import { Outlet, useLocation } from "react-router-dom"
import { Sidebar } from "@/components/Sidebar"
import { CommandPalette } from "@/components/CommandPalette"

export function Layout() {
  const location = useLocation()
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 overflow-x-hidden">
        {/* `key` forces a remount on route change so the page-enter
         * animation runs every time you navigate. */}
        <div
          key={location.pathname}
          className="page-enter mx-auto max-w-[1400px] px-8 py-8"
        >
          <Outlet />
        </div>
      </main>
      <CommandPalette />
    </div>
  )
}
