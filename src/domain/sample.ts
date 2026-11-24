import { createSettings } from './calc'
import type { EventType, TravelData, TravelEvent } from './types'

let n = 0
function ev(
  type: EventType,
  title: string,
  start: string,
  end: string,
  extra: Partial<TravelEvent> = {},
): TravelEvent {
  n += 1
  return {
    id: `evt-${String(n).padStart(3, '0')}`,
    type,
    title,
    description: '',
    start,
    end,
    allDay: false,
    city: '',
    country: '',
    address: '',
    cost: 0,
    currency: 'BRL',
    tags: [],
    notes: '',
    metadata: {},
    ...extra,
  }
}

/** Viagem de exemplo: Brasil → Portugal → Espanha → Marrocos → Espanha → Brasil */
export function createSampleData(): TravelData {
  n = 0
  const events: TravelEvent[] = [
    ev('flight', 'LATAM LA8084 GRU → LIS', '2027-03-19T22:00:00', '2027-03-20T10:30:00', {
      city: 'Lisboa',
      country: 'Portugal',
      cost: 4200,
      metadata: {
        airline: 'LATAM',
        flightNumber: 'LA8084',
        bookingCode: 'XK29PL',
        seat: '23A',
        terminal: '3',
        originAirport: 'GRU',
        destinationAirport: 'LIS',
        boardingTime: '2027-03-19T21:10',
      },
    }),
    ev('hotel', 'Hotel Baixa Chiado', '2027-03-20T15:00:00', '2027-03-21T08:00:00', {
      city: 'Lisboa',
      country: 'Portugal',
      address: 'Rua Augusta 100, Lisboa',
      cost: 140,
      currency: 'EUR',
      metadata: {
        hotelName: 'Hotel Baixa Chiado',
        confirmationNumber: 'BK-88123',
        provider: 'Booking',
        checkin: '2027-03-20T15:00',
        checkout: '2027-03-21T08:00',
      },
    }),
    ev('restaurant', 'Time Out Market', '2027-03-20T19:30:00', '2027-03-20T21:00:00', {
      city: 'Lisboa',
      country: 'Portugal',
      cost: 45,
      currency: 'EUR',
      tags: ['Gastronomia'],
    }),
    ev('flight', 'TAP TP103 Lisboa → Madrid', '2027-03-21T11:35:00', '2027-03-21T13:05:00', {
      city: 'Madrid',
      country: 'Espanha',
      cost: 180,
      currency: 'EUR',
      metadata: {
        airline: 'TAP',
        flightNumber: 'TP103',
        bookingCode: 'TP77QW',
        originAirport: 'LIS',
        destinationAirport: 'MAD',
      },
    }),
    ev('hotel', 'Hotel Gran Vía Madrid', '2027-03-21T14:00:00', '2027-03-24T11:00:00', {
      city: 'Madrid',
      country: 'Espanha',
      address: 'Gran Vía 42, Madrid',
      cost: 540,
      currency: 'EUR',
      metadata: {
        hotelName: 'Hotel Gran Vía Madrid',
        confirmationNumber: 'MD-4471',
        provider: 'Booking',
        checkin: '2027-03-21T14:00',
        checkout: '2027-03-24T11:00',
      },
    }),
    ev('restaurant', 'Mercado San Miguel', '2027-03-21T19:00:00', '2027-03-21T21:00:00', {
      city: 'Madrid',
      country: 'Espanha',
      cost: 60,
      currency: 'EUR',
      tags: ['Gastronomia'],
    }),
    ev('museum', 'Museu do Prado', '2027-03-22T10:00:00', '2027-03-22T13:00:00', {
      city: 'Madrid',
      country: 'Espanha',
      cost: 30,
      currency: 'EUR',
      tags: ['Museu'],
      metadata: { ticketNumber: 'PRD-9981' },
    }),
    ev('transport', 'Trem AVE Madrid → Barcelona', '2027-03-24T12:00:00', '2027-03-24T14:45:00', {
      city: 'Barcelona',
      country: 'Espanha',
      cost: 95,
      currency: 'EUR',
      metadata: { provider: 'Renfe AVE', origin: 'Madrid Atocha', destination: 'Barcelona Sants' },
    }),
    ev('hotel', 'Hotel Gótico Barcelona', '2027-03-24T15:30:00', '2027-03-27T10:00:00', {
      city: 'Barcelona',
      country: 'Espanha',
      cost: 480,
      currency: 'EUR',
      metadata: { hotelName: 'Hotel Gótico', confirmationNumber: 'BCN-2210', provider: 'Airbnb' },
    }),
    ev('ticket', 'Sagrada Família', '2027-03-25T10:00:00', '2027-03-25T12:00:00', {
      city: 'Barcelona',
      country: 'Espanha',
      cost: 80,
      currency: 'EUR',
      tags: ['Família'],
      metadata: { operator: 'Sagrada Família', ticketNumber: 'SF-55120', meetingPoint: 'Entrada Nascimento' },
    }),
    ev('tour', 'Parc Güell e Gaudí', '2027-03-26T09:30:00', '2027-03-26T12:30:00', {
      city: 'Barcelona',
      country: 'Espanha',
      cost: 70,
      currency: 'EUR',
      tags: ['Aventura'],
      metadata: { operator: 'GetYourGuide', voucher: 'GYG-3321' },
    }),
    ev('flight', 'Ryanair FR3102 BCN → RAK', '2027-03-27T12:00:00', '2027-03-27T13:30:00', {
      city: 'Marrakech',
      country: 'Marrocos',
      cost: 160,
      currency: 'EUR',
      metadata: { airline: 'Ryanair', flightNumber: 'FR3102', originAirport: 'BCN', destinationAirport: 'RAK' },
    }),
    ev('hotel', 'Riad Yasmine', '2027-03-27T15:00:00', '2027-03-30T11:00:00', {
      city: 'Marrakech',
      country: 'Marrocos',
      cost: 2400,
      currency: 'MAD',
      tags: ['Romântico'],
      metadata: { hotelName: 'Riad Yasmine', confirmationNumber: 'RY-77' },
    }),
    ev('tour', 'Deserto de Agafay + Jantar', '2027-03-28T15:00:00', '2027-03-28T22:00:00', {
      city: 'Marrakech',
      country: 'Marrocos',
      cost: 90,
      currency: 'EUR',
      tags: ['Aventura', 'Romântico'],
      metadata: { operator: 'Agafay Tours', meetingPoint: 'Praça Jemaa el-Fnaa' },
    }),
    ev('shopping', 'Souks de Marrakech', '2027-03-29T10:00:00', '2027-03-29T13:00:00', {
      city: 'Marrakech',
      country: 'Marrocos',
      cost: 1200,
      currency: 'MAD',
      tags: ['Compras'],
    }),
    ev('flight', 'Ryanair FR7811 RAK → SVQ', '2027-03-30T14:00:00', '2027-03-30T15:30:00', {
      city: 'Sevilha',
      country: 'Espanha',
      cost: 120,
      currency: 'EUR',
      metadata: { airline: 'Ryanair', flightNumber: 'FR7811', originAirport: 'RAK', destinationAirport: 'SVQ' },
    }),
    ev('hotel', 'Hotel Santa Cruz Sevilha', '2027-03-30T17:00:00', '2027-04-02T11:00:00', {
      city: 'Sevilha',
      country: 'Espanha',
      cost: 420,
      currency: 'EUR',
      metadata: { hotelName: 'Hotel Santa Cruz', confirmationNumber: 'SVQ-909' },
    }),
    ev('museum', 'Real Alcázar de Sevilha', '2027-04-01T10:00:00', '2027-04-01T12:30:00', {
      city: 'Sevilha',
      country: 'Espanha',
      cost: 25,
      currency: 'EUR',
      tags: ['Museu'],
    }),
    ev('transport', 'Trem AVE Sevilha → Madrid', '2027-04-02T12:30:00', '2027-04-02T15:00:00', {
      city: 'Madrid',
      country: 'Espanha',
      cost: 85,
      currency: 'EUR',
      metadata: { provider: 'Renfe AVE', origin: 'Sevilha Santa Justa', destination: 'Madrid Atocha' },
    }),
    ev('hotel', 'Hotel Gran Vía Madrid (2)', '2027-04-02T16:00:00', '2027-04-05T11:00:00', {
      city: 'Madrid',
      country: 'Espanha',
      cost: 510,
      currency: 'EUR',
      metadata: { hotelName: 'Hotel Gran Vía Madrid', confirmationNumber: 'MD-5532' },
    }),
    ev('shopping', 'El Corte Inglés', '2027-04-03T11:00:00', '2027-04-03T14:00:00', {
      city: 'Madrid',
      country: 'Espanha',
      cost: 250,
      currency: 'EUR',
      tags: ['Compras'],
    }),
    ev('flight', 'LATAM LA8085 MAD → GRU', '2027-04-05T23:55:00', '2027-04-06T08:30:00', {
      city: 'São Paulo',
      country: 'Brasil',
      cost: 0,
      metadata: {
        airline: 'LATAM',
        flightNumber: 'LA8085',
        originAirport: 'MAD',
        destinationAirport: 'GRU',
        boardingTime: '2027-04-05T22:50',
      },
    }),
  ]
  return {
    trip: {
      id: 'trip-001',
      title: 'Espanha e Marrocos 2027',
      owner: 'Vinicius',
      startDate: '2027-03-19',
      endDate: '2027-04-06',
      currency: 'BRL',
      notes: 'Viagem de exemplo. Pode editar ou excluir.',
    },
    events,
    documents: [],
    checklists: [
      {
        id: 'chk-001',
        title: 'Documentos',
        items: [
          { id: 'ci-1', text: 'Passaporte', done: true },
          { id: 'ci-2', text: 'Seguro viagem', done: false },
          { id: 'ci-3', text: 'Cartão internacional', done: false },
        ],
      },
      {
        id: 'chk-002',
        title: 'Mala',
        items: [
          { id: 'ci-4', text: 'Adaptador de tomada', done: false },
          { id: 'ci-5', text: 'Casaco leve', done: false },
        ],
      },
    ],
    settings: { ...createSettings(), homeCity: 'São Paulo', homeCountry: 'Brasil', favorites: ['evt-005'] },
  }
}
