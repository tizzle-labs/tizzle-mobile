import * as SecureStore from 'expo-secure-store'

const ACCESS_TOKEN_KEY = 'tizzle_access_token'

export const Storage = {
  getAccessToken: () => SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
  setAccessToken: (token: string) => SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token),
  clearTokens: () => SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
}
