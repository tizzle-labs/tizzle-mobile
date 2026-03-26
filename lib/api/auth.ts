import { apiClient } from './client'
import { Storage } from '@/lib/storage'

export async function generateNonce(walletAddress: string): Promise<string> {
  const { data } = await apiClient.post('/v1/auth/nonce', { walletAddress })
  return data.nonce as string
}

export async function verifySignature(payload: {
  walletAddress: string
  signature: string
  message: string
}): Promise<void> {
  const { data } = await apiClient.post('/v1/auth/verify', payload)
  await Storage.setAccessToken(data.accessToken)
  await Storage.setRefreshToken(data.refreshToken)
}
