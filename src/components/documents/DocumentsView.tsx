import { useMemo, useRef, useState } from 'react'
import { FileImage, FileText, Trash2, Upload } from 'lucide-react'
import { TYPE_META } from '@/domain/constants'
import type { TravelDocument } from '@/domain/types'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/form'
import { EmptyState } from '@/components/ui/misc'
import { formatDate } from '@/lib/utils'
import { useTravelStore } from '@/store/useTravelStore'
import { ACCEPT, filesToDocuments, formatSize, MAX_BYTES, openDocument } from '@/services/documents'

export function DocumentsView() {
  const documents = useTravelStore((s) => s.data.documents)
  const events = useTravelStore((s) => s.data.events)
  const addDocuments = useTravelStore((s) => s.addDocuments)
  const updateDocument = useTravelStore((s) => s.updateDocument)
  const removeDocument = useTravelStore((s) => s.removeDocument)
  const setNotice = useTravelStore((s) => s.setNotice)
  const fileRef = useRef<HTMLInputElement>(null)
  const [target, setTarget] = useState<string>('') // '' = viagem
  const [filter, setFilter] = useState<string>('all')

  const eventsById = useMemo(() => new Map(events.map((e) => [e.id, e])), [events])
  const attachable = useMemo(() => [...events].sort((a, b) => a.start.localeCompare(b.start)), [events])

  const shown = documents.filter((d) =>
    filter === 'all' ? true : filter === 'trip' ? d.eventId === null : eventsById.get(d.eventId ?? '')?.type === filter,
  )

  const onFiles = async (files: FileList | null): Promise<void> => {
    if (!files?.length) return
    const { docs, errors } = await filesToDocuments(files, target || null)
    if (docs.length) addDocuments(docs)
    if (errors.length) setNotice({ kind: 'error', text: errors.join(' ') })
  }

  const label = (d: TravelDocument): string => {
    if (!d.eventId) return 'Viagem'
    const e = eventsById.get(d.eventId)
    return e ? `${TYPE_META[e.type].label}: ${e.title}` : 'Evento removido'
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Documentos</h2>

      <div className="grid gap-3 rounded-lg border bg-card p-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <div className="space-y-1.5">
          <label htmlFor="doc-target" className="text-sm font-medium">
            Associar novos documentos a
          </label>
          <Select id="doc-target" value={target} onChange={(e) => setTarget(e.target.value)}>
            <option value="">Viagem (geral)</option>
            {attachable.map((e) => (
              <option key={e.id} value={e.id}>
                {TYPE_META[e.type].label}: {e.title}
              </option>
            ))}
          </Select>
        </div>
        <Button onClick={() => fileRef.current?.click()}>
          <Upload /> Enviar arquivo
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
        <p className="text-xs text-muted-foreground sm:col-span-2">
          PDF, PNG, JPG, WEBP ou TXT, até {(MAX_BYTES / 1_000_000).toFixed(1)} MB cada (limite do armazenamento local).
        </p>
      </div>

      <div className="flex items-center gap-2">
        <label htmlFor="doc-filter" className="text-sm">
          Mostrar:
        </label>
        <Select id="doc-filter" className="w-auto" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">Todos</option>
          <option value="trip">Viagem</option>
          <option value="flight">Voos</option>
          <option value="hotel">Hospedagens</option>
          <option value="tour">Passeios</option>
        </Select>
      </div>

      {shown.length === 0 ? (
        <EmptyState>Nenhum documento.</EmptyState>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {shown.map((d) => (
            <li key={d.id} className="flex flex-col gap-2 rounded-lg border bg-card p-3">
              <div className="flex items-start gap-3">
                {d.mimeType.startsWith('image/') && d.dataUrl ? (
                  <img src={d.dataUrl} alt="" className="size-12 shrink-0 rounded object-cover" />
                ) : d.mimeType.startsWith('image/') ? (
                  <FileImage className="size-8 shrink-0 text-muted-foreground" aria-hidden="true" />
                ) : (
                  <FileText className="size-8 shrink-0 text-muted-foreground" aria-hidden="true" />
                )}
                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => openDocument(d)}
                    disabled={!d.dataUrl}
                    className="block max-w-full truncate text-left text-sm font-medium hover:underline disabled:no-underline"
                  >
                    {d.name}
                  </button>
                  <p className="text-xs text-muted-foreground">
                    {formatSize(d.size)} · {formatDate(d.createdAt)}
                    {!d.dataUrl && ' · conteúdo não incluído (link compartilhado)'}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{label(d)}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Excluir ${d.name}`}
                  onClick={() => confirm(`Excluir "${d.name}"?`) && removeDocument(d.id)}
                >
                  <Trash2 />
                </Button>
              </div>
              <Select
                aria-label={`Associação de ${d.name}`}
                value={d.eventId ?? ''}
                onChange={(e) => updateDocument(d.id, { eventId: e.target.value || null })}
                className="h-9 text-xs"
              >
                <option value="">Viagem (geral)</option>
                {attachable.map((e) => (
                  <option key={e.id} value={e.id}>
                    {TYPE_META[e.type].label}: {e.title}
                  </option>
                ))}
              </Select>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
