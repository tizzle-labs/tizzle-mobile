import { SOL_MINT } from '@/components/ui/TokenAmount'
import { useTizzleProgram } from '@/hooks/solana/use-tizzle-program'
import { createEvent, updateEvent } from '@/lib/api/events'
import { uploadEventImage, uploadVenueImage } from '@/lib/api/storage'
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

// Platform fee charged per event creation (in SOL)
export const PLATFORM_FEE_SOL = 0.0005
export const PLATFORM_FEE_LAMPORTS = Math.floor(PLATFORM_FEE_SOL * LAMPORTS_PER_SOL)

export interface CreateEventInput {
  organizationPda: string
  title: string
  description?: string
  imageUri?: string
  venueImageUri?: string
  location: string
  category?: string
  capacity: number
  stakeAmount: number
  stakeTokenMint: string
  stakeTokenSymbol: string
  stakeTokenDecimals: number
  hostFeeEnabled: boolean
  hostFeePercent: number
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
      const organizerPubkey = accounts?.[0]?.publicKey
      if (!organizerPubkey) throw new Error('Wallet not connected')

      const organizationPda = new PublicKey(input.organizationPda)
      const eventIdKeypair = Keypair.generate()
      const eventId = eventIdKeypair.publicKey
      const eventPda = deriveEventPda(organizationPda, eventId)

      const isSOL = input.stakeTokenMint === SOL_MINT
      const stakeAmountOnchain = new BN(
        Math.floor(input.stakeAmount * Math.pow(10, isSOL ? 9 : input.stakeTokenDecimals)),
      )

      const gatekeeper = input.gatekeeperAddress ? new PublicKey(input.gatekeeperAddress) : organizerPubkey

      const config = await program.account.config.fetch(CONFIG_PDA)
      const platformTreasury = config.treasury as PublicKey

      const ix = await program.methods
        .createEvent(
          eventId,
          input.capacity,
          stakeAmountOnchain,
          input.hostFeeEnabled,
          input.hostFeePercent,
          new BN(Math.floor(input.startTime.getTime() / 1000)),
          new BN(Math.floor(input.endTime.getTime() / 1000)),
          new BN(Math.floor(input.unlockTime.getTime() / 1000)),
        )
        .accountsPartial({
          config: CONFIG_PDA,
          event: eventPda,
          organizer: organizerPubkey,
          owner: organizerPubkey,
          platformTreasury,
          stakeTokenMint: isSOL ? SystemProgram.programId : new PublicKey(input.stakeTokenMint),
          gatekeeper,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .instruction()

      const { value: latestBlockhash } = await connection.getLatestBlockhashAndContext()

      const message = new TransactionMessage({
        payerKey: organizerPubkey,
        recentBlockhash: latestBlockhash.blockhash,
        instructions: [ix],
      }).compileToV0Message()

      const tx = new VersionedTransaction(message)
      const result = await signAndSendTransactions(tx, 0)
      const signature = Array.isArray(result) ? result[0] : result
      if (!signature) throw new Error('No signature returned from wallet')
      await connection.confirmTransaction({ signature, ...latestBlockhash }, 'confirmed')

      // Create backend record first
      let event = await createEvent({
        eventPda: eventPda.toString(),
        eventId: eventId.toString(),
        organizationPda: input.organizationPda,
        gatekeeperAddress: gatekeeper.toString(),
        title: input.title,
        description: input.description,
        location: input.location,
        category: input.category,
        capacity: input.capacity,
        stakeAmount: stakeAmountOnchain.toNumber(),
        stakeTokenMint: input.stakeTokenMint,
        stakeTokenSymbol: input.stakeTokenSymbol,
        stakeTokenDecimals: input.stakeTokenDecimals,
        hostFeeEnabled: input.hostFeeEnabled,
        hostFeePercent: input.hostFeeEnabled ? input.hostFeePercent : 0,
        platformFeePaid: PLATFORM_FEE_LAMPORTS * input.capacity,
        startTime: input.startTime.toISOString(),
        endTime: input.endTime.toISOString(),
        unlockTime: input.unlockTime.toISOString(),
      })

      // Upload cover image
      if (input.imageUri) {
        try {
          const uploaded = await uploadEventImage(input.imageUri, eventPda.toString())
          event = await updateEvent(eventPda.toString(), { imageUrl: uploaded.url })
        } catch {
          /* non-critical */
        }
      }

      // Upload venue image
      if (input.venueImageUri) {
        try {
          const uploaded = await uploadVenueImage(input.venueImageUri, eventPda.toString())
          event = await updateEvent(eventPda.toString(), { venueImageUrl: uploaded.url })
        } catch {
          /* non-critical */
        }
      }

      return { signature, event, eventPda: eventPda.toString() }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.all })
    },
  })
}
