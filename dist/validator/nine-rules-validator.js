"use strict";
/**
 * 9 Core Validation Rules for AI-Generated Code
 * Detects drift and issues in existing codebases
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NineRulesValidator = void 0;
exports.runValidation = runValidation;
var fs = require("fs");
var path = require("path");
var ts = require("typescript");
var NineRulesValidator = /** @class */ (function () {
    function NineRulesValidator(projectPath) {
        this.results = [];
        // Resolve relative paths to absolute
        this.projectPath = path.isAbsolute(projectPath) ? projectPath : path.resolve(process.cwd(), projectPath);
        var configPath = ts.findConfigFile(this.projectPath, ts.sys.fileExists, 'tsconfig.json');
        if (configPath) {
            var config = ts.readConfigFile(configPath, ts.sys.readFile).config;
            var _a = ts.parseJsonConfigFileContent(config, ts.sys, projectPath), options = _a.options, fileNames = _a.fileNames;
            this.program = ts.createProgram(fileNames, options);
            this.checker = this.program.getTypeChecker();
        }
        else {
            // Fallback to basic program
            this.program = ts.createProgram([], {});
            this.checker = this.program.getTypeChecker();
        }
    }
    NineRulesValidator.prototype.validateAll = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('🔍 Running 9 Core Validation Rules...\n');
                        // Run all 9 validation rules
                        return [4 /*yield*/, this.rule1_TypeDatabaseAlignment()];
                    case 1:
                        // Run all 9 validation rules
                        _a.sent();
                        return [4 /*yield*/, this.rule2_HookDatabasePattern()];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, this.rule3_ErrorHandlingChain()];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, this.rule4_LoadingStates()];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, this.rule5_APITypeSafety()];
                    case 5:
                        _a.sent();
                        return [4 /*yield*/, this.rule6_RegistryUsage()];
                    case 6:
                        _a.sent();
                        return [4 /*yield*/, this.rule7_MutationHygiene()];
                    case 7:
                        _a.sent();
                        return [4 /*yield*/, this.rule8_FormValidation()];
                    case 8:
                        _a.sent();
                        return [4 /*yield*/, this.rule9_AuthGuardMatrix()];
                    case 9:
                        _a.sent();
                        // Additional critical checks for AI drift prevention
                        return [4 /*yield*/, this.checkFileSizeWarnings()];
                    case 10:
                        // Additional critical checks for AI drift prevention
                        _a.sent();
                        return [4 /*yield*/, this.checkDuplicateFunctions()];
                    case 11:
                        _a.sent();
                        return [4 /*yield*/, this.checkExportCompleteness()];
                    case 12:
                        _a.sent();
                        return [2 /*return*/, this.generateSummary()];
                }
            });
        });
    };
    /**
     * Rule 1: Type-Database Alignment (30% of bugs)
     * Two-way checking: Zod ↔ DB
     * Enhanced with runtime validation detection
     */
    NineRulesValidator.prototype.rule1_TypeDatabaseAlignment = function () {
        return __awaiter(this, void 0, void 0, function () {
            var result, schemaFiles, dbFiles, _i, schemaFiles_1, schemaFile, schemaContent, schemaName, hasProperParsing, _loop_1, _a, dbFiles_1, dbFile, state_1, _b, dbFiles_2, dbFile, dbContent, queryPatterns, hasTwoWayValidation, _c, queryPatterns_1, pattern, matches, hasInputValidation, hasOutputValidation, hasRuntimeAssertion;
            return __generator(this, function (_d) {
                result = {
                    rule: 'Type-Database Alignment',
                    ruleNumber: 1,
                    status: 'pass',
                    score: 100,
                    issues: [],
                    coverage: { checked: 0, passed: 0, total: 0 }
                };
                schemaFiles = this.findFiles('**/*.schema.ts', '**/*.contract.ts', '**/*.types.ts');
                dbFiles = this.findFiles('**/db/**/*.ts', '**/database/**/*.ts', '**/supabase/**/*.ts', '**/prisma/**/*.ts');
                for (_i = 0, schemaFiles_1 = schemaFiles; _i < schemaFiles_1.length; _i++) {
                    schemaFile = schemaFiles_1[_i];
                    result.coverage.total++;
                    result.coverage.checked++;
                    schemaContent = fs.readFileSync(schemaFile, 'utf-8');
                    schemaName = path.basename(schemaFile, '.ts').replace('.schema', '').replace('.contract', '');
                    hasProperParsing = false;
                    _loop_1 = function (dbFile) {
                        var dbContent = fs.readFileSync(dbFile, 'utf-8');
                        // Check for proper parsing patterns
                        var parsePatterns = [
                            "".concat(schemaName, "Schema.parse"),
                            "".concat(schemaName, ".parse"),
                            "z.object\\(.*".concat(schemaName),
                        ];
                        if (parsePatterns.some(function (pattern) { return new RegExp(pattern, 'i').test(dbContent); })) {
                            hasProperParsing = true;
                            result.coverage.passed++;
                            return "break";
                        }
                    };
                    for (_a = 0, dbFiles_1 = dbFiles; _a < dbFiles_1.length; _a++) {
                        dbFile = dbFiles_1[_a];
                        state_1 = _loop_1(dbFile);
                        if (state_1 === "break")
                            break;
                    }
                    if (!hasProperParsing) {
                        result.issues.push({
                            severity: 'critical',
                            file: schemaFile,
                            message: "Schema '".concat(schemaName, "' not used with .parse() in database layer"),
                            suggestion: "Add ".concat(schemaName, "Schema.parse(data) when fetching from database"),
                        });
                    }
                }
                // Check for DB queries without schema validation
                for (_b = 0, dbFiles_2 = dbFiles; _b < dbFiles_2.length; _b++) {
                    dbFile = dbFiles_2[_b];
                    dbContent = fs.readFileSync(dbFile, 'utf-8');
                    queryPatterns = [
                        /from\(['"`](\w+)['"`]\)(?![\s\S]*\.parse)/g,
                        /\.select\(\)(?![\s\S]*\.parse)/g,
                        /\.insert\([^)]+\)(?![\s\S]*\.parse)/g,
                    ];
                    hasTwoWayValidation = this.checkTwoWayValidation(dbContent);
                    for (_c = 0, queryPatterns_1 = queryPatterns; _c < queryPatterns_1.length; _c++) {
                        pattern = queryPatterns_1[_c];
                        matches = dbContent.match(pattern);
                        if (matches) {
                            result.issues.push({
                                severity: 'critical',
                                file: dbFile,
                                message: 'Database query without schema validation',
                                suggestion: 'Add .parse() after database operations',
                                codeSnippet: matches[0]
                            });
                        }
                    }
                    // Check for response validation
                    if (!hasTwoWayValidation) {
                        hasInputValidation = /\.parse\(.*(?:req|request|input|data)/gi.test(dbContent);
                        hasOutputValidation = /\.parse\(.*(?:result|response|output|rows)/gi.test(dbContent);
                        if (hasInputValidation && !hasOutputValidation) {
                            result.issues.push({
                                severity: 'warning',
                                file: dbFile,
                                message: 'One-way validation detected: Input validated but not output',
                                suggestion: 'Add ResponseSchema.parse(result) to validate DB responses'
                            });
                        }
                        else if (!hasInputValidation && hasOutputValidation) {
                            result.issues.push({
                                severity: 'warning',
                                file: dbFile,
                                message: 'One-way validation detected: Output validated but not input',
                                suggestion: 'Add InputSchema.parse(data) before DB operations'
                            });
                        }
                    }
                    hasRuntimeAssertion = /as\s+\w+(?:\[\])?(?:\s|;|$)/g.test(dbContent);
                    if (hasRuntimeAssertion) {
                        result.issues.push({
                            severity: 'warning',
                            file: dbFile,
                            message: 'Type assertion detected - runtime validation preferred',
                            suggestion: 'Replace "as Type" with Schema.parse() for runtime safety'
                        });
                    }
                }
                result.score = this.calculateScore(result.coverage);
                result.status = result.score >= 80 ? 'pass' : result.score >= 50 ? 'warning' : 'fail';
                this.results.push(result);
                return [2 /*return*/];
            });
        });
    };
    /**
     * Rule 2: Hook-Database Pattern (25% of bugs)
     * Component → Hook → DB (never direct)
     * Enhanced with cross-layer type checking
     */
    NineRulesValidator.prototype.rule2_HookDatabasePattern = function () {
        return __awaiter(this, void 0, void 0, function () {
            var result, componentFiles, hookFiles, _loop_2, _i, componentFiles_1, componentFile, _a, hookFiles_1, hookFile, content, hasDBImport, hasUsePrefix, hasGenericType, usesUseQuery, hasAnyType, hasReturnType, functionDeclaration;
            return __generator(this, function (_b) {
                result = {
                    rule: 'Hook-Database Pattern',
                    ruleNumber: 2,
                    status: 'pass',
                    score: 100,
                    issues: [],
                    coverage: { checked: 0, passed: 0, total: 0 }
                };
                componentFiles = this.findFiles('**/components/**/*.tsx', '**/app/**/*.tsx');
                hookFiles = this.findFiles('**/hooks/**/*.ts', '**/hooks/**/*.tsx', '**/use*.ts');
                _loop_2 = function (componentFile) {
                    result.coverage.total++;
                    result.coverage.checked++;
                    var content = fs.readFileSync(componentFile, 'utf-8');
                    // Patterns indicating direct DB access
                    var dbPatterns = [
                        /from ['"].*\/db/,
                        /from ['"].*\/database/,
                        /import.*supabase/i,
                        /import.*prisma/i,
                        /\.from\(['"`]/,
                    ];
                    var hasDirectDBAccess = dbPatterns.some(function (pattern) { return pattern.test(content); });
                    if (hasDirectDBAccess) {
                        result.issues.push({
                            severity: 'critical',
                            file: componentFile,
                            message: 'Component has direct database access',
                            suggestion: 'Components should use hooks for data fetching, not direct DB calls'
                        });
                    }
                    else {
                        result.coverage.passed++;
                    }
                };
                // Check components for direct DB access
                for (_i = 0, componentFiles_1 = componentFiles; _i < componentFiles_1.length; _i++) {
                    componentFile = componentFiles_1[_i];
                    _loop_2(componentFile);
                }
                // Check if hooks properly wrap DB calls with type safety
                for (_a = 0, hookFiles_1 = hookFiles; _a < hookFiles_1.length; _a++) {
                    hookFile = hookFiles_1[_a];
                    content = fs.readFileSync(hookFile, 'utf-8');
                    hasDBImport = /from ['"].*\/(db|database)/.test(content);
                    hasUsePrefix = /export.*use[A-Z]/.test(content);
                    if (hasDBImport && !hasUsePrefix) {
                        result.issues.push({
                            severity: 'warning',
                            file: hookFile,
                            message: 'DB access not properly wrapped in a hook',
                            suggestion: 'Export a hook function starting with "use"'
                        });
                    }
                    hasGenericType = /<\w+(?:,\s*\w+)*>/.test(content);
                    usesUseQuery = /useQuery|useMutation|useSWR/.test(content);
                    if (usesUseQuery && !hasGenericType) {
                        result.issues.push({
                            severity: 'warning',
                            file: hookFile,
                            message: 'Hook using untyped query - missing generic type',
                            suggestion: 'Add generic type: useQuery<YourType>() for type safety'
                        });
                    }
                    hasAnyType = /:\s*any(?:\s|;|\)|,)/g.test(content);
                    if (hasAnyType) {
                        result.issues.push({
                            severity: 'critical',
                            file: hookFile,
                            message: 'Hook using "any" type - breaks type safety',
                            suggestion: 'Replace "any" with specific type or unknown'
                        });
                    }
                    hasReturnType = /\):\s*\{[\s\S]*?\}|return\s+{[\s\S]*?}/.test(content);
                    functionDeclaration = /export\s+(?:const|function)\s+use\w+/.test(content);
                    if (functionDeclaration && !hasReturnType && !hasGenericType) {
                        result.issues.push({
                            severity: 'warning',
                            file: hookFile,
                            message: 'Hook missing explicit return type',
                            suggestion: 'Define return type for better type inference'
                        });
                    }
                }
                result.score = this.calculateScore(result.coverage);
                result.status = result.score >= 80 ? 'pass' : result.score >= 50 ? 'warning' : 'fail';
                this.results.push(result);
                return [2 /*return*/];
            });
        });
    };
    /**
     * Rule 3: Error Handling Chain (20% of bugs)
     */
    NineRulesValidator.prototype.rule3_ErrorHandlingChain = function () {
        return __awaiter(this, void 0, void 0, function () {
            var result, dbFiles, _i, dbFiles_3, file, content, hasTryCatch, hasAsyncFunction, hookFiles, _a, hookFiles_2, file, content, hasErrorState, hasUseState, componentFiles, _b, componentFiles_2, file, content, usesHook, hasErrorUI;
            return __generator(this, function (_c) {
                result = {
                    rule: 'Error Handling Chain',
                    ruleNumber: 3,
                    status: 'pass',
                    score: 100,
                    issues: [],
                    coverage: { checked: 0, passed: 0, total: 0 }
                };
                dbFiles = this.findFiles('**/db/**/*.ts', '**/database/**/*.ts');
                for (_i = 0, dbFiles_3 = dbFiles; _i < dbFiles_3.length; _i++) {
                    file = dbFiles_3[_i];
                    result.coverage.total++;
                    result.coverage.checked++;
                    content = fs.readFileSync(file, 'utf-8');
                    hasTryCatch = /try\s*{[\s\S]*?}\s*catch/g.test(content);
                    hasAsyncFunction = /async\s+function|async\s*\(/g.test(content);
                    if (hasAsyncFunction && !hasTryCatch) {
                        result.issues.push({
                            severity: 'critical',
                            file: file,
                            message: 'Async database function without try-catch',
                            suggestion: 'Wrap database operations in try-catch blocks'
                        });
                    }
                    else {
                        result.coverage.passed++;
                    }
                }
                hookFiles = this.findFiles('**/hooks/**/*.ts', '**/hooks/**/*.tsx');
                for (_a = 0, hookFiles_2 = hookFiles; _a < hookFiles_2.length; _a++) {
                    file = hookFiles_2[_a];
                    result.coverage.total++;
                    result.coverage.checked++;
                    content = fs.readFileSync(file, 'utf-8');
                    hasErrorState = /error|Error|isError|hasError/g.test(content);
                    hasUseState = /useState|useQuery|useMutation/g.test(content);
                    if (hasUseState && !hasErrorState) {
                        result.issues.push({
                            severity: 'warning',
                            file: file,
                            message: 'Hook missing error state management',
                            suggestion: 'Add error state: const [error, setError] = useState(null)'
                        });
                    }
                    else {
                        result.coverage.passed++;
                    }
                }
                componentFiles = this.findFiles('**/components/**/*.tsx');
                for (_b = 0, componentFiles_2 = componentFiles; _b < componentFiles_2.length; _b++) {
                    file = componentFiles_2[_b];
                    content = fs.readFileSync(file, 'utf-8');
                    usesHook = /use[A-Z]\w+\(/g.test(content);
                    hasErrorUI = /\{error\s*&&|error\s*\?|<Error/g.test(content);
                    if (usesHook && !hasErrorUI) {
                        result.coverage.total++;
                        result.coverage.checked++;
                        result.issues.push({
                            severity: 'warning',
                            file: file,
                            message: 'Component missing error UI handling',
                            suggestion: 'Add {error && <ErrorMessage />} to handle errors'
                        });
                    }
                }
                result.score = this.calculateScore(result.coverage);
                result.status = result.score >= 80 ? 'pass' : result.score >= 50 ? 'warning' : 'fail';
                this.results.push(result);
                return [2 /*return*/];
            });
        });
    };
    /**
     * Rule 4: Loading States (15% of bugs)
     */
    NineRulesValidator.prototype.rule4_LoadingStates = function () {
        return __awaiter(this, void 0, void 0, function () {
            var result, hookFiles, _i, hookFiles_3, file, content, hasLoadingState, hasAsyncOperation, componentFiles, _a, componentFiles_3, file, content, usesAsyncHook, hasLoadingUI;
            return __generator(this, function (_b) {
                result = {
                    rule: 'Loading States',
                    ruleNumber: 4,
                    status: 'pass',
                    score: 100,
                    issues: [],
                    coverage: { checked: 0, passed: 0, total: 0 }
                };
                hookFiles = this.findFiles('**/hooks/**/*.ts', '**/hooks/**/*.tsx');
                for (_i = 0, hookFiles_3 = hookFiles; _i < hookFiles_3.length; _i++) {
                    file = hookFiles_3[_i];
                    result.coverage.total++;
                    result.coverage.checked++;
                    content = fs.readFileSync(file, 'utf-8');
                    hasLoadingState = /loading|Loading|isLoading|isPending|isFetching/gi.test(content);
                    hasAsyncOperation = /useQuery|useMutation|fetch|axios/gi.test(content);
                    if (hasAsyncOperation && !hasLoadingState) {
                        result.issues.push({
                            severity: 'warning',
                            file: file,
                            message: 'Hook with async operation missing loading state',
                            suggestion: 'Add isLoading or isPending state'
                        });
                    }
                    else {
                        result.coverage.passed++;
                    }
                }
                componentFiles = this.findFiles('**/components/**/*.tsx', '**/app/**/*.tsx');
                for (_a = 0, componentFiles_3 = componentFiles; _a < componentFiles_3.length; _a++) {
                    file = componentFiles_3[_a];
                    content = fs.readFileSync(file, 'utf-8');
                    usesAsyncHook = /use\w*(Query|Mutation|Fetch)/g.test(content);
                    hasLoadingUI = /\{.*loading.*\?|<.*Skeleton|<.*Spinner|<.*Loading/gi.test(content);
                    if (usesAsyncHook && !hasLoadingUI) {
                        result.coverage.total++;
                        result.coverage.checked++;
                        result.issues.push({
                            severity: 'warning',
                            file: file,
                            message: 'Component missing loading UI',
                            suggestion: 'Add {isLoading && <Skeleton />} or similar loading state'
                        });
                    }
                }
                result.score = this.calculateScore(result.coverage);
                result.status = result.score >= 80 ? 'pass' : result.score >= 50 ? 'warning' : 'fail';
                this.results.push(result);
                return [2 /*return*/];
            });
        });
    };
    /**
     * Rule 5: API Type Safety (10% of bugs)
     */
    NineRulesValidator.prototype.rule5_APITypeSafety = function () {
        return __awaiter(this, void 0, void 0, function () {
            var result, apiFiles, _i, apiFiles_1, file, content, hasRequestParse, hasPostOrPut, hasResponseParse, returnsData;
            return __generator(this, function (_a) {
                result = {
                    rule: 'API Type Safety',
                    ruleNumber: 5,
                    status: 'pass',
                    score: 100,
                    issues: [],
                    coverage: { checked: 0, passed: 0, total: 0 }
                };
                apiFiles = this.findFiles('**/api/**/*.ts', '**/api/**/*.tsx');
                for (_i = 0, apiFiles_1 = apiFiles; _i < apiFiles_1.length; _i++) {
                    file = apiFiles_1[_i];
                    result.coverage.total++;
                    result.coverage.checked++;
                    content = fs.readFileSync(file, 'utf-8');
                    hasRequestParse = /\.parse\(.*req\.body|\.parse\(.*request\.json/gi.test(content);
                    hasPostOrPut = /export.*POST|export.*PUT|export.*PATCH/gi.test(content);
                    if (hasPostOrPut && !hasRequestParse) {
                        result.issues.push({
                            severity: 'critical',
                            file: file,
                            message: 'API endpoint missing request validation',
                            suggestion: 'Add RequestSchema.parse(req.body) to validate input'
                        });
                    }
                    else if (hasPostOrPut) {
                        result.coverage.passed++;
                    }
                    hasResponseParse = /return.*\.parse\(|Response\.json\(.*\.parse/gi.test(content);
                    returnsData = /return.*Response|return.*res\./gi.test(content);
                    if (returnsData && !hasResponseParse) {
                        result.issues.push({
                            severity: 'warning',
                            file: file,
                            message: 'API endpoint missing response validation',
                            suggestion: 'Validate response with ResponseSchema.parse(data) before returning'
                        });
                    }
                }
                result.score = this.calculateScore(result.coverage);
                result.status = result.score >= 80 ? 'pass' : result.score >= 50 ? 'warning' : 'fail';
                this.results.push(result);
                return [2 /*return*/];
            });
        });
    };
    /**
     * Rule 6: Registry Usage - No Raw Strings
     */
    NineRulesValidator.prototype.rule6_RegistryUsage = function () {
        return __awaiter(this, void 0, void 0, function () {
            var result, allTsFiles, _loop_3, _i, allTsFiles_1, file;
            return __generator(this, function (_a) {
                result = {
                    rule: 'Registry Usage (No Raw Strings)',
                    ruleNumber: 6,
                    status: 'pass',
                    score: 100,
                    issues: [],
                    coverage: { checked: 0, passed: 0, total: 0 }
                };
                allTsFiles = this.findFiles('**/*.ts', '**/*.tsx');
                _loop_3 = function (file) {
                    // Skip node_modules and .next
                    if (file.includes('node_modules') || file.includes('.next'))
                        return "continue";
                    var content = fs.readFileSync(file, 'utf-8');
                    var lines = content.split('\n');
                    // Check for raw route strings
                    var rawRoutes = content.match(/['"`]\/(?!\/)[a-zA-Z][^'"`]*['"`]/g);
                    if (rawRoutes) {
                        // Deduplicate routes
                        var uniqueRoutes = __spreadArray([], new Set(rawRoutes), true);
                        result.coverage.total += uniqueRoutes.length;
                        result.coverage.checked += uniqueRoutes.length;
                        uniqueRoutes.forEach(function (route) {
                            // Skip imports and certain patterns
                            if (!route.includes('import') && !route.includes('require')) {
                                // Find line number
                                var lineNum = 0;
                                for (var i = 0; i < lines.length; i++) {
                                    if (lines[i].includes(route)) {
                                        lineNum = i + 1;
                                        break;
                                    }
                                }
                                result.issues.push({
                                    severity: 'warning',
                                    file: file,
                                    line: lineNum,
                                    message: "Raw route string found: ".concat(route),
                                    suggestion: 'Use Routes.routeName from constants/registry',
                                    codeSnippet: route
                                });
                            }
                            else {
                                result.coverage.passed++;
                            }
                        });
                    }
                    // Check for raw query keys
                    var rawQueryKeys = content.match(/\[['"`]\w+['"`]\]/g);
                    if (rawQueryKeys) {
                        // Deduplicate keys
                        var uniqueKeys = __spreadArray([], new Set(rawQueryKeys), true);
                        result.coverage.total += uniqueKeys.length;
                        result.coverage.checked += uniqueKeys.length;
                        uniqueKeys.forEach(function (key) {
                            // Find line number
                            var lineNum = 0;
                            for (var i = 0; i < lines.length; i++) {
                                if (lines[i].includes(key)) {
                                    lineNum = i + 1;
                                    break;
                                }
                            }
                            result.issues.push({
                                severity: 'warning',
                                file: file,
                                line: lineNum,
                                message: "Raw query key found: ".concat(key),
                                suggestion: 'Use QueryKeys.keyName() from constants/registry',
                                codeSnippet: key
                            });
                        });
                    }
                };
                for (_i = 0, allTsFiles_1 = allTsFiles; _i < allTsFiles_1.length; _i++) {
                    file = allTsFiles_1[_i];
                    _loop_3(file);
                }
                result.score = this.calculateScore(result.coverage);
                result.status = result.score >= 80 ? 'pass' : result.score >= 50 ? 'warning' : 'fail';
                this.results.push(result);
                return [2 /*return*/];
            });
        });
    };
    /**
     * Rule 7: Mutation Hygiene
     */
    NineRulesValidator.prototype.rule7_MutationHygiene = function () {
        return __awaiter(this, void 0, void 0, function () {
            var result, hookFiles, _i, hookFiles_4, file, content, hasInvalidation, hasOptimisticUpdate, hasRollback;
            return __generator(this, function (_a) {
                result = {
                    rule: 'Mutation Hygiene',
                    ruleNumber: 7,
                    status: 'pass',
                    score: 100,
                    issues: [],
                    coverage: { checked: 0, passed: 0, total: 0 }
                };
                hookFiles = this.findFiles('**/hooks/**/*.ts', '**/hooks/**/*.tsx');
                for (_i = 0, hookFiles_4 = hookFiles; _i < hookFiles_4.length; _i++) {
                    file = hookFiles_4[_i];
                    content = fs.readFileSync(file, 'utf-8');
                    if (content.includes('useMutation')) {
                        result.coverage.total++;
                        result.coverage.checked++;
                        hasInvalidation = /invalidateQueries|setQueryData|refetch/gi.test(content);
                        hasOptimisticUpdate = /optimisticUpdate|onMutate.*setQueryData/gi.test(content);
                        hasRollback = hasOptimisticUpdate ? /onError.*setQueryData/gi.test(content) : true;
                        if (!hasInvalidation) {
                            result.issues.push({
                                severity: 'critical',
                                file: file,
                                message: 'Mutation missing cache invalidation',
                                suggestion: 'Add queryClient.invalidateQueries() in onSuccess callback'
                            });
                        }
                        else {
                            result.coverage.passed++;
                        }
                        if (hasOptimisticUpdate && !hasRollback) {
                            result.issues.push({
                                severity: 'warning',
                                file: file,
                                message: 'Optimistic update without rollback',
                                suggestion: 'Add rollback logic in onError callback'
                            });
                        }
                    }
                }
                result.score = this.calculateScore(result.coverage);
                result.status = result.score >= 80 ? 'pass' : result.score >= 50 ? 'warning' : 'fail';
                this.results.push(result);
                return [2 /*return*/];
            });
        });
    };
    /**
     * Rule 8: Form Validation (Both Sides)
     */
    NineRulesValidator.prototype.rule8_FormValidation = function () {
        return __awaiter(this, void 0, void 0, function () {
            var result, formFiles, _i, formFiles_1, file, content, hasZodResolver, hasValidation, apiFiles, _a, apiFiles_2, file, content, hasServerValidation;
            return __generator(this, function (_b) {
                result = {
                    rule: 'Form Validation (Both Sides)',
                    ruleNumber: 8,
                    status: 'pass',
                    score: 100,
                    issues: [],
                    coverage: { checked: 0, passed: 0, total: 0 }
                };
                formFiles = this.findFiles('**/components/**/*.tsx', '**/app/**/*.tsx');
                for (_i = 0, formFiles_1 = formFiles; _i < formFiles_1.length; _i++) {
                    file = formFiles_1[_i];
                    content = fs.readFileSync(file, 'utf-8');
                    if (content.includes('<form') || content.includes('useForm')) {
                        result.coverage.total++;
                        result.coverage.checked++;
                        hasZodResolver = /zodResolver|yupResolver/gi.test(content);
                        hasValidation = /validate|validation|rules/gi.test(content);
                        if (!hasZodResolver && !hasValidation) {
                            result.issues.push({
                                severity: 'warning',
                                file: file,
                                message: 'Form without client-side validation',
                                suggestion: 'Use useForm({ resolver: zodResolver(Schema) })'
                            });
                        }
                        else {
                            result.coverage.passed++;
                        }
                    }
                }
                apiFiles = this.findFiles('**/api/**/*.ts');
                for (_a = 0, apiFiles_2 = apiFiles; _a < apiFiles_2.length; _a++) {
                    file = apiFiles_2[_a];
                    content = fs.readFileSync(file, 'utf-8');
                    if (/POST|PUT|PATCH/gi.test(content)) {
                        hasServerValidation = /\.parse\(|\.safeParse\(/gi.test(content);
                        if (!hasServerValidation) {
                            result.issues.push({
                                severity: 'critical',
                                file: file,
                                message: 'API endpoint without server-side validation',
                                suggestion: 'Add Schema.parse(req.body) before processing'
                            });
                        }
                    }
                }
                result.score = this.calculateScore(result.coverage);
                result.status = result.score >= 80 ? 'pass' : result.score >= 50 ? 'warning' : 'fail';
                this.results.push(result);
                return [2 /*return*/];
            });
        });
    };
    /**
     * Rule 9: Auth Guard Matrix
     */
    NineRulesValidator.prototype.rule9_AuthGuardMatrix = function () {
        return __awaiter(this, void 0, void 0, function () {
            var result, protectedRoutePatterns, pageFiles, _loop_4, _i, pageFiles_1, file, apiFiles, _loop_5, _a, apiFiles_3, file;
            return __generator(this, function (_b) {
                result = {
                    rule: 'Auth Guard Matrix',
                    ruleNumber: 9,
                    status: 'pass',
                    score: 100,
                    issues: [],
                    coverage: { checked: 0, passed: 0, total: 0 }
                };
                protectedRoutePatterns = [
                    'admin', 'dashboard', 'settings', 'profile', 'account',
                    'billing', 'subscription', 'api/admin', 'api/user'
                ];
                pageFiles = this.findFiles('**/app/**/page.tsx', '**/pages/**/*.tsx');
                _loop_4 = function (file) {
                    var routePath = file.toLowerCase();
                    var isProtected = protectedRoutePatterns.some(function (pattern) { return routePath.includes(pattern); });
                    if (isProtected) {
                        result.coverage.total++;
                        result.coverage.checked++;
                        var content = fs.readFileSync(file, 'utf-8');
                        var hasAuthGuard = /withAuth|requireAuth|useAuth|getServerSession|middleware/gi.test(content);
                        if (!hasAuthGuard) {
                            result.issues.push({
                                severity: 'critical',
                                file: file,
                                message: 'Protected route without auth guard',
                                suggestion: 'Wrap component with withAuth() or add auth check'
                            });
                        }
                        else {
                            result.coverage.passed++;
                        }
                    }
                };
                for (_i = 0, pageFiles_1 = pageFiles; _i < pageFiles_1.length; _i++) {
                    file = pageFiles_1[_i];
                    _loop_4(file);
                }
                apiFiles = this.findFiles('**/api/**/*.ts');
                _loop_5 = function (file) {
                    var routePath = file.toLowerCase();
                    var isProtected = protectedRoutePatterns.some(function (pattern) { return routePath.includes(pattern); });
                    if (isProtected) {
                        result.coverage.total++;
                        result.coverage.checked++;
                        var content = fs.readFileSync(file, 'utf-8');
                        var hasAuthCheck = /verifyAuth|getSession|verifyToken|isAuthenticated/gi.test(content);
                        if (!hasAuthCheck) {
                            result.issues.push({
                                severity: 'critical',
                                file: file,
                                message: 'Protected API endpoint without auth verification',
                                suggestion: 'Add verifyAuth() or session check at the beginning'
                            });
                        }
                        else {
                            result.coverage.passed++;
                        }
                    }
                };
                for (_a = 0, apiFiles_3 = apiFiles; _a < apiFiles_3.length; _a++) {
                    file = apiFiles_3[_a];
                    _loop_5(file);
                }
                result.score = this.calculateScore(result.coverage);
                result.status = result.score >= 80 ? 'pass' : result.score >= 50 ? 'warning' : 'fail';
                this.results.push(result);
                return [2 /*return*/];
            });
        });
    };
    /**
     * Helper Methods
     */
    NineRulesValidator.prototype.checkTwoWayValidation = function (content) {
        // Check if both input and output are validated
        var hasInputValidation = /\.parse\(.*(?:req|request|input|data|body)/gi.test(content);
        var hasOutputValidation = /\.parse\(.*(?:result|response|output|rows|data)\)/gi.test(content);
        return hasInputValidation && hasOutputValidation;
    };
    NineRulesValidator.prototype.findFiles = function () {
        var patterns = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            patterns[_i] = arguments[_i];
        }
        var files = [];
        var searchDirs = ['src', 'app', 'pages', 'components', 'lib', 'hooks', 'api'];
        for (var _a = 0, searchDirs_1 = searchDirs; _a < searchDirs_1.length; _a++) {
            var dir = searchDirs_1[_a];
            var dirPath = path.join(this.projectPath, dir);
            if (fs.existsSync(dirPath)) {
                var foundFiles = this.getFilesRecursive(dirPath, patterns);
                files.push.apply(files, foundFiles);
            }
        }
        return files;
    };
    NineRulesValidator.prototype.getFilesRecursive = function (dir, patterns) {
        var files = [];
        if (!fs.existsSync(dir))
            return files;
        var items = fs.readdirSync(dir, { withFileTypes: true });
        var _loop_6 = function (item) {
            var fullPath = path.join(dir, item.name);
            if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
                files.push.apply(files, this_1.getFilesRecursive(fullPath, patterns));
            }
            else if (item.isFile()) {
                // Check if file matches any pattern
                var matches = patterns.some(function (pattern) {
                    // Handle different pattern types
                    if (pattern.includes('**/')) {
                        // Pattern like **/hooks/**/*.ts or **/app/**/*.tsx
                        var parts = pattern.split('**/').filter(function (p) { return p; });
                        // Check each part
                        for (var _i = 0, parts_1 = parts; _i < parts_1.length; _i++) {
                            var part = parts_1[_i];
                            if (part.includes('*')) {
                                // Handle file extension patterns like *.ts
                                var ext = part.replace('*', '');
                                if (!fullPath.endsWith(ext))
                                    return false;
                            }
                            else if (part.includes('/')) {
                                // Handle folder patterns like hooks/ or components/
                                var folder = part.replace(/\//g, path.sep).replace(/\*\./g, '');
                                if (!fullPath.includes(path.sep + folder.replace(/\*$/, '')))
                                    return false;
                            }
                        }
                        return true;
                    }
                    else if (pattern.startsWith('**/')) {
                        // Pattern like **/*.ts
                        var ext = pattern.replace('**/', '').replace('*', '');
                        return fullPath.endsWith(ext);
                    }
                    else {
                        // Simple contains check
                        return fullPath.includes(pattern);
                    }
                });
                if (matches) {
                    files.push(fullPath);
                }
            }
        };
        var this_1 = this;
        for (var _i = 0, items_1 = items; _i < items_1.length; _i++) {
            var item = items_1[_i];
            _loop_6(item);
        }
        return files;
    };
    NineRulesValidator.prototype.calculateScore = function (coverage) {
        if (coverage.total === 0)
            return 100; // No items to check = pass
        return Math.round((coverage.passed / coverage.total) * 100);
    };
    NineRulesValidator.prototype.generateSummary = function () {
        var _a, _b, _c, _d, _e, _f;
        var criticalIssues = this.results.reduce(function (sum, r) {
            return sum + r.issues.filter(function (i) { return i.severity === 'critical'; }).length;
        }, 0);
        var warnings = this.results.reduce(function (sum, r) {
            return sum + r.issues.filter(function (i) { return i.severity === 'warning'; }).length;
        }, 0);
        var passedRules = this.results.filter(function (r) { return r.status === 'pass'; }).length;
        var overallScore = Math.round(this.results.reduce(function (sum, r) { return sum + r.score; }, 0) / this.results.length);
        // Calculate specific metrics
        var metrics = {
            contractCoverage: ((_a = this.results[0]) === null || _a === void 0 ? void 0 : _a.score) || 0, // Rule 1
            parseCoverage: (((_b = this.results[0]) === null || _b === void 0 ? void 0 : _b.score) || 0 + ((_c = this.results[4]) === null || _c === void 0 ? void 0 : _c.score) || 0) / 2, // Rules 1 & 5
            dbDriftScore: ((_d = this.results[0]) === null || _d === void 0 ? void 0 : _d.score) || 0, // Rule 1
            cacheHygiene: ((_e = this.results[6]) === null || _e === void 0 ? void 0 : _e.score) || 0, // Rule 7
            authCoverage: ((_f = this.results[8]) === null || _f === void 0 ? void 0 : _f.score) || 0, // Rule 9
        };
        return {
            overallScore: overallScore,
            passedRules: passedRules,
            totalRules: 9,
            criticalIssues: criticalIssues,
            warnings: warnings,
            results: this.results,
            metrics: metrics
        };
    };
    /**
     * Generate actionable report
     */
    NineRulesValidator.prototype.generateReport = function (summary) {
        var report = '# 🔍 AI Observer - 9 Rules Validation Report\n\n';
        // Overall health
        var grade = summary.overallScore >= 90 ? 'A' :
            summary.overallScore >= 80 ? 'B' :
                summary.overallScore >= 70 ? 'C' :
                    summary.overallScore >= 60 ? 'D' : 'F';
        report += "## Overall Health: ".concat(grade, " (").concat(summary.overallScore, "%)\n\n");
        report += "- \u2705 Passed Rules: ".concat(summary.passedRules, "/9\n");
        report += "- \u274C Critical Issues: ".concat(summary.criticalIssues, "\n");
        report += "- \u26A0\uFE0F  Warnings: ".concat(summary.warnings, "\n\n");
        // Key metrics
        report += '## Key Metrics\n\n';
        report += "- Contract Coverage: ".concat(summary.metrics.contractCoverage, "%\n");
        report += "- Parse Coverage: ".concat(summary.metrics.parseCoverage, "%\n");
        report += "- DB Drift Score: ".concat(summary.metrics.dbDriftScore, "%\n");
        report += "- Cache Hygiene: ".concat(summary.metrics.cacheHygiene, "%\n");
        report += "- Auth Coverage: ".concat(summary.metrics.authCoverage, "%\n\n");
        // Detailed results
        report += '## Detailed Results\n\n';
        for (var _i = 0, _a = summary.results; _i < _a.length; _i++) {
            var result = _a[_i];
            var icon = result.status === 'pass' ? '✅' :
                result.status === 'warning' ? '⚠️' : '❌';
            report += "### ".concat(icon, " Rule ").concat(result.ruleNumber, ": ").concat(result.rule, "\n");
            report += "Score: ".concat(result.score, "% | Issues: ").concat(result.issues.length, "\n\n");
            if (result.issues.length > 0) {
                report += 'Issues found:\n';
                result.issues.slice(0, 5).forEach(function (issue) {
                    report += "- **".concat(issue.severity, "**: ").concat(issue.message, "\n");
                    report += "  File: ".concat(issue.file, "\n");
                    report += "  Fix: ".concat(issue.suggestion, "\n");
                });
                if (result.issues.length > 5) {
                    report += "\n...and ".concat(result.issues.length - 5, " more issues\n");
                }
                report += '\n';
            }
        }
        // Action items
        report += '## 🎯 Priority Actions\n\n';
        var criticalResults = summary.results
            .filter(function (r) { return r.issues.some(function (i) { return i.severity === 'critical'; }); })
            .sort(function (a, b) { return a.score - b.score; });
        if (criticalResults.length > 0) {
            report += '1. **Fix Critical Issues First:**\n';
            criticalResults.slice(0, 3).forEach(function (r) {
                report += "   - ".concat(r.rule, ": ").concat(r.issues.filter(function (i) { return i.severity === 'critical'; }).length, " critical issues\n");
            });
        }
        return report;
    };
    /**
     * Check for large files that AI might struggle with
     */
    NineRulesValidator.prototype.checkFileSizeWarnings = function () {
        return __awaiter(this, void 0, void 0, function () {
            var result, files, _i, files_1, file, content, lines;
            return __generator(this, function (_a) {
                result = {
                    rule: 'File Size Warnings',
                    ruleNumber: 10,
                    status: 'pass',
                    score: 100,
                    issues: [],
                    coverage: { checked: 0, passed: 0, total: 0 }
                };
                files = this.findFiles('**/*.ts', '**/*.tsx');
                for (_i = 0, files_1 = files; _i < files_1.length; _i++) {
                    file = files_1[_i];
                    content = fs.readFileSync(file, 'utf-8');
                    lines = content.split('\n').length;
                    result.coverage.total++;
                    result.coverage.checked++;
                    if (lines > 1000) {
                        result.issues.push({
                            severity: 'critical',
                            file: file,
                            message: "File has ".concat(lines, " lines (exceeds 1000 lines)"),
                            suggestion: 'Split into smaller modules - AI loses context in large files'
                        });
                    }
                    else if (lines > 500) {
                        result.issues.push({
                            severity: 'warning',
                            file: file,
                            message: "File has ".concat(lines, " lines (exceeds 500 lines)"),
                            suggestion: 'Consider splitting - AI performs better with smaller files'
                        });
                    }
                    else {
                        result.coverage.passed++;
                    }
                }
                result.score = this.calculateScore(result.coverage);
                result.status = result.score >= 80 ? 'pass' : result.score >= 50 ? 'warning' : 'fail';
                this.results.push(result);
                return [2 /*return*/];
            });
        });
    };
    /**
     * Check for duplicate function definitions
     */
    NineRulesValidator.prototype.checkDuplicateFunctions = function () {
        return __awaiter(this, void 0, void 0, function () {
            var result, functionMap, files, _i, files_2, file, content, functionRegex, match, funcName, _a, _b, _c, funcName, locations;
            return __generator(this, function (_d) {
                result = {
                    rule: 'Duplicate Functions',
                    ruleNumber: 11,
                    status: 'pass',
                    score: 100,
                    issues: [],
                    coverage: { checked: 0, passed: 0, total: 0 }
                };
                functionMap = new Map();
                files = this.findFiles('**/*.ts', '**/*.tsx');
                for (_i = 0, files_2 = files; _i < files_2.length; _i++) {
                    file = files_2[_i];
                    content = fs.readFileSync(file, 'utf-8');
                    functionRegex = /(?:export\s+)?(?:async\s+)?function\s+(\w+)|(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s*)?\(/g;
                    match = void 0;
                    while ((match = functionRegex.exec(content)) !== null) {
                        funcName = match[1] || match[2];
                        if (funcName) {
                            if (!functionMap.has(funcName)) {
                                functionMap.set(funcName, []);
                            }
                            functionMap.get(funcName).push(file);
                        }
                    }
                }
                // Check for duplicates
                for (_a = 0, _b = functionMap.entries(); _a < _b.length; _a++) {
                    _c = _b[_a], funcName = _c[0], locations = _c[1];
                    result.coverage.total++;
                    result.coverage.checked++;
                    if (locations.length > 1) {
                        result.issues.push({
                            severity: 'warning',
                            file: locations.join(', '),
                            message: "Function '".concat(funcName, "' defined in ").concat(locations.length, " files"),
                            suggestion: 'AI might use wrong version - consolidate or rename functions'
                        });
                    }
                    else {
                        result.coverage.passed++;
                    }
                }
                result.score = this.calculateScore(result.coverage);
                result.status = result.score >= 80 ? 'pass' : result.score >= 50 ? 'warning' : 'fail';
                this.results.push(result);
                return [2 /*return*/];
            });
        });
    };
    /**
     * Check if exports match what's expected (no missing data)
     */
    NineRulesValidator.prototype.checkExportCompleteness = function () {
        return __awaiter(this, void 0, void 0, function () {
            var result, hookFiles, _loop_7, _i, hookFiles_5, file;
            return __generator(this, function (_a) {
                result = {
                    rule: 'Export Completeness',
                    ruleNumber: 12,
                    status: 'pass',
                    score: 100,
                    issues: [],
                    coverage: { checked: 0, passed: 0, total: 0 }
                };
                hookFiles = this.findFiles('**/hooks/**/*.ts');
                _loop_7 = function (file) {
                    var content = fs.readFileSync(file, 'utf-8');
                    result.coverage.total++;
                    result.coverage.checked++;
                    // Check if hook returns an object
                    if (content.includes('return {')) {
                        // Extract what's being returned
                        var returnMatch = content.match(/return\s+{([^}]+)}/);
                        if (returnMatch) {
                            var returnedItems_1 = returnMatch[1].split(',').map(function (s) { return s.trim().split(':')[0]; });
                            // Check if common expected items are missing
                            var expectedItems = ['data', 'loading', 'error'];
                            var hasDataOperation = /create|update|delete|fetch|get|load/i.test(content);
                            if (hasDataOperation) {
                                var missingItems = expectedItems.filter(function (item) {
                                    return !returnedItems_1.some(function (returned) { return returned.includes(item); });
                                });
                                if (missingItems.length > 0) {
                                    result.issues.push({
                                        severity: 'warning',
                                        file: file,
                                        message: "Hook may be missing exports: ".concat(missingItems.join(', ')),
                                        suggestion: 'AI expects standard returns - add missing properties'
                                    });
                                }
                                else {
                                    result.coverage.passed++;
                                }
                            }
                            else {
                                result.coverage.passed++;
                            }
                        }
                    }
                    else {
                        result.coverage.passed++;
                    }
                };
                for (_i = 0, hookFiles_5 = hookFiles; _i < hookFiles_5.length; _i++) {
                    file = hookFiles_5[_i];
                    _loop_7(file);
                }
                result.score = this.calculateScore(result.coverage);
                result.status = result.score >= 80 ? 'pass' : result.score >= 50 ? 'warning' : 'fail';
                this.results.push(result);
                return [2 /*return*/];
            });
        });
    };
    return NineRulesValidator;
}());
exports.NineRulesValidator = NineRulesValidator;
// Export for CLI usage
function runValidation(projectPath) {
    return __awaiter(this, void 0, void 0, function () {
        var validator, summary, report, reportPath;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    validator = new NineRulesValidator(projectPath || process.cwd());
                    return [4 /*yield*/, validator.validateAll()];
                case 1:
                    summary = _a.sent();
                    report = validator.generateReport(summary);
                    console.log(report);
                    reportPath = path.join(projectPath || process.cwd(), '.observer', 'validation-report.md');
                    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
                    fs.writeFileSync(reportPath, report);
                    console.log("\n\uD83D\uDCCA Report saved to: ".concat(reportPath));
                    // Exit with error if score is too low
                    if (summary.overallScore < 60) {
                        console.error('\n❌ Validation failed! Score below 60%');
                        process.exit(1);
                    }
                    return [2 /*return*/];
            }
        });
    });
}
