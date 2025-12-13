#!/usr/bin/env node

/**
 * Script to replace all console.log/error/warn in Dashboard components with logger
 */

const fs = require('fs');
const path = require('path');

function fixConsoleLogs(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    let modified = false;

    // Pattern 1: console.error('message:', error)
    if (content.match(/console\.error\(['"]([^'"]+)['"]\s*,\s*error\)/)) {
      content = content.replace(
        /console\.error\(['"]([^'"]+)['"]\s*,\s*error\)/g,
        (match, message) => {
          const errorVar = match.includes('error:') ? 'error' : 'error'
          return `const { logError } = await import('@/shared/utils/logger')\n        logError('${message}', ${errorVar}, { endpoint: '${path.basename(filePath, '.tsx')}' })`
        }
      )
      modified = true
    }

    // Pattern 2: console.log('message')
    if (content.match(/console\.log\(['"]([^'"]+)['"]\)/)) {
      content = content.replace(
        /console\.log\(['"]([^'"]+)['"]\)/g,
        (match, message) => {
          return `const { logInfo } = await import('@/shared/utils/logger')\n        logInfo('${message}', { endpoint: '${path.basename(filePath, '.tsx')}' })`
        }
      )
      modified = true
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

function findDashboardFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory() && !filePath.includes('node_modules') && !filePath.includes('.git')) {
      findDashboardFiles(filePath, fileList);
    } else if (file.endsWith('.tsx') && filePath.includes('dashboard')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

// Main execution
const projectRoot = process.cwd();
const dashboardDir = path.join(projectRoot, 'app', 'dashboard');

console.log('Finding Dashboard files with console.log/error/warn...');
const files = findDashboardFiles(dashboardDir).filter(f => 
  fs.readFileSync(f, 'utf8').match(/console\.(log|error|warn)/)
);

console.log(`Found ${files.length} files with console statements`);

let fixedCount = 0;
files.forEach(file => {
  if (fixConsoleLogs(file)) {
    fixedCount++;
    console.log(`Fixed: ${file}`);
  }
});

console.log(`\nFixed ${fixedCount} files`);
console.log('Note: Manual review may be needed for complex cases');
