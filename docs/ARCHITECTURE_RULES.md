# 🏗️ قواعد ومعايير البنية المعمارية - Architecture Rules & Standards

## 📋 جدول المحتويات
1. [Design Patterns](#design-patterns)
2. [Clean Architecture Structure](#clean-architecture-structure)
3. [Centralization Strategy](#centralization-strategy)
4. [Development Rules](#development-rules)
5. [Code Organization](#code-organization)
6. [Anti-Patterns & Forbidden Practices](#anti-patterns--forbidden-practices)

---

## 🎨 Design Patterns

### 1. Repository Pattern
**الاستخدام الإجباري:** جميع عمليات قاعدة البيانات

```typescript
// ✅ CORRECT: Use Repository Pattern
// src/infrastructure/supabase/repositories/user.repository.ts
export class UserRepository implements IUserRepository {
  async findById(id: string): Promise<User | null>
  async create(data: CreateUserInput): Promise<User>
}

// ❌ FORBIDDEN: Direct database calls in services or components
// app/api/users/route.ts
const { data } = await supabase.from('users').select('*') // FORBIDDEN
```

**قاعدة:** لا يجوز استخدام `supabaseAdmin` أو `supabase` مباشرة خارج Repository.

---

### 2. Service Layer Pattern
**الاستخدام الإجباري:** جميع Business Logic

```typescript
// ✅ CORRECT: Service handles business logic
// src/core/use-cases/users/create-user.use-case.ts
export class CreateUserUseCase {
  constructor(
    private userRepo: IUserRepository,
    private emailService: IEmailService
  ) {}
  
  async execute(input: CreateUserInput): Promise<User> {
    // Validation
    // Business rules
    // Side effects
  }
}

// ❌ FORBIDDEN: Business logic in API routes
export async function POST(req: Request) {
  // Validation here ❌
  // Business logic here ❌
  // Database calls here ❌
}
```

---

### 3. Dependency Injection Pattern
**الاستخدام الإجباري:** جميع Dependencies

```typescript
// ✅ CORRECT: Constructor injection
export class UserService {
  constructor(
    private userRepo: IUserRepository,
    private emailService: IEmailService,
    private logger: ILogger
  ) {}
}

// ❌ FORBIDDEN: Direct instantiation or global imports
export class UserService {
  private userRepo = new UserRepository() // ❌
  private emailService = require('@/services/email') // ❌
}
```

---

### 4. Factory Pattern
**الاستخدام:** لإنشاء Entities معقدة

```typescript
// ✅ CORRECT: Use Factory for complex object creation
export class AppointmentFactory {
  static createBooking(input: BookingInput): Appointment {
    // Complex initialization logic
  }
}

// ❌ FORBIDDEN: Complex initialization in constructors or services
```

---

### 5. Strategy Pattern
**الاستخدام:** للخوارزميات القابلة للتبديل

```typescript
// ✅ CORRECT: Payment strategies
interface IPaymentStrategy {
  processPayment(amount: number): Promise<PaymentResult>
}

class StripePaymentStrategy implements IPaymentStrategy { }
class PayPalPaymentStrategy implements IPaymentStrategy { }
```

---

## 🏛️ Clean Architecture Structure

### Layer Responsibilities

```
┌─────────────────────────────────────────────────┐
│           PRESENTATION LAYER                    │
│  (app/, components/) - UI, API Routes          │
│  • Thin layer - delegates to use cases        │
│  • NO business logic                           │
│  • Input validation (Zod schemas)             │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│           APPLICATION LAYER                     │
│  (src/core/use-cases/) - Use Cases            │
│  • Orchestrates domain and infrastructure     │
│  • Single use case = single responsibility    │
│  • Depends on interfaces, not implementations │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│            DOMAIN LAYER                         │
│  (src/core/domain/) - Entities, Value Objects  │
│  • Pure business logic                         │
│  • NO dependencies on other layers            │
│  • Entities, Value Objects, Domain Events     │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│         INFRASTRUCTURE LAYER                    │
│  (src/infrastructure/) - External Services    │
│  • Repository implementations                  │
│  • External APIs (Stripe, WhatsApp, etc.)    │
│  • Database, Email, Storage                   │
└─────────────────────────────────────────────────┘
```

### Dependency Rule
**قاعدة ذهبية:** Dependencies تتدفق للداخل فقط (Inner → Outer).

```
Domain (Inner) ← Use Cases ← Infrastructure (Outer)
```

**ممنوع:**
- Domain يعتمد على Infrastructure ❌
- Domain يعتمد على Application ❌
- Application يعتمد على Presentation ❌

---

## 📁 Code Organization

### Directory Structure (STRICT)

```
src/
├── core/                          # Core business logic
│   ├── domain/                    # Domain entities & value objects
│   │   ├── entities/             # Domain entities (User, Appointment, etc.)
│   │   └── value-objects/        # Value objects (Email, Money, etc.)
│   ├── interfaces/               # Contracts (dependency inversion)
│   │   ├── repositories/         # IUserRepository, IAppointmentRepository
│   │   ├── services/             # IEmailService, IPaymentService
│   │   └── use-cases/            # Use case interfaces
│   ├── use-cases/                # Application business rules
│   │   ├── users/
│   │   │   ├── create-user.use-case.ts
│   │   │   └── update-user.use-case.ts
│   │   └── appointments/
│   │       └── book-appointment.use-case.ts
│   └── errors/                   # Custom error classes
│
├── infrastructure/                # External integrations
│   ├── supabase/
│   │   ├── client.ts             # Singleton client
│   │   └── repositories/         # Repository implementations
│   ├── stripe/                   # Payment gateway
│   ├── email/                    # Email service
│   └── integrations/             # External APIs
│       ├── saudi-health/
│       └── whatsapp/
│
├── features/                      # Feature modules (Vertical Slices)
│   ├── auth/
│   │   ├── api/                  # API routes
│   │   ├── components/           # Feature-specific UI
│   │   ├── hooks/                # Feature hooks
│   │   ├── services/             # Feature services
│   │   ├── types/                # Feature types
│   │   └── validations/          # Zod schemas
│   └── appointments/
│       └── [same structure]
│
├── shared/                        # Shared across features
│   ├── components/               # Reusable UI (Atomic Design)
│   │   ├── atoms/                # Button, Input, Badge
│   │   ├── molecules/            # FormField, Card
│   │   ├── organisms/            # Header, DataTable
│   │   └── templates/            # Page layouts
│   ├── hooks/                    # useAuth, useToast, etc.
│   ├── utils/                    # Pure utility functions
│   ├── constants/                # Global constants
│   ├── types/                    # Shared TypeScript types
│   └── validations/              # Shared Zod schemas
│
└── config/                        # Configuration
    ├── env.ts                    # Environment validation
    └── features.ts               # Feature flags
```

### Import Order (STRICT)

```typescript
// 1. External dependencies
import { useState, useEffect } from 'react'
import { z } from 'zod'

// 2. Internal - by layer (core → infrastructure → features → shared)
import { UserEntity } from '@/core/domain/entities'
import { IUserRepository } from '@/core/interfaces/repositories'
import { CreateUserUseCase } from '@/core/use-cases/users'
import { UserRepository } from '@/infrastructure/supabase/repositories'

// 3. Feature-specific
import { UserCard } from '@/features/users/components'

// 4. Shared utilities
import { formatDate } from '@/shared/utils'
import { Button } from '@/shared/components/atoms'

// 5. Types
import type { User, UserRole } from '@/shared/types'

// 6. Styles (last)
import styles from './styles.module.css'
```

---

## 🎯 Centralization Strategy

### 1. Single Source of Truth

#### ❌ FORBIDDEN: Duplicated Logic
```typescript
// File 1
function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// File 2
function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) // ❌ DUPLICATE
}
```

#### ✅ CORRECT: Centralized Validation
```typescript
// src/shared/validations/common.validations.ts
export const emailSchema = z.string().email('Invalid email format')

// Usage everywhere
import { emailSchema } from '@/shared/validations/common.validations'
```

---

### 2. Configuration Centralization

```typescript
// ✅ CORRECT: All config in one place
// src/config/env.ts
export const env = {
  DATABASE_URL: process.env.DATABASE_URL!,
  STRIPE_KEY: process.env.STRIPE_SECRET_KEY!,
}

// ❌ FORBIDDEN: Scattered config
const dbUrl = process.env.DATABASE_URL // ❌
const stripeKey = process.env.STRIPE_KEY // ❌
```

---

### 3. API Client Centralization

```typescript
// ✅ CORRECT: Single configured client
// src/infrastructure/supabase/client.ts
export const supabaseAdmin = createClient(url, key, config)

// ❌ FORBIDDEN: Multiple instances
const supabase1 = createClient(...) // ❌
const supabase2 = createClient(...) // ❌
```

---

### 4. Error Handling Centralization

```typescript
// ✅ CORRECT: Global error handler
// src/core/errors/base.error.ts
export abstract class AppError extends Error {
  abstract statusCode: number
  abstract code: string
}

// src/core/api/middleware/error-handler.ts
export function withErrorHandler(handler: Function) {
  return async (req, context) => {
    try {
      return await handler(req, context)
    } catch (error) {
      if (error instanceof AppError) {
        return errorResponse(error.message, error.statusCode, error.code)
      }
      return errorResponse('Internal server error', 500, 'INTERNAL_ERROR')
    }
  }
}

// ❌ FORBIDDEN: Scattered error handling
try {
  // ...
} catch (e) {
  return { error: e.message } // ❌ Inconsistent format
}
```

---

### 5. Constants Centralization

```typescript
// ✅ CORRECT: Grouped by domain
// src/shared/constants/appointments.ts
export const APPOINTMENT_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
} as const

// src/shared/constants/users.ts
export const USER_ROLES = {
  ADMIN: 'admin',
  DOCTOR: 'doctor',
  PATIENT: 'patient',
} as const

// ❌ FORBIDDEN: Magic strings/numbers
if (status === 'pending') { } // ❌
if (role === 'doctor') { } // ❌
```

---

## 🚫 Development Rules (STRICT)

### Rule 1: No Mock Data in Production Code
```typescript
// ❌ FORBIDDEN
const MOCK_USERS = [
  { id: 1, name: 'Test User' }
]

// ✅ CORRECT: Use real data or feature flags
if (process.env.NODE_ENV === 'development') {
  // Only in development
}
```

---

### Rule 2: No Simulation or Fake Data
```typescript
// ❌ FORBIDDEN
function simulatePayment() {
  return { success: true, transactionId: 'fake_123' }
}

// ✅ CORRECT: Real implementation or throw error
async function processPayment() {
  if (!STRIPE_KEY) {
    throw new Error('Payment service not configured')
  }
  return await stripe.charges.create(...)
}
```

---

### Rule 3: No Data Loss (Context Preservation)
```typescript
// ❌ FORBIDDEN: Data transformation without preserving original
function transformUser(user: User) {
  return { name: user.name } // Lost other data
}

// ✅ CORRECT: Preserve all context
function transformUser(user: User): UserDTO {
  return {
    ...user,
    displayName: `${user.firstName} ${user.lastName}`,
    // All fields preserved
  }
}
```

---

### Rule 4: No Code Duplication (DRY)
```typescript
// ❌ FORBIDDEN: Repeated logic
function createUser() {
  // validation code
  // database code
  // email code
}

function updateUser() {
  // same validation code ❌
  // same database code ❌
  // same email code ❌
}

// ✅ CORRECT: Extract to shared utilities
function validateUserInput(input: UserInput) { }
function sendWelcomeEmail(email: string) { }
function saveUser(user: User) { }
```

---

### Rule 5: Type Safety (No `any`)
```typescript
// ❌ FORBIDDEN
function processData(data: any) { }
const result: any = await fetchData()

// ✅ CORRECT
function processData<T extends Record<string, unknown>>(data: T): T { }
const result: User = await fetchData() // Explicit type
```

---

### Rule 6: Error Handling (Never Ignore)
```typescript
// ❌ FORBIDDEN
try {
  await riskyOperation()
} catch (e) {
  // Silent failure
}

// ✅ CORRECT
try {
  await riskyOperation()
} catch (error) {
  logger.error('Operation failed', { error, context })
  throw new AppError('Failed to process request')
}
```

---

### Rule 7: Single Responsibility
```typescript
// ❌ FORBIDDEN: God class
class UserManager {
  // 50+ methods handling everything
}

// ✅ CORRECT: Separate concerns
class UserRepository { /* Data access */ }
class UserService { /* Business logic */ }
class UserValidator { /* Validation */ }
class UserEmailService { /* Email operations */ }
```

---

### Rule 8: Dependency Inversion
```typescript
// ❌ FORBIDDEN: Dependency on concrete implementation
class UserService {
  private repo = new UserRepository() // ❌
}

// ✅ CORRECT: Depend on abstraction
class UserService {
  constructor(private repo: IUserRepository) {} // ✅
}
```

---

## 🔒 Context Preservation Rules

### Rule 1: Always Return Full Context
```typescript
// ❌ FORBIDDEN: Partial data
function getPatient(id: string) {
  return { name: patient.name } // Lost context
}

// ✅ CORRECT: Full entity
function getPatient(id: string): Promise<Patient | null> {
  return patientRepo.findById(id) // Returns full Patient entity
}
```

---

### Rule 2: Preserve Relationships
```typescript
// ❌ FORBIDDEN: Lose relationships
const appointments = await getAppointments()
// appointments without patient data

// ✅ CORRECT: Include relationships
const appointments = await getAppointments({
  include: ['patient', 'doctor'] // Preserve context
})
```

---

### Rule 3: Transaction Integrity
```typescript
// ❌ FORBIDDEN: Partial updates without rollback
await updateUser(id, data)
await sendEmail(email) // If this fails, user is updated but email not sent

// ✅ CORRECT: Transaction or compensation
await supabase.rpc('update_user_with_email', {
  user_id: id,
  user_data: data,
  email: email
}) // Atomic operation
```

---

## 🎨 File Naming Conventions (STRICT)

### Services
```
✅ user.service.ts              # Service implementation
✅ appointment.service.ts
❌ userService.ts               # Wrong casing
❌ UserService.ts               # Should match file name
```

### Repositories
```
✅ user.repository.ts           # Repository implementation
✅ appointment.repository.ts
❌ UserRepo.ts                  # Wrong naming
```

### Use Cases
```
✅ create-user.use-case.ts      # Use case implementation
✅ book-appointment.use-case.ts
❌ createUser.ts                # Missing .use-case suffix
```

### Components
```
✅ UserCard.tsx                 # PascalCase for components
✅ AppointmentForm.tsx
❌ userCard.tsx                 # Wrong casing
```

### Hooks
```
✅ use-user.hook.ts             # Prefix: use-
✅ use-appointments.hook.ts
❌ userHook.ts                  # Wrong naming
```

### Types
```
✅ user.types.ts                # Feature-specific types
✅ appointment.types.ts
✅ shared-types.ts              # Shared types
```

---

## 📐 API Route Structure (STRICT)

```typescript
// ✅ CORRECT: Thin API layer
// app/api/users/route.ts
import { withErrorHandler } from '@/core/api/middleware'
import { CreateUserUseCase } from '@/core/use-cases/users'
import { createUserSchema } from '@/features/users/validations'

export const POST = withErrorHandler(async (req: Request) => {
  // 1. Authentication
  const user = await requireAuth(req)
  
  // 2. Authorization
  await requireRole('admin')(req, user)
  
  // 3. Validation
  const body = await req.json()
  const validated = createUserSchema.parse(body)
  
  // 4. Use case execution
  const useCase = new CreateUserUseCase(userRepo, emailService)
  const result = await useCase.execute(validated)
  
  // 5. Response
  return successResponse(result, 201)
})

// ❌ FORBIDDEN: Business logic in API routes
export const POST = async (req: Request) => {
  // Validation ❌
  // Business logic ❌
  // Database calls ❌
  // Email sending ❌
}
```

---

## 🧪 Testing Rules

### Rule 1: No Tests Without Implementation
```typescript
// ❌ FORBIDDEN: Test for non-existent feature
it('should process payment', () => {
  // Feature doesn't exist
})

// ✅ CORRECT: Test existing implementation
it('should create user', async () => {
  const useCase = new CreateUserUseCase(mockRepo, mockEmail)
  const result = await useCase.execute(validInput)
  expect(result).toBeDefined()
})
```

---

### Rule 2: Use Real Interfaces, Mock Implementations
```typescript
// ✅ CORRECT: Mock implements interface
const mockRepo: IUserRepository = {
  findById: vi.fn().mockResolvedValue(mockUser),
  create: vi.fn().mockResolvedValue(mockUser),
}

// ❌ FORBIDDEN: Mock without interface
const mockRepo = {
  findById: () => {}, // No type safety
}
```

---

## 🚨 Anti-Patterns & Forbidden Practices

### 1. ❌ God Classes
```typescript
// File with 500+ lines, 20+ methods
class UserManager { } // ❌
```

**Solution:** Split into focused classes.

---

### 2. ❌ Magic Numbers/Strings
```typescript
if (status === 3) { } // ❌
if (role === 'admin') { } // ❌

// ✅ Use constants
if (status === APPOINTMENT_STATUS.CONFIRMED) { }
if (role === USER_ROLES.ADMIN) { }
```

---

### 3. ❌ Circular Dependencies
```typescript
// File A imports File B
// File B imports File A
// ❌ Circular dependency
```

**Solution:** Extract shared code to separate module.

---

### 4. ❌ Side Effects in Pure Functions
```typescript
function calculateTotal(items: Item[]) {
  sendAnalytics() // ❌ Side effect
  return items.reduce((sum, item) => sum + item.price, 0)
}

// ✅ Pure function
function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0)
}
```

---

### 5. ❌ Console.log in Production
```typescript
console.log('User data:', user) // ❌

// ✅ Use logger
logger.info({ userId: user.id }, 'User created')
```

---

### 6. ❌ Hardcoded Values
```typescript
const API_URL = 'https://api.example.com' // ❌

// ✅ Environment variables
const API_URL = process.env.API_URL!
```

---

### 7. ❌ Non-null Assertion Without Guard
```typescript
const email = user!.email // ❌

// ✅ Type guard
if (!user) throw new NotFoundError('User not found')
const email = user.email // Safe
```

---

### 8. ❌ Mutations in Pure Functions
```typescript
function addItem(arr: string[], item: string) {
  arr.push(item) // ❌ Mutates input
  return arr
}

// ✅ Immutable
function addItem(arr: readonly string[], item: string): string[] {
  return [...arr, item]
}
```

---

## 📋 Code Review Checklist

### Architecture
- [ ] Follows Clean Architecture layers
- [ ] Uses Repository Pattern for data access
- [ ] Uses Service/Use Case pattern for business logic
- [ ] No business logic in API routes
- [ ] No direct database calls outside repositories
- [ ] Dependencies flow inward (Domain ← Use Cases ← Infrastructure)

### Code Quality
- [ ] No TypeScript errors (`tsc --noEmit`)
- [ ] No ESLint errors
- [ ] No `any` types (use `unknown` + type guards)
- [ ] No code duplication (DRY principle)
- [ ] Single Responsibility Principle
- [ ] Functions are small and focused (< 50 lines)

### Centralization
- [ ] Validation schemas centralized
- [ ] Constants centralized by domain
- [ ] Error handling uses global handler
- [ ] API client is singleton
- [ ] Configuration in single file

### Context Preservation
- [ ] No data loss in transformations
- [ ] Relationships preserved in queries
- [ ] Full entity returned, not partial
- [ ] Transaction integrity maintained

### Testing
- [ ] Unit tests for business logic
- [ ] Integration tests for API endpoints
- [ ] Mocks implement interfaces
- [ ] No tests for non-existent features

### Security
- [ ] Input validation with Zod
- [ ] Authentication on protected routes
- [ ] Authorization (RBAC) enforced
- [ ] No secrets in code
- [ ] SQL injection prevention

### Performance
- [ ] No N+1 queries
- [ ] Pagination on lists
- [ ] Indexes on filtered columns
- [ ] Memoization where appropriate

---

## 🎯 Development Workflow

### 1. Planning Phase
```markdown
1. Identify affected layers (Domain, Use Cases, Infrastructure, Presentation)
2. Check for existing patterns (Repository, Service, etc.)
3. Design API contract (Request/Response types)
4. Identify dependencies
```

### 2. Implementation Phase
```markdown
1. Start from Domain (entities, value objects)
2. Define interfaces (repositories, services)
3. Implement use cases
4. Implement infrastructure (repositories)
5. Implement API routes (thin layer)
6. Implement UI components
```

### 3. Validation Phase
```markdown
1. Run type checking: `tsc --noEmit`
2. Run linter: `npm run lint`
3. Check for duplication
4. Verify context preservation
5. Test manually
```

---

## 📚 References & Standards

### Design Patterns
- Repository Pattern (Data Access)
- Service Layer Pattern (Business Logic)
- Factory Pattern (Complex Object Creation)
- Strategy Pattern (Algorithm Variation)
- Dependency Injection (Loose Coupling)

### Architecture Principles
- Clean Architecture (Uncle Bob)
- SOLID Principles
- Domain-Driven Design (DDD)
- Dependency Inversion Principle

### Code Quality
- DRY (Don't Repeat Yourself)
- KISS (Keep It Simple, Stupid)
- YAGNI (You Aren't Gonna Need It)
- Composition over Inheritance

---

## ✅ Final Checklist Before Commit

- [ ] Architecture rules followed
- [ ] No code duplication
- [ ] No mock/simulation data
- [ ] Context preserved
- [ ] Type safety maintained
- [ ] Error handling implemented
- [ ] Centralization checked
- [ ] Tests written (if applicable)
- [ ] Documentation updated
- [ ] No `any` types
- [ ] No console.log
- [ ] No hardcoded values
- [ ] Linter passes
- [ ] TypeScript compiles

---

**Version:** 1.0.0  
**Last Updated:** 2024-12-08  
**Maintained By:** Architecture Team

