# ADR-0002: Rate Limiting Unification

**Status**: Accepted  
**Date**: 2024-01-15  
**Deciders**: Architecture Team

## Context

Rate limiting was implemented inconsistently:
- Some routes used `applyRateLimitCheck` (legacy)
- Some routes used `withRateLimit` (preferred)
- Headers were added manually in some places

## Decision

We will unify all rate limiting to use `withRateLimit` HOC:
- All API routes wrapped with `withRateLimit`
- Automatic header management
- Consistent error responses
- Request ID correlation

## Consequences

### Positive
- ✅ Consistent rate limiting across all routes
- ✅ Automatic header management
- ✅ Better observability (request correlation)
- ✅ Easier to maintain

### Negative
- ⚠️ Migration effort (completed)

## Implementation

- All 152 API routes migrated to `withRateLimit`
- Legacy `applyRateLimitCheck` removed
- Request ID added to all responses
- Error logging includes request correlation

## References

- Rate Limiting Best Practices
- Next.js Middleware Patterns
