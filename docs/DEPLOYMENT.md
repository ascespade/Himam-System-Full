# Deployment Guide

## Pre-Deployment Checklist

- [ ] All environment variables configured in `.env`
- [ ] Supabase database schema imported
- [ ] Supabase seed data imported
- [ ] Supabase RLS policies applied
- [ ] Supabase Storage bucket `documents` created
- [ ] n8n workflows imported and configured
- [ ] API credentials verified (WhatsApp, Google Calendar, AI APIs)
- [ ] CRM API endpoint configured (if applicable)

## Deployment Steps

### 1. Create Deployment Package

```bash
node setup-enterprise.mjs zip
```

This creates `Himam-System-Full.zip` in the parent directory.

### 2. Deploy to Vercel

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy:
   ```bash
   vercel
   ```

4. Add environment variables in Vercel Dashboard:
   - Go to Project Settings → Environment Variables
   - Add all variables from `.env.example`

5. Deploy to production:
   ```bash
   vercel --prod
   ```

### 3. Deploy to Render

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Configure:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment**: Node

4. Add all environment variables in Render Dashboard

5. Deploy

### 4. Post-Deployment

1. **Update n8n webhook URLs** to point to your production domain
2. **Configure WhatsApp webhook** to point to `https://yourdomain.com/api/whatsapp`
3. **Test all integrations**:
   - Patient booking
   - WhatsApp messaging
   - Calendar events
   - AI responses
   - Signature capture

## Environment Variables Reference

See `.env.example` for all required environment variables.

## Troubleshooting

### Common Issues

1. **Supabase connection errors**: Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. **WhatsApp webhook not receiving messages**: Check webhook URL configuration in Meta Developer Console
3. **Calendar events not creating**: Verify Google Calendar OAuth credentials
4. **AI responses failing**: Check Gemini/OpenAI API keys

## Support

For deployment issues, contact: info@al-himam.com.sa

