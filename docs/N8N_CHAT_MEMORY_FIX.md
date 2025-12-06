# إصلاح n8n Chat Memory Node

## 🔴 المشكلة

n8n Chat Memory node يتوقع عمود `message` في جدول `conversation_history`، لكن الجدول يحتوي على:
- `user_message` (ليس `message`)
- `ai_response`

## ✅ الحل

تم إضافة عمود `message` إلى الجدول وإنشاء trigger لمزامنة `message` مع `user_message`.

### البنية الجديدة للجدول:

```sql
conversation_history:
  - id (uuid)
  - session_id (text)
  - user_phone (text)
  - user_message (text)  -- الرسالة الأصلية من المستخدم
  - message (text)       -- NEW: للتوافق مع n8n
  - ai_response (text)
  - metadata (jsonb)
  - created_at (timestamp)
```

### Trigger:

عند إدراج أو تحديث سجل:
- إذا تم تعيين `message` فقط → يتم نسخه إلى `user_message`
- إذا تم تعيين `user_message` فقط → يتم نسخه إلى `message`
- يضمن التوافق مع n8n والكود الحالي

## 📋 إعدادات n8n Chat Memory Node

### Configuration:

1. **Credential**: Postgres account (Supabase)
2. **Session ID**: `{{ $json.sessionId }}` أو `{{ $json.user_phone }}`
3. **Key**: `{{ $json.sessionId }}` أو `default-session`
4. **Table Name**: `conversation_history`
5. **Context Window Length**: `5` (أو حسب الحاجة)

### Column Mapping:

n8n Chat Memory node يتوقع:
- `message` - ✅ موجود الآن
- `session_id` - ✅ موجود
- `created_at` - ✅ موجود

## ✅ Checklist

- [x] عمود `message` تم إضافته
- [x] Trigger للمزامنة تم إنشاؤه
- [x] Indexes للأداء تم إضافتها
- [x] البيانات الموجودة تم تحديثها
- [ ] n8n Chat Memory Node يعمل بدون أخطاء

## 🧪 اختبار

بعد إصلاح الجدول، جرب تفعيل n8n Workflow مرة أخرى. يجب أن يعمل Chat Memory Node الآن بدون خطأ.

---

**Workflow URL**: `https://n8n-9q4d.onrender.com/workflow/YCZ3lqYrNxWylyg3`  
**Status**: ✅ تم إصلاح الجدول

