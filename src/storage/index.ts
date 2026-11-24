import { LocalStorageAdapter } from './LocalStorageAdapter'
import type { StorageAdapter } from './StorageAdapter'

/** Único ponto de troca de backend (LocalStorage → Supabase/Firebase/S3). */
export const storage: StorageAdapter = new LocalStorageAdapter()

export type { StorageAdapter }
