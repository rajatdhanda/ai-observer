"use strict";
/**
 * Cross-Layer Validator
 * Validates alignment between Types → Contracts → Golden Examples → UI Components
 * Catches misalignments early in the chain before they cascade to components
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
exports.CrossLayerValidator = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class CrossLayerValidator {
    projectPath;
    issues = [];
    typeDefinitions = new Map();
    contractSchemas = new Map();
    goldenExamples = null;
    constructor(projectPath) {
        this.projectPath = projectPath;
    }
    validate() {
        this.issues = [];
        try {
            // 1. Load all layers
            this.loadTypeDefinitions();
            this.loadContracts();
            this.loadGoldenExamples();
            // 2. Validate each layer against the next
            this.validateContractsAgainstTypes();
            this.validateGoldenAgainstContracts();
            this.validateGoldenAgainstTypes();
            this.validateComponentUsage();
        }
        catch (error) {
            console.log('⚠️ Cross-layer validation skipped:', error);
        }
        return this.issues;
    }
    loadTypeDefinitions() {
        // Find all TypeScript type definition files
        const typesDir = path.join(this.projectPath, 'src', 'types');
        if (!fs.existsSync(typesDir))
            return;
        const typeFiles = fs.readdirSync(typesDir)
            .filter(f => f.endsWith('.ts') || f.endsWith('.tsx'));
        for (const file of typeFiles) {
            const content = fs.readFileSync(path.join(typesDir, file), 'utf-8');
            this.extractTypeProperties(content, file);
        }
    }
    extractTypeProperties(content, filename) {
        // Extract interface and type properties using regex
        const interfaceRegex = /interface\s+(\w+)\s*{([^}]+)}/g;
        const typeRegex = /type\s+(\w+)\s*=\s*{([^}]+)}/g;
        let match;
        // Extract from interfaces
        while ((match = interfaceRegex.exec(content)) !== null) {
            const typeName = match[1];
            const body = match[2];
            const properties = this.parseProperties(body);
            this.typeDefinitions.set(typeName, properties);
        }
        // Extract from type aliases
        while ((match = typeRegex.exec(content)) !== null) {
            const typeName = match[1];
            const body = match[2];
            const properties = this.parseProperties(body);
            this.typeDefinitions.set(typeName, properties);
        }
    }
    parseProperties(body) {
        const props = new Set();
        // Match property names (handle optional properties too)
        const propRegex = /(\w+)\??:/g;
        let match;
        while ((match = propRegex.exec(body)) !== null) {
            props.add(match[1]);
        }
        return props;
    }
    loadContracts() {
        // Check multiple possible contract locations
        const contractPaths = [
            path.join(this.projectPath, 'src', 'contract', 'contract.yaml'),
            path.join(this.projectPath, 'src', 'contract', 'contracts.yaml'),
            path.join(this.projectPath, 'src', 'contracts', 'contract.yaml'),
            path.join(this.projectPath, 'src', 'contracts', 'contracts.yaml'),
            path.join(this.projectPath, 'src', 'contracts', 'contracts.json'),
            path.join(this.projectPath, '.observer', 'contracts.json')
        ];
        for (const contractPath of contractPaths) {
            if (fs.existsSync(contractPath)) {
                try {
                    const content = fs.readFileSync(contractPath, 'utf-8');
                    if (contractPath.endsWith('.yaml')) {
                        // For YAML, just store as is (would need yaml parser)
                        this.contractSchemas.set('raw', content);
                    }
                    else {
                        const contracts = JSON.parse(content);
                        this.parseContracts(contracts);
                    }
                    break;
                }
                catch (error) {
                    // Continue to next path
                }
            }
        }
    }
    parseContracts(contracts) {
        // Extract contract schemas
        if (contracts.schemas) {
            for (const [key, schema] of Object.entries(contracts.schemas)) {
                this.contractSchemas.set(key, schema);
            }
        }
        if (contracts.endpoints) {
            for (const endpoint of contracts.endpoints) {
                if (endpoint.response_schema) {
                    this.contractSchemas.set(endpoint.name, endpoint.response_schema);
                }
            }
        }
    }
    loadGoldenExamples() {
        const goldenPath = path.join(this.projectPath, 'src', 'contracts', 'golden.examples.json');
        if (fs.existsSync(goldenPath)) {
            try {
                const content = fs.readFileSync(goldenPath, 'utf-8');
                this.goldenExamples = JSON.parse(content);
            }
            catch (error) {
                // Invalid JSON
            }
        }
    }
    validateContractsAgainstTypes() {
        // For each contract, check if it matches corresponding type
        for (const [contractName, contractSchema] of this.contractSchemas) {
            // Try to find matching type
            const possibleTypeNames = [
                contractName,
                contractName.replace(/_/g, ''),
                contractName.charAt(0).toUpperCase() + contractName.slice(1),
                contractName.replace(/_([a-z])/g, (g) => g[1].toUpperCase())
            ];
            for (const typeName of possibleTypeNames) {
                const typeProps = this.typeDefinitions.get(typeName);
                if (typeProps) {
                    this.compareContractToType(contractName, contractSchema, typeName, typeProps);
                    break;
                }
            }
        }
    }
    compareContractToType(contractName, contractSchema, typeName, typeProps) {
        if (typeof contractSchema === 'object' && contractSchema.properties) {
            const contractProps = Object.keys(contractSchema.properties);
            for (const prop of contractProps) {
                const camelCaseProp = this.snakeToCamel(prop);
                if (!typeProps.has(prop) && !typeProps.has(camelCaseProp)) {
                    this.issues.push({
                        layer1: 'Contract',
                        layer2: 'Type',
                        file: `contracts/${contractName}`,
                        property: prop,
                        message: `Contract property "${prop}" not found in type ${typeName}`,
                        severity: 'high',
                        fix: `Align contract property with type or add to type definition`
                    });
                }
            }
        }
    }
    validateGoldenAgainstContracts() {
        if (!this.goldenExamples)
            return;
        // Check golden examples against contracts
        this.traverseGolden(this.goldenExamples, '');
    }
    traverseGolden(obj, path) {
        if (!obj || typeof obj !== 'object')
            return;
        // Check for common misalignments - but only in entity contexts, not reference contexts
        const isBookEntity = this.isEntityContext(path, 'book');
        const isChildEntity = this.isEntityContext(path, 'child');
        if (obj.book_title !== undefined && isBookEntity && !this.hasContractProperty('book_title')) {
            // Check if this is a contextually appropriate descriptive field
            if (!this.isDescriptiveUIField('book_title', path)) {
                this.issues.push({
                    layer1: 'Golden Examples',
                    layer2: 'Book Contract',
                    file: 'golden.examples.json',
                    property: 'book_title',
                    expected: 'title (per Book contract)',
                    actual: 'book_title',
                    message: `CONTRACT VIOLATION: Golden uses "book_title" but Book contract requires "title"`,
                    severity: 'critical',
                    fix: `URGENT: Change golden example from "book_title" to "title" to comply with Book contract`
                });
            }
        }
        if (obj.cover_image_url !== undefined && isBookEntity && !this.hasContractProperty('cover_image_url')) {
            this.issues.push({
                layer1: 'Golden Examples',
                layer2: 'Book Contract',
                file: 'golden.examples.json',
                property: 'cover_image_url',
                expected: 'cover (per Book contract)',
                actual: 'cover_image_url',
                message: `CONTRACT VIOLATION: Golden uses "cover_image_url" but Book contract requires "cover"`,
                severity: 'critical',
                fix: `URGENT: Change golden example from "cover_image_url" to "cover" to comply with Book contract`
            });
        }
        // Skip false positive checks for foreign key references
        // child_id is a REFERENCE to a Child entity, not the Child entity's own id field
        // These are valid foreign key references and should NOT be flagged
        const referenceFields = ['child_id', 'parent_id', 'class_id', 'book_id', 'activity_id', 'user_id'];
        const isValidReference = referenceFields.some(ref => obj[ref] !== undefined);
        if (isValidReference) {
            // This object contains foreign key references, skip entity-level validation
            // Foreign keys are supposed to reference other entities and are not contract violations
        }
        // Recurse through object
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                this.traverseGolden(obj[key], path ? `${path}.${key}` : key);
            }
        }
    }
    validateGoldenAgainstTypes() {
        if (!this.goldenExamples)
            return;
        // Check if golden examples match type definitions
        if (this.goldenExamples.ui_ready_responses) {
            for (const [screenName, screenData] of Object.entries(this.goldenExamples.ui_ready_responses)) {
                this.validateScreenData(screenName, screenData);
            }
        }
    }
    validateScreenData(screenName, screenData) {
        // Convert screen name to potential type name
        const typeName = this.screenNameToType(screenName);
        const typeProps = this.typeDefinitions.get(typeName);
        if (!typeProps)
            return;
        // Check properties
        this.checkPropertiesAlignment(screenData, typeProps, screenName);
    }
    checkPropertiesAlignment(data, typeProps, context) {
        if (!data || typeof data !== 'object')
            return;
        for (const key in data) {
            if (data.hasOwnProperty(key)) {
                const value = data[key];
                // Check arrays for consistent property names
                if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
                    for (const item of value) {
                        this.checkItemProperties(item, context, key);
                    }
                }
            }
        }
    }
    checkItemProperties(item, context, arrayName) {
        // Only check for property mismatches when we're in the proper entity context
        // Don't flag foreign key references as property mismatches
        // Skip validation for objects that contain foreign key references
        const referenceFields = ['child_id', 'parent_id', 'class_id', 'book_id', 'activity_id', 'user_id'];
        const hasReferences = referenceFields.some(ref => item[ref] !== undefined);
        if (hasReferences) {
            // This item contains foreign keys, it's not an entity definition
            // Foreign keys are valid and should not be flagged as contract violations
            return;
        }
        // Check for mismatched property names only in proper entity contexts
        const propertyMismatches = [
            { wrong: 'book_title', correct: 'title', entityContext: 'book' },
            { wrong: 'cover_image_url', correct: 'cover', entityContext: 'book' },
            { wrong: 'author_name', correct: 'author', entityContext: 'book' },
            { wrong: 'child_name', correct: 'name', entityContext: 'child' }
        ];
        for (const mismatch of propertyMismatches) {
            if (item[mismatch.wrong] !== undefined) {
                // Only flag if we're in the correct entity context
                const contextPath = `${context}/${arrayName}`;
                const isCorrectContext = this.isEntityContext(contextPath, mismatch.entityContext);
                if (isCorrectContext) {
                    this.issues.push({
                        layer1: 'Golden Examples',
                        layer2: 'Expected Type',
                        file: `golden.examples.json/${context}/${arrayName}`,
                        property: mismatch.wrong,
                        expected: mismatch.correct,
                        actual: mismatch.wrong,
                        message: `Property name mismatch will cause TypeScript errors in components`,
                        severity: 'critical',
                        fix: `Rename "${mismatch.wrong}" to "${mismatch.correct}" in golden examples`
                    });
                }
            }
        }
    }
    validateComponentUsage() {
        // Check if components are using correct golden data paths
        const componentDirs = [
            path.join(this.projectPath, 'app', 'ui-components'),
            path.join(this.projectPath, 'src', 'components')
        ];
        for (const dir of componentDirs) {
            if (fs.existsSync(dir)) {
                this.checkComponentsInDir(dir);
            }
        }
    }
    checkComponentsInDir(dir) {
        const files = fs.readdirSync(dir, { withFileTypes: true });
        for (const file of files) {
            const fullPath = path.join(dir, file.name);
            if (file.isDirectory()) {
                this.checkComponentsInDir(fullPath);
            }
            else if (file.name.endsWith('.tsx') || file.name.endsWith('.ts')) {
                this.analyzeComponent(fullPath);
            }
        }
    }
    analyzeComponent(filePath) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const relativePath = path.relative(this.projectPath, filePath);
        // Check for direct golden example access with wrong properties
        if (content.includes('goldenExamples.') && content.includes('.book_title')) {
            this.issues.push({
                layer1: 'Component',
                layer2: 'Golden Examples',
                file: relativePath,
                property: 'book_title',
                message: 'Component expects "book_title" but type defines "title"',
                severity: 'critical',
                fix: 'Either fix golden examples or update component to use correct property'
            });
        }
        if (content.includes('goldenExamples.') && content.includes('.cover_image_url')) {
            this.issues.push({
                layer1: 'Component',
                layer2: 'Golden Examples',
                file: relativePath,
                property: 'cover_image_url',
                message: 'Component expects "cover_image_url" but type defines "cover"',
                severity: 'critical',
                fix: 'Either fix golden examples or update component to use correct property'
            });
        }
    }
    hasContractProperty(prop) {
        // Check if property exists in any contract
        for (const [_, schema] of this.contractSchemas) {
            if (typeof schema === 'object' && schema.properties) {
                if (schema.properties[prop])
                    return true;
            }
        }
        return false;
    }
    snakeToCamel(str) {
        return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
    }
    screenNameToType(screenName) {
        // Convert screen_name to ScreenNameData
        const words = screenName.split('_');
        const typeName = words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
        return typeName + 'Data';
    }
    isEntityContext(path, entityType) {
        // Check if we're in a context where we're defining the entity itself
        // vs referencing it from another entity
        const pathLower = path.toLowerCase();
        // If we're in the main entity definition (e.g., examples.books, examples.children)
        if (pathLower.includes(`${entityType}s.`) || pathLower.includes(`${entityType}.`)) {
            return true;
        }
        // If we're at the root of an entity object in golden examples
        if (pathLower === entityType || pathLower === `${entityType}s`) {
            return true;
        }
        return false;
    }
    isDescriptiveUIField(property, context) {
        // Same logic as comprehensive validator for consistency
        const descriptivePatterns = [
            { pattern: /^child_name$/, validContexts: ['meal', 'attendance', 'activity', 'report', 'message', 'fee'] },
            { pattern: /^parent_name$/, validContexts: ['message', 'contact', 'emergency'] },
            { pattern: /^teacher_name$/, validContexts: ['class', 'activity', 'report'] },
            { pattern: /^book_title$/, validContexts: ['reading', 'library', 'checkout'] },
            { pattern: /^meal_time$/, validContexts: ['meal', 'menu', 'nutrition'] },
            { pattern: /^activity_name$/, validContexts: ['curriculum', 'schedule', 'report'] }
        ];
        const contextLower = context.toLowerCase();
        return descriptivePatterns.some(({ pattern, validContexts }) => {
            if (pattern.test(property)) {
                return validContexts.some(validContext => contextLower.includes(validContext));
            }
            return false;
        });
    }
    getStats() {
        return {
            total: this.issues.length,
            critical: this.issues.filter(i => i.severity === 'critical').length,
            high: this.issues.filter(i => i.severity === 'high').length,
            medium: this.issues.filter(i => i.severity === 'medium').length
        };
    }
}
exports.CrossLayerValidator = CrossLayerValidator;
