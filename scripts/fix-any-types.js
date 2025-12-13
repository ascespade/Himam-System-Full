#!/usr/bin/env node

/**
 * Script to automatically fix common `any` type patterns
 * This script helps replace common patterns but manual review is still needed
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Patterns to fix
const patterns = [
  {
    // Error handling: catch (error: any) -> catch (error: unknown)
    search: /catch\s*\(\s*error:\s*any\s*\)/g,
    replace: 'catch (error: unknown)',
    description: 'Replace error: any with error: unknown in catch blocks'
  },
  {
    // console.error with error.message
    search: /console\.error\([^)]*error[^)]*\)/g,
    replace: (match, filePath) => {
      // This is complex, so we'll handle it manually
      return match;
    },
    description: 'Replace console.error with logger'
  },
  {
    // const updates: any = {}
    search: /const\s+(\w+):\s*any\s*=\s*\{/g,
    replace: 'const $1: Record<string, unknown> = {',
    description: 'Replace update objects: any with Record<string, unknown>'
  },
  {
    // const data: any = ...
    search: /const\s+(\w+):\s*any\s*=/g,
    replace: 'const $1: Record<string, unknown> =',
    description: 'Replace data: any with Record<string, unknown>'
  },
  {
    // .map((item: any) =>
    search: /\.map\(\s*\((\w+):\s*any\)\s*=>/g,
    replace: '.map(($1: Record<string, unknown>) =>',
    description: 'Replace map callbacks: any with Record<string, unknown>'
  },
  {
    // .filter((item: any) =>
    search: /\.filter\(\s*\((\w+):\s*any\)\s*=>/g,
    replace: '.filter(($1: Record<string, unknown>) =>',
    description: 'Replace filter callbacks: any with Record<string, unknown>'
  }
];

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    const originalContent = content;

    // Fix error handling patterns
    if (content.includes('catch (error: any)')) {
      content = content.replace(/catch\s*\(\s*error:\s*any\s*\)/g, 'catch (error: unknown)');
      modified = true;
    }

    // Fix update objects
    if (content.includes(': any = {')) {
      content = content.replace(/const\s+(\w+):\s*any\s*=\s*\{/g, 'const $1: Record<string, unknown> = {');
      modified = true;
    }

    // Fix data variables
    if (content.match(/const\s+\w+:\s*any\s*=/)) {
      content = content.replace(/const\s+(\w+):\s*any\s*=/g, 'const $1: Record<string, unknown> =');
      modified = true;
    }

    // Fix map/filter callbacks
    if (content.includes('.map((') && content.includes(': any)')) {
      content = content.replace(/\.map\(\s*\((\w+):\s*any\)\s*=>/g, '.map(($1: Record<string, unknown>) =>');
      modified = true;
    }

    if (content.includes('.filter((') && content.includes(': any)')) {
      content = content.replace(/\.filter\(\s*\((\w+):\s*any\)\s*=>/g, '.filter(($1: Record<string, unknown>) =>');
      modified = true;
    }

    if (modified && content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed: ${filePath}`);
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
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

// Main execution
const projectRoot = process.cwd();
const apiDir = path.join(projectRoot, 'app', 'api');
const srcDir = path.join(projectRoot, 'src');

console.log('Finding TypeScript files...');
const files = [
  ...findTypeScriptFiles(apiDir),
  ...findTypeScriptFiles(srcDir)
].filter(f => !f.includes('node_modules') && !f.includes('.git'));

console.log(`Found ${files.length} TypeScript files`);

let fixedCount = 0;
files.forEach(file => {
  if (fixFile(file)) {
    fixedCount++;
  }
});

console.log(`\nFixed ${fixedCount} files`);
console.log('Note: Manual review is still needed for complex cases and error handling with logger');
