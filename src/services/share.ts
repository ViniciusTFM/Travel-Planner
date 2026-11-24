import LZString from 'lz-string'
import type { TravelData } from '@/domain/types'
import { parseTravelData } from '@/domain/validate'

export const SHARE_PARAM = 'trip'

/** Gera a parte comprimida (LZ-String, URI-safe) do documento. Anexos binários são omitidos. */
export function encodeTrip(data: TravelData): string {
  const light: TravelData = { ...data, documents: data.documents.map((d) => ({ ...d, dataUrl: '' })) }
  return LZString.compressToEncodedURIComponent(JSON.stringify(light))
}

export function decodeTrip(payload: string): TravelData {
  const json = LZString.decompressFromEncodedURIComponent(payload)
  if (!json) throw new Error('Link inválido ou corrompido.')
  return parseTravelData(JSON.parse(json))
}

export function buildShareUrl(data: TravelData): string {
  const url = new URL(window.location.href)
  url.search = ''
  url.hash = `${SHARE_PARAM}=${encodeTrip(data)}`
  return url.toString()
}

/** Lê o hash atual; retorna a viagem compartilhada, se houver. */
export function readSharedTripFromLocation(): TravelData | null {
  const hash = window.location.hash.replace(/^#/, '')
  if (!hash.startsWith(`${SHARE_PARAM}=`)) return null
  return decodeTrip(hash.slice(SHARE_PARAM.length + 1))
}

export function clearShareHash(): void {
  history.replaceState(null, '', window.location.pathname + window.location.search)
}
