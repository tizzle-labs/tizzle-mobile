import { useMutation, useQueryClient } from '@tanstack/react-query'
import { PublicKey, TransactionMessage, VersionedTransaction, SystemProgram } from '@solana/web3.js'
import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from '@solana/spl-token'
import { useMobileWallet } from '@wallet-ui/react-native-web3js'
import { useTizzleProgram } from '@/hooks/solana/use-tizzle-program'
import { updateRegistrationRefunded } from '@/lib/api/registrations'
import { registrationKeys } from './use-my-registrations'
import { deriveRegistrationPda, deriveEscrowVaultPda } from '@/lib/solana/program'
import { deriveTicketStatus, type TicketStatus } from '@/lib/ticket-status'
import { SOL_MINT } from '@/components/ui/TokenAmount'
import type { Registration } from '@/lib/api/registrations'
import type { Event } from '@/lib/api/events'

export function useTicketLifecycle(registration: Registration | undefined, event: Event | undefined) {
  const { connection, accounts, signAndSendTransactions } = useMobileWallet()
  const program = useTizzleProgram()
  const queryClient = useQueryClient()

  const status: TicketStatus = registration && event ? deriveTicketStatus(registration, event) : 'valid'

  const { mutateAsync: claimRefund, isPending: isClaimingRefund } = useMutation({
    mutationFn: async () => {
      if (!registration || !event) throw new Error('Missing registration or event')
      const walletAddress = accounts?.[0]?.address?.toString()
      if (!walletAddress) throw new Error('Wallet not connected')

      const attendeePubkey = new PublicKey(walletAddress)
      const eventPdaPubkey = new PublicKey(event.eventPda)
      const registrationPda = deriveRegistrationPda(eventPdaPubkey, attendeePubkey)
      const escrowVault = deriveEscrowVaultPda(eventPdaPubkey)
      const organizationTreasury = new PublicKey(event.organizerAddress)
      const isSOL = event.stakeTokenMint === SOL_MINT

      const ixAccounts = {
        event: eventPdaPubkey,
        registration: registrationPda,
        escrowVault,
        attendeeTokenAccount: isSOL ? attendeePubkey : getAssociatedTokenAddressSync(new PublicKey(event.stakeTokenMint), attendeePubkey),
        escrowTokenAccount: escrowVault,
        organizationTreasuryTokenAccount: organizationTreasury,
        tokenMint: isSOL ? SystemProgram.programId : new PublicKey(event.stakeTokenMint),
        attendee: attendeePubkey,
        organizationTreasury,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      }

      const ix = await (program as any).methods.refundStake().accounts(ixAccounts).instruction()

      const {
        context: { slot: minContextSlot },
        value: latestBlockhash,
      } = await connection.getLatestBlockhashAndContext()

      const message = new TransactionMessage({
        payerKey: attendeePubkey,
        recentBlockhash: latestBlockhash.blockhash,
        instructions: [ix],
      }).compileToLegacyMessage()

      const tx = new VersionedTransaction(message)
      const signature = await signAndSendTransactions(tx, minContextSlot)
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
