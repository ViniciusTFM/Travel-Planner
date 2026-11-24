import { createSampleData } from '../src/domain/sample'
import { buildTimeline, grandTotal, totalsByCategory, totalsByCurrency, filterEvents, EMPTY_FILTERS } from '../src/domain/calc'
import { decodeTrip, encodeTrip } from '../src/services/share'
import { parseTravelData } from '../src/domain/validate'

const d = createSampleData()
console.log('timeline:')
for (const s of buildTimeline(d))
  console.log(' ', s.isHome ? '[casa]' : '', s.city, '/', s.country, s.arrival.slice(0, 10), '->', s.departure.slice(0, 10), 'noites', s.nights, 'custo', s.cost.toFixed(0))
console.log('totais por moeda', totalsByCurrency(d.events))
console.log('total geral', grandTotal(d).toFixed(2))
console.log('categorias', totalsByCategory(d).map((c) => `${c.name}:${c.value}`).join(' '))
console.log('busca "latam":', filterEvents(d.events, { ...EMPTY_FILTERS, query: 'LATAM' }).length)
console.log('busca "marrakech":', filterEvents(d.events, { ...EMPTY_FILTERS, query: 'marrakéch' }).length)
console.log('busca tag Museu:', filterEvents(d.events, { ...EMPTY_FILTERS, tags: ['Museu'] }).length)
const enc = encodeTrip(d)
const back = decodeTrip(enc)
console.log('share bytes', enc.length, 'roundtrip ok', JSON.stringify(back) === JSON.stringify(parseTravelData(d)))
try {
  parseTravelData({ foo: 1 })
} catch (e) {
  console.log('invalid ->', (e as Error).message)
}
