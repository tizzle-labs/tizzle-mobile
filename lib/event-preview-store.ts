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
let _onConfirm: (() => Promise<boolean>) | null = null

export function setEventPreview(data: EventPreviewData, onConfirm: () => Promise<boolean>) {
  _data = data
  _onConfirm = onConfirm
}

export function getEventPreview(): EventPreviewData | null {
  return _data
}

export async function confirmEventCreation(): Promise<boolean> {
  if (!_onConfirm) return false
  const success = await _onConfirm()
  _data = null
  _onConfirm = null
  return success
}
