"use strict";
/**
 * Contract Detector - Identifies missing and outdated contracts
 * Works with map.json to detect what needs contract definition
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
exports.ContractDetector = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const yaml = __importStar(require("js-yaml"));
class ContractDetector {
    mapPath;
    projectPath;
    mapData;
    contracts = {};
    detections = [];
    constructor(mapPath, projectPath) {
        this.mapPath = mapPath;
        this.projectPath = projectPath;
        this.loadData();
    }
    loadData() {
        // Load map.json
        if (fs.existsSync(this.mapPath)) {
            const mapContent = fs.readFileSync(this.mapPath, 'utf-8');
            this.mapData = JSON.parse(mapContent);
        }
        // Determine project path
        const basePath = this.projectPath || path.dirname(this.mapPath);
        // Look for contracts in standard location: /src/contracts
        const contractPaths = [
            path.join(basePath, 'src/contracts'),
            path.join(basePath, 'contracts') // fallback
        ];
        // Load all contract files (schemas, golden-examples, ai-fixes)
        for (const contractPath of contractPaths) {
            if (fs.existsSync(contractPath)) {
                this.loadContractsFromDirectory(contractPath);
                break; // Use first found
            }
        }
    }
    loadContractsFromDirectory(dir) {
        // Load contracts.yaml
        const contractsFile = path.join(dir, 'contracts.yaml');
        if (fs.existsSync(contractsFile)) {
            const content = fs.readFileSync(contractsFile, 'utf-8');
            const data = yaml.load(content);
            this.contracts = data.contracts || data;
        }
        // Load golden.examples.json
        const goldenFile = path.join(dir, 'golden.examples.json');
        if (fs.existsSync(goldenFile)) {
            const content = fs.readFileSync(goldenFile, 'utf-8');
            const examples = JSON.parse(content);
            // Merge examples into contracts
            for (const [entity, exampleData] of Object.entries(examples)) {
                if (!this.contracts[entity]) {
                    this.contracts[entity] = {};
                }
                this.contracts[entity].examples = exampleData;
            }
        }
        // Load fixes.json (AI error fixes)
        const fixesFile = path.join(dir, 'fixes.json');
        if (fs.existsSync(fixesFile)) {
            // Store fixes separately for reference
            const content = fs.readFileSync(fixesFile, 'utf-8');
            this.aiFixes = JSON.parse(content);
        }
    }
    aiFixes = {};
    /**
     * Main detection method
     */
    detect() {
        this.detections = [];
        // 1. Check for entities without contracts
        this.detectMissingContracts();
        // 2. Check for fields not in contracts
        this.detectNewFields();
        // 3. Check for unused contracts
        this.detectUnusedContracts();
        // 4. Check for naming mismatches
        this.detectNamingMismatches();
        return this.detections;
    }
    /**
     * Detect entities in code that have no contract
     */
    detectMissingContracts() {
        // Check tables found in map
        if (this.mapData.tables) {
            for (const tableName of Object.keys(this.mapData.tables)) {
                if (!this.contracts[tableName]) {
                    this.detections.push({
                        type: 'missing',
                        entity: tableName,
                        message: `Entity '${tableName}' found in code but no contract defined`,
                        action: `Add '${tableName}' contract to contracts.yaml`,
                        locations: this.mapData.tables[tableName].files || []
                    });
                }
            }
        }
        // Check for interface/type definitions not in contracts
        for (const [filePath, fileData] of Object.entries(this.mapData.exports || {})) {
            if (Array.isArray(fileData)) {
                fileData.forEach((exp) => {
                    // Look for patterns like UserInterface, OrderType, etc.
                    if (exp.name && (exp.name.endsWith('Interface') ||
                        exp.name.endsWith('Type') ||
                        exp.name.startsWith('I'))) {
                        const entityName = this.extractEntityName(exp.name);
                        if (!this.contracts[entityName] && !this.detections.find(d => d.entity === entityName)) {
                            this.detections.push({
                                type: 'missing',
                                entity: entityName,
                                message: `Type '${exp.name}' exported but no contract for '${entityName}'`,
                                action: `Consider adding '${entityName}' contract`,
                                locations: [filePath]
                            });
                        }
                    }
                });
            }
        }
    }
    /**
     * Detect fields used in code but not in contracts
     */
    detectNewFields() {
        // This would need actual AST parsing for accuracy
        // For now, we'll check common patterns
        for (const [contractName, contract] of Object.entries(this.contracts)) {
            const tableData = this.mapData.tables?.[contractName];
            if (!tableData)
                continue;
            const contractFields = new Set(Object.keys(contract.schema || {}));
            const suspectedNewFields = [];
            // Check files that use this entity
            for (const filePath of tableData.files || []) {
                const fileContent = this.readFileContent(filePath);
                if (!fileContent)
                    continue;
                // Look for field access patterns
                const fieldPatterns = [
                    new RegExp(`\\.([a-zA-Z_][a-zA-Z0-9_]*)`, 'g'), // object.field
                    new RegExp(`\\["([a-zA-Z_][a-zA-Z0-9_]*)"\\]`, 'g'), // object["field"]
                    new RegExp(`['"]([a-zA-Z_][a-zA-Z0-9_]*)['"]\\s*:`, 'g') // "field": value
                ];
                fieldPatterns.forEach(pattern => {
                    let match;
                    while ((match = pattern.exec(fileContent)) !== null) {
                        const field = match[1];
                        // If field is not in contract and looks like it belongs to this entity
                        if (!contractFields.has(field) &&
                            !field.startsWith('_') &&
                            field.length > 2 &&
                            !suspectedNewFields.includes(field)) {
                            // Heuristic: if near entity name mention
                            const contextStart = Math.max(0, match.index - 100);
                            const contextEnd = Math.min(fileContent.length, match.index + 100);
                            const context = fileContent.substring(contextStart, contextEnd).toLowerCase();
                            if (context.includes(contractName.toLowerCase())) {
                                suspectedNewFields.push(field);
                            }
                        }
                    }
                });
            }
            if (suspectedNewFields.length > 0) {
                this.detections.push({
                    type: 'outdated',
                    entity: contractName,
                    message: `Fields used in code but not in contract`,
                    action: `Add these fields to ${contractName} contract`,
                    fields: suspectedNewFields,
                    locations: tableData.files
                });
            }
        }
    }
    /**
     * Detect contracts that aren't used in code
     */
    detectUnusedContracts() {
        for (const contractName of Object.keys(this.contracts)) {
            const tableData = this.mapData.tables?.[contractName];
            if (!tableData || !tableData.files || tableData.files.length === 0) {
                this.detections.push({
                    type: 'unused',
                    entity: contractName,
                    message: `Contract defined but not used in code`,
                    action: `Remove '${contractName}' from contracts or implement it`
                });
            }
        }
    }
    /**
     * Detect snake_case vs camelCase mismatches
     */
    detectNamingMismatches() {
        for (const [contractName, contract] of Object.entries(this.contracts)) {
            const tableData = this.mapData.tables?.[contractName];
            if (!tableData)
                continue;
            for (const filePath of tableData.files || []) {
                const fileContent = this.readFileContent(filePath);
                if (!fileContent)
                    continue;
                // Check each contract field
                for (const field of Object.keys(contract.schema || {})) {
                    const snakeCase = this.toSnakeCase(field);
                    const camelCase = this.toCamelCase(field);
                    // If contract uses camelCase but code uses snake_case
                    if (field === camelCase && field !== snakeCase) {
                        if (fileContent.includes(snakeCase)) {
                            this.detections.push({
                                type: 'mismatch',
                                entity: contractName,
                                message: `Using '${snakeCase}' but contract specifies '${field}'`,
                                action: `Change '${snakeCase}' to '${field}' in code`,
                                locations: [filePath]
                            });
                        }
                    }
                }
            }
        }
    }
    /**
     * Helper methods
     */
    readFileContent(filePath) {
        const fullPath = path.isAbsolute(filePath)
            ? filePath
            : path.join(path.dirname(this.mapPath), filePath);
        if (fs.existsSync(fullPath)) {
            return fs.readFileSync(fullPath, 'utf-8');
        }
        return null;
    }
    extractEntityName(typeName) {
        // Skip UI components
        if (typeName.match(/^(Image|Input|Button|Card|Badge|Avatar|Sheet|List)$/)) {
            return '';
        }
        let name = typeName
            .replace(/Interface$|Type$|Schema$/, '')
            .replace(/^I([A-Z])/, '$1'); // IUser -> User
        // Skip if result is too short or looks like a component
        if (name.length < 3 || name.match(/^(Page|Component|View|Modal)$/)) {
            return '';
        }
        return name;
    }
    toSnakeCase(str) {
        return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`).replace(/^_/, '');
    }
    toCamelCase(str) {
        return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    }
    /**
     * Generate summary report
     */
    generateReport() {
        const detections = this.detect();
        let report = '# Contract Detection Report\n\n';
        const missing = detections.filter(d => d.type === 'missing');
        const outdated = detections.filter(d => d.type === 'outdated');
        const unused = detections.filter(d => d.type === 'unused');
        const mismatches = detections.filter(d => d.type === 'mismatch');
        if (missing.length > 0) {
            report += '## 🆕 Missing Contracts\n';
            missing.forEach(d => {
                report += `- **${d.entity}**: ${d.message}\n`;
                report += `  - Action: ${d.action}\n`;
            });
            report += '\n';
        }
        if (outdated.length > 0) {
            report += '## ⚠️ Outdated Contracts\n';
            outdated.forEach(d => {
                report += `- **${d.entity}**: ${d.message}\n`;
                if (d.fields) {
                    report += `  - New fields: ${d.fields.join(', ')}\n`;
                }
                report += `  - Action: ${d.action}\n`;
            });
            report += '\n';
        }
        if (mismatches.length > 0) {
            report += '## ❌ Naming Mismatches\n';
            mismatches.forEach(d => {
                report += `- **${d.entity}**: ${d.message}\n`;
                report += `  - Action: ${d.action}\n`;
            });
            report += '\n';
        }
        if (unused.length > 0) {
            report += '## 🗑️ Unused Contracts\n';
            unused.forEach(d => {
                report += `- **${d.entity}**: ${d.message}\n`;
            });
        }
        if (detections.length === 0) {
            report += '✅ All contracts are up to date!\n';
        }
        return report;
    }
}
exports.ContractDetector = ContractDetector;
// CLI support
if (require.main === module) {
    const mapPath = process.argv[2] || 'streax-map.json';
    const contractsPath = process.argv[3] || 'test-projects/streax/contracts.yaml';
    const detector = new ContractDetector(mapPath, contractsPath);
    console.log(detector.generateReport());
}
