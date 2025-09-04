import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

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

  // Main entry point
  async analyze(): Promise<void> {
    console.log('🔍 Starting smart issue analysis...');
    
    // 1. Detect project type and features
    this.detectProjectFeatures();
    
    // 2. Collect all issues dynamically
    await this.collectIssues();
    
    // 3. Score and group issues intelligently
    const groups = this.createSmartGroups();
    
    // 4. Generate FIX_THIS.json
    this.generateFixFile(groups);
    
    console.log('✅ Analysis complete. Check .observer/FIX_THIS.json');
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

  private async collectIssues(): Promise<void> {
    const issues: Issue[] = [];

    // 0. MOST CRITICAL: Check for AI Observer setup
    issues.push(...this.checkObserverSetup());

    // 1. Run TypeScript compiler check (if tsconfig exists)
    if (fs.existsSync(path.join(this.projectPath, 'tsconfig.json'))) {
      issues.push(...this.runTypeScriptCheck());
    }

    // 2. Check for missing environment variables
    issues.push(...this.checkEnvironmentVariables());
    
    // 3. Run ESLint if available
    issues.push(...this.runESLintCheck());
    
    // 4. Check for security issues
    issues.push(...this.checkSecurityIssues());

    this.issues = issues.filter(issue => issue.severity === 'critical' || issue.severity === 'high');
    console.log(`📊 Found ${this.issues.length} critical/high priority issues`);
  }

  private checkObserverSetup(): Issue[] {
    const issues: Issue[] = [];
    const contractPath = path.join(this.projectPath, '.observer', 'contracts.json');
    
    if (!fs.existsSync(contractPath)) {
      issues.push({
        file: '.observer/contracts.json',
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

  private generateFixFile(groups: IssueGroup[]): void {
    const outputDir = path.join(this.projectPath, '.observer');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Limit output size for AI token optimization
    const MAX_GROUPS = 5;
    const MAX_FIXES_PER_GROUP = 10;
    
    // Trim groups and limit fixes per group
    const limitedGroups = groups.slice(0, MAX_GROUPS).map(group => ({
      ...group,
      fixes: group.fixes.slice(0, MAX_FIXES_PER_GROUP)
    }));
    
    // Load previous state to track progress
    const previousState = this.loadPreviousState();
    const isFirstRun = !previousState;
    const previousIssuesCount = previousState?.total_issues || 0;
    const fixedCount = previousIssuesCount > this.issues.length ? 
                       previousIssuesCount - this.issues.length : 0;
    
    const fixFile = {
      README: isFirstRun ? 
        "Fix in order. Group 1 is CRITICAL (blocks all). Max 20 mins or 3 groups." :
        `${fixedCount} issues fixed! Continue with next groups. Stop after 3 more groups.`,
      generated: new Date().toISOString(),
      project: this.projectPath,
      project_type: this.projectType,
      detected_features: {
        has_payments: this.hasPayments,
        has_auth: this.hasAuth,
        has_database: this.hasDatabase,
        has_api: this.hasAPI
      },
      fix_groups: limitedGroups,
      stats: {
        total_issues_found: this.issues.length,
        critical_shown: limitedGroups.reduce((sum, g) => sum + g.fixes.length, 0),
        groups_total: groups.length,
        groups_shown: limitedGroups.length,
        fixed_since_last_run: fixedCount,
        remaining_issues: this.issues.length
      },
      instructions: {
        step0: "If no contracts.json exists, create it FIRST",
        step1: "Fix all issues in group 1 (critical setup)",
        step2: "Run 'npm test' or 'npm run build' - if fails, debug group 1",
        step3: "Continue to group 2 only if group 1 passes",
        step4: "Stop after group 3 or 20 minutes total",
        auto_refresh: "Run 'npm run smart-analyze' again after fixing to get next batch"
      },
      progress: {
        session_started: previousState?.session_started || new Date().toISOString(),
        runs_count: (previousState?.runs_count || 0) + 1,
        total_fixed: (previousState?.total_fixed || 0) + fixedCount
      }
    };
    
    // Write the main file AI will read
    fs.writeFileSync(
      path.join(outputDir, 'FIX_THIS.json'),
      JSON.stringify(fixFile, null, 2)
    );
    
    // Save current state for next run
    this.saveState({
      total_issues: this.issues.length,
      session_started: fixFile.progress.session_started,
      runs_count: fixFile.progress.runs_count,
      total_fixed: fixFile.progress.total_fixed,
      last_run: new Date().toISOString()
    });
    
    console.log(`📊 Showing ${limitedGroups.length} priority groups out of ${groups.length} total`);
    if (fixedCount > 0) {
      console.log(`✨ Great progress! ${fixedCount} issues fixed since last run`);
    }
    if (this.issues.length === 0) {
      console.log(`🎉 All issues resolved! Project is clean.`);
    }
  }
}