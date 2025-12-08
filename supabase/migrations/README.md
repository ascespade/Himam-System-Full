# Database Migrations

هذا المجلد يحتوي على ملفات الـ migrations لتطوير قاعدة البيانات.

## 📋 قواعد Migration

1. **لا تكرار**: لا ننشئ schema جديد، بل نطور الموجود
2. **IF NOT EXISTS**: نستخدم `IF NOT EXISTS` و `DO $$` لتجنب الأخطاء
3. **حذف بعد التنفيذ**: بعد تشغيل migration بنجاح، يتم حذف الملف تلقائياً

## 🚀 تشغيل Migration

### الطريقة 1: استخدام Script

```bash
./scripts/run-migration.sh [migration_file]
```

مثال:
```bash
./scripts/run-migration.sh supabase/migrations/20250117000000_enhance_reception_module.sql
```

### الطريقة 2: استخدام psql مباشرة

```bash
psql "$DATABASE_URL" -f supabase/migrations/20250117000000_enhance_reception_module.sql
```

### الطريقة 3: من Supabase Dashboard

1. افتح Supabase Dashboard
2. اذهب إلى SQL Editor
3. انسخ محتوى ملف الـ migration
4. شغّل الـ query

## ⚠️ تحذيرات

- **احتفظ بنسخة احتياطية** قبل تشغيل migration
- **اختبر على بيئة التطوير** أولاً
- **تحقق من النتائج** بعد التنفيذ

## 📝 Migration Files

### `20250117000000_enhance_reception_module.sql`
- تطوير جدول `patients` - إضافة حقول جديدة
- تطوير جدول `appointments` - ربط مع patients و doctors
- إنشاء/تطوير `reception_queue` - طابور الاستقبال
- إنشاء/تطوير `patient_visits` - زيارات المرضى
- إنشاء `patient_insurance` - تأمين المرضى
- تفعيل Realtime
- إنشاء Indexes محسّنة

## ✅ Checklist بعد Migration

- [ ] التحقق من إنشاء/تحديث جميع الجداول
- [ ] التحقق من الـ Foreign Keys
- [ ] التحقق من الـ Indexes
- [ ] التحقق من الـ RLS Policies
- [ ] التحقق من Realtime
- [ ] اختبار الـ Functions
- [ ] حذف ملف الـ migration (يتم تلقائياً)

## 🔍 التحقق من Migration

```sql
-- التحقق من الجداول
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- التحقق من الحقول المضافة
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'patients' 
ORDER BY ordinal_position;

-- التحقق من Indexes
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename, indexname;
```
