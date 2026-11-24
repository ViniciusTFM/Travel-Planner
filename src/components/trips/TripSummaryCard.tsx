import { useMemo } from 'react'
import { CalendarDays, MapPin, Wallet } from 'lucide-react'
import { grandTotal, sortEvents } from '@/domain/calc'
import { dayDiff, formatDate, formatMoney, toLocalISO } from '@/lib/utils'
import { useTravelStore } from '@/store/useTravelStore'

export function TripSummaryCard() {
  const data = useTravelStore((s) => s.data)
  const selectEvent = useTravelStore((s) => s.selectEvent)
  const focusOn = useTravelStore((s) => s.focusOn)
  const { trip, events } = data

  const days = dayDiff(trip.startDate, trip.endDate) + 1
  const total = useMemo(() => grandTotal(data), [data])
  const countries = useMemo(() => new Set(events.map((e) => e.country).filter(Boolean)).size, [events])
  const next = useMemo(() => {
    const now = toLocalISO(new Date())
    return sortEvents(events).find((e) => e.end >= now) ?? null
  }, [events])

  return (
    <section aria-label="Resumo da viagem" className="space-y-3 rounded-lg border bg-card p-3">
      <div>
        <h2 className="font-semibold leading-tight">{trip.title}</h2>
        {trip.owner && <p className="text-xs text-muted-foreground">por {trip.owner}</p>}
      </div>
      <dl className="space-y-1.5 text-sm">
        <div className="flex items-center gap-2">
          <CalendarDays className="size-4 text-muted-foreground" aria-hidden="true" />
          <dt className="sr-only">Período</dt>
          <dd>
            {formatDate(trip.startDate, { day: '2-digit', month: 'short' })} – {formatDate(trip.endDate)} ({days} dias)
          </dd>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="size-4 text-muted-foreground" aria-hidden="true" />
          <dt className="sr-only">Eventos</dt>
          <dd>
            {events.length} eventos · {countries} países
          </dd>
        </div>
        <div className="flex items-center gap-2">
          <Wallet className="size-4 text-muted-foreground" aria-hidden="true" />
          <dt className="sr-only">Total</dt>
          <dd className="font-medium">{formatMoney(total, trip.currency)}</dd>
        </div>
      </dl>
      {next && (
        <button
          type="button"
          onClick={() => {
            focusOn(next.start.slice(0, 10))
            selectEvent(next.id)
          }}
          className="w-full rounded-md bg-muted p-2 text-left text-xs hover:bg-accent"
        >
          <span className="block text-muted-foreground">Próximo evento</span>
          <span className="block truncate font-medium">{next.title}</span>
          <span className="block text-muted-foreground">{formatDate(next.start, { day: '2-digit', month: 'short' })}</span>
        </button>
      )}
    </section>
  )
}
