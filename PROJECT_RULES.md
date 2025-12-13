# 🏗️ Project Rules & Standards

## ⚠️ CRITICAL RULES - MUST FOLLOW

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

### 5. Code Quality
- ✅ **ALWAYS** run `npm run validate` before committing
- ✅ **ALWAYS** fix TypeScript errors
- ✅ **ALWAYS** fix ESLint warnings
- ✅ **ALWAYS** follow existing code patterns

## 🚫 FORBIDDEN PRACTICES

1. ❌ Using `any` type
2. ❌ Using `console.log` or `console.error`
3. ❌ Ignoring TypeScript errors
4. ❌ Ignoring ESLint warnings
5. ❌ Breaking existing architecture patterns
6. ❌ Duplicating code (use shared utilities)
7. ❌ Committing without running validation

## ✅ REQUIRED BEFORE COMMIT

1. Run `npm run validate` (type-check + lint)
2. Fix all TypeScript errors
3. Fix all ESLint warnings
4. Ensure no `console.log` statements
5. Ensure no `any` types
6. Follow architecture patterns

## 📚 Documentation

See `docs/ARCHITECTURE_PATTERNS.md` for complete architecture guide.

---

**These rules are enforced by pre-commit hooks and CI/CD.**


