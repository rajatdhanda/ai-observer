/**
 * AI Code Observer - 80-20 Validation Logic
 * Catches real bugs that cause runtime failures
 */

import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import { RegistryValidator } from './registry-validator';

export interface ValidationResult {
  critical: ValidationIssue[];
  warnings: ValidationIssue[];
  passed: ValidationCheck[];
  score: number;
  summary: {
    hasTypes: boolean;
    hasDB: boolean;
    hasHooks: boolean;
    hasComponents: boolean;
    hasRegistries: boolean;
    registryScore: number;
    chainsComplete: ChainValidation[];
  };
  registryValidation?: any;
}

export interface ValidationIssue {
  type: 'type-db-mismatch' | 'direct-db-call' | 'missing-error-handling' | 
        'missing-loading-state' | 'untyped-api' | 'missing-registry' |
        'no-cache-invalidation' | 'missing-validation' | 'no-auth-guard' |
        'broken-chain';
  severity: 'critical' | 'warning';
  file: string;
  line?: number;
  message: string;
  suggestion: string;
}

export interface ValidationCheck {
  type: string;
  file: string;
  status: 'passed';
  message: string;
}

export interface ChainValidation {
  entity: string;
  steps: {
    type: boolean;
    db: boolean;
    hook: boolean;
    component: boolean;
    page: boolean;
    api?: boolean;
  };
  complete: boolean;
  issues: string[];
}

export class ProjectValidator {
  private projectPath: string;
  private issues: ValidationIssue[] = [];
  private warnings: ValidationIssue[] = [];
  private passed: ValidationCheck[] = [];
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

  async validate(): Promise<ValidationResult> {
    // Check folder structure
    const structure = this.validateStructure();
    
    // Validate each critical aspect
    await this.validateTypeDBAlignment();
    await this.validateHookPattern();
    await this.validateErrorHandling();
    await this.validateLoadingStates();
    await this.validateAPITypeSafety();
    await this.validateCacheInvalidation();
    await this.validateFormValidation();
    await this.validateAuthGuards();
    
    // Validate registries
    let registryValidation;
    try {
      registryValidation = await this.validateRegistriesWithValidator();
    } catch (error) {
      console.error('Registry validation error:', error);
      registryValidation = null;
    }
    
    // Check complete chains
    const chains = await this.validateCompleteChains();
    
    // Calculate score
    const totalChecks = this.issues.length + this.warnings.length + this.passed.length;
    const score = totalChecks > 0 ? (this.passed.length / totalChecks) * 100 : 0;
    
    return {
      critical: this.issues,
      warnings: this.warnings,
      passed: this.passed,
      score: Math.round(score),
      summary: {
        ...structure,
        registryScore: registryValidation && registryValidation.score ? registryValidation.score : 0,
        chainsComplete: chains
      },
      registryValidation
    };
  }

  private validateStructure() {
    const srcPath = path.join(this.projectPath, 'src');
    const appPath = path.join(this.projectPath, 'app');
    
    const hasTypes = fs.existsSync(path.join(srcPath, 'types'));
    const hasDB = fs.existsSync(path.join(srcPath, 'lib', 'db'));
    const hasHooks = fs.existsSync(path.join(srcPath, 'hooks'));
    const hasComponents = fs.existsSync(path.join(srcPath, 'components'));
    const hasRegistries = fs.existsSync(path.join(srcPath, 'constants'));
    
    if (!hasTypes) {
      this.issues.push({
        type: 'broken-chain',
        severity: 'critical',
        file: 'src/types',
        message: 'Missing /src/types folder',
        suggestion: 'Create /src/types folder with Zod schemas for all data models'
      });
    }
    
    if (!hasDB) {
      this.issues.push({
        type: 'broken-chain',
        severity: 'critical',
        file: 'src/lib/db',
        message: 'Missing /src/lib/db folder',
        suggestion: 'Create /src/lib/db folder for database queries'
      });
    }
    
    if (!hasHooks) {
      this.warnings.push({
        type: 'broken-chain',
        severity: 'warning',
        file: 'src/hooks',
        message: 'Missing /src/hooks folder',
        suggestion: 'Create /src/hooks folder for data fetching hooks'
      });
    }
    
    return { hasTypes, hasDB, hasHooks, hasComponents, hasRegistries };
  }

  private async validateTypeDBAlignment() {
    const typesPath = path.join(this.projectPath, 'src', 'types');
    const dbPath = path.join(this.projectPath, 'src', 'lib', 'db');
    
    if (!fs.existsSync(typesPath) || !fs.existsSync(dbPath)) return;
    
    // Find all Zod schemas
    const typeFiles = this.getFiles(typesPath, '.ts');
    const dbFiles = this.getFiles(dbPath, '.ts');
    
    for (const typeFile of typeFiles) {
      const source = this.program.getSourceFile(typeFile);
      if (!source) continue;
      
      // Look for Zod schemas
      ts.forEachChild(source, (node) => {
        if (ts.isVariableStatement(node)) {
          const declaration = node.declarationList.declarations[0];
          if (declaration && ts.isIdentifier(declaration.name)) {
            const name = declaration.name.text;
            if (name.endsWith('Schema')) {
              // Check if corresponding DB file uses .parse()
              const entityName = name.replace('Schema', '').toLowerCase();
              const hasDBFile = dbFiles.some(f => f.includes(entityName));
              
              if (hasDBFile) {
                // Check if DB file uses .parse()
                const dbFile = dbFiles.find(f => f.includes(entityName));
                if (dbFile) {
                  const dbSource = fs.readFileSync(dbFile, 'utf-8');
                  if (!dbSource.includes('.parse(')) {
                    this.issues.push({
                      type: 'type-db-mismatch',
                      severity: 'critical',
                      file: dbFile,
                      message: `DB query returns untyped data (missing ${name}.parse)`,
                      suggestion: `Use ${name}.parse(data) to validate DB results`
                    });
                  } else {
                    this.passed.push({
                      type: 'type-db-alignment',
                      file: dbFile,
                      status: 'passed',
                      message: `✅ ${entityName} DB queries use schema validation`
                    });
                  }
                }
              }
            }
          }
        }
      });
    }
  }

  private async validateHookPattern() {
    const componentsPath = path.join(this.projectPath, 'src', 'components');
    const appPath = path.join(this.projectPath, 'app');
    
    if (!fs.existsSync(componentsPath)) return;
    
    const componentFiles = this.getFiles(componentsPath, '.tsx');
    const appFiles = this.getFiles(appPath, '.tsx');
    
    for (const file of [...componentFiles, ...appFiles]) {
      const source = fs.readFileSync(file, 'utf-8');
      
      // Check for direct DB imports
      if (source.includes("from '@/lib/db") || source.includes("from '../lib/db")) {
        this.issues.push({
          type: 'direct-db-call',
          severity: 'critical',
          file,
          message: 'Component imports DB directly',
          suggestion: 'Components should use hooks, not direct DB calls'
        });
      }
      
      // Check if using hooks properly
      if (source.includes('use') && source.includes('from "@/hooks')) {
        this.passed.push({
          type: 'hook-pattern',
          file,
          status: 'passed',
          message: '✅ Component uses hooks for data'
        });
      }
    }
  }

  private async validateErrorHandling() {
    const hooksPath = path.join(this.projectPath, 'src', 'hooks');
    if (!fs.existsSync(hooksPath)) return;
    
    const hookFiles = this.getFiles(hooksPath, '.ts');
    
    for (const file of hookFiles) {
      const source = fs.readFileSync(file, 'utf-8');
      
      // Check for error handling
      const hasErrorState = source.includes('error') || source.includes('Error');
      const hasTryCatch = source.includes('try') && source.includes('catch');
      const hasErrorHandling = source.includes('.catch(') || source.includes('onError');
      
      if (!hasErrorState && !hasTryCatch && !hasErrorHandling) {
        this.warnings.push({
          type: 'missing-error-handling',
          severity: 'warning',
          file,
          message: 'Hook missing error handling',
          suggestion: 'Add error state and try-catch blocks'
        });
      } else {
        this.passed.push({
          type: 'error-handling',
          file,
          status: 'passed',
          message: '✅ Hook has error handling'
        });
      }
    }
  }

  private async validateLoadingStates() {
    const hooksPath = path.join(this.projectPath, 'src', 'hooks');
    if (!fs.existsSync(hooksPath)) return;
    
    const hookFiles = this.getFiles(hooksPath, '.ts');
    
    for (const file of hookFiles) {
      const source = fs.readFileSync(file, 'utf-8');
      
      // Check for loading states
      const hasLoadingState = source.includes('loading') || source.includes('Loading') || 
                             source.includes('isLoading') || source.includes('pending');
      
      if (!hasLoadingState && source.includes('use')) {
        this.warnings.push({
          type: 'missing-loading-state',
          severity: 'warning',
          file,
          message: 'Hook missing loading state',
          suggestion: 'Add isLoading state for better UX'
        });
      }
    }
  }

  private async validateAPITypeSafety() {
    const apiPath = path.join(this.projectPath, 'app', 'api');
    if (!fs.existsSync(apiPath)) return;
    
    const apiFiles = this.getFiles(apiPath, '.ts');
    
    for (const file of apiFiles) {
      const source = fs.readFileSync(file, 'utf-8');
      
      // Check for request validation
      const hasRequestValidation = source.includes('.parse(') && 
                                  (source.includes('req.json()') || source.includes('request.json()'));
      
      // Check for response validation
      const hasResponseValidation = source.includes('NextResponse.json(') && source.includes('.parse(');
      
      if (!hasRequestValidation) {
        this.issues.push({
          type: 'untyped-api',
          severity: 'critical',
          file,
          message: 'API route missing request validation',
          suggestion: 'Use RequestSchema.parse(await req.json())'
        });
      }
      
      if (!hasResponseValidation) {
        this.warnings.push({
          type: 'untyped-api',
          severity: 'warning',
          file,
          message: 'API route missing response validation',
          suggestion: 'Use ResponseSchema.parse(data) before returning'
        });
      }
    }
  }

  // Removed duplicate - using the one with RegistryValidator

  private async validateCacheInvalidation() {
    const hooksPath = path.join(this.projectPath, 'src', 'hooks');
    if (!fs.existsSync(hooksPath)) return;
    
    const hookFiles = this.getFiles(hooksPath, '.ts');
    
    for (const file of hookFiles) {
      const source = fs.readFileSync(file, 'utf-8');
      
      // Check mutations for cache invalidation
      if (source.includes('useMutation')) {
        const hasInvalidation = source.includes('invalidateQueries') || 
                               source.includes('setQueryData') ||
                               source.includes('refetch');
        
        if (!hasInvalidation) {
          this.issues.push({
            type: 'no-cache-invalidation',
            severity: 'critical',
            file,
            message: 'Mutation missing cache invalidation',
            suggestion: 'Add queryClient.invalidateQueries() in onSuccess'
          });
        }
      }
    }
  }

  private async validateFormValidation() {
    const componentsPath = path.join(this.projectPath, 'src', 'components');
    const appPath = path.join(this.projectPath, 'app');
    
    const files = [
      ...this.getFiles(componentsPath, '.tsx'),
      ...this.getFiles(appPath, '.tsx')
    ];
    
    for (const file of files) {
      const source = fs.readFileSync(file, 'utf-8');
      
      // Check forms for validation
      if (source.includes('<form') || source.includes('useForm')) {
        const hasValidation = source.includes('zodResolver') || 
                            source.includes('validate') ||
                            source.includes('rules');
        
        if (!hasValidation) {
          this.warnings.push({
            type: 'missing-validation',
            severity: 'warning',
            file,
            message: 'Form missing validation',
            suggestion: 'Use zodResolver with useForm for client validation'
          });
        }
      }
    }
  }

  private async validateRegistriesWithValidator() {
    const registryValidator = new RegistryValidator(this.projectPath);
    const validation = await registryValidator.validate();
    
    // Add issues from registry validation
    if (!validation.registries.routes.found) {
      this.warnings.push({
        type: 'missing-registry',
        severity: 'warning',
        file: 'src/constants/routes.ts',
        message: 'No Routes registry found',
        suggestion: 'Create a Routes constant to prevent hardcoded URLs'
      });
    }
    
    if (!validation.registries.queryKeys.found) {
      this.warnings.push({
        type: 'missing-registry',
        severity: 'warning',
        file: 'src/constants/queryKeys.ts',
        message: 'No QueryKeys registry found',
        suggestion: 'Create QueryKeys for consistent cache management'
      });
    }
    
    // Add issues for hardcoded values
    validation.usage.invalid.forEach(usage => {
      this.issues.push({
        type: 'missing-registry',
        severity: 'critical',
        file: usage.file,
        line: usage.line,
        message: `Hardcoded value: ${usage.value}`,
        suggestion: usage.suggestion || 'Use registry constant instead'
      });
    });
    
    // Add typo warnings
    validation.usage.typos.forEach(typo => {
      this.warnings.push({
        type: 'missing-registry',
        severity: 'warning',
        file: typo.file,
        line: typo.line,
        message: `Possible typo: "${typo.found}"`,
        suggestion: `Did you mean "${typo.suggestion}"?`
      });
    });
    
    // Add passed checks
    if (validation.registries.routes.found) {
      this.passed.push({
        type: 'registry',
        file: validation.registries.routes.file || '',
        status: 'passed',
        message: '✅ Routes registry found'
      });
    }
    
    if (validation.registries.queryKeys.found) {
      this.passed.push({
        type: 'registry',
        file: validation.registries.queryKeys.file || '',
        status: 'passed',
        message: '✅ QueryKeys registry found'
      });
    }
    
    return validation;
  }

  private async validateAuthGuards() {
    const adminPath = path.join(this.projectPath, 'app', 'admin');
    const dashboardPath = path.join(this.projectPath, 'app', 'dashboard');
    
    const protectedPaths = [adminPath, dashboardPath].filter(fs.existsSync);
    
    for (const protPath of protectedPaths) {
      const files = this.getFiles(protPath, '.tsx');
      
      for (const file of files) {
        const source = fs.readFileSync(file, 'utf-8');
        
        const hasAuthGuard = source.includes('withAuth') || 
                           source.includes('useAuth') ||
                           source.includes('getServerSession') ||
                           source.includes('middleware');
        
        if (!hasAuthGuard) {
          this.issues.push({
            type: 'no-auth-guard',
            severity: 'critical',
            file,
            message: 'Protected route missing auth guard',
            suggestion: 'Add auth middleware or withAuth wrapper'
          });
        }
      }
    }
  }

  private async validateCompleteChains(): Promise<ChainValidation[]> {
    const chains: ChainValidation[] = [];
    
    // Find all types
    const typesPath = path.join(this.projectPath, 'src', 'types');
    if (!fs.existsSync(typesPath)) return chains;
    
    const typeFiles = this.getFiles(typesPath, '.ts');
    
    for (const typeFile of typeFiles) {
      const entityName = path.basename(typeFile, '.ts');
      const chain: ChainValidation = {
        entity: entityName,
        steps: {
          type: true, // Found the type file
          db: false,
          hook: false,
          component: false,
          page: false,
          api: false
        },
        complete: false,
        issues: []
      };
      
      // Check for DB query
      const dbPath = path.join(this.projectPath, 'src', 'lib', 'db');
      if (fs.existsSync(dbPath)) {
        const dbFiles = this.getFiles(dbPath, '.ts');
        chain.steps.db = dbFiles.some(f => f.toLowerCase().includes(entityName.toLowerCase()));
        if (!chain.steps.db) {
          chain.issues.push(`Missing DB queries for ${entityName}`);
        }
      }
      
      // Check for hook
      const hooksPath = path.join(this.projectPath, 'src', 'hooks');
      if (fs.existsSync(hooksPath)) {
        const hookFiles = this.getFiles(hooksPath, '.ts');
        chain.steps.hook = hookFiles.some(f => f.toLowerCase().includes(entityName.toLowerCase()));
        if (!chain.steps.hook) {
          chain.issues.push(`Missing hook for ${entityName}`);
        }
      }
      
      // Check for component
      const componentsPath = path.join(this.projectPath, 'src', 'components');
      if (fs.existsSync(componentsPath)) {
        const componentFiles = this.getFiles(componentsPath, '.tsx');
        chain.steps.component = componentFiles.some(f => f.toLowerCase().includes(entityName.toLowerCase()));
      }
      
      // Check if chain is complete
      chain.complete = chain.steps.type && chain.steps.db && chain.steps.hook;
      
      chains.push(chain);
    }
    
    return chains;
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
}