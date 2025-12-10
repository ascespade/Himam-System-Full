/**
 * FormInput Component
 * Reusable input field with validation
 */

'use client'

import { FC, InputHTMLAttributes, forwardRef } from 'react'
import { FormField } from './form-field'

// ============================================================================
// Types
// ============================================================================

export interface FormInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  label: string
  name: string
  error?: string
  required?: boolean
  hint?: string
  className?: string
}

// ============================================================================
// FormInput Component
// ============================================================================

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, name, error, required, hint, className = '', ...inputProps }, ref) => {
    return (
      <FormField
        label={label}
        name={name}
        error={error}
        required={required}
        hint={hint}
        className={className}
      >
        <input
          ref={ref}
          id={name}
          name={name}
          className={`w-full px-4 py-2 border ${
            error ? 'border-red-500' : 'border-gray-200'
          } rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
            inputProps.disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
          } ${className}`}
          {...inputProps}
        />
      </FormField>
    )
  }
)

FormInput.displayName = 'FormInput'
