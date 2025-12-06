# 📁 Project Structure

This document describes the organized structure of the Himam Enterprise AI System.

## 🏗️ Directory Structure

```
Himam-System-Full/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── ai/                   # AI service endpoints
│   │   ├── billing/              # Billing management
│   │   ├── calendar/              # Google Calendar integration
│   │   ├── crm/                  # CRM synchronization
│   │   ├── patients/             # Patient management
│   │   ├── settings/             # System settings
│   │   ├── signature/             # Digital signatures
│   │   └── whatsapp/             # WhatsApp integration
│   ├── dashboard/                # Admin dashboard pages
│   ├── patients/                 # Patient pages
│   ├── settings/                 # Settings page
│   ├── sign/                     # Signature page
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                   # Home page
│
├── components/                   # React components
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── Hero.tsx
│   └── ...                       # Other UI components
│
├── src/                          # Source code
│   ├── lib/                      # Core libraries
│   │   ├── ai.ts                 # AI service (Gemini + OpenAI)
│   │   ├── calendar.ts           # Google Calendar integration
│   │   ├── config.ts             # Settings management
│   │   ├── supabase.ts           # Supabase clients
│   │   └── index.ts              # Centralized exports
│   │
│   ├── shared/                   # Shared utilities
│   │   ├── types/                # TypeScript types
│   │   │   └── index.ts          # All shared types
│   │   ├── constants/            # Application constants
│   │   │   └── index.ts          # All constants
│   │   ├── utils/                # Utility functions
│   │   │   ├── index.ts          # General utilities
│   │   │   ├── api.ts            # API helpers
│   │   │   └── validation.ts    # Validation functions
│   │   ├── components/           # Shared components
│   │   └── index.ts              # Centralized exports
│   │
│   └── infrastructure/           # External integrations
│       └── supabase/
│           └── repositories/     # Data access layer
│
├── supabase/                     # Supabase configuration
│   ├── functions/                # Edge Functions
│   │   ├── whatsapp/             # WhatsApp webhook
│   │   └── autosync/             # Auto-sync handler
│   └── schema.sql                 # Database schema
│
├── docs/                         # Documentation
│   ├── README.md                 # Documentation index
│   ├── QUICK_START.md            # Setup guide
│   ├── ENTERPRISE_SYSTEM_README.md
│   └── ...
│
├── scripts/                      # Build and utility scripts
├── public/                       # Static assets
└── config files                  # Configuration files
```

## 📦 Key Directories

### `/app`
Next.js App Router directory containing:
- **API Routes**: Server-side API endpoints
- **Pages**: React Server Components pages
- **Layout**: Root layout with metadata

### `/src/lib`
Core business logic libraries:
- `ai.ts`: AI service with Gemini/OpenAI fallback
- `calendar.ts`: Google Calendar integration
- `config.ts`: Dynamic settings management
- `supabase.ts`: Database clients

### `/src/shared`
Shared utilities and types:
- **types/**: All TypeScript interfaces and types
- **constants/**: Application-wide constants
- **utils/**: Reusable utility functions
  - `api.ts`: API response helpers
  - `validation.ts`: Form/data validation

### `/components`
Reusable React components for UI

### `/supabase/functions`
Supabase Edge Functions for serverless operations

## 🔄 Import Patterns

### Centralized Imports
```typescript
// Types and interfaces
import type { SystemSetting, Appointment } from '@/shared/types'

// Constants
import { API_ROUTES, HTTP_STATUS } from '@/shared/constants'

// Utilities
import { formatDate, isValidEmail } from '@/shared/utils'
import { successResponse, errorResponse } from '@/shared/utils/api'

// Core libraries
import { supabaseAdmin, getSettings, askAI } from '@/lib'
```

## 🎯 Best Practices

1. **Centralization**: All shared code in `/src/shared`
2. **Type Safety**: Use TypeScript types from `/src/shared/types`
3. **Consistency**: Use centralized utilities for common operations
4. **Separation**: Business logic in `/src/lib`, UI in `/components`
5. **API Standards**: Use standardized response helpers from `@/shared/utils/api`

## 📝 File Naming Conventions

- **Components**: PascalCase (e.g., `Header.tsx`)
- **Utilities**: camelCase (e.g., `formatDate.ts`)
- **Types**: camelCase (e.g., `types/index.ts`)
- **Constants**: UPPER_SNAKE_CASE for values, camelCase for files
- **API Routes**: `route.ts` (Next.js convention)

