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
exports.TypeExtractor = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const ts = __importStar(require("typescript"));
class TypeExtractor {
    async extract(projectPath) {
        const typeFiles = this.findTypeFiles(projectPath);
        const interfaces = [];
        const types = [];
        const enums = [];
        for (const file of typeFiles) {
            const content = fs.readFileSync(file, 'utf-8');
            const sourceFile = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true);
            this.extractFromFile(sourceFile, file, interfaces, types, enums);
        }
        return {
            interfaces,
            types,
            enums,
            totalCount: interfaces.length + types.length + enums.length,
            files: typeFiles.map(f => path.relative(projectPath, f))
        };
    }
    findTypeFiles(projectPath) {
        const typeFiles = [];
        const extensions = ['.ts', '.tsx'];
        const excludeDirs = ['node_modules', '.next', 'dist', 'build', '.git'];
        const walkDir = (dir) => {
            const files = fs.readdirSync(dir);
            for (const file of files) {
                const filePath = path.join(dir, file);
                const stat = fs.statSync(filePath);
                if (stat.isDirectory()) {
                    if (!excludeDirs.includes(file)) {
                        walkDir(filePath);
                    }
                }
                else if (extensions.some(ext => file.endsWith(ext))) {
                    typeFiles.push(filePath);
                }
            }
        };
        walkDir(projectPath);
        return typeFiles;
    }
    extractFromFile(sourceFile, filePath, interfaces, types, enums) {
        const visit = (node) => {
            if (ts.isInterfaceDeclaration(node)) {
                interfaces.push(this.extractInterface(node, filePath));
            }
            else if (ts.isTypeAliasDeclaration(node)) {
                types.push(this.extractType(node, filePath));
            }
            else if (ts.isEnumDeclaration(node)) {
                enums.push(this.extractEnum(node, filePath));
            }
            ts.forEachChild(node, visit);
        };
        visit(sourceFile);
    }
    extractInterface(node, filePath) {
        const properties = [];
        node.members.forEach(member => {
            if (ts.isPropertySignature(member) && member.name) {
                const name = member.name.getText();
                const type = member.type ? member.type.getText() : 'any';
                const required = !member.questionToken;
                properties.push({ name, type, required });
            }
        });
        return {
            name: node.name.text,
            filePath,
            properties,
            category: this.categorizeType(node.name.text, filePath)
        };
    }
    extractType(node, filePath) {
        return {
            name: node.name.text,
            filePath,
            category: this.categorizeType(node.name.text, filePath)
        };
    }
    extractEnum(node, filePath) {
        const properties = [];
        node.members.forEach(member => {
            if (member.name) {
                const name = member.name.getText();
                const value = member.initializer ? member.initializer.getText() : '';
                properties.push({
                    name,
                    type: 'enum_member',
                    required: true,
                    description: value
                });
            }
        });
        return {
            name: node.name.text,
            filePath,
            properties,
            category: 'utility'
        };
    }
    categorizeType(name, filePath) {
        const lowerPath = filePath.toLowerCase();
        const lowerName = name.toLowerCase();
        if (lowerPath.includes('database') || lowerPath.includes('db') || lowerPath.includes('models')) {
            return 'database';
        }
        if (lowerPath.includes('api') || lowerName.includes('request') || lowerName.includes('response')) {
            return 'api';
        }
        if (lowerPath.includes('component') || lowerName.includes('props')) {
            return 'component';
        }
        if (lowerPath.includes('state') || lowerPath.includes('store') || lowerName.includes('state')) {
            return 'state';
        }
        return 'utility';
    }
}
exports.TypeExtractor = TypeExtractor;
