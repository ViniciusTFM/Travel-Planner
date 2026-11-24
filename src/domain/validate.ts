import { EVENT_TYPES, type Checklist, type EventType, type TravelData, type TravelDocument, type TravelEvent } from './types'
import { createSettings } from './calc'
import { uid } from '@/lib/utils'
import { normalizeColor } from './eventStyle'

type Obj = Record<string, unknown>
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v)
const str = (v: unknown, d = ''): string => (typeof v === 'string' ? v : d)
const num = (v: unknown, d = 0): number => (typeof v === 'number' && Number.isFinite(v) ? v : d)
const strArr = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [])

function normalizeEvent(raw: unknown): TravelEvent | null {
  if (!isObj(raw)) return null
  const type = (EVENT_TYPES as readonly string[]).includes(str(raw.type)) ? (raw.type as EventType) : 'custom'
  const start = str(raw.start)
  if (!start) return null
  const color = normalizeColor(raw.color)
  const meta: Record<string, string> = {}
  if (isObj(raw.metadata)) {
    for (const [k, v] of Object.entries(raw.metadata)) if (v != null) meta[k] = String(v)
  }
  return {
    id: str(raw.id) || uid('evt'),
    type,
    title: str(raw.title),
    description: str(raw.description),
    start,
    end: str(raw.end) || start,
    allDay: raw.allDay === true,
    city: str(raw.city),
    country: str(raw.country),
    address: str(raw.address),
    cost: num(raw.cost),
    currency: str(raw.currency, 'BRL'),
    tags: strArr(raw.tags),
    notes: str(raw.notes),
    color,
    metadata: meta,
  }
}

function normalizeDoc(raw: unknown): TravelDocument | null {
  if (!isObj(raw)) return null
  return {
    id: str(raw.id) || uid('doc'),
    name: str(raw.name, 'documento'),
    mimeType: str(raw.mimeType),
    size: num(raw.size),
    dataUrl: str(raw.dataUrl),
    eventId: typeof raw.eventId === 'string' ? raw.eventId : null,
    createdAt: str(raw.createdAt, new Date().toISOString()),
  }
}

function normalizeChecklist(raw: unknown): Checklist | null {
  if (!isObj(raw)) return null
  const items = Array.isArray(raw.items) ? raw.items : []
  return {
    id: str(raw.id) || uid('chk'),
    title: str(raw.title, 'Checklist'),
    items: items.filter(isObj).map((i) => ({ id: str(i.id) || uid('ci'), text: str(i.text), done: i.done === true })),
  }
}

/** Valida e normaliza qualquer JSON de entrada para TravelData. Lança Error se inválido. */
export function parseTravelData(input: unknown): TravelData {
  if (!isObj(input) || !isObj(input.trip)) throw new Error('Arquivo inválido: objeto "trip" ausente.')
  const t = input.trip
  const defaults = createSettings()
  const s = isObj(input.settings) ? input.settings : {}
  const rates: Record<string, number> = { ...defaults.exchangeRates }
  if (isObj(s.exchangeRates)) for (const [k, v] of Object.entries(s.exchangeRates)) rates[k] = num(v, 1)
  const today = new Date().toISOString().slice(0, 10)
  return {
    trip: {
      id: str(t.id) || uid('trip'),
      title: str(t.title, 'Viagem importada'),
      owner: str(t.owner),
      startDate: str(t.startDate, today),
      endDate: str(t.endDate, str(t.startDate, today)),
      currency: str(t.currency, 'BRL'),
      notes: str(t.notes),
    },
    events: (Array.isArray(input.events) ? input.events : []).map(normalizeEvent).filter((e): e is TravelEvent => !!e),
    documents: (Array.isArray(input.documents) ? input.documents : []).map(normalizeDoc).filter((d): d is TravelDocument => !!d),
    checklists: (Array.isArray(input.checklists) ? input.checklists : [])
      .map(normalizeChecklist)
      .filter((c): c is Checklist => !!c),
    settings: {
      exchangeRates: rates,
      customTags: strArr(s.customTags),
      favorites: strArr(s.favorites),
      homeCity: str(s.homeCity, defaults.homeCity),
      homeCountry: str(s.homeCountry, defaults.homeCountry),
    },
  }
}
