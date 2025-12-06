# 📘 WhatsApp Integration Guide

## Overview

The Himam Enterprise AI System uses Meta WhatsApp Cloud API for patient communication, integrated with Supabase Edge Functions and AI services.

## Architecture

```
WhatsApp Message → Supabase Edge Function → AI Service → Database → Reply
```

## Setup Steps

### 1. Meta Developer Console Setup

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create/Select WhatsApp Business App
3. Get credentials:
   - **Access Token** (temporary or permanent)
   - **Phone Number ID**
   - **App ID** and **App Secret**

### 2. Configure Webhook

1. In Meta Developer Console → Configuration → Webhooks
2. Set **Callback URL**: `https://[your-project-ref].supabase.co/functions/v1/whatsapp`
3. Set **Verify Token**: (use a secure random string)
4. Subscribe to **messages** events
5. Click **Verify and Save**

### 3. Configure Settings in System

1. Navigate to `/settings` page
2. Fill in WhatsApp settings:
   - `WHATSAPP_TOKEN` - Meta Access Token
   - `WHATSAPP_PHONE_NUMBER_ID` - Phone Number ID
   - `WHATSAPP_VERIFY_TOKEN` - Same as webhook verify token
3. Save settings

### 4. Deploy Edge Function

```bash
supabase functions deploy whatsapp
```

## How It Works

1. **Webhook Verification (GET)**: Meta sends verification request
2. **Message Reception (POST)**: Meta sends message payload
3. **AI Processing**: Edge function calls AI service (Gemini/OpenAI)
4. **Database Storage**: Conversation saved to `conversation_history`
5. **Reply**: AI response sent back via WhatsApp API

## API Endpoints

### Edge Function
- **URL**: `https://[project-ref].supabase.co/functions/v1/whatsapp`
- **Methods**: GET (verification), POST (messages)

### Settings Management
- **GET** `/api/settings` - Get all settings
- **POST** `/api/settings` - Update settings

## Testing

### Test Webhook Verification

```bash
curl "https://[project-ref].supabase.co/functions/v1/whatsapp?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=test123"
```

### Test Message Flow

Send a WhatsApp message to your configured number and verify:
1. Message appears in `conversation_history` table
2. AI response is generated
3. Reply is sent back to user

## Troubleshooting

### Webhook Not Verified
- Check `WHATSAPP_VERIFY_TOKEN` matches Meta console
- Verify Edge Function is deployed
- Check Supabase function logs

### Messages Not Received
- Verify webhook is subscribed to `messages` events
- Check Edge Function logs for errors
- Verify phone number is connected to Meta app

### AI Not Responding
- Check `GEMINI_KEY` or `OPENAI_KEY` in settings
- Verify API keys are valid
- Check function logs for AI errors

## Security

- ✅ Verify token prevents unauthorized webhook access
- ✅ Service role key used only in Edge Functions (server-side)
- ✅ RLS policies protect conversation history
- ✅ API keys stored in Supabase settings (encrypted at rest)

## Files

- **Edge Function**: `supabase/functions/whatsapp/index.ts`
- **Settings API**: `app/api/settings/route.ts`
- **Settings Page**: `app/settings/page.tsx`
- **AI Service**: `src/lib/ai.ts`

---

**Last Updated**: 2025-01-15
