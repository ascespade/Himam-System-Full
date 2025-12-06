# 🔧 Workflow Update Guide

## 📋 Current Status

**Workflow:** AI WhatsApp Response (`Aiq4g63yjOfJu3ix`)  
**Issue:** Credentials may not be visible in UI

---

## 🔍 Problem Analysis

The workflow has credentials linked in the backend:
- ✅ Gemini Chat Model: `googlePalmApi` credential (ID: `loZTSuo6IMkCcOj3`)

But you might not see it in the UI because:
1. **Credential ID mismatch:** The credential ID in workflow might not match the actual credential in n8n
2. **Browser cache:** Need to refresh the page
3. **Credential not imported:** The credential needs to be created/imported first

---

## ✅ Solution Steps

### Option 1: Import Credentials (Recommended)

1. **Open n8n:**
   - Go to: https://n8n-9q4d.onrender.com/credentials

2. **Import credentials:**
   - Click "Import" or "Add Credential"
   - Select: `n8n-config/n8n-credentials.json`
   - Or manually create: `Google Gemini(PaLM) Api account` with type `googlePalmApi`

3. **Link credential in workflow:**
   - Open workflow: `AI WhatsApp Response`
   - Click on: `Gemini Chat Model` node
   - Select credential: `Google Gemini(PaLM) Api account`
   - Save workflow

### Option 2: Manual Credential Creation

1. **Create credential:**
   - Go to: https://n8n-9q4d.onrender.com/credentials
   - Click "Add Credential"
   - Search for: `Google Gemini` or `PaLM`
   - Select: `Google Gemini(PaLM) Api account`
   - Enter API Key: `AIzaSyCc_WMALGhROTeUyq8gW8FbCjL6LZ_ubic`
   - Save

2. **Link to workflow:**
   - Open workflow
   - Click `Gemini Chat Model` node
   - Select the credential you just created
   - Save

### Option 3: Use Environment Variable

If credentials don't work, you can use environment variable:

1. **Set in n8n environment:**
   ```
   GEMINI_API_KEY=AIzaSyCc_WMALGhROTeUyq8gW8FbCjL6LZ_ubic
   ```

2. **The Gemini Chat Model node will automatically use it**

---

## 🔑 Credential Details

**Name:** `Google Gemini(PaLM) Api account`  
**Type:** `googlePalmApi`  
**API Key:** `AIzaSyCc_WMALGhROTeUyq8gW8FbCjL6LZ_ubic`  
**Used in:** `Gemini Chat Model` node

---

## 📝 Verification

After updating:

1. **Check node:**
   - Open `Gemini Chat Model` node
   - Verify credential is selected
   - No red warning icons

2. **Test workflow:**
   - Click "Execute workflow"
   - Check for errors
   - Verify AI response works

3. **Check logs:**
   - Look for credential errors
   - Verify API calls succeed

---

## 🚨 Common Issues

### Issue 1: Credential Not Found
**Error:** "Credential not found"  
**Solution:** Import or create the credential first

### Issue 2: Wrong Credential Type
**Error:** "Invalid credential type"  
**Solution:** Use `googlePalmApi` type, not `httpHeaderAuth`

### Issue 3: API Key Invalid
**Error:** "Authentication failed"  
**Solution:** Verify API key is correct: `AIzaSyCc_WMALGhROTeUyq8gW8FbCjL6LZ_ubic`

---

## ✅ Quick Fix

**Fastest way to fix:**

1. Open workflow in n8n
2. Click `Gemini Chat Model` node
3. If credential is missing, click "Add Credential"
4. Create new `Google Gemini(PaLM) Api account` credential
5. Enter API key: `AIzaSyCc_WMALGhROTeUyq8gW8FbCjL6LZ_ubic`
6. Save credential
7. Save workflow
8. Refresh page

---

**Status:** Ready for manual credential setup  
**Date:** 2025-12-06

