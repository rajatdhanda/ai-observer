/**
 * Table-to-Code Mapper
 * Maps how each database table flows through the application
 */

import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';

export interface TableMapping {
  tables: Map<string, TableUsage>;
  summary: {
    totalTables: number;
    fullyMapped: number;
    partiallyMapped: number;
    unmapped: number;
  };
  issues: TableIssue[];
}

export interface TableUsage {
  tableName: string;
  typeDefinition?: {
    file: string;
    line: number;
    hasZodSchema: boolean;
    schemaName?: string;
  };
  databaseQueries: {
    file: string;
    operations: string[]; // select, insert, update, delete
    hasValidation: boolean;
  }[];
  hooks: {
    file: string;
    hookName: string;
    operations: string[]; // fetch, create, update, delete
    hasErrorHandling: boolean;
    hasLoadingState: boolean;
    usedInComponents?: string[]; // Components that use this hook
  }[];
  components: {
    file: string;
    componentName: string;
    usage: 'display' | 'input' | 'both';
    directDBAccess: boolean; // Red flag if true
  }[];
  apiEndpoints: {
    route: string;
    methods: string[];
    hasValidation: boolean;
  }[];
  mutations: {
    file: string;
    mutationName: string;
    hasCacheInvalidation: boolean;
  }[];
  dataFlow: {
    complete: boolean;
    chain: string[];
    missingLinks: string[];
  };
  score: number; // 0-100 based on completeness
}

export interface TableIssue {
  table: string;
  type: 'critical' | 'warning';
  issue: string;
  suggestion: string;
  file?: string;
}

export class TableMapper {
  private projectPath: string;
  private tables: Map<string, TableUsage> = new Map();
  private issues: TableIssue[] = [];
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

  async analyze(): Promise<TableMapping> {
    // Step 1: Discover all tables from types
    await this.discoverTables();
    
    // Step 2: Map database queries
    await this.mapDatabaseQueries();
    
    // Step 3: Map hooks usage
    await this.mapHooks();
    
    // Step 4: Map component usage
    await this.mapComponents();
    
    // Step 5: Map API endpoints
    await this.mapAPIEndpoints();
    
    // Step 6: Check mutations
    await this.mapMutations();
    
    // Step 7: Validate data flow
    await this.validateDataFlow();
    
    // Step 8: Calculate scores
    this.calculateScores();
    
    // Generate summary
    const summary = this.generateSummary();
    
    return {
      tables: this.tables,
      summary,
      issues: this.issues
    };
  }

  private async discoverTables() {
    const typesPath = path.join(this.projectPath, 'src', 'types');
    const altTypesPath = path.join(this.projectPath, 'types');
    const appTypesPath = path.join(this.projectPath, 'app', 'types');
    
    const typesPaths = [typesPath, altTypesPath, appTypesPath].filter(fs.existsSync);
    
    if (typesPaths.length === 0) {
      // Try to find any .types.ts files
      const allFiles = this.getAllFiles(this.projectPath, '.ts');
      const typeFiles = allFiles.filter(f => 
        f.includes('.types.ts') || 
        f.includes('/types/') || 
        f.includes('schema.ts')
      );
      
      for (const file of typeFiles) {
        await this.extractTablesFromFile(file);
      }
    } else {
      for (const typePath of typesPaths) {
        const files = this.getFiles(typePath, '.ts');
        for (const file of files) {
          await this.extractTablesFromFile(file);
        }
      }
    }
  }

  private async extractTablesFromFile(file: string) {
    const source = this.program.getSourceFile(file);
    if (!source) return;
    
    const visit = (node: ts.Node) => {
      // Look for interfaces/types that look like tables
      if (ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) {
        const name = node.name?.getText();
        if (name && this.looksLikeTable(name)) {
          const tableName = this.normalizeTableName(name);
          
          if (!this.tables.has(tableName)) {
            this.tables.set(tableName, {
              tableName,
              typeDefinition: {
                file,
                line: source.getLineAndCharacterOfPosition(node.getStart()).line + 1,
                hasZodSchema: false
              },
              databaseQueries: [],
              hooks: [],
              components: [],
              apiEndpoints: [],
              mutations: [],
              dataFlow: {
                complete: false,
                chain: [],
                missingLinks: []
              },
              score: 0
            });
          }
        }
      }
      
      // Look for Zod schemas
      if (ts.isVariableStatement(node)) {
        const declaration = node.declarationList.declarations[0];
        if (declaration && ts.isIdentifier(declaration.name)) {
          const name = declaration.name.text;
          if (name.endsWith('Schema') && name !== 'Schema') {
            const tableName = this.normalizeTableName(name.replace('Schema', ''));
            const table = this.tables.get(tableName);
            if (table) {
              table.typeDefinition = {
                ...table.typeDefinition!,
                hasZodSchema: true,
                schemaName: name
              };
            }
          }
        }
      }
      
      ts.forEachChild(node, visit);
    };
    
    ts.forEachChild(source, visit);
  }

  private looksLikeTable(name: string): boolean {
    // Common patterns for table/model names
    const tablePatterns = [
      /^[A-Z][a-zA-Z]+$/, // PascalCase single word
      /^[A-Z][a-zA-Z]+Model$/, // XModel
      /^[A-Z][a-zA-Z]+Entity$/, // XEntity
      /^[A-Z][a-zA-Z]+Table$/, // XTable
      /^[A-Z][a-zA-Z]+Type$/, // XType
      /^[A-Z][a-zA-Z]+Data$/, // XData
    ];
    
    // Exclude common non-table types
    const excludePatterns = [
      /Props$/, /State$/, /Context$/, /Config$/, /Options$/, 
      /Response$/, /Request$/, /Error$/, /Event$/
    ];
    
    if (excludePatterns.some(p => p.test(name))) return false;
    return tablePatterns.some(p => p.test(name));
  }

  private normalizeTableName(name: string): string {
    // Convert to lowercase, remove suffix
    return name
      .replace(/Model$|Entity$|Table$|Type$|Data$|Schema$/, '')
      .toLowerCase();
  }

  private async mapDatabaseQueries() {
    const dbPaths = [
      path.join(this.projectPath, 'src', 'lib', 'db'),
      path.join(this.projectPath, 'lib', 'db'),
      path.join(this.projectPath, 'src', 'db'),
      path.join(this.projectPath, 'db')
    ];
    
    for (const dbPath of dbPaths) {
      if (!fs.existsSync(dbPath)) continue;
      
      const files = this.getFiles(dbPath, '.ts');
      for (const file of files) {
        const source = fs.readFileSync(file, 'utf-8');
        
        // Look for database operations
        for (const [tableName, table] of this.tables) {
          const patterns = [
            new RegExp(`from\\(['"\`]${tableName}['"\`]\\)`, 'gi'),
            new RegExp(`\\.${tableName}\\(`, 'gi'),
            new RegExp(`supabase[^\\n]*${tableName}`, 'gi'),
            new RegExp(`prisma\\.${tableName}`, 'gi'),
            new RegExp(`db\\.${tableName}`, 'gi')
          ];
          
          if (patterns.some(p => p.test(source))) {
            const operations = [];
            if (/\.select|\.find|\.get|SELECT/i.test(source)) operations.push('select');
            if (/\.insert|\.create|INSERT/i.test(source)) operations.push('insert');
            if (/\.update|\.upsert|UPDATE/i.test(source)) operations.push('update');
            if (/\.delete|\.remove|DELETE/i.test(source)) operations.push('delete');
            
            const hasValidation = source.includes('.parse(') || source.includes('Schema.parse');
            
            table.databaseQueries.push({
              file,
              operations,
              hasValidation
            });
            
            if (!hasValidation) {
              this.issues.push({
                table: tableName,
                type: 'critical',
                issue: 'Database queries not validated',
                suggestion: `Use ${tableName}Schema.parse() on query results`,
                file
              });
            }
          }
        }
      }
    }
  }

  private findComponentsUsingHook(hookName: string): string[] {
    const components: string[] = [];
    const componentsPath = path.join(this.projectPath, 'src', 'components');
    const appPath = path.join(this.projectPath, 'app');
    
    const searchPaths = [componentsPath, appPath].filter(fs.existsSync);
    
    for (const searchPath of searchPaths) {
      const files = this.getFiles(searchPath, '.tsx');
      for (const file of files) {
        try {
          const source = fs.readFileSync(file, 'utf-8');
          // Check if this component imports/uses the hook
          const hookPattern = new RegExp(`\\b${hookName}\\b`, 'g');
          if (hookPattern.test(source)) {
            const componentName = path.basename(file, '.tsx');
            components.push(componentName);
          }
        } catch (error) {
          // Skip files we can't read
        }
      }
    }
    
    return components;
  }
  
  private async mapHooks() {
    const hooksPaths = [
      path.join(this.projectPath, 'src', 'hooks'),
      path.join(this.projectPath, 'hooks'),
      path.join(this.projectPath, 'app', 'hooks')
    ];
    
    for (const hooksPath of hooksPaths) {
      if (!fs.existsSync(hooksPath)) continue;
      
      const files = this.getFiles(hooksPath, '.ts');
      for (const file of files) {
        const source = fs.readFileSync(file, 'utf-8');
        const hookName = path.basename(file, '.ts');
        
        for (const [tableName, table] of this.tables) {
          // Check if hook references this table
          if (source.toLowerCase().includes(tableName)) {
            const operations = [];
            if (/use.*Query|fetch|get|list/i.test(hookName)) operations.push('fetch');
            if (/use.*Create|useAdd/i.test(hookName)) operations.push('create');
            if (/use.*Update|useEdit/i.test(hookName)) operations.push('update');
            if (/use.*Delete|useRemove/i.test(hookName)) operations.push('delete');
            if (/use.*Mutation/i.test(hookName)) operations.push('mutate');
            
            const hasErrorHandling = /error|Error|catch|\.catch\(|onError/i.test(source);
            const hasLoadingState = /loading|Loading|isLoading|pending|isPending/i.test(source);
            
            // Find components that use this hook
            const usedInComponents = this.findComponentsUsingHook(hookName);
            
            table.hooks.push({
              file,
              hookName,
              operations,
              hasErrorHandling,
              hasLoadingState,
              usedInComponents
            });
            
            if (!hasErrorHandling) {
              this.issues.push({
                table: tableName,
                type: 'warning',
                issue: `Hook ${hookName} missing error handling`,
                suggestion: 'Add error state and try-catch blocks',
                file
              });
            }
            
            if (!hasLoadingState) {
              this.issues.push({
                table: tableName,
                type: 'warning',
                issue: `Hook ${hookName} missing loading state`,
                suggestion: 'Add isLoading state for better UX',
                file
              });
            }
          }
        }
      }
    }
  }

  private async mapComponents() {
    const componentPaths = [
      path.join(this.projectPath, 'src', 'components'),
      path.join(this.projectPath, 'components'),
      path.join(this.projectPath, 'app', 'components'),
      path.join(this.projectPath, 'app', 'ui-components')
    ];
    
    for (const compPath of componentPaths) {
      if (!fs.existsSync(compPath)) continue;
      
      const files = this.getFiles(compPath, '.tsx');
      for (const file of files) {
        const source = fs.readFileSync(file, 'utf-8');
        const componentName = path.basename(file, '.tsx');
        
        for (const [tableName, table] of this.tables) {
          if (source.toLowerCase().includes(tableName)) {
            // Check for direct DB access (bad!)
            const directDBAccess = /from ['"]@\/lib\/db|from ['"]\.\.\/lib\/db|supabase|prisma/i.test(source);
            
            // Determine usage type
            let usage: 'display' | 'input' | 'both' = 'display';
            if (/<form|<input|<textarea|<select/i.test(source)) {
              usage = source.includes('map(') ? 'both' : 'input';
            }
            
            table.components.push({
              file,
              componentName,
              usage,
              directDBAccess
            });
            
            if (directDBAccess) {
              this.issues.push({
                table: tableName,
                type: 'critical',
                issue: `Component ${componentName} has direct DB access`,
                suggestion: 'Components should use hooks, not direct DB calls',
                file
              });
            }
          }
        }
      }
    }
  }

  private async mapAPIEndpoints() {
    const apiPaths = [
      path.join(this.projectPath, 'app', 'api'),
      path.join(this.projectPath, 'pages', 'api'),
      path.join(this.projectPath, 'src', 'pages', 'api')
    ];
    
    for (const apiPath of apiPaths) {
      if (!fs.existsSync(apiPath)) continue;
      
      const files = this.getAllFiles(apiPath, '.ts');
      for (const file of files) {
        const source = fs.readFileSync(file, 'utf-8');
        
        // Extract route from file path
        const route = file
          .replace(this.projectPath, '')
          .replace(/\\/g, '/')
          .replace(/\.(ts|js)$/, '')
          .replace('/route', '');
        
        for (const [tableName, table] of this.tables) {
          if (source.toLowerCase().includes(tableName)) {
            const methods = [];
            if (/export.*GET|async.*GET/i.test(source)) methods.push('GET');
            if (/export.*POST|async.*POST/i.test(source)) methods.push('POST');
            if (/export.*PUT|async.*PUT/i.test(source)) methods.push('PUT');
            if (/export.*DELETE|async.*DELETE/i.test(source)) methods.push('DELETE');
            if (/export.*PATCH|async.*PATCH/i.test(source)) methods.push('PATCH');
            
            const hasValidation = source.includes('.parse(') || source.includes('zod');
            
            if (methods.length > 0) {
              table.apiEndpoints.push({
                route,
                methods,
                hasValidation
              });
              
              if (!hasValidation) {
                this.issues.push({
                  table: tableName,
                  type: 'critical',
                  issue: `API endpoint ${route} missing validation`,
                  suggestion: 'Use Zod schema to validate request/response',
                  file
                });
              }
            }
          }
        }
      }
    }
  }

  private async mapMutations() {
    // Look for mutations in hooks
    for (const [tableName, table] of this.tables) {
      for (const hook of table.hooks) {
        const source = fs.readFileSync(hook.file, 'utf-8');
        
        if (source.includes('useMutation')) {
          const hasCacheInvalidation = 
            source.includes('invalidateQueries') ||
            source.includes('setQueryData') ||
            source.includes('refetch');
          
          table.mutations.push({
            file: hook.file,
            mutationName: hook.hookName,
            hasCacheInvalidation
          });
          
          if (!hasCacheInvalidation) {
            this.issues.push({
              table: tableName,
              type: 'critical',
              issue: `Mutation ${hook.hookName} missing cache invalidation`,
              suggestion: 'Add queryClient.invalidateQueries() in onSuccess',
              file: hook.file
            });
          }
        }
      }
    }
  }

  private async validateDataFlow() {
    for (const [tableName, table] of this.tables) {
      const chain = [];
      const missingLinks = [];
      
      // Check type definition
      if (table.typeDefinition) {
        chain.push('Type defined');
        if (table.typeDefinition.hasZodSchema) {
          chain.push('Zod schema');
        } else {
          missingLinks.push('Missing Zod schema for validation');
        }
      } else {
        missingLinks.push('Missing type definition');
      }
      
      // Check database layer
      if (table.databaseQueries.length > 0) {
        chain.push('DB queries');
        if (!table.databaseQueries.some(q => q.hasValidation)) {
          missingLinks.push('DB queries not validated');
        }
      } else {
        missingLinks.push('No database queries found');
      }
      
      // Check hooks
      if (table.hooks.length > 0) {
        chain.push('Hooks');
        if (!table.hooks.some(h => h.hasErrorHandling)) {
          missingLinks.push('Hooks missing error handling');
        }
      } else {
        missingLinks.push('No hooks for data fetching');
      }
      
      // Check components
      if (table.components.length > 0) {
        chain.push('Components');
        if (table.components.some(c => c.directDBAccess)) {
          missingLinks.push('Components have direct DB access');
        }
      } else {
        missingLinks.push('No components using this data');
      }
      
      // Check API
      if (table.apiEndpoints.length > 0) {
        chain.push('API endpoints');
        if (!table.apiEndpoints.some(e => e.hasValidation)) {
          missingLinks.push('API endpoints not validated');
        }
      }
      
      table.dataFlow = {
        complete: missingLinks.length === 0,
        chain,
        missingLinks
      };
    }
  }

  private calculateScores() {
    for (const [tableName, table] of this.tables) {
      let score = 0;
      let maxScore = 0;
      
      // Type definition (20 points)
      maxScore += 20;
      if (table.typeDefinition) {
        score += 10;
        if (table.typeDefinition.hasZodSchema) score += 10;
      }
      
      // Database queries (20 points)
      maxScore += 20;
      if (table.databaseQueries.length > 0) {
        score += 10;
        if (table.databaseQueries.some(q => q.hasValidation)) score += 10;
      }
      
      // Hooks (20 points)
      maxScore += 20;
      if (table.hooks.length > 0) {
        score += 10;
        if (table.hooks.some(h => h.hasErrorHandling && h.hasLoadingState)) score += 10;
      }
      
      // Components (20 points)
      maxScore += 20;
      if (table.components.length > 0) {
        score += 10;
        if (!table.components.some(c => c.directDBAccess)) score += 10;
      }
      
      // API validation (10 points)
      if (table.apiEndpoints.length > 0) {
        maxScore += 10;
        if (table.apiEndpoints.some(e => e.hasValidation)) score += 10;
      }
      
      // Cache invalidation (10 points)
      if (table.mutations.length > 0) {
        maxScore += 10;
        if (table.mutations.some(m => m.hasCacheInvalidation)) score += 10;
      }
      
      table.score = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    }
  }

  private generateSummary() {
    let fullyMapped = 0;
    let partiallyMapped = 0;
    let unmapped = 0;
    
    for (const [_, table] of this.tables) {
      if (table.score >= 80) fullyMapped++;
      else if (table.score >= 40) partiallyMapped++;
      else unmapped++;
    }
    
    return {
      totalTables: this.tables.size,
      fullyMapped,
      partiallyMapped,
      unmapped
    };
  }

  private getFiles(dir: string, extension: string): string[] {
    const files: string[] = [];
    if (!fs.existsSync(dir)) return files;
    
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        files.push(...this.getFiles(fullPath, extension));
      } else if (item.name.endsWith(extension)) {
        files.push(fullPath);
      }
    }
    return files;
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