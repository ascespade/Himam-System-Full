/**
 * Form Hook
 * Centralized form state management with validation
 */

import { useState, useCallback } from 'react'
import { z } from 'zod'
import { toast } from 'sonner'

// ============================================================================
// Types
// ============================================================================

export interface FormError {
  field: string
  message: string
}

export interface UseFormOptions<T> {
  initialValues: T
  validationSchema?: z.ZodSchema<T>
  onSubmit: (values: T) => Promise<void> | void
  onError?: (errors: FormError[]) => void
}

export interface UseFormResult<T> {
  values: T
  errors: FormError[]
  isSubmitting: boolean
  isValid: boolean
  setValue: <K extends keyof T>(field: K, value: T[K]) => void
  setValues: (values: Partial<T>) => void
  setError: (field: keyof T, message: string) => void
  clearError: (field: keyof T) => void
  clearErrors: () => void
  validate: () => boolean
  handleSubmit: (e?: React.FormEvent) => Promise<void>
  reset: () => void
}

// ============================================================================
// useForm Hook
// ============================================================================

/**
 * Form state management hook with validation
 */
export function useForm<T extends Record<string, unknown>>(
  options: UseFormOptions<T>
): UseFormResult<T> {
  const { initialValues, validationSchema, onSubmit, onError } = options

  const [values, setValuesState] = useState<T>(initialValues)
  const [errors, setErrors] = useState<FormError[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  /**
   * Sets a single field value
   */
  const setValue = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setValuesState(prev => ({ ...prev, [field]: value }))
    // Clear error for this field when value changes
    setErrors(prev => prev.filter(e => e.field !== String(field)))
  }, [])

  /**
   * Sets multiple field values
   */
  const setValues = useCallback((newValues: Partial<T>) => {
    setValuesState(prev => ({ ...prev, ...newValues }))
    // Clear errors for changed fields
    setErrors(prev => prev.filter(e => !(e.field in newValues)))
  }, [])

  /**
   * Sets an error for a field
   */
  const setError = useCallback((field: keyof T, message: string) => {
    setErrors(prev => {
      const filtered = prev.filter(e => e.field !== String(field))
      return [...filtered, { field: String(field), message }]
    })
  }, [])

  /**
   * Clears error for a field
   */
  const clearError = useCallback((field: keyof T) => {
    setErrors(prev => prev.filter(e => e.field !== String(field)))
  }, [])

  /**
   * Clears all errors
   */
  const clearErrors = useCallback(() => {
    setErrors([])
  }, [])

  /**
   * Validates the form
   */
  const validate = useCallback((): boolean => {
    if (!validationSchema) {
      return true
    }

    try {
      validationSchema.parse(values)
      setErrors([])
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formErrors: FormError[] = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }))
        setErrors(formErrors)
        return false
      }
      return false
    }
  }, [values, validationSchema])

  /**
   * Handles form submission
   */
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault()

    if (!validate()) {
      onError?.(errors)
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(values)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      toast.error(errorMessage)
      onError?.(errors)
    } finally {
      setIsSubmitting(false)
    }
  }, [values, validate, onSubmit, onError, errors])

  /**
   * Resets form to initial values
   */
  const reset = useCallback(() => {
    setValuesState(initialValues)
    setErrors([])
    setIsSubmitting(false)
  }, [initialValues])

  return {
    values,
    errors,
    isSubmitting,
    isValid: errors.length === 0,
    setValue,
    setValues,
    setError,
    clearError,
    clearErrors,
    validate,
    handleSubmit,
    reset,
  }
}
