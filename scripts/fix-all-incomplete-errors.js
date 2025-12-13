#!/usr/bin/env node

/**
 * Script to fix all incomplete error:  patterns
 * Replaces { success: false, error:  } with { success: false, error: errorMessage }
 */

const fs = require('fs');
const path = require('path');

function fixAllIncompleteErrors(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    let modified = false;

    // Pattern 1: { success: false, error:  } (with newline)
    if (content.includes('error:  \n') || content.includes('error:  }')) {
      // Replace all instances
      content = content.replace(/\{\s*success:\s*false[^}]*error:\s*\s*\n\s*\}/g, '{ success: false, error: errorMessage }');
      content = content.replace(/\{\s*success:\s*false[^}]*error:\s*\s*\}/g, '{ success: false, error: errorMessage }');
      modified = true;
    }

    // Pattern 2: error:  } (standalone)
    if (content.match(/error:\s*\s*\}/)) {
      content = content.replace(/error:\s*\s*\}/g, 'error: errorMessage }');
      modified = true;
    }

    // Pattern 3: error:  $ (end of line)
    if (content.match(/error:\s*\s*$/m)) {
      content = content.replace(/error:\s*\s*$/gm, 'error: errorMessage');
      modified = true;
    }

    // Ensure errorMessage is defined in catch blocks
    if (content.includes('error: errorMessage') && !content.includes('const errorMessage')) {
      // Find catch blocks and add errorMessage if missing
      content = content.replace(
        /catch\s*\(\s*error:\s*unknown\s*\)\s*\{/g,
        (match) => {
          // Check if next lines already have errorMessage
          const afterMatch = content.substring(content.indexOf(match) + match.length, content.indexOf(match) + match.length + 200);
          if (!afterMatch.includes('const errorMessage')) {
            const endpoint = filePath
              .replace(/.*\/api\//, '/api/')
              .replace(/\/route\.ts$/, '')
              .replace(/\[id\]/g, '[id]')
              .replace(/\[patient_id\]/g, '[patient_id]');
            
            return `${match}\n    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'\n    const { logError } = await import('@/shared/utils/logger')\n    logError('Error', error, { endpoint: '${endpoint}' })`;
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

console.log('Finding files with incomplete error patterns...');
const files = findTypeScriptFiles(apiDir).filter(f => 
  !f.includes('node_modules') && 
  !f.includes('.git') &&
  f.includes('route.ts')
);

console.log(`Checking ${files.length} files...`);

let fixedCount = 0;
files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('error:  ') || content.match(/error:\s*\s*\}/)) {
    if (fixAllIncompleteErrors(file)) {
      fixedCount++;
      console.log(`Fixed: ${file}`);
    }
  }
});

console.log(`\nFixed ${fixedCount} files`);
