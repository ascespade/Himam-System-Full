# 🚀 Quick Start Guide - Himam Enterprise AI System

## Prerequisites

- Node.js 18+ installed
- Supabase project created
- Meta WhatsApp Business Account
- Google Cloud Project (for Calendar)
- (Optional) External CRM API

---

## Step 1: Database Setup

### Apply Schema

```bash
# Using Supabase CLI
supabase db push

# Or manually via SQL Editor in Supabase Dashboard
# Copy and paste contents of supabase/schema.sql
```

### Verify Tables

Check that these tables exist:
- ✅ `settings`
- ✅ `conversation_history`
- ✅ `appointments`
- ✅ `billing`
- ✅ `signatures`

---

## Step 2: Install Dependencies

```bash
npm install
```

---

## Step 3: Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://[your-project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]
```

Get these from: Supabase Dashboard → Settings → API

---

## Step 4: Deploy Edge Functions

```bash
# Deploy WhatsApp webhook handler
supabase functions deploy whatsapp

# Deploy autosync handler (optional)
supabase functions deploy autosync
```

**Note:** Make sure you're logged in:
```bash
supabase login
supabase link --project-ref [your-project-ref]
```

---

## Step 5: Configure Settings

### Option A: Via Web UI

1. Start dev server: `npm run dev`
2. Navigate to: `http://localhost:3000/settings`
3. Fill in all required settings (see below)

### Option B: Via SQL

```sql
INSERT INTO settings (key, value, description) VALUES
  ('GEMINI_KEY', 'your-gemini-key', 'Google Gemini API Key'),
  ('OPENAI_KEY', 'your-openai-key', 'OpenAI API Key (fallback)'),
  ('WHATSAPP_TOKEN', 'your-whatsapp-token', 'Meta WhatsApp Token'),
  ('WHATSAPP_PHONE_NUMBER_ID', 'your-phone-id', 'WhatsApp Phone Number ID'),
  ('WHATSAPP_VERIFY_TOKEN', 'your-verify-token', 'Webhook Verification Token'),
  ('GOOGLE_CLIENT_EMAIL', 'your-service-account@project.iam.gserviceaccount.com', 'Google Service Account Email'),
  ('GOOGLE_PRIVATE_KEY', '-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n', 'Google Service Account Private Key'),
  ('GOOGLE_CALENDAR_ID', 'your-calendar-id@gmail.com', 'Google Calendar ID'),
  ('CRM_URL', 'https://your-crm-api.com', 'CRM API URL'),
  ('CRM_TOKEN', 'your-crm-token', 'CRM API Token')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
```

---

## Step 6: WhatsApp Webhook Setup

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Select your WhatsApp Business App
3. Go to **Configuration** → **Webhooks**
4. Click **Edit** on Webhook field
5. Enter:
   - **Callback URL:** `https://[your-project-ref].supabase.co/functions/v1/whatsapp`
   - **Verify Token:** (same as `WHATSAPP_VERIFY_TOKEN` in settings)
6. Click **Verify and Save**
7. Subscribe to **messages** events

---

## Step 7: Google Calendar Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or use existing)
3. Enable **Google Calendar API**
4. Create **Service Account**:
   - IAM & Admin → Service Accounts → Create Service Account
   - Grant role: **Editor** (or custom role with Calendar permissions)
5. Create **JSON Key**:
   - Click on service account → Keys → Add Key → JSON
   - Download JSON file
6. Extract from JSON:
   - `client_email` → `GOOGLE_CLIENT_EMAIL`
   - `private_key` → `GOOGLE_PRIVATE_KEY`
7. Share Calendar:
   - Open Google Calendar
   - Settings → Share with specific people
   - Add service account email with **Make changes to events** permission
   - Copy Calendar ID → `GOOGLE_CALENDAR_ID`

---

## Step 8: Test the System

### Test AI Endpoint

```bash
curl -X POST http://localhost:3000/api/ai \
  -H "Content-Type: application/json" \
  -d '{"message": "مرحبا"}'
```

### Test WhatsApp Webhook

```bash
# Get webhook URL
echo "https://[your-project-ref].supabase.co/functions/v1/whatsapp"

# Test verification (replace TOKEN)
curl "https://[your-project-ref].supabase.co/functions/v1/whatsapp?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=test123"
```

### Test Calendar Integration

```bash
curl -X POST http://localhost:3000/api/calendar \
  -H "Content-Type: application/json" \
  -d '{
    "action": "create",
    "patientName": "Test Patient",
    "phone": "+966501234567",
    "specialist": "أخصائي تخاطب",
    "date": "2024-12-25T10:00:00Z"
  }'
```

---

## Step 9: Production Deployment

### Build

```bash
npm run build
```

### Deploy to Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel Dashboard
```

### Or Deploy to Other Platform

- Set environment variables
- Run `npm run build`
- Run `npm run start`

---

## ✅ Verification Checklist

- [ ] Database schema applied
- [ ] All settings configured in Supabase
- [ ] Edge functions deployed
- [ ] WhatsApp webhook verified
- [ ] Google Calendar credentials added
- [ ] AI endpoint responding
- [ ] WhatsApp messages being received
- [ ] Calendar events creating successfully

---

## 🆘 Common Issues

### "Settings not found"
- Make sure schema is applied
- Check settings table has data
- Verify service role key has RLS access

### "WhatsApp webhook not working"
- Check verify token matches
- Verify webhook URL is correct
- Check Supabase function logs

### "Calendar events not creating"
- Verify service account has calendar access
- Check calendar is shared with service account email
- Verify private key format (newlines preserved)

### "AI not responding"
- Check API keys in settings
- Verify keys are valid
- Check function logs for errors

---

## 📚 Next Steps

- Read [ENTERPRISE_SYSTEM_README.md](./ENTERPRISE_SYSTEM_README.md) for full documentation
- Check [FLOW_DIAGRAM.md](./FLOW_DIAGRAM.md) for system architecture
- Review API endpoints in codebase

---

**Need Help?** Check the main README or review the code comments in each file.

