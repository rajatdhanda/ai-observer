"use strict";
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
exports.ProjectAnalyzer = void 0;
var fs = require("fs");
var path = require("path");
var framework_detector_1 = require("./framework-detector");
var type_extractor_1 = require("./type-extractor");
var data_flow_mapper_1 = require("./data-flow-mapper");
var entity_identifier_1 = require("./entity-identifier");
var rule_generator_1 = require("./rule-generator");
var ProjectAnalyzer = /** @class */ (function () {
    function ProjectAnalyzer() {
        this.frameworkDetector = new framework_detector_1.FrameworkDetector();
        this.typeExtractor = new type_extractor_1.TypeExtractor();
        this.dataFlowMapper = new data_flow_mapper_1.DataFlowMapper();
        this.entityIdentifier = new entity_identifier_1.EntityIdentifier();
        this.ruleGenerator = new rule_generator_1.ValidationRuleGenerator();
    }
    ProjectAnalyzer.prototype.analyze = function (projectPath) {
        return __awaiter(this, void 0, void 0, function () {
            var projectName, framework, types, dataFlow, entities, validationRules, analysis;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("\uD83D\uDD0D Analyzing project: ".concat(projectPath));
                        // Validate project path
                        if (!fs.existsSync(projectPath)) {
                            throw new Error("Project path does not exist: ".concat(projectPath));
                        }
                        projectName = path.basename(projectPath);
                        // Step 1: Detect framework and dependencies
                        console.log('📦 Detecting framework...');
                        return [4 /*yield*/, this.frameworkDetector.detect(projectPath)];
                    case 1:
                        framework = _a.sent();
                        // Step 2: Extract type system
                        console.log('🔤 Extracting types...');
                        return [4 /*yield*/, this.typeExtractor.extract(projectPath)];
                    case 2:
                        types = _a.sent();
                        // Step 3: Map data flow
                        console.log('🔄 Mapping data flow...');
                        return [4 /*yield*/, this.dataFlowMapper.map(projectPath, types)];
                    case 3:
                        dataFlow = _a.sent();
                        // Step 4: Identify business entities
                        console.log('🏢 Identifying business entities...');
                        return [4 /*yield*/, this.entityIdentifier.identify(types, dataFlow)];
                    case 4:
                        entities = _a.sent();
                        // Step 5: Generate validation rules
                        console.log('✅ Generating validation rules...');
                        return [4 /*yield*/, this.ruleGenerator.generate(types, entities, dataFlow)];
                    case 5:
                        validationRules = _a.sent();
                        analysis = {
                            projectPath: projectPath,
                            projectName: projectName,
                            framework: framework,
                            types: types,
                            dataFlow: dataFlow,
                            entities: entities,
                            validationRules: validationRules,
                            timestamp: new Date().toISOString()
                        };
                        // Save analysis to file
                        this.saveAnalysis(analysis);
                        console.log('✨ Analysis complete!');
                        return [2 /*return*/, analysis];
                }
            });
        });
    };
    ProjectAnalyzer.prototype.saveAnalysis = function (analysis) {
        var outputDir = path.join(process.cwd(), '.observer');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        var outputPath = path.join(outputDir, 'analysis.json');
        fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2));
        console.log("\uD83D\uDCBE Analysis saved to: ".concat(outputPath));
    };
    ProjectAnalyzer.prototype.watch = function (projectPath) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: 
                    // Initial analysis
                    return [4 /*yield*/, this.analyze(projectPath)];
                    case 1:
                        // Initial analysis
                        _a.sent();
                        // Set up file watcher for real-time updates
                        console.log('👁️ Watching for changes...');
                        fs.watch(projectPath, { recursive: true }, function (eventType, filename) { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        if (!(filename && this.shouldAnalyzeFile(filename))) return [3 /*break*/, 2];
                                        console.log("\uD83D\uDD04 Change detected in ".concat(filename));
                                        // Incremental analysis could be implemented here
                                        return [4 /*yield*/, this.analyze(projectPath)];
                                    case 1:
                                        // Incremental analysis could be implemented here
                                        _a.sent();
                                        _a.label = 2;
                                    case 2: return [2 /*return*/];
                                }
                            });
                        }); });
                        return [2 /*return*/];
                }
            });
        });
    };
    ProjectAnalyzer.prototype.shouldAnalyzeFile = function (filename) {
        var extensions = ['.ts', '.tsx', '.js', '.jsx', '.json'];
        var excludes = ['node_modules', '.next', 'dist', 'build', '.git'];
        return extensions.some(function (ext) { return filename.endsWith(ext); }) &&
            !excludes.some(function (exclude) { return filename.includes(exclude); });
    };
    return ProjectAnalyzer;
}());
exports.ProjectAnalyzer = ProjectAnalyzer;
