# Comprehensive Implementation Plan - All Phases

## Executive Summary

**Project:** Himam System - Production Hardening  
**Status:** Phase 1 Infrastructure Complete, Rollout In Progress  
**Scale:** 157 API routes, 85+ dashboard pages, 7,630+ TypeScript files

## Phase 1: Security & Stability (IN PROGRESS)

### ✅ Completed
1. **Rate Limiting Infrastructure**
   - Created `@/core/security/rateLimit.ts`
   - Created `@/core/api/middleware/withRateLimit.ts`
   - Created `@/core/api/middleware/applyRateLimit.ts`
   - Three rate limiters: api (100/min), auth (5/15min), strict (10/min)

2. **Input Sanitization**
   - Created `@/core/security/sanitize.ts`
   - Created `@/shared/validations/sanitized.validations.ts`
   - Functions: sanitizeHtml, sanitizeText, sanitizeUrl, sanitizeEmail, sanitizePhone

3. **Health & Readiness**
   - `/api/health` - Liveness probe
   - `/api/ready` - Readiness probe (DB, Redis)

4. **Error Tracking**
   - Enhanced Sentry with PII redaction
   - Integrated logger with Sentry

5. **Code Hygiene**
   - ESLint rules for console.log and select('*')
   - CI script: `scripts/check-code-hygiene.sh`
   - Console.log replacements: ✅ 100% complete

### 🟡 In Progress
- **Rate Limiting:** 9/157 routes (5.7%)
- **Select('*') Fixes:** 9/157 routes (5.7%)

### 📋 Remaining
- 148 routes need rate limiting
- ~88 routes need select('*') fixes
- All routes need Zod validation with sanitization

## Implementation Strategy

Given the massive scale, I'll use an efficient batch approach:

### Batch Processing Pattern

**For routes WITHOUT params:**
```typescript
import { withRateLimit } from '@/core/api/middleware/withRateLimit'

export const GET = withRateLimit(async function GET(req: NextRequest) {
  // ... handler
}, 'api')
```

**For routes WITH params:**
```typescript
import { applyRateLimitCheck, addRateLimitHeadersToResponse } from '@/core/api/middleware/applyRateLimit'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const rateLimitResponse = await applyRateLimitCheck(req, 'api')
  if (rateLimitResponse) return rateLimitResponse
  
  // ... handler
  
  const response = NextResponse.json(...)
  addRateLimitHeadersToResponse(response, req, 'api')
  return response
}
```

### Priority Batches

**Batch 1: Critical High-Traffic Routes** (Next)
- `/api/doctor/*` (all doctor routes)
- `/api/reception/*` (all reception routes)
- `/api/insurance/*` (all insurance routes)

**Batch 2: Standard Routes**
- `/api/billing/*`
- `/api/guardian/*`
- `/api/supervisor/*`

**Batch 3: Remaining Routes**
- All other routes

## Phase 2: Tests & Confidence (PENDING)

### Tasks
1. **Vitest Setup**
   - Create `vitest.config.ts`
   - Configure path aliases
   - Set coverage thresholds

2. **Unit Tests**
   - Critical services (auth, patients, appointments)
   - Mock repositories, not Supabase SDK
   - Target: >=60% coverage

3. **Integration Tests**
   - Auth routes
   - Booking routes
   - Validate status codes and payloads

## Phase 3: Performance (PENDING)

### Tasks
1. **Pagination**
   - Create shared pagination helper
   - Apply to all list endpoints
   - Enforce max limits

2. **Database Indexes**
   - Audit slow queries
   - Add indexes on FK, status, date columns
   - Verify with EXPLAIN ANALYZE

3. **Redis Caching**
   - Implement cache manager
   - Cache heavy read queries
   - Invalidate on mutations

## Current Progress

- **Phase 1:** 🟡 5.7% complete (infrastructure ready, rollout in progress)
- **Phase 2:** ⏸️ Waiting for Phase 1 completion
- **Phase 3:** ⏸️ Waiting for Phase 1 completion

## Next Immediate Actions

1. Fix remaining TypeScript error in `app/api/doctor/sessions/route.ts`
2. Continue batch processing routes (starting with doctor routes)
3. Apply rate limiting + fix select('*') together
4. Ensure Zod validation on all inputs
5. Run validation after each batch

## Estimated Completion

- **Phase 1:** ~2-3 hours (systematic batch processing)
- **Phase 2:** ~3-4 hours (test setup + writing tests)
- **Phase 3:** ~2-3 hours (pagination + indexes + caching)

**Total Estimated Time:** 7-10 hours of systematic work
