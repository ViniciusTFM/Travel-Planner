import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { CURRENCIES } from '@/domain/constants'
import type { Trip } from '@/domain/types'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Field, Input, Select, Textarea } from '@/components/ui/form'
import { useTravelStore } from '@/store/useTravelStore'

export function TripDialog() {
  const mode = useTravelStore((s) => s.tripDialog)
  const setMode = useTravelStore((s) => s.setTripDialog)
  const trip = useTravelStore((s) => s.data.trip)

  return (
    <Dialog open={mode !== null} onOpenChange={(o) => !o && setMode(null)}>
      <DialogContent>
        {mode && <TripForm key={mode + trip.id} mode={mode} trip={trip} onDone={() => setMode(null)} />}
      </DialogContent>
    </Dialog>
  )
}

function TripForm({ mode, trip, onDone }: { mode: 'create' | 'edit'; trip: Trip; onDone: () => void }) {
  const createTrip = useTravelStore((s) => s.createTrip)
  const updateTrip = useTravelStore((s) => s.updateTrip)
  const deleteTrip = useTravelStore((s) => s.deleteTrip)
  const today = new Date().toISOString().slice(0, 10)
  const [t, setT] = useState<Trip>(
    mode === 'edit' ? trip : { ...trip, title: '', owner: trip.owner, startDate: today, endDate: today, notes: '', currency: 'BRL' },
  )
  const [error, setError] = useState<string | null>(null)

  const submit = (e: React.FormEvent): void => {
    e.preventDefault()
    if (!t.title.trim()) return setError('Informe o título da viagem.')
    if (!t.startDate || !t.endDate) return setError('Informe as datas de início e fim.')
    if (t.endDate < t.startDate) return setError('A data final não pode ser anterior à inicial.')
    const { id: _id, ...fields } = t
    void _id
    if (mode === 'create') createTrip({ ...fields, title: t.title.trim() })
    else updateTrip({ ...fields, title: t.title.trim() })
    onDone()
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <DialogTitle>{mode === 'create' ? 'Nova viagem' : 'Editar viagem'}</DialogTitle>
      <DialogDescription>Os dados ficam salvos em um único documento JSON.</DialogDescription>
      {error && (
        <p role="alert" className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">
          {error}
        </p>
      )}
      <Field label="Título *" htmlFor="trip-title">
        <Input id="trip-title" value={t.title} onChange={(e) => setT({ ...t, title: e.target.value })} required />
      </Field>
      <Field label="Responsável" htmlFor="trip-owner">
        <Input id="trip-owner" value={t.owner} onChange={(e) => setT({ ...t, owner: e.target.value })} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Início" htmlFor="trip-start">
          <Input id="trip-start" type="date" value={t.startDate} onChange={(e) => setT({ ...t, startDate: e.target.value })} />
        </Field>
        <Field label="Fim" htmlFor="trip-end">
          <Input id="trip-end" type="date" value={t.endDate} onChange={(e) => setT({ ...t, endDate: e.target.value })} />
        </Field>
      </div>
      <Field label="Moeda principal" htmlFor="trip-cur">
        <Select id="trip-cur" value={t.currency} onChange={(e) => setT({ ...t, currency: e.target.value })}>
          {CURRENCIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </Select>
      </Field>
      <Field label="Notas" htmlFor="trip-notes">
        <Textarea id="trip-notes" value={t.notes} onChange={(e) => setT({ ...t, notes: e.target.value })} />
      </Field>
      <div className="flex gap-2">
        <Button type="submit">{mode === 'create' ? 'Criar viagem' : 'Salvar'}</Button>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancelar
        </Button>
        {mode === 'edit' && (
          <Button
            type="button"
            variant="destructive"
            className="ml-auto"
            onClick={() => {
              if (confirm(`Excluir a viagem "${trip.title}" e todos os seus dados? Esta ação não pode ser desfeita.`)) {
                void deleteTrip(trip.id)
                onDone()
              }
            }}
          >
            <Trash2 /> Excluir
          </Button>
        )}
      </div>
    </form>
  )
}
