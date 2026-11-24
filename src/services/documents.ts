import type { TravelDocument } from '@/domain/types'
import { uid } from '@/lib/utils'

export const ACCEPT = '.pdf,.png,.jpg,.jpeg,.webp,.txt,application/pdf,image/png,image/jpeg,image/webp,text/plain'
const ALLOWED = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'text/plain']
/** O LocalStorage tem ~5 MB; limitamos cada anexo. Em nuvem este limite pode subir. */
export const MAX_BYTES = 1_500_000

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result))
    r.onerror = () => reject(r.error ?? new Error('Falha ao ler arquivo'))
    r.readAsDataURL(file)
  })
}

export async function filesToDocuments(
  files: FileList | File[],
  eventId: string | null,
): Promise<{ docs: TravelDocument[]; errors: string[] }> {
  const docs: TravelDocument[] = []
  const errors: string[] = []
  for (const file of Array.from(files)) {
    if (!ALLOWED.includes(file.type)) {
      errors.push(`${file.name}: tipo não permitido (use PDF, PNG, JPG, WEBP ou TXT).`)
      continue
    }
    if (file.size > MAX_BYTES) {
      errors.push(`${file.name}: maior que ${(MAX_BYTES / 1_000_000).toFixed(1)} MB.`)
      continue
    }
    docs.push({
      id: uid('doc'),
      name: file.name,
      mimeType: file.type,
      size: file.size,
      dataUrl: await readAsDataUrl(file),
      eventId,
      createdAt: new Date().toISOString(),
    })
  }
  return { docs, errors }
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

/** Abre o documento em nova aba (data URLs são bloqueadas como navegação direta; usa Blob). */
export function openDocument(doc: TravelDocument): void {
  if (!doc.dataUrl) return
  const [head = '', body = ''] = doc.dataUrl.split(',')
  const mime = head.match(/data:([^;]+)/)?.[1] ?? doc.mimeType
  const bin = atob(body)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  const url = URL.createObjectURL(new Blob([bytes], { type: mime }))
  window.open(url, '_blank', 'noopener')
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
