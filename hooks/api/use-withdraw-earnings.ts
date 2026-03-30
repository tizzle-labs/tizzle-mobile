import { useMutation, useQueryClient } from '@tanstack/react-query'
import { PublicKey, TransactionMessage, VersionedTransaction, SystemProgram } from '@solana/web3.js'
import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { useMobileWallet } from '@wallet-ui/react-native-web3js'
import { useTizzleProgram } from '@/hooks/solana/use-tizzle-program'
import { eventKeys } from './use-events'
import { deriveEscrowVaultPda } from '@/lib/solana/program'
import { SOL_MINT } from '@/components/ui/TokenAmount'
import type { Event } from '@/lib/api/events'

export function useWithdrawEarnings(event: Event | undefined) {
  const { connection, accounts, signAndSendTransactions } = useMobileWallet()
  const program = useTizzleProgram()
  const queryClient = useQueryClient()

  const canWithdraw = !!event && !event.organizerWithdrawn && Date.now() >= new Date(event.unlockTime).getTime()

  const { mutateAsync: withdrawEarnings, isPending: isWithdrawing } = useMutation({
    mutationFn: async () => {
      if (!event) throw new Error('Missing event')
      const walletAddress = accounts?.[0]?.address?.toString()
      if (!walletAddress) throw new Error('Wallet not connected')

      const organizerPubkey = new PublicKey(walletAddress)
      const eventPdaPubkey = new PublicKey(event.eventPda)
      const escrowVault = deriveEscrowVaultPda(eventPdaPubkey)
      const organizationTreasury = new PublicKey(event.organizerAddress)
      const isSOL = event.stakeTokenMint === SOL_MINT

      const ixAccounts = {
        event: eventPdaPubkey,
        escrowVault,
        escrowTokenAccount: escrowVault,
        organizationTreasuryTokenAccount: organizationTreasury,
        tokenMint: isSOL ? SystemProgram.programId : new PublicKey(event.stakeTokenMint),
        organizer: organizerPubkey,
        organizationTreasury,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      }

      const ix = await program.methods.withdrawEarnings().accounts(ixAccounts).instruction()

      const {
        context: { slot: minContextSlot },
        value: latestBlockhash,
      } = await connection.getLatestBlockhashAndContext()

      const message = new TransactionMessage({
        payerKey: organizerPubkey,
        recentBlockhash: latestBlockhash.blockhash,
        instructions: [ix],
      }).compileToLegacyMessage()

      const tx = new VersionedTransaction(message)
      const result = await signAndSendTransactions(tx, minContextSlot)
      const signature = Array.isArray(result) ? result[0] : result
      await connection.confirmTransaction({ signature, ...latestBlockhash }, 'confirmed')

      return { signature }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.detail(event!.eventPda) })
      queryClient.invalidateQueries({ queryKey: eventKeys.all })
    },
  })

  return { canWithdraw, withdrawEarnings, isWithdrawing }
}
