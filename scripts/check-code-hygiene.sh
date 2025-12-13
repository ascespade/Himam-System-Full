#!/bin/bash
# Code Hygiene Checks
# CI gate to prevent console.log and select('*') in server code

set -e

echo "🔍 Running code hygiene checks..."

# Check for console.log in server code (app/api, src)
CONSOLE_LOG_COUNT=$(grep -r "console\.log" app/api src --include="*.ts" --include="*.tsx" | grep -v "eslint-disable" | wc -l || true)

if [ "$CONSOLE_LOG_COUNT" -gt 0 ]; then
  echo "❌ Found $CONSOLE_LOG_COUNT console.log statements in server code"
  echo "Please use the centralized logger from @/shared/utils/logger"
  grep -rn "console\.log" app/api src --include="*.ts" --include="*.tsx" | grep -v "eslint-disable" || true
  exit 1
fi

# Check for select('*') in server code
SELECT_STAR_COUNT=$(grep -r "\.select(['\"]\*['\"])" app/api src --include="*.ts" --include="*.tsx" | grep -v "eslint-disable" | wc -l || true)

if [ "$SELECT_STAR_COUNT" -gt 0 ]; then
  echo "❌ Found $SELECT_STAR_COUNT select('*') usages in server code"
  echo "Please use specific column selection for better performance"
  grep -rn "\.select(['\"]\*['\"])" app/api src --include="*.ts" --include="*.tsx" | grep -v "eslint-disable" || true
  exit 1
fi

echo "✅ Code hygiene checks passed!"
exit 0
