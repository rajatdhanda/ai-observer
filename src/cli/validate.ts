#!/usr/bin/env node

/**
 * CLI command for running 9-rules validation
 */

import { NineRulesValidator, runValidation } from '../validator/nine-rules-validator';
import * as path from 'path';
import * as fs from 'fs';

// Parse command line arguments
const args = process.argv.slice(2);
const projectPath = args[0] || process.cwd();

// Resolve path
const resolvedPath = path.isAbsolute(projectPath) 
  ? projectPath 
  : path.resolve(process.cwd(), projectPath);

console.log('🔍 AI Observer - 9 Rules Validator\n');
console.log(`Project: ${resolvedPath}\n`);

// Run validation
runValidation(resolvedPath).catch(error => {
  console.error('❌ Validation failed:', error);
  process.exit(1);
});