# 🔧 Himam System - Refactor Plan
## Aligning Codebase with Existing Rules

**Date:** 2025-01-15  
**Mode:** Refactor Planning (No Code Execution)  
**Objective:** Incremental alignment with PROJECT_RULES.md and Clean Architecture patterns  
**Baseline:** AUDIT_REPORT.md findings

---

## A. Strict Ordered Refactor Plan

### Phase 1: Rule Violations (Foundation)
**Goal:** Eliminate explicit violations of PROJECT_RULES.md  
**Duration:** 3-5 days  
**Risk Level:** 🟢 LOW (Mechanical replacements, no logic changes)

#### 1.1 Console.log Elimination
**Problem:** 63+ files violate "NEVER use console.log" rule  
**Files Affected:**
- `middleware.ts` (2 instances: lines 94, 129)
- `app/dashboard/admin/page.tsx` (2 instances: lines 93, 128)
- 61 additional dashboard component files (grep results)

**Expected Outcome:**
- All `console.log` → `logInfo` (from `@/shared/utils/logger`)
- All `console.error` → `logError` (from `@/shared/utils/logger`)
- All `console.warn` → `logWarn` (from `@/shared/utils/logger`)
- `check-code-hygiene.sh` passes with 0 violations

**Execution Steps:**
1. Run automated search: `grep -r "console\.\(log\|error\|warn\)" app/dashboard src --include="*.ts" --include="*.tsx"`
2. For each file, replace with appropriate logger function
3. Add import: `import { logInfo, logError, logWarn } from '@/shared/utils/logger'`
4. Verify context is preserved (logger accepts message + optional context object)

**Risk:** Minimal - logger API matches console API, only import changes needed

---

#### 1.2 Alert() Replacement
**Problem:** 8 files use `alert()` which violates UX best practices  
**Files Affected:**
- `app/dashboard/admin/page.tsx` (lines 113, 115)
- `app/dashboard/doctor/sessions/new/page.tsx`
- `app/dashboard/doctor/settings/page.tsx`
- `app/dashboard/doctor/schedule/page.tsx`
- `app/dashboard/doctor/templates/page.tsx`
- `app/dashboard/doctor/treatment-plans/page.tsx`
- `app/dashboard/billing/page.tsx`
- `app/dashboard/admin/settings/page.tsx`

**Expected Outcome:**
- All `alert()` calls removed
- Errors displayed via existing toast/notification system (if available)
- Or replaced with inline error state management

**Execution Steps:**
1. Identify existing toast/notification system in codebase
2. For each `alert()` usage:
   - If error: Replace with toast.error() or setErrorState()
   - If confirmation: Replace with proper modal/dialog component
3. Ensure error messages are user-friendly (Arabic/English as appropriate)

**Risk:** 🟡 MEDIUM - Requires understanding existing UI patterns, may need to add error state management

---

#### 1.3 Type Safety: Remove `any` Types
**Problem:** 3 instances of `any` in shared types violate strict TypeScript rules  
**Files Affected:**
- `src/shared/types/index.ts`:
  - Line 13: `ApiResponse<T = any>`
  - Line 193: `LabResult.results?: any`
  - Line 531: `FormState<T = any>`

**Expected Outcome:**
- `ApiResponse<T = unknown>` (use type guards when accessing)
- `LabResult.results?: unknown` (add type guard or specific type)
- `FormState<T = unknown>` (use type guards)

**Execution Steps:**
1. Replace `any` with `unknown`
2. Add type guards where these types are used:
   - `src/shared/utils/api.ts` (ApiResponse usage)
   - Any files using `LabResult.results`
   - Any files using `FormState`
3. Verify no TypeScript errors introduced

**Risk:** 🟡 MEDIUM - May require adding type guards in consuming code

---

#### 1.4 Unsafe Type Assertions
**Problem:** Type assertions bypass TypeScript safety  
**Files Affected:**
- `app/dashboard/admin/page.tsx:157`: `setActiveTab(tab as any)`

**Expected Outcome:**
- Remove `as any` assertion
- Use proper type: `setActiveTab(tab as 'overview' | 'appointments' | 'patients' | 'cms')`
- Or validate tab value before setting

**Execution Steps:**
1. Identify valid tab values from component state
2. Replace `as any` with union type assertion
3. Optionally add runtime validation

**Risk:** 🟢 LOW - Simple type fix

---

### Phase 2: Architectural Consistency (Core)
**Goal:** Align services and repositories with Clean Architecture  
**Duration:** 4-6 days  
**Risk Level:** 🟡 MEDIUM (Requires careful refactoring, testing)

#### 2.1 Consolidate Rate Limiting
**Problem:** Two implementations coexist (`withRateLimit` vs `applyRateLimitCheck`)  
**Files Affected:**
- `app/api/notifications/[id]/route.ts` (uses `applyRateLimitCheck`)
- `app/api/doctor/recordings/route.ts` (DELETE method uses legacy)
- Any other routes using `applyRateLimitCheck` (grep to find all)

**Expected Outcome:**
- All routes use `withRateLimit` wrapper
- `src/core/api/middleware/applyRateLimit.ts` can be deprecated (after migration)
- Consistent rate limiting behavior across all routes

**Execution Steps:**
1. Find all usages: `grep -r "applyRateLimitCheck" app/api`
2. For each route:
   - Replace `applyRateLimitCheck` + manual header addition with `withRateLimit` wrapper
   - Remove `addRateLimitHeadersToResponse` calls (wrapper handles this)
3. Test each route to ensure rate limiting still works
4. After all routes migrated, mark `applyRateLimit.ts` as deprecated (add comment, don't delete yet)

**Risk:** 🟡 MEDIUM - Must ensure rate limiting behavior is identical, test thoroughly

---

#### 2.2 Service Layer: Use Repositories
**Problem:** `PatientService` and `UserService` access `supabaseAdmin` directly, violating Clean Architecture  
**Files Affected:**
- `src/core/services/patient.service.ts` (all methods)
- `src/core/services/user.service.ts` (all methods)
- `src/infrastructure/supabase/repositories/patient.repository.ts` (exists but not used by service)
- `src/infrastructure/supabase/repositories/user.repository.ts` (may need to be created/updated)

**Expected Outcome:**
- `PatientService` uses `PatientRepository` for all data access
- `UserService` uses `UserRepository` for all data access
- Services contain only business logic, no direct DB calls
- Repository pattern matches `AppointmentRepository` implementation

**Execution Steps:**
1. **Audit existing repositories:**
   - Check if `PatientRepository` has all methods needed by `PatientService`
   - Check if `UserRepository` exists and has required methods
   - Compare with `AppointmentRepository` pattern for consistency

2. **Update repositories (if needed):**
   - Ensure repositories extend `BaseRepository` or implement interface
   - Add missing methods (create, update, delete, findById, etc.)
   - Use specific column selection (not `select('*')`)

3. **Refactor services:**
   - Remove `supabaseAdmin` imports
   - Inject repository dependency (or use singleton export)
   - Move all DB queries to repository methods
   - Keep business logic in service (validation, error handling, logging)

4. **Update service tests:**
   - Mock repositories instead of Supabase
   - Test business logic only

**Risk:** 🟠 HIGH - Core business logic, must test thoroughly, may break existing functionality

**Dependencies:** Must complete after Phase 1 (type safety fixes)

---

#### 2.3 Repository Pattern Consistency
**Problem:** Some repositories use `select('*')`, violating performance best practices  
**Files Affected:**
- `src/infrastructure/supabase/repositories/appointment.repository.ts:26` (`selectFields = '*'`)
- `src/infrastructure/supabase/repositories/patient.repository.ts` (8 instances)
- `src/infrastructure/supabase/repositories/guardian.repository.ts` (3 instances)
- `src/infrastructure/supabase/repositories/medical-record.repository.ts` (1 instance)
- `src/infrastructure/supabase/repositories/content-items.repository.ts` (2 instances)
- `src/infrastructure/supabase/repositories/center-info.repository.ts` (1 instance)
- `src/lib` files (7 instances)

**Expected Outcome:**
- All repositories use specific column selection
- `selectFields` property lists explicit columns
- Performance improved (less data transfer)

**Execution Steps:**
1. For each repository:
   - Identify all columns needed by service layer
   - Replace `selectFields = '*'` with explicit column list
   - Update all `.select(this.selectFields)` calls
2. For `src/lib` files:
   - Replace `select('*')` with specific columns
   - Ensure all required fields are included

**Risk:** 🟡 MEDIUM - Must ensure all required columns are included, may miss some fields

**Dependencies:** Should complete after Phase 2.2 (ensures services define what columns are needed)

---

### Phase 3: Error Handling & UX (Polish)
**Goal:** Consistent error handling and user experience  
**Duration:** 2-3 days  
**Risk Level:** 🟡 MEDIUM

#### 3.1 Silent Error Swallowing
**Problem:** Empty catch blocks hide errors  
**Files Affected:**
- `app/dashboard/admin/page.tsx:78-90` (4 empty catch blocks)

**Expected Outcome:**
- All errors are logged using centralized logger
- Users see appropriate error messages (not silent failures)
- Error state is managed in component state

**Execution Steps:**
1. Replace empty catch blocks with:
   - `logError('Error loading data', error, { context })`
   - Set error state: `setError('Failed to load data')`
   - Display error in UI (toast or inline message)
2. Ensure error messages are user-friendly

**Risk:** 🟢 LOW - Improves observability, no breaking changes

---

#### 3.2 API Error Handling Standardization
**Problem:** Inconsistent error response formats across API routes  
**Files Affected:**
- All API routes (audit to find inconsistencies)

**Expected Outcome:**
- All routes use `handleApiError` from `@/shared/utils/api`
- Consistent error response format: `{ success: false, error: string, code?: string }`
- Proper HTTP status codes

**Execution Steps:**
1. Audit all API routes for error handling patterns
2. Identify routes not using `handleApiError`
3. Refactor to use `handleApiError` wrapper or try-catch with `handleApiError`
4. Ensure all errors return consistent format

**Risk:** 🟡 MEDIUM - Must ensure error responses match frontend expectations

**Dependencies:** Should complete after Phase 2.1 (rate limiting consolidation)

---

#### 3.3 Dashboard Data Fetching Optimization
**Problem:** Sequential API calls instead of parallel  
**Files Affected:**
- `app/dashboard/admin/page.tsx:72` (uses Promise.all correctly, but error handling is poor)

**Expected Outcome:**
- All parallel fetches use `Promise.all` or `Promise.allSettled`
- Proper error handling for each fetch
- Loading states for individual operations

**Execution Steps:**
1. Review all dashboard components for sequential fetches
2. Convert to `Promise.all` where data is independent
3. Use `Promise.allSettled` if some failures are acceptable
4. Add proper error handling for each fetch

**Risk:** 🟢 LOW - Performance improvement, no breaking changes

---

### Phase 4: Testing & Validation (Quality Gate)
**Goal:** Ensure refactoring didn't break functionality  
**Duration:** 2-3 days  
**Risk Level:** 🟢 LOW

#### 4.1 Test Coverage Verification
**Problem:** Unknown test coverage, gaps in critical paths  
**Files Affected:**
- All test files
- All service files (need unit tests)
- All API routes (need integration tests)

**Expected Outcome:**
- Coverage report shows baseline (run `npm run test:unit:coverage`)
- Critical paths have tests (services, repositories, API routes)
- All tests pass after refactoring

**Execution Steps:**
1. Run coverage report: `npm run test:unit:coverage`
2. Identify gaps in:
   - Services (especially after Phase 2.2 refactoring)
   - Repositories
   - API routes
3. Add tests for refactored code (services using repositories)
4. Ensure all tests pass

**Risk:** 🟢 LOW - Quality assurance, no production impact

**Dependencies:** Must complete after Phase 2 (architectural changes)

---

#### 4.2 Type Checking & Linting
**Problem:** Ensure no regressions introduced  
**Files Affected:**
- All TypeScript files

**Expected Outcome:**
- `npm run type-check` passes with 0 errors
- `npm run lint:check` passes with 0 warnings (or only acceptable warnings)
- `npm run check:hygiene` passes

**Execution Steps:**
1. After each phase, run validation:
   - `npm run validate` (type-check + lint + hygiene)
2. Fix any errors introduced
3. Document any acceptable warnings (if any)

**Risk:** 🟢 LOW - Validation only

---

## B. Dependency-Safe Execution Order

### Critical Path (Must Fix First)

**1. Phase 1.1: Console.log Elimination** ⚡ CRITICAL
- **Why First:** Violates explicit project rules, blocks other work (hygiene script fails)
- **Blocks:** Nothing (can be done in parallel with other Phase 1 tasks)
- **Unblocks:** Code hygiene validation, clean commits

**2. Phase 1.3: Type Safety (`any` removal)** ⚡ CRITICAL
- **Why Second:** Type safety is foundation, affects all consuming code
- **Blocks:** Phase 2 (architectural refactoring needs proper types)
- **Unblocks:** Safe refactoring of services/repositories

**3. Phase 1.4: Unsafe Type Assertions** ⚡ CRITICAL
- **Why Third:** Quick fix, prevents runtime errors
- **Blocks:** Nothing
- **Unblocks:** Type safety validation

### High Priority (Before Architectural Changes)

**4. Phase 2.1: Consolidate Rate Limiting** 🔥 HIGH
- **Why Before Services:** Simpler change, reduces maintenance burden
- **Blocks:** Nothing
- **Unblocks:** Cleaner codebase for service refactoring

**5. Phase 2.2: Service Layer Repositories** 🔥 HIGH
- **Why Critical:** Core architectural change, affects all business logic
- **Blocks:** Phase 2.3 (repository column selection needs service input)
- **Unblocks:** Proper testing, Clean Architecture compliance

**6. Phase 2.3: Repository Column Selection** 🔥 HIGH
- **Why After Services:** Services define what columns are needed
- **Blocks:** Nothing (performance improvement)
- **Unblocks:** Performance optimization

### Medium Priority (Polish)

**7. Phase 1.2: Alert() Replacement** 🟡 MEDIUM
- **Why Can Wait:** UX improvement, not blocking
- **Blocks:** Nothing
- **Unblocks:** Better user experience

**8. Phase 3.1: Silent Error Swallowing** 🟡 MEDIUM
- **Why Can Wait:** Observability improvement
- **Blocks:** Nothing
- **Unblocks:** Better debugging

**9. Phase 3.2: API Error Handling** 🟡 MEDIUM
- **Why Can Wait:** Consistency improvement
- **Blocks:** Nothing
- **Unblocks:** Consistent API behavior

**10. Phase 3.3: Dashboard Optimization** 🟡 MEDIUM
- **Why Can Wait:** Performance improvement
- **Blocks:** Nothing
- **Unblocks:** Faster page loads

### Quality Gates (After Each Phase)

**11. Phase 4.1: Test Coverage** ✅ QUALITY GATE
- **Why After Refactoring:** Ensures changes didn't break functionality
- **Blocks:** Nothing (validation)
- **Unblocks:** Confidence in production deployment

**12. Phase 4.2: Type Checking & Linting** ✅ QUALITY GATE
- **Why Continuous:** Run after each phase
- **Blocks:** Nothing (validation)
- **Unblocks:** Clean codebase

### Execution Timeline

**Week 1:**
- Day 1-2: Phase 1.1 (Console.log)
- Day 3: Phase 1.3 + 1.4 (Type safety)
- Day 4-5: Phase 2.1 (Rate limiting)

**Week 2:**
- Day 1-4: Phase 2.2 (Service repositories) ⚠️ HIGH RISK
- Day 5: Phase 2.3 (Repository columns)

**Week 3:**
- Day 1: Phase 1.2 (Alert replacement)
- Day 2: Phase 3.1 (Error swallowing)
- Day 3: Phase 3.2 (API errors)
- Day 4: Phase 3.3 (Dashboard optimization)
- Day 5: Phase 4.1 + 4.2 (Testing & validation)

---

## C. Clean Architecture Compliance Checklist

### Services vs Repositories

#### ✅ Services Should:
- [ ] Extend `BaseService` (for error handling)
- [ ] Use repositories for ALL data access (no `supabaseAdmin` imports)
- [ ] Contain business logic only (validation, orchestration, error handling)
- [ ] Throw `ServiceException` for business errors
- [ ] Use Zod schemas for input validation
- [ ] Log operations using `logOperation()` from `BaseService`

#### ✅ Repositories Should:
- [ ] Extend `BaseRepository<T>` or implement repository interface
- [ ] Use `supabaseAdmin` for data access (only place DB is accessed)
- [ ] Map database rows to entities (`mapToEntity()`)
- [ ] Use specific column selection (not `select('*')`)
- [ ] Handle database errors and map to domain errors
- [ ] Have no business logic (pure data access)

#### ❌ Services Should NOT:
- [ ] Import `supabaseAdmin` directly
- [ ] Contain SQL queries or Supabase-specific code
- [ ] Access database tables directly
- [ ] Mix data access with business logic

#### ❌ Repositories Should NOT:
- [ ] Contain business logic
- [ ] Validate input (that's service layer)
- [ ] Log business operations (that's service layer)
- [ ] Use `select('*')` (performance anti-pattern)

### API Routes vs Handlers

#### ✅ API Routes Should:
- [ ] Use `withRateLimit` wrapper (not legacy `applyRateLimitCheck`)
- [ ] Use `withAuth` for authentication/authorization
- [ ] Use `handleApiError` for error handling
- [ ] Use `getPaginationParams` for pagination
- [ ] Use `paginatedResponse` for paginated data
- [ ] Delegate to services (not repositories directly)
- [ ] Return standardized responses (`successResponse`, `errorResponse`)

#### ❌ API Routes Should NOT:
- [ ] Access `supabaseAdmin` directly (use services)
- [ ] Contain business logic (delegate to services)
- [ ] Use `console.log` (use logger)
- [ ] Use `select('*')` (services/repositories handle this)
- [ ] Mix authentication logic (use `withAuth`)

### Dashboard vs Shared Logic

#### ✅ Dashboard Components Should:
- [ ] Use centralized logger (not `console.log`)
- [ ] Handle errors with proper UI (not `alert()`)
- [ ] Use proper error boundaries
- [ ] Fetch data in parallel where possible (`Promise.all`)
- [ ] Manage loading and error states
- [ ] Use shared types from `@/shared/types`

#### ❌ Dashboard Components Should NOT:
- [ ] Use `console.log` or `console.error`
- [ ] Use `alert()` for errors
- [ ] Swallow errors silently (empty catch blocks)
- [ ] Access `supabaseAdmin` directly (use API routes)
- [ ] Contain business logic (that's in services)

### Current Compliance Status

#### ✅ Compliant:
- `AppointmentService` → Uses `AppointmentRepository` ✅
- `BaseService` → Proper error handling pattern ✅
- Most API routes → Use `withRateLimit` ✅
- `src/shared/utils/logger.ts` → Centralized logging ✅

#### ❌ Non-Compliant:
- `PatientService` → Direct `supabaseAdmin` access ❌
- `UserService` → Direct `supabaseAdmin` access ❌
- `app/api/notifications/[id]/route.ts` → Legacy rate limiting ❌
- `app/dashboard/admin/page.tsx` → `console.error`, `alert()`, silent errors ❌
- All repositories → `select('*')` usage ❌

---

## D. Definition of Production-Ready (This Project)

### Mandatory Conditions (Must Have)

#### 1. Code Quality Gates
- [ ] `npm run validate` passes (type-check + lint + hygiene)
- [ ] Zero `console.log` violations (verified by `check-code-hygiene.sh`)
- [ ] Zero `select('*')` in API routes (verified by `check-code-hygiene.sh`)
- [ ] Zero `any` types (except explicitly allowed in ESLint config)
- [ ] Zero ESLint errors (warnings acceptable if documented)

#### 2. Architecture Compliance
- [ ] All services use repositories (no direct `supabaseAdmin` in services)
- [ ] All repositories extend `BaseRepository` or implement interface
- [ ] All API routes use `withRateLimit` (not legacy `applyRateLimitCheck`)
- [ ] All API routes use `withAuth` for protected endpoints
- [ ] All API routes use `handleApiError` for error handling

#### 3. Type Safety
- [ ] `npm run type-check` passes with 0 errors
- [ ] No unsafe type assertions (`as any`)
- [ ] All shared types use `unknown` instead of `any` (with type guards)

#### 4. Error Handling
- [ ] All errors logged using centralized logger
- [ ] No silent error swallowing (empty catch blocks)
- [ ] Consistent error response format across API routes
- [ ] Dashboard components handle errors with proper UI (not `alert()`)

#### 5. Security
- [ ] All API routes have rate limiting (or `'none'` for webhooks)
- [ ] All protected routes use `withAuth`
- [ ] Input validation with Zod on all API routes accepting input
- [ ] No hardcoded secrets or credentials

#### 6. Testing
- [ ] `npm run test:unit` passes all tests
- [ ] Test coverage ≥ 60% (as per `vitest.config.ts` thresholds)
- [ ] Critical paths have tests (services, repositories, API routes)

### Quality Indicators (Should Have)

#### 7. Performance
- [ ] Repositories use specific column selection (not `select('*')`)
- [ ] High-traffic endpoints have pagination
- [ ] Dashboard components fetch data in parallel where possible

#### 8. Observability
- [ ] All errors sent to Sentry (via centralized logger)
- [ ] Structured logging with context
- [ ] No unhandled promise rejections

#### 9. Documentation
- [ ] Architecture patterns documented (`docs/ARCHITECTURE_PATTERNS.md`)
- [ ] Project rules documented (`PROJECT_RULES.md`)
- [ ] API routes have clear error handling

### Production Readiness Checklist

**Before deployment, verify:**

```bash
# 1. Code Quality
npm run validate                    # Must pass
npm run check:hygiene              # Must pass (0 console.log, 0 select('*') in API)

# 2. Type Safety
npm run type-check                 # Must pass (0 errors)

# 3. Testing
npm run test:unit                  # Must pass (all tests)
npm run test:unit:coverage         # Must show ≥60% coverage

# 4. Architecture (Manual Review)
# - All services use repositories (grep for supabaseAdmin in services)
# - All routes use withRateLimit (grep for applyRateLimitCheck)
# - No console.log in server code (grep results)
# - No alert() in dashboard (grep results)
```

### Production-Ready Score Calculation

**Minimum Score: 8.0/10** (based on audit baseline of 6.5/10)

**Scoring:**
- **Code Quality:** 2.0 points (must be 2.0/2.0)
- **Architecture:** 2.0 points (must be 2.0/2.0)
- **Type Safety:** 1.5 points (must be 1.5/1.5)
- **Error Handling:** 1.0 points (must be 1.0/1.0)
- **Security:** 1.0 points (must be 1.0/1.0)
- **Testing:** 0.5 points (must be ≥0.5/1.0)

**After Refactoring:**
- Phase 1 completion: +0.5 (code quality fixes)
- Phase 2 completion: +1.0 (architecture alignment)
- Phase 3 completion: +0.5 (error handling polish)

**Target: 8.5/10** (production-ready with confidence)

---

## Execution Guidelines

### Before Starting Each Phase

1. **Create feature branch:** `refactor/phase-{number}-{name}`
2. **Run baseline validation:** `npm run validate`
3. **Document current state:** Note any existing issues

### During Each Phase

1. **Make incremental changes:** One file or logical group at a time
2. **Test after each change:** Run `npm run type-check` frequently
3. **Commit frequently:** Small, logical commits with clear messages
4. **Run validation:** `npm run validate` before committing

### After Each Phase

1. **Run full validation:** `npm run validate && npm run test:unit`
2. **Update compliance checklist:** Mark completed items
3. **Document any issues:** Note blockers or unexpected problems
4. **Create PR for review:** Even if not merging yet

### Risk Mitigation

**High-Risk Changes (Phase 2.2):**
- Create comprehensive test coverage BEFORE refactoring
- Refactor one service at a time (PatientService, then UserService)
- Keep old implementation commented for rollback
- Test thoroughly after each service refactor

**Medium-Risk Changes:**
- Test in isolation before integrating
- Use feature flags if possible
- Monitor error rates after deployment

**Low-Risk Changes:**
- Can be done in batches
- Lower testing requirements
- Can be reverted easily

---

## Success Criteria

### Phase 1 Complete When:
- ✅ `check-code-hygiene.sh` passes (0 console.log violations)
- ✅ No `alert()` usage in dashboard
- ✅ No `any` types in shared types
- ✅ No unsafe type assertions

### Phase 2 Complete When:
- ✅ All routes use `withRateLimit` (grep shows 0 `applyRateLimitCheck`)
- ✅ `PatientService` uses `PatientRepository`
- ✅ `UserService` uses `UserRepository`
- ✅ All repositories use specific column selection

### Phase 3 Complete When:
- ✅ No silent error swallowing
- ✅ All API routes use `handleApiError`
- ✅ Dashboard components handle errors properly

### Phase 4 Complete When:
- ✅ All tests pass
- ✅ Coverage ≥ 60%
- ✅ `npm run validate` passes

### Production-Ready When:
- ✅ All phases complete
- ✅ Production-Ready Score ≥ 8.0/10
- ✅ All mandatory conditions met
- ✅ Manual review approved

---

**End of Refactor Plan**

This plan is designed for **manual execution** by developers. Each phase can be executed independently, with clear success criteria and risk assessments. The plan focuses on **incremental improvement** without introducing new infrastructure or features.
