# Complete System Architecture

## Overview

This document describes the complete architecture of the Himam Medical System, including all modules, integrations, and workflows.

## System Modules

### 1. Reception Module
- **Purpose**: Patient registration, queue management, and workflow coordination
- **Key Features**:
  - Complete patient registration with medical fields
  - Queue management system
  - Payment and insurance verification
  - Patient-visit linking to doctor sessions
- **APIs**: `/api/reception/*`
- **Pages**: `/dashboard/reception/*`

### 2. Guardian Module
- **Purpose**: Guardian-patient relationship management with permission-based access
- **Key Features**:
  - Link guardians to patients
  - Permission-based data access
  - Procedure approval system
  - WhatsApp notifications
- **APIs**: `/api/guardian/*`
- **Pages**: `/dashboard/guardian/*`

### 3. Supervisor Module
- **Purpose**: Medical supervision, quality monitoring, and critical case management
- **Key Features**:
  - Session reviews
  - Quality metrics tracking
  - Critical case detection and management
  - Comprehensive dashboard
- **APIs**: `/api/supervisor/*`
- **Pages**: `/dashboard/supervisor/*`

### 4. WhatsApp Integration
- **Purpose**: Automated patient onboarding, reminders, and guardian notifications
- **Key Features**:
  - AI-powered patient registration
  - Appointment reminders
  - Guardian notifications
  - Smart appointment booking
- **APIs**: `/api/whatsapp/*`

### 5. Continuous Learning System
- **Purpose**: AI template learning and error pattern tracking
- **Key Features**:
  - Template learning from successful claims
  - Error pattern detection
  - AI interaction logging
- **Services**: `src/core/ai/*`

### 6. Vector Embeddings & Knowledge Base
- **Purpose**: Semantic search for knowledge base
- **Key Features**:
  - Vector embeddings for content
  - Similarity search
  - Knowledge management
- **Services**: `src/lib/vector/*`

## Database Schema

### Core Tables
- `patients` - Enhanced with all medical fields
- `users` - Extended with guardian and supervisor roles
- `guardian_patient_relationships` - Guardian-patient links
- `supervisor_reviews` - Quality reviews
- `supervisor_quality_metrics` - Quality tracking
- `critical_cases` - Critical case management
- `reception_queue` - Queue management
- `patient_visits` - Visit tracking
- `patient_insurance` - Insurance records
- `template_learning` - AI learning
- `error_pattern_learning` - Error tracking
- `ai_learning_logs` - AI interaction logs
- `knowledge_base_embeddings` - Vector storage

## Architecture Patterns

### Repository Pattern
- Interfaces in `src/core/interfaces/repositories/`
- Implementations in `src/infrastructure/supabase/repositories/`
- Dependency injection for testability

### Business Rules Engine
- Located in `src/core/business-rules/`
- Payment verification
- Session validation
- Template learning

### Resilience Patterns
- Retry logic in `src/core/resilience/retry.ts`
- Circuit breaker in `src/core/resilience/circuit-breaker.ts`

## Integrations

### WhatsApp
- Cloud API integration
- AI-powered responses
- Automated workflows

### Slack
- Commands: `/patient-status`, `/system-health`, `/support`
- Webhooks for events
- Notifications

### Vector Search
- pgvector extension
- OpenAI embeddings
- Semantic search

## Workflows

### Reception → Doctor
1. Patient checks in at reception
2. Added to queue
3. Payment/insurance verification
4. Confirmed to doctor
5. Patient visit created
6. Doctor session starts

### WhatsApp → Patient Registration
1. Patient messages via WhatsApp
2. AI extracts patient data
3. Patient record created
4. Appointment suggested
5. Confirmation sent

### Guardian Notifications
1. Event occurs (appointment, session, etc.)
2. System checks guardian relationships
3. Notifications sent via WhatsApp
4. Approval requests if needed

### Supervisor Monitoring
1. Automated patient monitoring (cron)
2. Risk detection
3. Critical case creation
4. Alerts to supervisors
5. Review and resolution

## Security

### Authentication
- Supabase Auth
- JWT tokens
- Role-based access

### Authorization
- RLS policies on all tables
- Role-based API access
- Permission-based data filtering

### Data Protection
- Input validation (Zod)
- SQL injection prevention
- XSS protection

## Performance

### Caching
- Redis with in-memory fallback
- Cache invalidation strategies

### Database
- Indexes on all foreign keys
- Optimized queries
- Pagination everywhere

### Monitoring
- Error tracking (Sentry)
- Performance metrics
- Health checks

## Deployment

### Environment Variables
- `DATABASE_URL` - PostgreSQL connection
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key
- `OPENAI_API_KEY` - For embeddings
- `SLACK_BOT_TOKEN` - Slack integration
- `REDIS_URL` - Redis connection (optional)

### Migrations
- All migrations in `supabase/migrations/`
- Timestamped for ordering
- Idempotent (safe to re-run)

## Testing

### Type Checking
```bash
npm run type-check
```

### Linting
```bash
npm run lint
```

### Build
```bash
npm run build
```

## Documentation

- `docs/RECEPTION_MODULE_COMPLETE.md` - Reception module details
- `docs/GUARDIAN_MODULE_COMPLETE.md` - Guardian module details
- `docs/SUPERVISOR_MODULE_COMPLETE.md` - Supervisor module details
- `docs/WHATSAPP_INTEGRATION_COMPLETE.md` - WhatsApp integration
- `docs/COMPLETE_SYSTEM_ARCHITECTURE.md` - This document
