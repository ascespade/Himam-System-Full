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
    const limit = parseInt(searchParams.get('limit') || '100')

    let query = supabaseAdmin
      .from('patients')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (search) {
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
