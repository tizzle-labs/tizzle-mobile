import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
  SystemProgram,
  Keypair,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js'
import { BN } from '@coral-xyz/anchor'
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { useMobileWallet } from '@wallet-ui/react-native-web3js'
import { useTizzleProgram } from '@/hooks/solana/use-tizzle-program'
import { createEvent } from '@/lib/api/events'
import { eventKeys } from './use-events'
import { CONFIG_PDA, deriveOrganizationPda, deriveEventPda } from '@/lib/solana/program'
import { SOL_MINT } from '@/components/ui/TokenAmount'

export interface CreateEventInput {
  organizationPda: string
  title: string
  description: string
  imageUrl: string
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

      const stakeAmountLamports = new BN(
        Math.floor(input.stakeAmountSol * LAMPORTS_PER_SOL)
      )
      const gatekeeper = input.gatekeeperAddress
        ? new PublicKey(input.gatekeeperAddress)
        : organizerPubkey

      const config = await (program as any).account.config.fetch(CONFIG_PDA)
      const platformTreasury = config.treasury as PublicKey

      const ix = await (program as any).methods
        .createEvent(
          eventId,
          input.capacity,
          stakeAmountLamports,
          false,
          0,
          new BN(Math.floor(input.startTime.getTime() / 1000)),
          new BN(Math.floor(input.endTime.getTime() / 1000)),
          new BN(Math.floor(input.unlockTime.getTime() / 1000))
        )
        .accounts({
          config: CONFIG_PDA,
          organization: organizationPda,
          event: eventPda,
          organizer: organizerPubkey,
          owner: organizerPubkey,
          platformTreasury,
          stakeTokenMint: input.stakeTokenMint === SOL_MINT
            ? SystemProgram.programId
            : new PublicKey(input.stakeTokenMint),
          gatekeeper,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .instruction()

      const { context: { slot: minContextSlot }, value: latestBlockhash } =
        await connection.getLatestBlockhashAndContext()

      const message = new TransactionMessage({
        payerKey: organizerPubkey,
        recentBlockhash: latestBlockhash.blockhash,
        instructions: [ix],
      }).compileToLegacyMessage()

      const tx = new VersionedTransaction(message)
      const signature = await signAndSendTransactions(tx, minContextSlot)
      await connection.confirmTransaction({ signature, ...latestBlockhash }, 'confirmed')

      const event = await createEvent({
        organizationPda: input.organizationPda,
        title: input.title,
        description: input.description,
        imageUrl: input.imageUrl,
        location: input.location,
        category: input.category,
        capacity: input.capacity,
        stakeAmount: stakeAmountLamports.toString(),
        stakeTokenMint: input.stakeTokenMint,
        stakeTokenSymbol: input.stakeTokenSymbol,
        stakeTokenDecimals: input.stakeTokenDecimals,
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
