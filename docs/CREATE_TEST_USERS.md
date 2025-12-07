# Creating Test Users for Himam System

## Problem
Only the admin user can login because other users (doctor, reception, insurance) don't exist in the database yet.

## Solution
You need to create users in Supabase Dashboard, then assign them roles.

---

## Step-by-Step Instructions

### 1. Go to Supabase Dashboard
1. Open https://supabase.com/dashboard
2. Select your project: **Himam-System-Full**
3. Click **Authentication** in the left sidebar
4. Click **Users** tab

### 2. Create Doctor User
1. Click **Add User** button
2. Fill in:
   - **Email**: `doctor@himam.com`
   - **Password**: `Doctor@123`
   - **Auto Confirm User**: ✅ (check this box)
3. Click **Create User**

### 3. Create Reception User
1. Click **Add User** button
2. Fill in:
   - **Email**: `reception@himam.com`
   - **Password**: `Reception@123`
   - **Auto Confirm User**: ✅ (check this box)
3. Click **Create User**

### 4. Create Insurance User
1. Click **Add User** button
2. Fill in:
   - **Email**: `insurance@himam.com`
   - **Password**: `Insurance@123`
   - **Auto Confirm User**: ✅ (check this box)
3. Click **Create User**

### 5. Assign Roles via SQL
1. Go to **SQL Editor** in Supabase Dashboard
2. Click **New Query**
3. Paste this SQL:

```sql
-- Update doctor role
UPDATE public.users
SET role = 'doctor',
    name = 'Dr. Ahmed Hassan',
    specialty = 'General Practitioner'
WHERE email = 'doctor@himam.com';

-- Update reception role
UPDATE public.users
SET role = 'reception',
    name = 'Sara Mohammed'
WHERE email = 'reception@himam.com';

-- Update insurance role
UPDATE public.users
SET role = 'insurance',
    name = 'Fatima Ali'
WHERE email = 'insurance@himam.com';

-- Verify users
SELECT id, email, name, role, specialty
FROM public.users
ORDER BY role;
```

4. Click **Run** (or press Ctrl+Enter)
5. Check the results to confirm all users have correct roles

---

## Test Login Credentials

After completing the steps above, you can login with:

### Admin
- **Email**: `admin@himam.com`
- **Password**: `Admin@123`

### Doctor
- **Email**: `doctor@himam.com`
- **Password**: `Doctor@123`

### Reception
- **Email**: `reception@himam.com`
- **Password**: `Reception@123`

### Insurance
- **Email**: `insurance@himam.com`
- **Password**: `Insurance@123`

---

## Troubleshooting

### If login still fails:
1. Check that users exist in **Authentication > Users**
2. Verify roles in SQL Editor:
   ```sql
   SELECT email, name, role FROM public.users;
   ```
3. Make sure `handle_new_user()` trigger is active:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   ```

### If trigger is missing:
Run this in SQL Editor:
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role, phone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'New User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'reception'),
    COALESCE(NEW.raw_user_meta_data->>'phone', '0000000000')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## Next Steps
After creating users, test each role:
1. Login as **doctor** → Should see Doctor Dashboard
2. Login as **reception** → Should see Reception Queue
3. Login as **insurance** → Should see Insurance Claims
4. Login as **admin** → Should see Admin Dashboard with all features
