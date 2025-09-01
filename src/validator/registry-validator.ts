/**
 * Registry Validator
 * Validates that Routes, QueryKeys, and CTAs are properly defined and used
 * Prevents typos that cause 404s, broken navigation, and dead buttons
 */

import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';

export interface RegistryValidation {
  registries: {
    routes: Registry;
    queryKeys: Registry;
    ctas: Registry;
    apiEndpoints: Registry;
  };
  usage: {
    valid: RegistryUsage[];
    invalid: RegistryUsage[];
    typos: TypoDetection[];
  };
  coverage: {
    defined: number;
    used: number;
    unused: string[];
    undefined: string[];
  };
  score: number;
}

export interface Registry {
  found: boolean;
  file?: string;
  items: Map<string, RegistryItem>;
}

export interface RegistryItem {
  key: string;
  value: string;
  type: 'route' | 'queryKey' | 'cta' | 'api';
  file: string;
  line: number;
}

export interface RegistryUsage {
  value: string;
  type: 'hardcoded' | 'registry';
  file: string;
  line: number;
  suggestion?: string;
}

export interface TypoDetection {
  found: string;
  suggestion: string;
  similarity: number;
  file: string;
  line: number;
}

export class RegistryValidator {
  private projectPath: string;
  private registries: Map<string, Registry> = new Map();
  private usages: RegistryUsage[] = [];
  private program: ts.Program;
  private checker: ts.TypeChecker;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
    const configPath = ts.findConfigFile(projectPath, ts.sys.fileExists, 'tsconfig.json');
    const { config } = ts.readConfigFile(configPath!, ts.sys.readFile);
    const { options, fileNames } = ts.parseJsonConfigFileContent(
      config,
      ts.sys,
      projectPath
    );
    this.program = ts.createProgram(fileNames, options);
    this.checker = this.program.getTypeChecker();
  }

  async validate(): Promise<RegistryValidation> {
    // Step 1: Find registry definitions
    await this.findRegistries();
    
    // Step 2: Find all usages
    await this.findUsages();
    
    // Step 3: Validate usages against registries
    const validation = this.validateUsages();
    
    // Step 4: Detect potential typos
    const typos = this.detectTypos();
    
    // Step 5: Calculate coverage
    const coverage = this.calculateCoverage();
    
    // Step 6: Calculate score
    const score = this.calculateScore(validation, coverage);
    
    return {
      registries: {
        routes: this.registries.get('routes') || { found: false, items: new Map() },
        queryKeys: this.registries.get('queryKeys') || { found: false, items: new Map() },
        ctas: this.registries.get('ctas') || { found: false, items: new Map() },
        apiEndpoints: this.registries.get('api') || { found: false, items: new Map() }
      },
      usage: {
        valid: validation.valid,
        invalid: validation.invalid,
        typos
      },
      coverage,
      score
    };
  }

  private async findRegistries() {
    // Common locations for registries
    const registryPaths = [
      path.join(this.projectPath, 'src', 'constants'),
      path.join(this.projectPath, 'src', 'lib', 'constants'),
      path.join(this.projectPath, 'constants'),
      path.join(this.projectPath, 'src', 'config')
    ];

    // Also search for any file with 'registry', 'routes', 'constants' in name
    const allFiles = this.getAllFiles(this.projectPath, '.ts');
    const registryFiles = allFiles.filter(f => 
      /registry|routes|constants|config/i.test(f) &&
      !f.includes('node_modules') &&
      !f.includes('.next')
    );

    for (const file of registryFiles) {
      await this.extractRegistryFromFile(file);
    }

    // If no registries found in files, check for inline definitions
    if (this.registries.size === 0) {
      await this.findInlineRegistries();
    }
  }

  private async extractRegistryFromFile(file: string) {
    const source = this.program.getSourceFile(file);
    if (!source) return;

    const visit = (node: ts.Node) => {
      // Look for const objects that look like registries
      if (ts.isVariableStatement(node)) {
        const declaration = node.declarationList.declarations[0];
        if (declaration && ts.isIdentifier(declaration.name)) {
          const name = declaration.name.text.toLowerCase();
          
          // Check if this looks like a registry
          if (name.includes('route') || name.includes('path')) {
            this.extractRouteRegistry(declaration, file, source);
          } else if (name.includes('query') || name.includes('key')) {
            this.extractQueryKeyRegistry(declaration, file, source);
          } else if (name.includes('cta') || name.includes('action')) {
            this.extractCTARegistry(declaration, file, source);
          } else if (name.includes('api') || name.includes('endpoint')) {
            this.extractAPIRegistry(declaration, file, source);
          }
        }
      }

      // Look for enums that might be registries
      if (ts.isEnumDeclaration(node)) {
        const name = node.name?.text.toLowerCase();
        if (name && (name.includes('route') || name.includes('path') || name.includes('key'))) {
          this.extractEnumRegistry(node, file, source);
        }
      }

      ts.forEachChild(node, visit);
    };

    ts.forEachChild(source, visit);
  }

  private extractRouteRegistry(node: any, file: string, source: ts.SourceFile) {
    if (!this.registries.has('routes')) {
      this.registries.set('routes', { found: true, file, items: new Map() });
    }

    const registry = this.registries.get('routes')!;
    
    // Extract route definitions
    if (node.initializer && ts.isObjectLiteralExpression(node.initializer)) {
      node.initializer.properties.forEach((prop: any) => {
        if (ts.isPropertyAssignment(prop) && prop.name) {
          const key = prop.name.getText();
          const value = prop.initializer.getText().replace(/['"]/g, '');
          
          registry.items.set(key, {
            key,
            value,
            type: 'route',
            file,
            line: source.getLineAndCharacterOfPosition(prop.getStart()).line + 1
          });
        }
      });
    }
  }

  private extractQueryKeyRegistry(node: any, file: string, source: ts.SourceFile) {
    if (!this.registries.has('queryKeys')) {
      this.registries.set('queryKeys', { found: true, file, items: new Map() });
    }

    const registry = this.registries.get('queryKeys')!;
    
    // Extract query key definitions
    if (node.initializer && ts.isObjectLiteralExpression(node.initializer)) {
      node.initializer.properties.forEach((prop: any) => {
        if (ts.isPropertyAssignment(prop) && prop.name) {
          const key = prop.name.getText();
          
          // Query keys might be functions
          let value = key;
          if (prop.initializer) {
            if (ts.isArrowFunction(prop.initializer) || ts.isFunctionExpression(prop.initializer)) {
              value = `${key}()`;
            } else {
              value = prop.initializer.getText().replace(/['"]/g, '');
            }
          }
          
          registry.items.set(key, {
            key,
            value,
            type: 'queryKey',
            file,
            line: source.getLineAndCharacterOfPosition(prop.getStart()).line + 1
          });
        }
      });
    }
  }

  private extractCTARegistry(node: any, file: string, source: ts.SourceFile) {
    if (!this.registries.has('ctas')) {
      this.registries.set('ctas', { found: true, file, items: new Map() });
    }

    const registry = this.registries.get('ctas')!;
    
    // Extract CTA definitions
    if (node.initializer && ts.isObjectLiteralExpression(node.initializer)) {
      node.initializer.properties.forEach((prop: any) => {
        if (ts.isPropertyAssignment(prop) && prop.name) {
          const key = prop.name.getText();
          const value = prop.initializer.getText().replace(/['"]/g, '');
          
          registry.items.set(key, {
            key,
            value,
            type: 'cta',
            file,
            line: source.getLineAndCharacterOfPosition(prop.getStart()).line + 1
          });
        }
      });
    }
  }

  private extractAPIRegistry(node: any, file: string, source: ts.SourceFile) {
    if (!this.registries.has('api')) {
      this.registries.set('api', { found: true, file, items: new Map() });
    }

    const registry = this.registries.get('api')!;
    
    // Extract API endpoint definitions
    if (node.initializer && ts.isObjectLiteralExpression(node.initializer)) {
      node.initializer.properties.forEach((prop: any) => {
        if (ts.isPropertyAssignment(prop) && prop.name) {
          const key = prop.name.getText();
          const value = prop.initializer.getText().replace(/['"]/g, '');
          
          registry.items.set(key, {
            key,
            value,
            type: 'api',
            file,
            line: source.getLineAndCharacterOfPosition(prop.getStart()).line + 1
          });
        }
      });
    }
  }

  private extractEnumRegistry(node: ts.EnumDeclaration, file: string, source: ts.SourceFile) {
    const enumName = node.name?.text.toLowerCase() || '';
    let registryType: string;
    
    if (enumName.includes('route')) registryType = 'routes';
    else if (enumName.includes('query')) registryType = 'queryKeys';
    else if (enumName.includes('cta')) registryType = 'ctas';
    else if (enumName.includes('api')) registryType = 'api';
    else return;

    if (!this.registries.has(registryType)) {
      this.registries.set(registryType, { found: true, file, items: new Map() });
    }

    const registry = this.registries.get(registryType)!;
    
    node.members.forEach(member => {
      if (ts.isEnumMember(member) && member.name) {
        const key = member.name.getText();
        const value = member.initializer ? member.initializer.getText().replace(/['"]/g, '') : key;
        
        registry.items.set(key, {
          key,
          value,
          type: registryType as any,
          file,
          line: source.getLineAndCharacterOfPosition(member.getStart()).line + 1
        });
      }
    });
  }

  private async findInlineRegistries() {
    // Look for common patterns in actual usage files
    const componentsPath = path.join(this.projectPath, 'src', 'components');
    const appPath = path.join(this.projectPath, 'app');
    const pagesPath = path.join(this.projectPath, 'pages');
    
    const paths = [componentsPath, appPath, pagesPath].filter(fs.existsSync);
    
    for (const p of paths) {
      const files = this.getAllFiles(p, '.tsx');
      for (const file of files.slice(0, 10)) { // Sample first 10 files
        const source = fs.readFileSync(file, 'utf-8');
        
        // Look for patterns that suggest registry should exist
        if (source.includes('Routes.') || source.includes('ROUTES.')) {
          if (!this.registries.has('routes')) {
            this.registries.set('routes', { found: false, items: new Map() });
          }
        }
        
        if (source.includes('QueryKeys.') || source.includes('QUERY_KEYS.')) {
          if (!this.registries.has('queryKeys')) {
            this.registries.set('queryKeys', { found: false, items: new Map() });
          }
        }
      }
    }
  }

  private async findUsages() {
    // Find all string literals that look like routes, query keys, etc.
    const files = this.getAllFiles(this.projectPath, '.tsx').concat(
      this.getAllFiles(this.projectPath, '.ts')
    );

    for (const file of files) {
      if (file.includes('node_modules') || file.includes('.next')) continue;
      
      const source = fs.readFileSync(file, 'utf-8');
      const lines = source.split('\n');
      
      lines.forEach((line, idx) => {
        // Find hardcoded routes
        const routeMatches = line.matchAll(/["'`](\/[^"'`\s]*)["'`]/g);
        for (const match of routeMatches) {
          if (match[1] && match[1] !== '/') {
            this.usages.push({
              value: match[1],
              type: 'hardcoded',
              file,
              line: idx + 1
            });
          }
        }
        
        // Find query keys
        const queryKeyMatches = line.matchAll(/\[["'`]([^"'`\s]+)["'`]/g);
        for (const match of queryKeyMatches) {
          this.usages.push({
            value: match[1],
            type: 'hardcoded',
            file,
            line: idx + 1
          });
        }
        
        // Find registry usage
        const registryMatches = line.matchAll(/(Routes|ROUTES|QueryKeys|QUERY_KEYS|CTAs|CTAS)\.(\w+)/g);
        for (const match of registryMatches) {
          this.usages.push({
            value: `${match[1]}.${match[2]}`,
            type: 'registry',
            file,
            line: idx + 1
          });
        }
      });
    }
  }

  private validateUsages() {
    const valid: RegistryUsage[] = [];
    const invalid: RegistryUsage[] = [];
    
    for (const usage of this.usages) {
      if (usage.type === 'registry') {
        // Using registry is always valid
        valid.push(usage);
      } else {
        // Check if hardcoded value should be in registry
        let shouldUseRegistry = false;
        let suggestion = '';
        
        // Check routes
        if (usage.value.startsWith('/')) {
          shouldUseRegistry = true;
          suggestion = `Use Routes.${this.camelCase(usage.value)} instead of hardcoded "${usage.value}"`;
        }
        
        // Check query keys
        if (usage.value.match(/^[a-z]+[A-Z]/)) { // camelCase pattern
          const queryKeysRegistry = this.registries.get('queryKeys');
          if (queryKeysRegistry?.items.has(usage.value)) {
            shouldUseRegistry = true;
            suggestion = `Use QueryKeys.${usage.value} instead of hardcoded "${usage.value}"`;
          }
        }
        
        if (shouldUseRegistry) {
          invalid.push({ ...usage, suggestion });
        } else {
          valid.push(usage);
        }
      }
    }
    
    return { valid, invalid };
  }

  private detectTypos(): TypoDetection[] {
    const typos: TypoDetection[] = [];
    
    // Check for similar strings that might be typos
    for (const usage of this.usages) {
      if (usage.type === 'hardcoded' && usage.value.startsWith('/')) {
        const routesRegistry = this.registries.get('routes');
        if (routesRegistry) {
          for (const [key, item] of routesRegistry.items) {
            const similarity = this.calculateSimilarity(usage.value, item.value);
            if (similarity > 0.8 && similarity < 1) {
              typos.push({
                found: usage.value,
                suggestion: item.value,
                similarity,
                file: usage.file,
                line: usage.line
              });
            }
          }
        }
      }
    }
    
    return typos;
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  private calculateCoverage() {
    const defined = new Set<string>();
    const used = new Set<string>();
    
    // Collect all defined items
    for (const [_, registry] of this.registries) {
      for (const [key, item] of registry.items) {
        defined.add(item.value);
      }
    }
    
    // Collect all used items
    for (const usage of this.usages) {
      if (usage.type === 'registry') {
        used.add(usage.value);
      }
    }
    
    // Find unused and undefined
    const unused = Array.from(defined).filter(d => !used.has(d));
    const undefined = Array.from(used).filter(u => !defined.has(u));
    
    return {
      defined: defined.size,
      used: used.size,
      unused,
      undefined
    };
  }

  private calculateScore(validation: any, coverage: any): number {
    let score = 100;
    
    // Deduct for invalid usages
    score -= validation.invalid.length * 5;
    
    // Deduct for missing registries
    if (!this.registries.get('routes')?.found) score -= 20;
    if (!this.registries.get('queryKeys')?.found) score -= 20;
    
    // Deduct for unused definitions
    score -= coverage.unused.length * 2;
    
    // Deduct for undefined usages
    score -= coverage.undefined.length * 3;
    
    return Math.max(0, Math.min(100, score));
  }

  private camelCase(str: string): string {
    return str
      .replace(/^\//, '')
      .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase());
  }

  private getAllFiles(dir: string, extension: string): string[] {
    const files: string[] = [];
    if (!fs.existsSync(dir)) return files;
    
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
        files.push(...this.getAllFiles(fullPath, extension));
      } else if (item.name.endsWith(extension)) {
        files.push(fullPath);
      }
    }
    return files;
  }
}