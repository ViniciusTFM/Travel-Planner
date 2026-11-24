import { useEffect } from 'react'
import { AuthGate } from '@/components/auth/AuthGate'
import { AppShell } from '@/components/layout/AppShell'
import { useTheme } from '@/hooks/useTheme'
import { useTravelStore } from '@/store/useTravelStore'

function AuthenticatedApp() {
  const ready = useTravelStore((s) => s.ready)
  const init = useTravelStore((s) => s.init)
  useTheme()

  useEffect(() => {
    void init()
  }, [init])

  if (!ready) {
    return (
      <div role="status" className="flex h-dvh items-center justify-center text-sm text-muted-foreground">
        Carregando viagem...
      </div>
    )
  }
  return <AppShell />
}

export default function App() {
  return (
    <AuthGate>
      <AuthenticatedApp />
    </AuthGate>
  )
}
