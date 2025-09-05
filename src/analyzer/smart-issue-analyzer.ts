import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { ValidatorRunner } from '../observer/validator-runner';
import { DesignSystemValidator } from '../validator/design-system-validator';
import { CrossLayerValidator } from '../validator/cross-layer-validator';
import { ComprehensiveContractValidator } from '../validator/comprehensive-contract-validator';
import { Issue, IssueBucket, IssueGroup } from '../types/analysis-types';
import { ProjectContextDetector } from './project-context-detector';
import { FixFileGenerator } from './fix-file-generator';
import { IssueBucketClassifier } from './issue-bucket-classifier';


export class SmartIssueAnalyzer {
  private projectPath: string;
  private issues: Issue[] = [];
  private projectType: string = 'unknown';
  private hasPayments: boolean = false;
  private hasAuth: boolean = false;
  private hasDatabase: boolean = false;
  private hasAPI: boolean = false;
  private contextDetector: ProjectContextDetector;
  private fixFileGenerator?: FixFileGenerator;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
    this.contextDetector = new ProjectContextDetector(projectPath);
  }

  // Main entry point - Enhanced with bucket classification
  async analyze(): Promise<void> {
    console.log('🔍 Starting enhanced smart issue analysis with bucket classification...');
    
    // 1. Detect project type and features
    this.detectProjectFeatures();
    
    // 2. Collect ALL issues from validator system + legacy checks
    await this.collectAllIssues();
    
    // 3. Organize issues into importance buckets
    const classifier = new IssueBucketClassifier(this.issues);
    const buckets = classifier.organizeBuckets();
    
    // 4. Generate enhanced FIX_THIS.json with all issues visible
    this.fixFileGenerator = new FixFileGenerator(
      this.projectPath,
      this.issues,
      this.projectType,
      this.hasPayments,
      this.hasAuth,
      this.hasDatabase,
      this.hasAPI,
      this.contextDetector
    );
    this.fixFileGenerator.generateEnhancedFixFile(buckets);
    
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
    
    // 7. Comprehensive contract validation - checks ALL entities thoroughly
    issues.push(...this.runComprehensiveContractValidation());

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
          type: 'contract_violation',  // CHANGED: This is a CONTRACT VIOLATION, not just a mismatch
          severity: 'critical',  // CHANGED: Contract violations are ALWAYS critical
          message: cli.message,
          category: 'contract',  // CHANGED: Put in contract category
          rule: 'Contract Violation',  // ADDED: Explicit rule name
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



  private runComprehensiveContractValidation(): Issue[] {
    const issues: Issue[] = [];

    try {
      console.log('🔍 Running COMPREHENSIVE contract validation for ALL entities...');
      const validator = new ComprehensiveContractValidator(this.projectPath);
      const violations = validator.validate();
      
      console.log(`📋 Found ${violations.length} contract violations across all entities`);
      
      // Convert violations to our Issue format
      for (const violation of violations) {
        issues.push({
          file: violation.file,
          line: violation.line || 0,
          type: 'contract_violation',
          severity: 'critical',
          message: violation.message,
          category: 'contract',
          rule: 'Contract Violation',
          suggestion: violation.fix
        });
      }
      
    } catch (error: any) {
      console.log('⚠️ Comprehensive contract validation error:', error?.message);
    }
    
    return issues;
  }
}