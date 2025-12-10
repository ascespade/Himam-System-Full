/**
 * Forms Index
 * Centralized export for form utilities
 */

export { useForm, type UseFormOptions, type UseFormResult, type FormError } from './use-form'
export { FormField, type FormFieldProps } from './form-field'
export { FormInput, type FormInputProps } from './form-input'
export { FormSelect, type FormSelectProps, type SelectOption } from './form-select'
export { FormTextarea, type FormTextareaProps } from './form-textarea'
export { FormError as FormErrorComponent, type FormErrorProps } from './form-error'
export {
  validateForm,
  getFieldError,
  hasFieldError,
  clearFieldError,
  clearAllErrors,
  isValidEmail,
  isValidPhone,
  isRequired,
  minLength,
  maxLength,
  isInRange,
} from './validation-helpers'
