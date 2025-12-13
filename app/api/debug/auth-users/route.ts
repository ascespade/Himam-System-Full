import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * GET /api/debug/auth-users
 * Diagnostic endpoint to check auth users in Supabase
 */
export async function GET() {
  try {
    // List all auth users
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()

    if (authError) {
      return NextResponse.json({
        success: false,
        error: authError.message,
        details: authError
      }, { status: 500 })
    }

    // Get public users
    const { data: publicUsers, error: publicError } = await supabaseAdmin
      .from('users')
      .select('id, email, name, role')

    // Match auth users with public users
    const matchedUsers = authUsers?.users?.map(authUser => {
      const publicUser = publicUsers?.find(pu => pu.id === authUser.id)
      return {
        id: authUser.id,
        email: authUser.email,
        emailConfirmed: authUser.email_confirmed_at !== null,
        createdAt: authUser.created_at,
        lastSignIn: authUser.last_sign_in_at,
        hasPublicRecord: !!publicUser,
        publicRole: publicUser?.role || null,
        publicName: publicUser?.name || null
      }
    }) || []

    // Check for orphaned public users (exist in public.users but not in auth.users)
    const orphanedUsers = publicUsers?.filter(pu => 
      !authUsers?.users?.some(au => au.id === pu.id)
    ) || []

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        totalAuthUsers: authUsers?.users?.length || 0,
        totalPublicUsers: publicUsers?.length || 0,
        matchedUsers: matchedUsers.length,
        orphanedPublicUsers: orphanedUsers.length
      },
      authUsers: matchedUsers,
      orphanedUsers: orphanedUsers.map(u => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role
      })),
      testUsers: matchedUsers.filter(u => 
        ['doctor@himam.com', 'staff@himam.com', 'patient@himam.com'].includes(u.email || '')
      )
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'

    const errorStack = error instanceof Error ? error.stack : undefined
    return NextResponse.json({
      success: false,
      error: errorMessage,
      stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
    }, { status: 500 })
  }
}

