#!/usr/bin/env node

/**
 * Script to fix all remaining any types systematically
 */

const fs = require('fs');
const path = require('path');

function fixAnyTypes(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    let modified = false;

    // Pattern 1: let variable: any = null
    if (content.match(/let\s+\w+:\s*any\s*=\s*null/)) {
      content = content.replace(/let\s+(\w+):\s*any\s*=\s*null/g, 'let $1: Record<string, unknown> | null = null');
      modified = true;
    }

    // Pattern 2: let variable: any = {}
    if (content.match(/let\s+\w+:\s*any\s*=\s*\{\}/)) {
      content = content.replace(/let\s+(\w+):\s*any\s*=\s*\{\}/g, 'let $1: Record<string, unknown> = {}');
      modified = true;
    }

    // Pattern 3: let variable: any[] = []
    if (content.match(/let\s+\w+:\s*any\[\]\s*=\s*\[\]/)) {
      content = content.replace(/let\s+(\w+):\s*any\[\]\s*=\s*\[\]/g, 'let $1: Array<Record<string, unknown>> = []');
      modified = true;
    }

    // Pattern 4: errors: [] as any[]
    if (content.match(/errors:\s*\[\]\s*as\s*any\[\]/)) {
      content = content.replace(/errors:\s*\[\]\s*as\s*any\[\]/g, 'errors: [] as Array<Record<string, unknown>>');
      modified = true;
    }

    // Pattern 5: catch (error: any)
    if (content.match(/catch\s*\(\s*\w+:\s*any\s*\)/)) {
      content = content.replace(/catch\s*\(\s*(\w+):\s*any\s*\)/g, 'catch ($1: unknown)');
      modified = true;
    }

    // Pattern 6: (message as any).property
    if (content.match(/\(\w+\s+as\s+any\)\./)) {
      content = content.replace(/\((\w+)\s+as\s+any\)\./g, '($1 as Record<string, unknown>).');
      modified = true;
    }

    // Pattern 7: history: any[]
    if (content.match(/history:\s*any\[\]/)) {
      content = content.replace(/history:\s*any\[\]/g, 'history: Array<Record<string, unknown>>');
      modified = true;
    }

    // Pattern 8: flow: any
    if (content.match(/flow:\s*any[,\s\)]/)) {
      content = content.replace(/flow:\s*any([,\s\)])/g, 'flow: Record<string, unknown>$1');
      modified = true;
    }

    // Pattern 9: node: any
    if (content.match(/node:\s*any[,\s\)]/)) {
      content = content.replace(/node:\s*any([,\s\)])/g, 'node: Record<string, unknown>$1');
      modified = true;
    }

    // Pattern 10: function param: any
    if (content.match(/\(\w+:\s*any\)/)) {
      content = content.replace(/\((\w+):\s*any\)/g, '($1: Record<string, unknown>)');
      modified = true;
    }

    // Pattern 11: Promise<any>
    if (content.match(/Promise<\s*any\s*>/)) {
      content = content.replace(/Promise<\s*any\s*>/g, 'Promise<Record<string, unknown>>');
      modified = true;
    }

    // Pattern 12: resolveValue(value: any, ...): any
    if (content.match(/resolveValue\(value:\s*any/)) {
      content = content.replace(/resolveValue\(value:\s*any/g, 'resolveValue(value: unknown');
      modified = true;
    }
    if (content.match(/\):\s*any\s*\{/)) {
      content = content.replace(/\):\s*any\s*\{/g, '): unknown {');
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
const srcDir = path.join(projectRoot, 'src');
const dashboardDir = path.join(projectRoot, 'app', 'dashboard');
const supabaseDir = path.join(projectRoot, 'supabase', 'functions');

console.log('Finding TypeScript files with any types...');
const files = [
  ...findTypeScriptFiles(apiDir),
  ...findTypeScriptFiles(srcDir),
  ...findTypeScriptFiles(dashboardDir),
  ...findTypeScriptFiles(supabaseDir)
].filter(f => 
  !f.includes('node_modules') && 
  !f.includes('.git') &&
  fs.readFileSync(f, 'utf8').match(/: any|as any/)
);

console.log(`Found ${files.length} files with any types`);

let fixedCount = 0;
files.forEach(file => {
  if (fixAnyTypes(file)) {
    fixedCount++;
    console.log(`Fixed: ${file}`);
  }
});

console.log(`\nFixed ${fixedCount} files`);
console.log('Note: Manual review may be needed for complex cases');
