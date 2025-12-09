# Himam Enterprise AI System - Flow Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Meta WhatsApp Cloud API                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ Webhook (POST/GET)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              Next.js API Routes (/api/whatsapp)                  │
│  • Webhook verification (GET)                                     │
│  • Message processing (POST)                                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ Process Message
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AI Service (lib/ai.ts)                        │
│  • Gemini 2.0 Flash (primary)                                    │
│  • OpenAI GPT-4o-mini (fallback)                               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ AI Response
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              Supabase Database                                   │
│  • conversation_history (log all interactions)                   │
│  • appointments (if booking detected)                          │
│  • settings (dynamic configuration)                             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ Store & Retrieve
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              WhatsApp Reply (Meta API)                           │
│  • Send AI response to user                                     │
└─────────────────────────────────────────────────────────────────┘
```

## Complete Integration Flow

### 1. WhatsApp Message Flow
```
User WhatsApp Message
    │
    ▼
Meta Webhook → /api/whatsapp (POST)
    │
    ├─→ Extract message & phone number
    │
    ├─→ Load conversation history from Supabase
    │
    ├─→ Generate AI response (Gemini/OpenAI)
    │
    ├─→ Save to conversation_history
    │
    └─→ Send reply via Meta WhatsApp API
```

### 2. Appointment Booking Flow
```
WhatsApp Message (booking request)
    │
    ▼
AI detects booking intent
    │
    ├─→ Extract: patient name, date, specialist
    │
    ├─→ Create Google Calendar event (lib/calendar.ts)
    │
    ├─→ Save to appointments table
    │
    ├─→ Sync with CRM (if configured)
    │
    └─→ Send confirmation via WhatsApp
```

### 3. Billing Flow
```
Admin creates invoice
    │
    ▼
POST /api/billing
    │
    ├─→ Save to billing table
    │
    ├─→ Sync with CRM (if configured)
    │
    └─→ Optional: Send notification via WhatsApp
```

### 4. Signature Flow
```
Patient signs consent form
    │
    ▼
POST /api/signature
    │
    ├─→ Upload to Supabase Storage
    │
    ├─→ Save metadata to signatures table
    │
    └─→ Return public URL
```

### 5. Settings Management Flow
```
Admin updates settings
    │
    ▼
POST /api/settings
    │
    ├─→ Update Supabase settings table
    │
    └─→ All services reload config dynamically
```

## Data Flow Table

| Flow | Source | Destination | Purpose | Technology |
|------|--------|-------------|---------|------------|
| WhatsApp → AI → Reply | Meta Webhook | Gemini/OpenAI → Meta API | Automated customer support | WhatsApp Cloud API + AI |
| Booking → Calendar | WhatsApp/Admin | Google Calendar | Schedule appointments | Google Calendar API |
| Billing → CRM | Admin Dashboard | External CRM | Sync invoices | REST API |
| Signature → Storage | Patient Form | Supabase Storage | Store consent forms | Supabase Storage |
| Settings → Services | Admin UI | Supabase → All Services | Dynamic configuration | Supabase Settings Table |

## Key Components

### 1. Configuration System (`lib/config.ts`)
- Centralized settings from Supabase `settings` table
- Dynamic reload without restart
- Fallback to environment variables

### 2. AI Service (`lib/ai.ts`)
- Primary: Gemini 2.0 Flash
- Fallback: OpenAI GPT-4o-mini
- Context-aware responses
- Conversation history support

### 3. Calendar Integration (`lib/calendar.ts`)
- Google Calendar API
- Create/Update/Delete events
- Automatic timezone handling (Asia/Riyadh)

### 4. WhatsApp Integration (`app/api/whatsapp/route.ts`)
- Webhook verification
- Message processing
- AI-powered responses
- Conversation logging

### 5. Supabase Edge Functions
- `whatsapp/index.ts`: WhatsApp webhook handler
- `autosync/index.ts`: Real-time sync events

## Database Schema

### settings
- `key` (TEXT PRIMARY KEY)
- `value` (TEXT)
- `description` (TEXT)
- `updated_at` (TIMESTAMPTZ)

### conversation_history
- `id` (UUID)
- `user_phone` (TEXT)
- `user_message` (TEXT)
- `ai_response` (TEXT)
- `session_id` (TEXT)
- `created_at` (TIMESTAMPTZ)

### appointments
- `id` (UUID)
- `patient_name` (TEXT)
- `phone` (TEXT)
- `specialist` (TEXT)
- `date` (TIMESTAMPTZ)
- `status` (TEXT)
- `calendar_event_id` (TEXT)

### billing
- `id` (UUID)
- `patient_name` (TEXT)
- `amount` (NUMERIC)
- `paid` (BOOLEAN)
- `invoice_number` (TEXT)

### signatures
- `id` (UUID)
- `patient_name` (TEXT)
- `session_id` (TEXT)
- `signature_url` (TEXT)
- `document_type` (TEXT)

## Deployment

### Supabase Edge Functions
```bash
# Deploy WhatsApp function
supabase functions deploy whatsapp

# Deploy autosync function
supabase functions deploy autosync
```

### Environment Variables (Optional - can use Supabase settings)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Initial Setup
1. Run `supabase/schema.sql` in Supabase SQL Editor
2. Configure settings via `/settings` page
3. Set up WhatsApp webhook in Meta Developer Console
4. Deploy Supabase Edge Functions

## Benefits of Unified System

✅ **No External Dependencies**: No n8n required
✅ **Centralized Config**: All settings in Supabase
✅ **Real-time Updates**: Settings changes apply immediately
✅ **Scalable**: Built on Next.js + Supabase
✅ **Maintainable**: Clean architecture, single codebase
✅ **Cost-effective**: No additional automation platform costs



