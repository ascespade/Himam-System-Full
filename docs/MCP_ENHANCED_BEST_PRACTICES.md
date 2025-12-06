# 🚀 MCP-Enhanced Best Practices for Himam Enterprise System

This document incorporates insights from Supabase MCP tools to optimize the Himam Enterprise AI System.

---

## 📋 Table of Contents

1. [Edge Functions Best Practices](#edge-functions-best-practices)
2. [Row Level Security (RLS) Optimization](#row-level-security-rls-optimization)
3. [Service Role Usage](#service-role-usage)
4. [Performance Recommendations](#performance-recommendations)
5. [Error Handling Patterns](#error-handling-patterns)

---

## 🔧 Edge Functions Best Practices

### 1. Function Organization

**Current Structure:**
```
supabase/functions/
├── whatsapp/index.ts      # WhatsApp webhook handler
└── autosync/index.ts      # Real-time sync handler
```

**Best Practices:**
- ✅ Use "fat functions" - fewer large functions vs many small ones
- ✅ Share code via `_shared` folder (prefixed with underscore)
- ✅ Use Deno import maps for dependency management

**Recommended Structure:**
```
supabase/functions/
├── _shared/
│   ├── supabase-admin.ts  # Service role client
│   ├── cors.ts            # CORS headers
│   └── ai-helper.ts       # Shared AI logic
├── whatsapp/
│   └── index.ts
└── autosync/
    └── index.ts
```

### 2. Resource Limits

**Current Limits:**
- **Wall Clock Time:** 400 seconds (total elapsed time)
- **CPU Time:** 200ms (actual processing)
- **Memory:** Varies by function

**Optimization Tips:**
- ✅ Use streaming for large responses
- ✅ Process data in chunks
- ✅ Avoid loading entire datasets into memory
- ✅ Use `EarlyDrop` shutdown (indicates efficient execution)

### 3. Error Handling

**Current Pattern:**
```typescript
try {
  // Operation
} catch (error) {
  console.error('Error:', error)
  return new Response(JSON.stringify({ error: error.message }), { status: 500 })
}
```

**Enhanced Pattern:**
```typescript
import { FunctionsHttpError, FunctionsRelayError, FunctionsFetchError } from '@supabase/supabase-js'

try {
  // Operation
} catch (error) {
  if (error instanceof FunctionsHttpError) {
    const errorMessage = await error.context.json()
    console.error('Function returned error:', errorMessage)
  } else if (error instanceof FunctionsRelayError) {
    console.error('Relay error:', error.message)
  } else if (error instanceof FunctionsFetchError) {
    console.error('Fetch error:', error.message)
  }
  
  return new Response(
    JSON.stringify({ 
      success: false, 
      error: error.message || 'Internal server error' 
    }),
    { status: 500, headers: corsHeaders }
  )
}
```

### 4. Regional Invocations

For database-intensive operations, execute functions in the same region as your database:

```typescript
// In Next.js API routes
const { data, error } = await supabase.functions.invoke('whatsapp', {
  body: { /* ... */ },
  region: FunctionRegion.UsEast1  // Match your database region
})
```

**Available Regions:**
- `ap-northeast-1` (Tokyo)
- `ap-southeast-1` (Singapore)
- `us-east-1` (N. Virginia) ⭐ Recommended for most
- `eu-west-1` (Ireland)
- `sa-east-1` (São Paulo)

---

## 🔒 Row Level Security (RLS) Optimization

### 1. Service Role vs Anon Key

**Current Setup:**
- ✅ Service role used in Edge Functions (bypasses RLS)
- ✅ Anon key used in client-side code (enforces RLS)

**Best Practice:**
```typescript
// Edge Functions - Use service role
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!  // Bypasses RLS
)

// Client-side - Use anon key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!  // Enforces RLS
)
```

### 2. RLS Policy Performance

**Current Policies:**
```sql
CREATE POLICY "settings_service_role_all" ON settings
  FOR ALL USING (auth.role() = 'service_role');
```

**Optimized Pattern:**
```sql
-- ✅ GOOD: Use SELECT wrapper for auth functions
CREATE POLICY "settings_service_role_all" ON settings
  FOR ALL USING ((select auth.role()) = 'service_role');

-- ❌ SLOW: Direct function call (evaluated per row)
CREATE POLICY "settings_service_role_all" ON settings
  FOR ALL USING (auth.role() = 'service_role');
```

**Performance Impact:**
- Wrapping `auth.uid()` in `SELECT` improves performance by **94.97%**
- Allows Postgres to cache results per-statement

### 3. Index Optimization

**Current Indexes:**
```sql
CREATE INDEX IF NOT EXISTS idx_conversation_history_user_phone ON conversation_history(user_phone);
CREATE INDEX IF NOT EXISTS idx_appointments_phone ON appointments(phone);
```

**Additional Recommendations:**
```sql
-- Add indexes on columns used in RLS policies
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_user_id ON billing(user_id);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_appointments_status_date ON appointments(status, date);
```

### 4. Policy Role Specification

**Always specify roles explicitly:**
```sql
-- ✅ GOOD: Explicit role
CREATE POLICY "user_select" ON posts
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- ❌ SLOW: No role specified (evaluates for all roles)
CREATE POLICY "user_select" ON posts
  USING ((select auth.uid()) = user_id);
```

**Performance Impact:**
- Specifying `TO authenticated` improves performance by **99.78%** for anon users

---

## 🔑 Service Role Usage

### When to Use Service Role

**✅ Use Service Role For:**
- Edge Functions (server-side operations)
- Admin operations (settings management)
- Background jobs
- Webhook handlers
- Operations that need to bypass RLS

**❌ Never Use Service Role For:**
- Client-side code
- User-facing operations
- Public API endpoints (unless absolutely necessary)

### Security Considerations

**Current Implementation:**
```typescript
// ✅ CORRECT: Service role in server-side only
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!  // Server-side only
)
```

**Security Checklist:**
- ✅ Service role key never exposed to client
- ✅ Stored in environment variables only
- ✅ Used only in API routes and Edge Functions
- ✅ RLS enabled on all tables
- ✅ Service role policies restrict access appropriately

---

## ⚡ Performance Recommendations

### 1. Database Queries

**Optimize RLS Policies:**
```sql
-- ✅ Use SELECT wrapper
USING ((select auth.uid()) = user_id)

-- ✅ Add explicit role
TO authenticated

-- ✅ Add indexes on filtered columns
CREATE INDEX idx_posts_user_id ON posts(user_id);
```

### 2. Edge Functions

**Memory Management:**
```typescript
// ✅ GOOD: Stream responses
return new Response(readableStream, {
  headers: { 'Content-Type': 'application/json' }
})

// ❌ BAD: Load entire dataset
const allData = await fetchAllData()  // Could exceed memory limit
return new Response(JSON.stringify(allData))
```

**CPU Optimization:**
```typescript
// ✅ GOOD: Process in chunks
for (const batch of batches) {
  await processBatch(batch)
  await saveProgress(batchId)
}

// ❌ BAD: Process everything at once
await processAll(data)  // Could exceed CPU time
```

### 3. Query Patterns

**Always Add Filters:**
```typescript
// ✅ GOOD: Explicit filter (even if RLS handles it)
const { data } = await supabase
  .from('appointments')
  .select('*')
  .eq('user_id', userId)  // Helps query planner

// ❌ SLOW: No filter (relies only on RLS)
const { data } = await supabase
  .from('appointments')
  .select('*')  // Postgres can't optimize as well
```

---

## 🛡️ Error Handling Patterns

### Edge Functions

**Comprehensive Error Handling:**
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  try {
    // Main logic
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    // Log error with context
    console.error('Function error:', {
      error: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method
    })
    
    // Return appropriate error response
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error' 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
})
```

### API Routes

**Structured Error Responses:**
```typescript
export async function POST(req: NextRequest) {
  try {
    // Validation
    const body = await req.json()
    if (!body.requiredField) {
      return NextResponse.json(
        { success: false, error: 'Missing required field' },
        { status: 400 }
      )
    }

    // Business logic
    const result = await processRequest(body)

    return NextResponse.json({ success: true, data: result })
  } catch (error: any) {
    // Log for monitoring
    console.error('API Error:', {
      error: error.message,
      stack: error.stack,
      endpoint: req.url
    })

    // Return user-friendly error
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error'
      },
      { status: 500 }
    )
  }
}
```

---

## 📊 Monitoring & Observability

### Edge Function Logs

**Access Logs:**
- Supabase Dashboard → Functions → [Function Name] → Logs
- View shutdown reasons, CPU time, memory usage

**Key Metrics to Monitor:**
- `EarlyDrop` - Good (efficient execution)
- `WallClockTime` - Function taking too long
- `CPUTime` - Too much computation
- `Memory` - Memory limit exceeded

### Performance Tracking

**Add Performance Logging:**
```typescript
const startTime = Date.now()

try {
  // Operation
  const duration = Date.now() - startTime
  
  if (duration > 1000) {
    console.warn('Slow operation:', { duration, operation: 'whatsapp-reply' })
  }
} catch (error) {
  const duration = Date.now() - startTime
  console.error('Operation failed:', { duration, error: error.message })
}
```

---

## ✅ Implementation Checklist

### Edge Functions
- [ ] Use service role for database operations
- [ ] Implement proper error handling
- [ ] Add CORS headers
- [ ] Use streaming for large responses
- [ ] Monitor shutdown reasons
- [ ] Add performance logging

### RLS Policies
- [ ] Enable RLS on all tables
- [ ] Use `SELECT` wrapper for auth functions
- [ ] Specify roles explicitly (`TO authenticated`)
- [ ] Add indexes on filtered columns
- [ ] Test policies with different user roles

### Performance
- [ ] Add indexes on frequently queried columns
- [ ] Use explicit filters in queries
- [ ] Process data in chunks
- [ ] Monitor query performance
- [ ] Optimize RLS policies

### Security
- [ ] Service role never exposed to client
- [ ] RLS enabled on all tables
- [ ] Input validation on all endpoints
- [ ] Error messages don't leak sensitive info
- [ ] Proper authentication checks

---

## 📚 Additional Resources

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [RLS Performance Guide](https://github.com/orgs/supabase/discussions/14576)
- [Edge Function Limits](https://supabase.com/docs/guides/functions/limits)
- [RLS Best Practices](https://supabase.com/docs/guides/database/postgres/row-level-security)

---

**Last Updated:** Based on Supabase MCP documentation insights  
**Version:** 2.0.0

