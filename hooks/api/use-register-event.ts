import { SOL_MINT } from '@/components/ui/TokenAmount'
import { useTizzleProgram } from '@/hooks/solana/use-tizzle-program'
import type { Event } from '@/lib/api/events'
import { createRegistration } from '@/lib/api/registrations'
import { CONFIG_PDA, deriveEscrowVaultPda, deriveRegistrationPda } from '@/lib/solana/program'
import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from '@solana/spl-token'
import { ComputeBudgetProgram, PublicKey, SystemProgram, TransactionMessage, VersionedTransaction } from '@solana/web3.js'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useMobileWallet } from '@wallet-ui/react-native-web3js'
import { registrationKeys } from './use-my-registrations'

export function useRegisterEvent() {
  const { connection, accounts, signTransactions } = useMobileWallet()
  const program = useTizzleProgram()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ event }: { event: Event }) => {
      const attendeePubkey = accounts?.[0]?.publicKey
      if (!attendeePubkey) throw new Error('Wallet not connected')
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

      const ix = await program.methods.registerEvent().accounts(ixAccounts).instruction()

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

      await createRegistration({
        registrationPda: registrationPda.toString(),
        eventPda: event.eventPda,
        stakeAmount: Number(event.stakeAmount),
        registeredAt: new Date().toISOString(),
        transactionSignature: signature,
      })

      return { signature, registrationPda: registrationPda.toString() }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: registrationKeys.my })
    },
  })
}
