# Centralization Roadmap
## Recommended Centralized Patterns for Project Stability

This document outlines additional centralized patterns that should be implemented to achieve a fully stable, maintainable architecture.

---

## 🎯 Priority 1: Critical for Stability

### 1. **Service Layer** (`src/core/services/`)
**Why**: Business logic is currently scattered in API routes. Services centralize business rules.

**Structure**:
```
src/core/services/
├── user.service.ts          # User business logic
├── appointment.service.ts   # Appointment business logic
├── patient.service.ts       # Patient business logic
├── billing.service.ts       # Billing business logic
└── index.ts                 # Export all services
```

**Benefits**:
- ✅ Reusable business logic across API routes and background jobs
- ✅ Easier to test
- ✅ Single source of truth for business rules
- ✅ Prevents code duplication

**Example**:
```typescript
// src/core/services/appointment.service.ts
export class AppointmentService extends BaseService {
  async createAppointment(input: CreateAppointmentInput): Promise<Appointment> {
    // Validate business rules
    // Check conflicts
    // Create appointment
    // Send notifications
    // Return result
  }
}
```

---

### 2. **Centralized API Client** (`src/core/api/client.ts`)
**Why**: Currently using raw `fetch` everywhere. Centralized client provides:
- Automatic error handling
- Request/response interceptors
- Retry logic
- Request cancellation
- Consistent headers

**Implementation**:
```typescript
// src/core/api/client.ts
export const apiClient = {
  get: <T>(url: string, options?: RequestOptions) => Promise<T>,
  post: <T>(url: string, data: unknown, options?: RequestOptions) => Promise<T>,
  put: <T>(url: string, data: unknown, options?: RequestOptions) => Promise<T>,
  delete: <T>(url: string, options?: RequestOptions) => Promise<T>,
}
```

**Benefits**:
- ✅ Consistent error handling
- ✅ Automatic retry on network failures
- ✅ Request cancellation support
- ✅ Centralized authentication headers
- ✅ Request/response logging

---

### 3. **Custom React Hooks** (`src/core/hooks/`)
**Why**: Standardize data fetching patterns across all components.

**Hooks to Create**:
- `useApi<T>()` - GET requests with caching
- `useMutation<TData, TVariables>()` - POST/PUT/DELETE
- `usePaginated<T>()` - Paginated lists
- `useInfiniteScroll<T>()` - Infinite scroll lists
- `useDebounce<T>()` - Debounced values
- `useLocalStorage<T>()` - LocalStorage sync
- `usePermission(permission: string)` - RBAC checks

**Benefits**:
- ✅ Eliminates `useState` + `useEffect` + `fetch` patterns
- ✅ Automatic loading/error states
- ✅ Built-in caching and refetching
- ✅ Consistent UX across app

---

### 4. **Permission/RBAC System** (`src/core/security/permissions.ts`)
**Why**: Authorization logic is scattered. Centralize permission checks.

**Implementation**:
```typescript
// src/core/security/permissions.ts
export const Permissions = {
  APPOINTMENTS: {
    CREATE: 'appointments:create',
    READ: 'appointments:read',
    UPDATE: 'appointments:update',
    DELETE: 'appointments:delete',
  },
  PATIENTS: {
    CREATE: 'patients:create',
    READ: 'patients:read',
    UPDATE: 'patients:update',
    DELETE: 'patients:delete',
  },
  // ... more permissions
} as const

export function hasPermission(user: User, permission: string): boolean {
  // Check user role and permissions
}

export function requirePermission(permission: string) {
  return (user: User) => {
    if (!hasPermission(user, permission)) {
      throw new ForbiddenError('Insufficient permissions')
    }
  }
}
```

**Benefits**:
- ✅ Centralized permission definitions
- ✅ Easy to audit permissions
- ✅ Consistent authorization checks
- ✅ Type-safe permission strings

---

## 🎯 Priority 2: Important for Maintainability

### 5. **Form Validation Utilities** (`src/core/forms/`)
**Why**: Client-side validation is inconsistent. Centralize form handling.

**Create**:
- `useForm<T>()` - Form state management
- `validateForm<T>(schema: ZodSchema, data: T)` - Validation helper
- `FormField` component - Reusable form field with validation
- `FormError` component - Consistent error display

**Benefits**:
- ✅ Consistent validation UX
- ✅ Reusable form components
- ✅ Type-safe form handling
- ✅ Automatic error messages

---

### 6. **Date/Time Utilities** (`src/shared/utils/datetime.ts`)
**Why**: Date formatting is inconsistent across the app.

**Implementation**:
```typescript
// src/shared/utils/datetime.ts
export const DateTime = {
  format: (date: Date | string, format: 'short' | 'long' | 'time' | 'datetime') => string,
  formatRelative: (date: Date | string) => string, // "2 hours ago"
  parse: (dateString: string) => Date,
  isValid: (date: unknown) => boolean,
  addDays: (date: Date, days: number) => Date,
  isToday: (date: Date) => boolean,
  isPast: (date: Date) => boolean,
  isFuture: (date: Date) => boolean,
}
```

**Benefits**:
- ✅ Consistent date formatting
- ✅ Timezone handling
- ✅ Arabic date support
- ✅ Reusable date operations

---

### 7. **Notification System** (`src/core/notifications/`)
**Why**: Notifications are created in multiple places. Centralize.

**Structure**:
```
src/core/notifications/
├── notification.service.ts    # Create/read notifications
├── notification.templates.ts  # Notification templates
├── notification.types.ts      # Notification types
└── use-notifications.ts       # React hook
```

**Benefits**:
- ✅ Consistent notification format
- ✅ Centralized templates
- ✅ Easy to add new notification types
- ✅ Notification history tracking

---

### 8. **File Upload/Storage** (`src/core/storage/`)
**Why**: File handling is scattered. Centralize upload/download.

**Implementation**:
```typescript
// src/core/storage/storage.service.ts
export class StorageService {
  async uploadFile(file: File, path: string): Promise<string>
  async deleteFile(url: string): Promise<void>
  async getFileUrl(path: string): Promise<string>
  validateFile(file: File, options: FileValidationOptions): ValidationResult
}
```

**Benefits**:
- ✅ Consistent file handling
- ✅ Automatic validation
- ✅ Progress tracking
- ✅ Error handling

---

## 🎯 Priority 3: Nice to Have

### 9. **Cache Management** (`src/core/cache/`)
**Why**: Implement consistent caching strategy.

**Implementation**:
- Redis cache wrapper
- In-memory cache for development
- Cache invalidation strategies
- Cache keys constants

---

### 10. **Email Templates** (`src/core/email/`)
**Why**: Centralize email sending and templates.

**Structure**:
```
src/core/email/
├── email.service.ts
├── templates/
│   ├── welcome.ts
│   ├── appointment-confirmation.ts
│   └── password-reset.ts
└── email.types.ts
```

---

### 11. **Constants Expansion** (`src/shared/constants/`)
**Add**:
- API endpoints constants
- Route paths constants
- Status codes
- Error codes
- Feature flags

---

### 12. **Type Guards** (`src/shared/utils/type-guards.ts`)
**Why**: Type-safe runtime type checking.

```typescript
export function isUser(obj: unknown): obj is User
export function isAppointment(obj: unknown): obj is Appointment
export function isError(obj: unknown): obj is Error
```

---

## 📋 Implementation Order

1. **Week 1**: Service Layer + API Client
2. **Week 2**: Custom Hooks + Permission System
3. **Week 3**: Form Utilities + Date Utilities
4. **Week 4**: Notification System + File Storage

---

## 🎯 Quick Wins (Can Do Now)

1. **Centralize API Endpoints**:
   ```typescript
   // src/shared/constants/api-routes.ts
   export const API_ROUTES = {
     USERS: '/api/users',
     APPOINTMENTS: '/api/appointments',
     PATIENTS: '/api/patients',
     // ... all routes
   } as const
   ```

2. **Centralize Route Paths**:
   ```typescript
   // src/shared/constants/routes.ts
   export const ROUTES = {
     DASHBOARD: {
       ADMIN: '/dashboard/admin',
       DOCTOR: '/dashboard/doctor',
       // ... all routes
     }
   } as const
   ```

3. **Create Type Guards**:
   ```typescript
   // src/shared/utils/type-guards.ts
   export const isUser = (obj: unknown): obj is User => {
     return typeof obj === 'object' && obj !== null && 'id' in obj && 'email' in obj
   }
   ```

---

## ✅ Success Metrics

After implementing these:
- ✅ Zero duplicate business logic
- ✅ Consistent error handling everywhere
- ✅ Type-safe throughout
- ✅ Easy to add new features
- ✅ Testable codebase
- ✅ Maintainable architecture

---

**Last Updated**: 2024-12-09
