let _callback: ((location: string) => void) | null = null

export function setLocationCallback(cb: (location: string) => void) {
  _callback = cb
}

export function resolveLocation(location: string) {
  _callback?.(location)
  _callback = null
}
