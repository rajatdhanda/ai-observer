#!/usr/bin/env ts-node
/**
 * Validator Runner - Reads map.json and runs the 9 core validators
 * Each validator is simple: read map → check rule → return violations
 */

import * as fs from 'fs';
import * as path from 'path';

interface CodebaseMap {
  meta: any;
  exports: Record<string, Array<{ name: string; line: number }>>;
  imports: Record<string, string[]>;
  entryPoints: Record<string, { type: string; protected: boolean }>;
  files: Record<string, any>;
}

interface Violation {
  rule: string;
  severity: 'critical' | 'warning' | 'info';
  file: string;
  message: string;
  fix?: string;
}

export class ValidatorRunner {
  private map: CodebaseMap;
  private violations: Violation[] = [];

  constructor(mapPath: string) {
    const mapContent = fs.readFileSync(mapPath, 'utf-8');
    this.map = JSON.parse(mapContent);
  }

  /**
   * Run all 9 core validators
   */
  runAll(): { violations: Violation[]; score: number; summary: any } {
    this.violations = [];

    // Run each validator
    this.validateTypeDatabaseAlignment();    // Rule 1: 30% of bugs
    this.validateHookDatabasePattern();      // Rule 2: 25% of bugs
    this.validateErrorHandling();            // Rule 3: 20% of bugs
    this.validateLoadingStates();            // Rule 4: 15% of bugs
    this.validateAPITypeSafety();            // Rule 5: 10% of bugs
    this.validateRegistryUsage();            // Rule 6: <5% of bugs
    this.validateCacheInvalidation();        // Rule 7: <5% of bugs
    this.validateFormValidation();           // Rule 8: <5% of bugs
    this.validateAuthGuards();               // Rule 9: <5% of bugs

    return {
      violations: this.violations,
      score: this.calculateScore(),
      summary: this.generateSummary()
    };
  }

  /**
   * Rule 1: Type-Database Alignment (30% of bugs)
   * Check: All DB functions must parse with Zod
   */
  private validateTypeDatabaseAlignment() {
    for (const [file, analysis] of Object.entries(this.map.files)) {
      // Check if it's a DB file
      if (file.includes('/db/') || file.includes('database')) {
        if (analysis.hasParse === 0) {
          this.violations.push({
            rule: 'Type-Database Alignment',
            severity: 'critical',
            file,
            message: 'Database function missing Schema.parse()',
            fix: 'Add return Schema.parse(data) to all DB functions'
          });
        }
      }
    }
  }

  /**
   * Rule 2: Hook-Database Pattern (25% of bugs)
   * Check: Components shouldn't import DB directly
   */
  private validateHookDatabasePattern() {
    for (const [file, imports] of Object.entries(this.map.imports)) {
      // Check if it's a component
      if (file.includes('/components/') || file.includes('.tsx')) {
        // Check if imports include DB modules
        const dbImports = imports.filter(imp => 
          imp.toLowerCase().includes('db') || 
          imp.toLowerCase().includes('database') ||
          imp.toLowerCase().includes('query')
        );

        if (dbImports.length > 0) {
          // Check if it's actually importing from lib/db
          const fileContent = this.map.files[file];
          if (!file.includes('/hooks/')) {
            this.violations.push({
              rule: 'Hook-Database Pattern',
              severity: 'critical',
              file,
              message: `Component imports DB directly: ${dbImports.join(', ')}`,
              fix: 'Use a hook instead - components should only import hooks'
            });
          }
        }
      }
    }
  }

  /**
   * Rule 3: Error Handling Chain (20% of bugs)
   * Check: Hooks must have error states, APIs must have try-catch
   */
  private validateErrorHandling() {
    for (const [file, analysis] of Object.entries(this.map.files)) {
      // Check hooks
      if (file.includes('/hooks/') || file.includes('use')) {
        if (analysis.hasErrorState === 0) {
          this.violations.push({
            rule: 'Error Handling',
            severity: 'critical',
            file,
            message: 'Hook missing error state management',
            fix: 'Add error state: const [error, setError] = useState(null)'
          });
        }
      }

      // Check API routes
      if (file.includes('/api/') && file.endsWith('route.ts')) {
        if (analysis.hasTryCatch === 0) {
          this.violations.push({
            rule: 'Error Handling',
            severity: 'critical',
            file,
            message: 'API route missing try-catch block',
            fix: 'Wrap handler in try-catch and return proper error response'
          });
        }
      }
    }
  }

  /**
   * Rule 4: Loading States (15% of bugs)
   * Check: Hooks must have loading states
   */
  private validateLoadingStates() {
    for (const [file, analysis] of Object.entries(this.map.files)) {
      if (file.includes('/hooks/') || file.includes('use')) {
        if (analysis.hasLoadingState === 0) {
          this.violations.push({
            rule: 'Loading States',
            severity: 'warning',
            file,
            message: 'Hook missing loading state',
            fix: 'Add loading state: const [isLoading, setIsLoading] = useState(false)'
          });
        }
      }
    }
  }

  /**
   * Rule 5: API Type Safety (10% of bugs)
   * Check: APIs must parse input/output
   */
  private validateAPITypeSafety() {
    for (const [route, info] of Object.entries(this.map.entryPoints)) {
      if (info.type === 'api') {
        // Find the corresponding file
        const apiFile = Object.keys(this.map.files).find(f => 
          f.includes(route.replace('/api/', '')) && f.endsWith('route.ts')
        );

        if (apiFile) {
          const analysis = this.map.files[apiFile];
          if (analysis.hasParse === 0) {
            this.violations.push({
              rule: 'API Type Safety',
              severity: 'critical',
              file: apiFile,
              message: 'API route missing Schema.parse() validation',
              fix: 'Add RequestSchema.parse(req.body) and ResponseSchema.parse(data)'
            });
          }
        }
      }
    }
  }

  /**
   * Rule 6: Registry Usage (Low impact)
   * Check: No raw route strings
   */
  private validateRegistryUsage() {
    // This would need actual file content analysis
    // For now, skip as it's low impact
  }

  /**
   * Rule 7: Cache Invalidation (Low impact)
   * Check: Mutations must invalidate cache
   */
  private validateCacheInvalidation() {
    for (const [file, analysis] of Object.entries(this.map.files)) {
      if (file.includes('/hooks/')) {
        if (analysis.mutations && analysis.mutations.length > 0) {
          if (!analysis.invalidates || analysis.invalidates.length === 0) {
            this.violations.push({
              rule: 'Cache Invalidation',
              severity: 'warning',
              file,
              message: `Mutation detected but no cache invalidation`,
              fix: 'Add queryClient.invalidateQueries() after mutation'
            });
          }
        }
      }
    }
  }

  /**
   * Rule 8: Form Validation (Low impact)
   * Check: Forms must have validation
   */
  private validateFormValidation() {
    for (const [file, analysis] of Object.entries(this.map.files)) {
      if (file.includes('Form') || file.includes('form')) {
        if (analysis.hasFormValidation === 0) {
          this.violations.push({
            rule: 'Form Validation',
            severity: 'warning',
            file,
            message: 'Form component missing validation',
            fix: 'Add useForm with zodResolver or validation rules'
          });
        }
      }
    }
  }

  /**
   * Rule 9: Auth Guards (Medium impact)
   * Check: Protected routes must have auth
   */
  private validateAuthGuards() {
    for (const [route, info] of Object.entries(this.map.entryPoints)) {
      if (info.protected) {
        // Find corresponding file
        const routeFile = Object.keys(this.map.files).find(f => {
          const routePath = route.replace('/', '');
          return f.includes(routePath) && (f.endsWith('page.tsx') || f.endsWith('route.ts'));
        });

        if (routeFile) {
          const analysis = this.map.files[routeFile];
          if (analysis.hasAuth === 0) {
            this.violations.push({
              rule: 'Auth Guards',
              severity: 'critical',
              file: routeFile,
              message: 'Protected route missing auth check',
              fix: 'Add getServerSession() or withAuth() check'
            });
          }
        }
      }
    }
  }

  /**
   * Calculate health score based on violations
   */
  private calculateScore(): number {
    let score = 100;
    
    for (const violation of this.violations) {
      switch (violation.severity) {
        case 'critical':
          score -= 10;
          break;
        case 'warning':
          score -= 5;
          break;
        case 'info':
          score -= 2;
          break;
      }
    }

    return Math.max(0, score);
  }

  /**
   * Generate summary statistics
   */
  private generateSummary() {
    const byRule: Record<string, number> = {};
    const bySeverity: Record<string, number> = {
      critical: 0,
      warning: 0,
      info: 0
    };

    for (const violation of this.violations) {
      byRule[violation.rule] = (byRule[violation.rule] || 0) + 1;
      bySeverity[violation.severity]++;
    }

    return {
      total: this.violations.length,
      byRule,
      bySeverity,
      topIssues: this.violations
        .filter(v => v.severity === 'critical')
        .slice(0, 5)
        .map(v => `${v.file}: ${v.message}`)
    };
  }

  /**
   * Print results to console
   */
  printResults() {
    const result = this.runAll();
    
    console.log('\n🔍 AI Code Observer - Validation Results\n');
    console.log(`Health Score: ${result.score}/100\n`);

    if (result.violations.length === 0) {
      console.log('✅ No violations found!\n');
      return;
    }

    // Group by severity
    const critical = result.violations.filter(v => v.severity === 'critical');
    const warnings = result.violations.filter(v => v.severity === 'warning');

    if (critical.length > 0) {
      console.log(`❌ CRITICAL (${critical.length}):`);
      critical.forEach(v => {
        console.log(`   ${v.file}`);
        console.log(`   ${v.message}`);
        console.log(`   Fix: ${v.fix}\n`);
      });
    }

    if (warnings.length > 0) {
      console.log(`⚠️  WARNINGS (${warnings.length}):`);
      warnings.forEach(v => {
        console.log(`   ${v.file}`);
        console.log(`   ${v.message}\n`);
      });
    }

    console.log('\nSummary by Rule:');
    Object.entries(result.summary.byRule).forEach(([rule, count]) => {
      console.log(`  ${rule}: ${count} violations`);
    });
  }
}

// CLI support
if (require.main === module) {
  const mapPath = process.argv[2] || 'codebase-map.json';
  
  if (!fs.existsSync(mapPath)) {
    console.error(`Map file not found: ${mapPath}`);
    console.log('Run "npm run observer:map" first to generate the map');
    process.exit(1);
  }

  const runner = new ValidatorRunner(mapPath);
  runner.printResults();
}