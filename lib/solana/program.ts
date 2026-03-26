import { Program, AnchorProvider, type Idl } from '@coral-xyz/anchor'
import { Connection, PublicKey, SystemProgram } from '@solana/web3.js'
import { AppConfig } from '@/constants/app-config'
import idl from './idl.json'

export const PROGRAM_ID = new PublicKey(AppConfig.programId)

export const CONFIG_PDA = PublicKey.findProgramAddressSync([Buffer.from('config')], PROGRAM_ID)[0]

export function deriveOrganizationPda(ownerPubkey: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('organization'), ownerPubkey.toBuffer()],
    PROGRAM_ID
  )[0]
}

export function deriveEventPda(organizationPda: PublicKey, eventId: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('event'), organizationPda.toBuffer(), eventId.toBuffer()],
    PROGRAM_ID
  )[0]
}

export function deriveRegistrationPda(eventPda: PublicKey, attendeePubkey: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('registration'), eventPda.toBuffer(), attendeePubkey.toBuffer()],
    PROGRAM_ID
  )[0]
}

export function deriveEscrowVaultPda(eventPda: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('escrow'), eventPda.toBuffer()],
    PROGRAM_ID
  )[0]
}

// Create a read-only program instance (no wallet — used to build instructions only)
export function createReadonlyProgram(connection: Connection): Program {
  const dummyWallet = {
    publicKey: PublicKey.default,
    signTransaction: async (tx: any) => tx,
    signAllTransactions: async (txs: any[]) => txs,
  }
  const provider = new AnchorProvider(connection, dummyWallet as any, {
    commitment: 'confirmed',
  })
  return new Program(idl as Idl, provider)
}
