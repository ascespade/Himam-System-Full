# 🗄️ قاعدة بيانات موديول الاستقبال - Reception Module Database

**التاريخ:** 2025-01-17  
**Migration:** `20250117000000_enhance_reception_module.sql`

---

## 📊 الجداول المطورة | Enhanced Tables

### 1. `patients` - جدول المرضى

#### الحقول المضافة:
- `email` - البريد الإلكتروني
- `date_of_birth` - تاريخ الميلاد
- `gender` - الجنس (male/female)
- `address` - العنوان
- `blood_type` - فصيلة الدم
- `allergies` - الحساسيات (array)
- `chronic_diseases` - الأمراض المزمنة (array)
- `emergency_contact_name` - اسم جهة الاتصال في الطوارئ
- `emergency_contact_phone` - رقم جهة الاتصال في الطوارئ
- `notes` - ملاحظات
- `updated_at` - تاريخ آخر تحديث

#### Indexes:
- `idx_patients_email` - على email
- `idx_patients_phone_unique` - على phone
- `idx_patients_name` - على name
- `idx_patients_status` - على status

---

### 2. `appointments` - جدول المواعيد

#### الحقول المضافة:
- `patient_id` - ربط مع patients (FK)
- `doctor_id` - ربط مع users (FK)
- `duration` - المدة بالدقائق (default: 30)
- `service_type` - نوع الخدمة
- `confirmed_at` - تاريخ التأكيد
- `cancelled_at` - تاريخ الإلغاء
- `cancellation_reason` - سبب الإلغاء

#### Status Values:
- `pending` - معلق
- `confirmed` - مؤكد
- `cancelled` - ملغي
- `completed` - مكتمل
- `no_show` - لم يحضر
- `rescheduled` - تم إعادة الجدولة

#### Indexes:
- `idx_appointments_patient_id` - على patient_id
- `idx_appointments_doctor_id` - على doctor_id
- `idx_appointments_date_status` - على date, status
- `idx_appointments_status` - على status

---

### 3. `reception_queue` - طابور الاستقبال

#### الحقول:
- `id` - UUID Primary Key
- `patient_id` - FK إلى patients
- `appointment_id` - FK إلى appointments (اختياري)
- `doctor_id` - FK إلى users (الطبيب)
- `receptionist_id` - FK إلى users (موظف الاستقبال)
- `queue_number` - رقم الطابور
- `status` - الحالة (waiting, checked_in, in_progress, completed, cancelled, no_show)
- `priority` - الأولوية (normal, urgent, vip)
- `checked_in_at` - وقت التسجيل
- `called_at` - وقت الاستدعاء
- `seen_at` - وقت المعاينة
- `completed_at` - وقت الإكمال
- `notes` - ملاحظات
- `created_at` - تاريخ الإنشاء
- `updated_at` - تاريخ آخر تحديث

#### Indexes:
- `idx_reception_queue_patient_id`
- `idx_reception_queue_appointment_id`
- `idx_reception_queue_doctor_id`
- `idx_reception_queue_receptionist_id`
- `idx_reception_queue_status_created`
- `idx_reception_queue_queue_number`
- `idx_reception_queue_date`

#### Realtime:
- ✅ مفعّل - تحديثات فورية للطابور

---

### 4. `patient_visits` - زيارات المرضى

#### الحقول:
- `id` - UUID Primary Key
- `patient_id` - FK إلى patients
- `appointment_id` - FK إلى appointments (اختياري)
- `queue_id` - FK إلى reception_queue (اختياري)
- `doctor_id` - FK إلى users (الطبيب)
- `visit_date` - تاريخ الزيارة
- `check_in_time` - وقت التسجيل
- `confirmed_to_doctor_time` - وقت التأكيد للطبيب
- `with_doctor_time` - وقت بدء الجلسة مع الطبيب
- `completed_time` - وقت إكمال الزيارة
- `status` - الحالة (pending, confirmed_to_doctor, with_doctor, completed, cancelled)
- `visit_type` - نوع الزيارة (regular, follow_up, emergency, consultation)
- `notes` - ملاحظات
- `created_at` - تاريخ الإنشاء
- `updated_at` - تاريخ آخر تحديث

#### Indexes:
- `idx_patient_visits_patient_id`
- `idx_patient_visits_appointment_id`
- `idx_patient_visits_queue_id`
- `idx_patient_visits_doctor_id`
- `idx_patient_visits_status_created`
- `idx_patient_visits_visit_date`

#### Realtime:
- ✅ مفعّل - تحديثات فورية للزيارات

---

### 5. `patient_insurance` - تأمين المرضى

#### الحقول:
- `id` - UUID Primary Key
- `patient_id` - FK إلى patients
- `provider` - شركة التأمين
- `policy_number` - رقم البوليصة
- `policy_holder_name` - اسم صاحب البوليصة
- `relationship_to_patient` - العلاقة بالمريض
- `coverage_start_date` - تاريخ بداية التغطية
- `coverage_end_date` - تاريخ نهاية التغطية
- `is_active` - نشط/غير نشط
- `notes` - ملاحظات
- `created_at` - تاريخ الإنشاء
- `updated_at` - تاريخ آخر تحديث

#### Constraints:
- `UNIQUE(patient_id, policy_number)` - منع التكرار

#### Indexes:
- `idx_patient_insurance_patient_id`
- `idx_patient_insurance_active`
- `idx_patient_insurance_provider`

---

## 🔄 Workflow Integration

### من الاستقبال للطبيب:

1. **تسجيل المريض** → `patients` table
2. **حجز موعد** → `appointments` table
3. **إضافة للطابور** → `reception_queue` table
4. **تأكيد للطبيب** → `patient_visits` table (status: confirmed_to_doctor)
5. **الطبيب يستقبل** → `patient_visits` (status: with_doctor)
6. **بدء الجلسة** → `sessions` table

---

## 🔧 Functions

### `get_next_queue_number()`
تقوم بإرجاع رقم الطابور التالي لليوم الحالي.

```sql
SELECT get_next_queue_number(); -- Returns next queue number for today
```

---

## 📝 ملاحظات مهمة

1. **RLS Policies**: جميع الجداول محمية بـ Row Level Security
2. **Realtime**: `reception_queue` و `patient_visits` مفعّل لهم Realtime
3. **Foreign Keys**: جميع العلاقات محمية بـ CASCADE/SET NULL حسب الحاجة
4. **Indexes**: تم إنشاء indexes محسّنة للاستعلامات السريعة
5. **Triggers**: `updated_at` يتم تحديثه تلقائياً

---

## ✅ Checklist بعد Migration

- [ ] التحقق من إنشاء جميع الجداول
- [ ] التحقق من الـ Indexes
- [ ] التحقق من الـ Foreign Keys
- [ ] التحقق من الـ RLS Policies
- [ ] التحقق من Realtime
- [ ] اختبار Function `get_next_queue_number()`

---

**تم إعداد الوثيقة بواسطة:** AI Assistant  
**التاريخ:** 2025-01-17
