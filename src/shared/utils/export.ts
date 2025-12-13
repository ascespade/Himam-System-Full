/**
 * Export Utilities
 * Functions for exporting data to PDF, Excel, etc.
 */

import { logInfo, logError } from './logger'

/**
 * Export data to PDF
 */
export async function exportToPDF(
  data: Record<string, unknown>[],
  columns: Array<{ key: string; label: string }>,
  title: string
): Promise<Blob> {
  try {
    // Dynamic import to reduce bundle size
    const { jsPDF } = await import('jspdf')
    const autoTable = (await import('jspdf-autotable')).default
    
    const doc = new jsPDF()
    
    // Add title
    doc.setFontSize(16)
    doc.text(title, 14, 15)
    
    // Add date
    doc.setFontSize(10)
    doc.text(`تاريخ التصدير: ${new Date().toLocaleDateString('ar-SA')}`, 14, 25)
    
    // Prepare table data
    const tableData = data.map(row => 
      columns.map(col => {
        const value = row[col.key]
        return value !== null && value !== undefined ? String(value) : ''
      })
    )
    
    // Add table
    autoTable(doc, {
      head: [columns.map(col => col.label)],
      body: tableData,
      startY: 30,
      styles: { font: 'Arial', fontSize: 9 },
      headStyles: { fillColor: [66, 139, 202] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    })
    
    logInfo('PDF exported successfully', { title, rowCount: data.length })
    
    return doc.output('blob')
  } catch (error) {
    logError('Failed to export PDF', error, { title, rowCount: data.length })
    throw new Error('فشل تصدير الملف')
  }
}

/**
 * Export data to Excel
 */
export async function exportToExcel(
  data: Record<string, unknown>[],
  columns: Array<{ key: string; label: string }>,
  title: string
): Promise<Blob> {
  try {
    // Dynamic import to reduce bundle size
    const XLSX = await import('xlsx')
    
    // Prepare worksheet data
    const worksheetData = [
      columns.map(col => col.label), // Header row
      ...data.map(row => 
        columns.map(col => {
          const value = row[col.key]
          return value !== null && value !== undefined ? String(value) : ''
        })
      )
    ]
    
    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
    
    // Set column widths
    const colWidths = columns.map(() => ({ wch: 20 }))
    worksheet['!cols'] = colWidths
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, title)
    
    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    
    logInfo('Excel exported successfully', { title, rowCount: data.length })
    
    return blob
  } catch (error) {
    logError('Failed to export Excel', error, { title, rowCount: data.length })
    throw new Error('فشل تصدير الملف')
  }
}

/**
 * Download file
 */
export function downloadFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
