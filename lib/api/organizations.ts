import { apiClient } from './client'

export interface Organization {
  organizationPda: string
  treasuryAddress: string
  name: string
  description: string
  avatarUrl: string
  website: string
  twitter: string
}

export async function getMyOrganizations(): Promise<Organization[]> {
  const { data } = await apiClient.get('/v1/organizations/my')
  return data
}

export async function createOrganization(payload: {
  name: string
  description: string
  avatarUrl?: string
  transactionSignature: string
}): Promise<Organization> {
  const { data } = await apiClient.post('/v1/organizations', payload)
  return data
}
