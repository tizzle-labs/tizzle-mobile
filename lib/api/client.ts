import { AppConfig } from '@/constants/app-config'
import { Storage } from '@/lib/storage'
import axios from 'axios'

export const apiClient = axios.create({
  baseURL: AppConfig.apiBaseUrl,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

let _onLogout: (() => void) | null = null

export function setLogoutCallback(cb: (() => void) | null) {
  _onLogout = cb
}

// Attach JWT to every request
apiClient.interceptors.request.use(async (config) => {
  const token = await Storage.getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// 401 → clear token and logout
apiClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    if (error.response?.status === 401) {
      await Storage.clearTokens()
      _onLogout?.()
    }
    return Promise.reject(error)
  },
)
