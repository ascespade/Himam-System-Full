# 📘 دليل الاستيرادات المركزية

## ✅ ما تم إنجازه

تم إنشاء نظام مركزي للاستيرادات (Centralized Imports) باستخدام **Barrel Exports** لتسهيل الاستيراد وتجنب أخطاء المسارات.

## 🏗️ البنية الجديدة

### 1. Barrel Exports (index.ts files)

تم إنشاء ملفات `index.ts` في كل مجلد رئيسي لتصدير جميع الوحدات:

```
src/
├── lib/
│   ├── index.ts          ← Centralized exports
│   └── supabase.ts
├── infrastructure/
│   └── supabase/
│       └── repositories/
│           ├── index.ts  ← Centralized exports
│           └── *.repository.ts
└── shared/
    ├── index.ts          ← Centralized exports
    ├── constants/
    ├── types/
    ├── utils/
    └── components/
        ├── index.ts
        └── ui/
            ├── index.ts
            └── Button.tsx
```

### 2. tsconfig.json Paths

تم تحديث `tsconfig.json` لدعم المسارات المركزية:

```json
{
  "paths": {
    "@/*": ["./*"],
    "@/lib": ["./src/lib"],
    "@/lib/*": ["./src/lib/*"],
    "@/infrastructure/*": ["./src/infrastructure/*"],
    "@/shared": ["./src/shared"],
    "@/shared/*": ["./src/shared/*"],
    "@/components/*": ["./components/*"],
    "@/app/*": ["./app/*"]
  }
}
```

## 📝 كيفية الاستخدام

### قبل (❌ مشاكل):

```typescript
// ❌ مسارات طويلة ومعقدة
import { supabase } from '@/src/lib/supabase'
import { whatsappSettingsRepository } from '@/src/infrastructure/supabase/repositories/whatsapp-settings.repository'
import { NAV_LINKS } from '@/src/shared/constants/index'
```

### بعد (✅ نظيف ومركزي):

```typescript
// ✅ استيراد مركزي بسيط
import { supabase, supabaseAdmin } from '@/lib'
import { whatsappSettingsRepository, centerInfoRepository } from '@/infrastructure/supabase/repositories'
import { NAV_LINKS, SERVICES, Specialist, cn, formatDate } from '@/shared'
```

## 📚 أمثلة الاستيراد

### 1. Supabase Client

```typescript
// ✅ صحيح
import { supabase, supabaseAdmin } from '@/lib'

// ❌ خطأ (قد لا يعمل في Vercel)
import { supabase } from '@/src/lib/supabase'
```

### 2. Repositories

```typescript
// ✅ صحيح
import { 
  whatsappSettingsRepository,
  centerInfoRepository,
  servicesRepository 
} from '@/infrastructure/supabase/repositories'

// ❌ خطأ
import { whatsappSettingsRepository } from '@/src/infrastructure/supabase/repositories/whatsapp-settings.repository'
```

### 3. Shared Utilities

```typescript
// ✅ صحيح
import { NAV_LINKS, SERVICES, Specialist, cn, formatDate } from '@/shared'

// ❌ خطأ
import { NAV_LINKS } from '@/src/shared/constants/index'
import { Specialist } from '@/src/shared/types'
import { cn } from '@/src/shared/utils'
```

### 4. UI Components

```typescript
// ✅ صحيح
import { Button } from '@/shared'
// أو
import Button from '@/shared/components/ui/Button'

// ❌ خطأ
import Button from '@/src/shared/components/ui/Button'
```

## 🔧 الملفات المركزية

### `src/lib/index.ts`
```typescript
export { supabase, supabaseAdmin } from './supabase'
```

### `src/infrastructure/supabase/repositories/index.ts`
```typescript
export { whatsappSettingsRepository } from './whatsapp-settings.repository'
export { centerInfoRepository } from './center-info.repository'
export { servicesRepository } from './services.repository'
// ... جميع repositories
```

### `src/shared/index.ts`
```typescript
export * from './constants'
export * from './types'
export * from './utils'
export * from './components'
```

## ✅ الفوائد

1. **استيرادات بسيطة**: مسارات أقصر وأسهل
2. **مركزية**: نقطة واحدة للتصدير
3. **سهولة الصيانة**: تغيير مسار واحد يؤثر على الجميع
4. **توافق Vercel**: يعمل بشكل صحيح في Vercel builds
5. **TypeScript Support**: دعم كامل للـ types
6. **Tree Shaking**: Next.js يحذف الكود غير المستخدم

## 📋 Checklist للاستيرادات

عند إضافة ملف جديد:

- [ ] ✅ أضف export في `index.ts` المناسب
- [ ] ✅ استخدم المسارات المركزية (`@/lib`, `@/shared`, إلخ)
- [ ] ✅ تجنب `@/src/...` في الاستيرادات
- [ ] ✅ اختبر البناء محلياً: `npm run build`

## 🚫 ما يجب تجنبه

```typescript
// ❌ لا تستخدم
import { supabase } from '@/src/lib/supabase'
import { NAV_LINKS } from '@/src/shared/constants/index'
import { whatsappSettingsRepository } from '@/src/infrastructure/supabase/repositories/whatsapp-settings.repository'

// ✅ استخدم بدلاً من ذلك
import { supabase } from '@/lib'
import { NAV_LINKS } from '@/shared'
import { whatsappSettingsRepository } from '@/infrastructure/supabase/repositories'
```

## 🔍 التحقق من الاستيرادات

```bash
# البحث عن استيرادات قديمة
grep -r "@/src/" --include="*.ts" --include="*.tsx"

# يجب أن لا تجد أي نتائج!
```

## 📝 ملاحظات مهمة

1. **Vercel Build**: النظام الجديد يعمل بشكل صحيح في Vercel
2. **TypeScript**: جميع المسارات مدعومة بالكامل
3. **Next.js**: متوافق مع Next.js 14
4. **Backward Compatibility**: الملفات القديمة لا تزال تعمل لكن يجب تحديثها

## 🎯 الخطوات التالية

عند إضافة ملف جديد:

1. أنشئ الملف في المكان المناسب
2. أضف export في `index.ts` المناسب
3. استخدم المسار المركزي في الاستيراد
4. اختبر البناء: `npm run build`

---

**تم التحديث**: 2025-12-06
**الحالة**: ✅ جميع الملفات محدثة
**البناء**: ✅ ناجح


