import type { TravelData } from '@/domain/types'
import { TYPE_META } from '@/domain/constants'
import { buildTimeline, costInTripCurrency, grandTotal, sortEvents, totalsByCategory } from '@/domain/calc'
import { parseTravelData } from '@/domain/validate'
import { downloadBlob, formatDate, formatMoney, formatTime, slugify } from '@/lib/utils'

export function exportJson(data: TravelData): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  downloadBlob(blob, `${slugify(data.trip.title)}.json`)
}

export async function importJsonFile(file: File): Promise<TravelData> {
  const text = await file.text()
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('O arquivo não é um JSON válido.')
  }
  return parseTravelData(parsed)
}

const pdfSafe = (s: string): string => s.replace(/[→➜]/g, '->').replace(/[^\u0000-\u00ff]/g, '')

export async function exportPdf(data: TravelData): Promise<void> {
  // Carregado sob demanda para manter o bundle inicial leve.
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')])
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const { trip } = data
  const cur = trip.currency
  let y = 48

  doc.setFontSize(20)
  doc.text(pdfSafe(trip.title), 40, y)
  y += 20
  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text(
    pdfSafe(`${formatDate(trip.startDate)} a ${formatDate(trip.endDate)}  |  Responsável: ${trip.owner || '-'}  |  Moeda: ${cur}`),
    40,
    y,
  )
  y += 14
  doc.text(pdfSafe(`Total geral estimado: ${formatMoney(grandTotal(data), cur)}`), 40, y)
  doc.setTextColor(0)
  y += 12

  const timeline = buildTimeline(data)
  if (timeline.length) {
    autoTable(doc, {
      startY: y + 6,
      head: [['Roteiro', 'Chegada', 'Saída', 'Noites', `Gastos (${cur})`]],
      body: timeline.map((s) => [
        pdfSafe(`${s.city || '-'} / ${s.country || '-'}`),
        s.isHome ? '' : formatDate(s.arrival, { day: '2-digit', month: '2-digit' }),
        s.isHome ? '' : formatDate(s.departure, { day: '2-digit', month: '2-digit' }),
        s.isHome ? '' : String(s.nights),
        s.isHome ? '' : formatMoney(s.cost, cur),
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [37, 99, 235] },
    })
  }

  const rows = sortEvents(data.events).map((e) => [
    e.allDay ? formatDate(e.start, { day: '2-digit', month: '2-digit' }) : `${formatDate(e.start, { day: '2-digit', month: '2-digit' })} ${formatTime(e.start)}`,
    TYPE_META[e.type].label,
    pdfSafe(e.title),
    pdfSafe([e.city, e.country].filter(Boolean).join(', ')),
    e.cost ? formatMoney(e.cost, e.currency) : '-',
  ])
  autoTable(doc, {
    startY: ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y) + 20,
    head: [['Data/hora', 'Tipo', 'Evento', 'Local', 'Custo']],
    body: rows,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [37, 99, 235] },
  })

  autoTable(doc, {
    startY: ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y) + 20,
    head: [['Categoria', `Total (${cur})`]],
    body: totalsByCategory(data).map((c) => [c.name, formatMoney(c.value, cur)]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [100, 116, 139] },
  })

  const withCost = data.events.filter((e) => e.cost > 0).length
  doc.setFontSize(8)
  doc.setTextColor(120)
  doc.text(
    pdfSafe(`Gerado por Travel Planner. ${data.events.length} eventos, ${withCost} com custo. Total: ${formatMoney(data.events.reduce((s, e) => s + costInTripCurrency(e, data), 0), cur)}`),
    40,
    doc.internal.pageSize.getHeight() - 24,
  )
  doc.save(`${slugify(trip.title)}.pdf`)
}
