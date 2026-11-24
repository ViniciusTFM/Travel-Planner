import { CATEGORY_COLORS, COST_CATEGORIES, TYPE_META, type CostCategory } from './constants'
import type { Settings, TravelData, TravelEvent, Trip } from './types'
import { dayDiff, normalize, parseLocal, toDateStr, uid } from '@/lib/utils'

export function sortEvents(events: TravelEvent[]): TravelEvent[] {
  return [...events].sort((a, b) => a.start.localeCompare(b.start) || a.end.localeCompare(b.end))
}

export function eventCategory(e: TravelEvent): CostCategory {
  return TYPE_META[e.type].category
}

export function convert(amount: number, currency: string, trip: Trip, settings: Settings): number {
  if (currency === trip.currency) return amount
  return amount * (settings.exchangeRates[currency] ?? 1)
}

export function costInTripCurrency(e: TravelEvent, data: TravelData): number {
  return convert(e.cost, e.currency, data.trip, data.settings)
}

/** Milhas usadas por um voo. O valor é derivado do metadata do evento universal. */
export function milesForEvent(e: TravelEvent): number {
  if (e.type !== 'flight') return 0
  const value = Number(e.metadata.milesUsed)
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0
}

export function totalMiles(data: TravelData): number {
  return data.events.reduce((sum, e) => sum + milesForEvent(e), 0)
}

export interface FlightMilesPoint {
  date: string
  label: string
  title: string
  miles: number
}

/** Série separada da série monetária, incluindo voos pagos somente com milhas. */
export function milesByFlight(data: TravelData): FlightMilesPoint[] {
  return sortEvents(data.events)
    .filter((e) => e.type === 'flight' && milesForEvent(e) > 0)
    .map((e) => ({
      date: e.start.slice(0, 10),
      label: e.metadata.flightNumber || e.title || 'Voo',
      title: e.title || 'Voo',
      miles: milesForEvent(e),
    }))
}

export function totalsByCurrency(events: TravelEvent[]): Record<string, number> {
  const out: Record<string, number> = { BRL: 0, EUR: 0, USD: 0 }
  for (const e of events) out[e.currency] = (out[e.currency] ?? 0) + e.cost
  return out
}

export function grandTotal(data: TravelData, events: TravelEvent[] = data.events): number {
  return events.reduce((sum, e) => sum + costInTripCurrency(e, data), 0)
}

export function totalsByCategory(data: TravelData): { name: CostCategory; value: number; color: string }[] {
  const acc = new Map<CostCategory, number>()
  for (const c of COST_CATEGORIES) acc.set(c, 0)
  for (const e of data.events) {
    const c = eventCategory(e)
    acc.set(c, (acc.get(c) ?? 0) + costInTripCurrency(e, data))
  }
  return COST_CATEGORIES.map((name) => ({ name, value: round2(acc.get(name) ?? 0), color: CATEGORY_COLORS[name] }))
}

export function costTimeSeries(data: TravelData): { date: string; daily: number; cumulative: number }[] {
  const byDay = new Map<string, number>()
  for (const e of data.events) {
    if (e.cost <= 0) continue
    const day = e.start.slice(0, 10)
    byDay.set(day, (byDay.get(day) ?? 0) + costInTripCurrency(e, data))
  }
  let cumulative = 0
  return [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, daily]) => {
      cumulative += daily
      return { date, daily: round2(daily), cumulative: round2(cumulative) }
    })
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100
}

export function hotelNights(e: TravelEvent): number {
  if (e.type !== 'hotel') return 0
  return Math.max(0, dayDiff(e.start, e.end))
}

// ---------- busca e filtros ----------

export interface EventFilters {
  query: string
  types: string[]
  tags: string[]
}

export const EMPTY_FILTERS: EventFilters = { query: '', types: [], tags: [] }

export function searchableText(e: TravelEvent): string {
  return normalize(
    [
      e.title,
      e.description,
      e.city,
      e.country,
      e.address,
      e.notes,
      TYPE_META[e.type].label,
      e.type,
      ...e.tags,
      ...Object.values(e.metadata),
    ].join(' '),
  )
}

export function filterEvents(events: TravelEvent[], f: EventFilters): TravelEvent[] {
  const q = normalize(f.query.trim())
  return events.filter((e) => {
    if (f.types.length && !f.types.includes(e.type)) return false
    if (f.tags.length && !f.tags.some((t) => e.tags.includes(t))) return false
    if (q && !searchableText(e).includes(q)) return false
    return true
  })
}

// ---------- timeline da viagem ----------

export interface TimelineStop {
  key: string
  country: string
  city: string
  arrival: string
  departure: string
  nights: number
  cost: number
  eventCount: number
  isHome?: boolean
}

export function buildTimeline(data: TravelData): TimelineStop[] {
  const located = sortEvents(data.events).filter((e) => e.city.trim() || e.country.trim())
  const stops: TimelineStop[] = []
  for (const e of located) {
    const last = stops[stops.length - 1]
    const same = last && last.city === e.city.trim() && last.country === e.country.trim()
    const cost = costInTripCurrency(e, data)
    if (same && last) {
      if (e.end > last.departure) last.departure = e.end
      last.cost += cost
      last.eventCount += 1
      last.nights += hotelNights(e)
    } else {
      stops.push({
        key: `${stops.length}-${e.city}-${e.country}`,
        country: e.country.trim(),
        city: e.city.trim(),
        arrival: e.start,
        departure: e.end,
        nights: hotelNights(e),
        cost,
        eventCount: 1,
      })
    }
  }
  // Sem hotel registrado: estima noites pela diferença até a próxima parada.
  stops.forEach((s, i) => {
    if (s.nights === 0) {
      const next = stops[i + 1]
      if (next) s.nights = Math.max(0, dayDiff(s.arrival, next.arrival))
    }
  })
  const { homeCity, homeCountry } = data.settings
  if (stops.length === 0) return []
  const home = (key: string, date: string): TimelineStop => ({
    key,
    country: homeCountry,
    city: homeCity,
    arrival: date,
    departure: date,
    nights: 0,
    cost: 0,
    eventCount: 0,
    isHome: true,
  })
  const first = stops[0]!
  const last = stops[stops.length - 1]!
  const isHome = (s: TimelineStop): boolean =>
    s.country === homeCountry.trim() && (!homeCity.trim() || s.city === homeCity.trim())
  const result = [...stops]
  if (!isHome(first) && homeCountry.trim()) result.unshift(home('home-start', first.arrival))
  if (!isHome(last) && homeCountry.trim()) result.push(home('home-end', last.departure))
  return result.map((s) => (isHome(s) ? { ...s, isHome: true } : s))
}

// ---------- fábricas ----------

export function createTrip(partial: Partial<Trip> = {}): Trip {
  const today = new Date()
  const start = toDateStr(today)
  return {
    id: uid('trip'),
    title: 'Nova viagem',
    owner: '',
    startDate: start,
    endDate: start,
    currency: 'BRL',
    notes: '',
    ...partial,
  }
}

export function createSettings(): Settings {
  return {
    exchangeRates: { EUR: 6, USD: 5.5, MAD: 0.55, GBP: 7 },
    customTags: [],
    favorites: [],
    homeCity: '',
    homeCountry: 'Brasil',
  }
}

export function createEmptyData(tripPartial: Partial<Trip> = {}): TravelData {
  return { trip: createTrip(tripPartial), events: [], documents: [], checklists: [], settings: createSettings() }
}

export function createEvent(trip: Trip, start?: string, end?: string, allDay = false): TravelEvent {
  const s = start ?? `${trip.startDate}T09:00:00`
  const e = end ?? toLocalISO1h(s)
  return {
    id: uid('evt'),
    type: 'custom',
    title: '',
    description: '',
    start: s,
    end: e,
    allDay,
    city: '',
    country: '',
    address: '',
    cost: 0,
    currency: trip.currency,
    tags: [],
    notes: '',
    metadata: {},
  }
}

function toLocalISO1h(start: string): string {
  const d = parseLocal(start)
  d.setHours(d.getHours() + 1)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${toDateStr(d)}T${p(d.getHours())}:${p(d.getMinutes())}:00`
}
