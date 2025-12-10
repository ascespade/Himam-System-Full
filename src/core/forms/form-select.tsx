/**
 * FormSelect Component
 * Reusable select field with validation
 */

'use client'

import { FC, SelectHTMLAttributes, forwardRef } from 'react'
import { FormField } from './form-field'

// ============================================================================
// Types
// ============================================================================

export interface SelectOption {
  value: string | number
  label: string
  disabled?: boolean
}

export interface FormSelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'className'> {
  label: string
  name: string
  options: SelectOption[]
  error?: string
  required?: boolean
  hint?: string
  className?: string
  placeholder?: string
}

// ============================================================================
// FormSelect Component
// ============================================================================

export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ label, name, options, error, required, hint, placeholder, className = '', ...selectProps }, ref) => {
    return (
      <FormField
        label={label}
        name={name}
        error={error}
        required={required}
        hint={hint}
        className={className}
      >
        <select
          ref={ref}
          id={name}
          name={name}
          className={`w-full px-4 py-2 border ${
            error ? 'border-red-500' : 'border-gray-200'
          } rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
            selectProps.disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
          } ${className}`}
          {...selectProps}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
      </FormField>
    )
  }
)

FormSelect.displayName = 'FormSelect'
