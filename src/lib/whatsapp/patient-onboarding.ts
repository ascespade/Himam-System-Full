/**
 * WhatsApp Patient Onboarding
 * Automated patient registration via WhatsApp
 */

import { patientRepository } from '@/infrastructure/supabase/repositories'
import { sendTextMessage } from '../whatsapp-messaging'
import { generateWhatsAppResponse } from '../ai'
import { supabaseAdmin } from '../supabase'

export interface PatientOnboardingData {
  name?: string
  phone: string
  email?: string
  date_of_birth?: string
  gender?: 'male' | 'female' | 'other'
  address?: string
}

/**
 * Extract patient data from WhatsApp conversation
 */
export async function extractPatientData(
  phone: string,
  conversationHistory: string[]
): Promise<Partial<PatientOnboardingData>> {
  const fullConversation = conversationHistory.join('\n')
  
  // Use AI to extract structured data
  const extractionPrompt = `استخرج البيانات التالية من المحادثة التالية:
- الاسم الكامل
- البريد الإلكتروني
- تاريخ الميلاد
- الجنس
- العنوان

المحادثة:
${fullConversation}

أرجع البيانات بصيغة JSON فقط.`

  try {
    const aiResponse = await generateWhatsAppResponse(extractionPrompt, {
      userPhone: phone,
      userRole: 'patient'
    })

    // Parse AI response (assuming it returns JSON)
    const data = JSON.parse(aiResponse.replace(/```json\n?|\n?```/g, ''))
    return {
      name: data.name,
      email: data.email,
      date_of_birth: data.date_of_birth,
      gender: data.gender,
      address: data.address
    }
  } catch (error) {
    console.error('Error extracting patient data:', error)
    return {}
  }
}

/**
 * Create patient record from WhatsApp conversation
 */
export async function createPatientFromWhatsApp(
  phone: string,
  conversationHistory: string[]
): Promise<{ success: boolean; patientId?: string; message: string }> {
  try {
    // Check if patient already exists
    const existingPatient = await patientRepository.findByPhone(phone)
    if (existingPatient) {
      return {
        success: false,
        patientId: existingPatient.id,
        message: 'المريض مسجل بالفعل في النظام'
      }
    }

    // Extract data from conversation
    const extractedData = await extractPatientData(phone, conversationHistory)

    if (!extractedData.name) {
      return {
        success: false,
        message: 'لم يتم العثور على الاسم في المحادثة'
      }
    }

    // Create patient
    const patient = await patientRepository.create({
      name: extractedData.name,
      phone,
      email: extractedData.email,
      date_of_birth: extractedData.date_of_birth,
      gender: extractedData.gender,
      address: extractedData.address,
      status: 'active'
    })

    return {
      success: true,
      patientId: patient.id,
      message: `تم تسجيل ${patient.name} بنجاح`
    }
  } catch (error) {
    console.error('Error creating patient from WhatsApp:', error)
    return {
      success: false,
      message: 'حدث خطأ أثناء التسجيل'
    }
  }
}

/**
 * Smart appointment booking from WhatsApp
 */
export async function bookAppointmentFromWhatsApp(
  patientId: string,
  message: string
): Promise<{ success: boolean; appointmentId?: string; message: string }> {
  try {
    // Use AI to extract appointment details
    const bookingPrompt = `استخرج تفاصيل الموعد من الرسالة التالية:
${message}

أرجع JSON يحتوي على:
- date (YYYY-MM-DD)
- time (HH:MM)
- specialist (اسم الأخصائي)
- service_type (نوع الخدمة)`

    const aiResponse = await generateWhatsAppResponse(bookingPrompt, {
      userPhone: '',
      userRole: 'patient'
    })

    const bookingData = JSON.parse(aiResponse.replace(/```json\n?|\n?```/g, ''))

    // Create appointment
    const { data: appointment, error } = await supabaseAdmin
      .from('appointments')
      .insert({
        patient_name: (await patientRepository.findById(patientId))?.name || '',
        phone: (await patientRepository.findById(patientId))?.phone || '',
        specialist: bookingData.specialist || 'غير محدد',
        date: new Date(`${bookingData.date}T${bookingData.time}`).toISOString(),
        status: 'pending',
        notes: `تم الحجز عبر WhatsApp: ${message}`
      })
      .select()
      .single()

    if (error) throw error

    return {
      success: true,
      appointmentId: appointment.id,
      message: `تم حجز الموعد بنجاح: ${bookingData.date} الساعة ${bookingData.time}`
    }
  } catch (error) {
    console.error('Error booking appointment:', error)
    return {
      success: false,
      message: 'حدث خطأ أثناء حجز الموعد'
    }
  }
}
