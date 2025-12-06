# إصلاح n8n Workflow - Save Conversation Node

## 🔴 المشكلة

```
null value in column "user_phone" of relation "conversation_history" violates not-null constraint
```

## ✅ الحل

### المشكلة:
`Save Conversation` node لا يمرر `user_phone` المطلوب في جدول `conversation_history`.

### الحل:

#### 1. تحديث Extract Response Node

يجب أن يمرر `user_phone` في البيانات:

```javascript
// في Extract Response Node
const extractNode = $('Extract Message');
const from = extractNode?.item?.json?.from || extractNode?.first()?.json?.from || '';
const sessionId = extractNode?.item?.json?.sessionId || extractNode?.first()?.json?.sessionId || 'default-session';
const userMessage = extractNode?.item?.json?.text || extractNode?.first()?.json?.text || '';

return [{ 
  text,           // AI response
  from,           // Phone number (user_phone)
  sessionId,      // Session ID
  userMessage,    // User's original message
  user_phone: from,  // ← ADD THIS
  message: userMessage,  // ← ADD THIS (for n8n Chat Memory)
  ai_response: text,     // ← ADD THIS
  responseLength: text.length,
  isValid: true
}];
```

#### 2. تحديث Save Conversation Node

في n8n، في `Save Conversation` node:

**Operation**: `Insert`

**Columns to Insert**:
- `session_id` = `{{ $json.sessionId }}`
- `user_phone` = `{{ $json.from }}` أو `{{ $json.user_phone }}`
- `user_message` = `{{ $json.userMessage }}`
- `message` = `{{ $json.userMessage }}` (للتوافق مع Chat Memory)
- `ai_response` = `{{ $json.text }}`
- `metadata` = `{{ { "workflow": "whatsapp-ai", "timestamp": $now } }}`

#### 3. تحديث Chat Memory Node

**Session Key**: 
```
={{ $('WhatsApp Trigger').item.json.contacts[0].wa_id }}
```

أو من Extract Message:
```
={{ $('Extract Message').item.json.from }}
```

**Table Name**: `conversation_history`

## 📋 البنية المطلوبة للبيانات

عند حفظ المحادثة، يجب أن تحتوي البيانات على:

```json
{
  "session_id": "966581421483",
  "user_phone": "966581421483",
  "user_message": "سلام",
  "message": "سلام",
  "ai_response": "وعليكم السلام، كيف يمكنني مساعدتك اليوم؟",
  "metadata": {
    "workflow": "whatsapp-ai",
    "timestamp": "2025-12-06T..."
  }
}
```

## 🔧 خطوات الإصلاح في n8n

### 1. تحديث Extract Response Node

1. افتح `Extract Response` node
2. في Function Code، أضف:
```javascript
return [{ 
  text, 
  from, 
  sessionId, 
  userMessage,
  user_phone: from,        // ← ADD
  message: userMessage,    // ← ADD
  ai_response: text,       // ← ADD
  responseLength: text.length,
  isValid: true
}];
```

### 2. تحديث Save Conversation Node

1. افتح `Save Conversation` node
2. **Operation**: `Insert`
3. **Table**: `conversation_history`
4. **Columns**:
   - `session_id` → `{{ $json.sessionId }}`
   - `user_phone` → `{{ $json.user_phone }}` أو `{{ $json.from }}`
   - `user_message` → `{{ $json.userMessage }}`
   - `message` → `{{ $json.message }}` أو `{{ $json.userMessage }}`
   - `ai_response` → `{{ $json.ai_response }}` أو `{{ $json.text }}`
   - `metadata` → `{{ { "workflow": "whatsapp-ai" } }}`

### 3. التحقق من Chat Memory Node

1. افتح `Chat Memory` node
2. **Session Key**: 
   ```
   ={{ $('Extract Message').item.json.from }}
   ```
   أو
   ```
   ={{ $('WhatsApp Trigger').item.json.contacts[0].wa_id }}
   ```
3. **Table Name**: `conversation_history`

## ✅ Checklist

- [ ] Extract Response Node يمرر `user_phone`
- [ ] Save Conversation Node يملأ جميع الأعمدة المطلوبة
- [ ] Chat Memory Node يستخدم session key صحيح
- [ ] Workflow يعمل بدون أخطاء

## 🧪 اختبار

بعد الإصلاح:
1. أرسل رسالة إلى واتساب
2. تحقق من n8n Executions
3. تحقق من Supabase `conversation_history` table
4. تأكد من أن البيانات محفوظة بشكل صحيح

---

**Workflow ID**: `YCZ3lqYrNxWylyg3`  
**Status**: ⚠️ يحتاج إصلاح Save Conversation Node

