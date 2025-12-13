/**
 * Download Invoice API
 * Generate and download invoice as PDF
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const invoiceId = params.id

    // Fetch invoice data
    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from('invoices')
      .select(`
        *,
        patients (
          id,
          name,
          phone
        )
      `)
      .eq('id', invoiceId)
      .single()

    if (invoiceError || !invoice) {
      return NextResponse.json(
        { success: false, error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Generate PDF
    const { jsPDF } = await import('jspdf')
    const autoTable = (await import('jspdf-autotable')).default
    
    const doc = new jsPDF()
    
    // Add title
    doc.setFontSize(18)
    doc.text('فاتورة', 105, 20, { align: 'center' })
    
    // Invoice details
    doc.setFontSize(12)
    doc.text(`رقم الفاتورة: ${invoice.invoice_number || invoiceId}`, 14, 35)
    doc.text(`التاريخ: ${new Date(invoice.created_at).toLocaleDateString('ar-SA')}`, 14, 42)
    
    // Patient info
    if (invoice.patients && typeof invoice.patients === 'object') {
      const patient = invoice.patients as Record<string, unknown>
      doc.text(`المريض: ${patient.name || 'غير محدد'}`, 14, 49)
      doc.text(`الهاتف: ${patient.phone || 'غير محدد'}`, 14, 56)
    }
    
    // Invoice items
    const items = Array.isArray(invoice.items) ? invoice.items : []
    const tableData = items.map((item: Record<string, unknown>) => [
      String(item.description || ''),
      String(item.quantity || 0),
      String(item.price || 0),
      String((item.quantity as number || 0) * (item.price as number || 0))
    ])
    
    autoTable(doc, {
      head: [['الوصف', 'الكمية', 'السعر', 'الإجمالي']],
      body: tableData,
      startY: 65,
      styles: { font: 'Arial', fontSize: 10 },
      headStyles: { fillColor: [66, 139, 202] },
    })
    
    // Total
    const finalY = (doc as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY || 100
    doc.setFontSize(14)
    doc.text(`الإجمالي: ${invoice.total || 0} ريال`, 14, finalY + 10)
    
    // Generate PDF buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
    
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoiceId}.pdf"`,
      },
    })
  } catch (error) {
    const { logError } = await import('@/shared/utils/logger')
    logError('Failed to generate invoice PDF', error, { invoiceId: params.id, endpoint: '/api/billing/invoices/[id]/download' })
    
    return NextResponse.json(
      { success: false, error: 'Failed to generate invoice' },
      { status: 500 }
    )
  }
}
