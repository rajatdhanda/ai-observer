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
                'book_id': 'id',
                'cover_image_url': 'cover',
                'cover_image': 'cover',
                'author_name': 'author',
                'book_description': 'description',
                'book_category': 'category'
            },
            'Child': {
                'child_name': 'name',
                'child_id': 'id',
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
                'week_number': 'week_number',
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
        // Check each property against all entity contracts
        for (const [key, value] of Object.entries(obj)) {
            // Check if this key is a contract violation
            for (const [entity, mappings] of this.propertyMappings) {
                if (mappings.has(key)) {
                    const correctProp = mappings.get(key);
                    const contract = this.contracts.get(entity);
                    if (contract && contract.required_fields[correctProp]) {
                        this.violations.push({
                            entity,
                            file,
                            property: key,
                            expected: correctProp,
                            actual: key,
                            message: `CONTRACT VIOLATION: Golden uses "${key}" but ${entity} contract requires "${correctProp}"`,
                            severity: 'critical',
                            fix: `URGENT: Change golden example from "${key}" to "${correctProp}" to comply with ${entity} contract`
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
        // Check for all contract violations in the file
        for (const [entity, mappings] of this.propertyMappings) {
            for (const [wrongProp, correctProp] of mappings) {
                // Check various patterns where the wrong property might appear
                const patterns = [
                    `.${wrongProp}`, // object.wrongProp
                    `['${wrongProp}']`, // object['wrongProp']
                    `["${wrongProp}"]`, // object["wrongProp"]
                    `${wrongProp}:`, // { wrongProp: value }
                    `${wrongProp} =`, // wrongProp = value
                    `"${wrongProp}"`, // as string literal
                    `'${wrongProp}'` // as string literal
                ];
                for (const pattern of patterns) {
                    if (content.includes(pattern)) {
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
                        break; // Only report once per property per file
                    }
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
}
exports.ComprehensiveContractValidator = ComprehensiveContractValidator;
