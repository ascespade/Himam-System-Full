# ✅ RAG Workflow Created - Load Data to Knowledge Base

## 📋 Summary

**Date:** 2025-12-06  
**Workflow ID:** `yijjDucNBpxpHkDx`  
**Name:** Load Data to Knowledge Base  
**Status:** ✅ Created (Ready to Activate)

---

## 🎯 Purpose

This workflow allows you to upload files (PDF, CSV, TXT, DOCX) and automatically:
1. Process the files
2. Generate embeddings using Google Gemini
3. Store them in Supabase Knowledge Base
4. Make them available for the AI WhatsApp Response workflow

---

## 🔧 Workflow Structure

### Nodes (5 total):

1. **Upload File** (`n8n-nodes-base.formTrigger`)
   - Form trigger for file upload
   - Accepts: PDF, CSV, TXT, DOCX
   - ✅ Configured

2. **Default Data Loader** (`@n8n/n8n-nodes-langchain.documentDefaultDataLoader`)
   - Processes uploaded files
   - Extracts text content
   - ✅ Configured

3. **Embeddings** (`@n8n/n8n-nodes-langchain.embeddingsGoogleGemini`)
   - Generates embeddings using Google Gemini
   - Credentials: Google Gemini(PaLM) Api account ✅
   - ✅ Configured

4. **Insert to Knowledge Base** (`@n8n/n8n-nodes-langchain.vectorStoreSupabase`)
   - Stores embeddings in Supabase
   - Table: `knowledge_base`
   - Credentials: Supabase API ✅
   - ✅ Configured

5. **Respond Success** (`n8n-nodes-base.respondToWebhook`)
   - Returns success message
   - ✅ Configured

---

## 🔗 Flow

```
Upload File → Default Data Loader → Insert to Knowledge Base
                                    ↑
                            Embeddings (Gemini)
```

---

## 🔑 Credentials Required

1. ✅ **Google Gemini(PaLM) Api account**
   - Used by: Embeddings node
   - API Key: `AIzaSyCc_WMALGhROTeUyq8gW8FbCjL6LZ_ubic`

2. ✅ **Supabase API**
   - Used by: Insert to Knowledge Base node
   - URL: `https://gpcxowqljayhkxyybfqu.supabase.co`

---

## 📝 How to Use

### 1. Activate Workflow:
- Open: https://n8n-9q4d.onrender.com/workflow/yijjDucNBpxpHkDx
- Toggle "Inactive" to "Active"

### 2. Upload Files:
- Click "Execute workflow" button
- Or use the form URL (will be shown when activated)
- Upload your files (PDF, CSV, TXT, DOCX)

### 3. Files Will Be:
- Processed and split into chunks
- Embedded using Google Gemini
- Stored in `knowledge_base` table
- Available for AI WhatsApp Response workflow

---

## 🔗 Integration with AI WhatsApp Response

After uploading files:
- Files are stored in `knowledge_base` table
- AI WhatsApp Response workflow can retrieve them
- Knowledge Base node will use these files for context

---

## ✅ Verification Checklist

- [x] Workflow created
- [x] Form trigger configured
- [x] Data loader configured
- [x] Gemini embeddings configured
- [x] Supabase vector store configured
- [ ] Credentials verified in n8n UI
- [ ] Workflow activated
- [ ] Test file upload successful

---

## 🚀 Benefits

✅ **Easy File Upload** - Simple form interface  
✅ **Automatic Processing** - Files processed automatically  
✅ **Gemini Embeddings** - Uses Google Gemini for embeddings  
✅ **Supabase Storage** - Stores in your existing Knowledge Base  
✅ **Integration Ready** - Works with AI WhatsApp Response workflow

---

**Status:** ✅ Workflow Created & Ready  
**Date:** 2025-12-06  
**Workflow ID:** `yijjDucNBpxpHkDx`

