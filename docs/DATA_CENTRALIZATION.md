# مركزية البيانات - Data Centralization

## نظرة عامة

تم تطبيق نظام مركزية شامل للبيانات في المشروع لضمان:
- **لا توجد بيانات hardcoded** - كل البيانات من قاعدة البيانات
- **لا توجد mock data** - كل البيانات حقيقية
- **لا توجد simulation** - كل العمليات حقيقية
- **منع التكرار** - Single Source of Truth

## الجداول المركزية الجديدة

### 1. `admin_contacts`
إدارة جهات اتصال المديرين للإشعارات والتنبيهات.

```sql
- id, name, phone, email
- role, is_primary
- notification_channels (array)
- is_active
```

### 2. `ai_prompt_templates`
قوالب AI prompts مركزية مع دعم لهجة جدة.

```sql
- name (unique), category
- system_prompt (with variables like {{center_phone}})
- language, dialect ('jeddah', 'riyadh', 'standard')
- variables (JSONB)
- version, is_active
```

### 3. `service_types`
أنواع الخدمات المركزية (بدلاً من hardcoded).

```sql
- code (unique), name_ar, name_en
- description_ar, description_en
- icon, color, duration_minutes
- order_index, is_active
```

### 4. `insurance_companies`
شركات التأمين المدعومة.

```sql
- code (unique), name_ar, name_en
- api_endpoint, api_config (JSONB)
- is_active
```

### 5. `working_hours`
مواعيد العمل المركزية.

```sql
- day_of_week (0-6)
- start_time, end_time (nullable for non-working days)
- is_working_day, break_start, break_end
- is_active
```

### 6. `holidays`
الإجازات الرسمية.

```sql
- name_ar, name_en
- date, is_recurring
- is_active
```

## APIs الجديدة

### `/api/system/service-types`
- `GET`: جلب أنواع الخدمات
- `POST`: إنشاء/تحديث نوع خدمة (admin only)

### `/api/system/working-hours`
- `GET`: جلب مواعيد العمل
- `POST`: تحديث مواعيد العمل (admin only)

### `/api/system/ai-prompts`
- `GET`: جلب قوالب AI prompts
- `POST`: إنشاء/تحديث قالب (admin only)

## التغييرات المطبقة

### 1. AI Prompts
- ✅ تم نقل جميع AI prompts إلى `ai_prompt_templates`
- ✅ دعم لهجة جدة الخفيفة ("أهلاً وسهلاً"، "الله يعطيك العافية"، "إن شاء الله")
- ✅ استخدام `getAIPromptTemplate()` من `src/lib/ai-prompts.ts`

### 2. WhatsApp Integration
- ✅ تم تحديث `app/api/whatsapp/route.ts` لجلب:
  - الخدمات من `service_types`
  - معلومات المركز من `center_info`
  - مواعيد العمل من `working_hours`
  - الأخصائيين من `users` + `doctor_profiles`

### 3. Admin Phone
- ✅ تم نقل رقم المدير إلى `admin_contacts`
- ✅ استخدام `getAdminPhone()` من `src/lib/ai.ts`

### 4. Auto-Documentation
- ✅ استخدام قوالب AI من قاعدة البيانات
- ✅ لهجة جدة في جميع التوثيقات

## حذف الجداول Test

تم حذف الجداول التالية (test tables):
- `test_run`
- `test_case_execution`
- `execution_annotations`
- `execution_annotation_tags`
- `annotation_tag_entity`
- `insights_metadata`
- `insights_raw`
- `insights_by_period`
- `processed_data`
- `folder`
- `folder_tag`
- `workflows_tags`
- `migrations`
- `user_api_keys`

## حذف الملفات

- ✅ `app/dashboard/admin/simulator/page.tsx` - تم حذفه (simulation)

## أفضل الممارسات

### ✅ DO
- استخدم APIs المركزية لجلب البيانات
- استخدم `getAIPromptTemplate()` للـ AI prompts
- استخدم `getAdminPhone()` لرقم المدير
- استخدم `service_types` لأنواع الخدمات
- استخدم `working_hours` لمواعيد العمل

### ❌ DON'T
- لا تستخدم hardcoded data
- لا تستخدم mock data
- لا تستخدم simulation
- لا تكرر البيانات في أكثر من مكان

## أمثلة الاستخدام

### جلب أنواع الخدمات
```typescript
const res = await fetch('/api/system/service-types')
const { data: services } = await res.json()
```

### جلب AI Prompt
```typescript
import { getAIPromptTemplate } from '@/lib/ai-prompts'

const prompt = await getAIPromptTemplate('whatsapp_assistant', {
  center_phone: '+966123456789',
  patient_name: 'محمد'
})
```

### جلب مواعيد العمل
```typescript
const res = await fetch('/api/system/working-hours')
const { data: hours } = await res.json()
```

## لهجة جدة في AI

تم تحديث جميع AI prompts لاستخدام لهجة جدة الخفيفة والودودة:
- "أهلاً وسهلاً"
- "الله يعطيك العافية"
- "إن شاء الله"
- "ما شاء الله"

يتم تطبيق هذه اللهجة بشكل طبيعي في جميع الردود.

