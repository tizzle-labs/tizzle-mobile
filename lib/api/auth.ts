import { AppConfig } from '@/constants/app-config'
import { Storage } from '@/lib/storage'
import axios from 'axios'

const authAxios = axios.create({
  baseURL: AppConfig.apiBaseUrl,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

export async function generateNonce(walletAddress: string): Promise<{ nonce: string; message: string }> {
  const { data } = await authAxios.post<{ data: { nonce: string; message: string } }>('/v1/auth/nonce', {
    walletAddress,
  })
  return { nonce: data.data.nonce, message: data.data.message }
}

export async function verifySignature(payload: {
  walletAddress: string
  signature: string
  message: string
}): Promise<void> {
  const { data } = await authAxios.post<{ data: { accessToken: string } }>('/v1/auth/verify', payload)
  await Storage.setAccessToken(data.data.accessToken)
}
