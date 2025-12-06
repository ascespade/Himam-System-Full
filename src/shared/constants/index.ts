// Centralized constants

export const SERVICES = [
  {
    id: 'booking',
    title: 'حجز المواعيد',
    description: 'احجز موعدك بسهولة مع أي من أخصائينا',
    icon: 'calendar'
  },
  {
    id: 'communication',
    title: 'التواصل الآمن',
    description: 'تواصل مباشر وآمن مع أخصائيك عبر واتساب',
    icon: 'message'
  },
  {
    id: 'ai-assistant',
    title: 'المساعد الذكي',
    description: 'مساعدة ذكية مدعومة بالذكاء الاصطناعي',
    icon: 'sparkles'
  }
] as const

export const NAV_LINKS = [
  { href: '/', label: 'الرئيسية' },
  { href: '/patients', label: 'المرضى' },
  { href: '/dashboard/admin', label: 'لوحة التحكم' },
  { href: '/dashboard/settings', label: 'الإعدادات' },
  { href: '/sign', label: 'التوقيع الإلكتروني' }
] as const


