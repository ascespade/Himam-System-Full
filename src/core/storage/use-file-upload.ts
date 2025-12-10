/**
 * File Upload Hook
 * React hook for file uploads with progress tracking
 */

'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { storageService, type FileUploadOptions, type FileUploadResult } from './storage.service'

export interface UseFileUploadOptions extends FileUploadOptions {
  onSuccess?: (result: FileUploadResult) => void
  onError?: (error: string) => void
  showToast?: boolean
}

export interface UseFileUploadResult {
  upload: (file: File) => Promise<FileUploadResult | null>
  uploading: boolean
  progress: number
  error: string | null
  reset: () => void
}

/**
 * Hook for file uploads with progress tracking
 */
export function useFileUpload(
  options: UseFileUploadOptions = {}
): UseFileUploadResult {
  const {
    onSuccess,
    onError,
    showToast = true,
    ...uploadOptions
  } = options

  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const upload = useCallback(async (file: File): Promise<FileUploadResult | null> => {
    try {
      setUploading(true)
      setProgress(0)
      setError(null)

      // Validate file
      const validation = storageService.validateFile(file, uploadOptions)
      if (!validation.valid) {
        throw new Error(validation.error || 'File validation failed')
      }

      // Simulate progress (in real implementation, use XMLHttpRequest for actual progress)
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 10
        })
      }, 200)

      // Upload file
      const result = await storageService.uploadFile(file, uploadOptions)

      clearInterval(progressInterval)
      setProgress(100)

      if (showToast) {
        toast.success('تم رفع الملف بنجاح')
      }

      onSuccess?.(result)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload file'
      setError(errorMessage)

      if (showToast) {
        toast.error(errorMessage)
      }

      onError?.(errorMessage)
      return null
    } finally {
      setUploading(false)
      setTimeout(() => setProgress(0), 1000)
    }
  }, [uploadOptions, onSuccess, onError, showToast])

  const reset = useCallback(() => {
    setError(null)
    setProgress(0)
    setUploading(false)
  }, [])

  return {
    upload,
    uploading,
    progress,
    error,
    reset,
  }
}
