#!/usr/bin/env node

/**
 * Script to fix remaining incomplete error patterns
 * Fixes patterns like: error:  || 'message'
 */

const fs = require('fs');
const path = require('path');

function fixRemainingIncomplete(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    let modified = false;

    // Pattern: error:  || 'message'
    if (content.match(/error:\s*\s*\|\|/)) {
      content = content.replace(/error:\s*\s*\|\|/g, 'error: errorMessage ||');
      modified = true;
    }

    // Pattern: 'Failed: ' +  (incomplete string concatenation)
    if (content.match(/'Failed: '\s*\+\s*$/m)) {
      content = content.replace(/'Failed: '\s*\+\s*$/gm, "'Failed: ' + errorMessage");
      modified = true;
    }

    // Pattern: debugInfo.xxx = 'Failed: ' +  (incomplete)
    if (content.match(/debugInfo\.\w+\s*=\s*'Failed: '\s*\+\s*$/m)) {
      content = content.replace(/(debugInfo\.\w+\s*=\s*'Failed: '\s*\+)\s*$/gm, "$1 errorMessage");
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

console.log('Finding files with remaining incomplete patterns...');
const files = findTypeScriptFiles(apiDir).filter(f => 
  !f.includes('node_modules') && 
  !f.includes('.git') &&
  f.includes('route.ts')
);

let fixedCount = 0;
files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  if (content.match(/error:\s*\s*\|\|/) || content.match(/'Failed: '\s*\+\s*$/m)) {
    if (fixRemainingIncomplete(file)) {
      fixedCount++;
      console.log(`Fixed: ${file}`);
    }
  }
});

console.log(`\nFixed ${fixedCount} files`);
