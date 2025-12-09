import { NextRequest, NextResponse } from 'next/server'
import { withAuth, getQueryParams, getPaginationParams, parseRequestBody } from '@/core/api/middleware'
import { successResponse, paginatedResponse, errorResponse } from '@/shared/utils/api'
import { HTTP_STATUS } from '@/shared/constants'
import { supabaseAdmin } from '@/lib/supabase'
import { createUserSchema } from '@/core/validations/schemas'

export const dynamic = 'force-dynamic'

/**
 * GET /api/users
 * Get all users with optional filtering
 */
export const GET = withAuth(async (context) => {
  const { request } = context
  const searchParams = getQueryParams(request)
  const { page, limit, offset } = getPaginationParams(request)

  const role = searchParams.get('role')
  const search = searchParams.get('search')

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
  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw error

  return NextResponse.json(
    paginatedResponse(data || [], page, limit, count || 0)
  )
}, {
  requireRoles: ['admin'], // Only admins can list all users
})

import { createUserSchema } from '@/core/validations/schemas'
import { parseRequestBody } from '@/core/api/middleware'
import { HTTP_STATUS } from '@/shared/constants'
import { errorResponse } from '@/shared/utils/api'

/**
 * POST /api/users
 * Create a new user
 * Creates both auth user and public.users record
 */
export const POST = withAuth(async (context) => {
  const { request } = context

  // Parse and validate request body
  const body = await parseRequestBody(request)
  const validated = createUserSchema.parse(body)
  const { name, email, phone, role, password } = validated

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

    return NextResponse.json(
      successResponse(updatedUser),
      { status: HTTP_STATUS.CREATED }
    )
  },
  {
    requireRoles: ['admin'], // Only admins can create users
  }
)

