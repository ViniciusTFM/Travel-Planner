import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

let cachedSession: Session | null = null

function validateCredentials(email: string, password: string): { email: string; password: string } {
  const normalizedEmail = email.trim().toLowerCase()
  if (!normalizedEmail || !normalizedEmail.includes('@')) throw new Error('Informe um e-mail válido.')
  if (password.length < 6) throw new Error('A senha deve ter pelo menos 6 caracteres.')
  return { email: normalizedEmail, password }
}

export async function getAuthSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  cachedSession = data.session
  return cachedSession
}

export function subscribeAuth(onChange: (session: Session | null, event: AuthChangeEvent) => void): () => void {
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    cachedSession = session
    onChange(session, event)
  })
  return () => data.subscription.unsubscribe()
}

export function cacheAuthSession(session: Session | null): void {
  cachedSession = session
}

export function currentUsername(): string | null {
  return cachedSession?.user.email ?? null
}

export async function registerUser(emailInput: string, password: string): Promise<Session | null> {
  const credentials = validateCredentials(emailInput, password)
  const { data, error } = await supabase.auth.signUp({ email: credentials.email, password: credentials.password })
  if (error) throw error
  cachedSession = data.session
  return data.session
}

export async function loginUser(emailInput: string, password: string): Promise<Session> {
  const credentials = validateCredentials(emailInput, password)
  const { data, error } = await supabase.auth.signInWithPassword(credentials)
  if (error) throw error
  if (!data.session) throw new Error('O Supabase não retornou uma sessão autenticada.')
  cachedSession = data.session
  return data.session
}

export async function logoutUser(): Promise<void> {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
  cachedSession = null
}
