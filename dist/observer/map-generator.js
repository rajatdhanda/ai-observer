#!/usr/bin/env ts-node
"use strict";
/**
 * Map Generator - Creates codebase-map.json
 * Just facts, no opinions - simple grep/AST parsing
 * Auto-detects exports, imports, patterns
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
exports.MapGenerator = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class MapGenerator {
    projectPath;
    map = {
        meta: {
            generated: new Date().toISOString(),
            projectPath: '',
            fileCount: 0
        },
        exports: {},
        imports: {},
        entryPoints: {},
        files: {},
        tables: {}
    };
    constructor(projectPath) {
        this.projectPath = projectPath;
        this.map.meta.projectPath = projectPath;
    }
    async generate() {
        console.log('🔍 Generating codebase map...');
        // Get all relevant files
        const files = this.getAllFiles(this.projectPath);
        this.map.meta.fileCount = files.length;
        // Process each file
        for (const file of files) {
            await this.processFile(file);
        }
        // Find entry points
        this.findEntryPoints();
        // Map tables to functions
        this.mapTablesToFunctions();
        console.log(`✅ Processed ${files.length} files`);
        return this.map;
    }
    getAllFiles(dir, files = []) {
        const items = fs.readdirSync(dir);
        for (const item of items) {
            const fullPath = path.join(dir, item);
            // Skip node_modules, .git, etc
            if (item === 'node_modules' || item.startsWith('.'))
                continue;
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
                this.getAllFiles(fullPath, files);
            }
            else if (this.isRelevantFile(item)) {
                files.push(fullPath);
            }
        }
        return files;
    }
    isRelevantFile(filename) {
        return filename.endsWith('.ts') ||
            filename.endsWith('.tsx') ||
            filename.endsWith('.js') ||
            filename.endsWith('.jsx') ||
            filename.endsWith('.json');
    }
    async processFile(filePath) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const relativePath = path.relative(this.projectPath, filePath);
        // Extract exports
        const exports = this.extractExports(content, filePath);
        if (exports.length > 0) {
            this.map.exports[relativePath] = exports;
        }
        // Extract imports
        const imports = this.extractImports(content);
        if (imports.length > 0) {
            this.map.imports[relativePath] = imports;
        }
        // Analyze file patterns
        const analysis = this.analyzeFile(content, filePath);
        if (Object.keys(analysis).length > 0) {
            this.map.files[relativePath] = analysis;
        }
    }
    extractExports(content, filePath) {
        const exports = [];
        const lines = content.split('\n');
        // Match various export patterns
        const patterns = [
            /export\s+(?:const|let|var|function|class)\s+(\w+)/,
            /export\s+{\s*([^}]+)\s*}/,
            /export\s+default\s+(?:function|class)?\s*(\w+)?/
        ];
        lines.forEach((line, index) => {
            for (const pattern of patterns) {
                const match = line.match(pattern);
                if (match) {
                    if (match[1]) {
                        // Handle multiple exports in one line
                        const names = match[1].split(',').map(n => n.trim());
                        names.forEach(name => {
                            if (name && !name.includes(' as ')) {
                                exports.push({ name, line: index + 1 });
                            }
                        });
                    }
                }
            }
        });
        return exports;
    }
    extractImports(content) {
        const imports = [];
        // Match import statements
        const importRegex = /import\s+(?:{[^}]*}|\*\s+as\s+\w+|\w+)?\s*(?:,\s*(?:{[^}]*}|\w+))?\s+from\s+['"]([^'"]+)['"]/g;
        const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
        let match;
        // ES6 imports
        while ((match = importRegex.exec(content)) !== null) {
            const importPath = match[1];
            imports.push(importPath);
        }
        // CommonJS requires
        while ((match = requireRegex.exec(content)) !== null) {
            const importPath = match[1];
            imports.push(importPath);
        }
        return [...new Set(imports)]; // Remove duplicates
    }
    extractImportNames(importStatement) {
        const names = [];
        // Extract named imports
        const namedMatch = importStatement.match(/{([^}]*)}/);
        if (namedMatch) {
            const items = namedMatch[1].split(',');
            items.forEach(item => {
                const name = item.trim().split(' as ')[0].trim();
                if (name)
                    names.push(name);
            });
        }
        // Extract default import
        const defaultMatch = importStatement.match(/import\s+(\w+)\s+from/);
        if (defaultMatch) {
            names.push(defaultMatch[1]);
        }
        return names;
    }
    calculateMetrics(content, filePath) {
        const lines = content.split('\n');
        const isJson = filePath.endsWith('.json');
        if (isJson) {
            // For JSON files, just count meaningful lines (non-empty, non-whitespace)
            const loc = lines.filter(l => l.trim()).length;
            try {
                const jsonData = JSON.parse(content);
                // Estimate complexity based on nesting depth and array sizes
                const complexity = this.calculateJsonComplexity(jsonData);
                return {
                    loc,
                    functions: 0,
                    exports: 0,
                    imports: 0,
                    complexity
                };
            }
            catch (e) {
                return { loc, functions: 0, exports: 0, imports: 0, complexity: 1 };
            }
        }
        // Original logic for code files
        const loc = lines.filter(l => l.trim() && !l.trim().startsWith('//')).length;
        // Count functions (simple regex-based)
        const functionMatches = content.match(/function\s+\w+|=>\s*{|async\s+\w+|constructor\s*\(|class\s+\w+/g) || [];
        const functions = functionMatches.length;
        // Count exports (already calculated elsewhere, but for metrics)
        const exportMatches = content.match(/export\s+/g) || [];
        const exports = exportMatches.length;
        // Count imports
        const importMatches = content.match(/import\s+.+from/g) || [];
        const imports = importMatches.length;
        // Estimate complexity (if statements, loops, switches)
        const complexityPatterns = content.match(/if\s*\(|for\s*\(|while\s*\(|switch\s*\(|\?\s*:|&&|\|\|/g) || [];
        const complexity = complexityPatterns.length + 1; // +1 base complexity
        return { loc, functions, exports, imports, complexity };
    }
    calculateJsonComplexity(obj, depth = 0) {
        if (depth > 10)
            return 1; // Prevent infinite recursion
        let complexity = 1;
        if (Array.isArray(obj)) {
            complexity += Math.min(obj.length / 10, 5); // Large arrays add complexity
            for (const item of obj.slice(0, 3)) { // Sample first few items
                complexity += this.calculateJsonComplexity(item, depth + 1);
            }
        }
        else if (typeof obj === 'object' && obj !== null) {
            const keys = Object.keys(obj);
            complexity += Math.min(keys.length / 5, 3); // Many keys add complexity
            for (const key of keys.slice(0, 5)) { // Sample first few keys
                complexity += this.calculateJsonComplexity(obj[key], depth + 1);
            }
        }
        return Math.min(complexity, 50); // Cap at reasonable max
    }
    analyzeFile(content, filePath) {
        const analysis = {};
        const filename = path.basename(filePath);
        // Add file metrics
        analysis.metrics = this.calculateMetrics(content, filePath);
        // Check for validation patterns
        if (content.includes('.parse(') || content.includes('.safeParse(')) {
            analysis.hasParse = 1;
        }
        else {
            analysis.hasParse = 0;
        }
        // Check for auth patterns
        if (content.includes('getServerSession') ||
            content.includes('withAuth') ||
            content.includes('useSession') ||
            content.includes('verifyAuth')) {
            analysis.hasAuth = 1;
        }
        else {
            analysis.hasAuth = 0;
        }
        // Check for error handling
        if (content.includes('try {') && content.includes('catch')) {
            analysis.hasTryCatch = 1;
        }
        else {
            analysis.hasTryCatch = 0;
        }
        // For hooks - check loading and error states
        if (filename.includes('use') || filePath.includes('/hooks/')) {
            if (content.includes('isLoading') || content.includes('isPending') || content.includes('loading')) {
                analysis.hasLoadingState = 1;
            }
            else {
                analysis.hasLoadingState = 0;
            }
            if (content.includes('error') || content.includes('isError')) {
                analysis.hasErrorState = 1;
            }
            else {
                analysis.hasErrorState = 0;
            }
            // Check for mutations
            const mutationMatch = content.match(/useMutation|mutation|create|update|delete/gi);
            if (mutationMatch) {
                analysis.mutations = [...new Set(mutationMatch.map(m => m.toLowerCase()))];
            }
            // Check for invalidations
            const invalidateMatch = content.match(/invalidateQueries|setQueryData/g);
            if (invalidateMatch) {
                analysis.invalidates = invalidateMatch;
            }
        }
        // For forms - check validation
        if (filename.includes('Form') || content.includes('<form')) {
            if (content.includes('useForm') ||
                content.includes('zodResolver') ||
                content.includes('validation') ||
                content.includes('validate')) {
                analysis.hasFormValidation = 1;
            }
            else {
                analysis.hasFormValidation = 0;
            }
        }
        return analysis;
    }
    findEntryPoints() {
        // Find pages (Next.js app directory)
        for (const filePath in this.map.files) {
            if (filePath.includes('app/') && filePath.endsWith('/page.tsx')) {
                const route = this.fileToRoute(filePath);
                const content = fs.readFileSync(path.join(this.projectPath, filePath), 'utf-8');
                this.map.entryPoints[route] = {
                    type: 'page',
                    protected: this.isProtectedRoute(content, filePath)
                };
            }
            // Find API routes
            if (filePath.includes('app/api/') && filePath.endsWith('/route.ts')) {
                const route = this.fileToApiRoute(filePath);
                const content = fs.readFileSync(path.join(this.projectPath, filePath), 'utf-8');
                this.map.entryPoints[route] = {
                    type: 'api',
                    protected: this.isProtectedRoute(content, filePath)
                };
            }
        }
    }
    fileToRoute(filePath) {
        // Convert app/orders/page.tsx to /orders
        const parts = filePath.split('/');
        const appIndex = parts.indexOf('app');
        if (appIndex !== -1) {
            const routeParts = parts.slice(appIndex + 1, -1); // Remove 'app' and 'page.tsx'
            // Handle (group) syntax
            const cleanParts = routeParts.filter(p => !p.startsWith('('));
            return '/' + cleanParts.join('/');
        }
        return filePath;
    }
    fileToApiRoute(filePath) {
        // Convert app/api/orders/route.ts to /api/orders
        const parts = filePath.split('/');
        const apiIndex = parts.indexOf('api');
        if (apiIndex !== -1) {
            const routeParts = parts.slice(apiIndex, -1); // Remove 'route.ts'
            return '/' + routeParts.join('/');
        }
        return filePath;
    }
    isProtectedRoute(content, filePath) {
        // Check if route/page is protected
        return content.includes('withAuth') ||
            content.includes('getServerSession') ||
            content.includes('middleware') ||
            filePath.includes('admin') ||
            filePath.includes('dashboard') ||
            filePath.includes('protected');
    }
    mapTablesToFunctions() {
        // Common table/entity names to look for
        const tableNames = [
            'User', 'Professional', 'Client', 'Order', 'Product',
            'Post', 'Comment', 'Session', 'Insurance', 'Course',
            'Payment', 'Invoice', 'Cart', 'Appointment'
        ];
        // Initialize tables map
        for (const tableName of tableNames) {
            const tableNameLower = tableName.toLowerCase();
            const tableData = {
                hooks: [],
                components: [],
                apis: [],
                files: []
            };
            // Search through all files for references to this table
            for (const [filePath, fileData] of Object.entries(this.map.files)) {
                const content = fs.readFileSync(path.join(this.projectPath, filePath), 'utf-8');
                // Check if file references this table
                if (content.includes(tableName) || content.includes(tableNameLower)) {
                    tableData.files.push(filePath);
                    // Categorize by file type
                    if (filePath.includes('/hooks/')) {
                        const hookExports = this.map.exports[filePath] || [];
                        hookExports.forEach(exp => {
                            if (exp.name.toLowerCase().includes(tableNameLower)) {
                                tableData.hooks.push(exp.name);
                            }
                        });
                    }
                    else if (filePath.includes('/components/')) {
                        const componentExports = this.map.exports[filePath] || [];
                        componentExports.forEach(exp => {
                            if (exp.name.toLowerCase().includes(tableNameLower)) {
                                tableData.components.push(exp.name);
                            }
                        });
                    }
                    else if (filePath.includes('/api/')) {
                        if (filePath.toLowerCase().includes(tableNameLower)) {
                            tableData.apis.push(filePath);
                        }
                    }
                }
            }
            // Only add table to map if we found references
            if (tableData.files.length > 0) {
                this.map.tables[tableName] = tableData;
            }
        }
    }
    async saveToFile(outputPath) {
        const map = await this.generate();
        fs.writeFileSync(outputPath, JSON.stringify(map, null, 2));
        console.log(`💾 Map saved to ${outputPath}`);
    }
}
exports.MapGenerator = MapGenerator;
// CLI support
if (require.main === module) {
    const projectPath = process.argv[2] || process.cwd();
    const outputPath = process.argv[3] || 'codebase-map.json';
    const generator = new MapGenerator(projectPath);
    generator.saveToFile(outputPath);
}
