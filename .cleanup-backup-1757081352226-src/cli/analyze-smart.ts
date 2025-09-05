#!/usr/bin/env node

import { SmartIssueAnalyzer } from '../analyzer/smart-issue-analyzer';
import * as path from 'path';

async function main() {
  const projectPath = process.env.OBSERVER_PROJECT_PATH || process.argv[2] || process.cwd();
  
  console.log('🤖 AI Observer - Smart Issue Analyzer');
  console.log(`📁 Analyzing: ${projectPath}`);
  console.log('-----------------------------------');
  
  const analyzer = new SmartIssueAnalyzer(projectPath);
  
  try {
    await analyzer.analyze();
    
    console.log('\n✅ Success! Check .observer/FIX_THIS.json');
    console.log('\n📚 For AI: Just read FIX_THIS.json and fix issues in order.');
    
  } catch (error) {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  }
}

main();