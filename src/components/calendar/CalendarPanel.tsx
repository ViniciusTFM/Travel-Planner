import { useMemo, useState } from 'react'
import { Filter, Plus, X } from 'lucide-react'
import { DEFAULT_TAGS, TYPE_META } from '@/domain/constants'
import { EVENT_TYPES } from '@/domain/types'
import { Button } from '@/components/ui/button'
import { Tabs } from '@/components/ui/misc'
import { cn } from '@/lib/utils'
import { allTags, useTravelStore, type CalView } from '@/store/useTravelStore'
import { CalendarView } from './CalendarView'
import { TripTimeline } from './TripTimeline'

const VIEWS: { value: CalView; label: string }[] = [
  { value: 'agenda', label: 'Agenda' },
  { value: 'day', label: 'Dia' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mês' },
  { value: 'timeline', label: 'Timeline' },
]

export function CalendarPanel() {
  const calView = useTravelStore((s) => s.calView)
  const setCalView = useTravelStore((s) => s.setCalView)
  const filters = useTravelStore((s) => s.filters)
  const setFilters = useTravelStore((s) => s.setFilters)
  const resetFilters = useTravelStore((s) => s.resetFilters)
  const startDraft = useTravelStore((s) => s.startDraft)
  const settings = useTravelStore((s) => s.data.settings)
  const [open, setOpen] = useState(false)

  const tags = useMemo(() => allTags(settings, DEFAULT_TAGS), [settings])
  const active = filters.types.length + filters.tags.length + (filters.query ? 1 : 0)

  const toggle = (key: 'types' | 'tags', v: string): void =>
    setFilters({ [key]: filters[key].includes(v) ? filters[key].filter((x) => x !== v) : [...filters[key], v] })

  return (
    <section className="flex h-full min-h-0 flex-col gap-3" aria-label="Calendário">
      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-0 max-w-full overflow-x-auto">
          <Tabs items={VIEWS} value={calView} onChange={setCalView} label="Modo de visualização" />
        </div>
        <div className="ml-auto flex gap-2">
          <Button
            variant="outline"
            size="sm"
            aria-expanded={open}
            aria-controls="calendar-filters"
            onClick={() => setOpen((o) => !o)}
          >
            <Filter /> Filtros{active > 0 && ` (${active})`}
          </Button>
          <Button size="sm" onClick={() => startDraft()}>
            <Plus /> Evento
          </Button>
        </div>
      </div>

      {(open || active > 0) && (
        <div id="calendar-filters" className="space-y-2 rounded-lg border bg-card p-3 text-sm">
          {filters.query && (
            <p className="flex items-center gap-2">
              Busca: <strong>{filters.query}</strong>
              <button
                type="button"
                aria-label="Limpar busca"
                onClick={() => setFilters({ query: '' })}
                className="rounded p-0.5 hover:bg-accent"
              >
                <X className="size-3.5" />
              </button>
            </p>
          )}
          {open && (
            <>
              <fieldset>
                <legend className="mb-1 text-xs font-medium text-muted-foreground">Categorias</legend>
                <div className="flex flex-wrap gap-1.5">
                  {EVENT_TYPES.map((t) => {
                    const on = filters.types.includes(t)
                    return (
                      <button
                        key={t}
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggle('types', t)}
                        className={cn('flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs', on ? 'bg-accent font-medium' : 'hover:bg-accent')}
                      >
                        <span className="size-2.5 rounded-full" style={{ background: TYPE_META[t].color }} aria-hidden="true" />
                        {TYPE_META[t].label}
                      </button>
                    )
                  })}
                </div>
              </fieldset>
              <fieldset>
                <legend className="mb-1 text-xs font-medium text-muted-foreground">Tags</legend>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((t) => (
                    <button
                      key={t}
                      type="button"
                      aria-pressed={filters.tags.includes(t)}
                      onClick={() => toggle('tags', t)}
                      className={cn(
                        'rounded-full border px-2.5 py-1 text-xs',
                        filters.tags.includes(t) ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-accent',
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </fieldset>
            </>
          )}
          {active > 0 && (
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              Limpar filtros
            </Button>
          )}
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-auto">
        {calView === 'timeline' ? <TripTimeline /> : <CalendarView />}
      </div>

      <Legend />
    </section>
  )
}

function Legend() {
  return (
    <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground" aria-label="Legenda de cores">
      {EVENT_TYPES.map((t) => (
        <li key={t} className="flex items-center gap-1">
          <span className="size-2.5 rounded-full" style={{ background: TYPE_META[t].color }} aria-hidden="true" />
          {TYPE_META[t].label}
        </li>
      ))}
    </ul>
  )
}
