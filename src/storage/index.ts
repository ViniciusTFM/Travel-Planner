import { SupabaseStorageAdapter } from './SupabaseStorageAdapter'
import type { StorageAdapter } from './StorageAdapter'

/** Único armazenamento remoto compartilhado por todos os usuários autenticados. */
export const storage: StorageAdapter = new SupabaseStorageAdapter()

export type { StorageAdapter }
