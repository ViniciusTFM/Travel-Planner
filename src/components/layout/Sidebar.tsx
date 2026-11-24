import { CalendarDays, CheckSquare, FileText, Settings, Star, Wallet } from 'lucide-react'
import { sortEvents } from '@/domain/calc'
import { cn, formatDate } from '@/lib/utils'
import { useTravelStore, type Section } from '@/store/useTravelStore'
import { TypeIcon } from '@/components/events/EventBits'
import { TripList } from '@/components/trips/TripList'
import { TripSummaryCard } from '@/components/trips/TripSummaryCard'

export function Favorites() {
  const events = useTravelStore((s) => s.data.events)
  const favorites = useTravelStore((s) => s.data.settings.favorites)
  const selectEvent = useTravelStore((s) => s.selectEvent)
  const focusOn = useTravelStore((s) => s.focusOn)
  const setSection = useTravelStore((s) => s.setSection)
  const favs = sortEvents(events.filter((e) => favorites.includes(e.id)))

  return (
    <section aria-label="Favoritos" className="space-y-1">
      <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <Star className="size-3" aria-hidden="true" /> Favoritos
      </h2>
      {favs.length === 0 ? (
        <p className="px-2 text-xs text-muted-foreground">Marque eventos com a estrela.</p>
      ) : (
        <ul>
          {favs.map((e) => (
            <li key={e.id}>
              <button
                type="button"
                onClick={() => {
                  setSection('calendar')
                  focusOn(e.start.slice(0, 10))
                  selectEvent(e.id)
                }}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
              >
                <TypeIcon type={e.type} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{e.title}</span>
                  <span className="block text-xs text-muted-foreground">{formatDate(e.start, { day: '2-digit', month: 'short' })}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

const NAV: { section: Section; label: string; icon: typeof CalendarDays }[] = [
  { section: 'calendar', label: 'Calendário', icon: CalendarDays },
  { section: 'costs', label: 'Custos', icon: Wallet },
  { section: 'documents', label: 'Documentos', icon: FileText },
  { section: 'checklist', label: 'Checklist', icon: CheckSquare },
  { section: 'settings', label: 'Configurações', icon: Settings },
]

export function Sidebar({ section }: { section: Section }) {
  const setSection = useTravelStore((s) => s.setSection)
  const docCount = useTravelStore((s) => s.data.documents.length)
  const pending = useTravelStore((s) => s.data.checklists.reduce((n, c) => n + c.items.filter((i) => !i.done).length, 0))
  const badges: Partial<Record<Section, number>> = { documents: docCount, checklist: pending }

  return (
    <aside aria-label="Navegação lateral" className="flex h-full flex-col gap-4 overflow-y-auto p-3">
      <TripSummaryCard />
      <nav aria-label="Seções">
        <ul className="space-y-0.5">
          {NAV.map(({ section: s, label, icon: Icon }) => (
            <li key={s}>
              <button
                type="button"
                aria-current={section === s ? 'page' : undefined}
                onClick={() => setSection(s)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-accent',
                  section === s && 'bg-accent font-medium',
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
                <span className="flex-1 text-left">{label}</span>
                {!!badges[s] && (
                  <span className="rounded-full bg-secondary px-1.5 text-xs">{badges[s]}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <TripList />
      <Favorites />
    </aside>
  )
}
