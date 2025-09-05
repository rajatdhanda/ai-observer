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
exports.ProjectContextDetector = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class ProjectContextDetector {
    projectPath;
    constructor(projectPath) {
        this.projectPath = projectPath;
    }
    detectFramework() {
        const packagePath = path.join(this.projectPath, 'package.json');
        if (fs.existsSync(packagePath)) {
            const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
            const deps = { ...pkg.dependencies, ...pkg.devDependencies };
            if (deps.next)
                return 'Next.js';
            if (deps.react)
                return 'React';
            if (deps.vue)
                return 'Vue';
            if (deps.express)
                return 'Express';
            if (deps.fastify)
                return 'Fastify';
        }
        return 'Unknown';
    }
    findEntryPoints() {
        const entries = [];
        const patterns = [
            'src/index.ts', 'src/main.ts', 'src/app.ts',
            'src/app/page.tsx', 'src/app/layout.tsx',
            'pages/index.tsx', 'pages/_app.tsx'
        ];
        for (const pattern of patterns) {
            const fullPath = path.join(this.projectPath, pattern);
            if (fs.existsSync(fullPath)) {
                entries.push(pattern);
            }
        }
        return entries;
    }
    findApiRoutes() {
        const routes = [];
        const apiDirs = [
            path.join(this.projectPath, 'src/app/api'),
            path.join(this.projectPath, 'pages/api'),
            path.join(this.projectPath, 'api')
        ];
        for (const dir of apiDirs) {
            if (fs.existsSync(dir)) {
                this.walkDir(dir, (file) => {
                    if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js')) {
                        routes.push(file.replace(this.projectPath, ''));
                    }
                });
            }
        }
        return routes;
    }
    detectDatabase() {
        const packagePath = path.join(this.projectPath, 'package.json');
        if (fs.existsSync(packagePath)) {
            const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
            const deps = { ...pkg.dependencies, ...pkg.devDependencies };
            if (deps.prisma || deps['@prisma/client'])
                return 'Prisma/PostgreSQL';
            if (deps.mongoose)
                return 'MongoDB';
            if (deps.pg)
                return 'PostgreSQL';
            if (deps.mysql2)
                return 'MySQL';
            if (deps.sqlite3)
                return 'SQLite';
        }
        return 'None detected';
    }
    getKeyDependencies() {
        const packagePath = path.join(this.projectPath, 'package.json');
        if (fs.existsSync(packagePath)) {
            const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
            const important = ['next', 'react', 'typescript', 'prisma', '@prisma/client',
                'tailwindcss', 'zod', 'express', 'fastify'];
            const result = {};
            for (const dep of important) {
                if (pkg.dependencies?.[dep])
                    result[dep] = pkg.dependencies[dep];
                if (pkg.devDependencies?.[dep])
                    result[dep] = pkg.devDependencies[dep];
            }
            return result;
        }
        return {};
    }
    detectEnvVars() {
        const envExample = path.join(this.projectPath, '.env.example');
        const envLocal = path.join(this.projectPath, '.env.local.example');
        const vars = new Set();
        for (const file of [envExample, envLocal]) {
            if (fs.existsSync(file)) {
                const content = fs.readFileSync(file, 'utf-8');
                const matches = content.match(/^([A-Z_]+)=/gm);
                if (matches) {
                    matches.forEach(m => vars.add(m.replace('=', '')));
                }
            }
        }
        return Array.from(vars);
    }
    getBuildCommands() {
        const packagePath = path.join(this.projectPath, 'package.json');
        if (fs.existsSync(packagePath)) {
            const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
            const important = ['dev', 'build', 'start', 'test', 'lint', 'typecheck'];
            const result = {};
            for (const script of important) {
                if (pkg.scripts?.[script]) {
                    result[script] = pkg.scripts[script];
                }
            }
            return result;
        }
        return {};
    }
    walkDir(dir, callback) {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory() && !file.startsWith('.')) {
                this.walkDir(fullPath, callback);
            }
            else {
                callback(fullPath);
            }
        });
    }
}
exports.ProjectContextDetector = ProjectContextDetector;
