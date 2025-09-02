#!/usr/bin/env node

/**
 * Contract Validation CLI
 * Simple command to check if your code follows contracts
 */

import { ContractValidator } from '../validator/contract-validator';
import * as path from 'path';

const projectPath = process.argv[2] || process.cwd();
const resolvedPath = path.isAbsolute(projectPath) 
  ? projectPath 
  : path.resolve(process.cwd(), projectPath);

console.log('📋 Contract Validator\n');
console.log(`Project: ${resolvedPath}\n`);

async function run() {
  const validator = new ContractValidator(resolvedPath);
  const result = await validator.validate();
  
  console.log(`Contract Compliance Score: ${result.score}%\n`);
  
  if (result.violations.length === 0) {
    console.log('✅ All contracts validated successfully!');
  } else {
    console.log(`Found ${result.violations.length} contract violations:\n`);
    
    result.violations.forEach(v => {
      const icon = v.type === 'error' ? '❌' : '⚠️';
      console.log(`${icon} ${v.entity}: ${v.message}`);
      console.log(`   📍 ${v.location}`);
      console.log(`   💡 ${v.suggestion}\n`);
    });
  }
  
  process.exit(result.score < 80 ? 1 : 0);
}

run().catch(console.error);