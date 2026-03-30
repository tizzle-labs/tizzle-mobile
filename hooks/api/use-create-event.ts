import { SOL_MINT } from '@/components/ui/TokenAmount'
import { useTizzleProgram } from '@/hooks/solana/use-tizzle-program'
import { createEvent } from '@/lib/api/events'
import { CONFIG_PDA, deriveEventPda } from '@/lib/solana/program'
import { BN } from '@coral-xyz/anchor'
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useMobileWallet } from '@wallet-ui/react-native-web3js'
import { eventKeys } from './use-events'

export interface CreateEventInput {
  organizationPda: string
  title: string
  description: string
  imageUri?: string
  location: string
  category: string
  capacity: number
  stakeAmountSol: number
  stakeTokenMint: string
  stakeTokenSymbol: string
  stakeTokenDecimals: number
  startTime: Date
  endTime: Date
  unlockTime: Date
  gatekeeperAddress?: string
}

export function useCreateEvent() {
  const { connection, accounts, signAndSendTransactions } = useMobileWallet()
  const program = useTizzleProgram()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateEventInput) => {
      const walletAddress = accounts?.[0]?.address?.toString()
      if (!walletAddress) throw new Error('Wallet not connected')

      const organizerPubkey = new PublicKey(walletAddress)
      const organizationPda = new PublicKey(input.organizationPda)
      const eventIdKeypair = Keypair.generate()
      const eventId = eventIdKeypair.publicKey
      const eventPda = deriveEventPda(organizationPda, eventId)

      const stakeAmountLamports = new BN(Math.floor(input.stakeAmountSol * LAMPORTS_PER_SOL))
      const gatekeeper = input.gatekeeperAddress ? new PublicKey(input.gatekeeperAddress) : organizerPubkey

      const config = await program.account.config.fetch(CONFIG_PDA)
      const platformTreasury = config.treasury as PublicKey

      const ix = await program.methods
        .createEvent(
          eventId,
          input.capacity,
          stakeAmountLamports,
          false,
          0,
          new BN(Math.floor(input.startTime.getTime() / 1000)),
          new BN(Math.floor(input.endTime.getTime() / 1000)),
          new BN(Math.floor(input.unlockTime.getTime() / 1000)),
        )
        .accounts({
          organizer: organizerPubkey,
          platformTreasury,
          stakeTokenMint:
            input.stakeTokenMint === SOL_MINT ? SystemProgram.programId : new PublicKey(input.stakeTokenMint),
          gatekeeper,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .instruction()

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

      const event = await createEvent({
        eventPda: eventPda.toString(),
        eventId: eventId.toString(),
        organizationPda: input.organizationPda,
        gatekeeperAddress: gatekeeper.toString(),
        title: input.title,
        description: input.description,
        imageUri: input.imageUri,
        location: input.location,
        category: input.category,
        capacity: input.capacity,
        stakeAmount: stakeAmountLamports.toNumber(),
        stakeTokenMint: input.stakeTokenMint,
        stakeTokenSymbol: input.stakeTokenSymbol,
        stakeTokenDecimals: input.stakeTokenDecimals,
        hostFeeEnabled: false,
        hostFeePercent: 0,
        platformFeePaid: 0,
        startTime: input.startTime.toISOString(),
        endTime: input.endTime.toISOString(),
        unlockTime: input.unlockTime.toISOString(),
        transactionSignature: signature,
      })

      return { signature, event, eventPda: eventPda.toString() }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.all })
    },
  })
}
