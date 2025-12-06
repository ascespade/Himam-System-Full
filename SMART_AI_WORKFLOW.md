# ✅ Smart AI Workflow with Memory & Knowledge Base

## 📊 Summary

**Workflow:** AI WhatsApp Response (`Aiq4g63yjOfJu3ix`)  
**Status:** ✅ Smart AI with Memory & Learning Capabilities

### 🎯 Features

✅ **Conversation Memory** - يتذكر المحادثات السابقة  
✅ **Knowledge Base** - قاعدة معرفة شاملة عن مركز الهمم  
✅ **Learning from History** - يتعلم من التاريخ  
✅ **Conversation Logging** - حفظ سجل المحادثات  
✅ **Bilingual Support** - دعم العربية والإنجليزية

---

## 🏗️ Architecture

```
Webhook → Extract Message → AI Agent (Gemini + Memory + Knowledge Base) 
    → Extract Response → Save Conversation → Send WhatsApp → Respond
```

### Flow Details

1. **Webhook** - يستقبل رسالة WhatsApp
2. **Extract Message** - يستخرج النص ورقم الهاتف (session ID)
3. **AI Agent** - يستخدم:
   - **Gemini Chat Model** - للذكاء الاصطناعي
   - **Chat Memory** - لاسترجاع المحادثات السابقة
   - **Knowledge Base** - للمعلومات عن المركز
4. **Extract Response** - يستخرج الرد من Agent
5. **Save Conversation** - يحفظ المحادثة في قاعدة البيانات
6. **Send WhatsApp** - يرسل الرد للمستخدم
7. **Respond to Webhook** - يؤكد الاستلام

---

## 🧠 Components

### 1. **Chat Memory (Postgres Chat Memory)**
- **Node:** `nodes-langchain.memoryPostgresChat`
- **Table:** `conversation_history`
- **Session ID:** رقم هاتف المستخدم
- **Function:** يحفظ ويسترجع تاريخ المحادثات

### 2. **Knowledge Base (Supabase Vector Store)**
- **Table:** `knowledge_base`
- **Documents:** 16 وثيقة
- **Categories:** 6 فئات
- **Languages:** العربية والإنجليزية
- **Content:** معلومات شاملة عن مركز الهمم

### 3. **AI Agent**
- **Model:** Gemini 2.0 Flash
- **Memory:** 2000 tokens من التاريخ
- **Tools:** Knowledge Base
- **System Message:** مساعد طبي ذكي يتذكر المحادثات

### 4. **Conversation History Table**
- **Table:** `conversation_history`
- **Fields:**
  - `session_id` - رقم الهاتف
  - `user_phone` - رقم المستخدم
  - `user_message` - رسالة المستخدم
  - `ai_response` - رد AI
  - `metadata` - معلومات إضافية
  - `created_at` - التاريخ والوقت

---

## 📚 Knowledge Base Content

### Categories (6 فئات)

1. **About** - معلومات عن المركز
2. **Services** - الخدمات المقدمة
3. **Specialists** - الأخصائيون
4. **Booking** - طرق الحجز
5. **Specializations** - التخصصات
6. **Team** - فريق العمل

### Statistics
- **Total Documents:** 16
- **Languages:** Arabic (8) + English (8)
- **Categories:** 6
- **Source:** Business information about Hemam Center

---

## 🔄 How Memory Works

### Session Management
- **Session ID = User Phone Number**
- كل مستخدم له session منفصل
- Agent يتذكر المحادثات السابقة لكل مستخدم

### Memory Retrieval
- Agent يسترجع آخر 2000 tokens من المحادثات
- يستخدم السياق لفهم المحادثة الحالية
- يتعلم من التفاعلات السابقة

### Conversation Logging
- كل محادثة تُحفظ في `conversation_history`
- يمكن استرجاعها لاحقاً للتحليل
- مفيد للتحسين والتطوير

---

## 🎓 Learning Capabilities

### 1. **Context Awareness**
- Agent يفهم السياق من المحادثات السابقة
- يتذكر ما تم مناقشته سابقاً
- يبني على المعلومات السابقة

### 2. **Personalization**
- كل مستخدم له تاريخ منفصل
- Agent يتكيف مع أسلوب كل مستخدم
- يقدم إجابات مخصصة

### 3. **Knowledge Base Integration**
- يستخدم Knowledge Base للمعلومات الدقيقة
- يجمع بين التاريخ والمعرفة
- يقدم إجابات شاملة ودقيقة

---

## 📋 Database Tables

### 1. `conversation_history`
```sql
CREATE TABLE conversation_history (
  id uuid PRIMARY KEY,
  session_id text NOT NULL,
  user_phone text NOT NULL,
  user_message text NOT NULL,
  ai_response text NOT NULL,
  metadata jsonb,
  created_at timestamp DEFAULT now()
);
```

### 2. `knowledge_base`
```sql
CREATE TABLE knowledge_base (
  id uuid PRIMARY KEY,
  content text NOT NULL,
  metadata jsonb,
  embedding vector(1536),
  created_at timestamp DEFAULT now()
);
```

---

## ⚙️ Configuration

### Chat Memory Node
```json
{
  "sessionIdType": "customKey",
  "sessionKey": "={{$json.sessionId}}",
  "tableName": "conversation_history"
}
```

### AI Agent Configuration
```json
{
  "promptType": "define",
  "text": "={{$json.text}}",
  "options": {
    "systemMessage": "You are a helpful medical assistant...",
    "maxIterations": 10,
    "maxTokensFromMemory": 2000,
    "enableStreaming": true
  }
}
```

### Save Conversation Node
```json
{
  "operation": "create",
  "tableId": "conversation_history",
  "fields": {
    "session_id": "={{$json.sessionId}}",
    "user_phone": "={{$json.from}}",
    "user_message": "={{$json.userMessage}}",
    "ai_response": "={{$json.text}}",
    "metadata": "={{ JSON.stringify({...}) }}"
  }
}
```

---

## 🔐 Required Setup

### Environment Variables
```
N8N_COMMUNITY_PACKAGES_ALLOW_TOOL_USAGE=true
GEMINI_API_KEY=your_gemini_key
WHATSAPP_PHONE_NUMBER_ID=843049648895545
```

### Credentials
1. **Supabase API** - للـ Knowledge Base و Chat Memory
2. **Gemini API** - للـ Chat Model
3. **WhatsApp Token** - لإرسال الرسائل

---

## 📊 Statistics

### Knowledge Base
- ✅ 16 documents
- ✅ 6 categories
- ✅ 2 languages (AR/EN)
- ✅ Vector embeddings ready

### Conversation History
- ✅ Table created
- ✅ Indexes optimized
- ✅ RLS enabled
- ✅ Realtime enabled

### Workflow
- ✅ 10 nodes
- ✅ 7 connections
- ✅ Memory integrated
- ✅ Knowledge base connected

---

## 🚀 Benefits

✅ **Smart Responses** - إجابات ذكية بناءً على التاريخ  
✅ **Context Awareness** - فهم السياق من المحادثات السابقة  
✅ **Personalization** - تخصيص لكل مستخدم  
✅ **Learning** - يتعلم من كل محادثة  
✅ **Comprehensive Knowledge** - معلومات شاملة عن المركز  
✅ **Bilingual** - دعم كامل للعربية والإنجليزية  
✅ **Persistent Memory** - ذاكرة دائمة في قاعدة البيانات

---

## 📝 Next Steps

1. **Set Environment Variables:**
   - `N8N_COMMUNITY_PACKAGES_ALLOW_TOOL_USAGE=true`
   - `GEMINI_API_KEY=your_key`

2. **Link Credentials:**
   - Supabase API → Knowledge Base & Chat Memory
   - Gemini API → Gemini Chat Model
   - WhatsApp Token → Send AI Reply

3. **Test Workflow:**
   - Send test WhatsApp message
   - Verify memory retrieval
   - Check conversation saving
   - Test knowledge base usage

4. **Monitor:**
   - Check conversation_history table
   - Review memory effectiveness
   - Analyze user interactions

---

## 🔗 Quick Links

- **Workflow:** https://n8n-9q4d.onrender.com/workflow/Aiq4g63yjOfJu3ix
- **Supabase Dashboard:** https://supabase.com/dashboard/project/gpcxowqljayhkxyybfqu
- **Knowledge Base Table:** `knowledge_base`
- **Conversation History:** `conversation_history`

---

**Status:** ✅ Smart AI Workflow with Memory & Learning Complete  
**Date:** 2025-12-06

