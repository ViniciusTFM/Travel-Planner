import { STORAGE_PREFIX } from '@/domain/constants'
import { uid } from '@/lib/utils'

const USER_REGISTRY_KEY = `${STORAGE_PREFIX}:local-users`
const LEGACY_CREDENTIALS_KEY = `${STORAGE_PREFIX}:local-credentials`
const LEGACY_USER_KEY = `${STORAGE_PREFIX}:legacy-user-id`
const SESSION_KEY = `${STORAGE_PREFIX}:session`
const ITERATIONS = 120_000

interface StoredCredentials {
  version: 1
  userId: string
  username: string
  salt: string
  hash: string
  iterations: number
}

interface LegacyCredentials {
  version: 1
  username: string
  salt: string
  hash: string
  iterations: number
}

interface StoredSession {
  authenticated: true
  userId: string
  username: string
  nonce: string
  createdAt: string
}

interface StoredUserRegistry {
  version: 1
  users: StoredCredentials[]
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

function canonicalUsername(username: string): string {
  return username.trim().toLocaleLowerCase()
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

function parseCredentials(value: unknown): StoredCredentials | null {
  if (!value || typeof value !== 'object') return null
  const c = value as Partial<StoredCredentials>
  return c.version === 1 && typeof c.userId === 'string' && typeof c.username === 'string' && typeof c.salt === 'string' && typeof c.hash === 'string'
    ? {
        version: 1,
        userId: c.userId,
        username: c.username,
        salt: c.salt,
        hash: c.hash,
        iterations: typeof c.iterations === 'number' ? c.iterations : ITERATIONS,
      }
    : null
}

function readLegacyCredentials(): LegacyCredentials | null {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(LEGACY_CREDENTIALS_KEY) ?? 'null')
    if (!value || typeof value !== 'object') return null
    const c = value as Partial<LegacyCredentials>
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

function saveUsers(users: StoredCredentials[]): void {
  const registry: StoredUserRegistry = { version: 1, users }
  localStorage.setItem(USER_REGISTRY_KEY, JSON.stringify(registry))
}

function readUsers(): StoredCredentials[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(USER_REGISTRY_KEY) ?? 'null')
    if (value && typeof value === 'object') {
      const registry = value as Partial<StoredUserRegistry>
      if (registry.version === 1 && Array.isArray(registry.users)) {
        return registry.users.map(parseCredentials).filter((user): user is StoredCredentials => user !== null)
      }
    }
  } catch {
    // Tenta migrar o formato antigo abaixo.
  }

  const legacy = readLegacyCredentials()
  if (!legacy) return []
  const migrated: StoredCredentials = { ...legacy, userId: uid('user') }
  saveUsers([migrated])
  localStorage.setItem(LEGACY_USER_KEY, migrated.userId)
  return [migrated]
}

function readSession(): Partial<StoredSession> | null {
  try {
    const value: unknown = JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? 'null')
    return value && typeof value === 'object' ? (value as Partial<StoredSession>) : null
  } catch {
    return null
  }
}

export function hasCredentials(): boolean {
  return readUsers().length > 0
}

export function isAuthenticated(): boolean {
  return readSession()?.authenticated === true
}

export function currentUserId(): string | null {
  const session = readSession()
  if (typeof session?.userId === 'string') return session.userId
  const username = session?.username
  if (typeof username !== 'string') return null
  return readUsers().find((user) => canonicalUsername(user.username) === canonicalUsername(username))?.userId ?? null
}

export function currentUsername(): string | null {
  const session = readSession()
  return typeof session?.username === 'string' ? session.username : null
}

export function isLegacyUser(userId: string): boolean {
  return localStorage.getItem(LEGACY_USER_KEY) === userId
}

function startSession(user: StoredCredentials): void {
  const session: StoredSession = {
    authenticated: true,
    userId: user.userId,
    username: user.username,
    nonce: uid('session'),
    createdAt: new Date().toISOString(),
  }
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export async function registerLocalUser(usernameInput: string, password: string): Promise<void> {
  const username = usernameInput.trim()
  if (username.length < 3) throw new Error('Informe um usuário com pelo menos 3 caracteres.')
  if (password.length < 6) throw new Error('A senha deve ter pelo menos 6 caracteres.')

  const users = readUsers()
  if (users.some((user) => canonicalUsername(user.username) === canonicalUsername(username))) {
    throw new Error('Este usuário já está cadastrado.')
  }

  const salt = crypto.getRandomValues(new Uint8Array(16))
  const hash = await hashPassword(password, salt)
  const user: StoredCredentials = {
    version: 1,
    userId: uid('user'),
    username,
    salt: encode(salt),
    hash,
    iterations: ITERATIONS,
  }
  saveUsers([...users, user])
  startSession(user)
}

export async function loginLocalUser(usernameInput: string, password: string): Promise<void> {
  const username = usernameInput.trim()
  const user = readUsers().find((candidate) => canonicalUsername(candidate.username) === canonicalUsername(username))
  if (!user) throw new Error('Usuário ou senha inválidos.')
  const hash = await hashPassword(password, decode(user.salt), user.iterations)
  if (hash !== user.hash) throw new Error('Usuário ou senha inválidos.')
  startSession(user)
}

export function logoutLocalUser(): void {
  sessionStorage.removeItem(SESSION_KEY)
}
