import 'server-only'
/** Release gate, not an authorization substitute. Defaults closed until DB tests pass. */
export function sensitiveFeaturesEnabled() {
  return process.env.LMS_SECURITY_VERIFIED === 'true'
}
export function requireSecurityVerification() {
  if (!sensitiveFeaturesEnabled()) throw new Error('This feature is unavailable until database security verification is complete.')
}
