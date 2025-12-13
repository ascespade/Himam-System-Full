#!/usr/bin/env node

/**
 * Script to fix error.message patterns that need type guards
 * Replaces error.message with proper type guards
 */

const fs = require('fs');
const path = require('path');

function fixErrorMessage(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    let modified = false;

    // Pattern: catch (error: unknown) { ... error.message ... }
    // Replace with type guard
    const errorMessagePattern = /catch\s*\(\s*error:\s*unknown\s*\)\s*\{([\s\S]*?)(error\.message)([\s\S]*?)\}/g;
    
    if (content.includes('catch (error: unknown)') && content.includes('error.message')) {
      // Check if type guard already exists
      if (!content.includes('error instanceof Error')) {
        // Extract endpoint from file path
        const endpoint = filePath
          .replace(/.*\/api\//, '/api/')
          .replace(/\/route\.ts$/, '')
          .replace(/\[id\]/g, '[id]')
          .replace(/\[patient_id\]/g, '[patient_id]')
          .replace(/\[queueId\]/g, '[queueId]');

        // Replace error.message with type guard
        content = content.replace(
          /catch\s*\(\s*error:\s*unknown\s*\)\s*\{([\s\S]*?)(error\.message)([\s\S]*?)\}/g,
          (match, before, errorMessage, after) => {
            // Skip if already has type guard
            if (before.includes('error instanceof Error') || before.includes('const errorMessage')) {
              return match;
            }

            // Check if it's a console.error pattern
            const hasConsoleError = before.includes('console.error');
            const errorVarName = hasConsoleError ? 'error' : 'error';
            
            // Create replacement
            let replacement = `catch (error: unknown) {\n`;
            
            // Add error message extraction
            replacement += `    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'\n`;
            
            // Add logger if console.error exists
            if (hasConsoleError) {
              replacement += `    const { logError } = await import('@/shared/utils/logger')\n`;
              replacement += `    logError('Error', ${errorVarName}, { endpoint: '${endpoint}' })\n`;
              // Remove console.error line
              before = before.replace(/console\.error\([^)]*\)/g, '');
            }
            
            // Replace error.message with errorMessage
            const newAfter = after.replace(/error\.message/g, 'errorMessage');
            
            return replacement + before + newAfter + `\n  }`;
          }
        );

        modified = true;
      }
    }

    // Also fix standalone error.message in catch blocks
    content = content.replace(
      /catch\s*\(\s*error:\s*unknown\s*\)\s*\{([\s\S]*?)error\.message([\s\S]*?)\}/g,
      (match, before, after) => {
        if (before.includes('error instanceof Error') || before.includes('const errorMessage')) {
          return match; // Already has type guard
        }
        
        const endpoint = filePath
          .replace(/.*\/api\//, '/api/')
          .replace(/\/route\.ts$/, '');
        
        return `catch (error: unknown) {\n    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'\n    const { logError } = await import('@/shared/utils/logger')\n    logError('Error', error, { endpoint: '${endpoint}' })\n${before}${after.replace(/error\.message/g, 'errorMessage')}\n  }`;
      }
    );

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

console.log('Finding API route files with error.message...');
const files = findTypeScriptFiles(apiDir).filter(f => 
  !f.includes('node_modules') && 
  !f.includes('.git') &&
  f.includes('route.ts') &&
  fs.readFileSync(f, 'utf8').includes('error.message')
);

console.log(`Found ${files.length} files with error.message`);

let fixedCount = 0;
files.forEach(file => {
  if (fixErrorMessage(file)) {
    fixedCount++;
    console.log(`Fixed: ${file}`);
  }
});

console.log(`\nFixed ${fixedCount} files`);
console.log('Note: Manual review is still needed for complex cases');
