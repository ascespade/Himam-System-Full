# ✅ Himam Enterprise AI System - Complete Setup

**Version:** 2.0.0  
**Status:** ✅ All workflows merged into unified Next.js + Supabase + Gemini platform

---

## 🎯 System Overview

The Himam Enterprise AI System is a unified automation platform that integrates:
- **WhatsApp Cloud API** for patient communication
- **Supabase** for database and real-time features
- **Gemini 2.0 Flash** (primary) + **OpenAI** (fallback) for AI responses
- **Google Calendar API** for appointment scheduling
- **External CRM** integration for data sync
- **Billing & Signature** management

**No n8n dependencies** - everything runs natively in Next.js and Supabase Edge Functions.

---

## 📁 Project Structure

```
project-root/
├── app/
│   ├── api/
│   │   ├── ai/route.ts              # AI chat endpoint
│   │   ├── calendar/route.ts        # Google Calendar integration
│   │   ├── crm/route.ts             # CRM sync endpoint
│   │   ├── billing/route.ts         # Billing management
│   │   ├── signature/route.ts       # Digital signature storage
│   │   └── settings/route.ts        # Settings management
│   ├── settings/page.tsx            # Admin settings UI
│   └── [other pages]
├── supabase/
│   ├── functions/
│   │   ├── whatsapp/index.ts        # WhatsApp webhook handler
│   │   └── autosync/index.ts        # Real-time sync handler
│   └── schema.sql                   # Complete database schema
├── src/lib/
│   ├── supabase.ts                  # Supabase clients
│   ├── config.ts                    # Settings loader
│   ├── ai.ts                        # AI service (Gemini + OpenAI)
│   ├── calendar.ts                  # Google Calendar service
│   └── index.ts                     # Centralized exports
└── components/                      # React components
```

---

## 🗄️ Database Schema

All configuration and data stored in Supabase:

### Tables

1. **`settings`** - Key-value store for all system configuration
   - `key` (TEXT PRIMARY KEY)
   - `value` (TEXT)
   - `description` (TEXT)
   - `updated_at` (TIMESTAMPTZ)

2. **`conversation_history`** - WhatsApp + AI interactions
   - `id`, `user_phone`, `user_message`, `ai_response`, `session_id`, `created_at`

3. **`appointments`** - Integrated with Google Calendar
   - `id`, `patient_name`, `phone`, `specialist`, `date`, `status`, `calendar_event_id`, `notes`

4. **`billing`** - Invoice and payment records
   - `id`, `patient_name`, `phone`, `amount`, `paid`, `invoice_number`, `notes`

5. **`signatures`** - Digital signature storage
   - `id`, `patient_name`, `session_id`, `signature_url`, `document_type`

### Security

- **Row Level Security (RLS)** enabled on all tables
- Service role has full access for API operations
- Indexes on frequently queried columns

---

## 🔧 Configuration

All settings stored in Supabase `settings` table. Configure via `/settings` page or API.

### Required Settings

```typescript
GEMINI_KEY              // Google Gemini API key
OPENAI_KEY              // OpenAI API key (fallback)
WHATSAPP_TOKEN          // Meta WhatsApp Cloud API token
WHATSAPP_PHONE_NUMBER_ID // WhatsApp phone number ID
WHATSAPP_VERIFY_TOKEN   // Webhook verification token
GOOGLE_CLIENT_EMAIL     // Google Service Account email
GOOGLE_PRIVATE_KEY      // Google Service Account private key
GOOGLE_CALENDAR_ID      // Google Calendar ID
CRM_URL                 // External CRM API URL
CRM_TOKEN               // CRM API authentication token
```

---

## 🔄 Integration Flows

### 1. WhatsApp → AI → Supabase

**Flow:**
```
WhatsApp Message → Supabase Edge Function → AI Service (Gemini/OpenAI) → Save to DB → Send Reply
```

**Implementation:**
- Webhook: `supabase/functions/whatsapp/index.ts`
- Handles webhook verification (GET)
- Processes incoming messages (POST)
- Generates AI response with conversation history
- Saves to `conversation_history` table
- Sends WhatsApp reply

**Deploy:**
```bash
supabase functions deploy whatsapp
```

**Webhook URL:**
```
https://[project-ref].supabase.co/functions/v1/whatsapp
```

---

### 2. Appointment Booking → Google Calendar

**Flow:**
```
Booking Request → Create Calendar Event → Save to DB → Confirm via WhatsApp
```

**Implementation:**
- API: `app/api/calendar/route.ts`
- Service: `src/lib/calendar.ts`
- Creates Google Calendar event
- Saves appointment to `appointments` table
- Links `calendar_event_id` for updates/cancellations

**Usage:**
```typescript
POST /api/calendar
{
  "action": "create",
  "patientName": "أحمد محمد",
  "phone": "+966501234567",
  "specialist": "أخصائي تخاطب",
  "date": "2024-01-20T10:00:00Z",
  "duration": 60
}
```

---

### 3. Billing → CRM Sync

**Flow:**
```
Create Invoice → Save to DB → Sync with CRM (non-blocking)
```

**Implementation:**
- API: `app/api/billing/route.ts`
- Creates billing record in `billing` table
- Optionally syncs with external CRM
- Non-blocking (continues even if CRM fails)

**Usage:**
```typescript
POST /api/billing
{
  "patientName": "أحمد محمد",
  "phone": "+966501234567",
  "amount": 500.00,
  "invoiceNumber": "INV-2024-001"
}
```

---

### 4. Digital Signature Storage

**Flow:**
```
Signature Capture → Upload to Supabase Storage → Save Metadata to DB
```

**Implementation:**
- API: `app/api/signature/route.ts`
- Uploads signature image to Supabase Storage (`documents` bucket)
- Saves metadata to `signatures` table
- Returns public URL

**Usage:**
```typescript
POST /api/signature
{
  "signature": "data:image/png;base64,...",
  "patientName": "أحمد محمد",
  "sessionId": "session-123",
  "documentType": "consent"
}
```

---

### 5. CRM Integration

**Flow:**
```
Any Event → Optional CRM Sync (non-blocking)
```

**Implementation:**
- API: `app/api/crm/route.ts`
- Generic sync endpoint
- Called from billing, appointments, etc.
- Non-blocking (doesn't fail if CRM unavailable)

**Usage:**
```typescript
POST /api/crm
{
  "action": "create_invoice",
  "patientId": "patient-123",
  "data": { /* ... */ }
}
```

---

## 🧠 AI Service

**Location:** `src/lib/ai.ts`

**Features:**
- Primary: Gemini 2.0 Flash (`gemini-2.0-flash-exp`)
- Fallback: OpenAI GPT-4o-mini
- Automatic fallback on errors
- Conversation history support
- Arabic + English support

**Usage:**
```typescript
import { askAI, generateWhatsAppResponse } from '@/lib/ai'

// Simple query
const response = await askAI('What services do you offer?')

// WhatsApp-specific (with context)
const response = await generateWhatsAppResponse(
  userMessage,
  userPhone,
  conversationHistory
)
```

**API Endpoint:**
```typescript
POST /api/ai
{
  "message": "What services do you offer?",
  "context": "Optional context"
}
```

---

## 📅 Google Calendar Integration

**Location:** `src/lib/calendar.ts`

**Features:**
- Create, update, delete events
- Automatic timezone handling (Asia/Riyadh)
- Appointment duration configuration
- Event ID linking for updates

**Functions:**
- `createEvent(patient, date, specialist, duration)`
- `updateEvent(eventId, updates)`
- `deleteEvent(eventId)`
- `getEvents(startDate, endDate)`

**Setup:**
1. Create Google Service Account
2. Enable Calendar API
3. Share calendar with service account email
4. Add credentials to Supabase settings

---

## 🚀 Deployment

### 1. Supabase Setup

```bash
# Apply schema
psql -h [db-host] -U postgres -d postgres -f supabase/schema.sql

# Deploy Edge Functions
supabase functions deploy whatsapp
supabase functions deploy autosync
```

### 2. Environment Variables

**Next.js (.env.local):**
```env
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]
```

**Supabase Edge Functions (via Dashboard):**
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `WHATSAPP_VERIFY_TOKEN` (optional, can use settings table)

### 3. WhatsApp Webhook Configuration

1. Go to Meta for Developers
2. Configure webhook URL: `https://[project-ref].supabase.co/functions/v1/whatsapp`
3. Set verify token (must match `WHATSAPP_VERIFY_TOKEN` in settings)
4. Subscribe to `messages` events

### 4. Google Calendar Setup

1. Create Service Account in Google Cloud Console
2. Enable Calendar API
3. Create JSON key file
4. Share calendar with service account email
5. Add credentials to Supabase settings via `/settings` page

---

## 📊 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ai` | POST | AI chat endpoint |
| `/api/calendar` | POST/GET | Calendar operations |
| `/api/crm` | POST | CRM sync |
| `/api/billing` | POST/PUT/GET | Billing management |
| `/api/signature` | POST/GET | Signature storage |
| `/api/settings` | GET/POST | Settings management |

---

## 🔍 Monitoring & Logs

### Supabase Edge Functions

View logs in Supabase Dashboard:
- Functions → whatsapp → Logs
- Functions → autosync → Logs

### Next.js API Routes

Check server logs for API route errors:
```bash
npm run dev  # Development
npm run start  # Production
```

### Database Queries

Monitor via Supabase Dashboard:
- Table Editor → View data
- SQL Editor → Run queries
- Logs → Database logs

---

## 🛠️ Troubleshooting

### WhatsApp Webhook Not Working

1. Check webhook URL is correct
2. Verify `WHATSAPP_VERIFY_TOKEN` matches
3. Check Supabase function logs
4. Verify WhatsApp token in settings

### AI Not Responding

1. Check `GEMINI_KEY` or `OPENAI_KEY` in settings
2. Verify API keys are valid
3. Check function logs for errors
4. Test AI endpoint directly: `POST /api/ai`

### Calendar Events Not Creating

1. Verify Google credentials in settings
2. Check calendar is shared with service account
3. Verify Calendar API is enabled
4. Check API route logs

### CRM Sync Failing

- CRM sync is **non-blocking** by design
- Check `CRM_URL` and `CRM_TOKEN` in settings
- Verify CRM API is accessible
- Check logs for specific errors

---

## 📝 Development

### Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Type checking
npx tsc --noEmit

# Linting
npm run lint
```

### Testing Edge Functions

Edge functions are deployed to Supabase Cloud and can be tested via the Supabase Dashboard or by calling the function endpoints directly.

---

## 🔐 Security

- **RLS Policies:** All tables protected
- **Service Role:** Only used server-side
- **API Keys:** Stored in Supabase settings (encrypted at rest)
- **Webhook Verification:** Token-based verification
- **Input Validation:** Zod schemas (where applicable)

---

## 📈 Next Steps

1. **Add Input Validation:** Zod schemas for all API routes
2. **Error Handling:** Custom error classes
3. **Rate Limiting:** Per-endpoint rate limits
4. **Caching:** Redis for hot data
5. **Monitoring:** Sentry for error tracking
6. **Testing:** Unit + integration tests

---

## ✅ Summary

**All 5 previous workflows merged:**
1. ✅ WhatsApp Booking Automation
2. ✅ AI Response System
3. ✅ Signature Confirmation
4. ✅ Billing Notification
5. ✅ CRM Sync

**Unified System:**
- ✅ No n8n dependencies
- ✅ All config in Supabase
- ✅ Real-time Google Calendar
- ✅ AI-driven communication (Arabic + English)
- ✅ Production-ready architecture

---

**✅ Himam Enterprise AI System setup complete — All previous workflows merged into unified Next.js + Supabase + Gemini platform.**
