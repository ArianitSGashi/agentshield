import { Outlet } from "react-router-dom"
import { Sidebar } from "@/components/Sidebar"
import { CommandPalette } from "@/components/CommandPalette"

export function Layout() {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 overflow-x-hidden">
        <div className="mx-auto max-w-[1400px] px-6 py-6">
          <Outlet />
        </div>
      </main>
      <CommandPalette />
    </div>
  )
}
