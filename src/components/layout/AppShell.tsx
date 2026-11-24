import { lazy, Suspense, useEffect } from 'react'
import { LogOut, Monitor, Moon, Plane, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { useIsDesktop, useIsTablet } from '@/hooks/useMediaQuery'
import { useTheme, type Theme } from '@/hooks/useTheme'
import { useTravelStore } from '@/store/useTravelStore'
import { currentUsername, logoutLocalUser } from '@/services/auth'
import { CalendarPanel } from '@/components/calendar/CalendarPanel'
import { ChecklistView } from '@/components/checklist/ChecklistView'
import { DocumentsView } from '@/components/documents/DocumentsView'
import { EventPanel } from '@/components/events/EventPanel'
import { GlobalSearch } from '@/components/search/GlobalSearch'
import { SettingsView } from '@/components/settings/SettingsView'
import { TripDialog } from '@/components/trips/TripDialog'
import { BottomNav } from './BottomNav'
import { HomeView } from './HomeView'
import { Sidebar } from './Sidebar'

const FinanceDashboard = lazy(() =>
  import('@/components/finance/FinanceDashboard').then((m) => ({ default: m.FinanceDashboard })),
)

const NEXT_THEME: Record<Theme, Theme> = { light: 'dark', dark: 'system', system: 'light' }
const THEME_LABEL: Record<Theme, string> = { light: 'claro', dark: 'escuro', system: 'do sistema' }

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const Icon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(NEXT_THEME[theme])}
      aria-label={`Tema ${THEME_LABEL[theme]}. Alternar para ${THEME_LABEL[NEXT_THEME[theme]]}`}
    >
      <Icon />
    </Button>
  )
}

function Notice() {
  const notice = useTravelStore((s) => s.notice)
  const setNotice = useTravelStore((s) => s.setNotice)
  useEffect(() => {
    if (!notice) return
    const t = setTimeout(() => setNotice(null), 7000)
    return () => clearTimeout(t)
  }, [notice, setNotice])
  if (!notice) return null
  return (
    <div
      role={notice.kind === 'error' ? 'alert' : 'status'}
      className={`fixed bottom-20 left-1/2 z-[60] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-lg border p-3 text-sm shadow-lg md:bottom-6 ${
        notice.kind === 'error' ? 'border-destructive bg-destructive text-destructive-foreground' : 'bg-card'
      }`}
    >
      <div className="flex items-start gap-3">
        <p className="flex-1">{notice.text}</p>
        <button type="button" className="underline" onClick={() => setNotice(null)}>
          OK
        </button>
      </div>
    </div>
  )
}

export function AppShell() {
  const rawSection = useTravelStore((s) => s.section)
  const title = useTravelStore((s) => s.data.trip.title)
  const selectedId = useTravelStore((s) => s.selectedEventId)
  const draft = useTravelStore((s) => s.draft)
  const cancelDraft = useTravelStore((s) => s.cancelDraft)
  const isDesktop = useIsDesktop()
  const isTablet = useIsTablet()
  const username = currentUsername()

  const section = rawSection === 'home' && isTablet ? 'calendar' : rawSection
  const panelOpen = !isDesktop && (selectedId !== null || draft !== null)

  return (
    <div className="flex h-dvh flex-col">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-[70] focus:rounded focus:bg-background focus:p-2"
      >
        Pular para o conteúdo
      </a>
      <header className="flex items-center gap-2 border-b px-3 py-2">
        <div className="flex items-center gap-2 font-semibold">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Plane className="size-4" aria-hidden="true" />
          </span>
          <span className="hidden sm:inline">Travel Planner</span>
        </div>
        <span className="hidden max-w-[16rem] truncate text-sm text-muted-foreground lg:inline">/ {title}</span>
        <div className="mx-2 flex-1 md:mx-6 md:max-w-xl">
          <GlobalSearch />
        </div>
        <ThemeToggle />
        {username && <span className="hidden max-w-24 truncate text-xs text-muted-foreground sm:inline">{username}</span>}
        <Button
          variant="ghost"
          size="icon"
          aria-label="Sair da sessão"
          title="Sair"
          onClick={() => {
            logoutLocalUser()
            window.location.reload()
          }}
        >
          <LogOut />
        </Button>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[240px_minmax(0,1fr)] lg:grid-cols-[260px_minmax(0,1fr)_360px]">
        <div className="hidden min-h-0 border-r md:block">
          <Sidebar section={section} />
        </div>

        <main id="conteudo" tabIndex={-1} className="min-h-0 overflow-y-auto p-3 pb-20 md:p-4 md:pb-4">
          {section === 'home' && <HomeView />}
          {section === 'calendar' && (
            <div className="h-[calc(100dvh-9.5rem)] min-h-[620px] md:h-full">
              <CalendarPanel />
            </div>
          )}
          {section === 'costs' && (
            <Suspense fallback={<p role="status" className="text-sm text-muted-foreground">Carregando gráficos...</p>}>
              <FinanceDashboard />
            </Suspense>
          )}
          {section === 'documents' && <DocumentsView />}
          {section === 'checklist' && <ChecklistView />}
          {section === 'settings' && <SettingsView />}
        </main>

        {isDesktop && (
          <aside aria-label="Detalhes, editor e custos" className="min-h-0 overflow-hidden border-l p-3">
            <EventPanel />
          </aside>
        )}
      </div>

      <BottomNav section={section} />

      {!isDesktop && (
        <Dialog open={panelOpen} onOpenChange={(o) => !o && cancelDraft()}>
          <DialogContent side={isTablet ? 'right' : 'bottom'} className="p-4">
            <DialogTitle className="sr-only">Evento</DialogTitle>
            <DialogDescription className="sr-only">Detalhes, editor e custos do evento selecionado.</DialogDescription>
            <div className="min-h-0 flex-1 pt-6">
              <EventPanel />
            </div>
          </DialogContent>
        </Dialog>
      )}

      <TripDialog />
      <Notice />
    </div>
  )
}
