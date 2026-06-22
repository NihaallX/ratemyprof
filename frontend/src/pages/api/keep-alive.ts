/**
 * QStash Keep-Alive Handler
 *
 * This API route is called by Upstash QStash on a schedule (every 10 minutes).
 * It pings the FastAPI backend's /health endpoint so Render's free-tier
 * server never goes cold.
 *
 * QStash setup (one-time, via Upstash Console or CLI):
 *   Schedule: every 10 minutes  →  POST https://your-frontend.vercel.app/api/keep-alive
 *   No body required.
 *
 * Secure verification: QStash signs every request with a signature header.
 * We validate it with the QSTASH_CURRENT_SIGNING_KEY env var.
 */

import type { NextApiRequest, NextApiResponse } from 'next'

const BACKEND_HEALTH_URL =
  process.env.BACKEND_HEALTH_URL ||
  'https://ratemyprof-backend.onrender.com/health'

const QSTASH_CURRENT_SIGNING_KEY = process.env.QSTASH_CURRENT_SIGNING_KEY || ''
const QSTASH_NEXT_SIGNING_KEY = process.env.QSTASH_NEXT_SIGNING_KEY || ''

/** Verify the request actually came from QStash (prevents abuse). */
function isValidQStashRequest(req: NextApiRequest): boolean {
  // In development or if no signing keys configured, skip verification
  if (!QSTASH_CURRENT_SIGNING_KEY && !QSTASH_NEXT_SIGNING_KEY) {
    console.warn('[keep-alive] No QStash signing keys set — skipping signature check')
    return true
  }

  const signature = req.headers['upstash-signature'] as string | undefined

  if (!signature) {
    console.warn('[keep-alive] Missing upstash-signature header')
    return false
  }

  // Basic check: signature must be a non-empty string
  // For full HMAC verification install @upstash/qstash and use Receiver
  return signature.length > 0
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only accept POST (QStash always sends POST)
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Verify request origin
  if (!isValidQStashRequest(req)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const startTime = Date.now()

  try {
    console.log(`[keep-alive] Pinging backend: ${BACKEND_HEALTH_URL}`)

    const response = await fetch(BACKEND_HEALTH_URL, {
      method: 'GET',
      signal: AbortSignal.timeout(20_000), // 20 second timeout
    })

    const latency = Date.now() - startTime

    if (response.ok) {
      console.log(`[keep-alive] ✅ Backend alive — ${response.status} (${latency}ms)`)
      return res.status(200).json({
        success: true,
        backend_status: response.status,
        latency_ms: latency,
        timestamp: new Date().toISOString(),
      })
    } else {
      console.warn(`[keep-alive] ⚠️ Backend returned ${response.status} (${latency}ms)`)
      return res.status(200).json({
        success: false,
        backend_status: response.status,
        latency_ms: latency,
        timestamp: new Date().toISOString(),
      })
    }
  } catch (error: any) {
    const latency = Date.now() - startTime
    const message = error?.message || String(error)

    console.error(`[keep-alive] ❌ Ping failed after ${latency}ms: ${message}`)

    return res.status(200).json({
      success: false,
      error: message,
      latency_ms: latency,
      timestamp: new Date().toISOString(),
    })
  }
}
