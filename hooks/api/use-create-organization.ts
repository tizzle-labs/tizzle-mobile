import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
  SystemProgram,
} from '@solana/web3.js'
import { useMobileWallet } from '@wallet-ui/react-native-web3js'
import { useTizzleProgram } from '@/hooks/solana/use-tizzle-program'
import { createOrganization } from '@/lib/api/organizations'
import { organizationKeys } from './use-my-organizations'
import { deriveOrganizationPda } from '@/lib/solana/program'

export function useCreateOrganization() {
  const { connection, accounts, signAndSendTransactions } = useMobileWallet()
  const program = useTizzleProgram()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: {
      name: string
      description: string
      avatarUrl?: string
    }) => {
      const walletAddress = accounts?.[0]?.address?.toString()
      if (!walletAddress) throw new Error('Wallet not connected')
      const ownerPubkey = new PublicKey(walletAddress)
      const organizationPda = deriveOrganizationPda(ownerPubkey)

      const ix = await (program as any).methods
        .createOrganization()
        .accounts({
          organization: organizationPda,
          owner: ownerPubkey,
          treasury: ownerPubkey,
          systemProgram: SystemProgram.programId,
        })
        .instruction()

      const { context: { slot: minContextSlot }, value: latestBlockhash } =
        await connection.getLatestBlockhashAndContext()

      const message = new TransactionMessage({
        payerKey: ownerPubkey,
        recentBlockhash: latestBlockhash.blockhash,
        instructions: [ix],
      }).compileToLegacyMessage()

      const tx = new VersionedTransaction(message)
      const signature = await signAndSendTransactions(tx, minContextSlot)
      await connection.confirmTransaction({ signature, ...latestBlockhash }, 'confirmed')

      return createOrganization({ ...payload, transactionSignature: signature })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationKeys.my })
    },
  })
}
