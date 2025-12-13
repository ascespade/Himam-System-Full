# 🏗️ Architecture Patterns Documentation

## Overview
This document describes the enterprise-grade architecture patterns implemented in the project.

## 📐 Architecture Layers

### 1. Presentation Layer (`app/`)
- Next.js App Router pages
- API routes (thin layer)
- UI components

### 2. Application Layer (`src/core/`)
- **Use Cases** (`use-cases/`) - Business logic orchestration
- **Services** (`services/`) - Business logic abstraction
- **API Middleware** (`api/`) - Request handling, auth, validation

### 3. Domain Layer (`src/core/domain/`)
- Entities
- Value Objects
- Domain Interfaces

### 4. Infrastructure Layer (`src/infrastructure/`)
- **Repositories** (`supabase/repositories/`) - Data access
- External service integrations
- Database clients

## 🔄 Patterns

### Repository Pattern

**Purpose**: Abstract data access logic

**Structure**:
```typescript
export class MyRepository extends BaseRepository<MyEntity> {
  protected readonly tableName = 'my_table'
  protected readonly selectFields = '*'

  protected mapToEntity(row: unknown): MyEntity {
    // Map database row to entity
  }

  // Custom methods for specific queries
  async findByCustomField(value: string): Promise<MyEntity[]> {
    // Custom query logic
  }
}
```

**Benefits**:
- Centralized data access
- Type-safe queries
- Consistent error handling
- Easy to test and mock

### Service Pattern

**Purpose**: Encapsulate business logic

**Structure**:
```typescript
export class MyService extends BaseService {
  async doSomething(input: Input): Promise<ServiceResult<Output>> {
    return this.execute(
      () => this.repository.operation(input),
      'Error message',
      { context }
    )
  }
}
```

**Benefits**:
- Business logic separation
- Error handling consistency
- Transaction support
- Reusable across use cases

### Use Case Pattern

**Purpose**: Encapsulate single business operation

**Structure**:
```typescript
export class MyUseCase extends BaseUseCase<Input, Output> {
  async execute(input: Input): Promise<UseCaseResult<Output>> {
    // 1. Validate input
    const validation = this.validateInput(input)
    if (validation) return validation

    // 2. Execute business logic
    // 3. Return result
    return this.success(data)
  }
}
```

**Benefits**:
- Single responsibility
- Testable business logic
- Clear input/output contracts
- Reusable across different entry points

## 📊 Data Flow

```
API Route → Use Case → Service → Repository → Database
                ↓
            Validation
                ↓
         Business Logic
                ↓
         Error Handling
                ↓
          Response
```

## 🎯 Best Practices

### 1. Repository Layer
- ✅ Extend `BaseRepository` for common operations
- ✅ Implement `mapToEntity()` for type safety
- ✅ Use repository for data access only
- ❌ Don't put business logic in repositories

### 2. Service Layer
- ✅ Use services for business logic
- ✅ Handle transactions
- ✅ Coordinate multiple repositories
- ❌ Don't access database directly

### 3. Use Case Layer
- ✅ One use case = one business operation
- ✅ Validate input
- ✅ Orchestrate services
- ❌ Don't duplicate business logic

### 4. API Routes
- ✅ Thin layer - delegate to use cases
- ✅ Handle authentication/authorization
- ✅ Format responses
- ❌ Don't put business logic in routes

## 📁 File Organization

```
src/
├── core/
│   ├── api/              # API middleware, handlers
│   ├── domain/           # Domain entities, interfaces
│   ├── repositories/     # Repository interfaces
│   ├── services/         # Business logic services
│   └── use-cases/        # Business operations
├── infrastructure/
│   └── supabase/
│       └── repositories/ # Repository implementations
└── shared/
    ├── components/       # Reusable UI components
    ├── utils/           # Utility functions
    └── types/           # Shared types
```

## 🔒 Error Handling

### Repository Level
- Throw errors for data access failures
- Use custom error types (DatabaseError, NotFoundError)

### Service Level
- Catch repository errors
- Return `ServiceResult` with success/error
- Log errors with context

### Use Case Level
- Validate input
- Handle service errors
- Return `UseCaseResult` with details

### API Level
- Catch use case errors
- Format error responses
- Set appropriate HTTP status codes

## 🧪 Testing Strategy

### Unit Tests
- Test repositories in isolation
- Mock database calls
- Test service business logic
- Test use case validation

### Integration Tests
- Test repository + database
- Test service + repository
- Test use case + service
- Test API route + use case

## 📈 Performance Considerations

1. **Repository**: Use indexes, optimize queries
2. **Service**: Cache frequently accessed data
3. **Use Case**: Minimize database calls
4. **API**: Add pagination, rate limiting

---

**Last Updated**: 2025-12-10
**Version**: 1.0.0

