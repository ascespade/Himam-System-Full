# 🚀 Deployment Guide - Himam Enterprise AI System

This guide will walk you through deploying the Himam system to Vercel with Supabase as the backend.

## Prerequisites

- [ ] Supabase account ([supabase.com](https://supabase.com))
- [ ] Vercel account ([vercel.com](https://vercel.com))
- [ ] GitHub repository with your code
- [ ] All API keys ready (Gemini, OpenAI, WhatsApp, etc.)

---

## Step 1: Set Up Supabase Database

### 1.1 Create Supabase Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **"New Project"**
3. Fill in project details:
   - **Name**: `himam-system` (or your preferred name)
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to your users (e.g., `ap-southeast-1` for Middle East)
4. Click **"Create new project"**
5. Wait for project to be provisioned (~2 minutes)

### 1.2 Apply Database Schema

1. In your Supabase project, go to **SQL Editor** (left sidebar)
2. Click **"New query"**
3. Copy the entire contents of `supabase/complete_schema.sql`
4. Paste into the SQL editor
5. Click **"Run"** (or press `Ctrl+Enter`)
6. Verify success - you should see "Success. No rows returned"

### 1.3 Verify Database Setup

Run these verification queries in the SQL Editor:

```sql
-- Check all tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

Expected tables (13 total):

- admins
- appointments
- billing
- center_info ⭐
- content_items ⭐
- conversation_history
- patients
- sessions
- settings
- signatures
- specialists
- whatsapp_settings ⭐

```sql
-- Verify seed data
SELECT COUNT(*) FROM center_info;      -- Should return 1
SELECT COUNT(*) FROM content_items;    -- Should return 10
SELECT COUNT(*) FROM specialists;      -- Should return 3
SELECT COUNT(*) FROM patients;         -- Should return 3
```

### 1.4 Create Storage Bucket

1. Go to **Storage** in Supabase dashboard
2. Click **"Create a new bucket"**
3. Bucket name: `documents`
4. Public bucket: **Yes** (for signature images)
5. Click **"Create bucket"**

### 1.5 Get API Keys

1. Go to **Settings** → **API** in Supabase dashboard
2. Copy these values (you'll need them for Vercel):
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public**: `eyJhbGc...` (starts with eyJ)
   - **service_role**: `eyJhbGc...` (⚠️ Keep this secret!)

---

## Step 2: Configure Vercel Project

### 2.1 Connect GitHub Repository

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **"Import Git Repository"**
3. Select your GitHub repository
4. Click **"Import"**

### 2.2 Configure Build Settings

Vercel should auto-detect Next.js. Verify these settings:

- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

#### Optional - Google Calendar

```bash
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
NEXT_PUBLIC_GOOGLE_CLIENT_SECRET=your_google_client_secret
```

#### Optional - CRM Integration

```bash
NEXT_PUBLIC_CRM_API_URL=https://crm.al-himam.com/api
NEXT_PUBLIC_CRM_API_KEY=your_crm_token
```

#### Optional - N8N Automation

```bash
NEXT_PUBLIC_N8N_URL=https://your-n8n-instance.com
```

> **Note**: Only add the variables you actually need. The system will work without optional integrations.

### 2.4 Deploy

1. Click **"Deploy"**
2. Wait for build to complete (~2-3 minutes)
3. Once deployed, click **"Visit"** to see your site

---

## Step 3: Post-Deployment Verification

### 3.1 Test Homepage

Visit your deployed URL and verify:

- ✅ Page loads without errors
- ✅ Services section displays (should show 3 services)
- ✅ Specialists section displays (should show 3 specialists)
- ✅ Footer loads with center information
- ✅ No console errors (press F12 to check)

### 3.2 Test API Endpoints

Open these URLs in your browser (replace `your-domain` with your Vercel URL):

```bash
# Test specialists API
https://your-domain.vercel.app/api/specialists

# Test patients API
https://your-domain.vercel.app/api/patients

# Test services API
https://your-domain.vercel.app/api/services

# Test center info API
https://your-domain.vercel.app/api/center/info
```

Each should return JSON data without errors.

### 3.3 Test Dashboard

Visit: `https://your-domain.vercel.app/dashboard/admin`

- ✅ Page loads
- ✅ Patient and specialist counts display
- ✅ Data tables load

### 3.4 Check Browser Console

1. Press **F12** to open Developer Tools
2. Go to **Console** tab
3. Refresh the page
4. Verify:
   - ❌ No Supabase connection errors
   - ❌ No "table does not exist" errors
   - ❌ No authentication errors

---

## Step 4: Update Center Information

### 4.1 Update via Supabase Dashboard

1. Go to Supabase → **Table Editor**
2. Select `center_info` table
3. Click on the single row to edit
4. Update with your actual information:
   - Center name (Arabic & English)
   - Description
   - Address
   - Phone numbers
   - Email
   - etc.
5. Click **"Save"**

### 4.2 Add Your Services

1. Go to `content_items` table
2. Filter by `type = 'service'`
3. Edit existing services or add new ones
4. Set `is_active = true` for services you want to show

### 4.3 Add Your Specialists

1. Go to `specialists` table
2. Add your actual specialists
3. Include: name, specialty, nationality, email

---

## Step 5: Optional Integrations

### 5.1 WhatsApp Integration

If you want WhatsApp booking:

1. Set up Meta WhatsApp Business API
2. Add environment variables in Vercel
3. Configure webhook URL: `https://your-domain.vercel.app/api/whatsapp`
4. Add settings to `whatsapp_settings` table

### 5.2 Google Calendar Integration

If you want calendar sync:

1. Create Google Service Account
2. Enable Google Calendar API
3. Add credentials to Vercel environment variables
4. Update `settings` table with calendar ID

### 5.3 AI Chat Widget

If you want AI chat:

1. Add Gemini or OpenAI API key to Vercel
2. The chat widget will automatically appear on the homepage

---

## Troubleshooting

### Build Fails

**Error**: `Module not found` or `Cannot find module`

- **Fix**: Run `npm install` locally and commit `package-lock.json`

**Error**: TypeScript errors

- **Fix**: Run `npm run build` locally to identify issues

### Runtime Errors

**Error**: `relation "table_name" does not exist`

- **Fix**: Run `complete_schema.sql` in Supabase SQL Editor

**Error**: `Invalid API key` or `Unauthorized`

- **Fix**: Check environment variables in Vercel dashboard
- **Fix**: Verify `SUPABASE_SERVICE_ROLE_KEY` is set

**Error**: Empty pages or missing data

- **Fix**: Check Supabase Table Editor for data
- **Fix**: Verify seed data was inserted

### Performance Issues

**Slow page loads**

- Check Supabase region (should be close to users)
- Verify indexes are created (run schema again)
- Check Vercel region settings

---

## Security Checklist

Before going live:

- [ ] Change default passwords in Supabase
- [ ] Verify RLS policies are enabled
- [ ] Keep `SUPABASE_SERVICE_ROLE_KEY` secret (never commit to Git)
- [ ] Enable HTTPS only (Vercel does this automatically)
- [ ] Review and update CORS settings if needed
- [ ] Set up monitoring and error tracking

---

## Maintenance

### Regular Updates

1. **Update dependencies**: Run `npm update` monthly
2. **Backup database**: Use Supabase automatic backups
3. **Monitor logs**: Check Vercel and Supabase logs weekly
4. **Update content**: Keep services and specialists info current

### Scaling

As your traffic grows:

1. **Upgrade Supabase plan** if needed
2. **Upgrade Vercel plan** for more bandwidth
3. **Add caching** for frequently accessed data
4. **Optimize images** and assets

---

## Support

If you encounter issues:

1. Check Vercel deployment logs
2. Check Supabase logs (Database → Logs)
3. Review browser console for errors
4. Check this documentation again

---

## Quick Reference

### Important URLs

- **Supabase Dashboard**: https://supabase.com/dashboard
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Your Site**: https://your-domain.vercel.app

### Important Files

- **Database Schema**: `supabase/complete_schema.sql`
- **Environment Variables**: `.env.example` (template)
- **Vercel Config**: `vercel.json`
- **Next.js Config**: `next.config.js`

### Key Commands

```bash
# Local development
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

---

**🎉 Congratulations!** Your Himam Enterprise AI System is now deployed and ready to use!
