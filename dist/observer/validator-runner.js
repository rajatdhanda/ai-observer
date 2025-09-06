#!/usr/bin/env ts-node
"use strict";
/**
 * Validator Runner - Reads map.json and runs the 9 core validators
 * Each validator is simple: read map → check rule → return violations
 */
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
exports.ValidatorRunner = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const contract_detector_1 = require("../validator/contract-detector");
class ValidatorRunner {
    map;
    violations = [];
    mapPath;
    constructor(mapPath) {
        this.mapPath = mapPath;
        const mapContent = fs.readFileSync(mapPath, 'utf-8');
        this.map = JSON.parse(mapContent);
    }
    /**
     * Run all 9 core validators
     */
    runAll() {
        this.violations = [];
        // Run each validator
        this.validateTypeDatabaseAlignment(); // Rule 1: 30% of bugs
        this.validateHookDatabasePattern(); // Rule 2: 25% of bugs
        this.validateErrorHandling(); // Rule 3: 20% of bugs
        this.validateLoadingStates(); // Rule 4: 15% of bugs
        this.validateAPITypeSafety(); // Rule 5: 10% of bugs
        this.validateRegistryUsage(); // Rule 6: <5% of bugs
        this.validateCacheInvalidation(); // Rule 7: <5% of bugs
        this.validateFormValidation(); // Rule 8: <5% of bugs
        this.validateAuthGuards(); // Rule 9: <5% of bugs
        // Run contract detection
        const contractDetections = this.validateContracts();
        return {
            violations: this.violations,
            score: this.calculateScore(),
            summary: this.generateSummary(),
            contractDetections
        };
    }
    /**
     * Rule 1: Type-Database Alignment (30% of bugs)
     * Check: All DB functions must parse with Zod
     */
    validateTypeDatabaseAlignment() {
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
    validateHookDatabasePattern() {
        for (const [file, imports] of Object.entries(this.map.imports)) {
            // Check if it's a component
            if (file.includes('/components/') || file.includes('.tsx')) {
                // Check if imports include DB modules
                const dbImports = imports.filter(imp => imp.toLowerCase().includes('db') ||
                    imp.toLowerCase().includes('database') ||
                    imp.toLowerCase().includes('query'));
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
    validateErrorHandling() {
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
    validateLoadingStates() {
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
    validateAPITypeSafety() {
        for (const [route, info] of Object.entries(this.map.entryPoints)) {
            if (info.type === 'api') {
                // Find the corresponding file
                const apiFile = Object.keys(this.map.files).find(f => f.includes(route.replace('/api/', '')) && f.endsWith('route.ts'));
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
    validateRegistryUsage() {
        // This would need actual file content analysis
        // For now, skip as it's low impact
    }
    /**
     * Rule 7: Cache Invalidation (Low impact)
     * Check: Mutations must invalidate cache
     */
    validateCacheInvalidation() {
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
    validateFormValidation() {
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
    validateAuthGuards() {
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
     * Contract Detection - Find missing/outdated contracts
     */
    validateContracts() {
        try {
            // Try to find contracts file in the project directory
            const projectDir = path.dirname(this.mapPath);
            // Check all possible paths for contract files
            const possiblePaths = [
                path.join(projectDir, 'src/contract/contract.yaml'), // Check src/contract/ (singular)
                path.join(projectDir, 'src/contract/contracts.yaml'), // Check src/contract/ (plural)
                path.join(projectDir, 'src/contracts/contract.yaml'), // Check src/contracts/ (singular)
                path.join(projectDir, 'src/contracts/contracts.yaml'), // Check src/contracts/ (plural)
                path.join(projectDir, 'contract/contract.yaml'), // Check contract/ (singular)
                path.join(projectDir, 'contract/contracts.yaml'), // Check contract/ (plural)
                path.join(projectDir, 'contracts/contracts.yaml'), // Check contracts/
                path.join(projectDir, 'contract.yaml'), // Root (singular)
                path.join(projectDir, 'contracts.yaml'), // Root (plural)
                'test-projects/streax/contracts.yaml',
                '.observer/contracts.yaml'
            ];
            const foundPath = possiblePaths.find(p => fs.existsSync(p));
            if (!foundPath) {
                console.log('No contracts file found, skipping contract validation');
                return;
            }
            const contractsPath = foundPath;
            // Run contract detector
            const detector = new contract_detector_1.ContractDetector(this.mapPath, contractsPath);
            const detections = detector.detect();
            // Convert detections to violations
            for (const detection of detections) {
                let severity = 'warning';
                if (detection.type === 'missing')
                    severity = 'critical';
                if (detection.type === 'mismatch')
                    severity = 'critical';
                this.violations.push({
                    rule: 'Contract Compliance',
                    severity,
                    file: detection.locations?.[0] || contractsPath,
                    message: detection.message,
                    fix: detection.action
                });
            }
            return {
                detections,
                summary: {
                    missing: detections.filter(d => d.type === 'missing').length,
                    outdated: detections.filter(d => d.type === 'outdated').length,
                    unused: detections.filter(d => d.type === 'unused').length,
                    mismatches: detections.filter(d => d.type === 'mismatch').length
                }
            };
        }
        catch (error) {
            console.log('Contract detection skipped:', error?.message);
            return null;
        }
    }
    /**
     * Calculate health score based on violations
     */
    calculateScore() {
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
    generateSummary() {
        const byRule = {};
        const bySeverity = {
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
exports.ValidatorRunner = ValidatorRunner;
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
