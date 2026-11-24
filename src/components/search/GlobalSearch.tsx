import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import { searchableText, sortEvents } from '@/domain/calc'
import { TYPE_META } from '@/domain/constants'
import { normalize, formatDate } from '@/lib/utils'
import { useTravelStore } from '@/store/useTravelStore'
import { TypeIcon } from '@/components/events/EventBits'

/** Busca global: cidade, país, voo, hotel, reserva, companhia, endereço, tag. Também filtra o calendário. */
export function GlobalSearch() {
  const events = useTravelStore((s) => s.data.events)
  const query = useTravelStore((s) => s.filters.query)
  const setFilters = useTravelStore((s) => s.setFilters)
  const selectEvent = useTravelStore((s) => s.selectEvent)
  const focusOn = useTravelStore((s) => s.focusOn)
  const setSection = useTravelStore((s) => s.setSection)
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const listId = useId()

  const results = useMemo(() => {
    const q = normalize(query.trim())
    if (!q) return []
    return sortEvents(events)
      .filter((e) => searchableText(e).includes(q))
      .slice(0, 8)
  }, [events, query])

  useEffect(() => {
    const onDown = (e: MouseEvent): void => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const show = open && query.trim().length > 0

  return (
    <div ref={wrapRef} className="relative w-full" role="search">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
      <input
        type="search"
        aria-label="Busca global"
        aria-controls={listId}
        aria-expanded={show}
        placeholder="Buscar cidade, voo, hotel, reserva, tag..."
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setFilters({ query: e.target.value })
          setOpen(true)
        }}
        onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
        className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-9 text-sm placeholder:text-muted-foreground"
      />
      {query && (
        <button
          type="button"
          aria-label="Limpar busca"
          onClick={() => setFilters({ query: '' })}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 hover:bg-accent"
        >
          <X className="size-4" />
        </button>
      )}
      {show && (
        <ul
          id={listId}
          className="absolute left-0 right-0 top-12 z-40 max-h-80 overflow-y-auto rounded-lg border bg-card p-1 shadow-lg"
        >
          {results.length === 0 && <li className="p-3 text-sm text-muted-foreground">Nada encontrado.</li>}
          {results.map((e) => (
            <li key={e.id}>
              <button
                type="button"
                onClick={() => {
                  setSection('calendar')
                  focusOn(e.start.slice(0, 10))
                  selectEvent(e.id)
                  setOpen(false)
                }}
                className="flex w-full items-center gap-3 rounded-md p-2 text-left hover:bg-accent"
              >
                <TypeIcon type={e.type} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{e.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {TYPE_META[e.type].label} · {[e.city, e.country].filter(Boolean).join(', ') || 'sem local'} ·{' '}
                    {formatDate(e.start, { day: '2-digit', month: 'short' })}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
