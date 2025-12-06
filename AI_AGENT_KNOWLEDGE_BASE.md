# ✅ AI Agent with Gemini & Knowledge Base - Complete Setup

## 📊 Summary

**Workflow:** AI WhatsApp Response (`Aiq4g63yjOfJu3ix`)  
**Status:** ✅ Updated with AI Agent + Gemini + Knowledge Base

### 🎯 Architecture

```
Webhook → Extract Message → AI Agent (Gemini) + Knowledge Base → Extract Response → Send WhatsApp → Respond
```

## 🔧 Components

### 1. **Knowledge Base (Supabase Vector Store)**
- **Table:** `knowledge_base`
- **Type:** Supabase Vector Store
- **Mode:** Retrieve as Tool for AI Agent
- **Content:** Al-Himam Medical Center information (services, specialists, booking)
- **Languages:** Arabic & English

### 2. **Gemini Chat Model**
- **Node:** `nodes-langchain.lmChatGoogleGemini`
- **Model:** `gemini-2.0-flash-exp`
- **Type:** Language Model for AI Agent

### 3. **AI Agent**
- **Node:** `nodes-langchain.agent`
- **Type:** AI Agent with tools
- **System Message:** Medical assistant for Al-Himam Center
- **Tools:** Knowledge Base (Supabase Vector Store)
- **Language Model:** Gemini

## 📋 Knowledge Base Content

### Table Structure
```sql
CREATE TABLE knowledge_base (
  id uuid PRIMARY KEY,
  content text NOT NULL,
  metadata jsonb,
  embedding vector(1536),
  created_at timestamp
);
```

### Sample Content
- Services information (English & Arabic)
- Specialists information (English & Arabic)
- Booking procedures (English & Arabic)

**Total Documents:** 6 (3 categories: services, specialists, booking)

## 🔗 Connections

### Main Flow
1. **Webhook** → Extract Message
2. **Extract Message** → AI Agent
3. **AI Agent** → Extract Response → Send WhatsApp → Respond

### AI Agent Connections
- **Knowledge Base** → AI Agent (ai_tool connection)
- **Gemini Chat Model** → AI Agent (ai_languageModel connection)

## ⚙️ Configuration

### Knowledge Base Node
```json
{
  "mode": "retrieve-as-tool",
  "tableName": "knowledge_base",
  "toolName": "Al-Himam Knowledge Base",
  "toolDescription": "Retrieves information about Al-Himam Medical Center...",
  "topK": 3
}
```

### Gemini Chat Model
```json
{
  "modelName": "models/gemini-2.0-flash-exp"
}
```

### AI Agent
```json
{
  "promptType": "define",
  "text": "={{$json.text}}",
  "options": {
    "systemMessage": "You are a helpful medical assistant for Al-Himam Medical Center..."
  }
}
```

## 🔐 Required Credentials

1. **Supabase API** (for Knowledge Base)
   - URL: `https://gpcxowqljayhkxyybfqu.supabase.co`
   - Anon Key: Configured

2. **Gemini API Key**
   - Environment Variable: `GEMINI_API_KEY`
   - Or credential in n8n

3. **WhatsApp Token** (for sending replies)
   - Already configured

## 📝 How It Works

1. **User sends WhatsApp message** → Webhook receives it
2. **Extract Message** → Parses WhatsApp webhook payload
3. **AI Agent receives message** → Uses Gemini to understand
4. **Agent queries Knowledge Base** → Retrieves relevant information
5. **Agent generates response** → Using Gemini + Knowledge Base context
6. **Extract Response** → Gets final answer from agent
7. **Send WhatsApp** → Replies to user
8. **Respond to Webhook** → Confirms completion

## 🚀 Benefits

✅ **Context-Aware:** Uses knowledge base for accurate information  
✅ **Bilingual:** Supports Arabic and English  
✅ **Intelligent:** AI Agent can reason and use tools  
✅ **Scalable:** Easy to add more knowledge base content  
✅ **Efficient:** Vector search for fast retrieval

## 📊 Knowledge Base Statistics

- **Total Documents:** 6
- **Categories:** 3 (services, specialists, booking)
- **Languages:** 2 (Arabic, English)
- **Vector Dimension:** 1536

## 🔧 Adding More Knowledge

To add more content to knowledge base:

```sql
INSERT INTO knowledge_base (content, metadata) VALUES
('Your new content here', '{"category": "your_category", "language": "en"}');
```

**Note:** Embeddings will be generated automatically by Supabase when using the Vector Store node.

## ✅ Verification

- ✅ Knowledge base table created
- ✅ Sample data inserted
- ✅ Workflow updated with AI Agent
- ✅ Gemini Chat Model connected
- ✅ Knowledge Base connected as tool
- ✅ Workflow validated

## 🔗 Next Steps

1. **Add Gemini API Key:**
   - Set `GEMINI_API_KEY` in n8n environment variables
   - Or configure Gemini credential in n8n

2. **Link Supabase Credential:**
   - Link "Supabase API" credential to Knowledge Base node

3. **Test Workflow:**
   - Send test WhatsApp message
   - Verify agent uses knowledge base
   - Check response quality

4. **Expand Knowledge Base:**
   - Add more content about services
   - Add FAQ entries
   - Add pricing information
   - Add location details

---

**Status:** ✅ AI Agent with Gemini & Knowledge Base configured  
**Date:** 2025-12-06

