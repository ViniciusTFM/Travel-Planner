import type { TravelData, TripSummary } from '@/domain/types'
import { parseTravelData } from '@/domain/validate'
import { supabase } from '@/lib/supabase'
import type { StorageAdapter } from './StorageAdapter'

const SHARED_ROW_ID = 'default'
const TABLE = 'travel_planner_shared'

type SharedRow = {
  data: unknown
}

export class SupabaseStorageAdapter implements StorageAdapter {
  async load(tripId: string): Promise<TravelData | null> {
    const library = await this.readLibrary()
    return library.find((data) => data.trip.id === tripId) ?? null
  }

  async save(data: TravelData): Promise<void> {
    const library = await this.readLibrary()
    const nextLibrary = library.filter((item) => item.trip.id !== data.trip.id)
    nextLibrary.push(data)
    await this.writeLibrary(nextLibrary)
  }

  async list(): Promise<TripSummary[]> {
    const library = await this.readLibrary()
    return library
      .map(({ trip }) => ({
        id: trip.id,
        title: trip.title,
        startDate: trip.startDate,
        endDate: trip.endDate,
        updatedAt: new Date().toISOString(),
      }))
      .sort((a, b) => a.startDate.localeCompare(b.startDate))
  }

  async remove(tripId: string): Promise<void> {
    const library = await this.readLibrary()
    await this.writeLibrary(library.filter((data) => data.trip.id !== tripId))
  }

  private async readLibrary(): Promise<TravelData[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('data')
      .eq('id', SHARED_ROW_ID)
      .maybeSingle<SharedRow>()
    if (error) throw new Error(`Não foi possível carregar a agenda compartilhada: ${error.message}`)
    if (!data) return []
    return parseLibrary(data.data)
  }

  private async writeLibrary(library: TravelData[]): Promise<void> {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError) throw new Error(`Não foi possível validar a sessão: ${userError.message}`)
    if (!user) throw new Error('Sua sessão expirou. Entre novamente para salvar a agenda.')

    const { error } = await supabase.from(TABLE).upsert({
      id: SHARED_ROW_ID,
      data: library,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    })
    if (error) throw new Error(`Não foi possível salvar a agenda compartilhada: ${error.message}`)
  }
}

function parseLibrary(input: unknown): TravelData[] {
  if (Array.isArray(input)) {
    return input.map(parseTravelDataSafely).filter((data): data is TravelData => data !== null)
  }
  const single = parseTravelDataSafely(input)
  return single ? [single] : []
}

function parseTravelDataSafely(input: unknown): TravelData | null {
  try {
    return parseTravelData(input)
  } catch {
    return null
  }
}
