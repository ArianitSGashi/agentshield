import { BrowserRouter, Route, Routes } from "react-router-dom"
import { Layout } from "@/components/Layout"
import { LiveFeed } from "@/pages/LiveFeed"
import { History } from "@/pages/History"
import { Stats } from "@/pages/Stats"
import { ScanDetail } from "@/pages/ScanDetail"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<LiveFeed />} />
          <Route path="history" element={<History />} />
          <Route path="stats" element={<Stats />} />
          <Route path="scans/:id" element={<ScanDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
