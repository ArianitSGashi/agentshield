import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { Layout } from "@/components/Layout"
import { LiveFeed } from "@/pages/LiveFeed"
import { History } from "@/pages/History"
import { Stats } from "@/pages/Stats"
import { ScanDetail } from "@/pages/ScanDetail"
import { Unscanned } from "@/pages/Unscanned"
import { ThemeProvider } from "@/components/ThemeProvider"

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Stats />} />
            <Route path="live" element={<LiveFeed />} />
            <Route path="history" element={<History />} />
            <Route path="unscanned" element={<Unscanned />} />
            <Route path="scans/:id" element={<ScanDetail />} />
            {/* Back-compat: old /stats links land on the new home. */}
            <Route path="stats" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}
