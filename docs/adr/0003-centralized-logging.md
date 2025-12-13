# ADR-0003: Centralized Logging with Request Correlation

**Status**: Accepted  
**Date**: 2024-01-15  
**Deciders**: Architecture Team

## Context

Logging was inconsistent:
- Some code used `console.log/error`
- No request correlation
- Difficult to trace errors across services

## Decision

We will use centralized logging:
- All logging through `@/shared/utils/logger`
- Request ID correlation for all logs
- Sentry integration for error tracking
- Structured logging with context

## Consequences

### Positive
- ✅ Consistent logging format
- ✅ Request correlation (traceId)
- ✅ Better observability
- ✅ Sentry integration
- ✅ Production-ready

### Negative
- ⚠️ Migration effort (completed for critical paths)

## Implementation

- `Logger` class with request ID generation
- `logError`, `logInfo`, `logWarn` convenience functions
- Request ID added to all error logs
- Sentry integration with PII redaction

## References

- Structured Logging Best Practices
- Observability Patterns
