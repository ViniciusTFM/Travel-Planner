import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

export function uid(prefix: string): string {
  const rnd =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10)
  return `${prefix}-${rnd}`
}

const pad = (n: number): string => String(n).padStart(2, '0')

/** Date -> YYYY-MM-DD (local). */
export function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Date -> YYYY-MM-DDTHH:mm:ss (local, sem fuso). */
export function toLocalISO(d: Date): string {
  return `${toDateStr(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

/** Interpreta YYYY-MM-DD ou YYYY-MM-DDTHH:mm[:ss] como horário local. */
export function parseLocal(s: string): Date {
  const [datePart = '', timePart = '00:00:00'] = s.split('T')
  const [y = 1970, m = 1, d = 1] = datePart.split('-').map(Number)
  const [hh = 0, mm = 0, ss = 0] = timePart.split(':').map(Number)
  return new Date(y, m - 1, d, hh, mm, ss)
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

export function dayDiff(a: string, b: string): number {
  const da = parseLocal(a.slice(0, 10))
  const db = parseLocal(b.slice(0, 10))
  return Math.round((db.getTime() - da.getTime()) / 86_400_000)
}

export function formatDate(s: string, opts?: Intl.DateTimeFormatOptions): string {
  return parseLocal(s).toLocaleDateString('pt-BR', opts ?? { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatTime(s: string): string {
  return parseLocal(s).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export function formatDateTime(s: string, allDay = false): string {
  return allDay
    ? formatDate(s, { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
    : `${formatDate(s, { weekday: 'short', day: '2-digit', month: 'short' })} ${formatTime(s)}`
}

export function formatMoney(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(value)
  } catch {
    return `${currency} ${value.toFixed(2)}`
  }
}

export function normalize(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function slugify(s: string): string {
  return normalize(s).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'viagem'
}
