import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * GET /api/doctors/profiles
 * Get all doctor profiles
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const specialization = searchParams.get('specialization')

    let query = supabaseAdmin
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

    if (specialization && specialization !== 'all') {
      query = query.eq('specialization', specialization)
    }

    const { data, error } = await query

    if (error) throw error

    // Get patient counts for each doctor
    const profilesWithCounts = await Promise.all(
      (data || []).map(async (profile: any) => {
        const { count } = await supabaseAdmin
          .from('doctor_patient_relationships')
          .select('*', { count: 'exact', head: true })
          .eq('doctor_id', profile.user_id)
          .is('end_date', null)

        return {
          ...profile,
          user_name: profile.users?.name || 'غير معروف',
          user_email: profile.users?.email || '',
          patient_count: count || 0
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: profilesWithCounts
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/doctors/profiles' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

/**
 * POST /api/doctors/profiles
 * Create doctor profile
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      user_id,
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

    if (!user_id || !specialization) {
      return NextResponse.json(
        { success: false, error: 'User ID and specialization are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('doctor_profiles')
      .insert({
        user_id,
        specialization,
        license_number: license_number || null,
        license_expiry: license_expiry || null,
        years_of_experience: years_of_experience || null,
        education: education || [],
        certifications: certifications || [],
        languages: languages || [],
        bio: bio || null,
        consultation_fee: consultation_fee || null,
        image_url: image_url || null
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data
    }, { status: 201 })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/doctors/profiles' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

