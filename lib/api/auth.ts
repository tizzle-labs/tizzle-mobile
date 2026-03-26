import axios from 'axios'
import { AppConfig } from '@/constants/app-config'
import { Storage } from '@/lib/storage'

const authAxios = axios.create({
  baseURL: AppConfig.apiBaseUrl,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

export async function generateNonce(walletAddress: string): Promise<string> {
  const { data } = await authAxios.post('/v1/auth/nonce', { walletAddress })
  return data.nonce as string
}

export async function verifySignature(payload: {
  walletAddress: string
  signature: string
  message: string
}): Promise<void> {
  const { data } = await authAxios.post('/v1/auth/verify', payload)
  await Storage.setAccessToken(data.accessToken)
  await Storage.setRefreshToken(data.refreshToken)
}
