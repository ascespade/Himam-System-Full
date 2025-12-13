#!/bin/bash
# Batch fix script for Phase 1 rollout
# This script helps identify routes that need fixes

echo "🔍 Scanning for routes needing fixes..."

echo ""
echo "📊 Routes with console.log/error/warn:"
grep -r "console\.\(log\|error\|warn\|debug\)" app/api --include="*.ts" | grep -v "eslint-disable" | wc -l

echo ""
echo "📊 Routes with select('*'):"
grep -r "\.select(['\"]\*['\"])" app/api --include="*.ts" | grep -v "eslint-disable" | wc -l

echo ""
echo "📊 Total API routes:"
find app/api -name "route.ts" | wc -l

echo ""
echo "✅ Scan complete. Use this information to prioritize fixes."
