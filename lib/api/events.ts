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
}

export interface CreateEventPayload {
  eventPda: string
  eventId: string
  organizationPda: string
  gatekeeperAddress: string
  title: string
  description: string
  imageUrl: string
  location: string
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
  transactionSignature?: string
}

export async function getEvents(params?: { limit?: number }): Promise<Event[]> {
  const { data } = await apiClient.get('/v1/events', { params })
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
  payload: Partial<Pick<Event, 'title' | 'description' | 'imageUrl' | 'isPublished'>>,
): Promise<Event> {
  const { data } = await apiClient.put(`/v1/events/${eventPda}`, payload)
  return data
}
