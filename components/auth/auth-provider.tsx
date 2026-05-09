import { generateNonce, verifySignature } from '@/lib/api/auth'
import { setLogoutCallback } from '@/lib/api/client'
import { Storage } from '@/lib/storage'
import {
  MobileWalletProviderContext,
  useAuthorization,
  useMobileWallet,
} from '@wallet-ui/react-native-web3js'
import bs58 from 'bs58'
import { createContext, type PropsWithChildren, use, useCallback, useContext, useEffect, useMemo, useState } from 'react'

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
  const { chain, identity, store } = useContext(MobileWalletProviderContext as any)
  const { authorizeSession } = useAuthorization({ chain, identity, store })

  const walletAddress = accounts?.[0]?.address?.toString() ?? null
  const [hasJwt, setHasJwt] = useState(false)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    Storage.getAccessToken()
      .then((token) => setHasJwt(!!token))
      .finally(() => setIsReady(true))
  }, [])

  const signIn = useCallback(async () => {
    try {
      await connectAnd(async (wallet) => {
        // 1. Authorize once — opens wallet selector, updates shared accounts store
        const account = await authorizeSession(wallet)
        const address = account.address.toString()

        // 2. Get nonce from backend (within the same MWA session)
        const { message } = await generateNonce(address)

        // 3. Sign the message — no second MWA open, same session
        const encoded = new TextEncoder().encode(message)
        const signedPayloads = await wallet.signMessages({
          addresses: [account.addressBase64],
          payloads: [encoded],
        })
        const signature = bs58.encode(signedPayloads[0])

        // 4. Verify with backend → stores JWT
        await verifySignature({ walletAddress: address, signature, message })
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
  }, [connectAnd, authorizeSession])

  const signOut = useCallback(async () => {
    await disconnect()
    await Storage.clearTokens()
    setHasJwt(false)
  }, [disconnect])

  useEffect(() => {
    setLogoutCallback(() => setHasJwt(false))
    return () => setLogoutCallback(null)
  }, [])

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
