/**
 * Patients API Route
 * Manages patient data
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib'
import { successResponse, errorResponse, handleApiError } from '@/shared/utils/api'
import { HTTP_STATUS } from '@/shared/constants'

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const search = searchParams.get('search')
    const user_id = searchParams.get('user_id')
    const email = searchParams.get('email')
    const phone = searchParams.get('phone')
    const limit = parseInt(searchParams.get('limit') || '100')

    let query = supabaseAdmin
      .from('patients')
      .select('*')
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

    return NextResponse.json(successResponse(patients || []))
  } catch (error: unknown) {
    return handleApiError(error)
  }
}

export async function POST(req: NextRequest) {
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
      console.error('Failed to create patient registration notification:', e)
    }

    return NextResponse.json(successResponse(patient), { status: HTTP_STATUS.CREATED })
  } catch (error: unknown) {
    return handleApiError(error)
  }
}
