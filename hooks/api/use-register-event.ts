import { useMutation, useQueryClient } from '@tanstack/react-query'
import { PublicKey, TransactionMessage, VersionedTransaction, SystemProgram } from '@solana/web3.js'
import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from '@solana/spl-token'
import { useMobileWallet } from '@wallet-ui/react-native-web3js'
import { useTizzleProgram } from '@/hooks/solana/use-tizzle-program'
import { createRegistration } from '@/lib/api/registrations'
import { registrationKeys } from './use-my-registrations'
import { CONFIG_PDA, deriveRegistrationPda, deriveEscrowVaultPda } from '@/lib/solana/program'
import { SOL_MINT } from '@/components/ui/TokenAmount'
import type { Event } from '@/lib/api/events'

export function useRegisterEvent() {
  const { connection, accounts, signAndSendTransactions } = useMobileWallet()
  const program = useTizzleProgram()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ event }: { event: Event }) => {
      const walletAddress = accounts?.[0]?.address?.toString()
      if (!walletAddress) throw new Error('Wallet not connected')

      const attendeePubkey = new PublicKey(walletAddress)
      const eventPdaPubkey = new PublicKey(event.eventPda)
      const organizationPdaPubkey = new PublicKey(event.organizationPda)

      const registrationPda = deriveRegistrationPda(eventPdaPubkey, attendeePubkey)
      const escrowVault = deriveEscrowVaultPda(eventPdaPubkey)

      const isSOL = event.stakeTokenMint === SOL_MINT
      const attendeeTokenAccount = isSOL
        ? attendeePubkey
        : getAssociatedTokenAddressSync(new PublicKey(event.stakeTokenMint), attendeePubkey)

      const ixAccounts = {
        config: CONFIG_PDA,
        organization: organizationPdaPubkey,
        event: eventPdaPubkey,
        registration: registrationPda,
        escrowVault,
        attendeeTokenAccount: attendeeTokenAccount,
        escrowTokenAccount: escrowVault,
        tokenMint: isSOL ? SystemProgram.programId : new PublicKey(event.stakeTokenMint),
        attendee: attendeePubkey,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      }

      const ix = await (program as any).methods.registerEvent().accounts(ixAccounts).instruction()

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

      await createRegistration({
        eventPda: event.eventPda,
        transactionSignature: signature,
        stakeAmount: event.stakeAmount,
      })

      return { signature, registrationPda: registrationPda.toString() }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: registrationKeys.my })
    },
  })
}
