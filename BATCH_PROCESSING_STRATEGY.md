# Batch Processing Strategy for Remaining Routes

## Current Progress: 27/157 routes (17.2%)

### Completed Routes
- `/api/patients`
- `/api/appointments`
- `/api/appointments/[id]`
- `/api/notifications`
- `/api/billing/invoices`
- `/api/billing`
- `/api/doctor/sessions`
- `/api/doctor/queue`
- `/api/doctor/patients`
- `/api/doctor/appointments`
- `/api/doctor/profile`
- `/api/doctor/current-patient`
- `/api/doctor/video-sessions`
- `/api/doctor/analytics/performance`
- `/api/doctor/case-collaboration`
- `/api/doctor/progress-tracking`
- `/api/doctor/medical-records`
- `/api/doctor/risk-detection`
- `/api/doctor/search`
- `/api/doctor/export`
- `/api/doctor/auto-documentation`
- `/api/reception/queue`
- `/api/insurance/claims`
- `/api/health`
- `/api/ready`
- `/api/users`

## Remaining: 130 routes

### Next Batch Priority
1. Remaining `/api/doctor/*` routes (high traffic)
2. `/api/doctor/sessions/[id]` and other dynamic routes
3. `/api/doctor/treatment-plans/*`
4. `/api/doctor/schedule/*`
5. `/api/doctor/notes-templates/*`
6. `/api/doctor/slack/*`
7. `/api/doctor/insurance/*`
8. `/api/doctor/recordings/*`
9. `/api/doctor/video-settings/*`
10. `/api/doctor/dashboard/*`

Then continue with:
- `/api/guardian/*`
- `/api/supervisor/*`
- `/api/system/*`
- `/api/whatsapp/*` (webhooks excluded)
- `/api/slack/*` (webhooks excluded)
- All other routes

## Processing Pattern

For each route:
1. Add `import { withRateLimit } from '@/core/api/middleware/withRateLimit'`
2. Wrap handler: `export const GET = withRateLimit(async function GET(req: NextRequest) { ... }, 'api')`
3. Fix select('*') with specific columns
4. Ensure error handling uses logger
5. Run type-check after each batch

## Estimated Time
- ~2-3 hours for remaining 130 routes at current pace
