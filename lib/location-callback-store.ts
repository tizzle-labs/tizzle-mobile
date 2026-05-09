export interface LocationData {
  text: string
  locationDetail: string
  latitude: number
  longitude: number
}

let _callback: ((location: LocationData) => void) | null = null

export function setLocationCallback(cb: (location: LocationData) => void) {
  _callback = cb
}

export function resolveLocation(location: LocationData) {
  _callback?.(location)
  _callback = null
}
