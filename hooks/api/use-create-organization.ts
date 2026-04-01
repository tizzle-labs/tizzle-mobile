import { useTizzleProgram } from '@/hooks/solana/use-tizzle-program'
import { createOrganization, updateOrganization } from '@/lib/api/organizations'
import { uploadOrganizationAvatar } from '@/lib/api/storage'
import { deriveOrganizationPda } from '@/lib/solana/program'
import { SystemProgram, TransactionMessage, VersionedTransaction } from '@solana/web3.js'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useMobileWallet } from '@wallet-ui/react-native-web3js'
import { organizationKeys } from './use-my-organizations'

export function useCreateOrganization() {
  const { connection, accounts, signAndSendTransactions } = useMobileWallet()
  const program = useTizzleProgram()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: {
      name: string
      description: string
      imageUri?: string
      twitter?: string
      discord?: string
    }) => {
      const ownerPubkey = accounts?.[0]?.publicKey
      if (!ownerPubkey) throw new Error('Wallet not connected')

      const organizationPda = deriveOrganizationPda(ownerPubkey)

      // Check if org already exists on-chain — Anchor will revert if it does
      const existing = await connection.getAccountInfo(organizationPda)
      if (existing) {
        // Org already on-chain, just sync to backend
        return createOrganization({
          name: payload.name,
          description: payload.description,
          twitter: payload.twitter,
          discord: payload.discord,
          organizationPda: organizationPda.toString(),
          treasuryAddress: ownerPubkey.toString(),
        })
      }

      const ix = await program.methods
        .createOrganization()
        .accountsPartial({
          organization: organizationPda,
          owner: ownerPubkey,
          treasury: ownerPubkey,
          systemProgram: SystemProgram.programId,
        })
        .instruction()

      const { value: latestBlockhash } = await connection.getLatestBlockhashAndContext()

      const message = new TransactionMessage({
        payerKey: ownerPubkey,
        recentBlockhash: latestBlockhash.blockhash,
        instructions: [ix],
      }).compileToV0Message()

      const tx = new VersionedTransaction(message)
      // Pass minContextSlot=0 — wallet app uses its own RPC which may lag behind ours,
      // causing "reverted during simulation" if we pass our current slot
      const result = await signAndSendTransactions(tx, 0)
      const signature = Array.isArray(result) ? result[0] : result
      if (!signature) throw new Error('No signature returned from wallet')
      await connection.confirmTransaction({ signature, ...latestBlockhash }, 'confirmed')

      // Create the backend record first — this establishes the organizationPda in the DB
      // so the subsequent avatar upload can find it
      const org = await createOrganization({
        name: payload.name,
        description: payload.description,
        twitter: payload.twitter,
        discord: payload.discord,
        organizationPda: organizationPda.toString(),
        treasuryAddress: ownerPubkey.toString(),
      })

      if (payload.imageUri) {
        try {
          const uploaded = await uploadOrganizationAvatar(payload.imageUri, organizationPda.toString())
          // Explicitly update avatarUrl in case backend upload doesn't auto-update the record
          const updated = await updateOrganization(organizationPda.toString(), { avatarUrl: uploaded.url })
          return updated
        } catch {
          // Avatar upload is non-critical — org is already created on-chain and in DB
        }
      }

      return org
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationKeys.my })
    },
  })
}
