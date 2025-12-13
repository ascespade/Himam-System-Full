/**
 * Slack Recording Webhook Handler
 * Receives recording completion notifications from Slack
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createNotification, NotificationTemplates } from '@/lib/notifications'

export const dynamic = 'force-dynamic'

/**
 * POST /api/slack/webhooks/recording
 * Handle Slack recording webhook
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Slack webhook payload structure
    const { event, challenge } = body

    // Webhook verification
    if (challenge) {
      return NextResponse.json({ challenge })
    }

    if (!event || event.type !== 'call_recording_ended') {
      return NextResponse.json({ success: true, message: 'Event not handled' })
    }

    const { call_id, recording_url, duration, file_size } = event

    // Find video session by Slack channel or meeting ID
    const { data: videoSession } = await supabaseAdmin
      .from('video_sessions')
      .select('*, sessions(*), patients(*), doctors:doctor_id(*)')
      .or(`meeting_id.eq.${call_id},slack_channel_id.ilike.%${call_id}%`)
      .eq('recording_status', 'enabled')
      .single()

    if (!videoSession) {
      console.warn(`Video session not found for call_id: ${call_id}`)
      return NextResponse.json({ success: true, message: 'Session not found' })
    }

    // Upload recording to Supabase Storage
    let finalRecordingUrl = recording_url

    if (recording_url && videoSession.recording_enabled) {
      try {
        // Download recording from Slack
        const recordingResponse = await fetch(recording_url)
        if (recordingResponse.ok) {
          const recordingBlob = await recordingResponse.blob()
          const recordingBuffer = await recordingBlob.arrayBuffer()

          // Upload to Supabase Storage
          const fileName = `video-sessions/${videoSession.id}/${Date.now()}.mp4`
          const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
            .from('recordings')
            .upload(fileName, recordingBuffer, {
              contentType: 'video/mp4',
              upsert: false,
            })

          if (!uploadError && uploadData) {
            // Get public URL
            const { data: urlData } = supabaseAdmin.storage
              .from('recordings')
              .getPublicUrl(fileName)

            finalRecordingUrl = urlData.publicUrl
          }
        }
      } catch (uploadError) {
        console.error('Error uploading recording to storage:', uploadError)
        // Continue with Slack URL if upload fails
      }
    }

    // Update video session
    const { data: updatedSession, error: updateError } = await supabaseAdmin
      .from('video_sessions')
      .update({
        recording_url: finalRecordingUrl,
        recording_duration: duration || null,
        recording_size: file_size || null,
        recording_status: 'completed',
        ended_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', videoSession.id)
      .select()
      .single()

    if (updateError) throw updateError

    // Update session status
    if (videoSession.session_id) {
      await supabaseAdmin
        .from('sessions')
        .update({ status: 'completed' })
        .eq('id', videoSession.session_id)
    }

    // Create notification for doctor
    await createNotification({
      userId: videoSession.doctor_id,
      patientId: videoSession.patient_id,
      ...NotificationTemplates.systemAlert(
        `تم رفع تسجيل الجلسة عن بُعد للمريض ${videoSession.patients?.name || 'مريض'}`
      ),
      title: 'تسجيل جلسة جاهز',
      entityType: 'video_session',
      entityId: videoSession.id,
    })

    return NextResponse.json({
      success: true,
      message: 'Recording processed successfully',
      data: updatedSession,
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/slack/webhooks/recording' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

