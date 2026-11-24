import { STORAGE_PREFIX } from '@/domain/constants'
import { uid } from '@/lib/utils'

const CREDENTIALS_KEY = `${STORAGE_PREFIX}:local-credentials`
const SESSION_KEY = `${STORAGE_PREFIX}:session`
const ITERATIONS = 120_000

interface StoredCredentials {
  version: 1
  username: string
  salt: string
  hash: string
  iterations: number
}

interface StoredSession {
  authenticated: true
  username: string
  nonce: string
  createdAt: string
}

function encode(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

function decode(value: string): Uint8Array {
  const binary = atob(value)
  return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

async function hashPassword(password: string, salt: Uint8Array, iterations = ITERATIONS): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const saltBuffer = new Uint8Array(salt).buffer as ArrayBuffer
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: saltBuffer, iterations, hash: 'SHA-256' },
    key,
    256,
  )
  return encode(new Uint8Array(bits))
}

function readCredentials(): StoredCredentials | null {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(CREDENTIALS_KEY) ?? 'null')
    if (!value || typeof value !== 'object') return null
    const c = value as Partial<StoredCredentials>
    return c.version === 1 && typeof c.username === 'string' && typeof c.salt === 'string' && typeof c.hash === 'string'
      ? {
          version: 1,
          username: c.username,
          salt: c.salt,
          hash: c.hash,
          iterations: typeof c.iterations === 'number' ? c.iterations : ITERATIONS,
        }
      : null
  } catch {
    return null
  }
}

export function hasCredentials(): boolean {
  return readCredentials() !== null
}

export function isAuthenticated(): boolean {
  try {
    const value: unknown = JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? 'null')
    return !!value && typeof value === 'object' && (value as Partial<StoredSession>).authenticated === true
  } catch {
    return false
  }
}

export function currentUsername(): string | null {
  try {
    const value: unknown = JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? 'null')
    return value && typeof value === 'object' && typeof (value as Partial<StoredSession>).username === 'string'
      ? (value as StoredSession).username
      : null
  } catch {
    return null
  }
}

function startSession(username: string): void {
  const session: StoredSession = {
    authenticated: true,
    username,
    nonce: uid('session'),
    createdAt: new Date().toISOString(),
  }
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export async function registerLocalUser(usernameInput: string, password: string): Promise<void> {
  const username = usernameInput.trim()
  if (username.length < 3) throw new Error('Informe um usuário com pelo menos 3 caracteres.')
  if (password.length < 6) throw new Error('A senha deve ter pelo menos 6 caracteres.')
  if (hasCredentials()) throw new Error('Já existe um acesso local configurado.')

  const salt = crypto.getRandomValues(new Uint8Array(16))
  const hash = await hashPassword(password, salt)
  const credentials: StoredCredentials = {
    version: 1,
    username,
    salt: encode(salt),
    hash,
    iterations: ITERATIONS,
  }
  localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(credentials))
  startSession(username)
}

export async function loginLocalUser(usernameInput: string, password: string): Promise<void> {
  const credentials = readCredentials()
  const username = usernameInput.trim()
  if (!credentials || username !== credentials.username) throw new Error('Usuário ou senha inválidos.')
  const hash = await hashPassword(password, decode(credentials.salt), credentials.iterations)
  if (hash !== credentials.hash) throw new Error('Usuário ou senha inválidos.')
  startSession(credentials.username)
}

export function logoutLocalUser(): void {
  sessionStorage.removeItem(SESSION_KEY)
}
