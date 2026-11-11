/** A signed grant must never outlive enrollment. Null expiry fails closed. */
export function playbackLifetime(expiresAt: string | null, requested = 120, now = Date.now()) {
  if (!expiresAt || !Number.isFinite(requested) || !Number.isFinite(now)) return 0
  const remaining = Math.floor((Date.parse(expiresAt) - now) / 1000)
  if (!Number.isFinite(remaining) || remaining < 1) return 0
  return Math.min(remaining, Math.max(1, Math.min(300, Math.floor(requested))))
}
