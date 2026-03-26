import axios from 'axios'
import { AppConfig } from '@/constants/app-config'
import { Storage } from '@/lib/storage'

export const apiClient = axios.create({
  baseURL: AppConfig.apiBaseUrl,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

let _onLogout: (() => void) | null = null

export function setLogoutCallback(cb: () => void) {
  _onLogout = cb
}

// Attach JWT to every request
apiClient.interceptors.request.use(async (config) => {
  const token = await Storage.getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// 401 → try refresh → retry once
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refresh = await Storage.getRefreshToken()
        if (!refresh) throw new Error('no refresh token')
        const { data } = await axios.post(
          `${AppConfig.apiBaseUrl}/v1/auth/refresh`,
          null,
          { headers: { Authorization: `Bearer ${refresh}` } }
        )
        await Storage.setAccessToken(data.accessToken)
        original.headers.Authorization = `Bearer ${data.accessToken}`
        return apiClient(original)
      } catch {
        await Storage.clearTokens()
        _onLogout?.()
      }
    }
    return Promise.reject(error)
  }
)
