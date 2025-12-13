#!/usr/bin/env node
/**
 * Phase 1 Batch Fix Script
 * Applies rate limiting, fixes select('*'), and ensures Zod validation
 * 
 * Usage: node scripts/apply-phase1-fixes.js
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const API_DIR = path.join(__dirname, '../app/api')

// Routes that should use 'auth' rate limiter
const AUTH_ROUTES = [
  '/api/auth',
  '/api/login',
  '/api/signup',
]

// Routes that should use 'strict' rate limiter
const STRICT_ROUTES = [
  '/api/insurance/claims',
  '/api/billing',
  '/api/signature',
]

// Routes that should skip rate limiting (webhooks)
const WEBHOOK_ROUTES = [
  '/api/whatsapp',
  '/api/slack/webhooks',
  '/api/cron',
]

function getAllRouteFiles() {
  const routes = []
  
  function walkDir(dir, basePath = '') {
    const files = fs.readdirSync(dir)
    
    for (const file of files) {
      const fullPath = path.join(dir, file)
      const stat = fs.statSync(fullPath)
      
      if (stat.isDirectory()) {
        walkDir(fullPath, path.join(basePath, file))
      } else if (file === 'route.ts') {
        routes.push({
          fullPath,
          relativePath: path.join(basePath, file),
          apiPath: `/api${basePath}`,
        })
      }
    }
  }
  
  walkDir(API_DIR)
  return routes
}

function determineRateLimitType(apiPath) {
  if (WEBHOOK_ROUTES.some(r => apiPath.startsWith(r))) {
    return 'none'
  }
  if (AUTH_ROUTES.some(r => apiPath.startsWith(r))) {
    return 'auth'
  }
  if (STRICT_ROUTES.some(r => apiPath.startsWith(r))) {
    return 'strict'
  }
  return 'api'
}

function needsRateLimit(filePath) {
  const content = fs.readFileSync(filePath, 'utf8')
  return !content.includes('withRateLimit')
}

function hasSelectStar(filePath) {
  const content = fs.readFileSync(filePath, 'utf8')
  return /\.select\(['"]\*['"]\)/.test(content) && !content.includes('eslint-disable')
}

function main() {
  console.log('🔍 Scanning API routes...\n')
  
  const routes = getAllRouteFiles()
  console.log(`Found ${routes.length} route files\n`)
  
  const needsRateLimitCount = routes.filter(r => needsRateLimit(r.fullPath)).length
  const hasSelectStarCount = routes.filter(r => hasSelectStar(r.fullPath)).length
  
  console.log('📊 Statistics:')
  console.log(`  Routes needing rate limiting: ${needsRateLimitCount}`)
  console.log(`  Routes with select('*'): ${hasSelectStarCount}`)
  console.log('')
  
  console.log('⚠️  This script provides analysis only.')
  console.log('   Manual fixes are required for:')
  console.log('   1. Applying withRateLimit wrapper')
  console.log('   2. Replacing select("*") with specific columns')
  console.log('   3. Adding Zod validation schemas')
  console.log('')
  
  // Generate report
  const report = {
    totalRoutes: routes.length,
    needsRateLimit: needsRateLimitCount,
    hasSelectStar: hasSelectStarCount,
    routes: routes.map(r => ({
      path: r.apiPath,
      file: r.relativePath,
      rateLimitType: determineRateLimitType(r.apiPath),
      needsRateLimit: needsRateLimit(r.fullPath),
      hasSelectStar: hasSelectStar(r.fullPath),
    })),
  }
  
  fs.writeFileSync(
    path.join(__dirname, '../PHASE_1_ROUTES_REPORT.json'),
    JSON.stringify(report, null, 2)
  )
  
  console.log('✅ Report generated: PHASE_1_ROUTES_REPORT.json')
}

if (require.main === module) {
  main()
}

module.exports = { getAllRouteFiles, determineRateLimitType }
