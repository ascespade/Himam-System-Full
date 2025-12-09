/**
 * Toast Notification Utility
 * Client-side toast notifications (fallback when sonner is not installed)
 */

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface ToastOptions {
  duration?: number
}

/**
 * Toast utility - provides a consistent interface
 * In production, this should be replaced with sonner
 */
class ToastService {
  private showToast(type: ToastType, message: string, options?: ToastOptions): void {
    // In development, use console for feedback
    if (process.env.NODE_ENV === 'development') {
      const emoji = {
        success: '✅',
        error: '❌',
        info: 'ℹ️',
        warning: '⚠️',
      }[type]

      console.log(`${emoji} [${type.toUpperCase()}] ${message}`)
    }

    // In production, you can integrate with a toast library like sonner
    // For now, we'll use a simple browser notification if available
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(message, {
        icon: '/favicon.ico',
        tag: type,
      })
    }
  }

  success(message: string, options?: ToastOptions): void {
    this.showToast('success', message, options)
  }

  error(message: string, options?: ToastOptions): void {
    this.showToast('error', message, options)
  }

  info(message: string, options?: ToastOptions): void {
    this.showToast('info', message, options)
  }

  warning(message: string, options?: ToastOptions): void {
    this.showToast('warning', message, options)
  }
}

// Export singleton instance
export const toast = new ToastService()

// Export convenience functions
export const toastSuccess = (message: string, options?: ToastOptions) => toast.success(message, options)
export const toastError = (message: string, options?: ToastOptions) => toast.error(message, options)
export const toastInfo = (message: string, options?: ToastOptions) => toast.info(message, options)
export const toastWarning = (message: string, options?: ToastOptions) => toast.warning(message, options)
