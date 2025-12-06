# دليل تحديث n8n Workflow - الإصلاحات المطلوبة

## 🔴 المشاكل التي تم إصلاحها

1. ✅ **Extract Response Node** - يمرر الآن `user_phone`, `message`, `ai_response`
2. ✅ **Save Conversation Node** - Column Mapping محدث بشكل صحيح
3. ✅ **Chat Memory Node** - Session Key محدث
4. ✅ **Extract Message Node** - يدعم استخراج رقم الهاتف من `contacts[0].wa_id`

## 📋 الخطوات المطلوبة

### 1. تحديث Extract Response Node

**الموقع**: بعد `AI Agent with Knowledge Base`

**الكود المحدث**:
```javascript
// Professional Response Extraction with Validation
const agentOutput = $json || {};

// Extract response from multiple possible formats
let text = '';
if (agentOutput?.output) {
  text = String(agentOutput.output).trim();
} else if (agentOutput?.text) {
  text = String(agentOutput.text).trim();
} else if (agentOutput?.response) {
  text = String(agentOutput.response).trim();
} else if (agentOutput?.message) {
  text = String(agentOutput.message).trim();
} else if (agentOutput?.content) {
  text = String(agentOutput.content).trim();
}

// Fallback message if no response
if (!text || text.length === 0) {
  text = 'عذراً، لم أتمكن من معالجة طلبك. يرجى المحاولة مرة أخرى أو الاتصال بالمركز مباشرة.\n\nSorry, I couldn't process your request. Please try again or contact the center directly.';
}

// WhatsApp message length limit (4096 characters)
const MAX_LENGTH = 4000;
if (text.length > MAX_LENGTH) {
  text = text.substring(0, MAX_LENGTH - 50) + '...\n\n(الرسالة طويلة جداً - يرجى الاتصال بالمركز لمزيد من التفاصيل)\n(Message too long - please contact center for details)';
}

// Get original message data from Extract Message node
const extractNode = $('Extract Message');
const from = extractNode?.item?.json?.from || extractNode?.first()?.json?.from || '';
const sessionId = extractNode?.item?.json?.sessionId || extractNode?.first()?.json?.sessionId || 'default-session';
const userMessage = extractNode?.item?.json?.text || extractNode?.first()?.json?.text || '';

// Return validated data with ALL required fields for Save Conversation
return [{ 
  text,                    // AI response
  from,                    // Phone number
  sessionId,               // Session ID
  userMessage,            // User's original message
  user_phone: from,       // ← REQUIRED for Save Conversation
  message: userMessage,   // ← REQUIRED for Chat Memory compatibility
  ai_response: text,      // ← REQUIRED for Save Conversation
  responseLength: text.length,
  isValid: true
}];
```

### 2. تحديث Save Conversation Node

**الموقع**: بعد `Extract Response`

**الإعدادات**:
- **Operation**: `Insert`
- **Table**: `conversation_history`

**Column Mapping**:
```
session_id    → {{ $json.sessionId }}
user_phone    → {{ $json.user_phone }}
user_message  → {{ $json.userMessage }}
message       → {{ $json.message }}
ai_response   → {{ $json.ai_response }}
metadata      → {{ { "workflow": "whatsapp-ai", "timestamp": $now } }}
```

### 3. تحديث Extract Message Node

**الكود المحدث** (في بداية Function Code):
```javascript
// Extract phone number (handle multiple formats)
let from = '';
if (message?.from) {
  from = message.from.replace(/[^0-9]/g, '');
} else if (value?.contacts?.[0]?.wa_id) {
  from = value.contacts[0].wa_id.replace(/[^0-9]/g, '');
} else if (body.from) {
  from = String(body.from).replace(/[^0-9]/g, '');
} else if ($json.contacts?.[0]?.wa_id) {  // ← ADD THIS
  from = $json.contacts[0].wa_id.replace(/[^0-9]/g, '');
}
```

### 4. تحديث Chat Memory Node

**Session Key**:
```
={{ $('Extract Message').item.json.from }}
```

**Table Name**: `conversation_history`

## 🔧 إعدادات قاعدة البيانات في n8n

من Environment Variables في n8n Render:

```
DB_POSTGRESDB_HOST=aws-1-eu-central-1.pooler.supabase.com
DB_POSTGRESDB_PORT=6543
DB_POSTGRESDB_USER=postgres.vyckwvsevrimyjmfnbsa
DB_POSTGRESDB_PASSWORD=F0VroIDFXDzMZroE
DB_POSTGRESDB_DATABASE=postgres
DB_POSTGRESDB_SCHEMA=public
```

**تأكد من**:
- Postgres credentials في n8n تستخدم هذه القيم
- Chat Memory node يستخدم Postgres account الصحيح
- Supabase node يستخدم Supabase account الصحيح

## 📥 استيراد Workflow الجديد

### الطريقة 1: استيراد JSON

1. افتح n8n
2. اضغط `+ New Workflow`
3. اضغط `⋮` (Menu) → `Import from File`
4. اختر ملف `n8n/whatsapp-bot-fixed.json`
5. راجع الإعدادات:
   - WhatsApp Trigger credentials
   - Gemini Chat Model credentials
   - Postgres credentials (Chat Memory)
   - Supabase credentials (Knowledge Base, Save Conversation)
6. احفظ Workflow
7. فعّل Workflow

### الطريقة 2: التحديث اليدوي

1. افتح Workflow الحالي
2. اتبع الخطوات أعلاه لتحديث كل node
3. احفظ Workflow
4. فعّل Workflow

## ✅ Checklist

- [ ] Extract Message Node يستخرج `from` من `contacts[0].wa_id`
- [ ] Extract Response Node يمرر `user_phone`, `message`, `ai_response`
- [ ] Save Conversation Node Column Mapping صحيح
- [ ] Chat Memory Node Session Key صحيح
- [ ] Postgres credentials محدثة
- [ ] Workflow مفعّل
- [ ] Webhook نشط

## 🧪 اختبار

1. أرسل رسالة إلى واتساب
2. تحقق من n8n Executions:
   - ✅ لا توجد أخطاء
   - ✅ Save Conversation يعمل
   - ✅ Chat Memory يعمل
3. تحقق من Supabase `conversation_history`:
   - ✅ `user_phone` موجود
   - ✅ `message` موجود
   - ✅ `ai_response` موجود

## 🔍 استكشاف الأخطاء

### خطأ: `null value in column "user_phone"`

**الحل**:
- تأكد من أن Extract Response يمرر `user_phone: from`
- تأكد من أن Save Conversation يربط `user_phone` → `{{ $json.user_phone }}`

### خطأ: `Chat Memory session key not found`

**الحل**:
- تأكد من أن Session Key في Chat Memory = `{{ $('Extract Message').item.json.from }}`
- تأكد من أن Extract Message يستخرج `from` بشكل صحيح

### خطأ: `Postgres connection failed`

**الحل**:
- تحقق من Environment Variables في n8n Render
- تحقق من Postgres credentials في n8n
- تحقق من أن Supabase Pooler يعمل

---

**آخر تحديث**: 2025-12-06  
**Workflow File**: `n8n/whatsapp-bot-fixed.json`

