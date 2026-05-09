let _callback: ((html: string) => void) | null = null
let _initialContent = ''

export function setDescriptionCallback(cb: (html: string) => void, initialContent = '') {
  _callback = cb
  _initialContent = initialContent
}

export function getDescriptionInitialContent() {
  return _initialContent
}

export function resolveDescription(html: string) {
  _callback?.(html)
  _callback = null
  _initialContent = ''
}
