import { useQuery } from '@tanstack/react-query'
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { useMobileWallet } from '@wallet-ui/react-native-web3js'
import { SOL_MINT } from '@/components/ui/TokenAmount'

export function useWalletBalance(mintAddress: string) {
  const { connection, accounts } = useMobileWallet()
  const walletAddress = accounts?.[0]?.address?.toString()

  return useQuery({
    queryKey: ['balance', walletAddress, mintAddress],
    queryFn: async () => {
      if (!walletAddress) return 0
      const pubkey = new PublicKey(walletAddress)

      if (mintAddress === SOL_MINT) {
        const lamports = await connection.getBalance(pubkey)
        return lamports / LAMPORTS_PER_SOL
      }

      // SPL token balance
      const { getAssociatedTokenAddressSync } = await import('@solana/spl-token')
      const mint = new PublicKey(mintAddress)
      const ata = getAssociatedTokenAddressSync(mint, pubkey)
      try {
        const info = await connection.getTokenAccountBalance(ata)
        return info.value.uiAmount ?? 0
      } catch {
        return 0
      }
    },
    enabled: !!walletAddress,
    refetchInterval: 15_000,
  })
}
