import { apiClient } from './client'

export interface UserProfile {
  walletAddress: string
  username: string | null
  name: string | null
  avatarUrl: string | null
  bio: string | null
}

export async function getMyProfile(): Promise<UserProfile> {
  const { data } = await apiClient.get('/v1/users/me')
  return data
}

export async function updateMyProfile(payload: {
  username?: string
  name?: string
  bio?: string
  avatarUrl?: string
}): Promise<UserProfile> {
  const { data } = await apiClient.put('/v1/users/me', payload)
  return data
}
