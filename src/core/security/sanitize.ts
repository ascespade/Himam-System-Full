/**
 * Input Sanitization Utilities
 * Provides XSS protection and input cleaning
 */

import DOMPurify from 'isomorphic-dompurify'
import { logWarn } from '@/shared/utils/logger'

/**
 * Sanitize HTML content
 * Removes dangerous scripts and tags while preserving safe formatting
 */
export function sanitizeHtml(dirty: string): string {
  try {
    return DOMPurify.sanitize(dirty, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
      ALLOWED_ATTR: ['href', 'target', 'rel'],
      ALLOW_DATA_ATTR: false,
    })
  } catch (error) {
    logWarn('HTML sanitization failed', { error, input: dirty.substring(0, 100) })
    // Return empty string on error to be safe
    return ''
  }
}

/**
 * Sanitize plain text input
 * Removes potentially dangerous characters and scripts
 */
export function sanitizeText(input: string): string {
  if (typeof input !== 'string') {
    return ''
  }

  try {
    return input
      // Remove script tags
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      // Remove javascript: protocol
      .replace(/javascript:/gi, '')
      // Remove data: protocol (can contain scripts)
      .replace(/data:text\/html/gi, '')
      // Remove on* event handlers
      .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
      // Trim whitespace
      .trim()
  } catch (error) {
    logWarn('Text sanitization failed', { error, input: input.substring(0, 100) })
    return ''
  }
}

/**
 * Sanitize URL
 * Ensures URL is safe and doesn't contain javascript: or data: protocols
 */
export function sanitizeUrl(url: string): string {
  if (typeof url !== 'string') {
    return ''
  }

  try {
    const trimmed = url.trim().toLowerCase()

    // Block dangerous protocols
    if (
      trimmed.startsWith('javascript:') ||
      trimmed.startsWith('data:') ||
      trimmed.startsWith('vbscript:') ||
      trimmed.startsWith('file:')
    ) {
      return ''
    }

    // Allow http, https, mailto, tel
    if (
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://') ||
      trimmed.startsWith('mailto:') ||
      trimmed.startsWith('tel:')
    ) {
      return url.trim()
    }

    // If no protocol, assume relative URL (safe)
    return url.trim()
  } catch (error) {
    logWarn('URL sanitization failed', { error, url: url.substring(0, 100) })
    return ''
  }
}

/**
 * Sanitize email address
 * Removes dangerous characters while preserving valid email format
 */
export function sanitizeEmail(email: string): string {
  if (typeof email !== 'string') {
    return ''
  }

  try {
    return email
      .trim()
      .toLowerCase()
      // Remove any HTML tags
      .replace(/<[^>]*>/g, '')
      // Remove script tags
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      // Remove dangerous characters
      .replace(/[<>'"&]/g, '')
  } catch (error) {
    logWarn('Email sanitization failed', { error, email: email.substring(0, 50) })
    return ''
  }
}

/**
 * Sanitize phone number
 * Keeps only digits, +, and spaces
 */
export function sanitizePhone(phone: string): string {
  if (typeof phone !== 'string') {
    return ''
  }

  try {
    return phone
      .trim()
      // Keep only digits, +, spaces, and hyphens
      .replace(/[^\d+\s-]/g, '')
      .trim()
  } catch (error) {
    logWarn('Phone sanitization failed', { error, phone: phone.substring(0, 20) })
    return ''
  }
}
