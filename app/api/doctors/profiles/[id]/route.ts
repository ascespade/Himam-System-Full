import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * GET /api/doctors/profiles/[id]
 * Get single doctor profile with full details
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabaseAdmin
      .from('doctor_profiles')
      .select(`
        *,
        users (
          id,
          name,
          email,
          phone
        )
      `)
      .eq('id', params.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Doctor profile not found' },
          { status: 404 }
        )
      }
      throw error
    }

    // Get patient count
    const { count } = await supabaseAdmin
      .from('doctor_patient_relationships')
      .select('*', { count: 'exact', head: true })
      .eq('doctor_id', data.user_id)
      .is('end_date', null)

    // Get patients list
    const { data: relationships } = await supabaseAdmin
      .from('doctor_patient_relationships')
      .select(`
        *,
        patients (
          id,
          name,
          phone
        )
      `)
      .eq('doctor_id', data.user_id)
      .is('end_date', null)

    return NextResponse.json({
      success: true,
      data: {
        ...data,
        user_name: data.users?.name || 'غير معروف',
        user_email: data.users?.email || '',
        patient_count: count || 0,
        patients: (relationships || []).map((r: Record<string, unknown>) => r.patients).filter(Boolean)
      }
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/doctors/profiles/[id]' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/doctors/profiles/[id]
 * Update doctor profile
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()
    const {
      specialization,
      license_number,
      license_expiry,
      years_of_experience,
      education,
      certifications,
      languages,
      bio,
      consultation_fee,
      image_url
    } = body

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    }

    if (specialization) updateData.specialization = specialization
    if (license_number !== undefined) updateData.license_number = license_number
    if (license_expiry !== undefined) updateData.license_expiry = license_expiry
    if (years_of_experience !== undefined) updateData.years_of_experience = years_of_experience
    if (education) updateData.education = education
    if (certifications) updateData.certifications = certifications
    if (languages) updateData.languages = languages
    if (bio !== undefined) updateData.bio = bio
    if (consultation_fee !== undefined) updateData.consultation_fee = consultation_fee
    if (image_url !== undefined) updateData.image_url = image_url

    const { data, error } = await supabaseAdmin
      .from('doctor_profiles')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/doctors/profiles/[id]' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

