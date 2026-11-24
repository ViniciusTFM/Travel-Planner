import { useMemo } from 'react'
import { useTravelStore, type RightTab } from '@/store/useTravelStore'
import { Tabs, EmptyState } from '@/components/ui/misc'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { EventForm } from './EventForm'
import { EventDetails } from './EventDetails'
import { CostSummary } from '@/components/finance/CostSummary'

const TABS: { value: RightTab; label: string }[] = [
  { value: 'details', label: 'Detalhes' },
  { value: 'editor', label: 'Editor' },
  { value: 'costs', label: 'Custos' },
]

/** Coluna direita: Detalhes | Editor | Custos. */
export function EventPanel() {
  const tab = useTravelStore((s) => s.rightTab)
  const setTab = useTravelStore((s) => s.setRightTab)
  const selectedId = useTravelStore((s) => s.selectedEventId)
  const draft = useTravelStore((s) => s.draft)
  const events = useTravelStore((s) => s.data.events)
  const startDraft = useTravelStore((s) => s.startDraft)
  const cancelDraft = useTravelStore((s) => s.cancelDraft)
  const selectEvent = useTravelStore((s) => s.selectEvent)

  const selected = useMemo(() => events.find((e) => e.id === selectedId) ?? null, [events, selectedId])
  const current = draft ?? selected

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <Tabs items={TABS} value={tab} onChange={setTab} label="Painel do evento" className="w-full shrink-0" />
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
        {tab === 'costs' && <CostSummary />}

        {tab === 'details' &&
          (selected ? (
            <EventDetails event={selected} />
          ) : (
            <div className="space-y-3">
              <EmptyState>Selecione um evento no calendário para ver os detalhes.</EmptyState>
              <Button className="w-full" onClick={() => startDraft()}>
                <Plus /> Novo evento
              </Button>
            </div>
          ))}

        {tab === 'editor' &&
          (current ? (
            <EventForm
              key={current.id}
              initial={current}
              isNew={!!draft}
              onCancel={() => (draft ? cancelDraft() : selectEvent(current.id))}
            />
          ) : (
            <div className="space-y-3">
              <EmptyState>Nenhum evento em edição.</EmptyState>
              <Button className="w-full" onClick={() => startDraft()}>
                <Plus /> Novo evento
              </Button>
            </div>
          ))}
      </div>
    </div>
  )
}
