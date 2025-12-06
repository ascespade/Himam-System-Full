# إصلاح خطأ user_phone null - Error Handling

## 🔴 المشكلة

```
null value in column "user_phone" of relation "conversation_history" violates not-null constraint
```

**السبب**: عندما لا يوجد history (محادثات سابقة)، Chat Memory node قد يحاول إدراج سجل بدون `user_phone`.

## ✅ الحل: Error Handling متعدد المستويات

### 1. Extract Response Node - Validation & Fallbacks

**المشكلة**: إذا فشل استخراج رقم الهاتف من Extract Message node، `user_phone` يصبح `null`.

**الحل**: إضافة multiple fallbacks:

```javascript
// Get original message data from Extract Message node with multiple fallbacks
const extractNode = $('Extract Message');
let from = '';
let sessionId = '';
let userMessage = '';

// Try 1: Extract Message node (primary source)
if (extractNode?.item?.json) {
  from = extractNode.item.json.from || '';
  sessionId = extractNode.item.json.sessionId || '';
  userMessage = extractNode.item.json.text || '';
}

// Try 2: first() method
if (!from && extractNode?.first()?.json) {
  from = extractNode.first().json.from || '';
  sessionId = extractNode.first().json.sessionId || '';
  userMessage = extractNode.first().json.text || '';
}

// Try 3: WhatsApp Trigger node directly
if (!from) {
  const whatsappTrigger = $('WhatsApp Trigger');
  if (whatsappTrigger?.item?.json) {
    const contacts = whatsappTrigger.item.json.contacts || [];
    if (contacts[0]?.wa_id) {
      from = String(contacts[0].wa_id).replace(/[^0-9]/g, '');
    }
    if (whatsappTrigger.item.json.messages?.[0]?.from) {
      from = String(whatsappTrigger.item.json.messages[0].from).replace(/[^0-9]/g, '');
    }
  }
}

// Final validation: Ensure user_phone is NEVER null
if (!from || from === '') {
  from = 'unknown-' + Date.now(); // Fallback to prevent null constraint error
  sessionId = from;
}

// CRITICAL: user_phone MUST always have a value
return [{ 
  user_phone: from,       // ← Always has a value (never null)
  message: userMessage,
  ai_response: text,
  // ... other fields
}];
```

### 2. Save Conversation Node - Expression Fallbacks

**المشكلة**: إذا `$json.user_phone` كان `null` أو `undefined`.

**الحل**: استخدام fallback expressions:

```
session_id    → {{ $json.sessionId || $json.user_phone || 'default-session' }}
user_phone    → {{ $json.user_phone || $json.from || 'unknown' }}
user_message  → {{ $json.userMessage || $json.message || 'No message' }}
message       → {{ $json.message || $json.userMessage || 'No message' }}
ai_response   → {{ $json.ai_response || $json.text || 'No response' }}
```

### 3. Chat Memory Node - Session Key Fallback

**المشكلة**: إذا `Extract Message` node لم يمرر `from`.

**الحل**: استخدام multiple fallbacks:

```
={{ $('Extract Message').item.json.from || $('WhatsApp Trigger').item.json.contacts[0].wa_id || $('WhatsApp Trigger').item.json.messages[0].from }}
```

## 📋 التحديثات المطلوبة في n8n

### 1. Extract Response Node

**الكود الكامل** (في Function Code):

```javascript
// Professional Response Extraction with Validation and Error Handling
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

// WhatsApp message length limit
const MAX_LENGTH = 4000;
if (text.length > MAX_LENGTH) {
  text = text.substring(0, MAX_LENGTH - 50) + '...\n\n(الرسالة طويلة جداً - يرجى الاتصال بالمركز لمزيد من التفاصيل)\n(Message too long - please contact center for details)';
}

// Get original message data with multiple fallbacks
const extractNode = $('Extract Message');
let from = '';
let sessionId = '';
let userMessage = '';

// Try Extract Message node
if (extractNode?.item?.json) {
  from = extractNode.item.json.from || '';
  sessionId = extractNode.item.json.sessionId || '';
  userMessage = extractNode.item.json.text || '';
}

// Fallback: first() method
if (!from && extractNode?.first()?.json) {
  from = extractNode.first().json.from || '';
  sessionId = extractNode.first().json.sessionId || '';
  userMessage = extractNode.first().json.text || '';
}

// Fallback: WhatsApp Trigger node directly
if (!from) {
  const whatsappTrigger = $('WhatsApp Trigger');
  if (whatsappTrigger?.item?.json) {
    const contacts = whatsappTrigger.item.json.contacts || [];
    if (contacts[0]?.wa_id) {
      from = String(contacts[0].wa_id).replace(/[^0-9]/g, '');
    }
    if (whatsappTrigger.item.json.messages?.[0]?.from) {
      from = String(whatsappTrigger.item.json.messages[0].from).replace(/[^0-9]/g, '');
    }
    if (whatsappTrigger.item.json.messages?.[0]?.text?.body) {
      userMessage = whatsappTrigger.item.json.messages[0].text.body.trim();
    }
  }
}

// Final fallback: Use sessionId as phone if available
if (!from && sessionId) {
  from = sessionId.replace(/[^0-9]/g, '');
}

// Create sessionId from phone if not available
if (!sessionId && from) {
  sessionId = from;
}

// CRITICAL: Ensure user_phone is NEVER null
if (!from || from === '') {
  from = 'unknown-' + Date.now();
  sessionId = from;
}

// Ensure sessionId is set
if (!sessionId || sessionId === '') {
  sessionId = from || 'default-session';
}

// Ensure userMessage is set
if (!userMessage || userMessage === '') {
  userMessage = 'No message content';
}

// Return validated data
return [{ 
  text,
  from,
  sessionId,
  userMessage,
  user_phone: from,       // ← Always has a value (never null)
  message: userMessage,
  ai_response: text,
  responseLength: text.length,
  isValid: true,
  hasPhone: from && !from.startsWith('unknown-') // Flag to indicate if real phone was found
}];
```

### 2. Save Conversation Node

**Column Mapping** (مع fallbacks):

```
session_id    → {{ $json.sessionId || $json.user_phone || 'default-session' }}
user_phone    → {{ $json.user_phone || $json.from || 'unknown' }}
user_message  → {{ $json.userMessage || $json.message || 'No message' }}
message       → {{ $json.message || $json.userMessage || 'No message' }}
ai_response   → {{ $json.ai_response || $json.text || 'No response' }}
metadata      → {{ { "workflow": "whatsapp-ai", "timestamp": $now, "hasPhone": $json.hasPhone || false } }}
```

### 3. Chat Memory Node

**Session Key** (مع fallbacks):

```
={{ $('Extract Message').item.json.from || $('WhatsApp Trigger').item.json.contacts[0].wa_id || $('WhatsApp Trigger').item.json.messages[0].from }}
```

## ✅ Checklist

- [ ] Extract Response Node يحتوي على multiple fallbacks
- [ ] Save Conversation Node يستخدم fallback expressions
- [ ] Chat Memory Node Session Key يحتوي على fallbacks
- [ ] `user_phone` دائماً له قيمة (never null)
- [ ] Workflow يعمل حتى بدون history

## 🧪 اختبار

1. **اختبار بدون history**:
   - أرسل رسالة من رقم جديد (لا يوجد محادثات سابقة)
   - تحقق من أن Workflow يعمل بدون أخطاء
   - تحقق من Supabase أن `user_phone` موجود

2. **اختبار مع history**:
   - أرسل رسالة من رقم موجود (يوجد محادثات سابقة)
   - تحقق من أن Chat Memory يعمل
   - تحقق من أن المحادثة الجديدة محفوظة

## 🔍 استكشاف الأخطاء

### خطأ: `user_phone` لا يزال null

**الحل**:
1. تحقق من Extract Response Node - يجب أن يحتوي على fallbacks
2. تحقق من Save Conversation Node - يجب أن يستخدم fallback expressions
3. تحقق من logs في n8n Executions

### خطأ: Chat Memory لا يعمل

**الحل**:
1. تحقق من Session Key في Chat Memory node
2. تأكد من أن Session Key يحتوي على fallbacks
3. تحقق من Postgres credentials

---

**آخر تحديث**: 2025-12-06  
**Workflow File**: `n8n/whatsapp-bot-fixed.json`

