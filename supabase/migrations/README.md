# Database Migrations

هذا المجلد يحتوي على ملفات SQL migrations لإنشاء وتحديث جداول قاعدة البيانات.

## الملفات المتوفرة

### 1. `001_create_users_table.sql`
ينشئ جدول `users` لإدارة المستخدمين في لوحة التحكم:
- الحقول: id, name, email, phone, role, password_hash, last_login, created_at, updated_at
- Indexes على email, role, phone
- Trigger لتحديث updated_at تلقائياً

### 2. `002_create_knowledge_base_table.sql`
ينشئ جدول `knowledge_base` لإدارة قاعدة المعرفة:
- الحقول: id, title, content, category, tags, views, created_at, updated_at
- Indexes على category, created_at, tags (GIN index)
- Trigger لتحديث updated_at تلقائياً

### 3. `003_update_content_items_table.sql`
يحدث جدول `content_items` لإضافة الحقول المطلوبة:
- إضافة: description, author, views, updated_at
- Indexes على type, status, category, created_at
- Trigger لتحديث updated_at تلقائياً

## كيفية التطبيق

### الطريقة 1: استخدام Supabase SQL Editor (موصى بها)

1. افتح Supabase Dashboard
2. اذهب إلى SQL Editor
3. انسخ محتوى الملفات واحداً تلو الآخر
4. نفذ كل ملف على حدة

### الطريقة 2: استخدام ملف complete_schema.sql

الملف `../complete_schema.sql` يحتوي على جميع الجداول في ملف واحد:
- يشمل جميع الجداول المطلوبة
- يشمل Indexes و Triggers
- يشمل RLS Policies
- يشمل Seed Data

**ملاحظة:** إذا كان لديك بيانات موجودة، استخدم الملفات الفردية بدلاً من complete_schema.sql

## التحقق من التطبيق

بعد تطبيق الـ migrations، تحقق من:

```sql
-- التحقق من وجود الجداول
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'knowledge_base', 'content_items')
ORDER BY table_name;

-- التحقق من Indexes
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename IN ('users', 'knowledge_base', 'content_items');

-- التحقق من Triggers
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE event_object_table IN ('users', 'knowledge_base', 'content_items');
```

## الترتيب الموصى به

1. `001_create_users_table.sql`
2. `002_create_knowledge_base_table.sql`
3. `003_update_content_items_table.sql`

## ملاحظات مهمة

- جميع الجداول تستخدم `IF NOT EXISTS` لتجنب الأخطاء
- Indexes تستخدم `IF NOT EXISTS` لتجنب التكرار
- Triggers تستخدم `CREATE OR REPLACE` للتحديث الآمن
- RLS (Row Level Security) مفعل على جميع الجداول

