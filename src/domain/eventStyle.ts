import type { EventType, TravelEvent } from './types'
import { TYPE_META } from './constants'

const HEX_COLOR = /^#[0-9a-f]{6}$/i

export function normalizeColor(value: unknown): string | undefined {
  return typeof value === 'string' && HEX_COLOR.test(value) ? value.toLowerCase() : undefined
}

export function getEventColor(event: Pick<TravelEvent, 'type' | 'color'>): string {
  return normalizeColor(event.color) ?? TYPE_META[event.type].color
}

/** Escolhe a cor de texto com maior contraste contra um fundo RGB opaco. */
export function getContrastText(color: string): '#111827' | '#ffffff' {
  const normalized = normalizeColor(color) ?? '#64748b'
  const red = Number.parseInt(normalized.slice(1, 3), 16) / 255
  const green = Number.parseInt(normalized.slice(3, 5), 16) / 255
  const blue = Number.parseInt(normalized.slice(5, 7), 16) / 255
  const channel = (value: number): number => (value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
  const luminance = 0.2126 * channel(red) + 0.7152 * channel(green) + 0.0722 * channel(blue)
  const contrastBlack = (luminance + 0.05) / 0.05
  const contrastWhite = 1.05 / (luminance + 0.05)
  return contrastBlack >= contrastWhite ? '#111827' : '#ffffff'
}

export function getDefaultEventColor(type: EventType): string {
  return TYPE_META[type].color
}
