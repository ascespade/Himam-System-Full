/**
 * Download Prescription API
 * Generate and download prescription as PDF
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { withRateLimit } from '@/core/api/middleware/withRateLimit'

export const dynamic = 'force-dynamic'

export const GET = withRateLimit(async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const prescriptionId = params.id

    // Fetch prescription data - select specific columns
    const { data: prescription, error: prescriptionError } = await supabaseAdmin
      .from('prescriptions')
      .select(`
        id, patient_id, doctor_id, prescription_number, medications, instructions, created_at, updated_at,
        patients (
          id, name, phone, date_of_birth
        ),
        doctors:users!prescriptions_doctor_id_fkey (
          id, name
        )
      `)
      .eq('id', prescriptionId)
      .single()

    if (prescriptionError || !prescription) {
      return NextResponse.json(
        { success: false, error: 'Prescription not found' },
        { status: 404 }
      )
    }

    // Generate PDF
    const { jsPDF } = await import('jspdf')
    
    const doc = new jsPDF()
    
    // Add title
    doc.setFontSize(18)
    doc.text('وصفة طبية', 105, 20, { align: 'center' })
    
    // Prescription details
    doc.setFontSize(12)
    doc.text(`رقم الوصفة: ${prescription.prescription_number || prescriptionId}`, 14, 35)
    doc.text(`التاريخ: ${new Date(prescription.created_at).toLocaleDateString('ar-SA')}`, 14, 42)
    
    // Patient info
    if (prescription.patients) {
      const patient = Array.isArray(prescription.patients) 
        ? (prescription.patients[0] as Record<string, unknown> | undefined)
        : (prescription.patients as Record<string, unknown>)
      if (patient) {
        doc.text(`المريض: ${patient.name || 'غير محدد'}`, 14, 49)
        doc.text(`الهاتف: ${patient.phone || 'غير محدد'}`, 14, 56)
        if (patient.date_of_birth) {
          doc.text(`تاريخ الميلاد: ${new Date(patient.date_of_birth as string).toLocaleDateString('ar-SA')}`, 14, 63)
        }
      }
    }
    
    // Doctor info
    if (prescription.doctors) {
      const doctor = Array.isArray(prescription.doctors)
        ? (prescription.doctors[0] as Record<string, unknown> | undefined)
        : (prescription.doctors as Record<string, unknown>)
      if (doctor) {
        doc.text(`الطبيب: ${doctor.name || 'غير محدد'}`, 14, 70)
      }
    }
    
    // Medications
    const medications = Array.isArray(prescription.medications) ? prescription.medications : []
    let yPos = 85
    
    doc.setFontSize(14)
    doc.text('الأدوية:', 14, yPos)
    yPos += 10
    
    doc.setFontSize(11)
    medications.forEach((med: Record<string, unknown>, index: number) => {
      if (yPos > 250) {
        doc.addPage()
        yPos = 20
      }
      doc.text(`${index + 1}. ${med.name || 'دواء'} - ${med.dosage || ''} - ${med.frequency || ''}`, 14, yPos)
      yPos += 8
    })
    
    // Instructions
    if (prescription.instructions) {
      if (yPos > 250) {
        doc.addPage()
        yPos = 20
      }
      doc.setFontSize(14)
      doc.text('التعليمات:', 14, yPos)
      yPos += 10
      doc.setFontSize(11)
      const instructions = String(prescription.instructions)
      const instructionLines = doc.splitTextToSize(instructions, 180)
      instructionLines.forEach((line: string) => {
        if (yPos > 250) {
          doc.addPage()
          yPos = 20
        }
        doc.text(line, 14, yPos)
        yPos += 7
      })
    }
    
    // Generate PDF buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
    
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="prescription-${prescriptionId}.pdf"`,
      },
    })
  } catch (error) {
    const { logError } = await import('@/shared/utils/logger')
    logError('Failed to generate prescription PDF', error, { prescriptionId: params.id, endpoint: '/api/doctor/prescriptions/[id]/download' })
    
    return NextResponse.json(
      { success: false, error: 'Failed to generate prescription' },
      { status: 500 }
    )
  }
}, 'api')
