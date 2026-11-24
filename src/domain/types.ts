/**
 * Modelo de dados. Um único documento JSON (TravelData) é a fonte única da verdade.
 * Voos, hotéis, passeios etc. NÃO têm entidades próprias: são TravelEvent com
 * `type` + `metadata` flexível.
 */

export const EVENT_TYPES = [
  'flight',
  'hotel',
  'tour',
  'restaurant',
  'transport',
  'ticket',
  'museum',
  'shopping',
  'expense',
  'custom',
] as const

export type EventType = (typeof EVENT_TYPES)[number]

export interface Trip {
  id: string
  title: string
  owner: string
  startDate: string // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
  currency: string
  notes: string
}

export type EventMetadata = Record<string, string>

/** Evento universal (nomeado TravelEvent para não colidir com DOM Event). */
export interface TravelEvent {
  id: string
  type: EventType
  title: string
  description: string
  start: string // YYYY-MM-DDTHH:mm:ss (horário local, sem fuso)
  end: string
  allDay: boolean
  city: string
  country: string
  address: string
  cost: number
  currency: string
  tags: string[]
  notes: string
  /** Override visual opcional; quando ausente, usa a cor padrão do tipo. */
  color?: string
  metadata: EventMetadata
}

export interface TravelDocument {
  id: string
  name: string
  mimeType: string
  size: number
  /** Conteúdo em data URL. Ao migrar para nuvem, trocar por `url` mantendo o restante. */
  dataUrl: string
  /** null = documento da viagem; caso contrário, id do evento (voo, hotel, passeio...) */
  eventId: string | null
  createdAt: string
}

export interface ChecklistItem {
  id: string
  text: string
  done: boolean
}

export interface Checklist {
  id: string
  title: string
  items: ChecklistItem[]
}

export interface Settings {
  /** Quanto vale 1 unidade da moeda X na moeda da viagem. */
  exchangeRates: Record<string, number>
  customTags: string[]
  favorites: string[] // ids de eventos
  homeCity: string
  homeCountry: string
}

export interface TravelData {
  trip: Trip
  events: TravelEvent[]
  documents: TravelDocument[]
  checklists: Checklist[]
  settings: Settings
}

export interface TripSummary {
  id: string
  title: string
  startDate: string
  endDate: string
  updatedAt: string
}
