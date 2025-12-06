# 🚀 Vercel Deployment Instructions

## 📋 Quick Start

### Step 1: Login to Vercel
```bash
npx vercel login
```
This will open a browser window for authentication.

### Step 2: Link Project
```bash
npx vercel link
```
- Choose: **Create a new project**
- Project name: `himam-system` (or any name you prefer)
- Directory: `./` (current directory)

### Step 3: Add Environment Variables

**Option A: Via Vercel Dashboard (Recommended)**
1. Go to: https://vercel.com/dashboard
2. Select your project
3. Go to **Settings → Environment Variables**
4. Add all variables from `VERCEL_ENV_VARS.txt`

**Option B: Via CLI**
```bash
./add-vercel-env.sh
```

Or manually:
```bash
echo "https://gpcxowqljayhkxyybfqu.supabase.co" | npx vercel env add NEXT_PUBLIC_SUPABASE_URL production
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." | npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
# ... continue for all variables
```

### Step 4: Deploy
```bash
npx vercel --prod
```

---

## 🔑 Required Environment Variables

All variables are listed in `VERCEL_ENV_VARS.txt`. Key variables:

1. **Supabase:**
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `DATABASE_URL`

2. **AI:**
   - `GEMINI_API_KEY`

3. **WhatsApp:**
   - `META_ACCESS_TOKEN`
   - `META_PHONE_NUMBER_ID`
   - `WHATSAPP_ACCESS_TOKEN`
   - `WHATSAPP_PHONE_NUMBER_ID`

4. **Other:**
   - `GITHUB_TOKEN`
   - `NODE_ENV=production`

---

## 🚀 Automated Deployment

Use the quick deploy script:
```bash
./quick-deploy.sh
```

This will:
1. Add all environment variables
2. Deploy to production

---

## 📝 Post-Deployment

### 1. Update Webhook URLs
After deployment, update:
- n8n webhook URLs with new Vercel domain
- WhatsApp webhook URLs
- Any external service URLs

### 2. Verify Deployment
- Check deployment URL
- Test API routes
- Verify environment variables are loaded

### 3. Custom Domain (Optional)
- Add custom domain in Vercel dashboard
- Configure DNS records
- SSL is automatic

---

## 🔗 Useful Commands

```bash
# View deployments
npx vercel ls

# View logs
npx vercel logs

# View environment variables
npx vercel env ls

# Remove deployment
npx vercel remove
```

---

**Status:** Ready for Deployment  
**Date:** 2025-12-06

