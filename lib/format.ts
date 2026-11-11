/**
 * Format a price using the course's admin-configured ISO currency code.
 * No currency is assumed: if either value is missing, returns null and the UI
 * shows nothing rather than an invented price.
 */
export function formatPrice(amount: number | null | undefined, currency: string | null | undefined): string | null {
  if (amount === null || amount === undefined || !currency || !/^[A-Z]{3}$/.test(currency)) return null
  try {
    return new Intl.NumberFormat('en', { style: 'currency', currency, currencyDisplay: 'code' }).format(amount)
  } catch {
    return `${amount} ${currency}`
  }
}

export function isExpired(expiresAt: string | null | undefined, now: Date = new Date()): boolean {
  const expiry = expiresAt ? Date.parse(expiresAt) : NaN
  return !Number.isFinite(expiry) || expiry <= now.getTime()
}
