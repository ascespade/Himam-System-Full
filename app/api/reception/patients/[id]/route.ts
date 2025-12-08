/**
 * GET/PUT/DELETE /api/reception/patients/[id]
 * Patient detail operations
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { successResponse, errorResponse, handleApiError } from '@/shared/utils/api'
import { HTTP_STATUS } from '@/shared/constants'

export const dynamic = 'force-dynamic'

async function verifyAuth(req: NextRequest) {
  const cookieStore = req.cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value },
        set(name: string, value: string, options: CookieOptions) {},
        remove(name: string, options: CookieOptions) {},
      },
    }
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Unauthorized', status: HTTP_STATUS.UNAUTHORIZED }
  }

  const { data: userData } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!userData || !['reception', 'admin'].includes(userData.role)) {
    return { error: 'Forbidden', status: HTTP_STATUS.FORBIDDEN }
  }

  return { user }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyAuth(req)
    if ('error' in auth) {
      return NextResponse.json(
        errorResponse(auth.error),
        { status: auth.status }
      )
    }

    const { data: patient, error } = await supabaseAdmin
      .from('patients')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) throw error

    if (!patient) {
      return NextResponse.json(
        errorResponse('Patient not found'),
        { status: HTTP_STATUS.NOT_FOUND }
      )
    }

    // Get insurance info
    const { data: insurance } = await supabaseAdmin
      .from('patient_insurance')
      .select('*')
      .eq('patient_id', params.id)
      .eq('is_active', true)
      .maybeSingle()

    return NextResponse.json(successResponse({
      ...patient,
      insurance: insurance || null
    }))
  } catch (error: unknown) {
    return handleApiError(error)
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyAuth(req)
    if ('error' in auth) {
      return NextResponse.json(
        errorResponse(auth.error),
        { status: auth.status }
      )
    }

    const body = await req.json()
    const {
      name,
      phone,
      email,
      date_of_birth,
      gender,
      nationality,
      address,
      blood_type,
      allergies,
      chronic_diseases,
      emergency_contact_name,
      emergency_contact_phone,
      notes
    } = body

    const updateData: any = {}
    if (name) updateData.name = name
    if (phone) updateData.phone = phone
    if (email !== undefined) updateData.email = email
    if (date_of_birth !== undefined) updateData.date_of_birth = date_of_birth
    if (gender !== undefined) updateData.gender = gender
    if (nationality !== undefined) updateData.nationality = nationality
    if (address !== undefined) updateData.address = address
    if (blood_type !== undefined) updateData.blood_type = blood_type
    if (allergies !== undefined) updateData.allergies = Array.isArray(allergies) ? allergies : [allergies]
    if (chronic_diseases !== undefined) updateData.chronic_diseases = Array.isArray(chronic_diseases) ? chronic_diseases : [chronic_diseases]
    if (emergency_contact_name !== undefined) updateData.emergency_contact_name = emergency_contact_name
    if (emergency_contact_phone !== undefined) updateData.emergency_contact_phone = emergency_contact_phone
    if (notes !== undefined) updateData.notes = notes

    const { data: patient, error } = await supabaseAdmin
      .from('patients')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(successResponse(patient, 'تم تحديث المريض بنجاح'))
  } catch (error: unknown) {
    return handleApiError(error)
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyAuth(req)
    if ('error' in auth) {
      return NextResponse.json(
        errorResponse(auth.error),
        { status: auth.status }
      )
    }

    const { error } = await supabaseAdmin
      .from('patients')
      .delete()
      .eq('id', params.id)

    if (error) throw error

    return NextResponse.json(successResponse(null, 'تم حذف المريض بنجاح'))
  } catch (error: unknown) {
    return handleApiError(error)
  }
}
