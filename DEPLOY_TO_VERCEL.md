# 🚀 Deploy to Vercel Guide

## 📋 Prerequisites

1. **Vercel Account:** Sign up at https://vercel.com
2. **Vercel CLI:** Install globally or use npx
3. **Environment Variables:** All required keys configured

---

## 🔧 Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

Or use npx (no installation needed):
```bash
npx vercel --prod
```

---

## 🔐 Step 2: Login to Vercel

```bash
vercel login
```

This will open a browser window for authentication.

---

## ⚙️ Step 3: Set Environment Variables

### Option A: Via Vercel Dashboard (Recommended)

1. Go to: https://vercel.com/dashboard
2. Create new project or select existing
3. Go to **Settings → Environment Variables**
4. Add all variables from `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://gpcxowqljayhkxyybfqu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
GEMINI_API_KEY=AIzaSyCc_WMALGhROTeUyq8gW8FbCjL6LZ_ubic
META_ACCESS_TOKEN=EAAekiSTO6eMBP38y3arfKP4MgrDi3UZB1Ggf59m693ZAN5BZBUm1TxggP9UsqASsnyBMwZBL0camlZALmDnD5yngKdGGFvEiLtsIUgtByWRvnZCJqZAeDI4iGGXbpCLpqyMwNLb8Dr7kS37254kdZCRnlv2XPcmyQ3poXO6kZA7iO0TpR0v5UOVd8ZBObKu8mG7yWPZAQZDZD
META_PHONE_NUMBER_ID=843049648895545
WHATSAPP_PHONE_NUMBER_ID=843049648895545
WHATSAPP_ACCESS_TOKEN=EAAekiSTO6eMBP38y3arfKP4MgrDi3UZB1Ggf59m693ZAN5BZBUm1TxggP9UsqASsnyBMwZBL0camlZALmDnD5yngKdGGFvEiLtsIUgtByWRvnZCJqZAeDI4iGGXbpCLpqyMwNLb8Dr7kS37254kdZCRnlv2XPcmyQ3poXO6kZA7iO0TpR0v5UOVd8ZBObKu8mG7yWPZAQZDZD
WHATSAPP_VERIFY_TOKEN=meta-webhook-verify-2025
GITHUB_TOKEN=[Your GitHub Token]
DATABASE_URL=postgresql://postgres.gpcxowqljayhkxyybfqu:LHiA1NpxJVHZyOf4@aws-1-eu-north-1.pooler.supabase.com:6543/postgres
NODE_ENV=production
```

### Option B: Via CLI

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
# ... repeat for all variables
```

---

## 🚀 Step 4: Deploy to Production

```bash
cd /media/kali/01DC66379D884460/Github/himam-setup/Himam-System-Full
vercel --prod
```

Or with npx:
```bash
npx vercel --prod
```

---

## 📝 Deployment Process

1. **Build:** Vercel will run `npm run build`
2. **Deploy:** Code is deployed to Vercel's edge network
3. **Domain:** You'll get a production URL (e.g., `himam-system.vercel.app`)

---

## ✅ Post-Deployment

### 1. Verify Deployment
- Check deployment URL
- Test all API routes
- Verify environment variables

### 2. Update Webhooks
- Update n8n webhook URLs with new domain
- Update WhatsApp webhook URLs
- Update any external service URLs

### 3. Custom Domain (Optional)
- Add custom domain in Vercel dashboard
- Configure DNS records
- Enable SSL (automatic)

---

## 🔗 Quick Commands

```bash
# Login
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod

# View deployments
vercel ls

# View logs
vercel logs

# Remove deployment
vercel remove
```

---

## ⚠️ Important Notes

1. **Environment Variables:** Must be set in Vercel dashboard
2. **Build Time:** First deployment may take 3-5 minutes
3. **Database:** Ensure Supabase allows connections from Vercel IPs
4. **Webhooks:** Update all webhook URLs after deployment
5. **Secrets:** Never commit `.env.local` to repository

---

**Status:** Ready for Deployment  
**Date:** 2025-12-06
