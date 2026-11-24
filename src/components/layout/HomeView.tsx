import { CheckSquare } from 'lucide-react'
import { TripSummaryCard } from '@/components/trips/TripSummaryCard'
import { TripList } from '@/components/trips/TripList'
import { Favorites } from './Sidebar'
import { TotalCards } from '@/components/finance/CostSummary'
import { useTravelStore } from '@/store/useTravelStore'

/** Tela inicial mobile: resumo, custos, viagens, favoritos e atalho de checklist. */
export function HomeView() {
  const setSection = useTravelStore((s) => s.setSection)
  const pending = useTravelStore((s) => s.data.checklists.reduce((n, c) => n + c.items.filter((i) => !i.done).length, 0))
  return (
    <div className="space-y-5">
      <TripSummaryCard />
      <TotalCards />
      <button
        type="button"
        onClick={() => setSection('checklist')}
        className="flex w-full items-center gap-3 rounded-lg border bg-card p-3 text-left hover:bg-accent"
      >
        <CheckSquare className="size-5" aria-hidden="true" />
        <span className="flex-1 text-sm font-medium">Checklist</span>
        <span className="text-xs text-muted-foreground">{pending} pendente(s)</span>
      </button>
      <TripList />
      <Favorites />
    </div>
  )
}
