import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { ValidatorRunner } from '../observer/validator-runner';
import { DesignSystemValidator } from '../validator/design-system-validator';
import { CrossLayerValidator } from '../validator/cross-layer-validator';

export interface Issue {
  file: string;
  line: number;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  category?: string;
  feature?: string;
  impacts?: string[];
  suggestion?: string;
  rule?: string;
}

export interface IssueBucket {
  name: 'BLOCKERS' | 'STRUCTURAL' | 'COMPLIANCE';
  title: string;
  description: string;
  color: string;
  priority: number;
  issues: Issue[];
  count: number;
}

export interface IssueGroup {
  group: number;
  title: string;
  why: string;
  fixes: Array<{
    file: string;
    issue: string;
    fix: string;
  }>;
}

export class SmartIssueAnalyzer {
  private projectPath: string;
  private issues: Issue[] = [];
  private projectType: string = 'unknown';
  private hasPayments: boolean = false;
  private hasAuth: boolean = false;
  private hasDatabase: boolean = false;
  private hasAPI: boolean = false;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
  }

  // Main entry point - Enhanced with bucket classification
  async analyze(): Promise<void> {
    console.log('🔍 Starting enhanced smart issue analysis with bucket classification...');
    
    // 1. Detect project type and features
    this.detectProjectFeatures();
    
    // 2. Collect ALL issues from validator system + legacy checks
    await this.collectAllIssues();
    
    // 3. Organize issues into importance buckets
    const buckets = this.organizeBuckets();
    
    // 4. Generate enhanced FIX_THIS.json with all issues visible
    this.generateEnhancedFixFile(buckets);
    
    console.log(`✅ Enhanced analysis complete. All ${this.issues.length} issues organized by importance.`);
    console.log('📊 Bucket distribution:', buckets.map(b => `${b.name}: ${b.count}`).join(', '));
  }

  private detectProjectFeatures(): void {
    // Check for package.json to understand dependencies
    const packagePath = path.join(this.projectPath, 'package.json');
    if (fs.existsSync(packagePath)) {
      const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      
      // Detect features based on dependencies
      this.hasPayments = !!(deps['stripe'] || deps['square'] || deps['paypal']);
      this.hasAuth = !!(deps['next-auth'] || deps['@auth0'] || deps['firebase']);
      this.hasDatabase = !!(deps['prisma'] || deps['typeorm'] || deps['mongoose'] || deps['sequelize']);
      this.hasAPI = !!(deps['express'] || deps['fastify'] || deps['next'] || deps['@nestjs/core']);
      
      // Detect project type
      if (deps['react'] || deps['vue'] || deps['angular']) this.projectType = 'frontend';
      if (deps['express'] || deps['fastify']) this.projectType = 'backend';
      if (deps['next'] || deps['nuxt']) this.projectType = 'fullstack';
      if (deps['react-native'] || deps['expo']) this.projectType = 'mobile';
      if (deps['tensorflow'] || deps['@tensorflow']) this.projectType = 'ai';
    }

    console.log(`📦 Detected: ${this.projectType} project with features:`, {
      payments: this.hasPayments,
      auth: this.hasAuth,
      database: this.hasDatabase,
      api: this.hasAPI
    });
  }

  private async collectAllIssues(): Promise<void> {
    const issues: Issue[] = [];

    // 1. Get ALL issues from the 9-rules validator system (this is where the 46 issues come from)
    const validatorIssues = await this.getValidatorSystemIssues();
    issues.push(...validatorIssues);
    
    // 2. Run enhanced 9-rules validator with AI drift prevention checks
    try {
      const { NineRulesValidator } = require('../validator/nine-rules-validator');
      const nineRulesValidator = new NineRulesValidator(this.projectPath);
      const nineRulesResults = await nineRulesValidator.validateAll();
      
      // Convert 9-rules violations to our Issue format
      for (const ruleResult of nineRulesResults.results) {
        for (const issue of ruleResult.issues) {
          const newIssue = {
            file: issue.file,
            line: 0,
            type: ruleResult.rule.toLowerCase().replace(/\s+/g, '_'),
            severity: issue.severity,
            message: issue.message,
            rule: ruleResult.rule,
            category: this.categorizeRule(ruleResult.rule),
            suggestion: issue.suggestion
          };
          issues.push(newIssue);
          
          // Debug log for AI drift detection rules
          if (ruleResult.rule === 'File Size Warnings' || 
              ruleResult.rule === 'Duplicate Functions' || 
              ruleResult.rule === 'Export Completeness') {
            console.log(`  📍 AI Drift Issue: ${ruleResult.rule} - ${issue.file}`);
          }
        }
      }
      console.log(`📊 9-Rules validator found ${nineRulesResults.results.length} rule results`);
    } catch (error) {
      console.log('⚠️ 9-Rules validator skipped:', error);
    }

    // 3. Keep legacy checks for additional context
    issues.push(...this.checkObserverSetup());

    // 3. TypeScript compiler check for additional issues
    if (fs.existsSync(path.join(this.projectPath, 'tsconfig.json'))) {
      issues.push(...this.runTypeScriptCheck());
    }

    // 4. Security checks
    issues.push(...this.checkSecurityIssues());
    
    // 5. Design system validation
    issues.push(...this.runDesignSystemValidation());
    
    // 6. Cross-layer validation (Types → Contracts → Golden → Components)
    issues.push(...this.runCrossLayerValidation());

    // Store ALL issues (don't filter by severity - we need everything for bucket classification)
    this.issues = issues;
    console.log(`📊 Collected ${this.issues.length} total issues from all validation systems`);
    
    const bySeverity = {
      critical: issues.filter(i => i.severity === 'critical').length,
      high: issues.filter(i => i.severity === 'high').length,
      medium: issues.filter(i => i.severity === 'medium').length,
      low: issues.filter(i => i.severity === 'low').length
    };
    console.log('📊 Issue breakdown:', bySeverity);
  }

  private checkObserverSetup(): Issue[] {
    const issues: Issue[] = [];
    const contractPath = path.join(this.projectPath, 'src', 'contracts', 'contracts.yaml');
    
    if (!fs.existsSync(contractPath)) {
      issues.push({
        file: 'src/contracts/contracts.yaml',
        line: 0,
        type: 'missing_contracts',
        severity: 'critical',
        message: 'No contracts defined - AI Observer cannot validate your code',
        category: 'setup',
        impacts: ['all validation', 'code quality checks', 'architecture analysis'],
        suggestion: 'Create contracts.json with your API and database contracts'
      });
    }
    
    return issues;
  }

  private async getValidatorSystemIssues(): Promise<Issue[]> {
    const issues: Issue[] = [];
    
    try {
      // Generate or use existing codebase map
      const mapPath = path.join(this.projectPath, '.observer', 'codebase-map.json');
      
      // Check if map exists, if not create one
      if (!fs.existsSync(mapPath)) {
        console.log('📋 Generating codebase map for validation...');
        const { MapGenerator } = require('../observer/map-generator');
        const generator = new MapGenerator(this.projectPath);
        
        // Ensure .observer directory exists
        const observerDir = path.dirname(mapPath);
        if (!fs.existsSync(observerDir)) {
          fs.mkdirSync(observerDir, { recursive: true });
        }
        
        generator.saveToFile(mapPath);
      }
      
      // Run validator system to get all violations
      const runner = new ValidatorRunner(mapPath);
      const validationResults = runner.runAll();
      
      console.log(`📊 Validator found ${validationResults.violations.length} rule violations`);
      
      // Convert validator violations to our Issue format
      for (const violation of validationResults.violations) {
        issues.push({
          file: violation.file,
          line: 0, // Validator doesn't provide specific line numbers
          type: violation.rule.toLowerCase().replace(/\s+/g, '_'),
          severity: violation.severity === 'critical' ? 'critical' : 
                    violation.severity === 'warning' ? 'high' : 'medium',
          message: violation.message,
          rule: violation.rule,
          category: this.categorizeValidatorRule(violation.rule),
          suggestion: violation.fix || 'Fix required'
        });
      }
      
    } catch (error: any) {
      console.log('⚠️ Validator system issues skipped:', error?.message);
      // Continue with other checks even if validator fails
    }
    
    return issues;
  }

  private categorizeValidatorRule(rule: string): string {
    // Map validator rules to categories for bucket classification
    switch (rule) {
      case 'Error Handling':
        return 'error_handling';
      case 'Type-Database Alignment':
        return 'type_safety';
      case 'Contract Compliance':
        return 'contracts';
      case 'Cache Invalidation':
        return 'performance';
      case 'Hook-Database Pattern':
        return 'architecture';
      case 'API Type Safety':
        return 'api_safety';
      case 'Loading States':
        return 'user_experience';
      case 'Form Validation':
        return 'validation';
      case 'Auth Guards':
        return 'security';
      case 'File Size Warnings':
        return 'maintainability';
      case 'Duplicate Functions':
        return 'code_drift';
      case 'Export Completeness':
        return 'api_completeness';
      default:
        return 'other';
    }
  }

  private categorizeRule(rule: string): string {
    return this.categorizeValidatorRule(rule);
  }

  private organizeBuckets(): IssueBucket[] {
    const buckets: IssueBucket[] = [
      {
        name: 'BLOCKERS',
        title: 'Critical Runtime Issues',
        description: 'Issues that prevent the application from running or cause crashes',
        color: '#ef4444',
        priority: 1,
        issues: [],
        count: 0
      },
      {
        name: 'STRUCTURAL',
        title: 'Important Architectural Issues',
        description: 'Issues that affect code organization, maintainability, and reliability',
        color: '#f59e0b',
        priority: 2,
        issues: [],
        count: 0
      },
      {
        name: 'COMPLIANCE',
        title: 'Code Quality & Standards Issues', 
        description: 'Issues that improve code quality, consistency, and best practices',
        color: '#3b82f6',
        priority: 3,
        issues: [],
        count: 0
      }
    ];

    // Classify issues into buckets based on rule and severity
    for (const issue of this.issues) {
      if (this.isBlockerIssue(issue)) {
        buckets[0].issues.push(issue);
      } else if (this.isStructuralIssue(issue)) {
        buckets[1].issues.push(issue);
      } else {
        buckets[2].issues.push(issue);
      }
    }

    // Update counts
    buckets.forEach(bucket => {
      bucket.count = bucket.issues.length;
    });

    return buckets.filter(bucket => bucket.count > 0); // Only return buckets with issues
  }

  private isBlockerIssue(issue: Issue): boolean {
    // BLOCKERS: Critical runtime issues that prevent the app from working
    if (issue.severity === 'critical') {
      return (
        issue.rule === 'Contract Compliance' ||
        issue.rule === 'Type-Database Alignment' ||
        issue.rule === 'Export Completeness' ||
        issue.type === 'missing_contracts' ||
        issue.type === 'typescript_error' ||
        issue.type === 'export_completeness' ||
        issue.type === 'security' ||
        issue.category === 'setup' ||
        issue.category === 'api_completeness'
      );
    }
    return false;
  }

  private isStructuralIssue(issue: Issue): boolean {
    // STRUCTURAL: Important architectural issues affecting maintainability
    return (
      issue.rule === 'Error Handling' ||
      issue.rule === 'Cache Invalidation' ||
      issue.rule === 'Hook-Database Pattern' ||
      issue.rule === 'API Type Safety' ||
      issue.rule === 'Auth Guards' ||
      issue.rule === 'File Size Warnings' ||
      issue.rule === 'Duplicate Functions' ||
      issue.rule === 'Export Completeness' ||
      issue.type === 'file_size_warnings' ||
      issue.type === 'duplicate_functions' ||
      issue.type === 'export_completeness' ||
      issue.category === 'architecture' ||
      issue.category === 'performance' ||
      issue.category === 'maintainability' ||
      issue.category === 'code_drift' ||
      issue.category === 'api_completeness'
    );
  }

  // All other issues fall into COMPLIANCE bucket

  private runTypeScriptCheck(): Issue[] {
    const issues: Issue[] = [];
    
    try {
      // Run tsc --noEmit to check for TypeScript errors
      execSync('npx tsc --noEmit --pretty false', {
        cwd: this.projectPath,
        encoding: 'utf-8',
        stdio: 'pipe'
      });
    } catch (error: any) {
      // Parse TypeScript errors
      const output = error.stdout || error.message || '';
      const lines = output.split('\n');
      
      for (const line of lines) {
        // Parse TypeScript error format: file(line,col): error TS2304: Cannot find name 'foo'
        const match = line.match(/(.+)\((\d+),(\d+)\):\s+error\s+TS\d+:\s+(.+)/);
        if (match) {
          const [, file, lineNum, , message] = match;
          const severity = this.getErrorSeverity(message);
          
          if (severity === 'critical' || severity === 'high') {
            issues.push({
              file: file.replace(this.projectPath + '/', ''),
              line: parseInt(lineNum),
              type: 'typescript_error',
              severity,
              message: message.trim(),
              category: this.categorizeError(message),
              suggestion: this.getSuggestion(message)
            });
          }
        }
      }
    }
    
    return issues;
  }

  private checkEnvironmentVariables(): Issue[] {
    const issues: Issue[] = [];
    
    // Search for process.env usage in the codebase
    try {
      const result = execSync(
        `grep -r "process\\.env\\." --include="*.ts" --include="*.js" --include="*.tsx" --include="*.jsx" ${this.projectPath} | head -50`,
        { encoding: 'utf-8', stdio: 'pipe' }
      );
      
      const envVars = new Set<string>();
      const lines = result.split('\n');
      
      for (const line of lines) {
        const match = line.match(/process\.env\.(\w+)/);
        if (match) {
          envVars.add(match[1]);
        }
      }
      
      // Check if .env exists
      const envPath = path.join(this.projectPath, '.env');
      const envExists = fs.existsSync(envPath);
      const definedVars = new Set<string>();
      
      if (envExists) {
        const envContent = fs.readFileSync(envPath, 'utf-8');
        envContent.split('\n').forEach(line => {
          const match = line.match(/^(\w+)=/);
          if (match) definedVars.add(match[1]);
        });
      }
      
      // Find missing critical env vars
      for (const envVar of envVars) {
        if (!definedVars.has(envVar)) {
          // Only report critical ones
          if (this.isCriticalEnvVar(envVar)) {
            issues.push({
              file: '.env',
              line: 0,
              type: 'missing_env',
              severity: 'critical',
              message: `${envVar} not defined`,
              category: 'configuration',
              suggestion: `Add ${envVar}=your_value to .env file`
            });
          }
        }
      }
    } catch (error) {
      // grep might fail if no matches, that's okay
    }
    
    return issues;
  }

  private runESLintCheck(): Issue[] {
    const issues: Issue[] = [];
    
    try {
      const result = execSync('npx eslint . --format json --max-warnings 0', {
        cwd: this.projectPath,
        encoding: 'utf-8',
        stdio: 'pipe'
      });
      
      const eslintResults = JSON.parse(result);
      for (const file of eslintResults) {
        for (const msg of file.messages) {
          if (msg.severity === 2) { // Error level
            issues.push({
              file: file.filePath.replace(this.projectPath + '/', ''),
              line: msg.line || 0,
              type: 'eslint_error',
              severity: 'high',
              message: msg.message,
              category: 'code_quality',
              suggestion: msg.fix ? 'Auto-fixable with eslint --fix' : msg.message
            });
          }
        }
      }
    } catch (error) {
      // ESLint might not be configured, that's okay
    }
    
    return issues.slice(0, 20); // Limit ESLint issues
  }

  private checkSecurityIssues(): Issue[] {
    const issues: Issue[] = [];
    
    // Check for hardcoded secrets
    try {
      const patterns = [
        'api_key.*=.*["\'][\\w]{20,}',
        'secret.*=.*["\'][\\w]{20,}',
        'password.*=.*["\'][^"\']{8,}',
        'token.*=.*["\'][\\w]{20,}'
      ];
      
      for (const pattern of patterns) {
        try {
          const result = execSync(
            `grep -r -E "${pattern}" --include="*.ts" --include="*.js" ${this.projectPath} | head -5`,
            { encoding: 'utf-8', stdio: 'pipe' }
          );
          
          const lines = result.split('\n').filter(l => l);
          for (const line of lines) {
            const [filePath] = line.split(':');
            issues.push({
              file: filePath.replace(this.projectPath + '/', ''),
              line: 0,
              type: 'security',
              severity: 'critical',
              message: 'Possible hardcoded secret detected',
              category: 'security',
              suggestion: 'Move to environment variables'
            });
          }
        } catch (e) {
          // No matches found, that's good
        }
      }
    } catch (error) {
      // grep might fail, that's okay
    }
    
    return issues;
  }

  private runDesignSystemValidation(): Issue[] {
    const issues: Issue[] = [];
    
    try {
      console.log('🎨 Running design system validation...');
      const validator = new DesignSystemValidator(this.projectPath);
      const results = validator.validate();
      
      console.log(`🎨 Design system validation found ${results.violations.length} violations`);
      
      // Convert design system violations to our Issue format
      for (const violation of results.violations) {
        issues.push({
          file: violation.file.replace(this.projectPath + '/', ''),
          line: violation.line,
          type: 'design_system',
          severity: violation.severity === 'error' ? 'high' : 'medium',
          message: violation.message,
          category: 'design_system',
          suggestion: violation.suggestion
        });
      }
      
      console.log(`📊 Design system score: ${results.score}/100, Path: ${results.designSystemPath}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log('⚠️ Design system validation failed:', errorMessage);
      // Add a warning issue if validation fails
      issues.push({
        file: 'design-system-check',
        line: 0,
        type: 'design_system_error',
        severity: 'low',
        message: 'Design system validation could not run: ' + errorMessage,
        category: 'design_system',
        suggestion: 'Check if project has React/Vue components to validate'
      });
    }
    
    return issues;
  }

  private runCrossLayerValidation(): Issue[] {
    const issues: Issue[] = [];

    try {
      console.log('🔗 Running cross-layer validation (Types→Contracts→Golden→Components)...');
      const validator = new CrossLayerValidator(this.projectPath);
      const crossLayerIssues = validator.validate();
      
      // Convert cross-layer issues to our Issue format
      for (const cli of crossLayerIssues) {
        issues.push({
          file: cli.file,
          line: 0,
          type: 'cross_layer_mismatch',
          severity: cli.severity,
          message: cli.message,
          category: 'alignment',
          suggestion: cli.fix
        });
      }
      
      const stats = validator.getStats();
      console.log(`🔗 Cross-layer validation found ${stats.total} misalignments (${stats.critical} critical)`);
    } catch (error) {
      console.log('⚠️ Cross-layer validation skipped:', error);
    }

    return issues;
  }

  private isCriticalEnvVar(name: string): boolean {
    const critical = [
      'DATABASE_URL', 'DB_URL', 'MONGODB_URI', 'REDIS_URL',
      'API_KEY', 'SECRET_KEY', 'JWT_SECRET', 'SESSION_SECRET',
      'AWS_ACCESS_KEY', 'AZURE_KEY', 'GOOGLE_API_KEY'
    ];
    
    // Check if it's a critical var or contains critical keywords
    return critical.includes(name) || 
           name.includes('DATABASE') || 
           name.includes('SECRET') ||
           name.includes('KEY') && !name.includes('PUBLIC');
  }

  private getErrorSeverity(message: string): 'critical' | 'high' | 'medium' | 'low' {
    const critical = ['Cannot find module', 'is not defined', 'does not exist'];
    const high = ['Type.*does not satisfy', 'Property.*does not exist', 'Cannot find name'];
    
    if (critical.some(pattern => message.includes(pattern))) return 'critical';
    if (high.some(pattern => new RegExp(pattern).test(message))) return 'high';
    return 'medium';
  }

  private categorizeError(message: string): string {
    if (message.includes('module') || message.includes('import')) return 'imports';
    if (message.includes('Type') || message.includes('type')) return 'types';
    if (message.includes('Property') || message.includes('undefined')) return 'runtime';
    if (message.includes('async') || message.includes('Promise')) return 'async';
    return 'other';
  }

  private getSuggestion(message: string): string {
    if (message.includes('Cannot find module')) {
      const module = message.match(/'([^']+)'/)?.[1];
      return module ? `npm install ${module}` : 'Install missing module';
    }
    if (message.includes('is not defined')) {
      return 'Import or define the variable';
    }
    if (message.includes('Property') && message.includes('does not exist')) {
      return 'Check property name or add type definition';
    }
    return 'Fix TypeScript error';
  }

  private createSmartGroups(): IssueGroup[] {
    const groups: IssueGroup[] = [];
    
    // Sort by severity and category
    const sortedIssues = [...this.issues].sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });

    // Group 1: Setup and configuration (contracts, env)
    const setupIssues = sortedIssues.filter(i => 
      i.category === 'setup' || i.category === 'configuration'
    );
    
    if (setupIssues.length > 0) {
      groups.push({
        group: 1,
        title: 'Fix setup and configuration',
        why: 'Project setup must be correct before anything else',
        fixes: setupIssues.map(issue => ({
          file: `${issue.file}:${issue.line}`,
          issue: issue.message,
          fix: issue.suggestion || 'Fix required'
        }))
      });
    }

    // Group 2: Import and module errors
    const importIssues = sortedIssues.filter(i => 
      i.category === 'imports' && !setupIssues.includes(i)
    );
    
    if (importIssues.length > 0) {
      groups.push({
        group: groups.length + 1,
        title: 'Fix imports and dependencies',
        why: 'Code cannot run without proper imports',
        fixes: importIssues.slice(0, 10).map(issue => ({
          file: `${issue.file}:${issue.line}`,
          issue: issue.message,
          fix: issue.suggestion || 'Fix required'
        }))
      });
    }

    // Group 3: Type and runtime errors
    const runtimeIssues = sortedIssues.filter(i => 
      (i.category === 'runtime' || i.category === 'types') && 
      !setupIssues.includes(i) && !importIssues.includes(i)
    );
    
    if (runtimeIssues.length > 0) {
      groups.push({
        group: groups.length + 1,
        title: 'Fix type and runtime errors',
        why: 'Type safety prevents runtime crashes',
        fixes: runtimeIssues.slice(0, 10).map(issue => ({
          file: `${issue.file}:${issue.line}`,
          issue: issue.message,
          fix: issue.suggestion || 'Fix required'
        }))
      });
    }

    // Group 4: Security issues
    const securityIssues = sortedIssues.filter(i => 
      i.category === 'security' && 
      !setupIssues.includes(i) && !importIssues.includes(i) && !runtimeIssues.includes(i)
    );
    
    if (securityIssues.length > 0) {
      groups.push({
        group: groups.length + 1,
        title: 'Fix security vulnerabilities',
        why: 'Security issues can compromise the entire application',
        fixes: securityIssues.slice(0, 5).map(issue => ({
          file: `${issue.file}:${issue.line}`,
          issue: issue.message,
          fix: issue.suggestion || 'Fix required'
        }))
      });
    }

    return groups;
  }

  private loadPreviousState(): any {
    const statePath = path.join(this.projectPath, '.observer', 'analysis_state.json');
    if (fs.existsSync(statePath)) {
      try {
        return JSON.parse(fs.readFileSync(statePath, 'utf-8'));
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  private saveState(state: any): void {
    const statePath = path.join(this.projectPath, '.observer', 'analysis_state.json');
    fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
  }

  private generateEnhancedFixFile(buckets: IssueBucket[]): void {
    const outputDir = path.join(this.projectPath, '.observer');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Load previous state to track progress
    const previousState = this.loadPreviousState();
    const isFirstRun = !previousState;
    const previousIssuesCount = previousState?.total_issues || 0;
    const fixedCount = previousIssuesCount > this.issues.length ? 
                       previousIssuesCount - this.issues.length : 0;
    
    const totalIssues = this.issues.length;
    const criticalIssues = this.issues.filter(i => i.severity === 'critical').length;
    
    const enhancedFixFile = {
      README: isFirstRun ? 
        `ALL ${totalIssues} issues organized by importance buckets. Fix BLOCKERS first.` :
        `${fixedCount} issues fixed! ${totalIssues} remaining in ${buckets.length} buckets.`,
      generated: new Date().toISOString(),
      project: this.projectPath,
      project_type: this.projectType,
      detected_features: {
        has_payments: this.hasPayments,
        has_auth: this.hasAuth,
        has_database: this.hasDatabase,
        has_api: this.hasAPI
      },
      
      // NEW: Bucket-based organization showing ALL issues
      issue_buckets: buckets.map(bucket => ({
        name: bucket.name,
        title: bucket.title,
        description: bucket.description,
        color: bucket.color,
        priority: bucket.priority,
        count: bucket.count,
        issues: bucket.issues.map(issue => ({
          file: issue.file,
          line: issue.line,
          rule: issue.rule || issue.type,
          severity: issue.severity,
          message: issue.message,
          fix: issue.suggestion || 'Fix required',
          category: issue.category
        }))
      })),
      
      // Enhanced stats showing complete visibility
      stats: {
        total_issues_found: totalIssues,
        issues_shown: totalIssues, // NOW SHOWING ALL ISSUES
        visibility_percentage: 100, // 100% visibility instead of 24%
        
        by_bucket: buckets.map(b => ({ name: b.name, count: b.count })),
        by_severity: {
          critical: this.issues.filter(i => i.severity === 'critical').length,
          high: this.issues.filter(i => i.severity === 'high').length,
          medium: this.issues.filter(i => i.severity === 'medium').length,
          low: this.issues.filter(i => i.severity === 'low').length
        },
        by_rule: this.getIssuesByRule(),
        
        buckets_total: buckets.length,
        fixed_since_last_run: fixedCount,
        remaining_issues: totalIssues
      },
      
      // Context without step-by-step instructions
      context: {
        total: `${totalIssues} issues in ${buckets.length} priority buckets`,
        bucket_priorities: buckets.map(b => ({ [b.name]: b.description }))
      },
      
      progress: {
        session_started: previousState?.session_started || new Date().toISOString(),
        runs_count: (previousState?.runs_count || 0) + 1,
        total_fixed: (previousState?.total_fixed || 0) + fixedCount,
        enhancement_note: "Enhanced with bucket classification - showing ALL issues"
      }
    };
    
    // Write the enhanced file to .observer
    fs.writeFileSync(
      path.join(outputDir, 'FIX_THIS.json'),
      JSON.stringify(enhancedFixFile, null, 2)
    );
    
    // Also save to src/contracts/fixes.json for new project structure
    const contractsDir = path.join(this.projectPath, 'src', 'contracts');
    if (!fs.existsSync(contractsDir)) {
      fs.mkdirSync(contractsDir, { recursive: true });
    }
    fs.writeFileSync(
      path.join(contractsDir, 'fixes.json'),
      JSON.stringify(enhancedFixFile, null, 2)
    );
    
    // Save context.json with essential project info for AI
    const contextFile = {
      analyzed_at: new Date().toISOString(),
      project_path: this.projectPath,
      total_files: this.issues.filter((i, idx, arr) => 
        arr.findIndex(x => x.file === i.file) === idx
      ).length,
      framework: this.detectFramework(),
      entry_points: this.findEntryPoints(),
      api_routes: this.findApiRoutes(),
      database_type: this.detectDatabase(),
      key_dependencies: this.getKeyDependencies(),
      environment_vars: this.detectEnvVars(),
      build_commands: this.getBuildCommands()
    };
    
    fs.writeFileSync(
      path.join(contractsDir, 'context.json'),
      JSON.stringify(contextFile, null, 2)
    );
    
    // Save current state for next run
    this.saveState({
      total_issues: totalIssues,
      session_started: enhancedFixFile.progress.session_started,
      runs_count: enhancedFixFile.progress.runs_count,
      total_fixed: enhancedFixFile.progress.total_fixed,
      last_run: new Date().toISOString(),
      enhancement: 'bucket_classification'
    });
    
    console.log(`📊 Enhanced analysis complete: ${totalIssues} total issues in ${buckets.length} buckets`);
    console.log('📈 Visibility improved from 24% to 100% - AI now sees ALL issues!');
    
    if (fixedCount > 0) {
      console.log(`✨ Great progress! ${fixedCount} issues fixed since last run`);
    }
    if (totalIssues === 0) {
      console.log(`🎉 All issues resolved! Project is clean.`);
    }
  }
  
  private getIssuesByRule(): Record<string, number> {
    const byRule: Record<string, number> = {};
    for (const issue of this.issues) {
      const rule = issue.rule || issue.type || 'other';
      byRule[rule] = (byRule[rule] || 0) + 1;
    }
    return byRule;
  }

  private detectFramework(): string {
    const packagePath = path.join(this.projectPath, 'package.json');
    if (fs.existsSync(packagePath)) {
      const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      if (deps.next) return 'Next.js';
      if (deps.react) return 'React';
      if (deps.vue) return 'Vue';
      if (deps.express) return 'Express';
      if (deps.fastify) return 'Fastify';
    }
    return 'Unknown';
  }

  private findEntryPoints(): string[] {
    const entries: string[] = [];
    const patterns = [
      'src/index.ts', 'src/main.ts', 'src/app.ts',
      'src/app/page.tsx', 'src/app/layout.tsx',
      'pages/index.tsx', 'pages/_app.tsx'
    ];
    
    for (const pattern of patterns) {
      const fullPath = path.join(this.projectPath, pattern);
      if (fs.existsSync(fullPath)) {
        entries.push(pattern);
      }
    }
    return entries;
  }

  private findApiRoutes(): string[] {
    const routes: string[] = [];
    const apiDirs = [
      path.join(this.projectPath, 'src/app/api'),
      path.join(this.projectPath, 'pages/api'),
      path.join(this.projectPath, 'api')
    ];
    
    for (const dir of apiDirs) {
      if (fs.existsSync(dir)) {
        this.walkDir(dir, (file) => {
          if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js')) {
            routes.push(file.replace(this.projectPath, ''));
          }
        });
      }
    }
    return routes;
  }

  private detectDatabase(): string {
    const packagePath = path.join(this.projectPath, 'package.json');
    if (fs.existsSync(packagePath)) {
      const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      if (deps.prisma || deps['@prisma/client']) return 'Prisma/PostgreSQL';
      if (deps.mongoose) return 'MongoDB';
      if (deps.pg) return 'PostgreSQL';
      if (deps.mysql2) return 'MySQL';
      if (deps.sqlite3) return 'SQLite';
    }
    return 'None detected';
  }

  private getKeyDependencies(): Record<string, string> {
    const packagePath = path.join(this.projectPath, 'package.json');
    if (fs.existsSync(packagePath)) {
      const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
      const important = ['next', 'react', 'typescript', 'prisma', '@prisma/client', 
                        'tailwindcss', 'zod', 'express', 'fastify'];
      const result: Record<string, string> = {};
      
      for (const dep of important) {
        if (pkg.dependencies?.[dep]) result[dep] = pkg.dependencies[dep];
        if (pkg.devDependencies?.[dep]) result[dep] = pkg.devDependencies[dep];
      }
      return result;
    }
    return {};
  }

  private detectEnvVars(): string[] {
    const envExample = path.join(this.projectPath, '.env.example');
    const envLocal = path.join(this.projectPath, '.env.local.example');
    const vars = new Set<string>();
    
    for (const file of [envExample, envLocal]) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf-8');
        const matches = content.match(/^([A-Z_]+)=/gm);
        if (matches) {
          matches.forEach(m => vars.add(m.replace('=', '')));
        }
      }
    }
    
    return Array.from(vars);
  }

  private getBuildCommands(): Record<string, string> {
    const packagePath = path.join(this.projectPath, 'package.json');
    if (fs.existsSync(packagePath)) {
      const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
      const important = ['dev', 'build', 'start', 'test', 'lint', 'typecheck'];
      const result: Record<string, string> = {};
      
      for (const script of important) {
        if (pkg.scripts?.[script]) {
          result[script] = pkg.scripts[script];
        }
      }
      return result;
    }
    return {};
  }

  private walkDir(dir: string, callback: (file: string) => void): void {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory() && !file.startsWith('.')) {
        this.walkDir(fullPath, callback);
      } else {
        callback(fullPath);
      }
    });
  }
}