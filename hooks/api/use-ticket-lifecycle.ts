import { SOL_MINT } from '@/components/ui/TokenAmount'
import { useTizzleProgram } from '@/hooks/solana/use-tizzle-program'
import type { Event } from '@/lib/api/events'
import type { Registration } from '@/lib/api/registrations'
import { updateRegistrationRefunded } from '@/lib/api/registrations'
import { deriveEscrowVaultPda, deriveRegistrationPda } from '@/lib/solana/program'
import { deriveTicketStatus, type TicketStatus } from '@/lib/ticket-status'
import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from '@solana/spl-token'
import { ComputeBudgetProgram, PublicKey, SystemProgram, TransactionMessage, VersionedTransaction } from '@solana/web3.js'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useMobileWallet } from '@wallet-ui/react-native-web3js'
import { registrationKeys } from './use-my-registrations'

export function useTicketLifecycle(registration: Registration | undefined, event: Event | undefined) {
  const { connection, accounts, signTransactions } = useMobileWallet()
  const program = useTizzleProgram()
  const queryClient = useQueryClient()

  const status: TicketStatus = registration && event ? deriveTicketStatus(registration, event) : 'valid'

  const { mutateAsync: claimRefund, isPending: isClaimingRefund } = useMutation({
    mutationFn: async () => {
      if (!registration || !event) throw new Error('Missing registration or event')
      const attendeePubkey = accounts?.[0]?.publicKey
      if (!attendeePubkey) throw new Error('Wallet not connected')
      const eventPdaPubkey = new PublicKey(event.eventPda)
      const registrationPda = deriveRegistrationPda(eventPdaPubkey, attendeePubkey)
      const escrowVault = deriveEscrowVaultPda(eventPdaPubkey)
      const organizationTreasury = new PublicKey(event.organizerAddress)
      const isSOL = event.stakeTokenMint === SOL_MINT

      const ixAccounts = {
        event: eventPdaPubkey,
        registration: registrationPda,
        escrowVault,
        attendeeTokenAccount: isSOL
          ? attendeePubkey
          : getAssociatedTokenAddressSync(new PublicKey(event.stakeTokenMint), attendeePubkey),
        escrowTokenAccount: escrowVault,
        organizationTreasuryTokenAccount: organizationTreasury,
        tokenMint: isSOL ? SystemProgram.programId : new PublicKey(event.stakeTokenMint),
        attendee: attendeePubkey,
        organizationTreasury,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      }

      const ix = await program.methods.refundStake().accounts(ixAccounts).instruction()

      const { value: latestBlockhash } = await connection.getLatestBlockhashAndContext()

      const message = new TransactionMessage({
        payerKey: attendeePubkey,
        recentBlockhash: latestBlockhash.blockhash,
        instructions: [ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 }), ix],
      }).compileToV0Message()

      const tx = new VersionedTransaction(message)
      const signedTx = await signTransactions(tx)
      const signature = await connection.sendRawTransaction(signedTx.serialize(), { skipPreflight: true })
      await connection.confirmTransaction({ signature, ...latestBlockhash }, 'confirmed')

      await updateRegistrationRefunded(registration.registrationPda)
      return { signature }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: registrationKeys.my })
    },
  })

  return { status, claimRefund, isClaimingRefund }
}
