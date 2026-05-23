import { Moon, Sun } from "lucide-react"
import { useTheme } from "@/components/ThemeProvider"
import { cn } from "@/lib/utils"

interface ThemeToggleProps {
  className?: string
}

/**
 * Two-state switch (Light / Dark) styled as a segmented control. The active
 * pill slides between sides with a transform — matches the rest of the
 * sidebar's subtle motion vocabulary.
 */
export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()
  const isDark = theme === "dark"

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className={cn(
        "relative flex w-full rounded-md border border-sidebar-border bg-sidebar-accent/60 p-0.5",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute top-0.5 bottom-0.5 left-0.5 w-[calc(50%-2px)] rounded-[5px] bg-background shadow-[0_1px_2px_rgba(0,0,0,0.25)] transition-transform duration-200 ease-out",
          isDark && "translate-x-[calc(100%+2px)]",
        )}
      />
      <button
        type="button"
        role="radio"
        aria-checked={!isDark}
        onClick={() => setTheme("light")}
        className={cn(
          "relative z-10 inline-flex flex-1 items-center justify-center gap-1.5 rounded-[5px] px-2 py-1 text-[11px] font-medium transition-colors",
          !isDark
            ? "text-sidebar-foreground"
            : "text-muted-foreground hover:text-sidebar-foreground/80",
        )}
      >
        <Sun className="h-3 w-3" />
        Light
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={isDark}
        onClick={() => setTheme("dark")}
        className={cn(
          "relative z-10 inline-flex flex-1 items-center justify-center gap-1.5 rounded-[5px] px-2 py-1 text-[11px] font-medium transition-colors",
          isDark
            ? "text-sidebar-foreground"
            : "text-muted-foreground hover:text-sidebar-foreground/80",
        )}
      >
        <Moon className="h-3 w-3" />
        Dark
      </button>
    </div>
  )
}
