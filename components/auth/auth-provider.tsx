import { generateNonce, verifySignature } from '@/lib/api/auth'
import { setLogoutCallback } from '@/lib/api/client'
import { getMyProfile } from '@/lib/api/users'
import { Storage } from '@/lib/storage'
import { useQueryClient } from '@tanstack/react-query'
import { MobileWalletProviderContext, useAuthorization, useMobileWallet } from '@wallet-ui/react-native-web3js'
import bs58 from 'bs58'
import {
  createContext,
  type PropsWithChildren,
  use,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

export interface AuthState {
  isReady: boolean
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
  const { accounts, connectAnd, disconnect } = useMobileWallet()

  // Access the shared reactive store so authorizeSession updates accounts everywhere
  const { chain, identity, store } = useContext(MobileWalletProviderContext)
  const { authorizeSession } = useAuthorization({ chain, identity, store })

  const queryClient = useQueryClient()
  const walletAddress = accounts?.[0]?.address?.toString() ?? null
  const [hasJwt, setHasJwt] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const prevWalletRef = useRef<string | null>(null)

  useEffect(() => {
    Storage.getAccessToken()
      .then((token) => setHasJwt(!!token))
      .finally(() => setIsReady(true))
  }, [])

  useEffect(() => {
    if (prevWalletRef.current !== null && walletAddress !== prevWalletRef.current) {
      queryClient.clear()
    }
    prevWalletRef.current = walletAddress
  }, [walletAddress, queryClient])

  const signIn = useCallback(async () => {
    try {
      await connectAnd(async (wallet) => {
        // 1. Authorize once — opens wallet selector, updates shared accounts store
        const account = await authorizeSession(wallet)
        const address = account.address.toString()

        // 2. Get nonce from backend (within the same MWA session)
        const { message } = await generateNonce(address)

        // 3. Sign the message — no second MWA open, same session
        // wallet is AuthorizeAPI at compile time but MobileWallet at runtime (includes SignMessagesAPI)
        type SignableWallet = { signMessages(p: { addresses: string[]; payloads: Uint8Array[] }): Promise<Uint8Array[]> }
        const encoded = new TextEncoder().encode(message)
        const signedPayloads = await (wallet as unknown as SignableWallet).signMessages({
          addresses: [account.addressBase64],
          payloads: [encoded],
        })
        const signature = bs58.encode(signedPayloads[0])

        // 4. Verify with backend → JWT is now in Storage (in-memory + SecureStore)
        await verifySignature({ walletAddress: address, signature, message })
        // 5. Clear stale cache, then pre-warm with the new user's profile so the
        //    UI never briefly renders the previous wallet's data.
        queryClient.clear()
        try {
          const profile = await getMyProfile()
          queryClient.setQueryData(['users', 'me'], profile)
        } catch {
          // Non-fatal: profile will be fetched on demand
        }
        setHasJwt(true)
      })
    } catch (error: any) {
      const msg = String(error?.message ?? '').toLowerCase()
      if (
        msg.includes('reject') ||
        msg.includes('cancel') ||
        msg.includes('declin') ||
        msg.includes('dismiss') ||
        msg.includes('user cancelled') ||
        msg.includes('closed') ||
        msg.includes('abort')
      ) {
        // User closed or cancelled the wallet — clean up silently
        return
      }
      throw error
    }
  }, [connectAnd, authorizeSession, queryClient])

  const signOut = useCallback(async () => {
    await disconnect()
    await Storage.clearTokens()
    queryClient.clear()
    setHasJwt(false)
  }, [disconnect, queryClient])

  useEffect(() => {
    setLogoutCallback(() => {
      queryClient.clear()
      setHasJwt(false)
    })
    return () => setLogoutCallback(null)
  }, [queryClient])

  const value: AuthState = useMemo(
    () => ({
      isReady,
      isAuthenticated: (accounts?.length ?? 0) > 0 && hasJwt,
      hasJwt,
      walletAddress,
      signIn,
      signOut,
    }),
    [accounts, hasJwt, isReady, walletAddress, signIn, signOut],
  )

  return <Context value={value}>{children}</Context>
}
