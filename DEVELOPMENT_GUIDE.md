# Development Guide
## Centralized Architecture & Best Practices

This guide outlines the standardized development methodology for the project.

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [API Routes](#api-routes)
3. [Data Fetching](#data-fetching)
4. [Component Patterns](#component-patterns)
5. [Validation](#validation)
6. [Error Handling](#error-handling)
7. [Code Standards](#code-standards)

---

## 🏗️ Architecture Overview

### Directory Structure

```
src/
├── core/                    # Core business logic
│   ├── api/                # API middleware & utilities
│   ├── services/           # Service layer (business logic)
│   ├── hooks/              # Custom React hooks
│   └── validations/         # Zod schemas
├── infrastructure/          # External integrations
│   └── supabase/           # Database repositories
├── shared/                 # Shared utilities & components
│   ├── components/        # Reusable UI components
│   ├── utils/             # Utility functions
│   ├── types/             # TypeScript types
│   └── constants/         # Constants
└── features/               # Feature modules (future)
```

---

## 🔌 API Routes

### Standard Pattern

All API routes MUST follow this pattern:

```typescript
import { withAuth, getQueryParams, getPaginationParams, parseRequestBody } from '@/core/api/middleware'
import { successResponse, errorResponse, paginatedResponse } from '@/shared/utils/api'
import { HTTP_STATUS } from '@/shared/constants'
import { z } from 'zod'

// GET - List resources
export const GET = withAuth(async (context) => {
  const { request, user } = context
  const { page, limit, offset } = getPaginationParams(request)
  
  // ... fetch data
  
  return NextResponse.json(
    paginatedResponse(data, page, limit, total)
  )
}, {
  requireRoles: ['admin'], // Optional
})

// POST - Create resource
export const POST = withAuth(async (context) => {
  const { request } = context
  const body = await parseRequestBody(request)
  const validated = schema.parse(body)
  
  // ... create resource
  
  return NextResponse.json(
    successResponse(result),
    { status: HTTP_STATUS.CREATED }
  )
})
```

### Key Points

- ✅ Always use `withAuth` wrapper for authentication
- ✅ Use `parseRequestBody` for body parsing
- ✅ Use `getPaginationParams` for pagination
- ✅ Use `successResponse` / `errorResponse` / `paginatedResponse`
- ✅ Use Zod schemas for validation
- ❌ Never use `console.error` - use error handling utilities
- ❌ Never return inline JSON - use response helpers

---

## 📡 Data Fetching

### Client-Side Hooks

Use centralized hooks for all data fetching:

```typescript
import { useApi, useMutation } from '@/core/hooks/use-api'

// Fetching data
function MyComponent() {
  const { data, loading, error, refetch } = useApi<User[]>('/api/users', {
    immediate: true,
    onSuccess: (data) => {
      // Optional callback
    },
  })

  if (loading) return <Loading />
  if (error) return <Error message={error} />
  
  return <UserList users={data} />
}

// Mutations
function CreateUser() {
  const { mutate, loading } = useMutation<User, CreateUserInput>(
    '/api/users',
    'POST'
  )

  const handleSubmit = async (formData: CreateUserInput) => {
    await mutate(formData)
  }
}
```

### Key Points

- ✅ Always use `useApi` for GET requests
- ✅ Always use `useMutation` for POST/PUT/DELETE
- ✅ Handle loading and error states
- ❌ Never use raw `fetch` in components
- ❌ Never use `useState` + `useEffect` for data fetching

---

## 🧩 Component Patterns

### Standard Component Structure

```typescript
'use client'

import { useApi } from '@/core/hooks/use-api'
import { Button } from '@/shared/components/ui'
import type { User } from '@/shared/types'

interface MyComponentProps {
  userId: string
  onSuccess?: () => void
}

export default function MyComponent({ userId, onSuccess }: MyComponentProps) {
  const { data: user, loading, error } = useApi<User>(`/api/users/${userId}`)

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage error={error} />
  if (!user) return <NotFound />

  return (
    <div>
      {/* Component content */}
    </div>
  )
}
```

### Key Points

- ✅ Always mark client components with `'use client'`
- ✅ Use TypeScript interfaces for props
- ✅ Handle loading, error, and empty states
- ✅ Use shared UI components
- ❌ Don't mix server and client logic

---

## ✅ Validation

### Zod Schemas

All validation MUST use Zod schemas from `@/core/validations/schemas`:

```typescript
import { createUserSchema, updateUserSchema } from '@/core/validations/schemas'

// In API route
const body = await parseRequestBody(request)
const validated = createUserSchema.parse(body) // Throws on invalid

// In component (optional, for client-side validation)
const result = createUserSchema.safeParse(formData)
if (!result.success) {
  // Handle validation errors
}
```

### Key Points

- ✅ Use centralized schemas from `@/core/validations/schemas`
- ✅ Validate in API routes (server-side)
- ✅ Optionally validate in components (client-side)
- ❌ Never skip validation
- ❌ Never create inline validation logic

---

## ⚠️ Error Handling

### API Routes

Errors are automatically handled by `withAuth` wrapper:

```typescript
export const GET = withAuth(async (context) => {
  // Any thrown error is automatically caught and formatted
  if (!data) {
    throw new Error('Not found') // Automatically becomes 404
  }
  // ...
})
```

### Components

Use error states from hooks:

```typescript
const { data, error } = useApi('/api/users')

if (error) {
  return <ErrorMessage error={error} />
}
```

### Key Points

- ✅ Errors are automatically handled in API routes
- ✅ Always check `error` state in components
- ✅ Use toast notifications for user feedback
- ❌ Never use `console.error` in production code
- ❌ Never silently ignore errors

---

## 📝 Code Standards

### TypeScript

- ✅ Always use explicit types
- ✅ Never use `any` - use `unknown` + type guards
- ✅ Use interfaces for object shapes
- ✅ Use types for unions/intersections

### Naming Conventions

- **Files**: `kebab-case.ts` (e.g., `user-service.ts`)
- **Components**: `PascalCase.tsx` (e.g., `UserCard.tsx`)
- **Hooks**: `use-kebab-case.ts` (e.g., `use-user-data.ts`)
- **Types/Interfaces**: `PascalCase` (e.g., `User`, `ApiResponse`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `MAX_RETRY_ATTEMPTS`)

### Imports Order

```typescript
// 1. External dependencies
import { useState } from 'react'
import { z } from 'zod'

// 2. Internal core modules
import { withAuth } from '@/core/api/middleware'
import { useApi } from '@/core/hooks/use-api'

// 3. Shared utilities
import { successResponse } from '@/shared/utils/api'
import { Button } from '@/shared/components/ui'

// 4. Types
import type { User } from '@/shared/types'
```

---

## 🚀 Migration Checklist

When updating existing code:

- [ ] Replace inline auth checks with `withAuth`
- [ ] Replace raw `fetch` with `useApi` / `useMutation`
- [ ] Replace inline validation with Zod schemas
- [ ] Replace inline error handling with utilities
- [ ] Replace `console.error` with proper logging
- [ ] Ensure consistent response formats
- [ ] Add TypeScript types
- [ ] Update imports to use path aliases

---

## 📚 Examples

See `src/core/api/standard-route.ts` for a complete API route template.

See `app/api/users/route.ts` for a migrated example.

---

**Last Updated**: 2024-12-09
