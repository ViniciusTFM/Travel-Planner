import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { costTimeSeries, milesByFlight, totalsByCategory } from '@/domain/calc'
import { formatDate, formatMoney } from '@/lib/utils'
import { useTravelStore } from '@/store/useTravelStore'
import { Card, CardContent, CardHeader, CardTitle, EmptyState } from '@/components/ui/misc'
import { TotalCards } from './CostSummary'

export function FinanceDashboard() {
  const data = useTravelStore((s) => s.data)
  const cur = data.trip.currency
  const cats = useMemo(() => totalsByCategory(data), [data])
  const series = useMemo(() => costTimeSeries(data), [data])
  const milesSeries = useMemo(() => milesByFlight(data), [data])
  const pieData = cats.filter((c) => c.value > 0)
  const hasMoney = pieData.length > 0
  const hasMiles = milesSeries.length > 0
  const fmt = (v: unknown): string => formatMoney(Number(v), cur)
  const fmtMiles = (v: unknown): string => `${Number(v).toLocaleString('pt-BR')} milhas`

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Dashboard financeiro</h2>
      <TotalCards />
      {!hasMoney && !hasMiles ? (
        <EmptyState>Cadastre custos em dinheiro ou milhas nos eventos para ver os gráficos.</EmptyState>
      ) : (
        <>
          {hasMoney && (
        <div className="grid gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Gastos por categoria ({cur})</CardTitle>
            </CardHeader>
            <CardContent className="h-72" role="img" aria-label="Gráfico de pizza com gastos por categoria">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                    {pieData.map((c) => (
                      <Cell key={c.name} fill={c.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={fmt} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Comparativo por categoria ({cur})</CardTitle>
            </CardHeader>
            <CardContent className="h-72" role="img" aria-label="Gráfico de barras com gastos por categoria">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip formatter={fmt} />
                  <Bar dataKey="value" name="Total" radius={[4, 4, 0, 0]}>
                    {cats.map((c) => (
                      <Cell key={c.name} fill={c.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle>Evolução dos gastos no tempo ({cur})</CardTitle>
            </CardHeader>
            <CardContent className="h-72" role="img" aria-label="Gráfico de evolução temporal dos gastos">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(d: string) => formatDate(d, { day: '2-digit', month: '2-digit' })}
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip formatter={fmt} labelFormatter={(d) => formatDate(String(d))} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="cumulative"
                    name="Acumulado"
                    stroke="#2563eb"
                    fill="#2563eb"
                    fillOpacity={0.2}
                  />
                  <Area type="monotone" dataKey="daily" name="No dia" stroke="#ea580c" fill="#ea580c" fillOpacity={0.15} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          </div>
          )}
          {hasMiles && (
            <Card className={hasMoney ? 'xl:col-span-2' : ''}>
              <CardHeader>
                <CardTitle>Milhas utilizadas por voo</CardTitle>
              </CardHeader>
              <CardContent className="h-72" role="img" aria-label="Gráfico de barras com milhas utilizadas por voo">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={milesSeries} margin={{ bottom: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tickFormatter={(value: number) => value.toLocaleString('pt-BR')} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip formatter={fmtMiles} labelFormatter={(label) => `Voo: ${label}`} />
                    <Bar dataKey="miles" name="Milhas" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
