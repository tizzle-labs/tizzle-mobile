import * as SecureStore from 'expo-secure-store'

const ACCESS_TOKEN_KEY = 'tizzle_access_token'

// In-memory cache so reads after setAccessToken are always up-to-date,
// regardless of SecureStore's async commit timing on Android.
let _token: string | null | undefined = undefined

export const Storage = {
  getAccessToken: async () => {
    if (_token !== undefined) return _token
    _token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY)
    return _token
  },
  setAccessToken: async (token: string) => {
    _token = token
    return SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token)
  },
  clearTokens: async () => {
    _token = null
    return SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY)
  },
}
