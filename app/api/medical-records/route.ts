import { supabaseAdmin } from '@/lib/supabase'
import { CreateMedicalRecordSchema } from '@/shared/schemas'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    // 1. Check Authentication
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

    // 2. Parse and Validate Body
    const body = await req.json()
    const validation = CreateMedicalRecordSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({ success: false, error: validation.error.errors }, { status: 400 })
    }

    const { patient_id, record_type, chief_complaint, history_of_present_illness, physical_examination, assessment, plan, notes } = validation.data

    // 3. Insert into Database
    // Note: doctor_id should come from the authenticated user, but for flexibility we might allow passing it if admin
    // For now, enforce current user as doctor
    const { data, error } = await supabaseAdmin
      .from('medical_records')
      .insert({
        patient_id,
        doctor_id: user.id,
        record_type,
        chief_complaint,
        history_of_present_illness,
        physical_examination,
        assessment,
        plan,
        notes,
        date: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    // Audit Log
    const { logAudit } = await import('@/lib/audit')
    await logAudit(user.id, 'create_medical_record', 'medical_record', data.id, { record_type }, req)

    return NextResponse.json({ success: true, data })

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء إنشاء السجل الطبي'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error creating medical record', error, { endpoint: '/api/medical-records' })
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}
