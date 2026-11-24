import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { KeyRound, LockKeyhole, LogIn, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/misc'
import { Field, Input } from '@/components/ui/form'
import { cacheAuthSession, getAuthSession, loginUser, registerUser, subscribeAuth } from '@/services/auth'

interface Props {
  children: React.ReactNode
}

type Mode = 'login' | 'register'

export function AuthGate({ children }: Props) {
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<Session | null>(null)
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [feedback, setFeedback] = useState<{ kind: 'info' | 'error'; text: string } | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let mounted = true
    const unsubscribe = subscribeAuth((nextSession) => {
      if (mounted) setSession(nextSession)
    })
    void getAuthSession()
      .then((nextSession) => {
        if (mounted) setSession(nextSession)
      })
      .catch((err) => {
        if (mounted) setFeedback({ kind: 'error', text: err instanceof Error ? err.message : 'Não foi possível verificar a sessão.' })
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
      unsubscribe()
    }
  }, [])

  if (loading) {
    return (
      <div role="status" className="flex h-dvh items-center justify-center text-sm text-muted-foreground">
        Verificando sessão...
      </div>
    )
  }

  if (session) return <>{children}</>

  const submit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault()
    setFeedback(null)
    setBusy(true)
    try {
      if (mode === 'register') {
        if (password !== confirmation) throw new Error('As senhas não coincidem.')
        const createdSession = await registerUser(email, password)
        if (!createdSession) {
          setMode('login')
          setFeedback({ kind: 'info', text: 'Cadastro criado. Confirme seu e-mail e depois entre na conta.' })
        } else {
          cacheAuthSession(createdSession)
          setSession(createdSession)
        }
      } else {
        const loggedSession = await loginUser(email, password)
        cacheAuthSession(loggedSession)
        setSession(loggedSession)
      }
      setPassword('')
      setConfirmation('')
    } catch (err) {
      setFeedback({ kind: 'error', text: err instanceof Error ? err.message : 'Não foi possível autenticar.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            {mode === 'register' ? <UserPlus className="size-6" aria-hidden="true" /> : <LockKeyhole className="size-6" aria-hidden="true" />}
          </div>
          <div>
            <CardTitle className="text-xl">Travel Planner</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {mode === 'register' ? 'Crie seu cadastro para acessar a agenda compartilhada' : 'Entre para acessar a agenda compartilhada'}
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void submit(e)} className="space-y-4" noValidate>
            {feedback && (
              <p
                role={feedback.kind === 'error' ? 'alert' : 'status'}
                className={`rounded-md p-3 text-sm ${feedback.kind === 'error' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-foreground'}`}
              >
                {feedback.text}
              </p>
            )}
            <Field label="E-mail" htmlFor="auth-email">
              <Input
                id="auth-email"
                type="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Field>
            <Field label="Senha" htmlFor="auth-password">
              <Input
                id="auth-password"
                type="password"
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </Field>
            {mode === 'register' && (
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
              {mode === 'register' ? <UserPlus /> : <LogIn />}
              {busy ? 'Aguarde...' : mode === 'register' ? 'Criar cadastro' : 'Entrar'}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {mode === 'register' ? 'Já possui cadastro?' : 'Ainda não possui cadastro?'}{' '}
            <Button
              type="button"
              variant="link"
              size="sm"
              className="h-auto p-0"
              onClick={() => {
                setMode(mode === 'register' ? 'login' : 'register')
                setFeedback(null)
                setPassword('')
                setConfirmation('')
              }}
            >
              {mode === 'register' ? 'Entrar' : 'Criar cadastro'}
            </Button>
          </p>
          <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
            <KeyRound className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            Sua conta e a agenda ficam sincronizadas pelo Supabase para todos os usuários autenticados.
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
