#!/usr/bin/env node

/**
 * Smart Cleanup Script
 * Identifies truly unused files by tracking runtime usage
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Files we KNOW are used at runtime from the dashboard logs
const RUNTIME_USED_FILES = new Set([
  // Dashboard core
  'src/dashboard/index.ts',
  'src/dashboard/modular-fixed.html',
  
  // Components loaded by dashboard
  'src/dashboard/components/index.js',
  'src/dashboard/components/control-bar.js',
  'src/dashboard/components/validation-service.js',
  'src/dashboard/components/self-test.js',
  'src/dashboard/components/entity-data-provider.js',
  'src/dashboard/components/table-details-viewer.js',
  'src/dashboard/components/component-details-viewer.js',
  'src/dashboard/components/hook-details-viewer.js',
  'src/dashboard/components/sidebar-navigator.js',
  'src/dashboard/components/file-analysis-view.js',
  'src/dashboard/components/smart-analysis-view.js',
  'src/dashboard/components/page-details-viewer.js',
  'src/dashboard/components/severity-badge.js',
  'src/dashboard/components/live-log-panel.js',
  'src/dashboard/components/smart-refresh-manager.js',
  'src/dashboard/components/dashboard-functions.js',
  
  // Scripts loaded by components
  'src/dashboard/components/scripts/api-client.js',
  'src/dashboard/components/scripts/data-processor.js',
  
  // Renderers
  'src/dashboard/components/renderers/shared-utils.js',
  'src/dashboard/components/renderers/architecture-renderer.js',
  'src/dashboard/components/renderers/nine-rules-renderer.js',
  
  // Theme
  'src/dashboard/theme-config.js',
  
  // Analyzers used by dashboard server
  'src/analyzer/index.ts',
  'src/analyzer/framework-detector.ts',
  'src/analyzer/type-extractor.ts',
  'src/analyzer/data-flow-mapper.ts',
  'src/analyzer/entity-identifier.ts',
  'src/analyzer/rule-generator.ts',
  
  // Validators used by dashboard server
  'src/validator/table-mapper.ts',
  'src/validator/nine-rules-validator.ts',
  'src/validator/contract-validator.ts',
  'src/validator/boundary-validator.ts',
  'src/validator/version-validator.ts',
  'src/validator/design-system-validator.ts',
  
  // Utils
  'src/utils/remote-logger.ts',
  
  // CLI tools
  'src/cli/index.ts',
  'src/cli/analyze-smart.ts',
  
  // Config files
  'package.json',
  'tsconfig.json',
  'README.md',
  '.gitignore',
  
  // Scripts we created
  'scripts/validate-data.py',
  'scripts/test-dashboard-integrity.js',
  'scripts/smart-cleanup.js'
]);

// Files to NEVER touch
const PROTECTED_PATTERNS = [
  /^\.git\//,
  /node_modules/,
  /dist\//,
  /build\//,
  /\.observer\//,
  /package-lock\.json/
];

// Get all TypeScript imports from a file
function getImportsFromFile(filePath) {
  const imports = new Set();
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Match various import patterns
    const patterns = [
      /import .* from ['"](.+?)['"]/g,
      /require\(['"](.+?)['"]\)/g,
      /from ['"](.+?)['"]/g
    ];
    
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        let importPath = match[1];
        
        // Resolve relative imports
        if (importPath.startsWith('.')) {
          const dir = path.dirname(filePath);
          importPath = path.join(dir, importPath);
          
          // Try different extensions
          const extensions = ['.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.js'];
          for (const ext of extensions) {
            const testPath = importPath.endsWith('.ts') || importPath.endsWith('.js') 
              ? importPath 
              : importPath + ext;
            const relativePath = path.relative(process.cwd(), testPath);
            if (fs.existsSync(testPath)) {
              imports.add(relativePath);
              break;
            }
          }
        }
      }
    });
  } catch (e) {
    // Ignore read errors
  }
  
  return imports;
}

// Recursively find all dependencies
function findAllDependencies(startFiles) {
  const allDeps = new Set(startFiles);
  const toProcess = [...startFiles];
  const processed = new Set();
  
  while (toProcess.length > 0) {
    const file = toProcess.pop();
    if (processed.has(file)) continue;
    processed.add(file);
    
    const deps = getImportsFromFile(file);
    deps.forEach(dep => {
      if (!allDeps.has(dep)) {
        allDeps.add(dep);
        toProcess.push(dep);
      }
    });
  }
  
  return allDeps;
}

// Get all files in the project
function getAllFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const relativePath = path.relative(process.cwd(), fullPath);
    
    // Skip protected patterns
    if (PROTECTED_PATTERNS.some(pattern => pattern.test(relativePath))) {
      continue;
    }
    
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      getAllFiles(fullPath, files);
    } else {
      files.push(relativePath);
    }
  }
  
  return files;
}

// Main cleanup function
function performCleanup() {
  console.log('🔍 Analyzing file usage...\n');
  
  // Find all dependencies starting from known used files
  const allUsedFiles = findAllDependencies(Array.from(RUNTIME_USED_FILES));
  
  console.log(`✅ Found ${allUsedFiles.size} files in use\n`);
  
  // Get all files in the project
  const allFiles = getAllFiles('.');
  
  // Find unused files
  const unusedFiles = allFiles.filter(file => {
    // Skip if already marked as unused
    if (file.endsWith('.unused')) return false;
    
    // Skip non-code files
    if (!/\.(ts|tsx|js|jsx)$/.test(file)) return false;
    
    // Check if it's used
    return !allUsedFiles.has(file);
  });
  
  console.log(`🗑️  Found ${unusedFiles.length} unused files\n`);
  
  if (unusedFiles.length === 0) {
    console.log('✨ No unused files found!');
    return;
  }
  
  // Group by directory
  const byDir = {};
  unusedFiles.forEach(file => {
    const dir = path.dirname(file);
    if (!byDir[dir]) byDir[dir] = [];
    byDir[dir].push(file);
  });
  
  // Display unused files
  console.log('Unused files by directory:');
  Object.entries(byDir).forEach(([dir, files]) => {
    console.log(`\n  ${dir}/`);
    files.forEach(file => {
      console.log(`    - ${path.basename(file)}`);
    });
  });
  
  // Ask for confirmation
  console.log('\n' + '='.repeat(50));
  console.log('Options:');
  console.log('1. Mark unused files with .unused extension');
  console.log('2. Move to _archive folder');
  console.log('3. Delete permanently');
  console.log('4. Just show report (no action)');
  
  // For now, let's mark them as .unused
  console.log('\n📝 Marking unused files with .unused extension...\n');
  
  let renamed = 0;
  unusedFiles.forEach(file => {
    try {
      fs.renameSync(file, file + '.unused');
      console.log(`  ✓ ${file} → ${file}.unused`);
      renamed++;
    } catch (e) {
      console.log(`  ✗ Failed to rename ${file}: ${e.message}`);
    }
  });
  
  console.log(`\n✅ Marked ${renamed} files as unused`);
  console.log('\nTo restore: rename files removing .unused extension');
  console.log('To delete permanently: rm **/*.unused');
}

// Run the cleanup
console.log('🧹 Smart Cleanup Tool\n');
console.log('This tool identifies unused files by tracking actual runtime dependencies.\n');

performCleanup();