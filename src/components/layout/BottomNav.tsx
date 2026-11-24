import { CalendarDays, FileText, House, Settings, Wallet } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTravelStore, type Section } from '@/store/useTravelStore'

const ITEMS: { section: Section; label: string; icon: typeof House }[] = [
  { section: 'home', label: 'Home', icon: House },
  { section: 'calendar', label: 'Calendário', icon: CalendarDays },
  { section: 'costs', label: 'Custos', icon: Wallet },
  { section: 'documents', label: 'Documentos', icon: FileText },
  { section: 'settings', label: 'Config.', icon: Settings },
]

export function BottomNav({ section }: { section: Section }) {
  const setSection = useTravelStore((s) => s.setSection)
  return (
    <nav
      aria-label="Menu principal"
      className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="grid grid-cols-5">
        {ITEMS.map(({ section: s, label, icon: Icon }) => (
          <li key={s}>
            <button
              type="button"
              aria-current={section === s ? 'page' : undefined}
              onClick={() => setSection(s)}
              className={cn(
                'flex h-14 min-h-11 w-full touch-manipulation flex-col items-center justify-center gap-0.5 text-[11px]',
                section === s ? 'font-semibold text-primary' : 'text-muted-foreground',
              )}
            >
              <Icon className="size-5" aria-hidden="true" />
              {label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
