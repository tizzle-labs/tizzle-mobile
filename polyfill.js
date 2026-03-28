import { install } from 'react-native-quick-crypto'

import { Buffer } from 'buffer'
global.Buffer = Buffer

Buffer.prototype.subarray = function subarray(begin, end) {
  const result = Uint8Array.prototype.subarray.apply(this, [begin, end])
  Object.setPrototypeOf(result, Buffer.prototype)
  return result
}

// bs58 v6+ is ESM-only and exposes { default: { encode, decode } } when
// consumed via CJS require(). Hoist the nested methods so libraries that
// do `require('bs58').encode(...)` keep working.
try {
  const bs58 = require('bs58')
  if (typeof bs58.encode !== 'function' && bs58.default) {
    bs58.encode = bs58.default.encode
    bs58.decode = bs58.default.decode
  }
} catch (_) {}

install()
