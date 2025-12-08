# 🎯 قواعد المركزية - Centralization Rules

## 📋 مبدأ المركزية
**كل شيء له مكان واحد فقط (Single Source of Truth)**

---

## 1. ✅ Validation Centralization

### Schema Location
```
src/shared/validations/
├── common.validations.ts      # Email, phone, etc.
├── user.validations.ts        # User-specific schemas
└── appointment.validations.ts # Appointment schemas

features/[feature]/validations/
└── [feature].validations.ts   # Feature-specific schemas
```

### ❌ FORBIDDEN: Duplicated Validators
```typescript
// File 1
function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// File 2
function isValidEmail(email: string) {
  return email.includes('@') && email.includes('.') // ❌ Different implementation
}
```

### ✅ CORRECT: Centralized Schema
```typescript
// src/shared/validations/common.validations.ts
export const emailSchema = z.string().email('Invalid email format')
export const phoneSchema = z.string().regex(/^\+966[0-9]{9}$/, 'Invalid Saudi phone')

// Usage everywhere
import { emailSchema } from '@/shared/validations/common.validations'
```

---

## 2. ✅ Constants Centralization

### Structure
```
src/shared/constants/
├── appointments.ts            # Appointment-related constants
├── users.ts                   # User roles, statuses
├── payments.ts                # Payment statuses, methods
└── system.ts                  # System-wide constants
```

### ❌ FORBIDDEN: Magic Values
```typescript
if (status === 'pending') { } // ❌
if (role === 'doctor') { } // ❌
if (amount > 1000) { } // ❌
```

### ✅ CORRECT: Named Constants
```typescript
// src/shared/constants/appointments.ts
export const APPOINTMENT_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
} as const

export type AppointmentStatus = typeof APPOINTMENT_STATUS[keyof typeof APPOINTMENT_STATUS]

// src/shared/constants/users.ts
export const USER_ROLES = {
  ADMIN: 'admin',
  DOCTOR: 'doctor',
  PATIENT: 'patient',
  STAFF: 'staff',
} as const

// src/shared/constants/payments.ts
export const MAX_PAYMENT_AMOUNT = 100000
export const MIN_PAYMENT_AMOUNT = 10
```

### Usage
```typescript
// ✅ CORRECT
import { APPOINTMENT_STATUS } from '@/shared/constants/appointments'
if (appointment.status === APPOINTMENT_STATUS.PENDING) { }
```

---

## 3. ✅ Error Handling Centralization

### Error Classes Location
```
src/core/errors/
├── base.error.ts              # Base error class
├── not-found.error.ts         # 404 errors
├── validation.error.ts        # 400 errors
├── unauthorized.error.ts      # 401 errors
├── forbidden.error.ts         # 403 errors
└── conflict.error.ts          # 409 errors
```

### ❌ FORBIDDEN: Inconsistent Error Responses
```typescript
// File 1
return { error: 'User not found' } // ❌

// File 2
return { success: false, message: 'User not found' } // ❌ Different format

// File 3
throw new Error('User not found') // ❌ Generic error
```

### ✅ CORRECT: Standardized Errors
```typescript
// src/core/errors/not-found.error.ts
export class NotFoundError extends AppError {
  statusCode = 404
  code = 'NOT_FOUND'
  
  constructor(resource: string, id?: string) {
    super(`${resource}${id ? ` with ID ${id}` : ''} not found`)
  }
}

// Usage
if (!user) {
  throw new NotFoundError('User', userId)
}
```

---

## 4. ✅ API Response Centralization

### Response Helpers Location
```
src/shared/utils/
└── api-response.helpers.ts    # Response formatters
```

### ❌ FORBIDDEN: Different Response Formats
```typescript
// File 1
return { data: user } // ❌

// File 2
return { success: true, user } // ❌

// File 3
return Response.json({ result: user }) // ❌
```

### ✅ CORRECT: Standardized Responses
```typescript
// src/shared/utils/api-response.helpers.ts
export function successResponse<T>(
  data: T,
  statusCode: number = 200,
  meta?: ResponseMeta
): NextResponse {
  return NextResponse.json({
    success: true,
    data,
    meta: meta || {
      timestamp: new Date().toISOString(),
      requestId: generateRequestId(),
    },
  }, { status: statusCode })
}

export function errorResponse(
  message: string,
  statusCode: number = 500,
  code?: string,
  fields?: Record<string, string>
): NextResponse {
  return NextResponse.json({
    success: false,
    error: {
      code: code || 'INTERNAL_ERROR',
      message,
      ...(fields && { fields }),
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: generateRequestId(),
    },
  }, { status: statusCode })
}
```

---

## 5. ✅ Configuration Centralization

### Config Location
```
src/config/
├── env.ts                     # Environment variables
├── database.ts                # Database config
├── features.ts                # Feature flags
└── security.ts                # Security config
```

### ❌ FORBIDDEN: Scattered Config
```typescript
// File 1
const dbUrl = process.env.DATABASE_URL // ❌

// File 2
const dbUrl = process.env.DB_URL // ❌ Different key
```

### ✅ CORRECT: Centralized Config
```typescript
// src/config/env.ts
import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(20),
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
  JWT_SECRET: z.string().min(32),
  NODE_ENV: z.enum(['development', 'production', 'test']),
})

export const env = envSchema.parse(process.env)

// Usage
import { env } from '@/config/env'
const dbUrl = env.DATABASE_URL // ✅
```

---

## 6. ✅ Database Client Centralization

### Client Location
```
src/infrastructure/supabase/
└── client.ts                  # Singleton clients
```

### ❌ FORBIDDEN: Multiple Clients
```typescript
// File 1
const supabase1 = createClient(url, key) // ❌

// File 2
const supabase2 = createClient(url, key) // ❌ Different instance
```

### ✅ CORRECT: Singleton Client
```typescript
// src/infrastructure/supabase/client.ts
let supabaseInstance: SupabaseClient | null = null

export const supabase: SupabaseClient = (() => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { realtime: { params: { eventsPerSecond: 10 } } }
    )
  }
  return supabaseInstance
})()

// Usage everywhere
import { supabase } from '@/infrastructure/supabase/client'
```

---

## 7. ✅ Logging Centralization

### Logger Location
```
src/shared/utils/
└── logger.ts                  # Centralized logger
```

### ❌ FORBIDDEN: Multiple Logging Approaches
```typescript
// File 1
console.log('User created') // ❌

// File 2
console.error('Error:', error) // ❌

// File 3
winston.info('User created') // ❌ Different library
```

### ✅ CORRECT: Centralized Logger
```typescript
// src/shared/utils/logger.ts
import pino from 'pino'

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
})

// Usage
import { logger } from '@/shared/utils/logger'
logger.info({ userId: user.id }, 'User created')
logger.error({ error, context }, 'Operation failed')
```

---

## 8. ✅ Type Definitions Centralization

### Types Location
```
src/shared/types/
├── user.types.ts              # User-related types
├── appointment.types.ts       # Appointment types
└── common.types.ts            # Common types (ApiResponse, etc.)

features/[feature]/types/
└── [feature].types.ts         # Feature-specific types
```

### ❌ FORBIDDEN: Duplicated Types
```typescript
// File 1
interface User {
  id: string
  name: string
}

// File 2
type UserType = {
  id: string
  name: string
} // ❌ Same data, different name
```

### ✅ CORRECT: Centralized Types
```typescript
// src/shared/types/user.types.ts
export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  createdAt: Date
}

export type UserRole = 'admin' | 'doctor' | 'patient' | 'staff'

// Usage
import type { User, UserRole } from '@/shared/types/user.types'
```

---

## 9. ✅ Utility Functions Centralization

### Utils Location
```
src/shared/utils/
├── date.utils.ts              # Date formatting
├── string.utils.ts            # String utilities
├── validation.utils.ts        # Validation helpers
└── format.utils.ts            # Formatting functions
```

### ❌ FORBIDDEN: Duplicated Utilities
```typescript
// File 1
function formatDate(date: Date) {
  return date.toLocaleDateString('ar-SA')
}

// File 2
function getDateString(date: Date) {
  return new Intl.DateTimeFormat('ar-SA').format(date) // ❌ Different implementation
}
```

### ✅ CORRECT: Centralized Utils
```typescript
// src/shared/utils/date.utils.ts
export function formatDate(date: Date, format: 'short' | 'long' = 'short'): string {
  if (format === 'short') {
    return date.toLocaleDateString('ar-SA')
  }
  return date.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// Usage
import { formatDate } from '@/shared/utils/date.utils'
```

---

## 10. ✅ API Client Centralization

### Client Location
```
src/infrastructure/
├── supabase/                  # Supabase client
├── stripe/                    # Stripe client
└── integrations/              # Other API clients
```

### ❌ FORBIDDEN: Multiple API Instances
```typescript
// File 1
const stripe1 = new Stripe(process.env.STRIPE_KEY!)

// File 2
const stripe2 = Stripe(process.env.STRIPE_SECRET_KEY!) // ❌
```

### ✅ CORRECT: Singleton Clients
```typescript
// src/infrastructure/stripe/client.ts
let stripeInstance: Stripe | null = null

export const stripe: Stripe = (() => {
  if (!stripeInstance) {
    stripeInstance = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    })
  }
  return stripeInstance
})()

// Usage
import { stripe } from '@/infrastructure/stripe/client'
```

---

## 📊 Centralization Checklist

### Before Writing New Code
- [ ] Check if validation schema exists in `shared/validations/`
- [ ] Check if constant exists in `shared/constants/`
- [ ] Check if utility function exists in `shared/utils/`
- [ ] Check if type exists in `shared/types/`
- [ ] Check if error class exists in `core/errors/`

### Before Adding New File
- [ ] Is this functionality already implemented elsewhere?
- [ ] Can I reuse existing code?
- [ ] Is this the right location according to architecture?

### Code Review
- [ ] No duplicated validation logic
- [ ] No duplicated constants
- [ ] No duplicated utility functions
- [ ] No duplicated types
- [ ] No duplicated error handling
- [ ] No duplicated API client instances

---

## 🚨 Anti-Patterns

### 1. ❌ Copy-Paste Programming
```typescript
// ❌ BAD: Copying code instead of reusing
function validateEmail1(email: string) { /* validation */ }
function validateEmail2(email: string) { /* same validation */ }
```

### 2. ❌ Scattered Configuration
```typescript
// ❌ BAD: Config in multiple places
const timeout = 5000 // File 1
const TIMEOUT = 5000 // File 2
```

### 3. ❌ Inconsistent Naming
```typescript
// ❌ BAD: Same concept, different names
getUserById() // File 1
fetchUser() // File 2
retrieveUser() // File 3
```

---

## ✅ Best Practices

### 1. Always Check First
```typescript
// Before writing new validation:
// 1. Check shared/validations/common.validations.ts
// 2. If exists, import and reuse
// 3. If not, add to common.validations.ts (not feature-specific)
```

### 2. Extract Early
```typescript
// If you use the same logic 2+ times:
// 1. Extract to shared/utils/
// 2. Document usage
// 3. Add to shared exports
```

### 3. Consistent Naming
```typescript
// Use consistent naming across project:
// - findById (not getById, fetchById)
// - create (not add, insert)
// - update (not modify, change)
// - delete (not remove, destroy)
```

---

## 📚 Reference Files

### Must Import From
```typescript
// Validations
import { emailSchema, phoneSchema } from '@/shared/validations/common.validations'

// Constants
import { APPOINTMENT_STATUS, USER_ROLES } from '@/shared/constants'

// Types
import type { User, Appointment } from '@/shared/types'

// Utils
import { formatDate, formatCurrency } from '@/shared/utils'

// Errors
import { NotFoundError, ValidationError } from '@/core/errors'

// Clients
import { supabase, supabaseAdmin } from '@/infrastructure/supabase/client'
import { stripe } from '@/infrastructure/stripe/client'

// Logger
import { logger } from '@/shared/utils/logger'

// Config
import { env } from '@/config/env'
```

---

**Version:** 1.0.0  
**Last Updated:** 2024-12-08

