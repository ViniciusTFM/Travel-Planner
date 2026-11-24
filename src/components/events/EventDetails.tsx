import { useRef } from 'react'
import { Copy, ExternalLink, FileText, MapPin, Paperclip, Pencil, Star, Trash2 } from 'lucide-react'
import type { TravelEvent } from '@/domain/types'
import { METADATA_FIELDS } from '@/domain/constants'
import { costInTripCurrency, hotelNights, milesForEvent } from '@/domain/calc'
import { Button } from '@/components/ui/button'
import { TagList, TypeBadge } from './EventBits'
import { formatDateTime, formatMoney } from '@/lib/utils'
import { useTravelStore } from '@/store/useTravelStore'
import { ACCEPT, filesToDocuments, openDocument } from '@/services/documents'

export function EventDetails({ event }: { event: TravelEvent }) {
  const data = useTravelStore((s) => s.data)
  const setRightTab = useTravelStore((s) => s.setRightTab)
  const remove = useTravelStore((s) => s.deleteEvent)
  const duplicate = useTravelStore((s) => s.duplicateEvent)
  const toggleFav = useTravelStore((s) => s.toggleFavorite)
  const addDocuments = useTravelStore((s) => s.addDocuments)
  const setNotice = useTravelStore((s) => s.setNotice)
  const fileRef = useRef<HTMLInputElement>(null)

  const isFav = data.settings.favorites.includes(event.id)
  const docs = data.documents.filter((d) => d.eventId === event.id)
  const fields = METADATA_FIELDS[event.type] ?? []
  const metaRows = Object.entries(event.metadata)
    .filter(([, v]) => v)
    .map(([k, v]) => ({ label: fields.find((f) => f.key === k)?.label ?? k, value: v }))
  const nights = hotelNights(event)
  const flightMiles = milesForEvent(event)
  const paymentLabels: Record<string, string> = {
    cash: 'Dinheiro',
    miles: 'Milhas',
    both: 'Dinheiro + milhas',
  }
  const mapsUrl = event.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([event.address, event.city, event.country].join(' '))}`
    : null

  const onFiles = async (files: FileList | null): Promise<void> => {
    if (!files?.length) return
    const { docs: newDocs, errors } = await filesToDocuments(files, event.id)
    if (newDocs.length) addDocuments(newDocs)
    if (errors.length) setNotice({ kind: 'error', text: errors.join(' ') })
  }

  return (
    <article className="space-y-4" aria-label={`Detalhes de ${event.title}`}>
      <header className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <TypeBadge type={event.type} />
          <Button
            variant="ghost"
            size="icon"
            aria-pressed={isFav}
            aria-label={isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            onClick={() => toggleFav(event.id)}
          >
            <Star className={isFav ? 'fill-yellow-400 text-yellow-500' : ''} />
          </Button>
        </div>
        <h3 className="text-xl font-semibold leading-tight">{event.title}</h3>
        <p className="text-sm text-muted-foreground">
          {formatDateTime(event.start, event.allDay)}
          {!event.allDay && event.end !== event.start && <> → {formatDateTime(event.end)}</>}
          {nights > 0 && <> · {nights} noite(s)</>}
        </p>
      </header>

      {(event.city || event.country || event.address) && (
        <p className="flex items-start gap-2 text-sm">
          <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span>
            {[event.city, event.country].filter(Boolean).join(', ')}
            {event.address && <span className="block text-muted-foreground">{event.address}</span>}
            {mapsUrl && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                Abrir no mapa <ExternalLink className="size-3" />
              </a>
            )}
          </span>
        </p>
      )}

      {(event.cost > 0 || flightMiles > 0) && (
        <div className="space-y-1 text-sm">
          {event.cost > 0 && (
            <p>
              <span className="font-semibold">{formatMoney(event.cost, event.currency)}</span>
              {event.currency !== data.trip.currency && (
                <span className="text-muted-foreground">
                  {' '}
                  ≈ {formatMoney(costInTripCurrency(event, data), data.trip.currency)}
                </span>
              )}
            </p>
          )}
          {flightMiles > 0 && <p className="font-semibold">{flightMiles.toLocaleString('pt-BR')} milhas utilizadas</p>}
        </div>
      )}

      <TagList tags={event.tags} />

      {metaRows.length > 0 && (
        <dl className="grid grid-cols-2 gap-x-3 gap-y-2 rounded-md bg-muted/60 p-3 text-sm">
          {metaRows.map((r) => (
            <div key={r.label} className="min-w-0">
              <dt className="text-xs text-muted-foreground">{r.label}</dt>
              <dd className="break-words font-medium">
                {/^https?:\/\//.test(r.value) ? (
                  <a href={r.value} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    {r.value}
                  </a>
                ) : r.label === 'Forma de pagamento' ? (
                  paymentLabels[r.value] ?? r.value
                ) : r.label === 'Milhas utilizadas' ? (
                  `${Number(r.value).toLocaleString('pt-BR')} milhas`
                ) : (
                  r.value
                )}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {event.description && <p className="whitespace-pre-wrap text-sm">{event.description}</p>}
      {event.notes && (
        <p className="whitespace-pre-wrap rounded-md border-l-2 border-primary pl-3 text-sm text-muted-foreground">
          {event.notes}
        </p>
      )}

      <section aria-label="Documentos do evento" className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">Documentos</h4>
          <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
            <Paperclip /> Anexar
          </Button>
          <input
            ref={fileRef}
            type="file"
            hidden
            multiple
            accept={ACCEPT}
            onChange={(e) => {
              void onFiles(e.target.files)
              e.target.value = ''
            }}
          />
        </div>
        {docs.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhum documento anexado.</p>
        ) : (
          <ul className="space-y-1">
            {docs.map((d) => (
              <li key={d.id}>
                <button
                  type="button"
                  onClick={() => openDocument(d)}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
                >
                  <FileText className="size-4 shrink-0" aria-hidden="true" />
                  <span className="truncate">{d.name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="flex flex-wrap gap-2 border-t pt-3">
        <Button onClick={() => setRightTab('editor')}>
          <Pencil /> Editar
        </Button>
        <Button variant="outline" onClick={() => duplicate(event.id)}>
          <Copy /> Copiar evento
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            if (confirm(`Excluir "${event.title}"?`)) remove(event.id)
          }}
        >
          <Trash2 /> Excluir
        </Button>
      </div>
    </article>
  )
}
