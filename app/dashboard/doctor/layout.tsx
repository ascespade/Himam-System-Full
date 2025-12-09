'use client'

/**
 * Doctor Dashboard Layout
 * Layout خاص بالطبيب مع Patient Context Provider
<<<<<<< HEAD
 */

import { PatientProvider } from '@/contexts/PatientContext'
import PatientContextPanel from '@/components/PatientContextPanel'
import PatientSelector from '@/components/PatientSelector'
import AIAssistant from '@/components/AIAssistant'

=======
 * TODO: Re-implement PatientContext, PatientContextPanel, PatientSelector, AIAssistant
 */

>>>>>>> cursor/fix-code-errors-and-warnings-8041
export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
<<<<<<< HEAD
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
=======
    <div className="p-8">
      {/* TODO: Patient Selector - Always visible */}
      {/* <div className="mb-6">
        <PatientSelector />
      </div> */}

      {/* TODO: Patient Context Panel - Shows when patient is selected */}
      {/* <PatientContextPanel /> */}

      {/* Page Content */}
      {children}

      {/* TODO: AI Assistant - Floating button */}
      {/* <AIAssistant /> */}
    </div>
>>>>>>> cursor/fix-code-errors-and-warnings-8041
  )
}

