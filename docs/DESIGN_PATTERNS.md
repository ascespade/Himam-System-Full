# 🎨 Design Patterns Implementation Guide

## 📋 Patterns Used in This Project

### 1. Repository Pattern
**Purpose:** Abstract data access layer

**Implementation:**
```typescript
// src/core/interfaces/repositories/user.repository.interface.ts
export interface IUserRepository {
  findById(id: string): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  create(data: CreateUserInput): Promise<User>
  update(id: string, data: Partial<User>): Promise<User>
  delete(id: string): Promise<void>
}

// src/infrastructure/supabase/repositories/user.repository.ts
export class UserRepository implements IUserRepository {
  constructor(private client: SupabaseClient) {}
  
  async findById(id: string): Promise<User | null> {
    // Implementation
  }
}
```

**Usage Rule:** Always use interface, never concrete implementation directly in business logic.

---

### 2. Use Case Pattern
**Purpose:** Single business operation encapsulation

**Implementation:**
```typescript
// src/core/use-cases/users/create-user.use-case.ts
export class CreateUserUseCase {
  constructor(
    private userRepo: IUserRepository,
    private emailService: IEmailService,
    private logger: ILogger
  ) {}

  async execute(input: CreateUserInput): Promise<User> {
    // 1. Validation (delegate to Zod schema)
    const validated = createUserSchema.parse(input)

    // 2. Business rules
    const existing = await this.userRepo.findByEmail(validated.email)
    if (existing) {
      throw new ConflictError('Email already exists')
    }

    // 3. Create user
    const user = await this.userRepo.create(validated)

    // 4. Side effects
    await this.emailService.sendWelcomeEmail(user.email)
    this.logger.info({ userId: user.id }, 'User created')

    return user
  }
}
```

**Rule:** One use case = one business operation. No orchestration between use cases within a use case.

---

### 3. Factory Pattern
**Purpose:** Complex object creation

**Implementation:**
```typescript
// src/core/domain/factories/appointment.factory.ts
export class AppointmentFactory {
  static createBooking(input: BookingInput): Appointment {
    return {
      id: generateId(),
      patientId: input.patientId,
      doctorId: input.doctorId,
      date: input.date,
      status: 'pending',
      createdAt: new Date(),
    }
  }

  static createRecurring(input: RecurringBookingInput): Appointment[] {
    // Complex logic for recurring appointments
  }
}
```

---

### 4. Strategy Pattern
**Purpose:** Algorithm variation

**Implementation:**
```typescript
// src/core/interfaces/services/payment-strategy.interface.ts
export interface IPaymentStrategy {
  processPayment(amount: number, metadata: PaymentMetadata): Promise<PaymentResult>
}

// src/infrastructure/stripe/stripe-payment.strategy.ts
export class StripePaymentStrategy implements IPaymentStrategy {
  async processPayment(amount: number, metadata: PaymentMetadata): Promise<PaymentResult> {
    // Stripe implementation
  }
}

// src/infrastructure/paypal/paypal-payment.strategy.ts
export class PayPalPaymentStrategy implements IPaymentStrategy {
  async processPayment(amount: number, metadata: PaymentMetadata): Promise<PaymentResult> {
    // PayPal implementation
  }
}
```

---

### 5. Observer Pattern (Real-time)
**Purpose:** Event-driven updates

**Implementation:**
```typescript
// Using Supabase Realtime subscriptions
const subscription = supabase
  .channel('doctor-appointments')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, 
    (payload) => {
      // React to changes
      updateUI(payload)
    }
  )
  .subscribe()
```

---

## 🏛️ Clean Architecture Layers

### Domain Layer (Inner)
```typescript
// src/core/domain/entities/user.entity.ts
export class UserEntity {
  constructor(
    public readonly id: string,
    public readonly email: Email,
    public readonly name: string,
    public readonly role: UserRole
  ) {}

  // Domain methods (pure business logic)
  canAccessFeature(feature: Feature): boolean {
    return this.role.hasPermission(feature)
  }
}
```

**Rules:**
- NO dependencies on other layers
- Pure TypeScript (no framework code)
- Business logic only

---

### Application Layer
```typescript
// src/core/use-cases/appointments/book-appointment.use-case.ts
export class BookAppointmentUseCase {
  constructor(
    private appointmentRepo: IAppointmentRepository,
    private patientRepo: IPatientRepository,
    private notificationService: INotificationService
  ) {}

  async execute(input: BookAppointmentInput): Promise<Appointment> {
    // Orchestrate domain and infrastructure
  }
}
```

**Rules:**
- Depends on Domain interfaces
- Orchestrates use cases
- NO framework dependencies

---

### Infrastructure Layer
```typescript
// src/infrastructure/supabase/repositories/appointment.repository.ts
export class AppointmentRepository implements IAppointmentRepository {
  constructor(private client: SupabaseClient) {}

  async create(data: CreateAppointmentInput): Promise<Appointment> {
    // Database implementation
  }
}
```

**Rules:**
- Implements interfaces from Domain/Application
- Can use frameworks (Supabase, Stripe, etc.)
- Maps database to domain entities

---

### Presentation Layer
```typescript
// app/api/appointments/route.ts
export const POST = withErrorHandler(async (req: Request) => {
  const useCase = new BookAppointmentUseCase(repos, services)
  const result = await useCase.execute(validatedInput)
  return successResponse(result)
})
```

**Rules:**
- Thin layer (delegates to use cases)
- Input validation
- Response formatting
- NO business logic

---

## 🔄 Dependency Flow

```
Presentation → Application → Domain ← Infrastructure
     ↓              ↓           ↑           ↑
  (depends)    (depends)   (interface)  (implements)
```

**Visual:**
```
┌─────────────┐
│ Presentation│
│  (app/)     │
└──────┬──────┘
       │ depends on
       ↓
┌─────────────┐
│ Application │
│  (use-cases)│
└──────┬──────┘
       │ depends on
       ↓
┌─────────────┐
│   Domain    │ ← Infrastructure implements
│ (entities)  │   (repositories, services)
└─────────────┘
```

---

## 📐 Code Structure Example

### Feature: User Management

```
features/users/
├── api/
│   └── route.ts                    # Thin API layer
├── components/
│   ├── UserCard.tsx                # Feature component
│   └── UserForm.tsx
├── hooks/
│   └── use-user.hook.ts            # Feature hook
├── services/
│   └── user.service.ts             # Feature service (orchestrates use cases)
├── types/
│   └── user.types.ts               # Feature types
└── validations/
    └── user.validations.ts         # Zod schemas

core/use-cases/users/
├── create-user.use-case.ts         # Use case
├── update-user.use-case.ts
└── delete-user.use-case.ts

core/interfaces/repositories/
└── user.repository.interface.ts    # Contract

infrastructure/supabase/repositories/
└── user.repository.ts              # Implementation
```

---

## 🚫 Forbidden Patterns

### 1. ❌ Anemic Domain Model
```typescript
// ❌ BAD: Data container without behavior
class User {
  id: string
  email: string
  // No methods
}

// ✅ GOOD: Rich domain model
class User {
  constructor(
    public readonly id: string,
    public readonly email: Email
  ) {}

  canAccessFeature(feature: Feature): boolean {
    // Business logic
  }
}
```

---

### 2. ❌ Service Layer Anti-Pattern
```typescript
// ❌ BAD: Service with database calls
class UserService {
  async createUser(data: any) {
    const { data } = await supabase.from('users').insert(data) // ❌
  }
}

// ✅ GOOD: Service uses repository
class UserService {
  constructor(private userRepo: IUserRepository) {}
  
  async createUser(data: CreateUserInput) {
    return await this.userRepo.create(data) // ✅
  }
}
```

---

### 3. ❌ Feature Envy
```typescript
// ❌ BAD: Class uses data from another class
class AppointmentService {
  calculatePrice(appointment: Appointment) {
    return appointment.patient.subscription.tier.price // Too many dots
  }
}

// ✅ GOOD: Domain method
class Appointment {
  calculatePrice(patient: Patient): number {
    return this.basePrice * patient.subscription.getMultiplier()
  }
}
```

---

## 📊 Pattern Decision Tree

```
Need to access database?
  → Use Repository Pattern
    → Create interface in core/interfaces/repositories
    → Implement in infrastructure/supabase/repositories

Need business logic?
  → Use Use Case Pattern
    → Create in core/use-cases/[feature]
    → Inject repositories/services

Need complex object creation?
  → Use Factory Pattern
    → Create in core/domain/factories

Need algorithm variation?
  → Use Strategy Pattern
    → Create interface in core/interfaces/services
    → Implement strategies in infrastructure/

Need to react to changes?
  → Use Observer Pattern (Supabase Realtime)
    → Subscribe in components/hooks
```

---

## ✅ Pattern Compliance Checklist

- [ ] All data access through repositories
- [ ] All business logic in use cases
- [ ] Dependencies injected, not created
- [ ] Domain entities have behavior
- [ ] No framework code in domain
- [ ] Interfaces defined before implementations
- [ ] Use cases are single-purpose
- [ ] No business logic in API routes
- [ ] No direct database calls in services

---

**Version:** 1.0.0  
**Last Updated:** 2024-12-08

