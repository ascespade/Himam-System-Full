/**
 * FormTextarea Component
 * Reusable textarea field with validation
 */

'use client'

import { FC, TextareaHTMLAttributes, forwardRef } from 'react'
import { FormField } from './form-field'

// ============================================================================
// Types
// ============================================================================

export interface FormTextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> {
  label: string
  name: string
  error?: string
  required?: boolean
  hint?: string
  className?: string
}

// ============================================================================
// FormTextarea Component
// ============================================================================

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ label, name, error, required, hint, className = '', ...textareaProps }, ref) => {
    return (
      <FormField
        label={label}
        name={name}
        error={error}
        required={required}
        hint={hint}
        className={className}
      >
        <textarea
          ref={ref}
          id={name}
          name={name}
          rows={textareaProps.rows || 4}
          className={`w-full px-4 py-2 border ${
            error ? 'border-red-500' : 'border-gray-200'
          } rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none ${
            textareaProps.disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
          } ${className}`}
          {...textareaProps}
        />
      </FormField>
    )
  }
)

FormTextarea.displayName = 'FormTextarea'
