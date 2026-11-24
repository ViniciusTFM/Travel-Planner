import { Pencil, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn, formatDate } from '@/lib/utils'
import { useTravelStore } from '@/store/useTravelStore'

export function TripList() {
  const library = useTravelStore((s) => s.library)
  const activeId = useTravelStore((s) => s.data.trip.id)
  const activeTitle = useTravelStore((s) => s.data.trip.title)
  const switchTrip = useTravelStore((s) => s.switchTrip)
  const setTripDialog = useTravelStore((s) => s.setTripDialog)

  return (
    <section aria-label="Viagens" className="space-y-1">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Viagens</h2>
        <Button variant="ghost" size="sm" aria-label="Nova viagem" onClick={() => setTripDialog('create')}>
          <Plus />
        </Button>
      </div>
      <ul>
        {library.map((t) => {
          const active = t.id === activeId
          return (
            <li key={t.id} className="group flex items-center">
              <button
                type="button"
                aria-current={active ? 'true' : undefined}
                onClick={() => void switchTrip(t.id)}
                className={cn(
                  'min-w-0 flex-1 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent',
                  active && 'bg-accent font-medium',
                )}
              >
                <span className="block truncate">{active ? activeTitle : t.title}</span>
                <span className="block text-xs text-muted-foreground">{formatDate(t.startDate, { day: '2-digit', month: 'short', year: 'numeric' })}</span>
              </button>
              {active && (
                <Button variant="ghost" size="icon" className="size-8" aria-label="Editar viagem" onClick={() => setTripDialog('edit')}>
                  <Pencil />
                </Button>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
