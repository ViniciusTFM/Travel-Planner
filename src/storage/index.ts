import { isLegacyUser } from '@/services/auth'
import { LocalStorageAdapter } from './LocalStorageAdapter'
import type { StorageAdapter } from './StorageAdapter'

/** Cria o armazenamento isolado da conta autenticada. */
export function storageForUser(userId: string): StorageAdapter {
  return new LocalStorageAdapter(userId, isLegacyUser(userId))
}

export type { StorageAdapter }
