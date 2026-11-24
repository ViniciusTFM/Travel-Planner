import { useEffect, useState } from 'react'
import { KeyRound, LockKeyhole, LogIn, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/misc'
import { Field, Input } from '@/components/ui/form'
import { hasCredentials, isAuthenticated, loginLocalUser, registerLocalUser } from '@/services/auth'

interface Props {
  children: React.ReactNode
}

type Mode = 'login' | 'setup'

export function AuthGate({ children }: Props) {
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const [mode, setMode] = useState<Mode>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const configured = hasCredentials()
    setMode(configured ? 'login' : 'setup')
    setAuthenticated(configured && isAuthenticated())
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div role="status" className="flex h-dvh items-center justify-center text-sm text-muted-foreground">
        Verificando sessão...
      </div>
    )
  }

  if (authenticated) return <>{children}</>

  const submit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      if (mode === 'setup') {
        if (password !== confirmation) throw new Error('As senhas não coincidem.')
        await registerLocalUser(username, password)
      } else {
        await loginLocalUser(username, password)
      }
      setAuthenticated(true)
      setPassword('')
      setConfirmation('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível autenticar.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            {mode === 'setup' ? <UserPlus className="size-6" aria-hidden="true" /> : <LockKeyhole className="size-6" aria-hidden="true" />}
          </div>
          <div>
            <CardTitle className="text-xl">Travel Planner</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {mode === 'setup' ? 'Crie seu acesso local para começar' : 'Entre para acessar suas viagens'}
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void submit(e)} className="space-y-4" noValidate>
            {error && (
              <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </p>
            )}
            <Field label="Usuário" htmlFor="auth-username">
              <Input
                id="auth-username"
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </Field>
            <Field label="Senha" htmlFor="auth-password">
              <Input
                id="auth-password"
                type="password"
                autoComplete={mode === 'setup' ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </Field>
            {mode === 'setup' && (
              <Field label="Confirmar senha" htmlFor="auth-confirmation">
                <Input
                  id="auth-confirmation"
                  type="password"
                  autoComplete="new-password"
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                  required
                  minLength={6}
                />
              </Field>
            )}
            <Button type="submit" className="w-full" disabled={busy}>
              {mode === 'setup' ? <UserPlus /> : <LogIn />}
              {busy ? 'Aguarde...' : mode === 'setup' ? 'Criar acesso' : 'Entrar'}
            </Button>
          </form>
          <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
            <KeyRound className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            Este acesso é local neste navegador. A sessão é encerrada ao fechar a aba ou sair.
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
