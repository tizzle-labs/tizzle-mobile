/**
 * Formats a SOL amount like Phantom wallet:
 * - < 0.0001 → full 9-decimal precision
 * - < 0.01   → up to 6 decimal places
 * - >= 0.01  → up to 4 decimal places
 * - >= 1000  → thousands separator, up to 2 decimal places
 * Trailing zeros are always trimmed.
 */
export function formatSol(amount: number): string {
  if (amount === 0) return '0'
  if (amount >= 1_000) {
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(amount)
  }
  if (amount >= 0.01) return parseFloat(amount.toFixed(4)).toString()
  if (amount >= 0.0001) return parseFloat(amount.toFixed(6)).toString()
  return parseFloat(amount.toFixed(9)).toString()
}
