import type { EventType } from './types'

export type CostCategory =
  | 'Voos'
  | 'Hospedagem'
  | 'Passeios'
  | 'Restaurantes'
  | 'Transporte'
  | 'Compras'
  | 'Outros'

export const COST_CATEGORIES: CostCategory[] = [
  'Voos',
  'Hospedagem',
  'Passeios',
  'Restaurantes',
  'Transporte',
  'Compras',
  'Outros',
]

export const CATEGORY_COLORS: Record<CostCategory, string> = {
  Voos: '#2563eb',
  Hospedagem: '#7c3aed',
  Passeios: '#059669',
  Restaurantes: '#ea580c',
  Transporte: '#0891b2',
  Compras: '#db2777',
  Outros: '#64748b',
}

export interface TypeMeta {
  label: string
  color: string
  category: CostCategory
}

export const TYPE_META: Record<EventType, TypeMeta> = {
  flight: { label: 'Voo', color: '#2563eb', category: 'Voos' },
  hotel: { label: 'Hospedagem', color: '#7c3aed', category: 'Hospedagem' },
  tour: { label: 'Passeio', color: '#059669', category: 'Passeios' },
  restaurant: { label: 'Restaurante', color: '#ea580c', category: 'Restaurantes' },
  transport: { label: 'Transporte', color: '#0891b2', category: 'Transporte' },
  ticket: { label: 'Ingresso', color: '#65a30d', category: 'Passeios' },
  museum: { label: 'Museu', color: '#b45309', category: 'Passeios' },
  shopping: { label: 'Compras', color: '#db2777', category: 'Compras' },
  expense: { label: 'Gasto', color: '#dc2626', category: 'Outros' },
  custom: { label: 'Personalizado', color: '#64748b', category: 'Outros' },
}

export const DEFAULT_TAGS = [
  'Gastronomia',
  'Museu',
  'Praia',
  'Compras',
  'Família',
  'Romântico',
  'Aventura',
]

export const EVENT_COLOR_PRESETS = [
  '#2563eb',
  '#7c3aed',
  '#059669',
  '#ea580c',
  '#db2777',
  '#dc2626',
  '#0891b2',
  '#ca8a04',
  '#475569',
  '#0f172a',
] as const

export const CURRENCIES = ['BRL', 'EUR', 'USD', 'MAD', 'GBP']

export interface MetaOption {
  value: string
  label: string
}

export interface MetaField {
  key: string
  label: string
  placeholder?: string
  kind?: 'text' | 'datetime-local' | 'url' | 'tel' | 'number' | 'select'
  options?: MetaOption[]
}

/** Campos específicos exibidos conforme o tipo. Tudo é gravado em `metadata`. */
export const METADATA_FIELDS: Partial<Record<EventType, MetaField[]>> = {
  flight: [
    { key: 'airline', label: 'Companhia aérea', placeholder: 'LATAM' },
    { key: 'flightNumber', label: 'Nº do voo', placeholder: 'LA8085' },
    { key: 'bookingCode', label: 'Código da reserva' },
    { key: 'seat', label: 'Assento' },
    { key: 'terminal', label: 'Terminal' },
    { key: 'originAirport', label: 'Aeroporto de origem', placeholder: 'GRU' },
    { key: 'destinationAirport', label: 'Aeroporto de destino', placeholder: 'LIS' },
    { key: 'boardingTime', label: 'Horário de embarque', kind: 'datetime-local' },
    {
      key: 'paymentMethod',
      label: 'Forma de pagamento',
      kind: 'select',
      options: [
        { value: 'cash', label: 'Dinheiro' },
        { value: 'miles', label: 'Milhas' },
        { value: 'both', label: 'Dinheiro + milhas' },
      ],
    },
    { key: 'milesUsed', label: 'Milhas utilizadas', kind: 'number', placeholder: 'Ex.: 30000' },
  ],
  hotel: [
    { key: 'hotelName', label: 'Nome do hotel' },
    { key: 'confirmationNumber', label: 'Nº de confirmação' },
    { key: 'provider', label: 'Provedor', placeholder: 'Booking, Airbnb...' },
    { key: 'checkin', label: 'Check-in', kind: 'datetime-local' },
    { key: 'checkout', label: 'Check-out', kind: 'datetime-local' },
    { key: 'phone', label: 'Telefone', kind: 'tel' },
    { key: 'website', label: 'Website', kind: 'url' },
  ],
  tour: [
    { key: 'operator', label: 'Operadora' },
    { key: 'ticketNumber', label: 'Nº do ingresso' },
    { key: 'meetingPoint', label: 'Ponto de encontro' },
    { key: 'voucher', label: 'Voucher' },
  ],
  ticket: [
    { key: 'operator', label: 'Operadora' },
    { key: 'ticketNumber', label: 'Nº do ingresso' },
    { key: 'meetingPoint', label: 'Ponto de encontro' },
    { key: 'voucher', label: 'Voucher' },
  ],
  museum: [
    { key: 'ticketNumber', label: 'Nº do ingresso' },
    { key: 'voucher', label: 'Voucher' },
  ],
  restaurant: [
    { key: 'reservationName', label: 'Nome da reserva' },
    { key: 'phone', label: 'Telefone', kind: 'tel' },
    { key: 'website', label: 'Website', kind: 'url' },
  ],
  transport: [
    { key: 'provider', label: 'Empresa / modal', placeholder: 'Trem, ônibus, aluguel...' },
    { key: 'bookingCode', label: 'Código da reserva' },
    { key: 'origin', label: 'Origem' },
    { key: 'destination', label: 'Destino' },
  ],
}

export const STORAGE_PREFIX = 'travel-planner'
