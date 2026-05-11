import { useMemo } from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts"
import { PageHeader } from "@/components/PageHeader"
import { StatCard } from "@/components/StatCard"
import { ThreatRateRing } from "@/components/ThreatRateRing"
import { AttackTypeBreakdown } from "@/components/AttackTypeBreakdown"
import { ErrorState } from "@/components/ErrorState"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { useStats } from "@/hooks/useStats"
import type { ScanPerDay } from "@/lib/types"

const chartConfig = {
  count: { label: "Scans", color: "oklch(0.62 0.1 255)" },
} satisfies ChartConfig

function fill30Days(rows: ScanPerDay[]) {
  const map = new Map(rows.map((r) => [r.date.slice(0, 10), r.count]))
  const out: { date: string; count: number }[] = []
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today)
    d.setUTCDate(d.getUTCDate() - i)
    const key = d.toISOString().slice(0, 10)
    out.push({ date: key, count: map.get(key) ?? 0 })
  }
  return out
}

// Week-over-week delta (%). Negative means this week is lower than the prior week.
function weekDelta(values: number[]): number {
  if (values.length < 14) return 0
  const recent = values.slice(-7).reduce((a, b) => a + b, 0)
  const prior = values.slice(-14, -7).reduce((a, b) => a + b, 0)
  if (prior === 0) return recent === 0 ? 0 : 100
  return ((recent - prior) / prior) * 100
}

export function Stats() {
  const { data, loading, error } = useStats()

  const chartData = useMemo(() => fill30Days(data?.scansPerDay ?? []), [data])
  const spark14 = useMemo(
    () => chartData.slice(-14).map((d) => d.count),
    [chartData]
  )
  const totalDelta = useMemo(() => weekDelta(spark14), [spark14])

  return (
    <div>
      <PageHeader
        title="Stats"
        description="Aggregate metrics across all scans."
      />

      {error ? (
        <ErrorState message={error} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {loading || !data ? (
              <>
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
              </>
            ) : (
              <>
                <StatCard
                  label="Total scans"
                  value={data.totalScans.toLocaleString()}
                  sparkline={spark14}
                  delta={{ pct: totalDelta }}
                />
                <StatCard
                  label="Threats blocked"
                  value={data.threatsBlocked.toLocaleString()}
                  tone={data.threatsBlocked > 0 ? "danger" : "default"}
                  sparkline={spark14}
                />
                <StatCard
                  label="Threat rate"
                  value={<ThreatRateRing percent={data.threatRate} size={76} />}
                  hint="of scanned content"
                />
                <StatCard
                  label="Unscanned"
                  value={data.unscanned.toLocaleString()}
                  tone={data.unscanned > 0 ? "warn" : "default"}
                  hint={data.unscanned > 0 ? "analyzer was unreachable" : "all fetches analyzed"}
                />
              </>
            )}
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Scans per day · last 30 days
              </h2>
              <Card className="border-border">
                <CardContent className="p-4">
                  {loading || !data ? (
                    <Skeleton className="aspect-[3/1] w-full" />
                  ) : (
                    <ChartContainer
                      config={chartConfig}
                      className="aspect-[3/1] w-full"
                    >
                      <AreaChart
                        data={chartData}
                        margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="scanFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--color-count)" stopOpacity={0.35} />
                            <stop offset="100%" stopColor="var(--color-count)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis
                          dataKey="date"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          minTickGap={24}
                          tickFormatter={(v: string) => {
                            const d = new Date(v)
                            return d.toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                            })
                          }}
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          allowDecimals={false}
                          width={32}
                        />
                        <ChartTooltip
                          cursor={false}
                          content={
                            <ChartTooltipContent
                              labelFormatter={(v) =>
                                new Date(v as string).toLocaleDateString(undefined, {
                                  weekday: "short",
                                  month: "short",
                                  day: "numeric",
                                })
                              }
                            />
                          }
                        />
                        <Area
                          dataKey="count"
                          type="monotone"
                          stroke="var(--color-count)"
                          fill="url(#scanFill)"
                          strokeWidth={1.5}
                        />
                      </AreaChart>
                    </ChartContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            <div>
              <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Attack types
              </h2>
              {loading || !data ? (
                <Card className="border-border">
                  <CardContent className="p-5">
                    <Skeleton className="h-32 w-full" />
                  </CardContent>
                </Card>
              ) : (
                <AttackTypeBreakdown rows={data.attackTypes} />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function StatCardSkeleton() {
  return (
    <Card className="border-border">
      <CardContent className="p-5">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="mt-3 h-8 w-24" />
        <Skeleton className="mt-3 h-10 w-full" />
      </CardContent>
    </Card>
  )
}
