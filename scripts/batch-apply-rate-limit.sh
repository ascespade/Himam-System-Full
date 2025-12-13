#!/bin/bash
# Batch apply rate limiting to routes
# This script helps identify which routes still need rate limiting

echo "🔍 Checking routes that need rate limiting..."

# Count routes without rate limiting
NO_RATE_LIMIT=$(grep -r "export async function" app/api --include="*.ts" | grep -v "withRateLimit\|applyRateLimitCheck" | wc -l)
NO_RATE_LIMIT_CONST=$(grep -r "export const.*=.*function" app/api --include="*.ts" | grep -v "withRateLimit" | wc -l)

echo "Routes using 'export async function': $NO_RATE_LIMIT"
echo "Routes using 'export const ... = function': $NO_RATE_LIMIT_CONST"
echo ""
echo "Total routes needing rate limit: $((NO_RATE_LIMIT + NO_RATE_LIMIT_CONST))"
