# ADR-0001: Repository Pattern for Data Access

**Status**: Accepted  
**Date**: 2024-01-15  
**Deciders**: Architecture Team

## Context

The application needs a consistent way to access database data while maintaining separation of concerns. Services were directly accessing `supabaseAdmin`, violating Clean Architecture principles.

## Decision

We will implement the Repository Pattern:
- All data access goes through Repository interfaces
- Services depend on Repository interfaces, not implementations
- Repositories encapsulate database queries and mapping
- Explicit column selection for performance

## Consequences

### Positive
- ✅ Clear separation of concerns
- ✅ Easy to test (mock repositories)
- ✅ Easy to swap data sources
- ✅ Performance optimization (explicit columns)
- ✅ Type safety

### Negative
- ⚠️ More boilerplate code
- ⚠️ Additional abstraction layer

## Implementation

- `IUserRepository` and `UserRepository` implemented
- `IPatientRepository` and `PatientRepository` implemented
- `BaseRepository` provides common CRUD operations
- Services refactored to use repositories

## References

- Clean Architecture by Robert C. Martin
- Repository Pattern (Martin Fowler)
