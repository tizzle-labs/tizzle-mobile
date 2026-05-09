import { apiClient } from './client'

export interface Event {
  eventPda: string
  eventId: string
  organizationPda: string
  gatekeeperAddress: string
  title: string
  description: string
  imageUrl: string
  location: string
  locationDetail?: string
  latitude?: number
  longitude?: number
  category: string
  capacity: number
  stakeAmount: string
  stakeTokenMint: string
  stakeTokenSymbol: string
  stakeTokenDecimals: number
  hostFeeEnabled: boolean
  hostFeePercent: number
  platformFeePaid: string
  startTime: string
  endTime: string
  unlockTime: string
  isPublished: boolean
  isFeatured: boolean
  totalRegistered: number
  totalCheckedIn: number
  organizerAddress: string
  organizerWithdrawn: boolean
  organizationName: string | null
  organizationAvatarUrl: string | null
  venueImageUrl: string | null
  createdAt: string
}

export interface CreateEventPayload {
  eventPda: string
  eventId: string
  organizationPda: string
  gatekeeperAddress: string
  title: string
  description?: string
  imageUrl?: string
  location?: string
  locationDetail?: string
  latitude?: number
  longitude?: number
  category?: string
  capacity: number
  stakeAmount: number
  stakeTokenMint: string
  stakeTokenSymbol?: string
  stakeTokenDecimals?: number
  hostFeeEnabled?: boolean
  hostFeePercent?: number
  platformFeePaid: number
  startTime: string
  endTime: string
  unlockTime: string
}

export async function getEvents(params?: {
  limit?: number
  offset?: number
  sortBy?: 'created_at' | 'start_time'
  organizationPda?: string
  category?: string
}): Promise<Event[]> {
  const { data } = await apiClient.get('/v1/events', { params })
  return data
}

export async function getForYouEvents(params?: { limit?: number; offset?: number }): Promise<Event[]> {
  const { data } = await apiClient.get('/v1/events/for-you', { params })
  return data
}

export async function getEventByPda(eventPda: string): Promise<Event> {
  const { data } = await apiClient.get(`/v1/events/${eventPda}`)
  return data
}

export async function createEvent(payload: CreateEventPayload): Promise<Event> {
  const { data } = await apiClient.post('/v1/events', payload)
  return data
}

export async function updateEvent(
  eventPda: string,
  payload: Partial<Pick<Event, 'title' | 'description' | 'imageUrl' | 'venueImageUrl' | 'isPublished'>>,
): Promise<Event> {
  const { data } = await apiClient.patch(`/v1/events/${eventPda}`, payload)
  return data
}
