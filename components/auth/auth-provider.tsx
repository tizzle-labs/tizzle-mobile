import {
  createContext,
  type PropsWithChildren,
  use,
  useMemo,
  useState,
  useCallback,
  useEffect,
} from 'react'
import { useMobileWallet } from '@wallet-ui/react-native-web3js'
import { AppConfig } from '@/constants/app-config'
import { generateNonce, verifySignature } from '@/lib/api/auth'
import { setLogoutCallback } from '@/lib/api/client'
import { Storage } from '@/lib/storage'
import bs58 from 'bs58'

export interface AuthState {
  isAuthenticated: boolean
  hasJwt: boolean
  walletAddress: string | null
  signIn: () => Promise<void>
  signOut: () => Promise<void>
}

const Context = createContext<AuthState | null>(null)

export function useAuth() {
  const value = use(Context)
  if (!value) throw new Error('useAuth must be wrapped in <AuthProvider>')
  return value
}

export function AuthProvider({ children }: PropsWithChildren) {
  const { accounts, disconnect, signIn: walletSignIn, signMessage } = useMobileWallet()
  const walletAddress = accounts?.[0]?.address?.toString() ?? null
  const [hasJwt, setHasJwt] = useState(false)

  // Restore JWT state on mount
  useEffect(() => {
    Storage.getAccessToken().then((token) => setHasJwt(!!token))
  }, [])

  const signIn = useCallback(async () => {
    // 1. Connect wallet via MWA — read address from the returned result, not
    //    stale React state (avoids React batching race condition).
    const result = await walletSignIn({ uri: AppConfig.uri })
    const address = result?.account?.address?.toString()
    if (!address) return

    // 2. Get nonce from backend
    const nonce = await generateNonce(address)
    const message = `Sign in to Tizzle\nNonce: ${nonce}`

    // 3. Sign message with wallet
    const encoded = new TextEncoder().encode(message)
    const signedBytes = await signMessage(encoded)
    const signature = bs58.encode(signedBytes)

    // 4. Verify with backend → stores JWT in SecureStore
    await verifySignature({ walletAddress: address, signature, message })
    setHasJwt(true)
  }, [walletSignIn, signMessage])

  const signOut = useCallback(async () => {
    await disconnect()
    await Storage.clearTokens()
    setHasJwt(false)
  }, [disconnect])

  // Propagate forced logout (e.g. refresh token expired) back into React state
  useEffect(() => {
    setLogoutCallback(() => setHasJwt(false))
    return () => setLogoutCallback(null)
  }, [])

  const value: AuthState = useMemo(
    () => ({
      isAuthenticated: (accounts?.length ?? 0) > 0,
      hasJwt,
      walletAddress,
      signIn,
      signOut,
    }),
    [accounts, hasJwt, walletAddress, signIn, signOut]
  )

  return <Context value={value}>{children}</Context>
}
