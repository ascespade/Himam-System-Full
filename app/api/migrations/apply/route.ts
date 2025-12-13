/**
 * Migration API Endpoint
 * Applies database migrations to Supabase
 * 
 * Note: Supabase doesn't support raw SQL execution via JS client.
 * This endpoint provides the SQL statements that need to be run manually
 * or you can use Supabase Management API if available.
 */

import { NextRequest, NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'
import { withRateLimit } from '@/core/api/middleware/withRateLimit'

export const POST = withRateLimit(async function POST(req: NextRequest) {
  try {
    // Security: Only allow in development or with proper authentication
    const authHeader = req.headers.get('authorization')
    const expectedToken = process.env.MIGRATION_TOKEN || 'dev-token-12345'
    
    if (authHeader !== `Bearer ${expectedToken}` && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { migrationFile } = body

    if (!migrationFile) {
      return NextResponse.json(
        { success: false, error: 'Migration file name is required' },
        { status: 400 }
      )
    }

    const filePath = join(process.cwd(), 'supabase', 'migrations', migrationFile)
    
    try {
      const sql = readFileSync(filePath, 'utf-8')
      
      return NextResponse.json({
        success: true,
        migration: migrationFile,
        sql,
        message: 'Migration SQL retrieved. Please execute it in Supabase SQL Editor.',
        instructions: [
          '1. Copy the SQL from the "sql" field',
          '2. Go to Supabase Dashboard → SQL Editor',
          '3. Paste and execute the SQL',
          '4. Verify the tables were created'
        ]
      })
    } catch (error: unknown) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        return NextResponse.json(
          { success: false, error: `Migration file not found: ${migrationFile}` },
          { status: 404 }
        )
      }
      throw error
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء قراءة ملف الترحيل'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error reading migration', error, { endpoint: '/api/migrations/apply' })
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}, 'strict')

/**
 * GET all available migrations
 */
export const GET = withRateLimit(async function GET() {
  try {
    const migrationsDir = join(process.cwd(), 'supabase', 'migrations')
    const fs = require('fs')
    
    if (!fs.existsSync(migrationsDir)) {
      return NextResponse.json({
        success: true,
        migrations: [],
        message: 'No migrations directory found'
      })
    }

    const files = fs.readdirSync(migrationsDir)
      .filter((file: string) => file.endsWith('.sql'))
      .sort()

    const migrations = files.map((file: string) => ({
      name: file,
      path: `supabase/migrations/${file}`
    }))

    return NextResponse.json({
      success: true,
      migrations,
      message: 'Available migrations retrieved. Use POST /api/migrations/apply with migrationFile to get SQL.'
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء سرد ملفات الترحيل'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error listing migrations', error, { endpoint: '/api/migrations/apply' })
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}, 'strict')

