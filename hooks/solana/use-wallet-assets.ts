import { SOL_MINT } from '@/components/ui/TokenAmount'
import { useQuery } from '@tanstack/react-query'
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js'
import { useMobileWallet } from '@wallet-ui/react-native-web3js'

export interface WalletToken {
  mint: string
  symbol: string
  name: string
  balance: number
  decimals: number
  logoUri?: string
}

export interface WalletAssets {
  sol: number
  tokens: WalletToken[]
}

export function useWalletAssets() {
  const { connection, accounts } = useMobileWallet()
  const walletAddress = accounts?.[0]?.address?.toString()

  return useQuery<WalletAssets>({
    queryKey: ['wallet-assets', walletAddress],
    queryFn: async () => {
      if (!walletAddress) return { sol: 0, tokens: [] }
      const pubkey = new PublicKey(walletAddress)

      const [lamports, tokenAccounts] = await Promise.all([
        connection.getBalance(pubkey),
        connection.getParsedTokenAccountsByOwner(pubkey, { programId: TOKEN_PROGRAM_ID }),
      ])

      const sol = lamports / LAMPORTS_PER_SOL

      const tokens: WalletToken[] = tokenAccounts.value
        .map((account) => {
          const parsed = account.account.data.parsed?.info
          const amount: number = parsed?.tokenAmount?.uiAmount ?? 0
          const decimals: number = parsed?.tokenAmount?.decimals ?? 0
          const mint: string = parsed?.mint ?? ''
          return { mint, symbol: mint.slice(0, 4).toUpperCase(), name: 'Unknown Token', balance: amount, decimals }
        })
        .filter((t) => t.balance > 0 && t.mint)

      return { sol, tokens }
    },
    enabled: !!walletAddress,
    refetchInterval: 15_000,
  })
}
