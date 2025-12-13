#!/usr/bin/env node

/**
 * Script to fix incomplete error.message replacements
 * Fixes patterns like: { success: false, error:  } (missing errorMessage)
 */

const fs = require('fs');
const path = require('path');

function fixIncompleteReplacements(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    let modified = false;

    // Pattern: { success: false, error:  } (missing errorMessage)
    const incompletePattern = /\{\s*success:\s*false[^}]*error:\s*\s*\}/g;
    
    if (content.match(incompletePattern)) {
      // Find the catch block
      const catchBlockPattern = /catch\s*\(\s*error:\s*unknown\s*\)\s*\{([\s\S]*?)\}/g;
      
      content = content.replace(catchBlockPattern, (match, body) => {
        // Check if errorMessage is already defined
        if (body.includes('const errorMessage')) {
          // Fix incomplete error:  } pattern
          return match.replace(/\{\s*success:\s*false[^}]*error:\s*\s*\}/g, '{ success: false, error: errorMessage }');
        } else {
          // Add errorMessage definition and fix incomplete pattern
          const endpoint = filePath
            .replace(/.*\/api\//, '/api/')
            .replace(/\/route\.ts$/, '');
          
          const fixedBody = body
            .replace(/\{\s*success:\s*false[^}]*error:\s*\s*\}/g, '{ success: false, error: errorMessage }')
            .replace(/const\s+{\s*logError\s*}\s*=\s*await\s+import/, 'const errorMessage = error instanceof Error ? error.message : \'حدث خطأ\'\n    const { logError } = await import');
          
          return `catch (error: unknown) {${fixedBody}\n  }`;
        }
      });
      
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

console.log('Finding files with incomplete replacements...');
const files = findTypeScriptFiles(apiDir).filter(f => 
  !f.includes('node_modules') && 
  !f.includes('.git') &&
  f.includes('route.ts') &&
  fs.readFileSync(f, 'utf8').match(/\{\s*success:\s*false[^}]*error:\s*\s*\}/)
);

console.log(`Found ${files.length} files with incomplete replacements`);

let fixedCount = 0;
files.forEach(file => {
  if (fixIncompleteReplacements(file)) {
    fixedCount++;
    console.log(`Fixed: ${file}`);
  }
});

console.log(`\nFixed ${fixedCount} files`);
