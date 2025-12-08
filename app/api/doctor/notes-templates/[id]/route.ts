/**
 * Doctor Notes Template Details API
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export const dynamic = 'force-dynamic'

/**
 * PUT /api/doctor/notes-templates/[id]
 * Update a notes template
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const templateId = params.id
    const body = await req.json()

    // Check ownership or admin
    const { data: template } = await supabaseAdmin
      .from('doctor_notes_templates')
      .select('created_by, is_default')
      .eq('id', templateId)
      .single()

    if (!template) {
      return NextResponse.json({ success: false, error: 'Template not found' }, { status: 404 })
    }

    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (template.created_by !== user.id && userData?.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    // Only admins can modify default templates
    if (template.is_default && userData?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Only admins can modify default templates' },
        { status: 403 }
      )
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (body.name !== undefined) updateData.name = body.name
    if (body.category !== undefined) updateData.category = body.category
    if (body.template_content !== undefined) updateData.template_content = body.template_content
    if (body.is_active !== undefined) updateData.is_active = body.is_active
    if (body.is_default !== undefined && userData?.role === 'admin') {
      updateData.is_default = body.is_default
    }

    const { data, error } = await supabaseAdmin
      .from('doctor_notes_templates')
      .update(updateData)
      .eq('id', templateId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Error updating notes template:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/doctor/notes-templates/[id]
 * Delete a notes template
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const templateId = params.id

    // Check ownership or admin
    const { data: template } = await supabaseAdmin
      .from('doctor_notes_templates')
      .select('created_by, is_default')
      .eq('id', templateId)
      .single()

    if (!template) {
      return NextResponse.json({ success: false, error: 'Template not found' }, { status: 404 })
    }

    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (template.created_by !== user.id && userData?.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    // Don't allow deletion of default templates, only deactivation
    if (template.is_default) {
      const { data, error } = await supabaseAdmin
        .from('doctor_notes_templates')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', templateId)
        .select()
        .single()

      if (error) throw error
      return NextResponse.json({ success: true, data, message: 'Template deactivated' })
    }

    // Soft delete (set is_active to false) instead of hard delete
    const { data, error } = await supabaseAdmin
      .from('doctor_notes_templates')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', templateId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data, message: 'Template deleted' })
  } catch (error: any) {
    console.error('Error deleting notes template:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

