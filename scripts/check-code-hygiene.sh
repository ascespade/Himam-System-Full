#!/bin/bash
# Code Hygiene Checks
# CI gate to prevent console.log and select('*') in server code

set -e

echo "🔍 Running code hygiene checks..."

# Check for console.log in server code (app/api, src)
# Exclude allowed files: logger.ts (centralized logger), toast.ts (client-side utility)
CONSOLE_LOG_COUNT=$(grep -r "console\.log" app/api src --include="*.ts" --include="*.tsx" \
  | grep -v "eslint-disable" \
  | grep -v "src/shared/utils/logger.ts" \
  | grep -v "src/shared/utils/toast.ts" \
  | wc -l || true)

if [ "$CONSOLE_LOG_COUNT" -gt 0 ]; then
  echo "❌ Found $CONSOLE_LOG_COUNT console.log statements in server code"
  echo "Please use the centralized logger from @/shared/utils/logger"
  grep -rn "console\.log" app/api src --include="*.ts" --include="*.tsx" \
    | grep -v "eslint-disable" \
    | grep -v "src/shared/utils/logger.ts" \
    | grep -v "src/shared/utils/toast.ts" || true
  exit 1
fi

# Check for select('*') in API routes (strict - must fail)
SELECT_STAR_API_COUNT=$(grep -r "\.select(['\"]\*['\"])" app/api --include="*.ts" --include="*.tsx" | grep -v "eslint-disable" | wc -l || true)

if [ "$SELECT_STAR_API_COUNT" -gt 0 ]; then
  echo "❌ Found $SELECT_STAR_API_COUNT select('*') usages in API routes"
  echo "Please use specific column selection for better performance"
  grep -rn "\.select(['\"]\*['\"])" app/api --include="*.ts" --include="*.tsx" | grep -v "eslint-disable" || true
  exit 1
fi

# Check for select('*') in repositories (warning - should be fixed but not blocking)
SELECT_STAR_REPO_COUNT=$(grep -r "\.select(['\"]\*['\"])" src/infrastructure src/lib --include="*.ts" --include="*.tsx" | grep -v "eslint-disable" | wc -l || true)

if [ "$SELECT_STAR_REPO_COUNT" -gt 0 ]; then
  echo "⚠️  Found $SELECT_STAR_REPO_COUNT select('*') usages in repositories/lib code"
  echo "Please use specific column selection for better performance (non-blocking for now)"
  # Don't exit 1 - this is a warning for incremental improvement
fi

echo "✅ Code hygiene checks passed!"
exit 0
