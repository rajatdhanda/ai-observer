"use strict";
/**
 * Comprehensive Contract Validator
 * Validates ALL entities against contracts.yaml comprehensively
 * Checks Golden Examples, Components, Types, and Database layers
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
exports.ComprehensiveContractValidator = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const yaml = __importStar(require("js-yaml"));
class ComprehensiveContractValidator {
    projectPath;
    violations = [];
    contracts = new Map();
    propertyMappings = new Map(); // entity -> wrong -> correct
    constructor(projectPath) {
        this.projectPath = projectPath;
        this.loadContracts();
        this.buildPropertyMappings();
    }
    validate() {
        this.violations = [];
        console.log('🔍 Starting comprehensive contract validation...');
        // 1. Validate Golden Examples
        this.validateGoldenExamples();
        // 2. Validate all Components recursively
        this.validateAllComponents();
        // 3. Validate TypeScript types
        this.validateTypeDefinitions();
        // 4. Validate Database schemas
        this.validateDatabaseSchemas();
        console.log(`✅ Found ${this.violations.length} contract violations`);
        return this.violations;
    }
    loadContracts() {
        // Check multiple possible locations for the contracts file
        const possiblePaths = [
            path.join(this.projectPath, 'src', 'contract', 'contract.yaml'),
            path.join(this.projectPath, 'src', 'contract', 'contracts.yaml'),
            path.join(this.projectPath, 'src', 'contracts', 'contract.yaml'),
            path.join(this.projectPath, 'src', 'contracts', 'contracts.yaml'),
        ];
        let contractsPath = '';
        for (const p of possiblePaths) {
            if (fs.existsSync(p)) {
                contractsPath = p;
                break;
            }
        }
        if (!contractsPath) {
            console.log('⚠️  No contracts file found in any of:', possiblePaths);
            return;
        }
        try {
            const content = fs.readFileSync(contractsPath, 'utf-8');
            const parsed = yaml.load(content);
            // Extract all entities from YAML
            for (const key of Object.keys(parsed)) {
                if (key === key.charAt(0).toUpperCase() + key.slice(1)) { // Is capitalized (entity)
                    const entity = parsed[key];
                    if (entity.required_fields) {
                        this.contracts.set(key, {
                            name: key,
                            required_fields: entity.required_fields,
                            optional_fields: entity.optional_fields
                        });
                    }
                }
            }
            console.log(`📋 Loaded ${this.contracts.size} contract entities`);
        }
        catch (error) {
            console.log('❌ Error loading contracts:', error);
        }
    }
    buildPropertyMappings() {
        // Build common wrong property mappings for each entity
        const mappings = {
            'Book': {
                'book_title': 'title',
                // Removed 'book_id': 'id' - book_id is a valid foreign key reference
                'cover_image_url': 'cover',
                'cover_image': 'cover',
                'author_name': 'author',
                'book_description': 'description',
                'book_category': 'category'
            },
            'Child': {
                'child_name': 'name',
                // Removed 'child_id': 'id' - child_id is a valid foreign key reference
                'age': 'age_group',
                'child_age': 'age_group',
                'parent_id': 'parent_ids',
                'class_name': 'class_id'
            },
            'MealRecord': {
                'meal_type': 'type',
                'meal_time': 'time',
                'consumption_percentage': 'percentage',
                'meal_notes': 'notes',
                'meal_photo': 'photo',
                'meal_menu': 'menu'
            },
            'MediaAsset': {
                'image_url': 'url',
                'media_url': 'url',
                'media_type': 'type',
                'thumbnail_url': 'thumbnail',
                'media_caption': 'caption',
                'upload_date': 'created_at'
            },
            'CurriculumWeek': {
                'week_num': 'week_number',
                'curriculum_theme': 'theme',
                'week_theme': 'theme',
                'curriculum_description': 'description',
                'learning_goals': 'goals'
            },
            'ParentMessage': {
                'message_text': 'content',
                'message_content': 'content',
                'sender_id': 'from_parent_id',
                'recipient_id': 'to_parent_id',
                'message_time': 'sent_at',
                'is_read': 'read'
            },
            'DailySnapshot': {
                'snapshot_date': 'date',
                'child_name': 'child_id',
                'attendance_status': 'attendance',
                'daily_achievement': 'achievement',
                'teacher_notes': 'teacher_note'
            },
            'MenuItem': {
                'item_name': 'name',
                'menu_category': 'category',
                'nutritional_info': 'nutrition',
                'allergen_info': 'allergens'
            }
        };
        for (const [entity, wrongMappings] of Object.entries(mappings)) {
            this.propertyMappings.set(entity, new Map(Object.entries(wrongMappings)));
        }
    }
    validateGoldenExamples() {
        const goldenPaths = [
            path.join(this.projectPath, 'src', 'contracts', 'golden.examples.json'),
            path.join(this.projectPath, 'golden.examples.json')
        ];
        for (const goldenPath of goldenPaths) {
            if (fs.existsSync(goldenPath)) {
                console.log('📊 Validating golden examples:', goldenPath);
                const content = fs.readFileSync(goldenPath, 'utf-8');
                const golden = JSON.parse(content);
                this.validateObject(golden, 'golden.examples.json', '');
                break;
            }
        }
    }
    validateObject(obj, file, path) {
        if (!obj || typeof obj !== 'object')
            return;
        // Determine the entity context based on the path or object structure
        const entityContext = this.determineEntityContext(obj, path);
        // Check each property against relevant entity contracts
        for (const [key, value] of Object.entries(obj)) {
            // Skip foreign key references - these are valid references to other entities
            if (this.isForeignKeyReference(key)) {
                // Foreign keys like child_id, book_id are valid references, not violations
                continue;
            }
            // Check if this key is a contract violation in the specific entity context
            if (entityContext) {
                const mappings = this.propertyMappings.get(entityContext);
                if (mappings && mappings.has(key)) {
                    const correctProp = mappings.get(key);
                    const contract = this.contracts.get(entityContext);
                    // Check if this is a descriptive UI field that's contextually appropriate
                    if (this.isDescriptiveUIField(key, path)) {
                        // This is a valid descriptive field in proper context - don't flag as violation
                        continue;
                    }
                    if (contract && contract.required_fields[correctProp]) {
                        this.violations.push({
                            entity: entityContext,
                            file,
                            property: key,
                            expected: correctProp,
                            actual: key,
                            message: `CONTRACT VIOLATION: Golden uses "${key}" but ${entityContext} contract requires "${correctProp}"`,
                            severity: 'critical',
                            fix: `URGENT: Change golden example from "${key}" to "${correctProp}" to comply with ${entityContext} contract`
                        });
                    }
                }
            }
            // Recurse into nested objects and arrays
            if (Array.isArray(value)) {
                for (let i = 0; i < value.length; i++) {
                    this.validateObject(value[i], file, `${path}.${key}[${i}]`);
                }
            }
            else if (typeof value === 'object' && value !== null) {
                this.validateObject(value, file, path ? `${path}.${key}` : key);
            }
        }
    }
    validateAllComponents() {
        const componentDirs = [
            path.join(this.projectPath, 'app'),
            path.join(this.projectPath, 'src', 'components'),
            path.join(this.projectPath, 'components')
        ];
        for (const dir of componentDirs) {
            if (fs.existsSync(dir)) {
                console.log('🔍 Scanning components in:', dir);
                this.scanDirectory(dir);
            }
        }
    }
    scanDirectory(dir) {
        try {
            const files = fs.readdirSync(dir, { withFileTypes: true });
            for (const file of files) {
                const fullPath = path.join(dir, file.name);
                if (file.isDirectory() && !file.name.startsWith('.') && file.name !== 'node_modules') {
                    // Recursively scan subdirectories
                    this.scanDirectory(fullPath);
                }
                else if (file.name.endsWith('.tsx') || file.name.endsWith('.ts') || file.name.endsWith('.jsx') || file.name.endsWith('.js')) {
                    // Check component files
                    this.validateComponentFile(fullPath);
                }
            }
        }
        catch (error) {
            // Skip directories we can't read
        }
    }
    validateComponentFile(filePath) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const relativePath = path.relative(this.projectPath, filePath);
        // Check for contract violations in the file, but skip foreign key references
        for (const [entity, mappings] of this.propertyMappings) {
            for (const [wrongProp, correctProp] of mappings) {
                // Skip foreign key references - these are valid references in components
                if (this.isForeignKeyReference(wrongProp)) {
                    continue;
                }
                // Check if this is a contextually appropriate descriptive UI field
                if (this.isDescriptiveUIField(wrongProp, relativePath)) {
                    // This is a valid descriptive field in proper context - skip validation
                    continue;
                }
                // Check various patterns where the wrong property might appear - PRECISE MATCHING ONLY
                const patterns = [
                    `.${wrongProp}`, // object.wrongProp
                    `['${wrongProp}']`, // object['wrongProp']
                    `["${wrongProp}"]`, // object["wrongProp"]
                    `${wrongProp}:`, // { wrongProp: value }
                    `${wrongProp} =` // wrongProp = value
                ];
                // Check if this property appears in actual code contexts (not UI strings)
                let foundViolation = false;
                for (const pattern of patterns) {
                    if (content.includes(pattern)) {
                        // Additional filtering - avoid UI strings and comments
                        if (this.isInUIStringContext(content, pattern, wrongProp)) {
                            continue; // Skip UI strings like "form with name, age, parent details"
                        }
                        // Check if it's an auto-generated field that shouldn't be validated
                        if (this.isAutoGeneratedField(wrongProp, entity)) {
                            continue; // Skip auto-generated fields like media_type
                        }
                        foundViolation = true;
                        break;
                    }
                }
                if (foundViolation) {
                    this.violations.push({
                        entity,
                        file: relativePath,
                        property: wrongProp,
                        expected: correctProp,
                        actual: wrongProp,
                        message: `CONTRACT VIOLATION: Component uses "${wrongProp}" but ${entity} contract requires "${correctProp}"`,
                        severity: 'critical',
                        fix: `URGENT: Change component from "${wrongProp}" to "${correctProp}" to comply with ${entity} contract`
                    });
                }
            }
        }
    }
    validateTypeDefinitions() {
        const typeDirs = [
            path.join(this.projectPath, 'src', 'types'),
            path.join(this.projectPath, 'types')
        ];
        for (const dir of typeDirs) {
            if (fs.existsSync(dir)) {
                console.log('📘 Validating type definitions in:', dir);
                const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts') || f.endsWith('.d.ts'));
                for (const file of files) {
                    this.validateComponentFile(path.join(dir, file));
                }
            }
        }
    }
    validateDatabaseSchemas() {
        const dbDirs = [
            path.join(this.projectPath, 'src', 'lib', 'db'),
            path.join(this.projectPath, 'src', 'db'),
            path.join(this.projectPath, 'db')
        ];
        for (const dir of dbDirs) {
            if (fs.existsSync(dir)) {
                console.log('🗄️ Validating database schemas in:', dir);
                this.scanDirectory(dir);
            }
        }
    }
    isForeignKeyReference(key) {
        // Common foreign key patterns - these are valid references, not violations
        const foreignKeyPatterns = [
            '_id$', // ends with _id (like child_id, parent_id, book_id)
            '_ids$', // ends with _ids (like parent_ids)  
            'Id$' // ends with Id (camelCase like childId, parentId)
        ];
        return foreignKeyPatterns.some(pattern => new RegExp(pattern).test(key));
    }
    isDescriptiveUIField(key, context) {
        // Descriptive UI field patterns that are contextually appropriate
        // These should NOT be flagged as violations when used in proper context
        const descriptivePatterns = [
            { pattern: /^child_name$/, validContexts: ['meal', 'attendance', 'activity', 'report', 'message', 'fee'] },
            { pattern: /^parent_name$/, validContexts: ['message', 'contact', 'emergency'] },
            { pattern: /^teacher_name$/, validContexts: ['class', 'activity', 'report'] },
            { pattern: /^book_title$/, validContexts: ['reading', 'library', 'checkout'] },
            { pattern: /^meal_time$/, validContexts: ['meal', 'menu', 'nutrition'] },
            { pattern: /^activity_name$/, validContexts: ['curriculum', 'schedule', 'report'] }
        ];
        if (!context)
            return false;
        const contextLower = context.toLowerCase();
        return descriptivePatterns.some(({ pattern, validContexts }) => {
            if (pattern.test(key)) {
                // Check if we're in a valid context for this descriptive field
                return validContexts.some(validContext => contextLower.includes(validContext));
            }
            return false;
        });
    }
    isInUIStringContext(content, pattern, property) {
        // Find the pattern in the content and check if it's within a UI string
        const index = content.indexOf(pattern);
        if (index === -1)
            return false;
        // Get surrounding context (100 chars before and after)
        const start = Math.max(0, index - 100);
        const end = Math.min(content.length, index + pattern.length + 100);
        // Check if it's within quotes (UI strings, comments, etc.)
        const beforePattern = content.substring(start, index);
        const afterPattern = content.substring(index + pattern.length, end);
        // Look for string contexts
        const stringPatterns = [
            /["'`][^"'`]*$/, // Opening quote before
            /^[^"'`]*["'`]/, // Closing quote after
            /\/\*.*$/, // Multi-line comment before
            /^.*\*\//, // Multi-line comment after  
            /\/\/.*$/, // Single-line comment
            /alert\s*\(/, // Alert statements
            /console\.\w+\s*\(/ // Console statements
        ];
        // Check if pattern is inside a string literal or comment
        const inStringBefore = stringPatterns.slice(0, 2).some(p => p.test(beforePattern));
        const inStringAfter = stringPatterns.slice(1, 2).some(p => p.test(afterPattern));
        const inComment = stringPatterns.slice(2).some(p => p.test(beforePattern) || p.test(afterPattern));
        return inStringBefore || inStringAfter || inComment;
    }
    isAutoGeneratedField(property, entity) {
        // Fields marked as auto_generated_fields in contracts should not be validated
        const autoGeneratedFields = {
            'MediaAsset': ['file_size', 'mime_type', 'media_type'],
            // Add other entities with auto-generated fields as needed
        };
        const entityFields = autoGeneratedFields[entity];
        return entityFields?.includes(property) || false;
    }
    determineEntityContext(obj, path) {
        // Try to determine which entity this object represents based on path and structure
        const pathLower = path.toLowerCase();
        // Check path-based contexts (e.g., examples.children, book_subscriptions)
        for (const entityName of this.contracts.keys()) {
            const entityLower = entityName.toLowerCase();
            const entityPlural = entityLower + 's';
            if (pathLower.includes(entityPlural) || pathLower.includes(entityLower)) {
                return entityName;
            }
        }
        // Try to infer from object structure (presence of specific properties)
        if (obj.title && obj.author && obj.cover)
            return 'Book';
        if (obj.name && obj.age_group && obj.class_id)
            return 'Child';
        if (obj.meal_type && obj.consumption_level)
            return 'MealRecord';
        if (obj.url && obj.media_type)
            return 'MediaAsset';
        if (obj.week_number && obj.theme)
            return 'CurriculumWeek';
        if (obj.date && obj.attendance)
            return 'DailySnapshot';
        return null;
    }
    getStats() {
        return {
            total: this.violations.length,
            critical: this.violations.filter(v => v.severity === 'critical').length
        };
    }
}
exports.ComprehensiveContractValidator = ComprehensiveContractValidator;
