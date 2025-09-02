/**
 * 9 Core Validation Rules for AI-Generated Code
 * Detects drift and issues in existing codebases
 */

import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';

export interface ValidationResult {
  rule: string;
  ruleNumber: number;
  status: 'pass' | 'fail' | 'warning';
  score: number; // 0-100
  issues: ValidationIssue[];
  coverage: {
    checked: number;
    passed: number;
    total: number;
  };
}

export interface ValidationIssue {
  severity: 'critical' | 'warning' | 'info';
  file: string;
  line?: number;
  message: string;
  suggestion: string;
  codeSnippet?: string;
}

export interface ValidationSummary {
  overallScore: number;
  passedRules: number;
  totalRules: number;
  criticalIssues: number;
  warnings: number;
  results: ValidationResult[];
  metrics: {
    contractCoverage: number;
    parseCoverage: number;
    dbDriftScore: number;
    cacheHygiene: number;
    authCoverage: number;
  };
}

export class NineRulesValidator {
  private projectPath: string;
  private program: ts.Program;
  private checker: ts.TypeChecker;
  private results: ValidationResult[] = [];

  constructor(projectPath: string) {
    this.projectPath = projectPath;
    const configPath = ts.findConfigFile(projectPath, ts.sys.fileExists, 'tsconfig.json');
    if (configPath) {
      const { config } = ts.readConfigFile(configPath, ts.sys.readFile);
      const { options, fileNames } = ts.parseJsonConfigFileContent(
        config,
        ts.sys,
        projectPath
      );
      this.program = ts.createProgram(fileNames, options);
      this.checker = this.program.getTypeChecker();
    } else {
      // Fallback to basic program
      this.program = ts.createProgram([], {});
      this.checker = this.program.getTypeChecker();
    }
  }

  async validateAll(): Promise<ValidationSummary> {
    console.log('🔍 Running 9 Core Validation Rules...\n');

    // Run all 9 validation rules
    await this.rule1_TypeDatabaseAlignment();
    await this.rule2_HookDatabasePattern();
    await this.rule3_ErrorHandlingChain();
    await this.rule4_LoadingStates();
    await this.rule5_APITypeSafety();
    await this.rule6_RegistryUsage();
    await this.rule7_MutationHygiene();
    await this.rule8_FormValidation();
    await this.rule9_AuthGuardMatrix();

    return this.generateSummary();
  }

  /**
   * Rule 1: Type-Database Alignment (30% of bugs)
   * Two-way checking: Zod ↔ DB
   */
  private async rule1_TypeDatabaseAlignment(): Promise<void> {
    const result: ValidationResult = {
      rule: 'Type-Database Alignment',
      ruleNumber: 1,
      status: 'pass',
      score: 100,
      issues: [],
      coverage: { checked: 0, passed: 0, total: 0 }
    };

    // Find all Zod schemas
    const schemaFiles = this.findFiles('**/*.schema.ts', '**/*.contract.ts');
    const dbFiles = this.findFiles('**/db/**/*.ts', '**/database/**/*.ts');
    
    for (const schemaFile of schemaFiles) {
      result.coverage.total++;
      result.coverage.checked++;
      
      const schemaContent = fs.readFileSync(schemaFile, 'utf-8');
      const schemaName = path.basename(schemaFile, '.ts').replace('.schema', '').replace('.contract', '');
      
      // Check if schema is used with .parse() in DB files
      let hasProperParsing = false;
      for (const dbFile of dbFiles) {
        const dbContent = fs.readFileSync(dbFile, 'utf-8');
        
        // Check for proper parsing patterns
        const parsePatterns = [
          `${schemaName}Schema.parse`,
          `${schemaName}.parse`,
          `z.object\\(.*${schemaName}`,
        ];
        
        if (parsePatterns.some(pattern => new RegExp(pattern, 'i').test(dbContent))) {
          hasProperParsing = true;
          result.coverage.passed++;
          break;
        }
      }
      
      if (!hasProperParsing) {
        result.issues.push({
          severity: 'critical',
          file: schemaFile,
          message: `Schema '${schemaName}' not used with .parse() in database layer`,
          suggestion: `Add ${schemaName}Schema.parse(data) when fetching from database`,
        });
      }
    }

    // Check for DB queries without schema validation
    for (const dbFile of dbFiles) {
      const dbContent = fs.readFileSync(dbFile, 'utf-8');
      
      // Pattern for DB queries without parse
      const queryPatterns = [
        /from\(['"`](\w+)['"`]\)(?![\s\S]*\.parse)/g,
        /\.select\(\)(?![\s\S]*\.parse)/g,
        /\.insert\([^)]+\)(?![\s\S]*\.parse)/g,
      ];
      
      for (const pattern of queryPatterns) {
        const matches = dbContent.match(pattern);
        if (matches) {
          result.issues.push({
            severity: 'critical',
            file: dbFile,
            message: 'Database query without schema validation',
            suggestion: 'Add .parse() after database operations',
            codeSnippet: matches[0]
          });
        }
      }
    }

    result.score = this.calculateScore(result.coverage);
    result.status = result.score >= 80 ? 'pass' : result.score >= 50 ? 'warning' : 'fail';
    this.results.push(result);
  }

  /**
   * Rule 2: Hook-Database Pattern (25% of bugs)
   * Component → Hook → DB (never direct)
   */
  private async rule2_HookDatabasePattern(): Promise<void> {
    const result: ValidationResult = {
      rule: 'Hook-Database Pattern',
      ruleNumber: 2,
      status: 'pass',
      score: 100,
      issues: [],
      coverage: { checked: 0, passed: 0, total: 0 }
    };

    const componentFiles = this.findFiles('**/components/**/*.tsx', '**/app/**/*.tsx');
    const hookFiles = this.findFiles('**/hooks/**/*.ts', '**/hooks/**/*.tsx');
    
    // Check components for direct DB access
    for (const componentFile of componentFiles) {
      result.coverage.total++;
      result.coverage.checked++;
      
      const content = fs.readFileSync(componentFile, 'utf-8');
      
      // Patterns indicating direct DB access
      const dbPatterns = [
        /from ['"].*\/db/,
        /from ['"].*\/database/,
        /import.*supabase/i,
        /import.*prisma/i,
        /\.from\(['"`]/,
      ];
      
      const hasDirectDBAccess = dbPatterns.some(pattern => pattern.test(content));
      
      if (hasDirectDBAccess) {
        result.issues.push({
          severity: 'critical',
          file: componentFile,
          message: 'Component has direct database access',
          suggestion: 'Components should use hooks for data fetching, not direct DB calls'
        });
      } else {
        result.coverage.passed++;
      }
    }

    // Check if hooks properly wrap DB calls
    for (const hookFile of hookFiles) {
      const content = fs.readFileSync(hookFile, 'utf-8');
      
      // Check if hook imports from DB layer
      const hasDBImport = /from ['"].*\/(db|database)/.test(content);
      const hasUsePrefix = /export.*use[A-Z]/.test(content);
      
      if (hasDBImport && !hasUsePrefix) {
        result.issues.push({
          severity: 'warning',
          file: hookFile,
          message: 'DB access not properly wrapped in a hook',
          suggestion: 'Export a hook function starting with "use"'
        });
      }
    }

    result.score = this.calculateScore(result.coverage);
    result.status = result.score >= 80 ? 'pass' : result.score >= 50 ? 'warning' : 'fail';
    this.results.push(result);
  }

  /**
   * Rule 3: Error Handling Chain (20% of bugs)
   */
  private async rule3_ErrorHandlingChain(): Promise<void> {
    const result: ValidationResult = {
      rule: 'Error Handling Chain',
      ruleNumber: 3,
      status: 'pass',
      score: 100,
      issues: [],
      coverage: { checked: 0, passed: 0, total: 0 }
    };

    // Check DB layer for try-catch
    const dbFiles = this.findFiles('**/db/**/*.ts', '**/database/**/*.ts');
    for (const file of dbFiles) {
      result.coverage.total++;
      result.coverage.checked++;
      
      const content = fs.readFileSync(file, 'utf-8');
      const hasTryCatch = /try\s*{[\s\S]*?}\s*catch/g.test(content);
      const hasAsyncFunction = /async\s+function|async\s*\(/g.test(content);
      
      if (hasAsyncFunction && !hasTryCatch) {
        result.issues.push({
          severity: 'critical',
          file,
          message: 'Async database function without try-catch',
          suggestion: 'Wrap database operations in try-catch blocks'
        });
      } else {
        result.coverage.passed++;
      }
    }

    // Check hooks for error state
    const hookFiles = this.findFiles('**/hooks/**/*.ts', '**/hooks/**/*.tsx');
    for (const file of hookFiles) {
      result.coverage.total++;
      result.coverage.checked++;
      
      const content = fs.readFileSync(file, 'utf-8');
      const hasErrorState = /error|Error|isError|hasError/g.test(content);
      const hasUseState = /useState|useQuery|useMutation/g.test(content);
      
      if (hasUseState && !hasErrorState) {
        result.issues.push({
          severity: 'warning',
          file,
          message: 'Hook missing error state management',
          suggestion: 'Add error state: const [error, setError] = useState(null)'
        });
      } else {
        result.coverage.passed++;
      }
    }

    // Check components for error UI
    const componentFiles = this.findFiles('**/components/**/*.tsx');
    for (const file of componentFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const usesHook = /use[A-Z]\w+\(/g.test(content);
      const hasErrorUI = /\{error\s*&&|error\s*\?|<Error/g.test(content);
      
      if (usesHook && !hasErrorUI) {
        result.coverage.total++;
        result.coverage.checked++;
        result.issues.push({
          severity: 'warning',
          file,
          message: 'Component missing error UI handling',
          suggestion: 'Add {error && <ErrorMessage />} to handle errors'
        });
      }
    }

    result.score = this.calculateScore(result.coverage);
    result.status = result.score >= 80 ? 'pass' : result.score >= 50 ? 'warning' : 'fail';
    this.results.push(result);
  }

  /**
   * Rule 4: Loading States (15% of bugs)
   */
  private async rule4_LoadingStates(): Promise<void> {
    const result: ValidationResult = {
      rule: 'Loading States',
      ruleNumber: 4,
      status: 'pass',
      score: 100,
      issues: [],
      coverage: { checked: 0, passed: 0, total: 0 }
    };

    // Check hooks for loading state
    const hookFiles = this.findFiles('**/hooks/**/*.ts', '**/hooks/**/*.tsx');
    for (const file of hookFiles) {
      result.coverage.total++;
      result.coverage.checked++;
      
      const content = fs.readFileSync(file, 'utf-8');
      const hasLoadingState = /loading|Loading|isLoading|isPending|isFetching/gi.test(content);
      const hasAsyncOperation = /useQuery|useMutation|fetch|axios/gi.test(content);
      
      if (hasAsyncOperation && !hasLoadingState) {
        result.issues.push({
          severity: 'warning',
          file,
          message: 'Hook with async operation missing loading state',
          suggestion: 'Add isLoading or isPending state'
        });
      } else {
        result.coverage.passed++;
      }
    }

    // Check components for loading UI
    const componentFiles = this.findFiles('**/components/**/*.tsx', '**/app/**/*.tsx');
    for (const file of componentFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const usesAsyncHook = /use\w*(Query|Mutation|Fetch)/g.test(content);
      const hasLoadingUI = /\{.*loading.*\?|<.*Skeleton|<.*Spinner|<.*Loading/gi.test(content);
      
      if (usesAsyncHook && !hasLoadingUI) {
        result.coverage.total++;
        result.coverage.checked++;
        result.issues.push({
          severity: 'warning',
          file,
          message: 'Component missing loading UI',
          suggestion: 'Add {isLoading && <Skeleton />} or similar loading state'
        });
      }
    }

    result.score = this.calculateScore(result.coverage);
    result.status = result.score >= 80 ? 'pass' : result.score >= 50 ? 'warning' : 'fail';
    this.results.push(result);
  }

  /**
   * Rule 5: API Type Safety (10% of bugs)
   */
  private async rule5_APITypeSafety(): Promise<void> {
    const result: ValidationResult = {
      rule: 'API Type Safety',
      ruleNumber: 5,
      status: 'pass',
      score: 100,
      issues: [],
      coverage: { checked: 0, passed: 0, total: 0 }
    };

    // Check API routes
    const apiFiles = this.findFiles('**/api/**/*.ts', '**/api/**/*.tsx');
    
    for (const file of apiFiles) {
      result.coverage.total++;
      result.coverage.checked++;
      
      const content = fs.readFileSync(file, 'utf-8');
      
      // Check for request validation
      const hasRequestParse = /\.parse\(.*req\.body|\.parse\(.*request\.json/gi.test(content);
      const hasPostOrPut = /export.*POST|export.*PUT|export.*PATCH/gi.test(content);
      
      if (hasPostOrPut && !hasRequestParse) {
        result.issues.push({
          severity: 'critical',
          file,
          message: 'API endpoint missing request validation',
          suggestion: 'Add RequestSchema.parse(req.body) to validate input'
        });
      } else if (hasPostOrPut) {
        result.coverage.passed++;
      }
      
      // Check for response validation
      const hasResponseParse = /return.*\.parse\(|Response\.json\(.*\.parse/gi.test(content);
      const returnsData = /return.*Response|return.*res\./gi.test(content);
      
      if (returnsData && !hasResponseParse) {
        result.issues.push({
          severity: 'warning',
          file,
          message: 'API endpoint missing response validation',
          suggestion: 'Validate response with ResponseSchema.parse(data) before returning'
        });
      }
    }

    result.score = this.calculateScore(result.coverage);
    result.status = result.score >= 80 ? 'pass' : result.score >= 50 ? 'warning' : 'fail';
    this.results.push(result);
  }

  /**
   * Rule 6: Registry Usage - No Raw Strings
   */
  private async rule6_RegistryUsage(): Promise<void> {
    const result: ValidationResult = {
      rule: 'Registry Usage (No Raw Strings)',
      ruleNumber: 6,
      status: 'pass',
      score: 100,
      issues: [],
      coverage: { checked: 0, passed: 0, total: 0 }
    };

    const allTsFiles = this.findFiles('**/*.ts', '**/*.tsx');
    
    for (const file of allTsFiles) {
      // Skip node_modules and .next
      if (file.includes('node_modules') || file.includes('.next')) continue;
      
      const content = fs.readFileSync(file, 'utf-8');
      
      // Check for raw route strings
      const rawRoutes = content.match(/['"`]\/(?!\/)[a-zA-Z][^'"`]*['"`]/g);
      if (rawRoutes) {
        result.coverage.total += rawRoutes.length;
        result.coverage.checked += rawRoutes.length;
        
        rawRoutes.forEach(route => {
          // Skip imports and certain patterns
          if (!route.includes('import') && !route.includes('require')) {
            result.issues.push({
              severity: 'warning',
              file,
              message: `Raw route string found: ${route}`,
              suggestion: 'Use Routes.routeName from constants/registry',
              codeSnippet: route
            });
          } else {
            result.coverage.passed++;
          }
        });
      }
      
      // Check for raw query keys
      const rawQueryKeys = content.match(/\[['"`]\w+['"`]\]/g);
      if (rawQueryKeys) {
        result.coverage.total += rawQueryKeys.length;
        result.coverage.checked += rawQueryKeys.length;
        
        rawQueryKeys.forEach(key => {
          result.issues.push({
            severity: 'warning',
            file,
            message: `Raw query key found: ${key}`,
            suggestion: 'Use QueryKeys.keyName() from constants/registry',
            codeSnippet: key
          });
        });
      }
    }

    result.score = this.calculateScore(result.coverage);
    result.status = result.score >= 80 ? 'pass' : result.score >= 50 ? 'warning' : 'fail';
    this.results.push(result);
  }

  /**
   * Rule 7: Mutation Hygiene
   */
  private async rule7_MutationHygiene(): Promise<void> {
    const result: ValidationResult = {
      rule: 'Mutation Hygiene',
      ruleNumber: 7,
      status: 'pass',
      score: 100,
      issues: [],
      coverage: { checked: 0, passed: 0, total: 0 }
    };

    const hookFiles = this.findFiles('**/hooks/**/*.ts', '**/hooks/**/*.tsx');
    
    for (const file of hookFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      
      if (content.includes('useMutation')) {
        result.coverage.total++;
        result.coverage.checked++;
        
        const hasInvalidation = /invalidateQueries|setQueryData|refetch/gi.test(content);
        const hasOptimisticUpdate = /optimisticUpdate|onMutate.*setQueryData/gi.test(content);
        const hasRollback = hasOptimisticUpdate ? /onError.*setQueryData/gi.test(content) : true;
        
        if (!hasInvalidation) {
          result.issues.push({
            severity: 'critical',
            file,
            message: 'Mutation missing cache invalidation',
            suggestion: 'Add queryClient.invalidateQueries() in onSuccess callback'
          });
        } else {
          result.coverage.passed++;
        }
        
        if (hasOptimisticUpdate && !hasRollback) {
          result.issues.push({
            severity: 'warning',
            file,
            message: 'Optimistic update without rollback',
            suggestion: 'Add rollback logic in onError callback'
          });
        }
      }
    }

    result.score = this.calculateScore(result.coverage);
    result.status = result.score >= 80 ? 'pass' : result.score >= 50 ? 'warning' : 'fail';
    this.results.push(result);
  }

  /**
   * Rule 8: Form Validation (Both Sides)
   */
  private async rule8_FormValidation(): Promise<void> {
    const result: ValidationResult = {
      rule: 'Form Validation (Both Sides)',
      ruleNumber: 8,
      status: 'pass',
      score: 100,
      issues: [],
      coverage: { checked: 0, passed: 0, total: 0 }
    };

    // Check client-side forms
    const formFiles = this.findFiles('**/components/**/*.tsx', '**/app/**/*.tsx');
    
    for (const file of formFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      
      if (content.includes('<form') || content.includes('useForm')) {
        result.coverage.total++;
        result.coverage.checked++;
        
        const hasZodResolver = /zodResolver|yupResolver/gi.test(content);
        const hasValidation = /validate|validation|rules/gi.test(content);
        
        if (!hasZodResolver && !hasValidation) {
          result.issues.push({
            severity: 'warning',
            file,
            message: 'Form without client-side validation',
            suggestion: 'Use useForm({ resolver: zodResolver(Schema) })'
          });
        } else {
          result.coverage.passed++;
        }
      }
    }

    // Check server-side validation in API routes
    const apiFiles = this.findFiles('**/api/**/*.ts');
    
    for (const file of apiFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      
      if (/POST|PUT|PATCH/gi.test(content)) {
        const hasServerValidation = /\.parse\(|\.safeParse\(/gi.test(content);
        
        if (!hasServerValidation) {
          result.issues.push({
            severity: 'critical',
            file,
            message: 'API endpoint without server-side validation',
            suggestion: 'Add Schema.parse(req.body) before processing'
          });
        }
      }
    }

    result.score = this.calculateScore(result.coverage);
    result.status = result.score >= 80 ? 'pass' : result.score >= 50 ? 'warning' : 'fail';
    this.results.push(result);
  }

  /**
   * Rule 9: Auth Guard Matrix
   */
  private async rule9_AuthGuardMatrix(): Promise<void> {
    const result: ValidationResult = {
      rule: 'Auth Guard Matrix',
      ruleNumber: 9,
      status: 'pass',
      score: 100,
      issues: [],
      coverage: { checked: 0, passed: 0, total: 0 }
    };

    // Define protected route patterns
    const protectedRoutePatterns = [
      'admin', 'dashboard', 'settings', 'profile', 'account',
      'billing', 'subscription', 'api/admin', 'api/user'
    ];

    // Check page routes for auth guards
    const pageFiles = this.findFiles('**/app/**/page.tsx', '**/pages/**/*.tsx');
    
    for (const file of pageFiles) {
      const routePath = file.toLowerCase();
      const isProtected = protectedRoutePatterns.some(pattern => routePath.includes(pattern));
      
      if (isProtected) {
        result.coverage.total++;
        result.coverage.checked++;
        
        const content = fs.readFileSync(file, 'utf-8');
        const hasAuthGuard = /withAuth|requireAuth|useAuth|getServerSession|middleware/gi.test(content);
        
        if (!hasAuthGuard) {
          result.issues.push({
            severity: 'critical',
            file,
            message: 'Protected route without auth guard',
            suggestion: 'Wrap component with withAuth() or add auth check'
          });
        } else {
          result.coverage.passed++;
        }
      }
    }

    // Check API routes for auth
    const apiFiles = this.findFiles('**/api/**/*.ts');
    
    for (const file of apiFiles) {
      const routePath = file.toLowerCase();
      const isProtected = protectedRoutePatterns.some(pattern => routePath.includes(pattern));
      
      if (isProtected) {
        result.coverage.total++;
        result.coverage.checked++;
        
        const content = fs.readFileSync(file, 'utf-8');
        const hasAuthCheck = /verifyAuth|getSession|verifyToken|isAuthenticated/gi.test(content);
        
        if (!hasAuthCheck) {
          result.issues.push({
            severity: 'critical',
            file,
            message: 'Protected API endpoint without auth verification',
            suggestion: 'Add verifyAuth() or session check at the beginning'
          });
        } else {
          result.coverage.passed++;
        }
      }
    }

    result.score = this.calculateScore(result.coverage);
    result.status = result.score >= 80 ? 'pass' : result.score >= 50 ? 'warning' : 'fail';
    this.results.push(result);
  }

  /**
   * Helper Methods
   */
  private findFiles(...patterns: string[]): string[] {
    const files: string[] = [];
    const searchDirs = ['src', 'app', 'pages', 'components', 'lib', 'hooks', 'api'];
    
    for (const dir of searchDirs) {
      const dirPath = path.join(this.projectPath, dir);
      if (fs.existsSync(dirPath)) {
        files.push(...this.getFilesRecursive(dirPath, patterns));
      }
    }
    
    return files;
  }

  private getFilesRecursive(dir: string, patterns: string[]): string[] {
    const files: string[] = [];
    
    if (!fs.existsSync(dir)) return files;
    
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      
      if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
        files.push(...this.getFilesRecursive(fullPath, patterns));
      } else if (item.isFile()) {
        // Check if file matches any pattern
        const matches = patterns.some(pattern => {
          // Simple pattern matching
          if (pattern.includes('**')) {
            const ext = pattern.split('**')[1];
            return fullPath.endsWith(ext);
          }
          return fullPath.includes(pattern.replace('**/', ''));
        });
        
        if (matches) {
          files.push(fullPath);
        }
      }
    }
    
    return files;
  }

  private calculateScore(coverage: { checked: number; passed: number; total: number }): number {
    if (coverage.total === 0) return 100; // No items to check = pass
    return Math.round((coverage.passed / coverage.total) * 100);
  }

  private generateSummary(): ValidationSummary {
    const criticalIssues = this.results.reduce((sum, r) => 
      sum + r.issues.filter(i => i.severity === 'critical').length, 0);
    const warnings = this.results.reduce((sum, r) => 
      sum + r.issues.filter(i => i.severity === 'warning').length, 0);
    const passedRules = this.results.filter(r => r.status === 'pass').length;
    
    const overallScore = Math.round(
      this.results.reduce((sum, r) => sum + r.score, 0) / this.results.length
    );

    // Calculate specific metrics
    const metrics = {
      contractCoverage: this.results[0]?.score || 0, // Rule 1
      parseCoverage: (this.results[0]?.score || 0 + this.results[4]?.score || 0) / 2, // Rules 1 & 5
      dbDriftScore: this.results[0]?.score || 0, // Rule 1
      cacheHygiene: this.results[6]?.score || 0, // Rule 7
      authCoverage: this.results[8]?.score || 0, // Rule 9
    };

    return {
      overallScore,
      passedRules,
      totalRules: 9,
      criticalIssues,
      warnings,
      results: this.results,
      metrics
    };
  }

  /**
   * Generate actionable report
   */
  generateReport(summary: ValidationSummary): string {
    let report = '# 🔍 AI Observer - 9 Rules Validation Report\n\n';
    
    // Overall health
    const grade = summary.overallScore >= 90 ? 'A' :
                  summary.overallScore >= 80 ? 'B' :
                  summary.overallScore >= 70 ? 'C' :
                  summary.overallScore >= 60 ? 'D' : 'F';
    
    report += `## Overall Health: ${grade} (${summary.overallScore}%)\n\n`;
    report += `- ✅ Passed Rules: ${summary.passedRules}/9\n`;
    report += `- ❌ Critical Issues: ${summary.criticalIssues}\n`;
    report += `- ⚠️  Warnings: ${summary.warnings}\n\n`;
    
    // Key metrics
    report += '## Key Metrics\n\n';
    report += `- Contract Coverage: ${summary.metrics.contractCoverage}%\n`;
    report += `- Parse Coverage: ${summary.metrics.parseCoverage}%\n`;
    report += `- DB Drift Score: ${summary.metrics.dbDriftScore}%\n`;
    report += `- Cache Hygiene: ${summary.metrics.cacheHygiene}%\n`;
    report += `- Auth Coverage: ${summary.metrics.authCoverage}%\n\n`;
    
    // Detailed results
    report += '## Detailed Results\n\n';
    for (const result of summary.results) {
      const icon = result.status === 'pass' ? '✅' :
                   result.status === 'warning' ? '⚠️' : '❌';
      
      report += `### ${icon} Rule ${result.ruleNumber}: ${result.rule}\n`;
      report += `Score: ${result.score}% | Issues: ${result.issues.length}\n\n`;
      
      if (result.issues.length > 0) {
        report += 'Issues found:\n';
        result.issues.slice(0, 5).forEach(issue => {
          report += `- **${issue.severity}**: ${issue.message}\n`;
          report += `  File: ${issue.file}\n`;
          report += `  Fix: ${issue.suggestion}\n`;
        });
        
        if (result.issues.length > 5) {
          report += `\n...and ${result.issues.length - 5} more issues\n`;
        }
        report += '\n';
      }
    }
    
    // Action items
    report += '## 🎯 Priority Actions\n\n';
    const criticalResults = summary.results
      .filter(r => r.issues.some(i => i.severity === 'critical'))
      .sort((a, b) => a.score - b.score);
    
    if (criticalResults.length > 0) {
      report += '1. **Fix Critical Issues First:**\n';
      criticalResults.slice(0, 3).forEach(r => {
        report += `   - ${r.rule}: ${r.issues.filter(i => i.severity === 'critical').length} critical issues\n`;
      });
    }
    
    return report;
  }
}

// Export for CLI usage
export async function runValidation(projectPath?: string): Promise<void> {
  const validator = new NineRulesValidator(projectPath || process.cwd());
  const summary = await validator.validateAll();
  const report = validator.generateReport(summary);
  
  console.log(report);
  
  // Save report
  const reportPath = path.join(projectPath || process.cwd(), '.observer', 'validation-report.md');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, report);
  
  console.log(`\n📊 Report saved to: ${reportPath}`);
  
  // Exit with error if score is too low
  if (summary.overallScore < 60) {
    console.error('\n❌ Validation failed! Score below 60%');
    process.exit(1);
  }
}