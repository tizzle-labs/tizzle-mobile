import { apiClient } from './client'

export interface Registration {
  registrationPda: string
  eventPda: string
  stakeAmount: string
  registeredAt: string
  transactionSignature: string
  checkedIn: boolean
  refunded: boolean
  checkedInAt: string | null
  refundedAt: string | null
}

export async function getMyRegistrations(): Promise<Registration[]> {
  const { data } = await apiClient.get('/v1/registrations/my')
  return data
}

export async function getRegistrationByPda(registrationPda: string): Promise<Registration> {
  const { data } = await apiClient.get(`/v1/registrations/${registrationPda}`)
  return data
}

export async function createRegistration(payload: {
  eventPda: string
  transactionSignature: string
  stakeAmount: string
}): Promise<Registration> {
  const { data } = await apiClient.post('/v1/registrations', payload)
  return data
}

export async function checkInRegistration(registrationPda: string): Promise<Registration> {
  const { data } = await apiClient.put(`/v1/registrations/${registrationPda}`, {
    checkedIn: true,
  })
  return data
}

export async function updateRegistrationRefunded(registrationPda: string): Promise<Registration> {
  const { data } = await apiClient.put(`/v1/registrations/${registrationPda}`, {
    refunded: true,
  })
  return data
}
