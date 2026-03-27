import type { Registration } from '@/lib/api/registrations'
import type { Event } from '@/lib/api/events'

export type TicketStatus = 'valid' | 'used' | 'claimable' | 'refunded' | 'no-show' | 'cancelled'

export function deriveTicketStatus(
  registration: Pick<Registration, 'checkedIn' | 'refunded'>,
  event: Pick<Event, 'endTime' | 'unlockTime'>,
  now: number = Date.now(),
): TicketStatus {
  if (registration.refunded) return 'refunded'
  const unlockMs = new Date(event.unlockTime).getTime()
  const endMs = new Date(event.endTime).getTime()
  if (registration.checkedIn && now >= unlockMs) return 'claimable'
  if (registration.checkedIn) return 'used'
  if (now >= endMs) return 'no-show'
  return 'valid'
}
