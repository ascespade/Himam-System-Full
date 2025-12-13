# 📚 Repository Migration Guide

## Overview
This guide documents the migration of repositories to use the `BaseRepository` pattern for consistency and code reuse.

## BaseRepository Benefits

### 1. Common CRUD Operations
- `getAll()` - Get all records with optional filtering
- `getById(id)` - Get single record by ID
- `create(data)` - Create new record
- `update(id, data)` - Update existing record
- `delete(id)` - Delete record
- `getPaginated(options, filters)` - Get paginated results
- `count(filters)` - Count records

### 2. Standardized Error Handling
- Consistent error logging
- Proper error propagation
- Type-safe error handling

### 3. Type Safety
- Generic type support
- Entity mapping
- Type-safe queries

## Migration Pattern

### Before
```typescript
export class WhatsAppSettingsRepository {
  async getAllSettings(): Promise<WhatsAppSettings[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('whatsapp_settings')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data || []) as WhatsAppSettings[]
    } catch (error) {
      logError('Error fetching all WhatsApp settings', error)
      return []
    }
  }
}
```

### After
```typescript
export class WhatsAppSettingsRepository extends BaseRepository<WhatsAppSettings> {
  protected readonly tableName = 'whatsapp_settings'
  protected readonly selectFields = '*'

  protected mapToEntity(row: unknown): WhatsAppSettings {
    const data = row as Record<string, unknown>
    return {
      id: data.id as string,
      // ... map all fields
    }
  }

  async getAllSettings(): Promise<WhatsAppSettings[]> {
    return this.getAll({
      orderBy: { column: 'created_at', ascending: false },
    })
  }
}
```

## Migration Checklist

### ✅ Completed
- [x] `WhatsAppSettingsRepository` - Migrated to BaseRepository
- [x] `ContentItemsRepository` - Logging improvements

### 🔄 In Progress
- [ ] `PatientRepository` - Complex, needs interface preservation
- [ ] `AppointmentRepository` - Needs migration
- [ ] `BillingRepository` - Needs migration
- [ ] `MedicalRecordRepository` - Needs migration
- [ ] `GuardianRepository` - Needs migration

### 📋 Pending
- [ ] `ServicesRepository` - Wrapper, may not need BaseRepository
- [ ] `StatisticsRepository` - Wrapper, may not need BaseRepository
- [ ] `SocialMediaRepository` - Wrapper, may not need BaseRepository
- [ ] `TestimonialsRepository` - Wrapper, may not need BaseRepository
- [ ] `CenterInfoRepository` - Needs migration
- [ ] `CenterValuesRepository` - Wrapper, may not need BaseRepository
- [ ] `CenterFeaturesRepository` - Wrapper, may not need BaseRepository

## Best Practices

### 1. Entity Mapping
Always implement `mapToEntity()` to ensure type safety:
```typescript
protected mapToEntity(row: unknown): YourEntity {
  const data = row as Record<string, unknown>
  return {
    id: data.id as string,
    // Map all fields with proper types
  }
}
```

### 2. Custom Methods
Keep custom business logic methods:
```typescript
async getActiveSettings(): Promise<WhatsAppSettings | null> {
  // Custom logic for active settings
}
```

### 3. Error Handling
Use BaseRepository error handling, but add context:
```typescript
try {
  return await this.getAll(options)
} catch (error) {
  logError('Custom error message', error, { context })
  return []
}
```

## Notes

- **Wrapper Repositories**: Some repositories (like `ServicesRepository`) are wrappers around `ContentItemsRepository`. These may not need BaseRepository migration.
- **Interface Preservation**: Repositories implementing interfaces (like `IPatientRepository`) should maintain interface compatibility.
- **Complex Queries**: Custom complex queries should remain in the repository, using BaseRepository for simple CRUD.

---

**Status**: Phase 2 In Progress
**Last Updated**: 2025-12-10

