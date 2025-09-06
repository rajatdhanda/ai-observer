"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const http = __importStar(require("http"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const net = __importStar(require("net"));
const table_mapper_1 = require("../validator/table-mapper");
const nine_rules_validator_1 = require("../validator/nine-rules-validator");
const contract_validator_1 = require("../validator/contract-validator");
const boundary_validator_1 = require("../validator/boundary-validator");
const version_validator_1 = require("../validator/version-validator");
const design_system_validator_1 = require("../validator/design-system-validator");
const cta_validator_1 = require("../validator/cta-validator");
const refactoring_analyzer_1 = require("../validator/refactoring-analyzer");
const remote_logger_1 = require("../utils/remote-logger");
// Auto-find next available port starting from 3001
function findAvailablePort(startPort = 3001) {
    return new Promise((resolve) => {
        const testPort = (port) => {
            const server = net.createServer();
            server.listen(port, () => {
                server.close(() => resolve(port));
            });
            server.on('error', () => {
                testPort(port + 1);
            });
        };
        testPort(startPort);
    });
}
let PORT;
class Dashboard {
    analysisData = null;
    projectPath;
    availableProjects = [];
    tableMapper = null;
    tableMappingResults = null;
    nineRulesValidator = null;
    nineRulesResults = null;
    contractValidator = null;
    contractResults = null;
    ctaValidator = null;
    ctaResults = null;
    refactoringAnalyzer = null;
    logger;
    startTime = new Date();
    errorCount = 0;
    constructor() {
        // Get project path from environment or command line
        this.projectPath = process.argv[2] || process.env.OBSERVER_PROJECT_PATH || process.cwd();
        this.logger = remote_logger_1.logger;
        this.logger.info(`Dashboard starting for project: ${this.projectPath}`);
        this.scanForProjects();
    }
    scanForProjects() {
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
            }
            else if (req.url === '/api/logs') {
                // Get recent logs for remote debugging
                const logs = this.logger.getRecentLogs(50);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ logs }));
            }
            else if (req.url === '/api/errors') {
                // Get recent errors for remote debugging
                const errors = this.logger.getRecentErrors(50);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ errors }));
            }
            else if (req.url === '/api/observer-logs') {
                // Get observer activity logs for live panel
                try {
                    const { logger } = require('../utils/remote-logger');
                    const logs = logger.getLogs(100);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ logs }));
                }
                catch (error) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ logs: [] }));
                }
            }
            else if (req.url === '/api/smart-analysis-meta') {
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
                    }
                    else {
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ exists: false }));
                    }
                }
                catch (error) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: error.message }));
                }
            }
            else if (req.url === '/api/smart-analysis') {
                // Serve the fixes.json from src/contracts (single source of truth)
                try {
                    // First try src/contracts/fixes.json (new standard location)
                    const contractsFixPath = path.join(this.projectPath, 'src', 'contracts', 'fixes.json');
                    // Fallback to .observer/FIX_THIS.json for backward compatibility
                    const observerFixPath = path.join(this.projectPath, '.observer', 'FIX_THIS.json');
                    let fixFilePath = contractsFixPath;
                    if (!fs.existsSync(contractsFixPath) && fs.existsSync(observerFixPath)) {
                        fixFilePath = observerFixPath;
                    }
                    if (fs.existsSync(fixFilePath)) {
                        const analysis = JSON.parse(fs.readFileSync(fixFilePath, 'utf-8'));
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ exists: true, analysis }));
                    }
                    else {
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ exists: false }));
                    }
                }
                catch (error) {
                    this.logger.error('Failed to read smart analysis', error);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: error.message }));
                }
            }
            else if (req.url === '/api/run-smart-analysis') {
                // Run the smart analyzer
                try {
                    const { SmartIssueAnalyzer } = require('../analyzer/smart-issue-analyzer');
                    const analyzer = new SmartIssueAnalyzer(this.projectPath);
                    await analyzer.analyze();
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true }));
                }
                catch (error) {
                    this.logger.error('Smart analysis failed', error);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: error.message }));
                }
            }
            else if (req.url === '/api/diagnostics') {
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
            }
            else if (req.url === '/api/projects') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    current: this.projectPath,
                    available: this.availableProjects
                }));
            }
            else if (req.url?.startsWith('/api/set-project')) {
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
                }
                else {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Invalid project path' }));
                }
            }
            else if (req.url === '/api/analysis') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(this.analysisData || {}));
            }
            else if (req.url === '/api/project-info') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    path: this.projectPath,
                    name: path.basename(this.projectPath)
                }));
            }
            else if (req.url === '/api/table-mapping') {
                try {
                    const mapping = await this.mapTables();
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(mapping));
                }
                catch (error) {
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
            }
            else if (req.url === '/api/nine-rules') {
                try {
                    const results = await this.runNineRulesValidation();
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(results));
                }
                catch (error) {
                    this.errorCount++;
                    this.logger.error('Nine rules validation failed', error);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        error: 'Nine rules validation failed',
                        message: error.message,
                        project: this.projectPath
                    }));
                }
            }
            else if (req.url === '/api/cta-analysis') {
                try {
                    const results = await this.runCTAValidation();
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(results));
                }
                catch (error) {
                    this.errorCount++;
                    this.logger.error('CTA validation failed', error);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        error: 'CTA validation failed',
                        message: error.message,
                        project: this.projectPath
                    }));
                }
            }
            else if (req.url === '/api/contracts') {
                try {
                    const results = await this.runContractValidation();
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(results));
                }
                catch (error) {
                    this.errorCount++;
                    this.logger.error('Contract validation failed', error);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        error: 'Contract validation failed',
                        message: error.message,
                        project: this.projectPath
                    }));
                }
            }
            else if (req.url === '/api/refactoring-analysis') {
                try {
                    const results = await this.runRefactoringAnalysis();
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(results));
                }
                catch (error) {
                    this.errorCount++;
                    this.logger.error('Refactoring analysis failed', error);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        error: 'Refactoring analysis failed',
                        message: error.message,
                        project: this.projectPath
                    }));
                }
            }
            else if (req.url === '/api/custom-refactoring-analysis' && req.method === 'POST') {
                let body = '';
                req.on('data', (chunk) => {
                    body += chunk.toString();
                });
                req.on('end', () => {
                    try {
                        const { violations } = JSON.parse(body);
                        if (!this.refactoringAnalyzer) {
                            this.refactoringAnalyzer = new refactoring_analyzer_1.RefactoringAnalyzer(this.projectPath);
                        }
                        const suggestions = this.refactoringAnalyzer.getRefactoringSuggestions(violations);
                        const totalImpact = {
                            patterns: suggestions.length,
                            totalFiles: suggestions.reduce((sum, s) => sum + (s.affectedFiles?.length || 0), 0),
                            totalReferences: suggestions.reduce((sum, s) => sum + (s.totalReferences || 0), 0),
                            highRiskChanges: suggestions.filter(s => s.riskLevel === 'HIGH').length
                        };
                        const results = { suggestions, totalImpact };
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(results));
                    }
                    catch (error) {
                        this.errorCount++;
                        this.logger.error('Custom refactoring analysis failed', error);
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({
                            error: 'Custom refactoring analysis failed',
                            message: error.message,
                            project: this.projectPath
                        }));
                    }
                });
            }
            else if (req.url === '/api/advanced-refactoring-analysis' && req.method === 'POST') {
                let body = '';
                req.on('data', (chunk) => {
                    body += chunk.toString();
                });
                req.on('end', () => {
                    try {
                        const { refactoringData } = JSON.parse(body);
                        if (!this.refactoringAnalyzer) {
                            this.refactoringAnalyzer = new refactoring_analyzer_1.RefactoringAnalyzer(this.projectPath);
                        }
                        // Convert refactoring data to violations format for analysis
                        let violations = [];
                        let suggestions = [];
                        switch (refactoringData.type) {
                            case 'rename':
                                violations = [{
                                        property: refactoringData.fromProperty,
                                        expected: refactoringData.toProperty,
                                        entity: refactoringData.entity,
                                        file: 'user-input',
                                        line: 1
                                    }];
                                suggestions = this.refactoringAnalyzer.getRefactoringSuggestions(violations);
                                break;
                            case 'add_column':
                                // Generate analysis for adding a new field
                                suggestions = [{
                                        pattern: `Add ${refactoringData.fieldName} (${refactoringData.dataType})`,
                                        fromProperty: 'N/A',
                                        toProperty: refactoringData.fieldName,
                                        entity: refactoringData.entity,
                                        totalFiles: 0,
                                        totalReferences: 0,
                                        riskLevel: 'LOW',
                                        estimatedMinutes: 5,
                                        affectedFiles: [],
                                        executionSteps: [
                                            {
                                                step: 1,
                                                description: `Add ${refactoringData.fieldName} field to ${refactoringData.entity}`,
                                                files: ['schema files', 'type definitions'],
                                                riskLevel: 'LOW',
                                                automated: true
                                            },
                                            {
                                                step: 2,
                                                description: 'Update forms and validation',
                                                files: ['UI components', 'validation schemas'],
                                                riskLevel: 'LOW',
                                                automated: false
                                            }
                                        ],
                                        dependencyChain: ['types', 'validation', 'UI forms']
                                    }];
                                break;
                            case 'change_type':
                                // Analyze impact of changing field type
                                const typeChangePattern = `${refactoringData.fieldName}: ${refactoringData.fromType} → ${refactoringData.toType}`;
                                const typeRisk = this.calculateTypeChangeRisk(refactoringData.fromType, refactoringData.toType);
                                suggestions = [{
                                        pattern: typeChangePattern,
                                        fromProperty: refactoringData.fieldName,
                                        toProperty: refactoringData.fieldName,
                                        entity: refactoringData.entity,
                                        totalFiles: typeRisk.files,
                                        totalReferences: typeRisk.references,
                                        riskLevel: typeRisk.level,
                                        estimatedMinutes: typeRisk.minutes,
                                        affectedFiles: [],
                                        executionSteps: [
                                            {
                                                step: 1,
                                                description: `Update ${refactoringData.fieldName} type definition`,
                                                files: ['type files', 'schema files'],
                                                riskLevel: typeRisk.level,
                                                automated: true
                                            },
                                            {
                                                step: 2,
                                                description: 'Migrate existing data',
                                                files: ['database', 'data files'],
                                                riskLevel: 'HIGH',
                                                automated: false
                                            },
                                            {
                                                step: 3,
                                                description: 'Update validation and parsing logic',
                                                files: ['validation', 'parsers', 'converters'],
                                                riskLevel: typeRisk.level,
                                                automated: false
                                            }
                                        ],
                                        dependencyChain: ['types', 'data', 'validation', 'UI']
                                    }];
                                break;
                            case 'remove_field':
                                // Analyze impact of removing a field
                                violations = [{
                                        property: refactoringData.fieldName,
                                        expected: 'REMOVED',
                                        entity: refactoringData.entity,
                                        file: 'user-input',
                                        line: 1
                                    }];
                                const baseAnalysis = this.refactoringAnalyzer.getRefactoringSuggestions(violations);
                                suggestions = baseAnalysis.map(s => ({
                                    ...s,
                                    pattern: `Remove ${refactoringData.fieldName}`,
                                    riskLevel: refactoringData.migrationStrategy === 'hard_delete' ? 'HIGH' : 'MEDIUM',
                                    executionSteps: [
                                        {
                                            step: 1,
                                            description: `${refactoringData.migrationStrategy === 'hard_delete' ? 'Hard delete' : 'Soft delete'} ${refactoringData.fieldName}`,
                                            files: ['schema files', 'type definitions'],
                                            riskLevel: refactoringData.migrationStrategy === 'hard_delete' ? 'HIGH' : 'LOW',
                                            automated: refactoringData.migrationStrategy !== 'data_migration'
                                        },
                                        ...(refactoringData.migrationStrategy === 'data_migration' ? [{
                                                step: 2,
                                                description: 'Migrate data to new field structure',
                                                files: ['data migration scripts'],
                                                riskLevel: 'MEDIUM',
                                                automated: false
                                            }] : []),
                                        {
                                            step: refactoringData.migrationStrategy === 'data_migration' ? 3 : 2,
                                            description: 'Remove field references from codebase',
                                            files: ['components', 'forms', 'validation'],
                                            riskLevel: 'MEDIUM',
                                            automated: false
                                        }
                                    ]
                                }));
                                break;
                            case 'restructure':
                                // Analyze impact of object restructuring
                                suggestions = [{
                                        pattern: `Restructure ${refactoringData.objectPath} (${refactoringData.restructureType})`,
                                        fromProperty: refactoringData.objectPath,
                                        toProperty: `${refactoringData.objectPath}_${refactoringData.restructureType}`,
                                        entity: refactoringData.entity,
                                        totalFiles: 5,
                                        totalReferences: 15,
                                        riskLevel: 'HIGH',
                                        estimatedMinutes: 30,
                                        affectedFiles: [],
                                        executionSteps: [
                                            {
                                                step: 1,
                                                description: `${refactoringData.restructureType} object structure`,
                                                files: ['type definitions', 'schema files'],
                                                riskLevel: 'HIGH',
                                                automated: false
                                            },
                                            {
                                                step: 2,
                                                description: 'Update all object references',
                                                files: ['components', 'utilities', 'services'],
                                                riskLevel: 'HIGH',
                                                automated: false
                                            },
                                            {
                                                step: 3,
                                                description: 'Migrate existing data structure',
                                                files: ['data migration', 'database updates'],
                                                riskLevel: 'HIGH',
                                                automated: false
                                            }
                                        ],
                                        dependencyChain: ['types', 'data', 'components', 'services']
                                    }];
                                break;
                            default:
                                throw new Error(`Unknown refactoring type: ${refactoringData.type}`);
                        }
                        const totalImpact = {
                            patterns: suggestions.length,
                            totalFiles: suggestions.reduce((sum, s) => sum + (s.totalFiles || 0), 0),
                            totalReferences: suggestions.reduce((sum, s) => sum + (s.totalReferences || 0), 0),
                            highRiskChanges: suggestions.filter(s => s.riskLevel === 'HIGH').length
                        };
                        const results = { suggestions, totalImpact };
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(results));
                    }
                    catch (error) {
                        this.errorCount++;
                        this.logger.error('Advanced refactoring analysis failed', error);
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({
                            error: 'Advanced refactoring analysis failed',
                            message: error.message,
                            project: this.projectPath
                        }));
                    }
                });
            }
            else if (req.url === '/api/test-violation' && req.method === 'POST') {
                try {
                    // Simple test: run the refactoring analyzer directly with a mock violation
                    if (!this.refactoringAnalyzer) {
                        this.refactoringAnalyzer = new refactoring_analyzer_1.RefactoringAnalyzer(this.projectPath);
                    }
                    const mockViolations = [
                        {
                            property: 'meal_type',
                            expected: 'type',
                            entity: 'MealRecord',
                            file: 'golden.examples.json',
                            line: 123
                        },
                        {
                            property: 'week_num',
                            expected: 'week_number',
                            entity: 'CurriculumWeek',
                            file: 'golden.examples.json',
                            line: 156
                        }
                    ];
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, message: 'Test violations added for demonstration' }));
                }
                catch (error) {
                    this.errorCount++;
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        error: 'Failed to add test violation',
                        message: error.message
                    }));
                }
            }
            else if (req.url?.startsWith('/api/architecture-data')) {
                const url = new URL(req.url, `http://localhost:${PORT}`);
                const type = url.searchParams.get('type');
                const data = await this.getArchitectureData(type || 'component');
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(data));
            }
            else if (req.url === '/api/boundaries') {
                const boundaryResults = this.runBoundaryValidation();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(boundaryResults));
            }
            else if (req.url === '/api/map-validation') {
                const mapResults = this.runMapValidation();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(mapResults));
            }
            else if (req.url === '/api/versions') {
                const versionResults = this.runVersionValidation();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(versionResults));
            }
            else if (req.url === '/api/design-system') {
                const designResults = this.runDesignSystemValidation();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(designResults));
            }
            else if (req.url === '/api/snapshots' && req.method === 'POST') {
                // Save a new snapshot to .observer/snapshots/
                let body = '';
                req.on('data', (chunk) => {
                    body += chunk.toString();
                });
                req.on('end', () => {
                    try {
                        const snapshot = JSON.parse(body);
                        const snapshotsDir = path.join(this.projectPath, '.observer', 'snapshots');
                        // Ensure directory exists
                        if (!fs.existsSync(snapshotsDir)) {
                            fs.mkdirSync(snapshotsDir, { recursive: true });
                        }
                        // Generate filename with timestamp
                        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                        const filename = `snapshot-${timestamp}.json`;
                        const filePath = path.join(snapshotsDir, filename);
                        // Save snapshot
                        fs.writeFileSync(filePath, JSON.stringify(snapshot, null, 2));
                        // Cleanup old snapshots (keep last 10)
                        const files = fs.readdirSync(snapshotsDir)
                            .filter(f => f.startsWith('snapshot-') && f.endsWith('.json'))
                            .map(f => ({ name: f, path: path.join(snapshotsDir, f), stats: fs.statSync(path.join(snapshotsDir, f)) }))
                            .sort((a, b) => b.stats.mtime.getTime() - a.stats.mtime.getTime());
                        // Remove old files (keep newest 10)
                        files.slice(10).forEach(file => {
                            fs.unlinkSync(file.path);
                        });
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: true, filename }));
                    }
                    catch (error) {
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: error.message }));
                    }
                });
            }
            else if (req.url === '/api/schema-intelligence') {
                // Schema intelligence for smart refactoring (REUSING TypeExtractor)
                try {
                    const TypeExtractor = require('../analyzer/type-extractor').TypeExtractor;
                    const extractor = new TypeExtractor();
                    const typeSystem = await extractor.extract(this.projectPath);
                    // Transform to simple entity->fields mapping
                    const entities = {};
                    for (const def of [...typeSystem.interfaces, ...typeSystem.types]) {
                        entities[def.name] = {
                            fields: def.properties.map((p) => p.name),
                            types: Object.fromEntries(def.properties.map((p) => [p.name, p.type]))
                        };
                    }
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ entities, count: Object.keys(entities).length }));
                }
                catch (error) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: error.message, entities: {} }));
                }
            }
            else if (req.url === '/api/snapshots' && req.method === 'GET') {
                // Get list of snapshots
                try {
                    const snapshotsDir = path.join(this.projectPath, '.observer', 'snapshots');
                    if (!fs.existsSync(snapshotsDir)) {
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ snapshots: [] }));
                        return;
                    }
                    const files = fs.readdirSync(snapshotsDir)
                        .filter(f => f.startsWith('snapshot-') && f.endsWith('.json'))
                        .map(f => {
                        const filePath = path.join(snapshotsDir, f);
                        const stats = fs.statSync(filePath);
                        const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
                        return {
                            filename: f,
                            timestamp: content.timestamp,
                            total: content.total,
                            blockers: content.blockers,
                            structural: content.structural,
                            compliance: content.compliance,
                            diff: content.diff || 0
                        };
                    })
                        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ snapshots: files }));
                }
                catch (error) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: error.message }));
                }
            }
            else if (req.url?.startsWith('/api/snapshots/') && req.method === 'GET') {
                // Get specific snapshot with full data for comparison
                try {
                    const filename = req.url.split('/').pop();
                    const snapshotsDir = path.join(this.projectPath, '.observer', 'snapshots');
                    const filePath = path.join(snapshotsDir, filename || '');
                    if (fs.existsSync(filePath)) {
                        const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(content));
                    }
                    else {
                        res.writeHead(404, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Snapshot not found' }));
                    }
                }
                catch (error) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: error.message }));
                }
            }
            else if (req.url === '/modular-fixed') {
                const modularFixedPath = path.join(__dirname, 'modular-fixed.html');
                const html = fs.readFileSync(modularFixedPath, 'utf-8');
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(html);
            }
            else if (req.url === '/theme-config.js') {
                const themePath = path.join(__dirname, 'theme-config.js');
                if (fs.existsSync(themePath)) {
                    const js = fs.readFileSync(themePath, 'utf-8');
                    res.writeHead(200, { 'Content-Type': 'application/javascript' });
                    res.end(js);
                }
                else {
                    res.writeHead(404);
                    res.end();
                }
            }
            else if (req.url === '/components/cta-analysis-view.js') {
                const ctaPath = path.join(__dirname, 'components', 'cta-analysis-view.js');
                if (fs.existsSync(ctaPath)) {
                    const js = fs.readFileSync(ctaPath, 'utf-8');
                    res.writeHead(200, { 'Content-Type': 'application/javascript' });
                    res.end(js);
                }
                else {
                    res.writeHead(404);
                    res.end();
                }
            }
            else if (req.url?.startsWith('/components/') && req.url?.endsWith('.js')) {
                // Serve component JavaScript files
                const componentName = req.url.replace('/components/', '');
                const componentPath = path.join(__dirname, 'components', componentName);
                if (fs.existsSync(componentPath)) {
                    const js = fs.readFileSync(componentPath, 'utf-8');
                    res.writeHead(200, { 'Content-Type': 'application/javascript' });
                    res.end(js);
                }
                else {
                    res.writeHead(404);
                    res.end();
                }
            }
            else if (req.url === '/') {
                // Redirect to modular-fixed as the default
                res.writeHead(302, { 'Location': '/modular-fixed' });
                res.end();
            }
            else {
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
    async mapTables() {
        this.tableMapper = new table_mapper_1.TableMapper(this.projectPath);
        const results = await this.tableMapper.analyze();
        // Convert Map to serializable object
        this.tableMappingResults = {
            ...results,
            tables: Object.fromEntries(results.tables)
        };
        return this.tableMappingResults;
    }
    async runNineRulesValidation() {
        this.nineRulesValidator = new nine_rules_validator_1.NineRulesValidator(this.projectPath);
        this.nineRulesResults = await this.nineRulesValidator.validateAll();
        return this.nineRulesResults;
    }
    async runCTAValidation() {
        this.ctaValidator = new cta_validator_1.CTAValidator(this.projectPath);
        this.ctaResults = await this.ctaValidator.validate();
        return this.ctaResults;
    }
    async getArchitectureData(type) {
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
                const tables = Object.entries(this.tableMappingResults?.tables || {}).map(([name, table]) => {
                    // Count contract violations for this table
                    const tableContractViolations = contractsData.violations?.filter((violation) => violation.table === name || violation.location?.includes(name)) || [];
                    const contractErrors = tableContractViolations.filter((v) => v.type === 'error').length;
                    const contractWarnings = tableContractViolations.filter((v) => v.type === 'warning').length;
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
            const items = allFiles.map((filePath) => {
                const item = this.createArchitectureItem(filePath, type);
                // Count contract violations - separate errors and warnings
                const fileContractViolations = contractsData.violations?.filter((violation) => violation.location?.includes(filePath)) || [];
                const contractErrors = fileContractViolations.filter((v) => v.type === 'error').length;
                const contractWarnings = fileContractViolations.filter((v) => v.type === 'warning').length;
                // Count nine-rules issues - separate critical and warnings
                const fileCQIssues = this.getNineRulesIssuesForFile(nineRulesData, filePath);
                const codeQualityErrors = fileCQIssues.filter((i) => i.severity === 'critical').length;
                const codeQualityWarnings = fileCQIssues.filter((i) => i.severity === 'warning').length;
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
        }
        catch (error) {
            console.error('Error getting architecture data:', error);
            return [];
        }
    }
    createArchitectureItem(filePath, type) {
        let name;
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
    getNineRulesIssuesForFile(nineRulesData, filePath) {
        if (!nineRulesData?.results)
            return [];
        const issues = [];
        nineRulesData.results.forEach((rule) => {
            rule.issues?.forEach((issue) => {
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
    calculateHealthScore(errors, warnings) {
        if (errors === 0 && warnings === 0)
            return 100;
        // Objective scoring:
        // - Critical errors: 20 points each (max 80 points deduction)
        // - Warnings: 5 points each (max 20 points deduction)
        const errorDeduction = Math.min(errors * 20, 80);
        const warningDeduction = Math.min(warnings * 5, 20);
        return Math.max(0, 100 - errorDeduction - warningDeduction);
    }
    // New method to calculate health based on smart analysis buckets
    calculateSmartHealthScore(blockers, structural, compliance) {
        if (blockers === 0 && structural === 0 && compliance === 0)
            return 100;
        // Smart scoring based on issue type:
        // - BLOCKERS: 30 points each (these will break the app!)
        // - STRUCTURAL: 10 points each (architecture issues)
        // - COMPLIANCE: 2 points each (code quality)
        const blockerDeduction = Math.min(blockers * 30, 70); // Max 70% deduction
        const structuralDeduction = Math.min(structural * 10, 20); // Max 20% deduction
        const complianceDeduction = Math.min(compliance * 2, 10); // Max 10% deduction
        return Math.max(0, 100 - blockerDeduction - structuralDeduction - complianceDeduction);
    }
    async runContractValidation() {
        console.log('📋 Running contract validation...');
        try {
            if (!this.contractValidator) {
                this.contractValidator = new contract_validator_1.ContractValidator(this.projectPath);
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
            }
            catch (runtimeError) {
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
        }
        catch (error) {
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
    async runRefactoringAnalysis() {
        console.log('🔧 Running refactoring impact analysis...');
        try {
            if (!this.refactoringAnalyzer) {
                this.refactoringAnalyzer = new refactoring_analyzer_1.RefactoringAnalyzer(this.projectPath);
            }
            // Get current contract violations to generate refactoring suggestions
            const contractResults = this.contractResults || await this.runContractValidation();
            let violations = contractResults.violations || [];
            // For demonstration purposes, if no violations found, use mock data
            if (violations.length === 0) {
                console.log('🧪 No real violations found - using demo violations for refactoring analysis');
                violations = [
                    {
                        property: 'meal_type',
                        expected: 'type',
                        entity: 'MealRecord',
                        file: 'golden.examples.json',
                        line: 123
                    },
                    {
                        property: 'week_num',
                        expected: 'week_number',
                        entity: 'CurriculumWeek',
                        file: 'golden.examples.json',
                        line: 156
                    }
                ];
            }
            if (violations.length === 0) {
                return {
                    suggestions: [],
                    totalImpact: {
                        patterns: 0,
                        totalFiles: 0,
                        totalReferences: 0,
                        highRiskChanges: 0
                    }
                };
            }
            // Generate refactoring suggestions based on violations
            const suggestions = this.refactoringAnalyzer.getRefactoringSuggestions(violations);
            // Calculate overall impact metrics
            const totalImpact = {
                patterns: suggestions.length,
                totalFiles: suggestions.reduce((sum, s) => sum + s.totalFiles, 0),
                totalReferences: suggestions.reduce((sum, s) => sum + s.totalReferences, 0),
                highRiskChanges: suggestions.filter(s => s.riskLevel === 'HIGH').length
            };
            return {
                suggestions,
                totalImpact,
                projectPath: this.projectPath,
                generatedAt: new Date().toISOString()
            };
        }
        catch (error) {
            console.error('Error in refactoring analysis:', error);
            return {
                suggestions: [],
                totalImpact: {
                    patterns: 0,
                    totalFiles: 0,
                    totalReferences: 0,
                    highRiskChanges: 0
                },
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    runMapValidation() {
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
        }
        catch (error) {
            console.error('Map validation error:', error);
            return {
                violations: [],
                score: 0,
                summary: { error: error.message },
                files: {},
                exports: {},
                imports: {},
                contractDetections: null
            };
        }
    }
    runBoundaryValidation() {
        const validator = new boundary_validator_1.BoundaryValidator(this.projectPath);
        const results = validator.analyze();
        // Group by type for dashboard
        const byType = {};
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
    runVersionValidation() {
        const validator = new version_validator_1.VersionValidator(this.projectPath);
        return validator.validate();
    }
    runDesignSystemValidation() {
        const validator = new design_system_validator_1.DesignSystemValidator(this.projectPath);
        return validator.validate();
    }
    calculateTypeChangeRisk(fromType, toType) {
        const riskMatrix = {
            'string->number': { level: 'HIGH', files: 8, references: 25, minutes: 20 },
            'string->boolean': { level: 'MEDIUM', files: 4, references: 12, minutes: 10 },
            'string->date': { level: 'HIGH', files: 6, references: 18, minutes: 15 },
            'number->string': { level: 'MEDIUM', files: 5, references: 15, minutes: 12 },
            'number->boolean': { level: 'HIGH', files: 7, references: 20, minutes: 18 },
            'number->date': { level: 'HIGH', files: 8, references: 24, minutes: 22 },
            'boolean->string': { level: 'LOW', files: 3, references: 8, minutes: 8 },
            'boolean->number': { level: 'MEDIUM', files: 4, references: 12, minutes: 10 },
            'date->string': { level: 'MEDIUM', files: 5, references: 16, minutes: 12 },
            'date->number': { level: 'HIGH', files: 6, references: 18, minutes: 15 }
        };
        const key = `${fromType}->${toType}`;
        return riskMatrix[key] || {
            level: 'MEDIUM',
            files: 3,
            references: 10,
            minutes: 10
        };
    }
    async discoverProjectFiles(type = 'all') {
        const files = [];
        const walkDir = (dir) => {
            if (!fs.existsSync(dir))
                return;
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
                }
                else if (item.isFile()) {
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
                        // Filter by type if specified
                        switch (type) {
                            case 'hooks':
                                if (relativePath.startsWith('src/') &&
                                    (relativePath.includes('/hooks/') || /^use[A-Z]/.test(item.name))) {
                                    files.push(fullPath);
                                }
                                break;
                            case 'components':
                                if (relativePath.startsWith('src/') && relativePath.includes('/components/')) {
                                    files.push(fullPath);
                                }
                                break;
                            case 'api':
                                if (relativePath.includes('/api/')) {
                                    files.push(fullPath);
                                }
                                break;
                            case 'pages':
                                // Pages are in app/ directory, not src/
                                if (relativePath.startsWith('app/') && !relativePath.includes('/api/') &&
                                    !relativePath.includes('/ui-components/') &&
                                    (item.name === 'page.tsx' || item.name === 'page.ts')) {
                                    files.push(fullPath);
                                }
                                break;
                            case 'all':
                            default:
                                // Include files from both src/ and app/ directories
                                if (relativePath.startsWith('src/') || relativePath.startsWith('app/')) {
                                    files.push(fullPath);
                                }
                                break;
                        }
                    }
                }
            }
        };
        // Walk from both src and app directories
        const srcPath = path.join(this.projectPath, 'src');
        const appPath = path.join(this.projectPath, 'app');
        if (fs.existsSync(srcPath)) {
            walkDir(srcPath);
        }
        if (fs.existsSync(appPath)) {
            walkDir(appPath);
        }
        // If neither exists, walk from project root
        if (!fs.existsSync(srcPath) && !fs.existsSync(appPath)) {
            walkDir(this.projectPath);
        }
        return files;
    }
}
async function startDashboard() {
    PORT = process.env.DASHBOARD_PORT ? parseInt(process.env.DASHBOARD_PORT) : await findAvailablePort(3001);
    const dashboard = new Dashboard();
    await dashboard.start();
}
startDashboard();
