import { SOL_MINT } from '@/components/ui/TokenAmount'
import { useTizzleProgram } from '@/hooks/solana/use-tizzle-program'
import type { Event } from '@/lib/api/events'
import { deriveEscrowVaultPda } from '@/lib/solana/program'
import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { ComputeBudgetProgram, PublicKey, SystemProgram, TransactionMessage, VersionedTransaction } from '@solana/web3.js'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useMobileWallet } from '@wallet-ui/react-native-web3js'
import { eventKeys } from './use-events'

export function useWithdrawEarnings(event: Event | undefined) {
  const { connection, accounts, signTransactions } = useMobileWallet()
  const program = useTizzleProgram()
  const queryClient = useQueryClient()

  const canWithdraw = !!event && !event.organizerWithdrawn && Date.now() >= new Date(event.unlockTime).getTime()

  const { mutateAsync: withdrawEarnings, isPending: isWithdrawing } = useMutation({
    mutationFn: async () => {
      if (!event) throw new Error('Missing event')
      const organizerPubkey = accounts?.[0]?.publicKey
      if (!organizerPubkey) throw new Error('Wallet not connected')
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

      const { value: latestBlockhash } = await connection.getLatestBlockhashAndContext()

      const message = new TransactionMessage({
        payerKey: organizerPubkey,
        recentBlockhash: latestBlockhash.blockhash,
        instructions: [ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 }), ix],
      }).compileToV0Message()

      const tx = new VersionedTransaction(message)
      const signedTx = await signTransactions(tx)
      const signature = await connection.sendRawTransaction(signedTx.serialize(), { skipPreflight: true })
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
