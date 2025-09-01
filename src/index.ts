import { TypeChecker } from './validators/type-checker';
import * as path from 'path';

const checker = new TypeChecker();

// Get file path from command line or use default
const filePath = process.argv[2] || path.join(__dirname, '../test-project/example.tsx');

console.log(`Checking file: ${filePath}\n`);

const issues = checker.checkFile(filePath);
checker.printIssues(issues);

process.exit(issues.length > 0 ? 1 : 0);