# ✅ n8n Credentials Update - Complete Guide

## 📋 Summary

**Status:** ⚠️ Credentials file ready, needs placeholder values updated before import

**Files Prepared:**
- ✅ `n8n-config/n8n-credentials.json` - Main file (Supabase configured)
- ✅ `n8n-config/n8n-credentials-updated.json` - Backup
- ✅ `n8n-config/UPDATE_CREDENTIALS_GUIDE.md` - Detailed guide
- ✅ `n8n-config/import-credentials.sh` - Helper script

---

## 🔐 Credentials Status

### ✅ Ready (1)
- **Supabase API** - Fully configured with real keys

### ⚠️ Needs Update (5)
- **WhatsApp Token** - Replace `YOUR_WHATSAPP_TOKEN`
- **OpenAI API** - Replace `YOUR_OPENAI_KEY`
- **Gemini API** - Replace `YOUR_GEMINI_KEY` (optional)
- **Google Calendar** - Replace OAuth values (optional)
- **CRM API** - Replace `YOUR_CRM_TOKEN`

---

## 🚀 Update Process

### 1. Update Credentials File

**Location:** `/media/kali/01DC66379D884460/Github/himam-setup/n8n-config/n8n-credentials.json`

**Required Updates:**
```json
{
  "credentials": [
    {
      "name": "WhatsApp Cloud API Token",
      "data": {
        "value": "Bearer YOUR_ACTUAL_WHATSAPP_TOKEN"  // ← Update this
      }
    },
    {
      "name": "OpenAI API Key",
      "data": {
        "apiKey": "sk-YOUR_ACTUAL_OPENAI_KEY"  // ← Update this
      }
    },
    {
      "name": "Al-Himam CRM API",
      "data": {
        "value": "Bearer YOUR_ACTUAL_CRM_TOKEN"  // ← Update this
      }
    }
  ]
}
```

### 2. Import to n8n

**Method 1: Via UI**
1. Open: https://n8n-9q4d.onrender.com/credentials
2. Click "Import"
3. Upload: `n8n-config/n8n-credentials.json`
4. Verify all 6 credentials appear

**Method 2: Via Script**
```bash
cd /media/kali/01DC66379D884460/Github/himam-setup
./n8n-config/import-credentials.sh
```

### 3. Link to Workflows

After importing, you need to manually link credentials to workflow nodes:

**Workflows to Update:**
1. `j73d4k1P4OGVmu7u` - WhatsApp Booking Automation
2. `Aiq4g63yjOfJu3ix` - AI WhatsApp Response
3. `eQ4dhkQZfLBTJgvd` - Signature Confirmation
4. `1dEv8XGe0mRrpZ01` - Billing Notification
5. `OefbfRHdd0fhsMGN` - CRM Sync

**See:** `n8n-config/UPDATE_CREDENTIALS_GUIDE.md` for detailed steps

---

## 📝 Checklist

### Before Import
- [ ] Update `YOUR_WHATSAPP_TOKEN` in credentials file
- [ ] Update `YOUR_OPENAI_KEY` in credentials file
- [ ] Update `YOUR_CRM_TOKEN` in credentials file (if needed)
- [ ] Update Google OAuth values (if using calendar)
- [ ] Update `YOUR_GEMINI_KEY` (if using Gemini)

### Import Process
- [ ] Open n8n credentials page
- [ ] Import credentials file
- [ ] Verify all 6 credentials appear
- [ ] Check for any import errors

### Link to Workflows
- [ ] Link Supabase to WhatsApp Booking Automation
- [ ] Link WhatsApp to all 5 workflows
- [ ] Link OpenAI to AI WhatsApp Response
- [ ] Test each workflow
- [ ] Verify no credential errors

---

## 🔍 Verification

### Check Credentials in n8n
1. Go to: https://n8n-9q4d.onrender.com/credentials
2. Verify all credentials listed:
   - ✅ Supabase API
   - ✅ WhatsApp Cloud API Token
   - ✅ OpenAI API Key
   - ✅ Gemini API Key
   - ✅ Google API Credentials
   - ✅ Al-Himam CRM API

### Check Workflow Nodes
1. Open any workflow
2. Click on nodes requiring credentials
3. Verify credential is selected in dropdown
4. Test workflow execution

---

## ⚠️ Important Notes

1. **n8n MCP Limitation:** Cannot create/update credentials directly via MCP
2. **Manual Import Required:** Must import via n8n UI
3. **Manual Linking Required:** Must link credentials to nodes manually
4. **Security:** Never commit credentials file with real values

---

## 🔗 Resources

- **Main Guide:** `n8n-config/UPDATE_CREDENTIALS_GUIDE.md`
- **Credentials File:** `n8n-config/n8n-credentials.json`
- **n8n Instance:** https://n8n-9q4d.onrender.com
- **Credentials Page:** https://n8n-9q4d.onrender.com/credentials

---

**Status:** ✅ Files prepared, ⚠️ Awaiting placeholder updates and import

