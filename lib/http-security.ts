import { AuthError } from '@/lib/auth'
export function assertSameOrigin(request: Request) {
  const origin = request.headers.get('origin')
  if (origin !== new URL(request.url).origin) throw new AuthError(403, 'Invalid request origin')
}
export function privateJson(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer' } })
}
export async function limitedFormData(request: Request, maximum: number) {
  if (!request.body) throw new Error('Missing request body')
  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let length = 0
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    length += value.byteLength
    if (length > maximum) { await reader.cancel(); throw new Error('Request too large') }
    chunks.push(value)
  }
  return new Response(Buffer.concat(chunks), { headers: { 'Content-Type': request.headers.get('content-type') ?? '' } }).formData()
}
