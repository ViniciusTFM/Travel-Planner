import type { TravelData, TripSummary } from '@/domain/types'
import { parseTravelData } from '@/domain/validate'
import { STORAGE_PREFIX } from '@/domain/constants'
import type { StorageAdapter } from './StorageAdapter'

const LEGACY_INDEX_KEY = `${STORAGE_PREFIX}:index`
const legacyTripKey = (id: string): string => `${STORAGE_PREFIX}:trip:${id}`

export class LocalStorageAdapter implements StorageAdapter {
  private readonly indexKey: string
  private readonly tripKey: (id: string) => string

  constructor(userId: string, migrateLegacy = false) {
    const scope = `${STORAGE_PREFIX}:user:${userId}`
    this.indexKey = `${scope}:index`
    this.tripKey = (id: string) => `${scope}:trip:${id}`
    if (migrateLegacy) this.migrateLegacyData()
  }

  async load(tripId: string): Promise<TravelData | null> {
    const raw = localStorage.getItem(this.tripKey(tripId))
    if (!raw) return null
    try {
      return parseTravelData(JSON.parse(raw))
    } catch {
      return null
    }
  }

  async save(data: TravelData): Promise<void> {
    try {
      localStorage.setItem(this.tripKey(data.trip.id), JSON.stringify(data))
    } catch (err) {
      throw new Error(
        'Não foi possível salvar: armazenamento local cheio. Remova documentos grandes ou exporte a viagem.',
        { cause: err },
      )
    }
    const index = this.readIndex().filter((s) => s.id !== data.trip.id)
    index.push({
      id: data.trip.id,
      title: data.trip.title,
      startDate: data.trip.startDate,
      endDate: data.trip.endDate,
      updatedAt: new Date().toISOString(),
    })
    localStorage.setItem(this.indexKey, JSON.stringify(index))
  }

  async list(): Promise<TripSummary[]> {
    return this.readIndex().sort((a, b) => a.startDate.localeCompare(b.startDate))
  }

  async remove(tripId: string): Promise<void> {
    localStorage.removeItem(this.tripKey(tripId))
    localStorage.setItem(this.indexKey, JSON.stringify(this.readIndex().filter((s) => s.id !== tripId)))
  }

  private readIndex(): TripSummary[] {
    try {
      const parsed: unknown = JSON.parse(localStorage.getItem(this.indexKey) ?? '[]')
      return Array.isArray(parsed) ? (parsed as TripSummary[]) : []
    } catch {
      return []
    }
  }

  private migrateLegacyData(): void {
    if (localStorage.getItem(this.indexKey) !== null) return
    try {
      const parsed: unknown = JSON.parse(localStorage.getItem(LEGACY_INDEX_KEY) ?? '[]')
      if (!Array.isArray(parsed)) return
      const migrated: TripSummary[] = []
      for (const summary of parsed) {
        if (!summary || typeof summary !== 'object' || typeof (summary as TripSummary).id !== 'string') continue
        const raw = localStorage.getItem(legacyTripKey((summary as TripSummary).id))
        if (!raw) continue
        try {
          const data = parseTravelData(JSON.parse(raw))
          localStorage.setItem(this.tripKey(data.trip.id), JSON.stringify(data))
          migrated.push({
            id: data.trip.id,
            title: data.trip.title,
            startDate: data.trip.startDate,
            endDate: data.trip.endDate,
            updatedAt: typeof (summary as TripSummary).updatedAt === 'string' ? (summary as TripSummary).updatedAt : new Date().toISOString(),
          })
        } catch {
          // Ignora uma viagem antiga corrompida e preserva as demais.
        }
      }
      if (migrated.length > 0) localStorage.setItem(this.indexKey, JSON.stringify(migrated))
    } catch {
      // Uma biblioteca antiga inválida não deve impedir o acesso do usuário.
    }
  }
}
