/**
 * Storage Service
 * Centralized file upload and storage management
 */

import { BaseService, ServiceException } from '@/core/services'
import { supabaseAdmin } from '@/lib/supabase'
import { logError } from '@/shared/utils/logger'

export interface FileUploadOptions {
  folder?: string
  maxSize?: number // in bytes
  allowedTypes?: string[]
  public?: boolean
}

export interface FileUploadResult {
  url: string
  path: string
  size: number
  type: string
}

export class StorageService extends BaseService {
  /**
   * Validates a file before upload
   */
  validateFile(file: File, options: FileUploadOptions = {}): { valid: boolean; error?: string } {
    const { maxSize = 10 * 1024 * 1024, allowedTypes = [] } = options // Default 10MB

    // Check file size
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File size exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB`,
      }
    }

    // Check file type
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
      }
    }

    return { valid: true }
  }

  /**
   * Uploads a file to Supabase Storage
   */
  async uploadFile(
    file: File,
    options: FileUploadOptions = {}
  ): Promise<FileUploadResult> {
    const { folder = 'uploads', public: isPublic = false } = options

    // Validate file
    const validation = this.validateFile(file, options)
    if (!validation.valid) {
      throw new ServiceException(validation.error || 'File validation failed', 'VALIDATION_ERROR')
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileExtension = file.name.split('.').pop()
    const fileName = `${timestamp}-${randomString}.${fileExtension}`
    const filePath = `${folder}/${fileName}`

    // Upload file
    const { data, error } = await supabaseAdmin.storage
      .from('files')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      logError('Error uploading file', error, { filePath })
      throw new ServiceException('Failed to upload file', 'STORAGE_UPLOAD_ERROR')
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('files')
      .getPublicUrl(filePath)

    return {
      url: urlData.publicUrl,
      path: filePath,
      size: file.size,
      type: file.type,
    }
  }

  /**
   * Deletes a file from storage
   */
  async deleteFile(path: string): Promise<void> {
    const { error } = await supabaseAdmin.storage
      .from('files')
      .remove([path])

    if (error) {
      logError('Error deleting file', error, { path })
      throw new ServiceException('Failed to delete file', 'STORAGE_DELETE_ERROR')
    }
  }

  /**
   * Gets a public URL for a file
   */
  getFileUrl(path: string): string {
    const { data } = supabaseAdmin.storage
      .from('files')
      .getPublicUrl(path)

    return data.publicUrl
  }

  /**
   * Gets a signed URL for a private file
   */
  async getSignedUrl(path: string, expiresIn: number = 3600): Promise<string> {
    const { data, error } = await supabaseAdmin.storage
      .from('files')
      .createSignedUrl(path, expiresIn)

    if (error) {
      logError('Error getting signed URL', error, { path, expiresIn })
      throw new ServiceException('Failed to get signed URL', 'STORAGE_SIGNED_URL_ERROR')
    }

    return data.signedUrl
  }

  /**
   * Lists files in a folder
   */
  async listFiles(folder: string, limit: number = 100): Promise<string[]> {
    const { data, error } = await supabaseAdmin.storage
      .from('files')
      .list(folder, {
        limit,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' },
      })

    if (error) {
      logError('Error listing files', error, { folder, limit })
      throw new ServiceException('Failed to list files', 'STORAGE_LIST_ERROR')
    }

    return data?.map((file: { name: string }) => `${folder}/${file.name}`) || []
  }
}

// Export singleton instance
export const storageService = new StorageService()
