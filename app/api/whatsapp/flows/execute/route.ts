/**
 * WhatsApp Flow Execution API
 * Execute a flow based on message content
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { successResponse, errorResponse } from '@/shared/utils/api'
import { HTTP_STATUS } from '@/shared/constants'
import { generateWhatsAppResponse } from '@/lib/ai'

export const dynamic = 'force-dynamic'

/**
 * POST /api/whatsapp/flows/execute
 * Execute a flow for a conversation
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      conversation_id,
      message,
      patient_id,
    } = body

    if (!conversation_id || !message) {
      return NextResponse.json(
        { success: false, error: 'conversation_id and message are required' },
        { status: HTTP_STATUS.BAD_REQUEST }
      )
    }

    // Find matching active flows
    const { data: flows, error: flowsError } = await supabaseAdmin
      .from('whatsapp_flows')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: false })

    if (flowsError) throw flowsError

    // Find flow that matches the trigger
    let matchedFlow = null
    for (const flow of flows || []) {
      const triggerConfig = flow.trigger_config || {}
      
      // Check keyword triggers
      if (flow.trigger_type === 'keyword') {
        const keywords = triggerConfig.keywords || []
        if (keywords.some((kw: string) => 
          message.toLowerCase().includes(kw.toLowerCase())
        )) {
          matchedFlow = flow
          break
        }
      }
      
      // Check intent triggers (for appointment flows)
      if (flow.trigger_type === 'intent' && flow.category === 'appointment') {
        const intents = triggerConfig.intents || []
        const messageLower = message.toLowerCase()
        if (intents.some((intent: string) => 
          messageLower.includes(intent.toLowerCase())
        )) {
          matchedFlow = flow
          break
        }
      }
    }

    if (!matchedFlow) {
      // No flow matched, return null (will use default AI response)
      return NextResponse.json({
        success: true,
        data: {
          flow_executed: false,
          message: 'No matching flow found',
        },
      })
    }

    // Create flow execution record
    const { data: execution, error: execError } = await supabaseAdmin
      .from('whatsapp_flow_executions')
      .insert({
        flow_id: matchedFlow.id,
        conversation_id,
        patient_id: patient_id || null,
        trigger_message: message,
        status: 'running',
      })
      .select()
      .single()

    if (execError) throw execError

    // Execute flow steps
    const steps = matchedFlow.steps || []
    const stepResults: Record<string, any> = {}
    let currentStep = 0

    try {
      for (const step of steps) {
        currentStep = step.step || currentStep + 1
        
        if (step.type === 'ai_analysis') {
          // Analyze message intent
          const analysis = await generateWhatsAppResponse(
            '', // phone not needed for analysis
            message,
            [],
            undefined
          )
          stepResults[`step_${currentStep}`] = {
            type: 'ai_analysis',
            result: analysis.text,
            model: analysis.model,
          }
        } else if (step.type === 'ai_extraction') {
          // Extract appointment details
          const extractionPrompt = `استخرج من الرسالة التالية تفاصيل الموعد:
${message}

أجب بصيغة JSON:
{
  "date": "التاريخ إن وجد",
  "time": "الوقت إن وجد",
  "specialist": "اسم الأخصائي إن وجد",
  "service": "نوع الخدمة إن وجد",
  "action": "create|update|confirm|cancel"
}`

          const extraction = await generateWhatsAppResponse('', extractionPrompt, [], undefined)
          stepResults[`step_${currentStep}`] = {
            type: 'ai_extraction',
            result: extraction.text,
          }
        } else if (step.type === 'appointment_action') {
          // Execute appointment action
          const actions = matchedFlow.appointment_actions || []
          const extractedData = stepResults[`step_${currentStep - 1}`]?.result || {}
          
          // Parse extracted data (simplified - in production, use proper JSON parsing)
          let appointmentData: any = {}
          try {
            // Try to parse as JSON
            const jsonMatch = extractedData.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
              appointmentData = JSON.parse(jsonMatch[0])
            }
          } catch (e) {
            // If parsing fails, extract manually from text
            appointmentData = {
              action: actions[0] || 'create',
            }
          }

          // Execute appointment action
          if (appointmentData.action === 'create' && actions.includes('create')) {
            // Create appointment logic
            const appointmentDate = appointmentData.date 
              ? new Date(appointmentData.date)
              : new Date()

            const { data: appointment, error: aptError } = await supabaseAdmin
              .from('appointments')
              .insert({
                patient_id: patient_id || null,
                patient_name: '', // Will be filled from patient record
                phone: '', // Will be filled from conversation
                specialist: appointmentData.specialist || 'الأخصائي',
                date: appointmentDate.toISOString(),
                status: 'pending',
                notes: `تم الحجز عبر الواتساب - ${message}`,
              })
              .select()
              .single()

            if (!aptError && appointment) {
              stepResults[`step_${currentStep}`] = {
                type: 'appointment_action',
                action: 'create',
                appointment_id: appointment.id,
                result: 'success',
              }

              // Update execution with appointment_id
              await supabaseAdmin
                .from('whatsapp_flow_executions')
                .update({ appointment_id: appointment.id })
                .eq('id', execution.id)
            } else {
              stepResults[`step_${currentStep}`] = {
                type: 'appointment_action',
                action: 'create',
                result: 'error',
                error: aptError?.message,
              }
            }
          } else if (appointmentData.action === 'confirm' && actions.includes('confirm')) {
            // Confirm appointment logic
            // Find patient's pending appointments
            const { data: appointments } = await supabaseAdmin
              .from('appointments')
              .select('id, date, specialist')
              .eq('patient_id', patient_id)
              .eq('status', 'pending')
              .order('date', { ascending: true })
              .limit(1)

            if (appointments && appointments.length > 0) {
              const { error: confirmError } = await supabaseAdmin
                .from('appointments')
                .update({ status: 'confirmed' })
                .eq('id', appointments[0].id)

              stepResults[`step_${currentStep}`] = {
                type: 'appointment_action',
                action: 'confirm',
                appointment_id: appointments[0].id,
                result: confirmError ? 'error' : 'success',
              }
            }
          }
        }

        // Update execution progress
        await supabaseAdmin
          .from('whatsapp_flow_executions')
          .update({
            current_step: currentStep,
            step_results: stepResults,
          })
          .eq('id', execution.id)
      }

      // Mark execution as completed
      await supabaseAdmin
        .from('whatsapp_flow_executions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', execution.id)

      return NextResponse.json({
        success: true,
        data: {
          flow_executed: true,
          flow_id: matchedFlow.id,
          flow_name: matchedFlow.name,
          execution_id: execution.id,
          step_results: stepResults,
        },
      })
    } catch (execError: any) {
      // Mark execution as failed
      await supabaseAdmin
        .from('whatsapp_flow_executions')
        .update({
          status: 'failed',
          error_message: execError.message,
          completed_at: new Date().toISOString(),
        })
        .eq('id', execution.id)

      throw execError
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/whatsapp/flows/execute' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    )
  }
}
