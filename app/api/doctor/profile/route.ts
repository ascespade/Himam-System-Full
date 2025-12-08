import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/doctor/profile
 * Get doctor's profile
 */
export async function GET(req: NextRequest) {
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
    let profile: any = null
    let profileError: any = null

    try {
      const result = await supabaseAdmin
        .from('doctor_profiles')
        .select(`
          *,
          users (
            name,
            email,
            phone
          )
        `)
        .eq('user_id', user.id)
        .maybeSingle()

      profile = result.data
      profileError = result.error
    } catch (err: any) {
      profileError = err
    }

    // Handle table not existing or other errors
    if (profileError) {
      if (profileError.code === '42P01' || profileError.message?.includes('does not exist')) {
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
        } catch (userErr: any) {
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
      console.error('Error fetching doctor profile:', profileError)
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
      } catch (fallbackErr: any) {
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
      } catch (createErr: any) {
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
  } catch (error: any) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/doctor/profile
 * Update doctor's profile
 */
export async function PUT(req: NextRequest) {
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
      const userUpdate: any = {}
      if (name) userUpdate.name = name
      if (phone) userUpdate.phone = phone

      await supabaseAdmin
        .from('users')
        .update(userUpdate)
        .eq('id', user.id)
    }

    // Update or create doctor profile
    const profileUpdate: any = {}
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
          *,
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
          *,
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
  } catch (error: any) {
    console.error('Error updating profile:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

