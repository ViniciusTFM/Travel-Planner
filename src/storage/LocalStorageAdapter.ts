import type { TravelData, TripSummary } from '@/domain/types'
import { parseTravelData } from '@/domain/validate'
import { STORAGE_PREFIX } from '@/domain/constants'
import type { StorageAdapter } from './StorageAdapter'

const INDEX_KEY = `${STORAGE_PREFIX}:index`
const tripKey = (id: string): string => `${STORAGE_PREFIX}:trip:${id}`

export class LocalStorageAdapter implements StorageAdapter {
  async load(tripId: string): Promise<TravelData | null> {
    const raw = localStorage.getItem(tripKey(tripId))
    if (!raw) return null
    try {
      return parseTravelData(JSON.parse(raw))
    } catch {
      return null
    }
  }

  async save(data: TravelData): Promise<void> {
    try {
      localStorage.setItem(tripKey(data.trip.id), JSON.stringify(data))
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
    localStorage.setItem(INDEX_KEY, JSON.stringify(index))
  }

  async list(): Promise<TripSummary[]> {
    return this.readIndex().sort((a, b) => a.startDate.localeCompare(b.startDate))
  }

  async remove(tripId: string): Promise<void> {
    localStorage.removeItem(tripKey(tripId))
    localStorage.setItem(INDEX_KEY, JSON.stringify(this.readIndex().filter((s) => s.id !== tripId)))
  }

  private readIndex(): TripSummary[] {
    try {
      const parsed: unknown = JSON.parse(localStorage.getItem(INDEX_KEY) ?? '[]')
      return Array.isArray(parsed) ? (parsed as TripSummary[]) : []
    } catch {
      return []
    }
  }
}
