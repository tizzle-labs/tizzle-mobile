let _dirty = false
let _handler: ((destination: string) => void) | null = null

export function setCreateFormDirty(dirty: boolean) {
  _dirty = dirty
}

export function isCreateFormDirty() {
  return _dirty
}

export function registerCreateDiscardHandler(fn: (destination: string) => void) {
  _handler = fn
}

export function triggerCreateDiscard(destination: string) {
  _handler?.(destination)
}
