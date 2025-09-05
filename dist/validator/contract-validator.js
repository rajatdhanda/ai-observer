"use strict";
/**
 * Universal Contract Validator
 * Works with ANY folder structure, ANY database, ANY framework
 * Inspired by Postman's approach to API testing
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContractValidator = void 0;
var fs = require("fs");
var path = require("path");
var yaml = require("js-yaml");
var ContractValidator = /** @class */ (function () {
    function ContractValidator(projectPath) {
        this.contracts = {};
        this.results = [];
        this.projectPath = projectPath;
        this.loadContracts();
    }
    /**
     * Load contracts from yaml/json file
     * Searches for contracts.yaml, contracts.json, or .contracts
     */
    ContractValidator.prototype.loadContracts = function () {
        var possiblePaths = [
            path.join(this.projectPath, 'contracts', 'contracts.yaml'),
            path.join(this.projectPath, 'contracts', 'contracts.json'),
            path.join(this.projectPath, '.contracts.yaml'),
            path.join(this.projectPath, '.contracts.json'),
            path.join(this.projectPath, 'contracts.yaml'),
            path.join(this.projectPath, 'contracts.json'),
        ];
        for (var _i = 0, possiblePaths_1 = possiblePaths; _i < possiblePaths_1.length; _i++) {
            var contractPath = possiblePaths_1[_i];
            if (fs.existsSync(contractPath)) {
                var content = fs.readFileSync(contractPath, 'utf-8');
                var data = contractPath.endsWith('.yaml')
                    ? yaml.load(content)
                    : JSON.parse(content);
                this.contracts = data.contracts || {};
                console.log("\uD83D\uDCCB Loaded contracts from ".concat(contractPath));
                console.log("   Found ".concat(Object.keys(this.contracts).length, " contracts"));
                return;
            }
        }
        console.log('⚠️  No contracts file found. Create contracts.yaml to define contracts.');
    };
    /**
     * Main validation - scans entire project for contract violations
     */
    ContractValidator.prototype.validate = function () {
        return __awaiter(this, void 0, void 0, function () {
            var files, _i, files_1, file, score;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.results = [];
                        if (Object.keys(this.contracts).length === 0) {
                            return [2 /*return*/, {
                                    score: 0,
                                    violations: [],
                                    summary: 'No contracts defined'
                                }];
                        }
                        files = this.findAllFiles(this.projectPath);
                        _i = 0, files_1 = files;
                        _a.label = 1;
                    case 1:
                        if (!(_i < files_1.length)) return [3 /*break*/, 4];
                        file = files_1[_i];
                        return [4 /*yield*/, this.validateFile(file)];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4:
                        score = this.calculateScore();
                        return [2 /*return*/, {
                                score: score,
                                violations: this.results,
                                summary: this.generateSummary()
                            }];
                }
            });
        });
    };
    /**
     * Find all code files - works with ANY structure
     */
    ContractValidator.prototype.findAllFiles = function (dir) {
        var files = [];
        var items = fs.readdirSync(dir, { withFileTypes: true });
        for (var _i = 0, items_1 = items; _i < items_1.length; _i++) {
            var item = items_1[_i];
            var fullPath = path.join(dir, item.name);
            // Skip node_modules and hidden directories
            if (item.name.startsWith('.') || item.name === 'node_modules') {
                continue;
            }
            if (item.isDirectory()) {
                files.push.apply(files, this.findAllFiles(fullPath));
            }
            else if (this.isRelevantFile(item.name)) {
                files.push(fullPath);
            }
        }
        return files;
    };
    ContractValidator.prototype.isRelevantFile = function (filename) {
        var extensions = ['.ts', '.tsx', '.js', '.jsx', '.sql', '.prisma'];
        return extensions.some(function (ext) { return filename.endsWith(ext); });
    };
    /**
     * Validate a single file against all contracts
     */
    ContractValidator.prototype.validateFile = function (filePath) {
        return __awaiter(this, void 0, void 0, function () {
            var content, filename, _i, _a, _b, entityName, contract;
            return __generator(this, function (_c) {
                content = fs.readFileSync(filePath, 'utf-8');
                filename = path.basename(filePath);
                // Check each contract
                for (_i = 0, _a = Object.entries(this.contracts); _i < _a.length; _i++) {
                    _b = _a[_i], entityName = _b[0], contract = _b[1];
                    // Smart detection - does this file relate to this entity?
                    if (this.fileRelatedToEntity(filePath, content, entityName)) {
                        this.validateAgainstContract(filePath, content, entityName, contract);
                    }
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Smart detection - figure out if file is related to an entity
     * Works with ANY naming convention
     */
    ContractValidator.prototype.fileRelatedToEntity = function (filePath, content, entityName) {
        var lowerEntity = entityName.toLowerCase();
        var variations = [
            lowerEntity,
            lowerEntity + 's', // plural
            lowerEntity.slice(0, -1), // singular if entity is plural
        ];
        // Check filename
        var filename = path.basename(filePath).toLowerCase();
        if (variations.some(function (v) { return filename.includes(v); })) {
            return true;
        }
        // Check content for entity references
        if (variations.some(function (v) { return content.toLowerCase().includes(v); })) {
            return true;
        }
        // Check for specific patterns
        if (content.includes("use".concat(entityName)) ||
            content.includes("".concat(entityName, "Tab")) ||
            content.includes("".concat(entityName, "Component"))) {
            return true;
        }
        return false;
    };
    /**
     * Validate file content against a specific contract
     */
    ContractValidator.prototype.validateAgainstContract = function (filePath, content, entityName, contract) {
        var schema = contract.schema;
        var fields = Object.keys(schema);
        // Check for wrong field names
        for (var _i = 0, fields_1 = fields; _i < fields_1.length; _i++) {
            var correctField = fields_1[_i];
            var violations = this.findFieldViolations(content, correctField, entityName);
            for (var _a = 0, violations_1 = violations; _a < violations_1.length; _a++) {
                var violation = violations_1[_a];
                this.results.push({
                    entity: entityName,
                    location: "".concat(filePath, ":").concat(violation.line),
                    type: 'error',
                    message: "Contract violation: Using '".concat(violation.used, "' instead of '").concat(correctField, "'"),
                    expected: correctField,
                    actual: violation.used,
                    suggestion: "Replace '".concat(violation.used, "' with '").concat(correctField, "' as defined in contract")
                });
            }
        }
        // Check hook returns
        if (content.includes("use".concat(entityName))) {
            this.validateHookReturn(filePath, content, entityName, contract);
        }
        // Check component usage
        if (content.includes("".concat(entityName, "Tab")) || content.includes("".concat(entityName, "Component"))) {
            this.validateComponentUsage(filePath, content, entityName, contract);
        }
    };
    /**
     * Find common field name violations
     */
    ContractValidator.prototype.findFieldViolations = function (content, correctField, entityName) {
        var violations = [];
        var lines = content.split('\n');
        var reportedLines = new Set(); // Track lines already reported
        // Common wrong variations
        var wrongVariations = this.getWrongVariations(correctField);
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            // Skip if we already reported this line for this field
            var lineKey = "".concat(i, "-").concat(correctField);
            if (reportedLines.has(lineKey))
                continue;
            for (var _i = 0, wrongVariations_1 = wrongVariations; _i < wrongVariations_1.length; _i++) {
                var wrong = wrongVariations_1[_i];
                // Use word boundary regex to avoid substring matches
                var wordBoundaryPattern = new RegExp("\\b".concat(wrong, "\\b"));
                if (wordBoundaryPattern.test(line) && !line.includes(correctField)) {
                    // Make sure it's actually for this entity
                    if (line.toLowerCase().includes(entityName.toLowerCase()) ||
                        lines[Math.max(0, i - 5)].toLowerCase().includes(entityName.toLowerCase()) ||
                        lines[Math.min(lines.length - 1, i + 5)].toLowerCase().includes(entityName.toLowerCase())) {
                        violations.push({
                            line: i + 1,
                            used: wrong
                        });
                        reportedLines.add(lineKey); // Mark this line as reported
                        break; // Only report once per line
                    }
                }
            }
        }
        return violations;
    };
    /**
     * Get common wrong variations of a field name
     */
    ContractValidator.prototype.getWrongVariations = function (correctField) {
        var variations = [];
        // If camelCase, try snake_case
        if (correctField.includes('Id')) {
            variations.push(correctField.replace('Id', '_id'));
        }
        if (/[A-Z]/.test(correctField)) {
            variations.push(correctField.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, ''));
        }
        // Common mistakes
        if (correctField === 'userId') {
            variations.push('user_id', 'customerId', 'customer_id', 'uid');
        }
        if (correctField === 'totalAmount') {
            variations.push('total_amount', 'amount', 'total', 'price');
        }
        if (correctField === 'createdAt') {
            variations.push('created_at', 'created', 'timestamp', 'date');
        }
        return variations;
    };
    /**
     * Validate hook returns correct shape
     */
    ContractValidator.prototype.validateHookReturn = function (filePath, content, entityName, contract) {
        // Look for return statement
        var returnMatch = content.match(/return\s*{([^}]+)}/);
        if (returnMatch) {
            var returnContent = returnMatch[1];
            var schema = contract.schema;
            // Check if returns array of entity
            if (!returnContent.includes(entityName) && !returnContent.includes('data') && !returnContent.includes('items')) {
                this.results.push({
                    entity: entityName,
                    location: filePath,
                    type: 'warning',
                    message: "Hook may not be returning ".concat(entityName, " data"),
                    expected: "".concat(entityName, "[] or { ").concat(entityName.toLowerCase(), "s: ").concat(entityName, "[] }"),
                    actual: 'Unknown return type',
                    suggestion: "Ensure hook returns ".concat(entityName, " array with contract fields")
                });
            }
        }
    };
    /**
     * Validate component uses correct fields
     */
    ContractValidator.prototype.validateComponentUsage = function (filePath, content, entityName, contract) {
        var schema = contract.schema;
        // Check for field access patterns
        for (var _i = 0, _a = Object.keys(schema); _i < _a.length; _i++) {
            var field = _a[_i];
            var wrongVariations = this.getWrongVariations(field);
            for (var _b = 0, wrongVariations_2 = wrongVariations; _b < wrongVariations_2.length; _b++) {
                var wrong = wrongVariations_2[_b];
                // Look for patterns like order.customer_id or item['total_amount']
                var patterns = [
                    "\\.".concat(wrong),
                    "\\['".concat(wrong, "'\\]"),
                    "\\[\"".concat(wrong, "\"\\]")
                ];
                for (var _c = 0, patterns_1 = patterns; _c < patterns_1.length; _c++) {
                    var pattern = patterns_1[_c];
                    if (new RegExp(pattern).test(content)) {
                        this.results.push({
                            entity: entityName,
                            location: filePath,
                            type: 'error',
                            message: "Component using wrong field name",
                            expected: field,
                            actual: wrong,
                            suggestion: "Change ".concat(wrong, " to ").concat(field, " per contract")
                        });
                    }
                }
            }
        }
    };
    /**
     * Calculate compliance score
     */
    ContractValidator.prototype.calculateScore = function () {
        if (this.results.length === 0) {
            return 100;
        }
        var errors = this.results.filter(function (r) { return r.type === 'error'; }).length;
        var warnings = this.results.filter(function (r) { return r.type === 'warning'; }).length;
        var score = 100;
        score -= errors * 10;
        score -= warnings * 5;
        return Math.max(0, Math.min(100, score));
    };
    /**
     * Generate summary report
     */
    ContractValidator.prototype.generateSummary = function () {
        var errors = this.results.filter(function (r) { return r.type === 'error'; });
        var warnings = this.results.filter(function (r) { return r.type === 'warning'; });
        var summary = "Contract Compliance Report\n";
        summary += "==========================\n\n";
        summary += "Contracts Defined: ".concat(Object.keys(this.contracts).length, "\n");
        summary += "Violations Found: ".concat(this.results.length, "\n");
        summary += "  - Errors: ".concat(errors.length, "\n");
        summary += "  - Warnings: ".concat(warnings.length, "\n\n");
        if (errors.length > 0) {
            summary += "Critical Issues:\n";
            errors.slice(0, 5).forEach(function (e) {
                summary += "  \u274C ".concat(e.message, "\n");
                summary += "     Location: ".concat(e.location, "\n");
                summary += "     Fix: ".concat(e.suggestion, "\n\n");
            });
        }
        return summary;
    };
    return ContractValidator;
}());
exports.ContractValidator = ContractValidator;
