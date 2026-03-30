import { useMutation } from '@tanstack/react-query'
import { PublicKey, TransactionMessage, VersionedTransaction } from '@solana/web3.js'
import { useMobileWallet } from '@wallet-ui/react-native-web3js'
import { useTizzleProgram } from '@/hooks/solana/use-tizzle-program'
import { checkInRegistration } from '@/lib/api/registrations'

export function useCheckIn() {
  const { connection, accounts, signAndSendTransactions } = useMobileWallet()
  const program = useTizzleProgram()

  return useMutation({
    mutationFn: async ({ registrationPda, eventPda }: { registrationPda: string; eventPda: string }) => {
      const walletAddress = accounts?.[0]?.address?.toString()
      if (!walletAddress) throw new Error('Wallet not connected')

      const gatekeeperPubkey = new PublicKey(walletAddress)
      const eventPdaPubkey = new PublicKey(eventPda)
      const registrationPdaPubkey = new PublicKey(registrationPda)

      const ix = await program.methods
        .checkIn()
        .accounts({
          event: eventPdaPubkey,
          registration: registrationPdaPubkey,
          gatekeeper: gatekeeperPubkey,
        })
        .instruction()

      const {
        context: { slot: minContextSlot },
        value: latestBlockhash,
      } = await connection.getLatestBlockhashAndContext()

      const message = new TransactionMessage({
        payerKey: gatekeeperPubkey,
        recentBlockhash: latestBlockhash.blockhash,
        instructions: [ix],
      }).compileToLegacyMessage()

      const tx = new VersionedTransaction(message)

      const result = await signAndSendTransactions(tx, minContextSlot)
      const signature = Array.isArray(result) ? result[0] : result
      await connection.confirmTransaction({ signature, ...latestBlockhash }, 'confirmed')

      return checkInRegistration(registrationPda)
    },
  })
}
