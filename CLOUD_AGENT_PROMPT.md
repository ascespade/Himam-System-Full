# 🚀 Cloud Agent Prompt - Himam System Refactoring Project

## 📋 Project Context

You are working on a **professional medical management system (Himam System)** built with:
- **Next.js 14+** (App Router)
- **TypeScript** (strict mode)
- **Supabase** (PostgreSQL database, Edge Functions, Realtime)
- **Tailwind CSS**
- **Clean Architecture** patterns

## ✅ What Has Been Completed

### 1. TypeScript Type Safety (100%)
- ✅ All `any` types replaced with proper types (`unknown`, `Record<string, unknown>`, specific interfaces)
- ✅ All TypeScript errors fixed (0 errors)
- ✅ Type guards added for error handling (`instanceof Error`)
- ✅ Proper type assertions for ReactNode compatibility

### 2. Code Quality
- ✅ All `console.log` replaced with centralized logger (`logInfo`, `logError`, `logWarn`)
- ✅ All ESLint errors fixed (0 errors)
- ✅ Pre-commit hooks configured to prevent `console.log` and `any` types
- ✅ CI/CD workflow for code quality checks

### 3. Architecture Patterns
- ✅ **BaseRepository**: Generic CRUD operations for all repositories
- ✅ **BaseService**: Business logic abstraction layer
- ✅ **BaseUseCase**: Application-specific use cases
- ✅ **BaseHandler**: Standardized API route handlers
- ✅ All services use `supabaseAdmin` (not `this.supabase`)
- ✅ Consistent error handling with `ServiceException` and `ServiceResult`

### 4. Documentation
- ✅ 34+ old documentation files cleaned up
- ✅ `PROJECT_RULES.md` created with project standards
- ✅ `.cursorrules` configured for AI agents
- ✅ Architecture patterns documented

### 5. Protection Mechanisms
- ✅ Pre-commit hooks: TypeScript check, ESLint, console.log detection, any type detection
- ✅ CI/CD: GitHub Actions workflow for automated validation
- ✅ Project rules enforced

## 🎯 Current Task: Fix Remaining `any` Types

### Files That May Still Have `any` Types:
1. `app/dashboard/doctor/insurance/ai-agent/page.tsx` - ✅ Just fixed
2. Any other files that might have been missed

### Pattern to Follow:
```typescript
// ❌ BAD
catch (error: any) {
  console.error(error.message)
}

// ✅ GOOD
catch (error: unknown) {
  const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
  logError('Operation failed', error, { context })
}
```

```typescript
// ❌ BAD
const data: any = await fetchData()

// ✅ GOOD
const data: Record<string, unknown> = await fetchData()
// OR
interface MyData {
  id: string
  name: string
}
const data: MyData = await fetchData()
```

## 🔍 How to Find Remaining Issues

1. **Run validation:**
   ```bash
   npm run validate
   ```

2. **Check for any types:**
   ```bash
   grep -r ": any\|as any" --include="*.ts" --include="*.tsx" src/ app/ --exclude-dir=node_modules
   ```

3. **Check for console.log:**
   ```bash
   grep -r "console\.log\|console\.error\|console\.warn" --include="*.ts" --include="*.tsx" src/ app/api/ --exclude-dir=node_modules --exclude="logger.ts" --exclude="toast.ts"
   ```

## 📝 Project Rules (MUST FOLLOW)

### 1. Type Safety
- ❌ **NEVER** use `any` type
- ✅ **ALWAYS** use proper TypeScript types
- ✅ Use `unknown` + type guards if type is truly unknown

### 2. Logging
- ❌ **NEVER** use `console.log`, `console.error`, etc.
- ✅ **ALWAYS** use centralized logger:
  ```typescript
  import { logInfo, logError, logWarn } from '@/shared/utils/logger'
  ```

### 3. Architecture Patterns
- ✅ **ALWAYS** follow Clean Architecture layers
- ✅ Repositories extend `BaseRepository`
- ✅ Services extend `BaseService`
- ✅ Use Cases extend `BaseUseCase`
- ✅ API routes use `createApiHandler` or proper error handling

### 4. Error Handling
- ✅ **ALWAYS** use structured error classes (`ServiceException`, `AppError`)
- ✅ **ALWAYS** handle errors properly (never ignore)
- ✅ **ALWAYS** log errors with context

### 5. Database Access
- ❌ **NEVER** use `this.supabase` in services
- ✅ **ALWAYS** use `supabaseAdmin` from `@/lib`
- ✅ **ALWAYS** use repositories for database operations

## 🚀 Next Steps

1. **Find and fix any remaining `any` types:**
   - Search entire codebase
   - Replace with proper types
   - Add type guards where needed

2. **Verify everything works:**
   - Run `npm run validate`
   - Ensure 0 TypeScript errors
   - Ensure 0 ESLint errors

3. **Commit and push:**
   ```bash
   git add -A
   git commit -m "fix: Replace remaining any types with proper types"
   git push origin HEAD
   ```

## 📚 Key Files to Reference

- `PROJECT_RULES.md` - Complete project rules
- `.cursorrules` - AI agent rules
- `src/core/repositories/base.repository.ts` - Base repository pattern
- `src/core/services/base.service.ts` - Base service pattern
- `src/core/use-cases/base.use-case.ts` - Base use case pattern
- `src/core/api/base-handler.ts` - API handler pattern
- `src/shared/utils/logger.ts` - Centralized logger

## ⚠️ Important Notes

- **Client-side code** (dashboard pages) can have `console.log` for debugging, but server-side code (API routes, services) must use logger
- **Type safety is critical** - never use `any` even if it seems easier
- **Follow existing patterns** - don't create new patterns, use what's already established
- **Test after changes** - run `npm run validate` before committing

## 🎯 Goal

Achieve **100% type safety** and **zero code quality issues** while maintaining all existing functionality.

---

**Status**: Almost complete - just need to verify no remaining `any` types exist and fix them if found.



