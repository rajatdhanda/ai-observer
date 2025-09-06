"use strict";
/**
 * Smart Refactoring Impact Analysis Engine
 * Analyzes codebase impact for contract violations and generates safe refactoring plans
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
exports.RefactoringAnalyzer = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class RefactoringAnalyzer {
    projectPath;
    constructor(projectPath) {
        this.projectPath = projectPath;
    }
    /**
     * Analyze impact of changing a property across the codebase
     */
    analyzeRefactoringImpact(fromProperty, toProperty, entity) {
        const affectedFiles = this.findAffectedFiles(fromProperty);
        const fileImpacts = this.analyzeFileImpacts(affectedFiles, fromProperty, toProperty);
        const riskLevel = this.calculateOverallRisk(fileImpacts);
        const executionSteps = this.generateExecutionPlan(fileImpacts, fromProperty, toProperty, entity);
        return {
            pattern: `${fromProperty} → ${toProperty}`,
            fromProperty,
            toProperty,
            entity,
            totalFiles: fileImpacts.length,
            totalReferences: fileImpacts.reduce((sum, f) => sum + f.references, 0),
            riskLevel,
            estimatedMinutes: this.estimateTime(fileImpacts, riskLevel),
            affectedFiles: fileImpacts,
            executionSteps,
            dependencyChain: this.buildDependencyChain(entity)
        };
    }
    /**
     * Find all files that reference a specific property
     */
    findAffectedFiles(property) {
        const files = [];
        // Search in common directories
        const searchDirs = [
            path.join(this.projectPath, 'src'),
            path.join(this.projectPath, 'app'),
            path.join(this.projectPath, 'components'),
            path.join(this.projectPath, 'types')
        ];
        console.log(`🔍 Searching for "${property}" in directories:`, searchDirs.filter(d => fs.existsSync(d)));
        for (const dir of searchDirs) {
            if (fs.existsSync(dir)) {
                files.push(...this.scanDirectoryForProperty(dir, property));
            }
        }
        return files;
    }
    /**
     * Recursively scan directory for files containing the property
     */
    scanDirectoryForProperty(dir, property) {
        const files = [];
        try {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
                    files.push(...this.scanDirectoryForProperty(fullPath, property));
                }
                else if (this.isRelevantFile(entry.name)) {
                    if (this.fileContainsProperty(fullPath, property)) {
                        files.push(fullPath);
                    }
                }
            }
        }
        catch (error) {
            // Skip directories we can't read
        }
        return files;
    }
    /**
     * Check if file is relevant for refactoring analysis
     */
    isRelevantFile(filename) {
        const extensions = ['.ts', '.tsx', '.js', '.jsx', '.json', '.yaml', '.yml'];
        return extensions.some(ext => filename.endsWith(ext));
    }
    /**
     * Check if file contains the property (using same logic as validation)
     */
    fileContainsProperty(filePath, property) {
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            // Use same patterns as comprehensive validator
            const patterns = [
                `.${property}`, // object.property
                `['${property}']`, // object['property']
                `["${property}"]`, // object["property"]
                `${property}:`, // { property: value }
                `${property} =`, // property = value
                `"${property}":` // JSON "property": value
            ];
            const found = patterns.some(pattern => content.includes(pattern));
            if (found) {
                console.log(`✅ Found "${property}" in ${path.basename(filePath)}`);
            }
            return found;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Analyze impact for each affected file
     */
    analyzeFileImpacts(files, fromProperty, toProperty) {
        return files.map(file => {
            const content = fs.readFileSync(file, 'utf-8');
            const references = this.countReferences(content, fromProperty);
            const type = this.determineFileType(file);
            const riskLevel = this.calculateFileRisk(type, references);
            const previewChanges = this.generatePreviewChanges(content, file, fromProperty, toProperty);
            return {
                path: path.relative(this.projectPath, file),
                type,
                references,
                riskLevel,
                previewChanges
            };
        });
    }
    /**
     * Count references to property in file content
     */
    countReferences(content, property) {
        const patterns = [
            `.${property}`,
            `['${property}']`,
            `["${property}"]`,
            `${property}:`,
            `${property} =`,
            `"${property}"` // JSON property names
        ];
        return patterns.reduce((count, pattern) => {
            const matches = content.split(pattern).length - 1;
            return count + matches;
        }, 0);
    }
    /**
     * Determine file type for risk assessment
     */
    determineFileType(filePath) {
        const fileName = path.basename(filePath).toLowerCase();
        const dirName = path.dirname(filePath).toLowerCase();
        if (fileName.includes('contract') || fileName.includes('golden') || fileName.endsWith('.yaml') || fileName.endsWith('.yml')) {
            return 'contract';
        }
        if (fileName.includes('type') || dirName.includes('types')) {
            return 'type';
        }
        if (fileName.includes('test') || fileName.includes('spec') || dirName.includes('test')) {
            return 'test';
        }
        if (dirName.includes('db') || dirName.includes('database') || fileName.includes('schema')) {
            return 'database';
        }
        return 'component';
    }
    /**
     * Calculate risk level for individual file
     */
    calculateFileRisk(type, references) {
        // Database changes are always high risk
        if (type === 'database')
            return 'HIGH';
        // Many references increase risk
        if (references > 10)
            return 'HIGH';
        if (references > 3)
            return 'MEDIUM';
        // Contract and type changes are generally safe
        if (type === 'contract' || type === 'type')
            return 'LOW';
        return 'MEDIUM';
    }
    /**
     * Generate preview of changes for a file
     */
    generatePreviewChanges(content, filePath, fromProperty, toProperty) {
        const lines = content.split('\n');
        const previews = [];
        lines.forEach((line, index) => {
            if (line.includes(fromProperty)) {
                // Generate preview of the change
                const before = line.trim();
                const after = line.replace(new RegExp(`\\b${fromProperty}\\b`, 'g'), toProperty).trim();
                if (before !== after) {
                    previews.push({
                        line: index + 1,
                        before,
                        after,
                        context: path.basename(filePath)
                    });
                }
            }
        });
        return previews.slice(0, 3); // Limit to 3 previews per file
    }
    /**
     * Calculate overall risk level
     */
    calculateOverallRisk(fileImpacts) {
        const hasHighRisk = fileImpacts.some(f => f.riskLevel === 'HIGH');
        const hasMediumRisk = fileImpacts.some(f => f.riskLevel === 'MEDIUM');
        if (hasHighRisk)
            return 'HIGH';
        if (hasMediumRisk)
            return 'MEDIUM';
        return 'LOW';
    }
    /**
     * Estimate time required for refactoring
     */
    estimateTime(fileImpacts, riskLevel) {
        const baseTime = fileImpacts.length * 2; // 2 minutes per file
        const riskMultiplier = riskLevel === 'HIGH' ? 2 : riskLevel === 'MEDIUM' ? 1.5 : 1;
        return Math.ceil(baseTime * riskMultiplier);
    }
    /**
     * Generate step-by-step execution plan
     */
    generateExecutionPlan(fileImpacts, fromProperty, toProperty, entity) {
        const steps = [];
        // Step 1: Update contracts first
        const contractFiles = fileImpacts.filter(f => f.type === 'contract').map(f => f.path);
        if (contractFiles.length > 0) {
            steps.push({
                step: 1,
                description: 'Update contract definitions',
                files: contractFiles,
                riskLevel: 'LOW',
                automated: true
            });
        }
        // Step 2: Update type definitions  
        const typeFiles = fileImpacts.filter(f => f.type === 'type').map(f => f.path);
        if (typeFiles.length > 0) {
            steps.push({
                step: steps.length + 1,
                description: 'Update type definitions',
                files: typeFiles,
                riskLevel: 'LOW',
                automated: true
            });
        }
        // Step 3: Update components
        const componentFiles = fileImpacts.filter(f => f.type === 'component').map(f => f.path);
        if (componentFiles.length > 0) {
            steps.push({
                step: steps.length + 1,
                description: 'Update UI components',
                files: componentFiles,
                riskLevel: 'MEDIUM',
                automated: true
            });
        }
        // Step 4: Update database (manual review required)
        const dbFiles = fileImpacts.filter(f => f.type === 'database').map(f => f.path);
        if (dbFiles.length > 0) {
            steps.push({
                step: steps.length + 1,
                description: 'Update database schemas (manual review)',
                files: dbFiles,
                riskLevel: 'HIGH',
                automated: false
            });
        }
        // Final step: Validation
        steps.push({
            step: steps.length + 1,
            description: 'Run validation and tests',
            files: ['Full codebase validation'],
            riskLevel: 'LOW',
            automated: true
        });
        return steps;
    }
    /**
     * Build dependency chain for entity
     */
    buildDependencyChain(entity) {
        // Standard dependency order for most entities
        return [
            'contracts.yaml',
            'types/index.ts',
            'components/*.tsx',
            'database/schema'
        ];
    }
    /**
     * Get refactoring suggestions for current violations
     */
    getRefactoringSuggestions(violations) {
        const suggestions = [];
        // Group violations by pattern
        const violationMap = new Map();
        violations.forEach(violation => {
            const key = `${violation.property}→${violation.expected}`;
            if (!violationMap.has(key)) {
                violationMap.set(key, []);
            }
            violationMap.get(key).push(violation);
        });
        // Generate impact analysis for each unique pattern
        violationMap.forEach((groupedViolations, pattern) => {
            const violation = groupedViolations[0];
            const impact = this.analyzeRefactoringImpact(violation.property, violation.expected, violation.entity);
            suggestions.push(impact);
        });
        return suggestions.sort((a, b) => b.totalReferences - a.totalReferences);
    }
}
exports.RefactoringAnalyzer = RefactoringAnalyzer;
