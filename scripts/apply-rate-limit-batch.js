#!/usr/bin/env node
/**
 * Batch apply rate limiting to API routes
 * This script modifies route files to add rate limiting
 */

const fs = require('fs')
const path = require('path')

const API_DIR = path.join(__dirname, '../app/api')

function getAllRouteFiles() {
  const routes = []
  
  function walkDir(dir) {
    const files = fs.readdirSync(dir)
    
    for (const file of files) {
      const fullPath = path.join(dir, file)
      const stat = fs.statSync(fullPath)
      
      if (stat.isDirectory()) {
        walkDir(fullPath)
      } else if (file === 'route.ts') {
        routes.push(fullPath)
      }
    }
  }
  
  walkDir(API_DIR)
  return routes
}

function needsRateLimit(filePath) {
  const content = fs.readFileSync(filePath, 'utf8')
  return !content.includes('withRateLimit') && 
         !content.includes('applyRateLimitCheck') &&
         !filePath.includes('/health/route.ts') &&
         !filePath.includes('/ready/route.ts')
}

function main() {
  const routes = getAllRouteFiles()
  const needsFix = routes.filter(needsRateLimit)
  
  console.log(`Total routes: ${routes.length}`)
  console.log(`Routes needing rate limit: ${needsFix.length}`)
  console.log('\nRoutes to fix:')
  needsFix.slice(0, 20).forEach(r => console.log(`  ${r.replace(process.cwd(), '')}`))
  
  if (needsFix.length > 20) {
    console.log(`  ... and ${needsFix.length - 20} more`)
  }
}

if (require.main === module) {
  main()
}

module.exports = { getAllRouteFiles, needsRateLimit }
