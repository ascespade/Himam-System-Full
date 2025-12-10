/**
 * FormField Component
 * Reusable form field with validation display
 */

'use client'

import { FC, ReactNode } from 'react'
import type { FormError } from './use-form'

// ============================================================================
// Types
// ============================================================================

export interface FormFieldProps {
  label: string
  name: string
  error?: string
  required?: boolean
  hint?: string
  children: ReactNode
  className?: string
}

// ============================================================================
// FormField Component
// ============================================================================

export const FormField: FC<FormFieldProps> = ({
  label,
  name,
  error,
  required = false,
  hint,
  children,
  className = '',
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 mr-1">*</span>}
      </label>
      {hint && (
        <p className="text-xs text-gray-500">{hint}</p>
      )}
      {children}
      {error && (
        <p className="text-sm text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
