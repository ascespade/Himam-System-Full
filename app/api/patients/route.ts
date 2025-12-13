/**
 * Patients API Route
 * Manages patient data
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib'
import { successResponse, errorResponse, handleApiError } from '@/shared/utils/api'
import { HTTP_STATUS } from '@/shared/constants'
import { withRateLimit, type RateLimitConfig } from '@/core/api/middleware/rateLimit'
import { apiRateLimiter, getRateLimitIdentifier, checkRateLimit, createRateLimitHeaders } from '@/core/security/rateLimit'

export async function GET(req: NextRequest) {
  // Apply rate limiting
  const identifier = getRateLimitIdentifier(req)
  const rateLimitResult = await checkRateLimit(req, apiRateLimiter, identifier)

  if (!rateLimitResult.success) {
    const headers = createRateLimitHeaders(
      rateLimitResult.limit,
      rateLimitResult.remaining,
      rateLimitResult.reset
    )
    return NextResponse.json(
      {
        success: false,
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
      },
      { status: 429, headers }
    )
  }

  try {
    const searchParams = req.nextUrl.searchParams
    const search = searchParams.get('search')
    const user_id = searchParams.get('user_id')
    const email = searchParams.get('email')
    const phone = searchParams.get('phone')
    const limit = parseInt(searchParams.get('limit') || '100')

    // Select specific columns instead of *
    let query = supabaseAdmin
      .from('patients')
      .select('id, name, phone, email, nationality, status, created_at, updated_at')
      .order('created_at', { ascending: false })
      .limit(limit)

    // If user_id is provided, try to find patient by matching user email/phone
    if (user_id) {
      // Get user info first
      const { data: userData } = await supabaseAdmin
        .from('users')
        .select('email, phone')
        .eq('id', user_id)
        .single()

      if (userData) {
        // Try to find patient by email or phone
        if (userData.email) {
          query = query.or(`email.eq.${userData.email},phone.eq.${userData.phone || ''}`)
        } else if (userData.phone) {
          query = query.eq('phone', userData.phone)
        }
      }
    } else if (email) {
      query = query.eq('email', email)
    } else if (phone) {
      query = query.eq('phone', phone)
    } else if (search) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`)
    }

    const { data: patients, error } = await query

    if (error) throw error

    // Add rate limit headers to response
    const response = NextResponse.json(successResponse(patients || []))
    const headers = createRateLimitHeaders(
      rateLimitResult.limit,
      rateLimitResult.remaining,
      rateLimitResult.reset
    )
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    return response
  } catch (error: unknown) {
    return handleApiError(error)
  }
}

export async function POST(req: NextRequest) {
  // Apply rate limiting
  const identifier = getRateLimitIdentifier(req)
  const rateLimitResult = await checkRateLimit(req, apiRateLimiter, identifier)

  if (!rateLimitResult.success) {
    const headers = createRateLimitHeaders(
      rateLimitResult.limit,
      rateLimitResult.remaining,
      rateLimitResult.reset
    )
    return NextResponse.json(
      {
        success: false,
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
      },
      { status: 429, headers }
    )
  }

  try {
    const body = await req.json()
    const { name, phone, nationality, status } = body

    if (!name || !phone) {
      return NextResponse.json(
        errorResponse('Name and phone are required'),
        { status: HTTP_STATUS.BAD_REQUEST }
      )
    }

    const { data: patient, error } = await supabaseAdmin
      .from('patients')
      .insert({
        name,
        phone,
        nationality: nationality || '',
        status: status || 'active',
      })
      .select()
      .single()

    if (error) throw error

    // Create Notification for new patient registration
    try {
      const { createNotificationForRole, NotificationTemplates } = await import('@/lib/notifications')
      
      const template = NotificationTemplates.patientRegistered(name)

      // Notify admin
      await createNotificationForRole('admin', {
        ...template,
        entityType: 'patient',
        entityId: patient.id
      })

      // Notify reception staff
      await createNotificationForRole('reception', {
        ...template,
        entityType: 'patient',
        entityId: patient.id
      })
    } catch (e) {
      const { logError } = await import('@/shared/utils/logger')
      logError('Failed to create patient registration notification', e, { patientId: patient.id, endpoint: '/api/patients' })
    }

    // Add rate limit headers to response
    const response = NextResponse.json(successResponse(patient), { status: HTTP_STATUS.CREATED })
    const headers = createRateLimitHeaders(
      rateLimitResult.limit,
      rateLimitResult.remaining,
      rateLimitResult.reset
    )
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    return response
  } catch (error: unknown) {
    return handleApiError(error)
  }
}
