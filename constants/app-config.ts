import { Cluster } from '@/components/cluster/cluster'
import { ClusterNetwork } from '@/components/cluster/cluster-network'
import { clusterApiUrl } from '@solana/web3.js'

export class AppConfig {
  static name = 'Tizzle'
  static uri = 'https://tizzle.app'
  static apiBaseUrl = 'https://dev-api.tizzle.app'
  static programId = '2MxgNvaBj3UQJrKqJbmjbXDyWRjgE3XLmmofofgX7SME'
  static clusters: Cluster[] = [
    {
      id: 'solana:devnet',
      name: 'Devnet',
      endpoint: clusterApiUrl('devnet'),
      network: ClusterNetwork.Devnet,
    },
  ]
}
