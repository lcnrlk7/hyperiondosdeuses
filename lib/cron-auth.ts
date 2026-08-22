import crypto from 'crypto'

/** Fail-closed authorization for operational cron endpoints. */
export function isCronAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  const provided = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || ''
  if (!secret || secret.length < 24 || !provided) return false

  const expectedBuffer = Buffer.from(secret)
  const providedBuffer = Buffer.from(provided)
  return expectedBuffer.length === providedBuffer.length && crypto.timingSafeEqual(expectedBuffer, providedBuffer)
}
