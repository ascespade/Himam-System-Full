/**
 * Health Check Endpoint (Liveness)
 * Simple endpoint to check if the service is running
 * Returns 200 if service is alive
 */

import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/health
 * Liveness probe - returns 200 if service is running
 */
export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  )
}
