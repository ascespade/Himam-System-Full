# Phase 1 Full Rollout Strategy

## Current Status
- ✅ Infrastructure: Complete
- ✅ Console.log replacements: Complete (0 remaining)
- 🟡 Rate limiting: 9/157 routes (5.7%)
- 🟡 Select('*') fixes: 9/157 routes (5.7%)

## Approach for Remaining 148 Routes

Given the scale (148 routes), I'll use a systematic batch approach:

### Batch 1: Critical Routes (High Traffic)
- `/api/users/*`
- `/api/doctor/*` (all doctor routes)
- `/api/reception/*`
- `/api/insurance/*`

### Batch 2: Standard Routes
- `/api/billing/*`
- `/api/guardian/*`
- `/api/supervisor/*`
- `/api/system/*`

### Batch 3: Remaining Routes
- All other routes

## Implementation Pattern

For routes WITHOUT params:
```typescript
export const GET = withRateLimit(async function GET(req: NextRequest) {
  // ... handler code
}, 'api')
```

For routes WITH params:
```typescript
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const rateLimitResponse = await applyRateLimitCheck(req, 'api')
  if (rateLimitResponse) return rateLimitResponse
  
  // ... handler code
  
  const response = NextResponse.json(...)
  addRateLimitHeadersToResponse(response, req, 'api')
  return response
}
```

## Next Steps
1. Continue batch processing routes
2. Fix select('*') as we go
3. Ensure Zod validation on all inputs
4. Move to Phase 2 once Phase 1 is complete
