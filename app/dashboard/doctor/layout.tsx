'use client'

/**
 * Doctor Dashboard Layout
 * Layout خاص بالطبيب مع Patient Context Provider
 * TODO: Re-implement PatientContext, PatientContextPanel, PatientSelector, AIAssistant
 */

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
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
  )
}

