# 🎯 دليل إعداد نظام Vector Embeddings للتأمين

## نظرة عامة

تم إضافة نظام Vector Embeddings لتطوير عملية التعلم وتفادي تكرار الأخطاء في مطالبات التأمين. يستخدم النظام OpenAI embeddings و pgvector extension في Supabase للبحث عن المطالبات المشابهة.

## المميزات

1. **البحث عن المطالبات المشابهة**: استخدام vector similarity للعثور على مطالبات مرفوضة سابقاً مشابهة
2. **تحليل الأنماط الناجحة**: التعرف على الأنماط التي نجحت سابقاً
3. **تحذيرات تلقائية**: تحذير عند وجود مطالبة مشابهة لمطالبة مرفوضة
4. **توصيات ذكية**: اقتراحات لتحسين المطالبة بناءً على الخبرات السابقة
5. **تعلم مستمر**: حفظ كل مطالبة (نجحت أو فشلت) للتعلم المستقبلي

## الخطوات المطلوبة

### 1. تفعيل pgvector Extension في Supabase

1. اذهب إلى Supabase Dashboard → SQL Editor
2. نفذ الكود التالي:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

3. تأكد من التفعيل:

```sql
SELECT * FROM pg_extension WHERE extname = 'vector';
```

### 2. تطبيق Migration

قم بتطبيق ملف `supabase/migrations/create_insurance_vectors.sql`:

```sql
-- في Supabase SQL Editor، انسخ محتوى الملف وأعد تشغيله
```

### 3. التحقق من الجداول

```sql
-- التحقق من وجود الجداول
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('insurance_claim_embeddings', 'insurance_pattern_embeddings');

-- التحقق من Indexes
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename IN ('insurance_claim_embeddings', 'insurance_pattern_embeddings');
```

### 4. التحقق من Functions

```sql
-- التحقق من وجود الدوال
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname IN ('find_similar_rejected_claims', 'find_similar_successful_patterns');
```

## كيفية العمل

### عند إرسال مطالبة جديدة:

1. يتم إنشاء embedding للوصف باستخدام OpenAI
2. البحث عن مطالبات مرفوضة مشابهة (>75% تشابه)
3. البحث عن أنماط ناجحة مشابهة
4. تحليل النتائج وإظهار التحذيرات والتوصيات
5. تحسين الوصف بناءً على النتائج
6. إرسال المطالبة بعد التحقق

### عند تحديث حالة المطالبة:

1. إذا تمت الموافقة: حفظ كـ success pattern
2. إذا تم الرفض: حفظ rejection reason embedding
3. استخراج error patterns وحفظها

## APIs المتاحة

### 1. فحص التشابه
```
POST /api/doctor/insurance/ai-agent/embeddings/check-similarity
Body: {
  claim_description: string,
  insurance_provider: string,
  claim_type: string
}
```

### 2. حفظ Embedding
```
PUT /api/doctor/insurance/ai-agent/embeddings/store
Body: {
  claim_id: string,
  claim_description: string,
  insurance_provider: string,
  claim_type: string,
  outcome: 'pending' | 'approved' | 'rejected',
  rejection_reason?: string,
  error_patterns?: string[]
}
```

### 3. حالة النظام
```
GET /api/doctor/insurance/ai-agent/embeddings/status
```

## متطلبات البيئة

- OpenAI API Key (في `.env`):
```
OPENAI_API_KEY=your_api_key_here
```

- Supabase مع pgvector extension مفعّل

## ملاحظات مهمة

1. **الأول مرة**: عند أول استخدام، قد لا توجد بيانات للبحث فيها. سيتم بناء قاعدة البيانات تدريجياً مع كل مطالبة.

2. **الأخطاء**: إذا فشل vector search (مثلاً لأن pgvector غير مفعّل)، سيستمر النظام بالعمل لكن بدون تحليل الفيكتورز.

3. **التكلفة**: كل مطالبة تحتاج لـ 1-3 API calls لـ OpenAI (لإنشاء embeddings). تأكد من وجود رصيد كافي.

4. **الأداء**: Vector similarity search سريع جداً مع الـ indexes الصحيحة. يجب أن يكون البحث <100ms حتى مع آلاف المطالبات.

## التحقق من العمل

بعد التطبيق، يمكنك:

1. إنشاء مطالبة جديدة
2. التحقق من الصفحة `/dashboard/doctor/insurance/ai-agent`
3. يجب أن ترى "نظام الفيكتورز مفعّل" في الأعلى
4. عند إرسال مطالبة، ستظهر التحذيرات والتوصيات من النظام

## Troubleshooting

### المشكلة: "pgvector extension not found"
**الحل**: نفذ `CREATE EXTENSION vector;` في Supabase SQL Editor

### المشكلة: "Table does not exist"
**الحل**: تأكد من تطبيق migration `create_insurance_vectors.sql`

### المشكلة: "Function does not exist"
**الحل**: تأكد من أن migration تم تشغيله بالكامل، بما في ذلك إنشاء الدوال

### المشكلة: "OpenAI API error"
**الحل**: تأكد من صحة `OPENAI_API_KEY` في `.env` وأن لديك رصيد كافي

---

**تم الإنشاء**: 2025-01-17  
**الإصدار**: 1.0  
**الحالة**: ✅ جاهز للاستخدام

