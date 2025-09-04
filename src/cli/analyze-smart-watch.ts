#!/usr/bin/env node
import * as path from 'path';
import * as fs from 'fs';
import { SmartIssueAnalyzer } from '../analyzer/smart-issue-analyzer';
import { execSync } from 'child_process';

const projectPath = process.argv[2] || process.cwd();

console.log('🤖 AI Observer - Smart Analysis Watch Mode');
console.log('📁 Watching:', projectPath);
console.log('-----------------------------------');
console.log('✨ Will auto-refresh after detecting fixes');
console.log('Press Ctrl+C to stop\n');

let lastAnalysisTime = Date.now();
let lastIssueCount = 0;

async function runAnalysis() {
  const analyzer = new SmartIssueAnalyzer(projectPath);
  await analyzer.analyze();
  
  // Read the generated file to get issue count
  const fixPath = path.join(projectPath, '.observer', 'FIX_THIS.json');
  if (fs.existsSync(fixPath)) {
    const fixData = JSON.parse(fs.readFileSync(fixPath, 'utf-8'));
    const currentIssueCount = fixData.stats.remaining_issues || fixData.stats.total_issues_found;
    
    if (lastIssueCount > 0 && currentIssueCount < lastIssueCount) {
      console.log(`\n🎯 Progress detected! Issues: ${lastIssueCount} → ${currentIssueCount}`);
      console.log('📝 FIX_THIS.json updated with next batch of issues\n');
    }
    
    lastIssueCount = currentIssueCount;
    
    if (currentIssueCount === 0) {
      console.log('\n🎉 All issues resolved! Project is clean.');
      console.log('Watch mode will continue monitoring for new issues...\n');
    }
  }
}

// Initial analysis
runAnalysis();

// Watch for changes in source files
const watchPatterns = ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'];

console.log('👀 Watching for file changes...\n');

// Simple file watching using fs.watch
const srcPath = path.join(projectPath, 'src');
if (fs.existsSync(srcPath)) {
  fs.watch(srcPath, { recursive: true }, async (eventType, filename) => {
    // Debounce - don't run too frequently
    const now = Date.now();
    if (now - lastAnalysisTime < 5000) return; // Wait at least 5 seconds between runs
    
    if (filename && (filename.endsWith('.ts') || filename.endsWith('.tsx') || 
                     filename.endsWith('.js') || filename.endsWith('.jsx'))) {
      console.log(`\n📝 Change detected in ${filename}`);
      console.log('🔄 Re-analyzing...\n');
      lastAnalysisTime = now;
      await runAnalysis();
    }
  });
}

// Also watch the .env file
const envPath = path.join(projectPath, '.env');
if (fs.existsSync(envPath)) {
  fs.watchFile(envPath, async () => {
    console.log('\n📝 .env file changed');
    console.log('🔄 Re-analyzing...\n');
    await runAnalysis();
  });
}

// Keep process alive
process.stdin.resume();