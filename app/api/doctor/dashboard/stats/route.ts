/**
 * GET /api/doctor/dashboard/stats
 * Get comprehensive dashboard statistics for doctor
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { withRateLimit } from '@/core/api/middleware/withRateLimit'

export const dynamic = 'force-dynamic'

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

    const today = new Date()
    const todayStart = new Date(today.setHours(0, 0, 0, 0)).toISOString()
    const todayEnd = new Date(today.setHours(23, 59, 59, 999)).toISOString()
    const weekStart = new Date(today.setDate(today.getDate() - today.getDay())).toISOString()
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString()

    // Get all stats in parallel (except queue count which might fail)
    const [
      todayAppointments,
      weekAppointments,
      monthAppointments,
      patientsCount,
      activePatients,
      sessionsCount,
      weekSessions,
      monthSessions,
      treatmentPlans,
      activePlans,
      clinicStatus
    ] = await Promise.all([
      // Today's appointments
      supabaseAdmin
        .from('appointments')
        .select('id, status', { count: 'exact' })
        .eq('doctor_id', user.id)
        .gte('date', todayStart)
        .lte('date', todayEnd),
      
      // Week appointments
      supabaseAdmin
        .from('appointments')
        .select('id, status', { count: 'exact' })
        .eq('doctor_id', user.id)
        .gte('date', weekStart),
      
      // Month appointments
      supabaseAdmin
        .from('appointments')
        .select('id, status', { count: 'exact' })
        .eq('doctor_id', user.id)
        .gte('date', monthStart),
      
      // Total patients
      supabaseAdmin
        .from('doctor_patient_relationships')
        .select('id', { count: 'exact' })
        .eq('doctor_id', user.id)
        .is('end_date', null),
      
      // Active patients (with recent sessions)
      supabaseAdmin
        .from('doctor_patient_relationships')
        .select('patient_id', { count: 'exact' })
        .eq('doctor_id', user.id)
        .is('end_date', null)
        .gte('start_date', monthStart),
      
      // Total sessions
      supabaseAdmin
        .from('sessions')
        .select('id', { count: 'exact' })
        .eq('doctor_id', user.id),
      
      // Week sessions
      supabaseAdmin
        .from('sessions')
        .select('id', { count: 'exact' })
        .eq('doctor_id', user.id)
        .gte('date', weekStart),
      
      // Month sessions
      supabaseAdmin
        .from('sessions')
        .select('id', { count: 'exact' })
        .eq('doctor_id', user.id)
        .gte('date', monthStart),
      
      // Treatment plans
      supabaseAdmin
        .from('treatment_plans')
        .select('id, status', { count: 'exact' })
        .eq('doctor_id', user.id),
      
      // Active treatment plans
      supabaseAdmin
        .from('treatment_plans')
        .select('id', { count: 'exact' })
        .eq('doctor_id', user.id)
        .eq('status', 'active'),
      
      // Clinic status
      supabaseAdmin
        .from('clinic_settings')
        .select('is_open, daily_capacity, current_queue_count')
        .eq('doctor_id', user.id)
        .maybeSingle()
    ])

    // Queue count (separate try-catch as table might not exist)
    let queueCount: { count: number | null; data: any; error: any } = { count: 0, data: null, error: null }
    try {
      const queueResult = await supabaseAdmin
        .from('patient_visits')
        .select('id', { count: 'exact' })
        .eq('doctor_id', user.id)
        .eq('status', 'confirmed_to_doctor')
      queueCount = queueResult
    } catch (error) {
      // Table doesn't exist, use default
      queueCount = { count: 0, data: null, error: null }
    }

    // Calculate statistics
    const confirmedToday = todayAppointments.data?.filter((a: Record<string, unknown>) => a.status === 'confirmed').length || 0
    const completedSessions = weekSessions.count || 0
    const completedMonthSessions = monthSessions.count || 0

    return NextResponse.json({
      success: true,
      data: {
        // Quick Stats
        quickStats: {
          todayAppointments: todayAppointments.count || 0,
          confirmedToday,
          pendingToday: (todayAppointments.count || 0) - confirmedToday,
          totalPatients: patientsCount.count || 0,
          activePatients: activePatients.count || 0,
          totalSessions: sessionsCount.count || 0,
          weekSessions: completedSessions,
          monthSessions: completedMonthSessions,
          totalPlans: treatmentPlans.count || 0,
          activePlans: activePlans.count || 0,
          queueCount: queueCount.count || 0,
        },
        
        // Clinic Status
        clinic: {
          isOpen: clinicStatus.data?.is_open || false,
          dailyCapacity: clinicStatus.data?.daily_capacity || 20,
          currentQueue: clinicStatus.data?.current_queue_count || 0,
          availableSlots: (clinicStatus.data?.daily_capacity || 20) - (clinicStatus.data?.current_queue_count || 0),
        },
        
        // Charts Data
        charts: {
          weeklyAppointments: {
            labels: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
            data: [0, 0, 0, 0, 0, 0, 0], // Will be populated from week appointments
          },
          monthlySessions: {
            labels: Array.from({ length: 12 }, (_, i) => {
              const month = new Date(2024, i, 1)
              return month.toLocaleDateString('ar-SA', { month: 'short' })
            }),
            data: Array(12).fill(0),
          },
          patientStatus: {
            active: activePatients.count || 0,
            inactive: (patientsCount.count || 0) - (activePatients.count || 0),
            new: 0, // Can be calculated from start_date
          },
        },
        
        // Recent Activity
        recentActivity: {
          lastSession: null,
          lastAppointment: null,
          lastPatient: null,
        },
      },
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/doctor/dashboard/stats' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}, 'api')

