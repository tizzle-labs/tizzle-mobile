export interface EventPreviewData {
  title: string
  description: string
  location: string
  category: string | null
  imageUri: string | null
  venueImageUri: string | null
  capacity: number
  stakeAmount: number
  stakeTokenSymbol: string
  startTime: Date
  endTime: Date
  unlockTime: Date
  organizationName: string
  organizationAvatarUrl: string | null | undefined
  hostFeeEnabled: boolean
  hostFeePercent: number
}

let _data: EventPreviewData | null = null
let _onConfirm: (() => void) | null = null

export function setEventPreview(data: EventPreviewData, onConfirm: () => void) {
  _data = data
  _onConfirm = onConfirm
}

export function getEventPreview(): EventPreviewData | null {
  return _data
}

export function confirmEventCreation() {
  _onConfirm?.()
  _data = null
  _onConfirm = null
}
