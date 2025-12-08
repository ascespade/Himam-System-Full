# 🚀 قواعد التطوير - Development Rules (STRICT)

## 🚫 محظورات مطلقة - Absolute Forbidden

### 1. ❌ Mock/Simulation/Fake Data
```typescript
// ❌ FORBIDDEN: Any mock or simulation
const MOCK_USERS = [{ id: 1, name: 'Test' }]
const FAKE_DATA = { ... }
function simulatePayment() { return { success: true } }
function generateFakeAppointments() { return [...] }

// ✅ CORRECT: Use real data or throw error
if (!data) {
  throw new NotFoundError('Data not found')
}
// Or use feature flags for development-only data
if (process.env.NODE_ENV === 'development' && process.env.USE_TEST_DATA === 'true') {
  // Only in development with explicit flag
}
```

**Rule:** Production code MUST use real data. If data doesn't exist, throw appropriate error.

---

### 2. ❌ Data Loss (Context Loss)
```typescript
// ❌ FORBIDDEN: Lose data during transformation
function transformUser(user: User) {
  return { name: user.name } // Lost: email, role, etc.
}

function getAppointmentSummary(apt: Appointment) {
  return { date: apt.date } // Lost context
}

// ✅ CORRECT: Preserve all context
function transformUser(user: User): UserDTO {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    // ALL fields preserved
    displayName: `${user.firstName} ${user.lastName}`,
  }
}

function getAppointmentSummary(apt: Appointment): AppointmentSummary {
  return {
    ...apt, // Preserve all fields
    patientName: apt.patient.name,
    doctorName: apt.doctor.name,
  }
}
```

**Rule:** Always preserve full context. Transform, don't reduce.

---

### 3. ❌ Code Duplication (DRY Violation)
```typescript
// ❌ FORBIDDEN: Repeated logic
function createUser() {
  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) // Validation
  // ... create logic
}

function updateUser() {
  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) // Same validation ❌
  // ... update logic
}

// ✅ CORRECT: Extract to shared
import { emailSchema } from '@/shared/validations/common.validations'
const isValid = emailSchema.safeParse(email).success
```

**Rule:** If code is used 2+ times, extract to shared location.

---

### 4. ❌ Multiple Approaches (Inconsistency)
```typescript
// ❌ FORBIDDEN: Different approaches for same task
// File 1: Uses async/await
async function getData() {
  const res = await fetch('/api/data')
  return await res.json()
}

// File 2: Uses .then()
function getData() {
  return fetch('/api/data').then(res => res.json()) // ❌ Different pattern
}

// ✅ CORRECT: Consistent approach (async/await preferred)
async function getData() {
  const res = await fetch('/api/data')
  return await res.json()
}
```

**Rule:** Use consistent patterns throughout project.

---

### 5. ❌ TypeScript `any` Type
```typescript
// ❌ FORBIDDEN
function process(data: any) { }
const result: any = await fetchData()
const obj: any = { ... }

// ✅ CORRECT: Explicit types or `unknown` with type guards
function process<T extends Record<string, unknown>>(data: T): T { }
const result: User = await fetchData()
const obj: Record<string, unknown> = { ... }

// For truly unknown data:
function process(data: unknown) {
  if (isUser(data)) {
    // Now type-safe
  }
}
```

**Rule:** NEVER use `any`. Use `unknown` + type guards if type is truly unknown.

---

### 6. ❌ Silent Failures
```typescript
// ❌ FORBIDDEN: Ignore errors
try {
  await riskyOperation()
} catch (e) {
  // Silent failure ❌
}

// ❌ FORBIDDEN: Return null without reason
function getUser(id: string) {
  try {
    return await fetchUser(id)
  } catch {
    return null // ❌ Lost error context
  }
}

// ✅ CORRECT: Always handle or propagate
try {
  await riskyOperation()
} catch (error) {
  logger.error('Operation failed', { error, context })
  throw new AppError('Failed to process request')
}

// Or return Result type
function getUser(id: string): Promise<Result<User, NotFoundError>> {
  try {
    const user = await fetchUser(id)
    return { success: true, data: user }
  } catch (error) {
    return { success: false, error: new NotFoundError('User', id) }
  }
}
```

**Rule:** Every error must be logged and handled appropriately.

---

### 7. ❌ Hardcoded Values
```typescript
// ❌ FORBIDDEN
const API_URL = 'https://api.example.com'
const MAX_USERS = 100
const TIMEOUT = 5000

// ✅ CORRECT: Environment variables or constants
const API_URL = process.env.API_URL!
const MAX_USERS = env.MAX_USERS || 100
const TIMEOUT = env.REQUEST_TIMEOUT || 5000

// Or centralize in constants
// src/shared/constants/system.ts
export const MAX_USERS = 100
export const REQUEST_TIMEOUT = 5000
```

**Rule:** No hardcoded values. Use env vars or centralized constants.

---

### 8. ❌ Console.log in Production
```typescript
// ❌ FORBIDDEN
console.log('User created:', user)
console.error('Error:', error)
console.warn('Warning')

// ✅ CORRECT: Use logger
import { logger } from '@/shared/utils/logger'
logger.info({ userId: user.id }, 'User created')
logger.error({ error, context }, 'Operation failed')
logger.warn({ endpoint, duration }, 'Slow request')
```

**Rule:** Use structured logging only. No console.* in production code.

---

### 9. ❌ Business Logic in Wrong Layer
```typescript
// ❌ FORBIDDEN: Business logic in API route
export async function POST(req: Request) {
  const body = await req.json()
  
  // Validation ❌
  if (!body.email || !body.email.includes('@')) {
    return { error: 'Invalid email' }
  }
  
  // Business logic ❌
  const existing = await supabase.from('users').select().eq('email', body.email)
  if (existing.data) {
    return { error: 'Email exists' }
  }
  
  // Database call ❌
  const { data } = await supabase.from('users').insert(body)
  
  // Side effect ❌
  await sendEmail(data.email, 'Welcome')
  
  return { data }
}

// ✅ CORRECT: Thin API layer
export const POST = withErrorHandler(async (req: Request) => {
  const validated = createUserSchema.parse(await req.json())
  const useCase = new CreateUserUseCase(userRepo, emailService)
  const result = await useCase.execute(validated)
  return successResponse(result, 201)
})
```

**Rule:** API routes are thin. All logic in use cases/services.

---

### 10. ❌ Direct Database Access Outside Repository
```typescript
// ❌ FORBIDDEN: Direct database calls
// In service or component
const { data } = await supabase.from('users').select('*') // ❌

// ✅ CORRECT: Through repository
const user = await userRepo.findById(id) // ✅
```

**Rule:** All database access through repositories only.

---

## ✅ Required Practices

### 1. ✅ Type Safety
```typescript
// Always explicit types
function createUser(input: CreateUserInput): Promise<User> {
  // Implementation
}

// Use type guards for unknown data
function isUser(data: unknown): data is User {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'email' in data
  )
}
```

---

### 2. ✅ Error Handling
```typescript
// Always handle errors
try {
  const result = await riskyOperation()
  return result
} catch (error) {
  if (error instanceof ValidationError) {
    throw error // Re-throw known errors
  }
  logger.error('Unexpected error', { error, context })
  throw new AppError('Operation failed')
}
```

---

### 3. ✅ Input Validation
```typescript
// Always validate input
import { createUserSchema } from '@/features/users/validations'

const result = createUserSchema.safeParse(body)
if (!result.success) {
  throw new ValidationError('Invalid input', result.error.flatten().fieldErrors)
}
```

---

### 4. ✅ Context Preservation
```typescript
// Always preserve context
async function getAppointmentWithDetails(id: string): Promise<AppointmentWithDetails> {
  const appointment = await appointmentRepo.findById(id)
  if (!appointment) {
    throw new NotFoundError('Appointment', id)
  }
  
  // Include related data
  const [patient, doctor] = await Promise.all([
    patientRepo.findById(appointment.patientId),
    doctorRepo.findById(appointment.doctorId),
  ])
  
  return {
    ...appointment, // Preserve all appointment data
    patient, // Add related data
    doctor,
  }
}
```

---

### 5. ✅ Immutability
```typescript
// Prefer immutability
// ❌ BAD: Mutation
function addItem(items: string[], item: string) {
  items.push(item)
  return items
}

// ✅ GOOD: Immutable
function addItem(items: readonly string[], item: string): string[] {
  return [...items, item]
}
```

---

### 6. ✅ Single Responsibility
```typescript
// One class/function = one responsibility

// ❌ BAD: Multiple responsibilities
class UserManager {
  validateEmail() { }
  saveToDatabase() { }
  sendEmail() { }
  generateReport() { }
}

// ✅ GOOD: Separate concerns
class UserValidator {
  validateEmail() { }
}

class UserRepository {
  save() { }
}

class EmailService {
  send() { }
}

class ReportGenerator {
  generate() { }
}
```

---

## 🔄 Development Workflow (STRICT)

### Step 1: Planning
```markdown
1. Identify affected layers
2. Check existing patterns
3. Design API contract
4. Identify dependencies
5. Check for existing utilities/constants
```

### Step 2: Implementation Order
```markdown
1. Domain entities/value objects
2. Interfaces (repositories, services)
3. Use cases
4. Infrastructure implementations
5. API routes
6. UI components
```

### Step 3: Validation
```markdown
1. Type checking: tsc --noEmit
2. Linting: npm run lint
3. Check for duplication
4. Verify context preservation
5. Manual testing
```

---

## 📊 Code Quality Metrics

### Function Size
- **Maximum:** 50 lines per function
- **Ideal:** 20-30 lines
- **Exception:** Complex algorithms (document why)

### Class Size
- **Maximum:** 300 lines per class
- **Ideal:** 100-200 lines
- **Exception:** Domain entities (document why)

### File Size
- **Maximum:** 500 lines per file
- **Ideal:** 200-300 lines
- **Split if exceeded**

### Cyclomatic Complexity
- **Maximum:** 10 per function
- **Refactor if exceeded**

---

## 🎯 Context Preservation Rules

### Rule 1: Full Entity Return
```typescript
// ❌ BAD: Partial data
async function getUserName(id: string): Promise<string> {
  const user = await userRepo.findById(id)
  return user?.name || 'Unknown' // Lost user context
}

// ✅ GOOD: Full entity
async function getUser(id: string): Promise<User | null> {
  return await userRepo.findById(id) // Full context preserved
}
```

### Rule 2: Include Relationships
```typescript
// ❌ BAD: Lose relationships
async function getAppointments() {
  return await appointmentRepo.findAll() // No patient/doctor data
}

// ✅ GOOD: Include relationships
async function getAppointments() {
  return await appointmentRepo.findAll({
    include: ['patient', 'doctor'] // Preserve relationships
  })
}
```

### Rule 3: Transaction Integrity
```typescript
// ❌ BAD: Partial updates
await updateUser(id, data)
await sendEmail(email) // If fails, user updated but email not sent

// ✅ GOOD: Atomic or compensation
await supabase.rpc('update_user_with_email', {
  user_id: id,
  user_data: data,
  email: email
}) // Atomic operation
```

---

## 🚨 Code Smell Detection

### Smell 1: Long Parameter List
```typescript
// ❌ BAD: Too many parameters
function createUser(name, email, phone, address, city, country, role, status) { }

// ✅ GOOD: Use object
function createUser(input: CreateUserInput) { }
```

### Smell 2: Feature Envy
```typescript
// ❌ BAD: Class uses data from another class excessively
class AppointmentService {
  calculatePrice(appointment: Appointment) {
    return appointment.patient.subscription.tier.price * appointment.duration
  }
}

// ✅ GOOD: Move logic to domain
class Appointment {
  calculatePrice(patient: Patient): number {
    return this.basePrice * patient.subscription.getMultiplier() * this.duration
  }
}
```

### Smell 3: Data Clumps
```typescript
// ❌ BAD: Related data passed separately
function create(name: string, email: string, phone: string) { }

// ✅ GOOD: Group related data
function create(user: { name: string, email: string, phone: string }) { }
```

---

## 📋 Pre-Commit Checklist

- [ ] No `any` types
- [ ] No console.log
- [ ] No hardcoded values
- [ ] No mock/simulation data
- [ ] No code duplication
- [ ] Context preserved
- [ ] Error handling implemented
- [ ] Input validation added
- [ ] TypeScript compiles (`tsc --noEmit`)
- [ ] Linter passes (`npm run lint`)
- [ ] Tests pass (if applicable)
- [ ] Documentation updated

---

## 🔒 Security Rules

### 1. Input Validation (MANDATORY)
```typescript
// ✅ ALWAYS validate
const validated = createUserSchema.parse(body)

// ❌ NEVER trust input
const user = await createUser(body) // ❌ No validation
```

### 2. Authentication Check (MANDATORY)
```typescript
// ✅ ALWAYS check auth
const user = await requireAuth(req)

// ❌ NEVER skip auth
export async function GET() {
  return await getData() // ❌ No auth check
}
```

### 3. Authorization Check (MANDATORY)
```typescript
// ✅ ALWAYS check permissions
await requireRole('admin', 'doctor')(req, user)

// ❌ NEVER assume permissions
if (user.role === 'admin') { } // ❌ Use centralized function
```

---

## 📈 Performance Rules

### 1. Avoid N+1 Queries
```typescript
// ❌ BAD: N+1 problem
for (const user of users) {
  const appointments = await getAppointments(user.id) // N queries
}

// ✅ GOOD: Single query with join
const appointments = await getAppointmentsForUsers(userIds) // 1 query
```

### 2. Pagination (MANDATORY)
```typescript
// ✅ ALWAYS paginate lists
async function getUsers(page: number = 1, limit: number = 20) {
  return await userRepo.findAll({ page, limit })
}

// ❌ NEVER return all records
async function getUsers() {
  return await userRepo.findAll() // ❌ Could be thousands
}
```

### 3. Index Usage
```typescript
// ✅ Ensure indexes on filtered columns
// Database migration
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_appointments_doctor_date ON appointments(doctor_id, date);

// ❌ Filtering without index
.eq('email', email) // ❌ If no index on email
```

---

**Version:** 1.0.0  
**Last Updated:** 2024-12-08  
**Enforcement:** STRICT - No exceptions

