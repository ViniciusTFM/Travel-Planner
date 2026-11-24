import { useMemo } from 'react'
import { ArrowDown, Home, MapPin } from 'lucide-react'
import { buildTimeline } from '@/domain/calc'
import { formatDate, formatMoney } from '@/lib/utils'
import { useTravelStore } from '@/store/useTravelStore'
import { EmptyState } from '@/components/ui/misc'

export function TripTimeline() {
  const data = useTravelStore((s) => s.data)
  const focusOn = useTravelStore((s) => s.focusOn)
  const setCalView = useTravelStore((s) => s.setCalView)
  const stops = useMemo(() => buildTimeline(data), [data])
  const cur = data.trip.currency

  if (stops.length === 0) {
    return (
      <EmptyState>
        A timeline é montada a partir da cidade e do país dos eventos. Preencha esses campos para ver o roteiro.
      </EmptyState>
    )
  }

  return (
    <ol className="mx-auto max-w-xl py-2" aria-label="Roteiro da viagem">
      {stops.map((s, i) => {
        const label = s.isHome ? `${s.city || s.country} (casa)` : s.city || s.country
        return (
          <li key={s.key} className="flex flex-col items-stretch">
            <button
              type="button"
              disabled={s.isHome && s.eventCount === 0}
              onClick={() => {
                focusOn(s.arrival.slice(0, 10))
                setCalView('agenda')
              }}
              className="rounded-lg border bg-card p-3 text-left transition-colors enabled:hover:bg-accent disabled:cursor-default"
            >
              <div className="flex items-start gap-3">
                <span
                  className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full ${
                    s.isHome ? 'bg-primary text-primary-foreground' : 'bg-secondary'
                  }`}
                  aria-hidden="true"
                >
                  {s.isHome ? <Home className="size-4" /> : <MapPin className="size-4" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{label}</span>
                  {s.country && s.city && !s.isHome && (
                    <span className="block text-sm text-muted-foreground">{s.country}</span>
                  )}
                  {s.isHome && s.country && s.city && <span className="block text-sm text-muted-foreground">{s.country}</span>}
                  {s.eventCount > 0 && (
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {formatDate(s.arrival, { day: '2-digit', month: 'short' })}
                      {' → '}
                      {formatDate(s.departure, { day: '2-digit', month: 'short' })}
                      {' · '}
                      {s.nights} noite(s) · {s.eventCount} evento(s)
                    </span>
                  )}
                </span>
                {s.eventCount > 0 && <span className="shrink-0 text-sm font-medium">{formatMoney(s.cost, cur)}</span>}
              </div>
            </button>
            {i < stops.length - 1 && (
              <ArrowDown className="mx-auto my-1 size-5 text-muted-foreground" aria-hidden="true" />
            )}
          </li>
        )
      })}
    </ol>
  )
}
