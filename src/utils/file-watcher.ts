import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export class FileWatcher {
  private projectPath: string;
  private fileHashes: Map<string, string> = new Map();
  private changeCount: number = 0;
  private lastScanTime: number = Date.now();
  private watchPatterns: string[] = [
    '**/*.ts',
    '**/*.tsx',
    '**/*.js',
    '**/*.jsx',
    '**/*.yaml',
    '**/*.yml',
    '**/*.json'
  ];
  private ignorePatterns: string[] = [
    'node_modules',
    '.git',
    'dist',
    'build',
    '.next',
    'coverage'
  ];

  constructor(projectPath: string) {
    this.projectPath = projectPath;
    this.scanFiles(); // Initial scan
  }

  private shouldIgnore(filePath: string): boolean {
    return this.ignorePatterns.some(pattern => 
      filePath.includes(pattern)
    );
  }

  private getFileHash(filePath: string): string {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      return crypto.createHash('md5').update(content).digest('hex');
    } catch {
      return '';
    }
  }

  private scanDirectory(dir: string): string[] {
    const files: string[] = [];
    
    try {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        
        if (this.shouldIgnore(fullPath)) continue;
        
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          files.push(...this.scanDirectory(fullPath));
        } else if (stat.isFile()) {
          const ext = path.extname(item);
          if (['.ts', '.tsx', '.js', '.jsx', '.yaml', '.yml', '.json'].includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${dir}:`, error);
    }
    
    return files;
  }

  public scanFiles(): number {
    const files = this.scanDirectory(this.projectPath);
    let changes = 0;
    const newHashes = new Map<string, string>();
    
    // Check for modified or new files
    for (const file of files) {
      const newHash = this.getFileHash(file);
      const oldHash = this.fileHashes.get(file);
      
      if (newHash && newHash !== oldHash) {
        changes++;
      }
      
      if (newHash) {
        newHashes.set(file, newHash);
      }
    }
    
    // Check for deleted files
    for (const [file] of this.fileHashes) {
      if (!newHashes.has(file)) {
        changes++;
      }
    }
    
    this.fileHashes = newHashes;
    this.changeCount = changes;
    this.lastScanTime = Date.now();
    
    return changes;
  }

  public getChanges(): {
    changes: number;
    lastScan: number;
    files: number;
  } {
    // Rescan to get latest changes
    this.scanFiles();
    
    return {
      changes: this.changeCount,
      lastScan: this.lastScanTime,
      files: this.fileHashes.size
    };
  }

  public resetChanges(): void {
    this.changeCount = 0;
    this.scanFiles(); // Rescan to establish new baseline
  }
}