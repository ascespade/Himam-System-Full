// Centralized utility functions

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export function formatTime(date: string | Date): string {
  return new Date(date).toLocaleTimeString('ar-SA', {
    hour: '2-digit',
    minute: '2-digit'
  })
}


