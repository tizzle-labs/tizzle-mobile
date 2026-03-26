import { useMemo } from 'react'
import { useMobileWallet } from '@wallet-ui/react-native-web3js'
import { createReadonlyProgram } from '@/lib/solana/program'

export function useTizzleProgram() {
  const { connection } = useMobileWallet()
  return useMemo(() => createReadonlyProgram(connection), [connection])
}
