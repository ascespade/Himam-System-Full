#!/bin/bash
# Helper script to check only staged files
# Used by pre-commit hook for faster validation

set -e

echo "🔍 Checking staged files only..."

# Get staged TypeScript files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx)$' || echo "")

if [ -z "$STAGED_FILES" ]; then
  echo "✅ No TypeScript files staged"
  exit 0
fi

FILE_COUNT=$(echo "$STAGED_FILES" | wc -l | tr -d ' ')
echo "📋 Found $FILE_COUNT staged file(s) to check"

# Type check only staged files
echo "📝 Type checking staged files..."
echo "$STAGED_FILES" | xargs -I {} npx tsc-files --noEmit {} || {
  echo "❌ TypeScript errors in staged files"
  exit 1
}

# ESLint only staged files
echo "🔧 Linting staged files..."
echo "$STAGED_FILES" | xargs npx eslint --fix --max-warnings 0 || {
  echo "❌ ESLint errors in staged files"
  exit 1
}

echo "✅ All staged files passed checks!"

