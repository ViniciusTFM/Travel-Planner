import { useEffect, useMemo, useRef } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import interactionPlugin from '@fullcalendar/interaction'
import ptBrLocale from '@fullcalendar/core/locales/pt-br'
import type {
  DateSelectArg,
  EventClickArg,
  EventDropArg,
  EventInput,
} from '@fullcalendar/core'
import type { EventResizeDoneArg } from '@fullcalendar/interaction'
import type { TravelEvent } from '@/domain/types'
import { getContrastText, getEventColor } from '@/domain/eventStyle'
import { filterEvents } from '@/domain/calc'
import { addDays, parseLocal, toDateStr, toLocalISO } from '@/lib/utils'
import { useTravelStore, type CalView } from '@/store/useTravelStore'
import { useMediaQuery } from '@/hooks/useMediaQuery'

const VIEW_NAMES: Record<Exclude<CalView, 'timeline'>, string> = {
  agenda: 'listTrip',
  day: 'timeGridDay',
  week: 'timeGridWeek',
  month: 'dayGridMonth',
}

type Role = 'event' | 'in' | 'out'

/** Converte o modelo universal em eventos do FullCalendar. Hotéis geram marcadores de check-in/out. */
function toCalendarEvents(events: TravelEvent[]): EventInput[] {
  const out: EventInput[] = []
  for (const e of events) {
    const color = getEventColor(e)
    const base = { backgroundColor: color, borderColor: color, textColor: getContrastText(color) }
    if (e.type === 'hotel' && !e.allDay) {
      const half = (iso: string, back: boolean): string => {
        const d = parseLocal(iso)
        d.setMinutes(d.getMinutes() + (back ? -30 : 30))
        return toLocalISO(d)
      }
      out.push({
        ...base,
        id: `${e.id}::in`,
        title: `Check-in: ${e.title}`,
        start: e.start,
        end: half(e.start, false),
        extendedProps: { eventId: e.id, role: 'in' as Role },
      })
      out.push({
        ...base,
        id: `${e.id}::out`,
        title: `Check-out: ${e.title}`,
        start: half(e.end, true),
        end: e.end,
        extendedProps: { eventId: e.id, role: 'out' as Role },
      })
      continue
    }
    out.push({
      ...base,
      id: e.id,
      title: e.title || '(sem título)',
      start: e.allDay ? e.start.slice(0, 10) : e.start,
      end: e.allDay ? toDateStr(addDays(parseLocal(e.end.slice(0, 10)), 1)) : e.end,
      allDay: e.allDay,
      extendedProps: { eventId: e.id, role: 'event' as Role },
    })
  }
  return out
}

export function CalendarView() {
  const ref = useRef<FullCalendar>(null)
  const data = useTravelStore((s) => s.data)
  const filters = useTravelStore((s) => s.filters)
  const calView = useTravelStore((s) => s.calView)
  const focusDate = useTravelStore((s) => s.focusDate)
  const selectedId = useTravelStore((s) => s.selectedEventId)
  const selectEvent = useTravelStore((s) => s.selectEvent)
  const startDraft = useTravelStore((s) => s.startDraft)
  const upsert = useTravelStore((s) => s.upsertEvent)
  const isNarrow = !useMediaQuery('(min-width: 640px)')

  const visible = useMemo(() => filterEvents(data.events, filters), [data.events, filters])
  const fcEvents = useMemo(() => toCalendarEvents(visible), [visible])
  const byId = useMemo(() => new Map(data.events.map((e) => [e.id, e])), [data.events])

  const view = VIEW_NAMES[calView as Exclude<CalView, 'timeline'>] ?? 'timeGridWeek'

  const range = useMemo(() => {
    const starts = [data.trip.startDate, ...data.events.map((e) => e.start.slice(0, 10))].sort()
    const ends = [data.trip.endDate, ...data.events.map((e) => e.end.slice(0, 10))].sort()
    return {
      start: starts[0] ?? data.trip.startDate,
      end: toDateStr(addDays(parseLocal(ends[ends.length - 1] ?? data.trip.endDate), 1)),
    }
  }, [data])

  useEffect(() => {
    const api = ref.current?.getApi()
    if (api && api.view.type !== view) api.changeView(view)
  }, [view])

  useEffect(() => {
    if (focusDate) ref.current?.getApi().gotoDate(focusDate)
  }, [focusDate])

  const onSelect = (arg: DateSelectArg): void => {
    ref.current?.getApi().unselect()
    if (arg.allDay) {
      const startDate = toDateStr(arg.start)
      return startDraft(`${startDate}T00:00:00`, `${toDateStr(addDays(arg.end, -1))}T00:00:00`, true)
    }

    const start = arg.start
    // Mantém exatamente a faixa selecionada. O formulário permite ajustar
    // posteriormente qualquer data e horário de cada extremo de forma independente.
    const end = arg.end && arg.end.getTime() > start.getTime()
      ? arg.end
      : new Date(start.getTime() + 3_600_000)
    startDraft(toLocalISO(start), toLocalISO(end), false)
  }

  const onClick = (arg: EventClickArg): void => {
    arg.jsEvent.preventDefault()
    selectEvent(String(arg.event.extendedProps.eventId))
  }

  /** Aplica drag & drop / resize ao evento original do documento JSON. */
  const onMove = (arg: EventDropArg | EventResizeDoneArg): void => {
    const original = byId.get(String(arg.event.extendedProps.eventId))
    const role = arg.event.extendedProps.role as Role
    const start = arg.event.start
    if (!original || !start) return arg.revert()

    if (role !== 'event') {
      // Marcadores de hotel: movem apenas o check-in ou o check-out.
      if (arg.event.allDay) return arg.revert()
      let { start: s, end: e } = original
      if (role === 'in') s = toLocalISO(start)
      else e = toLocalISO(arg.event.end ?? start)
      if (parseLocal(e) < parseLocal(s)) {
        if (role === 'in') e = s
        else s = e
      }
      return upsert({ ...original, start: s, end: e, metadata: { ...original.metadata, checkin: s.slice(0, 16), checkout: e.slice(0, 16) } })
    }

    if (arg.event.allDay) {
      const lastDay = arg.event.end ? addDays(arg.event.end, -1) : start
      return upsert({ ...original, allDay: true, start: `${toDateStr(start)}T00:00:00`, end: `${toDateStr(lastDay)}T00:00:00` })
    }
    const prevDur =
      parseLocal(original.end).getTime() - parseLocal(original.start).getTime() || 3_600_000
    const end = arg.event.end ?? new Date(start.getTime() + (original.allDay ? 3_600_000 : prevDur))
    upsert({ ...original, allDay: false, start: toLocalISO(start), end: toLocalISO(end) })
  }

  return (
    <div className="h-full min-h-[560px]" aria-label="Calendário da viagem">
      <FullCalendar
        ref={ref}
        plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
        locale={ptBrLocale}
        initialView={view}
        initialDate={focusDate ?? data.trip.startDate}
        views={{ listTrip: { type: 'list', visibleRange: range, listDayFormat: { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' } } }}
        headerToolbar={
          calView === 'agenda'
            ? { left: '', center: 'title', right: '' }
            : { left: 'prev,next today', center: 'title', right: '' }
        }
        height="100%"
        events={fcEvents}
        editable
        selectable
        selectMirror
        selectLongPressDelay={250}
        eventLongPressDelay={250}
        nowIndicator
        dayMaxEvents={isNarrow ? 2 : 4}
        eventOrder="start,-duration,title"
        scrollTime="07:00:00"
        slotDuration="00:15:00"
        snapDuration="00:15:00"
        slotEventOverlap={false}
        allDaySlot
        select={onSelect}
        eventClick={onClick}
        eventDrop={onMove}
        eventResize={onMove}
        eventClassNames={(arg) =>
          arg.event.extendedProps.eventId === selectedId ? ['ring-2', 'ring-foreground', 'ring-offset-1'] : []
        }
        noEventsContent="Nenhum evento neste período"
        buttonText={{ today: 'Hoje' }}
        eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
        slotLabelFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
      />
    </div>
  )
}
