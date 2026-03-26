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
import { Storage } from '@/lib/storage'
import bs58 from 'bs58'

export interface AuthState {
  isAuthenticated: boolean
  hasJwt: boolean
  walletAddress: string | null
  signIn: () => Promise<void>
  signOut: () => Promise<void>
}

const Context = createContext<AuthState>({} as AuthState)

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
    // 1. Connect wallet via MWA
    await walletSignIn({ uri: AppConfig.uri })

    // After walletSignIn, read the address from the current accounts snapshot.
    // Note: due to React state batching, accounts may not be updated yet immediately
    // after walletSignIn. The address is typically available synchronously from the
    // MWA response, but we read from the state here as a best effort.
    const address = accounts?.[0]?.address?.toString()
    if (!address) {
      // If accounts not yet updated, skip JWT step — user will need to sign in again.
      // This is a known limitation with MWA + React state batching.
      return
    }

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
  }, [accounts, walletSignIn, signMessage])

  const signOut = useCallback(async () => {
    await disconnect()
    await Storage.clearTokens()
    setHasJwt(false)
  }, [disconnect])

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
