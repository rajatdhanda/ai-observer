import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import { ProjectAnalyzer } from '../analyzer';
import { TableMapper } from '../validator/table-mapper';
import { NineRulesValidator } from '../validator/nine-rules-validator';
import { ContractValidator } from '../validator/contract-validator';
import { BoundaryValidator } from '../validator/boundary-validator';
import { VersionValidator } from '../validator/version-validator';
import { DesignSystemValidator } from '../validator/design-system-validator';
import { logger as RemoteLogger } from '../utils/remote-logger';

const PORT = process.env.DASHBOARD_PORT || 3001;

class Dashboard {
  private analysisData: any = null;
  private projectPath: string;
  private availableProjects: string[] = [];
  private tableMapper: TableMapper | null = null;
  private tableMappingResults: any = null;
  private nineRulesValidator: NineRulesValidator | null = null;
  private nineRulesResults: any = null;
  private contractValidator: ContractValidator | null = null;
  private contractResults: any = null;
  private logger: typeof RemoteLogger;
  private startTime: Date = new Date();
  private errorCount: number = 0;

  constructor() {
    // Get project path from environment or command line
    this.projectPath = process.argv[2] || process.env.OBSERVER_PROJECT_PATH || process.cwd();
    this.logger = RemoteLogger;
    this.logger.info(`Dashboard starting for project: ${this.projectPath}`);
    this.scanForProjects();
  }

  private scanForProjects() {
    // Look for TypeScript projects in common locations
    const locations = [
      process.cwd(),
      path.join(process.cwd(), 'test-projects'),
      path.join(process.cwd(), '..')
    ];

    for (const loc of locations) {
      if (fs.existsSync(loc)) {
        const dirs = fs.readdirSync(loc, { withFileTypes: true })
          .filter(d => d.isDirectory())
          .map(d => path.join(loc, d.name))
          .filter(p => fs.existsSync(path.join(p, 'tsconfig.json')) || fs.existsSync(path.join(p, 'package.json')));
        this.availableProjects.push(...dirs);
      }
    }
  }

  async start() {
    // Load analysis if exists for current project
    const analysisPath = path.join(this.projectPath, '.observer', 'analysis.json');
    if (fs.existsSync(analysisPath)) {
      this.analysisData = JSON.parse(fs.readFileSync(analysisPath, 'utf-8'));
    }
    
    // Also load table mapping if exists
    const mappingPath = path.join(this.projectPath, '.observer', 'table-mapping.json');
    if (fs.existsSync(mappingPath)) {
      this.tableMappingResults = JSON.parse(fs.readFileSync(mappingPath, 'utf-8'));
    }

    const server = http.createServer(async (req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      
      // Log all requests
      this.logger.info(`Request: ${req.method} ${req.url}`);
      
      // Health check endpoint
      if (req.url === '/api/health') {
        const health = {
          status: 'ok',
          project: this.projectPath,
          uptime: Math.floor((Date.now() - this.startTime.getTime()) / 1000),
          errorCount: this.errorCount,
          memory: process.memoryUsage(),
          version: '1.0.0'
        };
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(health));
      } else if (req.url === '/api/logs') {
        // Get recent logs for remote debugging
        const logs = this.logger.getRecentLogs(50);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ logs }));
      } else if (req.url === '/api/errors') {
        // Get recent errors for remote debugging
        const errors = this.logger.getRecentErrors(50);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ errors }));
      } else if (req.url === '/api/observer-logs') {
        // Get observer activity logs for live panel
        try {
          const { logger } = require('../utils/remote-logger');
          const logs = logger.getLogs(100);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ logs }));
        } catch (error) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ logs: [] }));
        }
      } else if (req.url === '/api/smart-analysis-meta') {
        // Lightweight metadata check for change detection
        try {
          const fixFilePath = path.join(this.projectPath, '.observer', 'FIX_THIS.json');
          if (fs.existsSync(fixFilePath)) {
            const stats = fs.statSync(fixFilePath);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
              exists: true,
              size: stats.size,
              modified: stats.mtime.getTime()
            }));
          } else {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ exists: false }));
          }
        } catch (error: any) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: error.message }));
        }
      } else if (req.url === '/api/smart-analysis') {
        // Serve the FIX_THIS.json if it exists
        try {
          const fixFilePath = path.join(this.projectPath, '.observer', 'FIX_THIS.json');
          if (fs.existsSync(fixFilePath)) {
            const analysis = JSON.parse(fs.readFileSync(fixFilePath, 'utf-8'));
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ exists: true, analysis }));
          } else {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ exists: false }));
          }
        } catch (error: any) {
          this.logger.error('Failed to read smart analysis', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: error.message }));
        }
      } else if (req.url === '/api/run-smart-analysis') {
        // Run the smart analyzer
        try {
          const { SmartIssueAnalyzer } = require('../analyzer/smart-issue-analyzer');
          const analyzer = new SmartIssueAnalyzer(this.projectPath);
          await analyzer.analyze();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        } catch (error: any) {
          this.logger.error('Smart analysis failed', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: error.message }));
        }
      } else if (req.url === '/api/diagnostics') {
        // Complete diagnostics for remote debugging
        const diagnostics = {
          ...this.logger.getDiagnostics(),
          project: this.projectPath,
          hasSchema: fs.existsSync(path.join(this.projectPath, 'prisma', 'schema.prisma')),
          hasSrcFolder: fs.existsSync(path.join(this.projectPath, 'src')),
          availableProjects: this.availableProjects,
          tableMappingStatus: this.tableMappingResults ? 'loaded' : 'not loaded',
          tablesFound: this.tableMappingResults?.tables ? Object.keys(this.tableMappingResults.tables).length : 0,
          errorCount: this.errorCount
        };
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(diagnostics));
      } else if (req.url === '/api/projects') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          current: this.projectPath,
          available: this.availableProjects
        }));
      } else if (req.url?.startsWith('/api/set-project')) {
        const url = new URL(req.url, `http://localhost:${PORT}`);
        const newPath = url.searchParams.get('path');
        if (newPath && fs.existsSync(newPath)) {
          this.projectPath = newPath;
          this.analysisData = null;
          this.tableMappingResults = null;
          this.nineRulesResults = null;
          this.contractResults = null;
          
          // Reload analysis for new project
          const analysisPath = path.join(this.projectPath, '.observer', 'analysis.json');
          if (fs.existsSync(analysisPath)) {
            this.analysisData = JSON.parse(fs.readFileSync(analysisPath, 'utf-8'));
          }
          
          // Also reload table mapping if exists
          const mappingPath = path.join(this.projectPath, '.observer', 'table-mapping.json');
          if (fs.existsSync(mappingPath)) {
            this.tableMappingResults = JSON.parse(fs.readFileSync(mappingPath, 'utf-8'));
          }
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, path: this.projectPath }));
        } else {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid project path' }));
        }
      } else if (req.url === '/api/analysis') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(this.analysisData || {}));
      } else if (req.url === '/api/project-info') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          path: this.projectPath,
          name: path.basename(this.projectPath)
        }));
      } else if (req.url === '/api/table-mapping') {
        try {
          const mapping = await this.mapTables();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(mapping));
        } catch (error: any) {
          this.errorCount++;
          this.logger.error('Table mapping failed', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            error: 'Table mapping failed',
            message: error.message,
            project: this.projectPath,
            hint: 'Check if project has prisma/schema.prisma file'
          }));
        }
      } else if (req.url === '/api/nine-rules') {
        try {
          const results = await this.runNineRulesValidation();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(results));
        } catch (error: any) {
          this.errorCount++;
          this.logger.error('Nine rules validation failed', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            error: 'Nine rules validation failed',
            message: error.message,
            project: this.projectPath
          }));
        }
      } else if (req.url === '/api/contracts') {
        try {
          const results = await this.runContractValidation();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(results));
        } catch (error: any) {
          this.errorCount++;
          this.logger.error('Contract validation failed', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            error: 'Contract validation failed',
            message: error.message,
            project: this.projectPath
          }));
        }
      } else if (req.url?.startsWith('/api/architecture-data')) {
        const url = new URL(req.url, `http://localhost:${PORT}`);
        const type = url.searchParams.get('type') as 'hook' | 'component' | 'api' | 'page' | 'table';
        const data = await this.getArchitectureData(type || 'component');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
      } else if (req.url === '/api/boundaries') {
        const boundaryResults = this.runBoundaryValidation();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(boundaryResults));
      } else if (req.url === '/api/map-validation') {
        const mapResults = this.runMapValidation();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(mapResults));
      } else if (req.url === '/api/versions') {
        const versionResults = this.runVersionValidation();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(versionResults));
      } else if (req.url === '/api/design-system') {
        const designResults = this.runDesignSystemValidation();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(designResults));
      } else if (req.url === '/modular-fixed') {
        const modularFixedPath = path.join(__dirname, 'modular-fixed.html');
        const html = fs.readFileSync(modularFixedPath, 'utf-8');
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
      } else if (req.url === '/theme-config.js') {
        const themePath = path.join(__dirname, 'theme-config.js');
        if (fs.existsSync(themePath)) {
          const js = fs.readFileSync(themePath, 'utf-8');
          res.writeHead(200, { 'Content-Type': 'application/javascript' });
          res.end(js);
        } else {
          res.writeHead(404);
          res.end();
        }
      } else if (req.url?.startsWith('/components/') && req.url?.endsWith('.js')) {
        // Serve component JavaScript files
        const componentName = req.url.replace('/components/', '');
        const componentPath = path.join(__dirname, 'components', componentName);
        if (fs.existsSync(componentPath)) {
          const js = fs.readFileSync(componentPath, 'utf-8');
          res.writeHead(200, { 'Content-Type': 'application/javascript' });
          res.end(js);
        } else {
          res.writeHead(404);
          res.end();
        }
      } else if (req.url === '/') {
        // Redirect to modular-fixed as the default
        res.writeHead(302, { 'Location': '/modular-fixed' });
        res.end();
      } else {
        res.writeHead(404);
        res.end();
      }
    });

    server.listen(PORT, () => {
      console.log(`
AI Observer Dashboard
URL: http://localhost:${PORT}
Project: ${this.projectPath}

Features:
- Architecture analysis
- Contract validation  
- 9 quality rules validation
- Table mapping

Available projects: ${this.availableProjects.length}
      `);
    });
  }

  private async mapTables() {
    this.tableMapper = new TableMapper(this.projectPath);
    const results = await this.tableMapper.analyze();
    // Convert Map to serializable object
    this.tableMappingResults = {
      ...results,
      tables: Object.fromEntries(results.tables)
    };
    return this.tableMappingResults;
  }

  private async runNineRulesValidation() {
    this.nineRulesValidator = new NineRulesValidator(this.projectPath);
    this.nineRulesResults = await this.nineRulesValidator.validateAll();
    return this.nineRulesResults;
  }

  private async getArchitectureData(type: 'table' | 'hook' | 'component' | 'api' | 'page'): Promise<any[]> {
    try {
      // Get validation results (same logic as working tabs)
      const nineRulesData = this.nineRulesResults || await this.runNineRulesValidation();
      const contractsData = this.contractResults || await this.runContractValidation();
      
      // Handle table type differently
      if (type === 'table') {
        // Get tables from table mapping results
        if (!this.tableMappingResults) {
          await this.mapTables();
        }
        
        const tables = Object.entries(this.tableMappingResults?.tables || {}).map(([name, table]: [string, any]) => {
          // Count contract violations for this table
          const tableContractViolations = contractsData.violations?.filter((violation: any) => 
            violation.table === name || violation.location?.includes(name)
          ) || [];
          const contractErrors = tableContractViolations.filter((v: any) => v.type === 'error').length;
          const contractWarnings = tableContractViolations.filter((v: any) => v.type === 'warning').length;

          // For tables, we don't have nine-rules issues
          const codeQualityErrors = 0;
          const codeQualityWarnings = 0;

          const totalErrors = contractErrors + codeQualityErrors;
          const totalWarnings = contractWarnings + codeQualityWarnings;
          const totalIssues = totalErrors + totalWarnings;
          
          return {
            name,
            file: table.schemaFile || 'prisma/schema.prisma',
            type: 'table',
            errorCount: totalErrors,
            warningCount: totalWarnings,
            contractErrors,
            contractWarnings,
            codeQualityErrors,
            codeQualityWarnings,
            contractViolations: contractErrors + contractWarnings,
            codeQualityIssues: 0,
            issueCount: totalIssues,
            healthScore: this.calculateHealthScore(totalErrors, totalWarnings)
          };
        });
        
        return tables.sort((a, b) => a.name.localeCompare(b.name));
      }
      
      // Get all files for this type - fix plural mismatch
      const typeMap = {
        'hook': 'hooks',
        'component': 'components', 
        'api': 'api',
        'page': 'pages'
      };
      const allFiles = await this.discoverProjectFiles(typeMap[type]);
      
      // Process each file using same logic as working tabs
      const items = allFiles.map((filePath: string) => {
        const item = this.createArchitectureItem(filePath, type);
        
        // Count contract violations - separate errors and warnings
        const fileContractViolations = contractsData.violations?.filter((violation: any) => 
          violation.location?.includes(filePath)
        ) || [];
        const contractErrors = fileContractViolations.filter((v: any) => v.type === 'error').length;
        const contractWarnings = fileContractViolations.filter((v: any) => v.type === 'warning').length;

        // Count nine-rules issues - separate critical and warnings
        const fileCQIssues = this.getNineRulesIssuesForFile(nineRulesData, filePath);
        const codeQualityErrors = fileCQIssues.filter((i: any) => i.severity === 'critical').length;
        const codeQualityWarnings = fileCQIssues.filter((i: any) => i.severity === 'warning').length;

        const totalErrors = contractErrors + codeQualityErrors;
        const totalWarnings = contractWarnings + codeQualityWarnings;
        const totalIssues = totalErrors + totalWarnings;
        
        return {
          ...item,
          errorCount: totalErrors,
          warningCount: totalWarnings,
          contractErrors,
          contractWarnings,
          codeQualityErrors,
          codeQualityWarnings,
          contractViolations: contractErrors + contractWarnings,
          codeQualityIssues: codeQualityErrors + codeQualityWarnings,
          issueCount: totalIssues,
          healthScore: this.calculateHealthScore(totalErrors, totalWarnings)
        };
      });

      return items.sort((a, b) => a.name.localeCompare(b.name));
      
    } catch (error) {
      console.error('Error getting architecture data:', error);
      return [];
    }
  }

  private createArchitectureItem(filePath: string, type: string): any {
    let name: string;
    
    switch (type) {
      case 'hook':
        name = filePath.match(/use[A-Z]\w+/)?.[0] || 
               filePath.split('/').pop()?.replace(/\.(ts|tsx|js|jsx)$/, '') || 'Unknown Hook';
        break;
      case 'component':
        name = filePath.split('/').pop()?.replace(/\.(ts|tsx|js|jsx)$/, '') || 'Unknown Component';
        break;
      case 'api':
        name = filePath.replace(/.*\/api/, '/api');
        break;
      case 'page':
        const pagePath = filePath.replace(/.*\/app/, '').replace(/\/page\.(ts|tsx|js|jsx)$/, '') || '/';
        name = pagePath === '/' ? 'Home' : pagePath.split('/').filter(Boolean).join(' > ');
        break;
      default:
        name = 'Unknown';
    }

    return {
      name,
      file: filePath,
      type: type,
      healthScore: 100,
      issueCount: 0,
      errorCount: 0,
      warningCount: 0,
      contractErrors: 0,
      contractWarnings: 0,
      codeQualityErrors: 0,
      codeQualityWarnings: 0,
      contractViolations: 0,
      codeQualityIssues: 0
    };
  }

  private getNineRulesIssuesForFile(nineRulesData: any, filePath: string): any[] {
    if (!nineRulesData?.results) return [];
    
    const issues: any[] = [];
    nineRulesData.results.forEach((rule: any) => {
      rule.issues?.forEach((issue: any) => {
        if (issue.file === filePath) {
          issues.push({
            rule: rule.rule,
            ruleNumber: rule.ruleNumber,
            ...issue
          });
        }
      });
    });
    
    return issues;
  }

  private calculateHealthScore(errors: number, warnings: number): number {
    if (errors === 0 && warnings === 0) return 100;
    
    // Objective scoring:
    // - Critical errors: 20 points each (max 80 points deduction)
    // - Warnings: 5 points each (max 20 points deduction)
    const errorDeduction = Math.min(errors * 20, 80);
    const warningDeduction = Math.min(warnings * 5, 20);
    
    return Math.max(0, 100 - errorDeduction - warningDeduction);
  }

  private async runContractValidation() {
    console.log('📋 Running contract validation...');
    
    try {
      if (!this.contractValidator) {
        this.contractValidator = new ContractValidator(this.projectPath);
      }
      
      // Get static validation results
      const staticResults = await this.contractValidator.validate();
      
      let runtimeData = {
        pointsNeedingValidation: 0,
        validationPoints: [],
        schemasGenerated: 0
      };
      
      // Try to run runtime enforcement analysis
      try {
        const RuntimeEnforcer = require('../validator/_archived/runtime-enforcer').RuntimeEnforcer;
        const runtimeEnforcer = new RuntimeEnforcer(this.projectPath);
        const runtimeAnalysis = runtimeEnforcer.analyzeAndInjectValidation();
        
        runtimeData = {
          pointsNeedingValidation: runtimeAnalysis.points.length,
          validationPoints: runtimeAnalysis.points.slice(0, 10), // First 10 for display
          schemasGenerated: runtimeAnalysis.schemas.length
        };
      } catch (runtimeError: any) {
        console.log('Runtime enforcement analysis skipped:', runtimeError?.message || 'Unknown error');
      }
      
      // Combine results  
      // staticResults has: score, violations, summary
      const violationCount = staticResults.violations?.length || 0;
      const score = staticResults.score || 0;
      
      // When we have violations, totalChecked should be violations + some theoretical passed checks
      // Assuming each violation is a failed check, and score represents % of successful checks
      const totalChecked = violationCount > 0 ? violationCount : 100;
      const passed = violationCount > 0 ? 0 : Math.round((score / 100) * totalChecked);
      
      this.contractResults = {
        ...staticResults,
        runtime: runtimeData,
        // Map the fields for the component
        totalChecked: totalChecked,
        passed: passed,
        failed: violationCount,
        violations: staticResults.violations || []
      };
      
      return this.contractResults;
    } catch (error) {
      console.error('Error in contract validation:', error);
      // Return empty result that the component can handle
      return {
        violations: [],
        totalChecked: 0,
        passed: 0,
        failed: 0,
        runtime: {
          pointsNeedingValidation: 0,
          validationPoints: [],
          schemasGenerated: 0
        }
      };
    }
  }
  
  private runMapValidation() {
    try {
      // Generate or use existing map
      const mapPath = path.join(__dirname, '..', '..', 'streax-map.json');
      
      if (!fs.existsSync(mapPath)) {
        // Generate map first
        const { MapGenerator } = require('../observer/map-generator');
        const generator = new MapGenerator(this.projectPath);
        generator.saveToFile(mapPath);
      }
      
      // Load the map data
      const mapData = JSON.parse(fs.readFileSync(mapPath, 'utf-8'));
      
      // Run validators
      const { ValidatorRunner } = require('../observer/validator-runner');
      const runner = new ValidatorRunner(mapPath);
      const validationResults = runner.runAll();
      
      // Return both map data and validation results
      return {
        ...validationResults,
        files: mapData.files || {},
        exports: mapData.exports || {},
        imports: mapData.imports || {},
        contractDetections: validationResults.contractDetections
      };
    } catch (error) {
      console.error('Map validation error:', error);
      return { 
        violations: [], 
        score: 0, 
        summary: { error: (error as Error).message },
        files: {},
        exports: {},
        imports: {},
        contractDetections: null
      };
    }
  }

  private runBoundaryValidation() {
    const validator = new BoundaryValidator(this.projectPath);
    const results = validator.analyze();
    
    // Group by type for dashboard
    const byType: Record<string, any> = {};
    for (const boundary of results.boundaries) {
      if (!byType[boundary.boundary]) {
        byType[boundary.boundary] = {
          total: 0,
          validated: 0,
          coverage: 0
        };
      }
      byType[boundary.boundary].total++;
      if (boundary.hasValidation) {
        byType[boundary.boundary].validated++;
      }
    }
    
    // Calculate coverage per type
    for (const type of Object.keys(byType)) {
      const info = byType[type];
      info.coverage = info.total > 0 
        ? Math.round((info.validated / info.total) * 100)
        : 0;
    }
    
    return {
      ...results,
      byType
    };
  }
  
  private runVersionValidation() {
    const validator = new VersionValidator(this.projectPath);
    return validator.validate();
  }
  
  private runDesignSystemValidation() {
    const validator = new DesignSystemValidator(this.projectPath);
    return validator.validate();
  }

  private async discoverProjectFiles(type: string = 'all'): Promise<string[]> {
    const files: string[] = [];
    
    const walkDir = (dir: string) => {
      if (!fs.existsSync(dir)) return;
      
      const items = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const item of items) {
        const fullPath = path.join(dir, item.name);
        const relativePath = path.relative(this.projectPath, fullPath);
        
        if (item.isDirectory()) {
          // Skip non-source directories
          const skipDirs = [
            'node_modules', '.git', '.next', 'dist', 'build', 
            'contracts', // Skip contract schemas
            'tests', '__tests__', '.turbo', 'coverage',
            'public', 'static'
          ];
          
          if (skipDirs.includes(item.name)) {
            continue;
          }
          
          // Also skip hidden directories
          if (item.name.startsWith('.')) {
            continue;
          }
          
          walkDir(fullPath);
        } else if (item.isFile()) {
          const ext = path.extname(item.name);
          
          // Skip test files, config files, and non-source files
          if (item.name.includes('.test.') || 
              item.name.includes('.spec.') ||
              item.name.includes('.config.') ||
              item.name.includes('.schema.') ||
              item.name === 'package.json' ||
              item.name === 'tsconfig.json') {
            continue;
          }
          
          if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
            // Only include files from src directory
            if (!relativePath.startsWith('src/')) {
              continue;
            }
            
            // Filter by type if specified
            switch (type) {
              case 'hooks':
                if (relativePath.includes('/hooks/') || /^use[A-Z]/.test(item.name)) {
                  files.push(fullPath);
                }
                break;
              case 'components':
                if (relativePath.includes('/components/')) {
                  files.push(fullPath);
                }
                break;
              case 'api':
                if (relativePath.includes('/api/')) {
                  files.push(fullPath);
                }
                break;
              case 'pages':
                if (relativePath.includes('/app/') && !relativePath.includes('/api/') && 
                    (item.name === 'page.tsx' || item.name === 'page.ts')) {
                  files.push(fullPath);
                }
                break;
              case 'all':
              default:
                // For 'all', still apply the src filter
                files.push(fullPath);
                break;
            }
          }
        }
      }
    };
    
    // Start walking from src directory if it exists
    const srcPath = path.join(this.projectPath, 'src');
    if (fs.existsSync(srcPath)) {
      walkDir(srcPath);
    } else {
      walkDir(this.projectPath);
    }
    
    return files;
  }
}

const dashboard = new Dashboard();
dashboard.start();