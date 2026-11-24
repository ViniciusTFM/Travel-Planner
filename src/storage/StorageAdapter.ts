import type { TravelData, TripSummary } from '@/domain/types'

/**
 * Contrato de persistência. A lógica de negócio só conhece esta interface.
 * Para migrar para Supabase / Firebase / S3, implemente-a (ex.: SupabaseAdapter
 * gravando o TravelData inteiro em uma coluna jsonb / objeto JSON) e troque em storage/index.ts.
 * O modelo de dados não muda.
 */
export interface StorageAdapter {
  /** Carrega o documento de uma viagem (null se não existir). */
  load(tripId: string): Promise<TravelData | null>
  /** Persiste o documento inteiro (upsert pelo trip.id). */
  save(data: TravelData): Promise<void>
  /** Lista as viagens disponíveis. */
  list(): Promise<TripSummary[]>
  /** Remove uma viagem. */
  remove(tripId: string): Promise<void>
}
