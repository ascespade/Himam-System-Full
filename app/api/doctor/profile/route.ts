import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { withRateLimit } from '@/core/api/middleware/withRateLimit'

export const dynamic = 'force-dynamic'

/**
 * GET /api/doctor/profile
 * Get doctor's profile
 */
export const GET = withRateLimit(async function GET(req: NextRequest) {
  try {
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
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Get doctor profile
    let profile: Record<string, unknown> | null = null
    let profileError: Record<string, unknown> | null = null

    try {
      // Select specific columns for better performance
      const result = await supabaseAdmin
        .from('doctor_profiles')
        .select(`
          id, user_id, specialty, license_number, years_of_experience, education, certifications, languages, consultation_fee, bio_ar, bio_en, created_at, updated_at,
          users (
            name,
            email,
            phone
          )
        `)
        .eq('user_id', user.id)
        .maybeSingle()

      profile = result.data as Record<string, unknown> | null
      profileError = result.error as Record<string, unknown> | null
    } catch (err: unknown) {
      profileError = err as Record<string, unknown>
    }

    // Handle table not existing or other errors
    if (profileError) {
      const errorCode = profileError && typeof profileError === 'object' && 'code' in profileError ? profileError.code : null
      const errorMessage = profileError instanceof Error ? profileError.message : String(profileError)
      if (errorCode === '42P01' || (typeof errorMessage === 'string' && errorMessage.includes('does not exist'))) {
        // Table doesn't exist, return basic user info
        try {
          const { data: userData, error: userError } = await supabaseAdmin
            .from('users')
            .select('id, name, email, phone, role')
            .eq('id', user.id)
            .single()

          if (userError) {
            // If users table also doesn't exist, return minimal data
            return NextResponse.json({
              success: true,
              data: {
                user_id: user.id,
                name: null,
                email: null,
                phone: null,
                specialty: null,
                years_of_experience: 0
              }
            })
          }

          return NextResponse.json({
            success: true,
            data: {
              user_id: user.id,
              ...userData,
              specialty: null,
              years_of_experience: 0
            }
          })
        } catch (userErr: unknown) {
          // Fallback to minimal data
          return NextResponse.json({
            success: true,
            data: {
              user_id: user.id,
              name: null,
              email: null,
              phone: null,
              specialty: null,
              years_of_experience: 0
            }
          })
        }
      }
      // For other errors, try to return basic user info instead of throwing
      const { logError } = await import('@/shared/utils/logger')
      logError('Error fetching doctor profile', profileError, { userId: user.id, endpoint: '/api/doctor/profile' })
      try {
        const { data: userData } = await supabaseAdmin
          .from('users')
          .select('id, name, email, phone, role')
          .eq('id', user.id)
          .single()

        return NextResponse.json({
          success: true,
          data: {
            user_id: user.id,
            ...(userData || {}),
            specialty: null,
            years_of_experience: 0
          }
        })
      } catch (fallbackErr: unknown) {
        // Last resort: return minimal data
        return NextResponse.json({
          success: true,
          data: {
            user_id: user.id,
            name: null,
            email: null,
            phone: null,
            specialty: null,
            years_of_experience: 0
          }
        })
      }
    }

    // If profile doesn't exist, create one
    if (!profile) {
      try {
        const { data: newProfile, error: createError } = await supabaseAdmin
          .from('doctor_profiles')
          .insert({
            user_id: user.id,
            specialty: '',
            years_of_experience: 0
          })
          .select(`
            *,
            users (
              name,
              email,
              phone
            )
          `)
          .single()

        if (createError) {
          // If insert fails (table might not exist), return basic user info
          const { data: userData } = await supabaseAdmin
            .from('users')
            .select('id, name, email, phone, role')
            .eq('id', user.id)
            .single()

          return NextResponse.json({
            success: true,
            data: {
              user_id: user.id,
              ...userData,
              specialty: null,
              years_of_experience: 0
            }
          })
        }
        return NextResponse.json({ success: true, data: newProfile })
      } catch (createErr: unknown) {
        // Fallback to basic user info
        const { data: userData } = await supabaseAdmin
          .from('users')
          .select('id, name, email, phone, role')
          .eq('id', user.id)
          .single()

        return NextResponse.json({
          success: true,
          data: {
            user_id: user.id,
            ...userData,
            specialty: null,
            years_of_experience: 0
          }
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: profile
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/doctor/profile' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}, 'api')

/**
 * PUT /api/doctor/profile
 * Update doctor's profile
 */
export const PUT = withRateLimit(async function PUT(req: NextRequest) {
  try {
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
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, phone, specialty, license_number, years_of_experience, education, certifications, languages, consultation_fee, bio_ar, bio_en } = body

    // Update user info
    if (name || phone) {
      const userUpdate: Record<string, unknown> = {}
      if (name) userUpdate.name = name
      if (phone) userUpdate.phone = phone

      await supabaseAdmin
        .from('users')
        .update(userUpdate)
        .eq('id', user.id)
    }

    // Update or create doctor profile
    const profileUpdate: Record<string, unknown> = {}
    if (specialty !== undefined) profileUpdate.specialty = specialty
    if (license_number !== undefined) profileUpdate.license_number = license_number
    if (years_of_experience !== undefined) profileUpdate.years_of_experience = years_of_experience
    if (education !== undefined) profileUpdate.education = education
    if (certifications !== undefined) profileUpdate.certifications = certifications
    if (languages !== undefined) profileUpdate.languages = languages
    if (consultation_fee !== undefined) profileUpdate.consultation_fee = consultation_fee
    if (bio_ar !== undefined) profileUpdate.bio_ar = bio_ar
    if (bio_en !== undefined) profileUpdate.bio_en = bio_en

    // Check if profile exists
    const { data: existingProfile } = await supabaseAdmin
      .from('doctor_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    let profile
    if (existingProfile) {
      const { data, error } = await supabaseAdmin
        .from('doctor_profiles')
        .update(profileUpdate)
        .eq('user_id', user.id)
        .select(`
          id, user_id, specialty, license_number, years_of_experience, education, certifications, languages, consultation_fee, bio_ar, bio_en, created_at, updated_at,
          users (
            name,
            email,
            phone
          )
        `)
        .single()

      if (error) throw error
      profile = data
    } else {
      const { data, error } = await supabaseAdmin
        .from('doctor_profiles')
        .insert({
          user_id: user.id,
          ...profileUpdate
        })
        .select(`
          id, user_id, specialty, license_number, years_of_experience, education, certifications, languages, consultation_fee, bio_ar, bio_en, created_at, updated_at,
          users (
            name,
            email,
            phone
          )
        `)
        .single()

      if (error) throw error
      profile = data
    }

    return NextResponse.json({
      success: true,
      data: profile
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/doctor/profile' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}, 'api')

