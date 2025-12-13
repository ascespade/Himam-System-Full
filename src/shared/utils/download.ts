/**
 * Download Utilities
 * Functions for downloading invoices, prescriptions, etc.
 */

import { logInfo, logError } from './logger'

/**
 * Download invoice as PDF
 */
export async function downloadInvoice(invoiceId: string): Promise<void> {
  try {
    const response = await fetch(`/api/billing/invoices/${invoiceId}/download`)
    
    if (!response.ok) {
      throw new Error('فشل تحميل الفاتورة')
    }
    
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `invoice-${invoiceId}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    logInfo('Invoice downloaded', { invoiceId })
  } catch (error) {
    logError('Failed to download invoice', error, { invoiceId })
    throw error
  }
}

/**
 * Download prescription as PDF
 */
export async function downloadPrescription(prescriptionId: string): Promise<void> {
  try {
    const response = await fetch(`/api/doctor/prescriptions/${prescriptionId}/download`)
    
    if (!response.ok) {
      throw new Error('فشل تحميل الوصفة')
    }
    
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.download = `prescription-${prescriptionId}.pdf`
    document.body.appendChild(link)
    link.href = url
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    logInfo('Prescription downloaded', { prescriptionId })
  } catch (error) {
    logError('Failed to download prescription', error, { prescriptionId })
    throw error
  }
}
