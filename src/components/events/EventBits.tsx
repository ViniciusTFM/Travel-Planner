import {
  Bed,
  Bus,
  Compass,
  Landmark,
  Plane,
  ShoppingBag,
  Star,
  Ticket,
  Utensils,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import type { EventType } from '@/domain/types'
import { TYPE_META } from '@/domain/constants'
import { Badge } from '@/components/ui/misc'

export const TYPE_ICONS: Record<EventType, LucideIcon> = {
  flight: Plane,
  hotel: Bed,
  tour: Compass,
  restaurant: Utensils,
  transport: Bus,
  ticket: Ticket,
  museum: Landmark,
  shopping: ShoppingBag,
  expense: Wallet,
  custom: Star,
}

export function TypeIcon({ type, className }: { type: EventType; className?: string }) {
  const Icon = TYPE_ICONS[type]
  return <Icon className={className ?? 'size-4'} style={{ color: TYPE_META[type].color }} aria-hidden="true" />
}

export function TypeBadge({ type }: { type: EventType }) {
  const meta = TYPE_META[type]
  return (
    <Badge color={meta.color}>
      <TypeIcon type={type} className="mr-1 size-3" />
      {meta.label}
    </Badge>
  )
}

export function TagList({ tags }: { tags: string[] }) {
  if (!tags.length) return null
  return (
    <ul className="flex flex-wrap gap-1" aria-label="Tags">
      {tags.map((t) => (
        <li key={t}>
          <Badge>{t}</Badge>
        </li>
      ))}
    </ul>
  )
}
