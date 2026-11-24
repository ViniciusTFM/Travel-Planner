import { useEffect } from 'react'
import { AuthGate } from '@/components/auth/AuthGate'
import { AppShell } from '@/components/layout/AppShell'
import { TripPicker } from '@/components/trips/TripPicker'
import { useTheme } from '@/hooks/useTheme'
import { useTravelStore } from '@/store/useTravelStore'

function AuthenticatedApp() {
  const ready = useTravelStore((s) => s.ready)
  const tripEntered = useTravelStore((s) => s.tripEntered)
  const init = useTravelStore((s) => s.init)
  useTheme()

  useEffect(() => {
    void init()
  }, [init])

  if (!ready) {
    return (
      <div role="status" className="flex h-dvh items-center justify-center text-sm text-muted-foreground">
        Carregando viagens...
      </div>
    )
  }
  if (!tripEntered) return <TripPicker />
  return <AppShell />
}

export default function App() {
  return (
    <AuthGate>
      <AuthenticatedApp />
    </AuthGate>
  )
}
