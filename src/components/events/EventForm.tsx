import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, Clock, Plus, Trash2 } from 'lucide-react'
import type { EventType, TravelEvent } from '@/domain/types'
import { EVENT_TYPES } from '@/domain/types'
import { CURRENCIES, DEFAULT_TAGS, EVENT_COLOR_PRESETS, METADATA_FIELDS, TYPE_META } from '@/domain/constants'
import { Button } from '@/components/ui/button'
import { Field, Input, Select, Textarea } from '@/components/ui/form'
import { cn, parseLocal } from '@/lib/utils'
import { getEventColor } from '@/domain/eventStyle'
import { allTags, useTravelStore } from '@/store/useTravelStore'

const toDateInput = (iso: string): string => iso.slice(0, 10)
const toTimeInput = (iso: string): string => iso.slice(11, 16) || '00:00'
const fromParts = (date: string, time: string): string => `${date}T${time.length === 5 ? `${time}:00` : time}`

function isValidDateInput(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
}

function isValidTimeInput(value: string): boolean {
  if (!/^\d{2}:\d{2}$/.test(value)) return false
  const [hour, minute] = value.split(':').map(Number)
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59
}

function TypedDateTimeInput({
  id,
  value,
  kind,
  onChange,
  onInvalid,
}: {
  id: string
  value: string
  kind: 'date' | 'time'
  onChange: (value: string) => void
  onInvalid: (message: string | null) => void
}) {
  const [draft, setDraft] = useState(value)
  const valid = kind === 'date' ? isValidDateInput(draft) : isValidTimeInput(draft)
  const Icon = kind === 'date' ? CalendarDays : Clock
  const placeholder = kind === 'date' ? 'AAAA-MM-DD' : 'HH:MM'
  const message = kind === 'date' ? 'Use a data no formato AAAA-MM-DD.' : 'Use o horário no formato HH:MM.'

  useEffect(() => {
    setDraft(value)
  }, [value])

  const update = (next: string): void => {
    setDraft(next)
    if (kind === 'date' ? isValidDateInput(next) : isValidTimeInput(next)) {
      onChange(next)
      onInvalid(null)
    } else {
      onInvalid(next ? message : null)
    }
  }

  return (
    <div className="flex gap-2">
      <Input
        id={id}
        type="text"
        inputMode="numeric"
        placeholder={placeholder}
        value={draft}
        aria-invalid={!valid && !!draft}
        className="min-w-0 flex-1"
        onChange={(e) => update(e.target.value)}
        onBlur={() => onInvalid(!valid && draft ? message : null)}
        required
      />
      <label
        className="relative flex min-h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center rounded-md border border-input bg-background text-muted-foreground hover:bg-accent"
        aria-label={`Selecionar ${kind === 'date' ? 'data' : 'horário'}`}
      >
        <Icon className="size-4" aria-hidden="true" />
        <input
          type={kind}
          tabIndex={-1}
          value={value}
          onChange={(e) => update(e.target.value)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          aria-label={`Abrir seletor de ${kind === 'date' ? 'data' : 'horário'}`}
        />
      </label>
    </div>
  )
}

interface Props {
  initial: TravelEvent
  isNew: boolean
  onCancel: () => void
}

export function EventForm({ initial, isNew, onCancel }: Props) {
  const upsert = useTravelStore((s) => s.upsertEvent)
  const remove = useTravelStore((s) => s.deleteEvent)
  const settings = useTravelStore((s) => s.data.settings)
  const addTag = useTravelStore((s) => s.addTag)
  const documents = useTravelStore((s) => s.data.documents)

  const [ev, setEv] = useState<TravelEvent>(initial)
  const [newTag, setNewTag] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [dateError, setDateError] = useState<string | null>(null)
  const idp = `ev-${initial.id}`

  const tags = useMemo(() => allTags(settings, DEFAULT_TAGS), [settings])
  const metaFields = (METADATA_FIELDS[ev.type] ?? []).filter(
    (f) => !(ev.type === 'hotel' && (f.key === 'checkin' || f.key === 'checkout')),
  )
  const isHotel = ev.type === 'hotel'
  const attached = documents.filter((d) => d.eventId === ev.id)

  const patch = (p: Partial<TravelEvent>): void => setEv((cur) => ({ ...cur, ...p }))
  const setMeta = (key: string, value: string): void =>
    setEv((cur) => ({ ...cur, metadata: { ...cur.metadata, [key]: value } }))

  const setAllDay = (allDay: boolean): void => {
    setEv((cur) => ({
      ...cur,
      allDay,
      // Mantém as datas escolhidas. Ao voltar para horário, cada extremo
      // recebe um horário inicial padrão e continua editável separadamente.
      start: allDay ? `${toDateInput(cur.start)}T00:00:00` : `${toDateInput(cur.start)}T09:00:00`,
      end: allDay ? `${toDateInput(cur.end)}T00:00:00` : `${toDateInput(cur.end)}T10:00:00`,
    }))
  }

  const setDateTimePart = (boundary: 'start' | 'end', part: 'date' | 'time', value: string): void => {
    if (!value) return
    setEv((cur) => {
      const current = cur[boundary]
      const next = part === 'date'
        ? fromParts(value, toTimeInput(current))
        : fromParts(toDateInput(current), value)
      return { ...cur, [boundary]: next }
    })
  }

  const toggleTag = (t: string): void =>
    patch({ tags: ev.tags.includes(t) ? ev.tags.filter((x) => x !== t) : [...ev.tags, t] })

  const submit = (e: React.FormEvent): void => {
    e.preventDefault()
    if (!ev.title.trim()) return setError('Informe um título.')
    if (dateError) return setError(dateError)
    const boundariesValid = isValidDateInput(toDateInput(ev.start)) && isValidDateInput(toDateInput(ev.end)) &&
      (ev.allDay || (isValidTimeInput(toTimeInput(ev.start)) && isValidTimeInput(toTimeInput(ev.end))))
    if (!boundariesValid) return setError('Informe datas e horários válidos.')
    if (parseLocal(ev.end) < parseLocal(ev.start)) return setError('O fim não pode ser anterior ao início.')
    if (ev.cost < 0 || Number.isNaN(ev.cost)) return setError('O custo deve ser zero ou positivo.')
    const metadata = { ...ev.metadata }

    if (ev.type === 'flight') {
      const rawMiles = metadata.milesUsed?.trim() ?? ''
      const miles = rawMiles ? Number(rawMiles) : 0
      if (!Number.isFinite(miles) || miles < 0 || !Number.isInteger(miles)) {
        return setError('As milhas devem ser um número inteiro igual ou maior que zero.')
      }

      const configured = metadata.paymentMethod
      const payment = configured === 'cash' || configured === 'miles' || configured === 'both'
        ? configured
        : miles > 0
          ? ev.cost > 0 ? 'both' : 'miles'
          : 'cash'
      if (payment === 'cash' && miles > 0) return setError('Pagamento em dinheiro não pode ter milhas informadas.')
      if (payment === 'miles' && ev.cost > 0) return setError('Pagamento em milhas não pode ter valor em dinheiro.')
      if (payment === 'miles' && miles === 0) return setError('Informe a quantidade de milhas utilizadas.')
      if (payment === 'both' && (miles === 0 || ev.cost === 0)) {
        return setError('Pagamento misto exige valor em dinheiro e milhas utilizadas.')
      }
      metadata.paymentMethod = payment
      if (miles > 0) metadata.milesUsed = String(miles)
      else delete metadata.milesUsed
    }

    if (isHotel) {
      metadata.checkin = ev.start.slice(0, 16)
      metadata.checkout = ev.end.slice(0, 16)
      if (!metadata.hotelName) metadata.hotelName = ev.title.trim()
    }
    for (const k of Object.keys(metadata)) if (!metadata[k]) delete metadata[k]
    upsert({ ...ev, title: ev.title.trim(), metadata })
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {error && (
        <p role="alert" className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label="Tipo" htmlFor={`${idp}-type`}>
          <Select
            id={`${idp}-type`}
            value={ev.type}
            onChange={(e) => patch({ type: e.target.value as EventType })}
          >
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {TYPE_META[t].label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Título *" htmlFor={`${idp}-title`}>
          <Input
            id={`${idp}-title`}
            value={ev.title}
            onChange={(e) => patch({ title: e.target.value })}
            required
            aria-invalid={!!error && !ev.title.trim()}
          />
        </Field>
      </div>

      <fieldset className="space-y-2 rounded-md border p-3">
        <legend className="px-1 text-sm font-medium">Cor do evento</legend>
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor={`${idp}-color`} className="flex items-center gap-2 text-sm">
            <input
              id={`${idp}-color`}
              type="color"
              value={getEventColor(ev)}
              onChange={(e) => patch({ color: e.target.value })}
              className="size-10 cursor-pointer rounded border bg-background p-1"
              aria-label="Escolher cor do evento"
            />
            <span>{ev.color ? 'Personalizada' : 'Cor do tipo'}</span>
          </label>
          {ev.color && (
            <Button type="button" variant="ghost" size="sm" onClick={() => patch({ color: undefined })}>
              Usar cor do tipo
            </Button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5" aria-label="Cores sugeridas">
          {EVENT_COLOR_PRESETS.map((color) => (
            <button
              key={color}
              type="button"
              aria-label={`Usar cor ${color}`}
              aria-pressed={ev.color?.toLowerCase() === color}
              title={color}
              onClick={() => patch({ color })}
              className="flex size-11 touch-manipulation items-center justify-center rounded-full border-2 border-background shadow-sm ring-1 ring-border transition-transform hover:scale-110 aria-pressed:ring-2 aria-pressed:ring-primary"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </fieldset>

      <label className="flex min-h-11 items-center gap-2 text-sm touch-manipulation">
        <input
          type="checkbox"
          className="size-5 accent-[hsl(var(--primary))]"
          checked={ev.allDay}
          onChange={(e) => setAllDay(e.target.checked)}
        />
        Dia inteiro
      </label>

      {ev.allDay ? (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Data de início" htmlFor={`${idp}-start-date`}>
            <TypedDateTimeInput
              id={`${idp}-start-date`}
              kind="date"
              value={toDateInput(ev.start)}
              onChange={(value) => setDateTimePart('start', 'date', value)}
              onInvalid={setDateError}
            />
          </Field>
          <Field label="Data de fim" htmlFor={`${idp}-end-date`}>
            <TypedDateTimeInput
              id={`${idp}-end-date`}
              kind="date"
              value={toDateInput(ev.end)}
              onChange={(value) => setDateTimePart('end', 'date', value)}
              onInvalid={setDateError}
            />
          </Field>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          <fieldset className="space-y-2 rounded-md border p-3">
            <legend className="px-1 text-sm font-medium">Início</legend>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Data" htmlFor={`${idp}-start-date`}>
                <TypedDateTimeInput
                  id={`${idp}-start-date`}
                  kind="date"
                  value={toDateInput(ev.start)}
                  onChange={(value) => setDateTimePart('start', 'date', value)}
                  onInvalid={setDateError}
                />
              </Field>
              <Field label="Horário" htmlFor={`${idp}-start-time`}>
                <TypedDateTimeInput
                  id={`${idp}-start-time`}
                  kind="time"
                  value={toTimeInput(ev.start)}
                  onChange={(value) => setDateTimePart('start', 'time', value)}
                  onInvalid={setDateError}
                />
              </Field>
            </div>
          </fieldset>
          <fieldset className="space-y-2 rounded-md border p-3">
            <legend className="px-1 text-sm font-medium">Fim</legend>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Data" htmlFor={`${idp}-end-date`}>
                <TypedDateTimeInput
                  id={`${idp}-end-date`}
                  kind="date"
                  value={toDateInput(ev.end)}
                  onChange={(value) => setDateTimePart('end', 'date', value)}
                  onInvalid={setDateError}
                />
              </Field>
              <Field label="Horário" htmlFor={`${idp}-end-time`}>
                <TypedDateTimeInput
                  id={`${idp}-end-time`}
                  kind="time"
                  value={toTimeInput(ev.end)}
                  onChange={(value) => setDateTimePart('end', 'time', value)}
                  onInvalid={setDateError}
                />
              </Field>
            </div>
          </fieldset>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label={ev.type === 'flight' || ev.type === 'transport' ? 'Cidade de destino' : 'Cidade'} htmlFor={`${idp}-city`}>
          <Input id={`${idp}-city`} value={ev.city} onChange={(e) => patch({ city: e.target.value })} />
        </Field>
        <Field label="País" htmlFor={`${idp}-country`}>
          <Input id={`${idp}-country`} value={ev.country} onChange={(e) => patch({ country: e.target.value })} />
        </Field>
      </div>
      <Field label="Endereço" htmlFor={`${idp}-address`}>
        <Input id={`${idp}-address`} value={ev.address} onChange={(e) => patch({ address: e.target.value })} />
      </Field>

    <div className="grid grid-cols-2 gap-3">
        <Field label={ev.type === 'flight' ? 'Valor em dinheiro' : 'Custo'} htmlFor={`${idp}-cost`}>
          <Input
            id={`${idp}-cost`}
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            value={Number.isNaN(ev.cost) ? '' : ev.cost}
            onChange={(e) => patch({ cost: e.target.value === '' ? 0 : Number(e.target.value) })}
          />
        </Field>
        <Field label="Moeda" htmlFor={`${idp}-cur`}>
          <Select id={`${idp}-cur`} value={ev.currency} onChange={(e) => patch({ currency: e.target.value })}>
            {CURRENCIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
        </Field>
      </div>

      {metaFields.length > 0 && (
        <fieldset className="space-y-3 rounded-md border p-3">
          <legend className="px-1 text-sm font-medium">Detalhes de {TYPE_META[ev.type].label.toLowerCase()}</legend>
          <div className="grid grid-cols-2 gap-3">
            {metaFields.map((f) => (
              <Field key={f.key} label={f.label} htmlFor={`${idp}-m-${f.key}`}>
                {f.kind === 'select' ? (
                  <Select
                    id={`${idp}-m-${f.key}`}
                    value={ev.metadata[f.key] ?? f.options?.[0]?.value ?? ''}
                    onChange={(e) => setMeta(f.key, e.target.value)}
                  >
                    {f.options?.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <Input
                    id={`${idp}-m-${f.key}`}
                    type={f.kind ?? 'text'}
                    min={f.kind === 'number' ? 0 : undefined}
                    step={f.kind === 'number' ? 1 : undefined}
                    inputMode={f.kind === 'number' ? 'numeric' : undefined}
                    placeholder={f.placeholder}
                    value={ev.metadata[f.key] ?? ''}
                    onChange={(e) => setMeta(f.key, e.target.value)}
                  />
                )}
              </Field>
            ))}
          </div>
        </fieldset>
      )}

      <fieldset>
        <legend className="mb-1.5 text-sm font-medium">Tags</legend>
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={ev.tags.includes(t)}
              onClick={() => toggleTag(t)}
              className={cn(
                'min-h-11 touch-manipulation rounded-full border px-2.5 py-2 text-xs',
                ev.tags.includes(t) ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-accent',
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <Input
            aria-label="Nova tag"
            placeholder="Nova tag..."
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                const t = newTag.trim()
                if (t) {
                  addTag(t)
                  if (!ev.tags.includes(t)) toggleTag(t)
                  setNewTag('')
                }
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="min-h-11 min-w-11"
            aria-label="Adicionar tag"
            onClick={() => {
              const t = newTag.trim()
              if (!t) return
              addTag(t)
              if (!ev.tags.includes(t)) toggleTag(t)
              setNewTag('')
            }}
          >
            <Plus />
          </Button>
        </div>
      </fieldset>

      <Field label="Descrição" htmlFor={`${idp}-desc`}>
        <Textarea id={`${idp}-desc`} value={ev.description} onChange={(e) => patch({ description: e.target.value })} />
      </Field>
      <Field label="Notas" htmlFor={`${idp}-notes`}>
        <Textarea id={`${idp}-notes`} value={ev.notes} onChange={(e) => patch({ notes: e.target.value })} />
      </Field>

      {attached.length > 0 && (
        <p className="text-xs text-muted-foreground">{attached.length} documento(s) anexado(s) a este evento.</p>
      )}

      <div className="sticky bottom-0 -mx-1 flex flex-wrap gap-2 bg-background/95 px-1 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur">
        <Button type="submit">{isNew ? 'Criar evento' : 'Salvar'}</Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        {!isNew && (
          <Button
            type="button"
            variant="destructive"
            className="ml-auto"
            onClick={() => {
              if (confirm(`Excluir "${ev.title}"?`)) remove(ev.id)
            }}
          >
            <Trash2 /> Excluir
          </Button>
        )}
      </div>
    </form>
  )
}
