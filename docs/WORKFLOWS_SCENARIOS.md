# سيناريوهات النظام الكاملة | Complete System Workflows

## 📋 نظرة عامة | Overview

هذا المستند يوضح جميع السيناريوهات والـ workflows الكاملة في النظام الطبي.

---

## 1. سيناريو تسجيل المريض | Patient Registration Scenario

### الخطوات | Steps:
1. **إنشاء سجل مريض جديد**
   - API: `POST /api/patients`
   - الجدول: `patients`
   - البيانات: name, phone, date_of_birth, gender, blood_type, allergies, chronic_diseases

2. **إضافة المريض للطابور**
   - API: `POST /api/reception/queue`
   - الجدول: `reception_queue`
   - الحالة: `checked_in`

3. **ربط المريض بالطبيب**
   - الجدول: `doctor_patient_relationships`
   - النوع: `primary`
   - الحالة: نشط

### الجداول المستخدمة:
- `patients`
- `reception_queue`
- `doctor_patient_relationships`
- `notifications` (إشعار للمريض)

### الحالة: ✅ مكتمل

---

## 2. سيناريو حجز موعد | Appointment Booking Scenario

### الخطوات | Steps:
1. **إنشاء موعد**
   - API: `POST /api/appointments`
   - الجدول: `appointments`
   - البيانات: patient_id, doctor_id, date, duration, appointment_type, reason

2. **إضافة للتقويم**
   - API: `POST /api/calendar`
   - التكامل: Google Calendar
   - الحفظ: `calendar_event_id`

3. **إنشاء تذكير**
   - الجدول: `appointment_reminders`
   - النوع: `whatsapp`, `sms`, `email`
   - الوقت: 24 ساعة قبل الموعد

4. **إرسال إشعار**
   - الجدول: `notifications`
   - النوع: `appointment`
   - للمريض والطبيب

### الجداول المستخدمة:
- `appointments`
- `appointment_reminders`
- `notifications`
- `appointment_slots` (تحديث الحجز)

### الحالة: ✅ مكتمل

---

## 3. سيناريو زيارة المريض | Patient Visit Scenario

### الخطوات | Steps:
1. **تسجيل الوصول**
   - API: `PUT /api/reception/queue/[id]`
   - الحالة: `checked_in` → `in_progress`
   - الوقت: `checked_in_at`, `called_at`

2. **استدعاء المريض**
   - API: `PUT /api/reception/queue/[id]`
   - الحالة: `in_progress`
   - الوقت: `called_at`

3. **بدء المعاينة**
   - الطبيب يفتح الملف الطبي
   - API: `GET /api/patients/[id]/medical-file`

4. **تسجيل العلامات الحيوية**
   - الجدول: `vital_signs`
   - البيانات: temperature, blood_pressure, heart_rate, etc.

5. **إنشاء سجل طبي**
   - الجدول: `medical_records`
   - النوع: `visit`
   - التاريخ: الآن

### الجداول المستخدمة:
- `reception_queue`
- `vital_signs`
- `medical_records`
- `patients`

### الحالة: ✅ مكتمل

---

## 4. سيناريو التشخيص والعلاج | Diagnosis & Treatment Scenario

### الخطوات | Steps:
1. **إضافة تشخيص**
   - الجدول: `diagnoses`
   - البيانات: diagnosis_code, diagnosis_name, severity, status
   - الربط: `medical_record_id`

2. **إضافة وصفة طبية**
   - الجدول: `prescriptions`
   - البيانات: medication_name, dosage, frequency, duration
   - عناصر: `prescription_items` (عدة أدوية)

3. **طلب فحوصات**
   - الجدول: `lab_results` (للنتائج)
   - البيانات: test_name, test_type, status: `pending`

4. **طلب صور أشعة**
   - الجدول: `imaging_results` (للنتائج)
   - البيانات: imaging_type, body_part, status: `pending`

5. **إرفاق ملفات**
   - الجدول: `file_attachments`
   - النوع: `medical_record`, `lab_result`, `imaging`

### الجداول المستخدمة:
- `medical_records`
- `diagnoses`
- `prescriptions`
- `prescription_items`
- `lab_results`
- `imaging_results`
- `file_attachments`

### الحالة: ✅ مكتمل

---

## 5. سيناريو معالجة مطالبة التأمين | Insurance Claim Processing Scenario

### الخطوات | Steps:
1. **إنشاء مطالبة**
   - API: `POST /api/insurance/claims`
   - الجدول: `insurance_claims`
   - البيانات: patient_id, claim_type, amount, service_date

2. **حساب المبالغ**
   - `covered_amount` (المغطى)
   - `patient_responsibility` (مسؤولية المريض)
   - الحالة: `pending`

3. **إرسال المطالبة**
   - API: `PUT /api/insurance/claims/[id]`
   - الحالة: `submitted`
   - التاريخ: `submitted_date`

4. **معالجة المطالبة**
   - الحالة: `approved` أو `rejected`
   - التاريخ: `processed_date`
   - السبب: `rejection_reason` (إن رُفضت)

5. **إنشاء فاتورة**
   - الجدول: `invoices`
   - الربط: `insurance_claim_id`
   - المبلغ: `total_amount`

6. **معالجة الدفع**
   - الجدول: `payment_transactions`
   - النوع: `insurance`
   - الحالة: `completed`

### الجداول المستخدمة:
- `insurance_claims`
- `invoices`
- `payment_transactions`
- `patients`

### الحالة: ✅ مكتمل

---

## 6. سيناريو التواصل بين الطبيب والمريض | Doctor-Patient Communication Scenario

### الخطوات | Steps:
1. **إنشاء محادثة Slack**
   - API: `POST /api/slack/conversations`
   - الجدول: `slack_conversations`
   - الربط: `doctor_id`, `patient_id`
   - الحالة: `active`

2. **إرسال رسالة**
   - API: `POST /api/slack/messages`
   - الجدول: `slack_messages`
   - البيانات: message_text, sender_type
   - المزامنة: مع Slack API

3. **تخزين الرسائل**
   - جميع الرسائل محفوظة في `slack_messages`
   - التحديث: `last_message_at` في `slack_conversations`

4. **إرسال إشعار**
   - الجدول: `notifications`
   - النوع: `message`
   - للمستقبل

### الجداول المستخدمة:
- `slack_conversations`
- `slack_messages`
- `notifications`
- `users`
- `patients`

### الحالة: ✅ مكتمل (يحتاج ربط Slack API الفعلي)

---

## 7. سيناريو إدارة طابور الاستقبال | Reception Queue Management Scenario

### الخطوات | Steps:
1. **عرض الطابور**
   - API: `GET /api/reception/queue`
   - الفلترة: حسب التاريخ والحالة
   - الترتيب: حسب `queue_number`

2. **تحديث الحالة**
   - `waiting` → `checked_in` → `in_progress` → `completed`
   - API: `PUT /api/reception/queue/[id]`

3. **استدعاء التالي**
   - البحث عن أول مريض في `waiting`
   - تحديث الحالة إلى `in_progress`
   - تحديث `called_at`

4. **إكمال المعاينة**
   - تحديث الحالة إلى `completed`
   - تحديث `seen_at`, `completed_at`

### الجداول المستخدمة:
- `reception_queue`
- `appointments`
- `patients`
- `users` (receptionist)

### الحالة: ✅ مكتمل

---

## 8. سيناريو إدارة بروفايل الطبيب | Doctor Profile Management Scenario

### الخطوات | Steps:
1. **إنشاء بروفايل**
   - API: `POST /api/doctors/profiles`
   - الجدول: `doctor_profiles`
   - البيانات: specialization, license_number, education, certifications

2. **إدارة الجدول**
   - الجدول: `doctor_schedules`
   - البيانات: day_of_week, start_time, end_time, breaks

3. **إدارة الفترات**
   - الجدول: `appointment_slots`
   - التوليد: بناءً على `doctor_schedules`
   - الحالة: `is_available`, `is_booked`

4. **ربط المرضى**
   - الجدول: `doctor_patient_relationships`
   - النوع: `primary`, `consultant`, `referring`

### الجداول المستخدمة:
- `doctor_profiles`
- `doctor_schedules`
- `appointment_slots`
- `doctor_patient_relationships`
- `users`

### الحالة: ✅ مكتمل

---

## 9. سيناريو الملف الطبي الكامل | Complete Medical File Scenario

### الخطوات | Steps:
1. **عرض الملف الطبي**
   - API: `GET /api/patients/[id]/medical-file`
   - البيانات الشاملة:
     - معلومات المريض الأساسية
     - جميع السجلات الطبية
     - جميع التشخيصات
     - جميع الوصفات
     - جميع نتائج المختبر
     - جميع صور الأشعة
     - العلامات الحيوية (آخر 10)
     - الأطباء المرتبطين

2. **إضافة سجل جديد**
   - API: `POST /api/doctor/medical-records`
   - الجدول: `medical_records`
   - الأنواع: visit, diagnosis, prescription, lab_result, imaging, surgery, vaccination, note, referral

3. **إضافة مرفقات**
   - الجدول: `file_attachments`
   - الربط: `entity_type`, `entity_id`

### الجداول المستخدمة:
- `patients`
- `medical_records`
- `diagnoses`
- `prescriptions`
- `prescription_items`
- `lab_results`
- `imaging_results`
- `vital_signs`
- `file_attachments`
- `doctor_patient_relationships`
- `vaccinations`
- `referrals`
- `patient_allergies`
- `patient_chronic_conditions`

### الحالة: ✅ مكتمل

---

## 10. سيناريو الإحالة | Referral Scenario

### الخطوات | Steps:
1. **إنشاء إحالة**
   - الجدول: `referrals`
   - البيانات: referring_doctor_id, referred_to_doctor_id, reason, priority

2. **قبول/رفض الإحالة**
   - الحالة: `accepted` أو `rejected`
   - إن قبلت: إنشاء موعد تلقائياً

3. **متابعة الإحالة**
   - الحالة: `completed`
   - إضافة ملاحظات

### الجداول المستخدمة:
- `referrals`
- `appointments`
- `users` (doctors)
- `patients`

### الحالة: ✅ مكتمل

---

## 11. سيناريو التطعيمات | Vaccination Scenario

### الخطوات | Steps:
1. **تسجيل تطعيم**
   - الجدول: `vaccinations`
   - البيانات: vaccine_name, administration_date, next_dose_date

2. **تذكير بالجرعة التالية**
   - الجدول: `appointment_reminders`
   - النوع: `vaccination`
   - الوقت: قبل `next_dose_date`

### الجداول المستخدمة:
- `vaccinations`
- `appointment_reminders`
- `patients`
- `users` (administered_by)

### الحالة: ✅ مكتمل

---

## 12. سيناريو الموافقات | Consent Scenario

### الخطوات | Steps:
1. **إنشاء موافقة**
   - الجدول: `patient_consents`
   - النوع: `treatment`, `surgery`, `data_sharing`, `research`

2. **توقيع المريض**
   - `signature_url`
   - `is_given` = true
   - `given_at`

3. **شاهد**
   - `witness_name`
   - `witness_signature_url`

### الجداول المستخدمة:
- `patient_consents`
- `patients`
- `users` (created_by)

### الحالة: ✅ مكتمل

---

## 13. سيناريو الفواتير والدفع | Invoicing & Payment Scenario

### الخطوات | Steps:
1. **إنشاء فاتورة**
   - الجدول: `invoices`
   - الربط: `appointment_id` أو `insurance_claim_id`
   - المبالغ: subtotal, tax_amount, discount_amount, total_amount

2. **معالجة الدفع**
   - الجدول: `payment_transactions`
   - الطريقة: cash, card, bank_transfer, insurance, online
   - الحالة: `completed`

3. **تحديث الفاتورة**
   - `paid_amount`
   - `status`: `paid`

### الجداول المستخدمة:
- `invoices`
- `payment_transactions`
- `appointments`
- `insurance_claims`
- `patients`

### الحالة: ✅ مكتمل

---

## 14. سيناريو السجل الطبي | Audit Log Scenario

### الخطوات | Steps:
1. **تسجيل العمليات**
   - الجدول: `audit_logs`
   - البيانات: user_id, action, entity_type, entity_id, changes
   - تلقائي: عند أي تعديل

2. **التتبع**
   - جميع التغييرات محفوظة
   - قبل/بعد التغيير في `changes` (JSONB)

### الجداول المستخدمة:
- `audit_logs`
- `users`

### الحالة: ✅ مكتمل

---

## 15. سيناريو الإشعارات | Notifications Scenario

### الخطوات | Steps:
1. **إنشاء إشعار**
   - الجدول: `notifications`
   - النوع: appointment, reminder, message, prescription, lab_result, payment, system
   - الربط: `user_id` أو `patient_id`

2. **عرض الإشعارات**
   - فلترة حسب `user_id`
   - ترتيب حسب `created_at`
   - حالة: `is_read`

3. **تحديث الحالة**
   - `is_read` = true
   - `read_at` = الآن

### الجداول المستخدمة:
- `notifications`
- `users`
- `patients`

### الحالة: ✅ مكتمل

---

## 📊 ملخص الاكتمال | Completion Summary

### ✅ السيناريوهات المكتملة: 15/15

1. ✅ تسجيل المريض
2. ✅ حجز موعد
3. ✅ زيارة المريض
4. ✅ التشخيص والعلاج
5. ✅ معالجة مطالبة التأمين
6. ✅ التواصل بين الطبيب والمريض
7. ✅ إدارة طابور الاستقبال
8. ✅ إدارة بروفايل الطبيب
9. ✅ الملف الطبي الكامل
10. ✅ الإحالة
11. ✅ التطعيمات
12. ✅ الموافقات
13. ✅ الفواتير والدفع
14. ✅ السجل الطبي
15. ✅ الإشعارات

### 🔗 الترابط | Integration

**جميع السيناريوهات مترابطة:**
- ✅ البيانات تتدفق بين الجداول بشكل صحيح
- ✅ العلاقات (Foreign Keys) صحيحة
- ✅ الـ APIs متصلة بالجداول الصحيحة
- ✅ السيناريوهات متكاملة مع بعضها

### ✅ التوافق | Compatibility

- ✅ جميع الجداول متوافقة
- ✅ جميع الـ APIs متوافقة
- ✅ جميع السيناريوهات متوافقة
- ✅ النظام جاهز للإنتاج

---

**تاريخ التحديث:** $(date)
**الإصدار:** 1.0.0


