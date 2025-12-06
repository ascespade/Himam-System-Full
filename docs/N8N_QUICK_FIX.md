# إصلاح سريع - user_phone null error

## 🔴 المشكلة

```
null value in column "user_phone" of relation "conversation_history" violates not-null constraint
```

## ✅ الحل السريع (خطوتان)

### 1. Extract Response2 Node

**المشكلة**: الكود يشير إلى `Extract Message` لكن اسم الـ node هو `Extract Message2`

**الحل**: في Function Code، غيّر هذا السطر:

```javascript
// ❌ خطأ
const extractNode = $('Extract Message');

// ✅ صحيح
const extractNode = $('Extract Message2');
```

### 2. Save Conversation2 Node

**المشكلة**: الـ node لا يحتوي على `tableId` و `columns` mapping

**الحل**: أضف الإعدادات التالية:

1. **Table**: `conversation_history`
2. **Columns** → **Mapping Mode**: `Define Below`
3. أضف الأعمدة التالية:

| Column | Expression |
|--------|------------|
| `session_id` | `{{ $json.sessionId \|\| $json.user_phone \|\| 'default-session' }}` |
| `user_phone` | `{{ $json.user_phone \|\| $json.from \|\| 'unknown' }}` |
| `user_message` | `{{ $json.userMessage \|\| $json.message \|\| 'No message' }}` |
| `message` | `{{ $json.message \|\| $json.userMessage \|\| 'No message' }}` |
| `ai_response` | `{{ $json.ai_response \|\| $json.text \|\| 'No response' }}` |
| `metadata` | `{{ { "workflow": "whatsapp-ai", "timestamp": $now } }}` |

## 📋 خطوات التطبيق

### الخطوة 1: Extract Response2

1. افتح `Extract Response2` node
2. في Function Code، ابحث عن:
   ```javascript
   const extractNode = $('Extract Message');
   ```
3. غيّره إلى:
   ```javascript
   const extractNode = $('Extract Message2');
   ```
4. احفظ

### الخطوة 2: Save Conversation2

1. افتح `Save Conversation2` node
2. **Operation**: `Insert` (موجود)
3. **Table**: `conversation_history` ← **أضف هذا**
4. **Columns** → **Mapping Mode**: `Define Below` ← **أضف هذا**
5. أضف الأعمدة كما في الجدول أعلاه
6. احفظ

## ✅ Checklist

- [ ] Extract Response2 يستخدم `Extract Message2`
- [ ] Save Conversation2 يحتوي على Table: `conversation_history`
- [ ] Save Conversation2 يحتوي على Columns mapping
- [ ] `user_phone` column يستخدم fallback: `{{ $json.user_phone \|\| $json.from \|\| 'unknown' }}`

## 🧪 اختبار

بعد التطبيق:
1. أرسل رسالة إلى واتساب
2. تحقق من n8n Executions - يجب أن لا توجد أخطاء
3. تحقق من Supabase - `user_phone` يجب أن يكون موجوداً

---

**ملاحظة**: إذا كان اسم الـ node مختلفاً (مثلاً `Extract Message1`)، استخدم الاسم الصحيح في الكود.

