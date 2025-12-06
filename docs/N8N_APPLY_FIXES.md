# كيفية تطبيق الإصلاحات في n8n

## الطريقة 1: استيراد Workflow المحدث (الأسهل)

1. افتح n8n Dashboard
2. اضغط `⋮` (Menu) في أعلى اليمين
3. اختر `Import from File`
4. اختر ملف `n8n/whatsapp-bot-final-fixed.json`
5. راجع Credentials:
   - ✅ WhatsApp Trigger
   - ✅ Gemini Chat Model
   - ✅ Postgres (Chat Memory)
   - ✅ Supabase (Knowledge Base, Save Conversation)
6. احفظ Workflow
7. فعّل Workflow

## الطريقة 2: التعديل اليدوي

### 1. Extract Response2 Node

1. افتح `Extract Response2` node
2. في **Function Code**، ابحث عن:
   ```javascript
   const extractNode = $('Extract Message');
   ```
3. غيّره إلى:
   ```javascript
   const extractNode = $('Extract Message2');
   ```
4. احفظ

### 2. Save Conversation2 Node

1. افتح `Save Conversation2` node
2. **Operation**: `Insert` (موجود)
3. **Table**: `conversation_history` ← **أضف هذا**
4. **Columns** → **Mapping Mode**: `Define Below` ← **أضف هذا**
5. أضف الأعمدة التالية:

| Column | Expression |
|--------|------------|
| `session_id` | `{{ $json.sessionId \|\| $json.user_phone \|\| 'default-session' }}` |
| `user_phone` | `{{ $json.user_phone \|\| $json.from \|\| 'unknown' }}` |
| `user_message` | `{{ $json.userMessage \|\| $json.message \|\| 'No message' }}` |
| `message` | `{{ $json.message \|\| $json.userMessage \|\| 'No message' }}` |
| `ai_response` | `{{ $json.ai_response \|\| $json.text \|\| 'No response' }}` |
| `metadata` | `{{ { "workflow": "whatsapp-ai", "timestamp": $now } }}` |

6. احفظ

### 3. Chat Memory2 Node

1. افتح `Chat Memory2` node
2. **Session Key**: 
   ```
   ={{ $('Extract Message2').item.json.from || $('WhatsApp Trigger').item.json.contacts[0].wa_id || $('WhatsApp Trigger').item.json.messages[0].from }}
   ```
3. احفظ

## الاختبار

بعد التطبيق:
1. فعّل Workflow
2. أرسل رسالة إلى واتساب
3. تحقق من n8n Executions - يجب أن لا توجد أخطاء
4. تحقق من Supabase `conversation_history` - `user_phone` يجب أن يكون موجوداً

---

**ملاحظة**: الطريقة 1 (استيراد JSON) هي الأسهل والأسرع.

