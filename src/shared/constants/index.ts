/**
 * Centralized Constants
 * All application-wide constants and configuration values
 */

// ============================================================================
// Application Constants
// ============================================================================

export const APP_NAME = 'مركز الهمم'
export const APP_DESCRIPTION = 'رعاية طبية متخصصة في جدة'
export const APP_VERSION = '2.0.0'

// ============================================================================
// API Constants
// ============================================================================

export const API_ROUTES = {
  AI: '/api/ai',
  BILLING: '/api/billing',
  CALENDAR: '/api/calendar',
  CRM: '/api/crm',
  PATIENTS: '/api/patients',
  SETTINGS: '/api/settings',
  SIGNATURE: '/api/signature',
  WHATSAPP: '/api/whatsapp',
} as const

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const

// ============================================================================
// Navigation Constants
// ============================================================================

export const NAV_LINKS = [
  { href: '/', label: 'الرئيسية' },
  { href: '/patients', label: 'المرضى' },
  { href: '/dashboard/admin', label: 'لوحة التحكم' },
  { href: '/settings', label: 'الإعدادات' },
  { href: '/sign', label: 'التوقيع الإلكتروني' },
] as const

// ============================================================================
// Service Constants
// ============================================================================

export const SERVICES = [
  {
    id: 'booking',
    title: 'حجز المواعيد',
    description: 'احجز موعدك بسهولة مع أي من أخصائينا',
    icon: 'calendar',
  },
  {
    id: 'communication',
    title: 'التواصل الآمن',
    description: 'تواصل مباشر وآمن مع أخصائيك عبر واتساب',
    icon: 'message',
  },
  {
    id: 'ai-assistant',
    title: 'المساعد الذكي',
    description: 'مساعدة ذكية مدعومة بالذكاء الاصطناعي',
    icon: 'sparkles',
  },
] as const

// ============================================================================
// Status Constants
// ============================================================================

export const APPOINTMENT_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const

export const LOADING_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
} as const

// ============================================================================
// Settings Categories
// ============================================================================

export const SETTINGS_CATEGORIES = {
  AI: ['GEMINI_KEY', 'OPENAI_KEY'],
  WHATSAPP: ['WHATSAPP_TOKEN', 'WHATSAPP_PHONE_NUMBER_ID', 'WHATSAPP_VERIFY_TOKEN'],
  GOOGLE: ['GOOGLE_CLIENT_EMAIL', 'GOOGLE_PRIVATE_KEY', 'GOOGLE_CALENDAR_ID'],
  CRM: ['CRM_URL', 'CRM_TOKEN'],
} as const

// ============================================================================
// Validation Constants
// ============================================================================

export const VALIDATION = {
  PHONE_REGEX: /^(\+966|0)?5\d{8}$/,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  MIN_PASSWORD_LENGTH: 8,
  MAX_NAME_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 500,
} as const

// ============================================================================
// Date/Time Constants
// ============================================================================

export const DATE_FORMATS = {
  DISPLAY: 'ar-SA',
  ISO: 'en-US',
  TIME: {
    hour: '2-digit',
    minute: '2-digit',
  },
  DATE: {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  },
} as const

// ============================================================================
// Error Messages
// ============================================================================

export const ERROR_MESSAGES = {
  REQUIRED: 'هذا الحقل مطلوب',
  INVALID_EMAIL: 'البريد الإلكتروني غير صحيح',
  INVALID_PHONE: 'رقم الهاتف غير صحيح',
  NETWORK_ERROR: 'خطأ في الاتصال بالشبكة',
  UNAUTHORIZED: 'غير مصرح لك بالوصول',
  NOT_FOUND: 'الصفحة غير موجودة',
  SERVER_ERROR: 'خطأ في الخادم',
  UNKNOWN_ERROR: 'حدث خطأ غير متوقع',
} as const

// ============================================================================
// Success Messages
// ============================================================================

export const SUCCESS_MESSAGES = {
  SAVED: 'تم الحفظ بنجاح',
  UPDATED: 'تم التحديث بنجاح',
  DELETED: 'تم الحذف بنجاح',
  CREATED: 'تم الإنشاء بنجاح',
  SENT: 'تم الإرسال بنجاح',
} as const

// ============================================================================
// Storage Keys
// ============================================================================

export const STORAGE_KEYS = {
  THEME: 'theme',
  LANGUAGE: 'language',
  USER_PREFERENCES: 'userPreferences',
} as const
