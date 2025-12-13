# Himam Enterprise AI System v2.0.0

Enterprise-grade unified automation platform for Himam Medical Center.

## 🚀 Quick Start

1.  **Clone the repository**
    ```bash
    git clone https://github.com/your-username/himam-system.git
    cd himam-system
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Set up environment variables**
    ```bash
    cp .env.example .env.local
    # Edit .env.local with your actual values
    ```

4.  **Run development server**
    ```bash
    npm run dev
    ```

5.  **Open your browser**
    Navigate to `http://localhost:3000`

## 📦 Deployment

### Production Deployment to Vercel

For complete deployment instructions, see **[DEPLOYMENT.md](DEPLOYMENT.md)**

**Quick deployment steps**:

1.  **Set up Supabase database**
    -   Create Supabase project
    -   Run `supabase/complete_schema.sql` in SQL Editor
    -   Create `documents` storage bucket

2.  **Deploy to Vercel**
    -   Connect GitHub repository
    -   Add environment variables (see `.env.example`)
    -   Deploy

3.  **Verify deployment**
    -   Test all pages load correctly
    -   Check API endpoints work
    -   Verify data displays

For detailed step-by-step instructions, troubleshooting, and post-deployment verification, see **[DEPLOYMENT.md](DEPLOYMENT.md)**.

## 📁 Project Structure

## 📚 Documentation

- [Enterprise System Guide](./docs/ENTERPRISE_SYSTEM_README.md)
- [Flow Diagram](./docs/FLOW_DIAGRAM.md)
- [WhatsApp Integration](./docs/WHATSAPP_INTEGRATION_GUIDE.md)

## ✨ Features

- 🤖 AI-Powered WhatsApp Automation (Gemini 2.0 Flash + OpenAI)
- 📅 Google Calendar Integration
- 💼 CRM Synchronization
- 💳 Billing Management
- ✍️ Digital Signatures
- ⚙️ Dynamic Configuration (Supabase Settings)

## 🏗️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **AI**: Google Gemini 2.0 Flash + OpenAI GPT-4o-mini
- **Messaging**: Meta WhatsApp Cloud API
- **Calendar**: Google Calendar API
- **Storage**: Supabase Storage

## 📖 Key Components

- `/app/api` - API routes for all integrations
- `/src/lib` - Core services (AI, Calendar, Config)
- `/supabase/functions` - Edge Functions
- `/app/settings` - Unified settings management

## 🔧 Configuration

All system configuration is managed through the `/settings` page and stored in Supabase `settings` table.

## 🔒 Security & Production Hardening

### Rate Limiting
- All API endpoints are protected with rate limiting using Upstash Redis
- Rate limits:
  - **API endpoints**: 100 requests/minute
  - **Auth endpoints**: 5 requests/15 minutes
  - **Strict endpoints**: 10 requests/minute
- Webhooks are excluded from rate limiting (verified via signature validation)
- Rate limit headers included in responses: `x-ratelimit-limit`, `x-ratelimit-remaining`, `x-ratelimit-reset`

### Input Sanitization
- All user inputs are sanitized using `isomorphic-dompurify`
- XSS protection built into Zod validation schemas
- Text, HTML, email, phone, and URL sanitization utilities available

### Error Tracking
- Sentry integration with PII (Personally Identifiable Information) redaction
- Sensitive data (cookies, auth headers, passwords) automatically filtered
- Centralized logging with structured error context

### Code Quality Guards
- ESLint rules prevent `console.log` usage (except in logger utility)
- CI gates prevent `select('*')` in API routes
- TypeScript strict mode enforced
- Pre-commit hooks validate code quality

## 🏥 Health & Readiness Checks

### Health Endpoints

**Liveness Probe** (`/api/health`)
- Simple endpoint to check if service is running
- Returns `200 OK` if service is alive
- Fast response (<10ms)

**Readiness Probe** (`/api/ready`)
- Checks database connectivity
- Checks Redis connectivity (if configured)
- Returns `200 OK` if all dependencies are healthy
- Returns `503 Service Unavailable` if any dependency is down or degraded
- Response includes component status and response times

### Usage in Kubernetes/Docker
```yaml
livenessProbe:
  httpGet:
    path: /api/health
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 30

readinessProbe:
  httpGet:
    path: /api/ready
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 10
```

## 🧪 Testing

### Test Structure
- **Unit Tests**: `src/**/*.test.ts` - Test individual services and utilities
- **Integration Tests**: `tests/integration/**/*.spec.ts` - Test API endpoints
- **E2E Tests**: `tests/**/*.spec.ts` - End-to-end scenarios with Playwright

### Running Tests
```bash
# Unit tests
pnpm test:unit

# Unit tests with coverage
pnpm test:unit:coverage

# Integration tests (requires running server)
pnpm test

# All tests
pnpm test:all
```

### Test Coverage
- Target: **≥60%** coverage for critical paths
- Critical services: auth, patients, appointments
- Coverage thresholds enforced in CI

### Test Commands
- `pnpm test:unit` - Run unit tests with Vitest
- `pnpm test:unit:watch` - Watch mode for development
- `pnpm test:unit:coverage` - Generate coverage report
- `pnpm test` - Run Playwright E2E tests
- `pnpm test:all` - Run all tests

## ⚡ Performance Optimizations

### Database Indexes
- Indexes on foreign keys (patient_id, doctor_id, etc.)
- Indexes on status columns for filtering
- Indexes on date columns for range queries
- Composite indexes for common query patterns
- Migration: `supabase/migrations/20250115000000_add_performance_indexes.sql`

### Caching
- Redis cache manager with TTL support
- Cache-aside pattern for read-heavy endpoints
- Automatic cache invalidation on mutations
- Cache utilities: `getCache`, `setCache`, `getOrSetCache`, `invalidateEntityCache`

### Pagination
- All list endpoints support pagination
- Default limit: 50 items
- Maximum limit: 100 items
- Shared pagination utilities: `parsePaginationParams`, `createPaginationMeta`

## 📝 License

Proprietary - Himam Medical Center

---

**Status**: Production Ready ✅


