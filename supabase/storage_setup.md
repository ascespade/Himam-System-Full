# 📦 Supabase Storage Setup Guide

## ✅ Features Status

- **Vector Extension:** ✅ Enabled (v0.8.0)
- **Realtime:** ✅ Enabled for all tables
- **Storage:** ⏳ Needs manual setup (see below)

## 🗄️ Storage Buckets Setup

### Required Buckets

You need to create these buckets in Supabase Dashboard:

#### 1. **documents** (Private)
- **Purpose:** Medical documents, reports, signed documents
- **Public:** ❌ No (Private)
- **File Size Limit:** 50MB
- **Allowed MIME Types:**
  - `image/*`
  - `application/pdf`
  - `application/msword`
  - `application/vnd.openxmlformats-officedocument.wordprocessingml.document`

#### 2. **signatures** (Private)
- **Purpose:** Digital signatures captured from patients
- **Public:** ❌ No (Private)
- **File Size Limit:** 5MB
- **Allowed MIME Types:**
  - `image/png`
  - `image/jpeg`

#### 3. **media** (Public)
- **Purpose:** Public assets (images, videos for website)
- **Public:** ✅ Yes (Public)
- **File Size Limit:** 100MB
- **Allowed MIME Types:**
  - `image/*`
  - `video/*`

## 📋 Setup Steps

### Via Supabase Dashboard

1. **Go to Storage:**
   ```
   https://supabase.com/dashboard/project/gpcxowqljayhkxyybfqu/storage/buckets
   ```

2. **Create Each Bucket:**
   - Click "New bucket"
   - Enter bucket name
   - Set public/private
   - Configure file size limits
   - Save

3. **Set Up Policies:**
   - Go to Storage → Policies
   - Create policies for each bucket:
     - **documents:** Only authenticated users can upload, admins can read all
     - **signatures:** Only authenticated users can upload/read their own
     - **media:** Public read, authenticated upload

### Storage Policies SQL

```sql
-- Documents bucket policies
CREATE POLICY "Users can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Admins can read all documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'documents' AND (auth.jwt() ->> 'role')::text = 'admin');

CREATE POLICY "Users can read their own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Signatures bucket policies
CREATE POLICY "Users can upload signatures"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'signatures');

CREATE POLICY "Users can read their own signatures"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'signatures' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Media bucket policies (public read)
CREATE POLICY "Public can read media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'media');

CREATE POLICY "Authenticated users can upload media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'media');
```

## 🔗 Quick Links

- **Storage Dashboard:** https://supabase.com/dashboard/project/gpcxowqljayhkxyybfqu/storage/buckets
- **Storage Policies:** https://supabase.com/dashboard/project/gpcxowqljayhkxyybfqu/storage/policies

## ✅ Verification

After setup, verify buckets exist:

```sql
SELECT name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets;
```

Expected:
- `documents` (private)
- `signatures` (private)
- `media` (public)

---

**Note:** Storage buckets must be created via Supabase Dashboard as they require special permissions.

