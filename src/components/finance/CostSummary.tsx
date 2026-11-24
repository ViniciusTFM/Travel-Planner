import { useMemo } from 'react'
import { grandTotal, totalMiles, totalsByCategory, totalsByCurrency } from '@/domain/calc'
import { formatMoney } from '@/lib/utils'
import { useTravelStore } from '@/store/useTravelStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/misc'

export function TotalCards() {
  const data = useTravelStore((s) => s.data)
  const totals = useMemo(() => totalsByCurrency(data.events), [data.events])
  const general = useMemo(() => grandTotal(data), [data])
  const miles = useMemo(() => totalMiles(data), [data])
  const items = [
    { label: 'Total BRL', value: formatMoney(totals.BRL ?? 0, 'BRL') },
    { label: 'Total EUR', value: formatMoney(totals.EUR ?? 0, 'EUR') },
    { label: 'Total USD', value: formatMoney(totals.USD ?? 0, 'USD') },
    { label: 'Total Geral', value: formatMoney(general, data.trip.currency), strong: true },
    { label: 'Milhas em voos', value: `${miles.toLocaleString('pt-BR')} mi` },
  ]
  const others = Object.entries(totals).filter(([c, v]) => !['BRL', 'EUR', 'USD'].includes(c) && v > 0)
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        {items.map((i) => (
          <Card key={i.label} className={i.strong ? 'border-primary/50 bg-primary/5' : ''}>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs font-medium text-muted-foreground">{i.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`break-words font-semibold ${i.strong ? 'text-xl' : 'text-lg'}`}>{i.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      {others.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Outras moedas: {others.map(([c, v]) => formatMoney(v, c)).join(' · ')}. O total geral usa as taxas de câmbio
          configuradas em Configurações.
        </p>
      )}
    </div>
  )
}

/** Versão compacta usada na coluna direita. */
export function CostSummary() {
  const data = useTravelStore((s) => s.data)
  const cats = useMemo(() => totalsByCategory(data), [data])
  const total = grandTotal(data)
  return (
    <div className="space-y-4">
      <TotalCards />
      <section aria-label="Gastos por categoria">
        <h3 className="mb-2 text-sm font-medium">Por categoria ({data.trip.currency})</h3>
        <ul className="space-y-1.5">
          {cats.map((c) => (
            <li key={c.name} className="text-sm">
              <div className="flex justify-between">
                <span className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full" style={{ background: c.color }} aria-hidden="true" />
                  {c.name}
                </span>
                <span className="font-medium">{formatMoney(c.value, data.trip.currency)}</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${total ? (c.value / total) * 100 : 0}%`, background: c.color }}
                />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
