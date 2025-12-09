'use client'

/**
 * Doctor Dashboard Layout
 * Layout خاص بالطبيب مع Patient Context Provider
 */

import { PatientProvider } from '@/contexts/PatientContext'
import PatientContextPanel from '@/components/PatientContextPanel'
import PatientSelector from '@/components/PatientSelector'
import AIAssistant from '@/components/AIAssistant'

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <PatientProvider>
      <div className="p-8">
        {/* Patient Selector - Always visible */}
        <div className="mb-6">
          <PatientSelector />
        </div>

        {/* Patient Context Panel - Shows when patient is selected */}
        <PatientContextPanel />

        {/* Page Content */}
        {children}

        {/* AI Assistant - Floating button */}
        <AIAssistant />
      </div>
    </PatientProvider>
  )
}

