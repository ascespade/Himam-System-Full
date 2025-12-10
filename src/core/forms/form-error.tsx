/**
 * FormError Component
 * Consistent error display for forms
 */

'use client'

import { FC } from 'react'
import { AlertCircle } from 'lucide-react'

// ============================================================================
// Types
// ============================================================================

export interface FormErrorProps {
  message: string
  className?: string
}

// ============================================================================
// FormError Component
// ============================================================================

export const FormError: FC<FormErrorProps> = ({ message, className = '' }) => {
  if (!message) return null

  return (
    <div
      className={`flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 ${className}`}
      role="alert"
    >
      <AlertCircle size={16} className="flex-shrink-0" />
      <span>{message}</span>
    </div>
  )
}
