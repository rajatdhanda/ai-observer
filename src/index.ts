import { EnhancedTypeChecker } from './validators/enhanced-type-checker';
import { SchemaLoader } from './validators/schema-loader';
import * as path from 'path';
import * as fs from 'fs';
import chalk from 'chalk';

class Observer {
  private checker!: EnhancedTypeChecker;  // Added ! to tell TS it will be initialized
  private schemaPath: string;

  constructor(schemaPath: string) {
    this.schemaPath = schemaPath;
  }

  async init() {
    const loader = new SchemaLoader();
    const registry = await loader.loadProjectSchemas(this.schemaPath);
    this.checker = new EnhancedTypeChecker(registry);
  }

  checkFile(filePath: string) {
    const issues = this.checker.checkFile(filePath);
    this.checker.printIssues(issues);
    return issues.length === 0;
  }

  checkDirectory(dirPath: string) {
    const files = this.getTypeScriptFiles(dirPath);
    let totalIssues = 0;

    files.forEach(file => {
      const issues = this.checker.checkFile(file);
      if (issues.length > 0) {
        console.log(chalk.yellow(`\n${file}:`));
        this.checker.printIssues(issues);
        totalIssues += issues.length;
      }
    });

    return totalIssues === 0;
  }

  private getTypeScriptFiles(dir: string): string[] {
    const files: string[] = [];
    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.includes('node_modules')) {
        files.push(...this.getTypeScriptFiles(fullPath));
      } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
        files.push(fullPath);
      }
    });
    
    return files;
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const target = args[0] || 'test-project';
  const schemaPath = args[1] || path.join(__dirname, '../test-project/schemas');

  const observer = new Observer(schemaPath);
  await observer.init();

  const stat = fs.statSync(target);
  const success = stat.isDirectory() 
    ? observer.checkDirectory(target)
    : observer.checkFile(target);

  process.exit(success ? 0 : 1);
}

main().catch(console.error);