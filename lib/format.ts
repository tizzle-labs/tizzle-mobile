/**
 * Formats a SOL amount, trimming unnecessary trailing zeros.
 * e.g. 0.0500 → "0.05", 1.0000 → "1", 0.0005 → "0.0005"
 */
export function formatSol(amount: number): string {
  return parseFloat(amount.toFixed(9)).toString()
}
