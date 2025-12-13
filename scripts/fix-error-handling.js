#!/usr/bin/env node

/**
 * Script to fix error handling patterns:
 * - Replace console.error with logger
 * - Fix error.message access with type guards
 */

const fs = require('fs');
const path = require('path');

function fixErrorHandling(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    let modified = false;

    // Pattern 1: catch (error: any) { console.error(...); return NextResponse.json({ error: error.message }) }
    const errorHandlerPattern = /catch\s*\(\s*error:\s*unknown\s*\)\s*\{[\s\S]*?console\.error\([^)]*error[^)]*\)[\s\S]*?return\s+NextResponse\.json\(\s*\{\s*success:\s*false[^}]*error:\s*error\.message[^}]*\}/g;
    
    if (content.includes('console.error') && content.includes('error.message')) {
      // Replace console.error with logger import and usage
      if (!content.includes("from '@/shared/utils/logger'")) {
        // Add import at the top if not present
        const importMatch = content.match(/^import\s+.*from\s+['"]@\/lib\/supabase['"]/m);
        if (importMatch) {
          const importIndex = content.indexOf(importMatch[0]) + importMatch[0].length;
          content = content.slice(0, importIndex) + 
            "\nimport { logError } from '@/shared/utils/logger'" + 
            content.slice(importIndex);
          modified = true;
        }
      }

      // Replace error.message with type guard
      content = content.replace(
        /catch\s*\(\s*error:\s*unknown\s*\)\s*\{[\s]*console\.error\([^)]*error[^)]*\)[\s]*return\s+NextResponse\.json\(\s*\{\s*success:\s*false[^}]*error:\s*error\.message[^}]*\}/g,
        (match) => {
          // Extract endpoint name from file path
          const endpoint = filePath.replace(/.*\/api\//, '/api/').replace(/\/route\.ts$/, '');
          const errorMessage = "const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'";
          const logCall = `logError('Error', error, { endpoint: '${endpoint}' })`;
          return match
            .replace(/console\.error\([^)]*\)/, logCall)
            .replace(/error\.message/g, 'errorMessage')
            .replace(/catch\s*\(\s*error:\s*unknown\s*\)\s*\{/, `catch (error: unknown) {\n    ${errorMessage}\n    const { logError } = await import('@/shared/utils/logger')\n    ${logCall}`);
        }
      );

      // Simple replacement for standalone console.error
      content = content.replace(
        /console\.error\(([^)]*error[^)]*)\)/g,
        (match, args) => {
          if (!content.includes('logError')) {
            return `const { logError } = await import('@/shared/utils/logger')\n    logError(${args})`;
          }
          return `logError(${args})`;
        }
      );

      modified = true;
    }

    // Pattern 2: Fix error.message without type guard
    if (content.includes('error.message') && !content.includes('error instanceof Error')) {
      // Find catch blocks with error.message
      content = content.replace(
        /(catch\s*\(\s*error:\s*unknown\s*\)\s*\{[\s\S]*?)(error\.message)/g,
        (match, before, errorMessage) => {
          if (!before.includes('error instanceof Error')) {
            return before + 'const errorMessage = error instanceof Error ? error.message : \'حدث خطأ\'\n    ' + match.replace(errorMessage, 'errorMessage');
          }
          return match;
        }
      );
      modified = true;
    }

    if (modified && content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    }
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error.message);
  }
  return false;
}

function findTypeScriptFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory() && !filePath.includes('node_modules') && !filePath.includes('.git')) {
      findTypeScriptFiles(filePath, fileList);
    } else if (file.endsWith('.ts') && !file.endsWith('.test.ts') && !file.endsWith('.spec.ts')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

// Main execution
const projectRoot = process.cwd();
const apiDir = path.join(projectRoot, 'app', 'api');

console.log('Finding API route files...');
const files = findTypeScriptFiles(apiDir).filter(f => 
  !f.includes('node_modules') && 
  !f.includes('.git') &&
  f.includes('route.ts')
);

console.log(`Found ${files.length} API route files`);

let fixedCount = 0;
files.forEach(file => {
  if (fixErrorHandling(file)) {
    fixedCount++;
    console.log(`Fixed: ${file}`);
  }
});

console.log(`\nFixed ${fixedCount} files`);
console.log('Note: Manual review is still needed for complex error handling cases');
