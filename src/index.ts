import { EnhancedTypeChecker } from './validators/enhanced-type-checker';
import { SchemaLoader } from './validators/schema-loader';
import * as path from 'path';
import * as fs from 'fs';
import chalk from 'chalk';
import * as chokidar from 'chokidar';

interface Config {
  schemaPath: string;
  checkPaths: string[];
  ignorePaths: string[];
  rules: {
    noNewInterfaces: 'error' | 'warning' | 'off';
    typeMatchesSchema: 'error' | 'warning' | 'off';
  };
}

class Observer {
  private checker!: EnhancedTypeChecker;
  private schemaPath: string;
  private config: Config;

  constructor(schemaPath: string, config?: Config) {
    this.schemaPath = schemaPath;
    this.config = config || this.loadConfig();
  }

  private loadConfig(): Config {
    const configPath = path.join(process.cwd(), 'observer.config.json');
    if (fs.existsSync(configPath)) {
      const configFile = fs.readFileSync(configPath, 'utf-8');
      return JSON.parse(configFile);
    }
    
    // Default config
    return {
      schemaPath: './test-project/schemas',
      checkPaths: ['./test-project'],
      ignorePaths: ['node_modules', 'dist', '.git'],
      rules: {
        noNewInterfaces: 'error',
        typeMatchesSchema: 'error'
      }
    };
  }

  async init() {
    const loader = new SchemaLoader();
    const schemaPath = this.config.schemaPath || this.schemaPath;
    const resolvedPath = path.resolve(schemaPath);
    const registry = await loader.loadProjectSchemas(resolvedPath);
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

  checkConfigPaths() {
    this.config.checkPaths.forEach(checkPath => {
      const stat = fs.statSync(checkPath);
      stat.isDirectory() 
        ? this.checkDirectory(checkPath)
        : this.checkFile(checkPath);
    });
  }

  watch(paths: string[]) {
    console.log(chalk.blue('👀 Watching for changes...\n'));
    
    const watcher = chokidar.watch(paths, {
      ignored: this.config.ignorePaths,
      persistent: true,
      ignoreInitial: true
    });

    watcher.on('change', async (filePath) => {
      console.clear();
      console.log(chalk.yellow(`File changed: ${filePath}\n`));
      
      if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
        this.checkFile(filePath);
      }
    });

    watcher.on('add', async (filePath) => {
      console.log(chalk.green(`New file: ${filePath}\n`));
      
      if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
        this.checkFile(filePath);
      }
    });

    // Keep process running
    process.stdin.resume();
  }

  private getTypeScriptFiles(dir: string): string[] {
    const files: string[] = [];
    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
      // Skip ignored paths
      if (this.config.ignorePaths.some(ignorePath => item.includes(ignorePath))) {
        return;
      }
      
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        files.push(...this.getTypeScriptFiles(fullPath));
      } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
        files.push(fullPath);
      }
    });
    
    return files;
  }
}

// Main execution
// Main execution
async function main() {
    const args = process.argv.slice(2);
    const isWatchMode = args.includes('--watch') || args.includes('-w');
    
    const observer = new Observer('');
    await observer.init();
  
    if (isWatchMode) {
      // Watch mode
      const paths = args.filter(arg => !arg.startsWith('-'));
      const watchPaths = paths.length > 0 ? paths : observer['config'].checkPaths;
      observer.watch(watchPaths);
    } else if (args.length === 0) {
      // Check config paths
      observer.checkConfigPaths();
    } else {
      // Check specific path
      const target = args[0];
      const stat = fs.statSync(target);
      stat.isDirectory() 
        ? observer.checkDirectory(target)
        : observer.checkFile(target);
    }
  }
  
  main().catch(console.error);