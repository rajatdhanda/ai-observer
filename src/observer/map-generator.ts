#!/usr/bin/env ts-node
/**
 * Map Generator - Creates codebase-map.json
 * Just facts, no opinions - simple grep/AST parsing
 * Auto-detects exports, imports, patterns
 */

import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';

interface FileMetrics {
  loc: number;  // Lines of code
  functions: number;  // Number of functions
  exports: number;  // Number of exports
  imports: number;  // Number of imports
  complexity: number;  // Cyclomatic complexity estimate
}

interface CodebaseMap {
  meta: {
    generated: string;
    projectPath: string;
    fileCount: number;
  };
  exports: Record<string, Array<{ name: string; line: number }>>;
  imports: Record<string, string[]>;
  entryPoints: Record<string, { type: string; protected: boolean }>;
  files: Record<string, {
    hasParse?: number;
    hasAuth?: number;
    hasTryCatch?: number;
    hasLoadingState?: number;
    hasErrorState?: number;
    hasFormValidation?: number;
    mutations?: string[];
    invalidates?: string[];
    metrics?: FileMetrics;
  }>;
}

export class MapGenerator {
  private map: CodebaseMap = {
    meta: {
      generated: new Date().toISOString(),
      projectPath: '',
      fileCount: 0
    },
    exports: {},
    imports: {},
    entryPoints: {},
    files: {}
  };

  constructor(private projectPath: string) {
    this.map.meta.projectPath = projectPath;
  }

  async generate(): Promise<CodebaseMap> {
    console.log('🔍 Generating codebase map...');
    
    // Get all relevant files
    const files = this.getAllFiles(this.projectPath);
    this.map.meta.fileCount = files.length;
    
    // Process each file
    for (const file of files) {
      await this.processFile(file);
    }
    
    // Find entry points
    this.findEntryPoints();
    
    console.log(`✅ Processed ${files.length} files`);
    return this.map;
  }

  private getAllFiles(dir: string, files: string[] = []): string[] {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      
      // Skip node_modules, .git, etc
      if (item === 'node_modules' || item.startsWith('.')) continue;
      
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        this.getAllFiles(fullPath, files);
      } else if (this.isRelevantFile(item)) {
        files.push(fullPath);
      }
    }
    
    return files;
  }

  private isRelevantFile(filename: string): boolean {
    return filename.endsWith('.ts') || 
           filename.endsWith('.tsx') || 
           filename.endsWith('.js') || 
           filename.endsWith('.jsx');
  }

  private async processFile(filePath: string): Promise<void> {
    const content = fs.readFileSync(filePath, 'utf-8');
    const relativePath = path.relative(this.projectPath, filePath);
    
    // Extract exports
    const exports = this.extractExports(content, filePath);
    if (exports.length > 0) {
      this.map.exports[relativePath] = exports;
    }
    
    // Extract imports
    const imports = this.extractImports(content);
    if (imports.length > 0) {
      this.map.imports[relativePath] = imports;
    }
    
    // Analyze file patterns
    const analysis = this.analyzeFile(content, filePath);
    if (Object.keys(analysis).length > 0) {
      this.map.files[relativePath] = analysis;
    }
  }

  private extractExports(content: string, filePath: string): Array<{ name: string; line: number }> {
    const exports: Array<{ name: string; line: number }> = [];
    const lines = content.split('\n');
    
    // Match various export patterns
    const patterns = [
      /export\s+(?:const|let|var|function|class)\s+(\w+)/,
      /export\s+{\s*([^}]+)\s*}/,
      /export\s+default\s+(?:function|class)?\s*(\w+)?/
    ];
    
    lines.forEach((line, index) => {
      for (const pattern of patterns) {
        const match = line.match(pattern);
        if (match) {
          if (match[1]) {
            // Handle multiple exports in one line
            const names = match[1].split(',').map(n => n.trim());
            names.forEach(name => {
              if (name && !name.includes(' as ')) {
                exports.push({ name, line: index + 1 });
              }
            });
          }
        }
      }
    });
    
    return exports;
  }

  private extractImports(content: string): string[] {
    const imports: string[] = [];
    
    // Match import statements
    const importRegex = /import\s+(?:{[^}]*}|\*\s+as\s+\w+|\w+)?\s*(?:,\s*(?:{[^}]*}|\w+))?\s+from\s+['"]([^'"]+)['"]/g;
    const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
    
    let match;
    
    // ES6 imports
    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1];
      // Extract just the module names, not paths
      const names = this.extractImportNames(match[0]);
      imports.push(...names);
    }
    
    // CommonJS requires
    while ((match = requireRegex.exec(content)) !== null) {
      const importPath = match[1];
      const moduleName = path.basename(importPath);
      imports.push(moduleName);
    }
    
    return [...new Set(imports)]; // Remove duplicates
  }

  private extractImportNames(importStatement: string): string[] {
    const names: string[] = [];
    
    // Extract named imports
    const namedMatch = importStatement.match(/{([^}]*)}/);
    if (namedMatch) {
      const items = namedMatch[1].split(',');
      items.forEach(item => {
        const name = item.trim().split(' as ')[0].trim();
        if (name) names.push(name);
      });
    }
    
    // Extract default import
    const defaultMatch = importStatement.match(/import\s+(\w+)\s+from/);
    if (defaultMatch) {
      names.push(defaultMatch[1]);
    }
    
    return names;
  }

  private calculateMetrics(content: string): FileMetrics {
    const lines = content.split('\n');
    const loc = lines.filter(l => l.trim() && !l.trim().startsWith('//')).length;
    
    // Count functions (simple regex-based)
    const functionMatches = content.match(/function\s+\w+|=>\s*{|async\s+\w+|constructor\s*\(|class\s+\w+/g) || [];
    const functions = functionMatches.length;
    
    // Count exports (already calculated elsewhere, but for metrics)
    const exportMatches = content.match(/export\s+/g) || [];
    const exports = exportMatches.length;
    
    // Count imports
    const importMatches = content.match(/import\s+.+from/g) || [];
    const imports = importMatches.length;
    
    // Estimate complexity (if statements, loops, switches)
    const complexityPatterns = content.match(/if\s*\(|for\s*\(|while\s*\(|switch\s*\(|\?\s*:|&&|\|\|/g) || [];
    const complexity = complexityPatterns.length + 1; // +1 base complexity
    
    return { loc, functions, exports, imports, complexity };
  }
  
  private analyzeFile(content: string, filePath: string): any {
    const analysis: any = {};
    const filename = path.basename(filePath);
    
    // Add file metrics
    analysis.metrics = this.calculateMetrics(content);
    
    // Check for validation patterns
    if (content.includes('.parse(') || content.includes('.safeParse(')) {
      analysis.hasParse = 1;
    } else {
      analysis.hasParse = 0;
    }
    
    // Check for auth patterns
    if (content.includes('getServerSession') || 
        content.includes('withAuth') || 
        content.includes('useSession') ||
        content.includes('verifyAuth')) {
      analysis.hasAuth = 1;
    } else {
      analysis.hasAuth = 0;
    }
    
    // Check for error handling
    if (content.includes('try {') && content.includes('catch')) {
      analysis.hasTryCatch = 1;
    } else {
      analysis.hasTryCatch = 0;
    }
    
    // For hooks - check loading and error states
    if (filename.includes('use') || filePath.includes('/hooks/')) {
      if (content.includes('isLoading') || content.includes('isPending') || content.includes('loading')) {
        analysis.hasLoadingState = 1;
      } else {
        analysis.hasLoadingState = 0;
      }
      
      if (content.includes('error') || content.includes('isError')) {
        analysis.hasErrorState = 1;
      } else {
        analysis.hasErrorState = 0;
      }
      
      // Check for mutations
      const mutationMatch = content.match(/useMutation|mutation|create|update|delete/gi);
      if (mutationMatch) {
        analysis.mutations = [...new Set(mutationMatch.map(m => m.toLowerCase()))];
      }
      
      // Check for invalidations
      const invalidateMatch = content.match(/invalidateQueries|setQueryData/g);
      if (invalidateMatch) {
        analysis.invalidates = invalidateMatch;
      }
    }
    
    // For forms - check validation
    if (filename.includes('Form') || content.includes('<form')) {
      if (content.includes('useForm') || 
          content.includes('zodResolver') || 
          content.includes('validation') ||
          content.includes('validate')) {
        analysis.hasFormValidation = 1;
      } else {
        analysis.hasFormValidation = 0;
      }
    }
    
    return analysis;
  }

  private findEntryPoints(): void {
    // Find pages (Next.js app directory)
    for (const filePath in this.map.files) {
      if (filePath.includes('app/') && filePath.endsWith('/page.tsx')) {
        const route = this.fileToRoute(filePath);
        const content = fs.readFileSync(path.join(this.projectPath, filePath), 'utf-8');
        
        this.map.entryPoints[route] = {
          type: 'page',
          protected: this.isProtectedRoute(content, filePath)
        };
      }
      
      // Find API routes
      if (filePath.includes('app/api/') && filePath.endsWith('/route.ts')) {
        const route = this.fileToApiRoute(filePath);
        const content = fs.readFileSync(path.join(this.projectPath, filePath), 'utf-8');
        
        this.map.entryPoints[route] = {
          type: 'api',
          protected: this.isProtectedRoute(content, filePath)
        };
      }
    }
  }

  private fileToRoute(filePath: string): string {
    // Convert app/orders/page.tsx to /orders
    const parts = filePath.split('/');
    const appIndex = parts.indexOf('app');
    
    if (appIndex !== -1) {
      const routeParts = parts.slice(appIndex + 1, -1); // Remove 'app' and 'page.tsx'
      
      // Handle (group) syntax
      const cleanParts = routeParts.filter(p => !p.startsWith('('));
      
      return '/' + cleanParts.join('/');
    }
    
    return filePath;
  }

  private fileToApiRoute(filePath: string): string {
    // Convert app/api/orders/route.ts to /api/orders
    const parts = filePath.split('/');
    const apiIndex = parts.indexOf('api');
    
    if (apiIndex !== -1) {
      const routeParts = parts.slice(apiIndex, -1); // Remove 'route.ts'
      return '/' + routeParts.join('/');
    }
    
    return filePath;
  }

  private isProtectedRoute(content: string, filePath: string): boolean {
    // Check if route/page is protected
    return content.includes('withAuth') || 
           content.includes('getServerSession') ||
           content.includes('middleware') ||
           filePath.includes('admin') ||
           filePath.includes('dashboard') ||
           filePath.includes('protected');
  }

  async saveToFile(outputPath: string): Promise<void> {
    const map = await this.generate();
    fs.writeFileSync(outputPath, JSON.stringify(map, null, 2));
    console.log(`💾 Map saved to ${outputPath}`);
  }
}

// CLI support
if (require.main === module) {
  const projectPath = process.argv[2] || process.cwd();
  const outputPath = process.argv[3] || 'codebase-map.json';
  
  const generator = new MapGenerator(projectPath);
  generator.saveToFile(outputPath);
}