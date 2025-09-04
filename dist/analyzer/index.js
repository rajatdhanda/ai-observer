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
exports.ProjectAnalyzer = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const framework_detector_1 = require("./framework-detector");
const type_extractor_1 = require("./type-extractor");
const data_flow_mapper_1 = require("./data-flow-mapper");
const entity_identifier_1 = require("./entity-identifier");
const rule_generator_1 = require("./rule-generator");
class ProjectAnalyzer {
    frameworkDetector;
    typeExtractor;
    dataFlowMapper;
    entityIdentifier;
    ruleGenerator;
    constructor() {
        this.frameworkDetector = new framework_detector_1.FrameworkDetector();
        this.typeExtractor = new type_extractor_1.TypeExtractor();
        this.dataFlowMapper = new data_flow_mapper_1.DataFlowMapper();
        this.entityIdentifier = new entity_identifier_1.EntityIdentifier();
        this.ruleGenerator = new rule_generator_1.ValidationRuleGenerator();
    }
    async analyze(projectPath) {
        console.log(`🔍 Analyzing project: ${projectPath}`);
        // Validate project path
        if (!fs.existsSync(projectPath)) {
            throw new Error(`Project path does not exist: ${projectPath}`);
        }
        const projectName = path.basename(projectPath);
        // Step 1: Detect framework and dependencies
        console.log('📦 Detecting framework...');
        const framework = await this.frameworkDetector.detect(projectPath);
        // Step 2: Extract type system
        console.log('🔤 Extracting types...');
        const types = await this.typeExtractor.extract(projectPath);
        // Step 3: Map data flow
        console.log('🔄 Mapping data flow...');
        const dataFlow = await this.dataFlowMapper.map(projectPath, types);
        // Step 4: Identify business entities
        console.log('🏢 Identifying business entities...');
        const entities = await this.entityIdentifier.identify(types, dataFlow);
        // Step 5: Generate validation rules
        console.log('✅ Generating validation rules...');
        const validationRules = await this.ruleGenerator.generate(types, entities, dataFlow);
        const analysis = {
            projectPath,
            projectName,
            framework,
            types,
            dataFlow,
            entities,
            validationRules,
            timestamp: new Date().toISOString()
        };
        // Save analysis to file
        this.saveAnalysis(analysis);
        console.log('✨ Analysis complete!');
        return analysis;
    }
    saveAnalysis(analysis) {
        const outputDir = path.join(process.cwd(), '.observer');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        const outputPath = path.join(outputDir, 'analysis.json');
        fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2));
        console.log(`💾 Analysis saved to: ${outputPath}`);
    }
    async watch(projectPath) {
        // Initial analysis
        await this.analyze(projectPath);
        // Set up file watcher for real-time updates
        console.log('👁️ Watching for changes...');
        fs.watch(projectPath, { recursive: true }, async (eventType, filename) => {
            if (filename && this.shouldAnalyzeFile(filename)) {
                console.log(`🔄 Change detected in ${filename}`);
                // Incremental analysis could be implemented here
                await this.analyze(projectPath);
            }
        });
    }
    shouldAnalyzeFile(filename) {
        const extensions = ['.ts', '.tsx', '.js', '.jsx', '.json'];
        const excludes = ['node_modules', '.next', 'dist', 'build', '.git'];
        return extensions.some(ext => filename.endsWith(ext)) &&
            !excludes.some(exclude => filename.includes(exclude));
    }
}
exports.ProjectAnalyzer = ProjectAnalyzer;
