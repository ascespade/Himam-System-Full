# تعليمات تطبيق الإصلاحات في n8n عبر المتصفح

## ⚠️ ملاحظة مهمة

بسبب تعقيد واجهة n8n، يفضل تطبيق الإصلاحات يدوياً أو استيراد الـ workflow المحدث.

## الطريقة الموصى بها: استيراد Workflow المحدث

### الخطوات:

1. **افتح n8n Dashboard**
   - URL: `https://n8n-9q4d.onrender.com/workflow/YCZ3lqYrNxWylyg3`

2. **استيراد Workflow المحدث:**
   - اضغط على `⋮` (Menu) في أعلى اليمين
   - اختر `Import from File` أو `Import from URL`
   - إذا لم تجد خيار Import، جرب:
     - `Ctrl+O` (Open)
     - أو `File` → `Import`
   - اختر ملف `n8n/whatsapp-bot-final-fixed.json`

3. **راجع Credentials:**
   - ✅ WhatsApp Trigger
   - ✅ Gemini Chat Model
   - ✅ Postgres (Chat Memory)
   - ✅ Supabase (Knowledge Base, Save Conversation)

4. **احفظ Workflow:**
   - `Ctrl+S` أو اضغط `Save`

5. **فعّل Workflow:**
   - اضغط على toggle switch بجانب "Inactive" لتفعيله

## الطريقة البديلة: التعديل اليدوي

إذا لم تستطع استيراد الـ workflow، يمكنك تعديل النودات يدوياً:

### 1. Extract Response2 Node

1. ابحث عن `Extract Response2` node على canvas
2. انقر عليه لفتحه
3. في **Function Code**، ابحث عن:
   ```javascript
   const extractNode = $('Extract Message');
   ```
4. غيّره إلى:
   ```javascript
   const extractNode = $('Extract Message2');
   ```
5. احفظ

### 2. Save Conversation2 Node

1. ابحث عن `Save Conversation2` node على canvas
2. انقر عليه لفتحه
3. **Operation**: `Insert` (موجود)
4. **Table**: `conversation_history` ← **أضف هذا**
5. **Columns** → **Mapping Mode**: `Define Below` ← **أضف هذا**
6. أضف الأعمدة التالية:

| Column | Expression |
|--------|------------|
| `session_id` | `{{ $json.sessionId \|\| $json.user_phone \|\| 'default-session' }}` |
| `user_phone` | `{{ $json.user_phone \|\| $json.from \|\| 'unknown' }}` |
| `user_message` | `{{ $json.userMessage \|\| $json.message \|\| 'No message' }}` |
| `message` | `{{ $json.message \|\| $json.userMessage \|\| 'No message' }}` |
| `ai_response` | `{{ $json.ai_response \|\| $json.text \|\| 'No response' }}` |
| `metadata` | `{{ { "workflow": "whatsapp-ai", "timestamp": $now } }}` |

7. احفظ

### 3. Chat Memory2 Node

1. ابحث عن `Chat Memory2` node على canvas
2. انقر عليه لفتحه
3. **Session Key**: 
   ```
   ={{ $('Extract Message2').item.json.from || $('WhatsApp Trigger').item.json.contacts[0].wa_id || $('WhatsApp Trigger').item.json.messages[0].from }}
   ```
4. احفظ

## الاختبار

بعد التطبيق:
1. فعّل Workflow
2. أرسل رسالة إلى واتساب
3. تحقق من n8n Executions - يجب أن لا توجد أخطاء
4. تحقق من Supabase `conversation_history` - `user_phone` يجب أن يكون موجوداً

---

**ملاحظة**: الطريقة 1 (استيراد JSON) هي الأسهل والأسرع.

