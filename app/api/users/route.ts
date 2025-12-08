import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * GET /api/users
 * Get all users with optional filtering
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const role = searchParams.get('role')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    let query = supabaseAdmin
      .from('users')
      .select('*', { count: 'exact' })

    // Filter by role
    if (role && role !== 'all') {
      query = query.eq('role', role)
    }

    // Search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)
    }

    // Pagination
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error: any) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/users
 * Create a new user
 * Creates both auth user and public.users record
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, phone, role, password } = body

    // Validation
    if (!name || !email || !phone || !role) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Password is required for authentication
    if (!password) {
      return NextResponse.json(
        { success: false, error: 'Password is required' },
        { status: 400 }
      )
    }

    // Check if user exists in auth.users
    const { data: existingAuthUser } = await supabaseAdmin.auth.admin.listUsers()
    const authUserExists = existingAuthUser?.users?.some(u => u.email === email)

    if (authUserExists) {
      return NextResponse.json(
        { success: false, error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Check if user exists in public.users
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Create auth user first (this will trigger handle_new_user() to create public.users entry)
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        name,
        phone,
        role
      }
    })

    if (authError) {
      console.error('Error creating auth user:', authError)
      console.error('Auth error details:', JSON.stringify(authError, null, 2))
      return NextResponse.json(
        { success: false, error: `Failed to create authentication user: ${authError.message}` },
        { status: 500 }
      )
    }

    if (!authUser?.user?.id) {
      console.error('No user ID returned from auth creation')
      console.error('Auth user response:', JSON.stringify(authUser, null, 2))
      return NextResponse.json(
        { success: false, error: 'Failed to create user: No user ID returned' },
        { status: 500 }
      )
    }

    // Verify the auth user was created and can be retrieved
    const { data: verifyUser, error: verifyError } = await supabaseAdmin.auth.admin.getUserById(authUser.user.id)
    if (verifyError || !verifyUser?.user) {
      console.error('Failed to verify created auth user:', verifyError)
      return NextResponse.json(
        { success: false, error: 'User created but verification failed' },
        { status: 500 }
      )
    }

    // Wait a moment for trigger to create public.users entry
    await new Promise(resolve => setTimeout(resolve, 500))

    // Update the public.users record with correct role and details
    // The trigger might have created a basic entry, so we update it
    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        name,
        phone,
        role,
        email
      })
      .eq('id', authUser.user.id)
      .select()
      .single()

    if (updateError) {
      // If update fails, the trigger might not have created the entry yet
      // Try to insert directly
      const { data: insertedUser, error: insertError } = await supabaseAdmin
        .from('users')
        .insert({
          id: authUser.user.id,
          name,
          email,
          phone,
          role,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (insertError) {
        console.error('Error creating/updating public.users:', insertError)
        // Clean up auth user if we can't create public.users entry
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
        return NextResponse.json(
          { success: false, error: `Failed to create user record: ${insertError.message}` },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        data: insertedUser
      }, { status: 201 })
    }

    return NextResponse.json({
      success: true,
      data: updatedUser
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

