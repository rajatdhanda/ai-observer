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
exports.DataFlowMapper = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class DataFlowMapper {
    async map(projectPath, types) {
        const layers = this.identifyLayers(projectPath, types);
        const connections = this.findConnections(projectPath, layers);
        const criticalPaths = this.identifyCriticalPaths(connections, layers);
        return {
            layers,
            connections,
            criticalPaths
        };
    }
    identifyLayers(projectPath, types) {
        const layers = [];
        // Database layer
        const databaseComponents = types.interfaces
            .filter(i => i.category === 'database')
            .map(i => i.name);
        if (databaseComponents.length > 0) {
            layers.push({
                name: 'Database',
                type: 'database',
                components: databaseComponents
            });
        }
        // API layer
        const apiComponents = this.findApiRoutes(projectPath);
        if (apiComponents.length > 0) {
            layers.push({
                name: 'API',
                type: 'api',
                components: apiComponents
            });
        }
        // State layer
        const stateComponents = this.findStateManagement(projectPath);
        if (stateComponents.length > 0) {
            layers.push({
                name: 'State Management',
                type: 'state',
                components: stateComponents
            });
        }
        // UI layer
        const uiComponents = this.findUIComponents(projectPath);
        layers.push({
            name: 'UI Components',
            type: 'ui',
            components: uiComponents
        });
        return layers;
    }
    findApiRoutes(projectPath) {
        const apiRoutes = [];
        const apiDir = path.join(projectPath, 'src', 'app', 'api');
        const pagesApiDir = path.join(projectPath, 'pages', 'api');
        // Check Next.js App Router API routes
        if (fs.existsSync(apiDir)) {
            this.walkApiDir(apiDir, apiRoutes);
        }
        // Check Next.js Pages Router API routes
        if (fs.existsSync(pagesApiDir)) {
            this.walkApiDir(pagesApiDir, apiRoutes);
        }
        // Check for Express-style routes
        const routesDir = path.join(projectPath, 'routes');
        if (fs.existsSync(routesDir)) {
            this.walkApiDir(routesDir, apiRoutes);
        }
        return apiRoutes;
    }
    walkApiDir(dir, routes) {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            if (stat.isDirectory()) {
                this.walkApiDir(filePath, routes);
            }
            else if (file.endsWith('.ts') || file.endsWith('.js')) {
                const routeName = this.extractRouteName(filePath);
                if (routeName) {
                    routes.push(routeName);
                }
            }
        }
    }
    extractRouteName(filePath) {
        const parts = filePath.split(path.sep);
        const apiIndex = parts.findIndex(p => p === 'api' || p === 'routes');
        if (apiIndex !== -1) {
            const routeParts = parts.slice(apiIndex + 1);
            const routeName = routeParts
                .join('/')
                .replace(/\.(ts|js|tsx|jsx)$/, '')
                .replace(/\/route$/, '')
                .replace(/\/index$/, '');
            return `/${routeName}`;
        }
        return '';
    }
    findStateManagement(projectPath) {
        const stateComponents = [];
        const storeDir = path.join(projectPath, 'src', 'store');
        const hooksDir = path.join(projectPath, 'src', 'hooks');
        const contextDir = path.join(projectPath, 'src', 'context');
        // Check for Redux/Zustand stores
        if (fs.existsSync(storeDir)) {
            stateComponents.push(...this.getComponentNames(storeDir));
        }
        // Check for custom hooks
        if (fs.existsSync(hooksDir)) {
            stateComponents.push(...this.getComponentNames(hooksDir));
        }
        // Check for React Context
        if (fs.existsSync(contextDir)) {
            stateComponents.push(...this.getComponentNames(contextDir));
        }
        return stateComponents;
    }
    findUIComponents(projectPath) {
        const components = [];
        const componentsDir = path.join(projectPath, 'src', 'components');
        const appDir = path.join(projectPath, 'src', 'app');
        const pagesDir = path.join(projectPath, 'pages');
        if (fs.existsSync(componentsDir)) {
            components.push(...this.getComponentNames(componentsDir));
        }
        if (fs.existsSync(appDir)) {
            components.push(...this.getPageComponents(appDir));
        }
        if (fs.existsSync(pagesDir)) {
            components.push(...this.getPageComponents(pagesDir));
        }
        return components;
    }
    getComponentNames(dir) {
        const components = [];
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            if (stat.isDirectory()) {
                components.push(...this.getComponentNames(filePath));
            }
            else if (file.match(/\.(tsx?|jsx?)$/)) {
                const name = file.replace(/\.(tsx?|jsx?)$/, '');
                if (name !== 'index') {
                    components.push(name);
                }
            }
        }
        return components;
    }
    getPageComponents(dir) {
        const pages = [];
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            if (stat.isDirectory() && !file.startsWith('_') && !file.startsWith('.')) {
                pages.push(...this.getPageComponents(filePath));
            }
            else if (file === 'page.tsx' || file === 'page.jsx' || file === 'page.ts' || file === 'page.js') {
                const pageName = path.relative(dir, path.dirname(filePath)) || 'Home';
                pages.push(pageName);
            }
        }
        return pages;
    }
    findConnections(projectPath, layers) {
        const connections = [];
        // Database -> API connections
        const dbLayer = layers.find(l => l.type === 'database');
        const apiLayer = layers.find(l => l.type === 'api');
        if (dbLayer && apiLayer) {
            dbLayer.components.forEach(dbComponent => {
                connections.push({
                    from: `Database.${dbComponent}`,
                    to: 'API',
                    dataType: dbComponent,
                    method: 'query'
                });
            });
        }
        // API -> State connections
        const stateLayer = layers.find(l => l.type === 'state');
        if (apiLayer && stateLayer) {
            stateLayer.components.forEach(stateComponent => {
                if (stateComponent.startsWith('use')) {
                    connections.push({
                        from: 'API',
                        to: `State.${stateComponent}`,
                        dataType: 'response',
                        method: 'fetch'
                    });
                }
            });
        }
        // State -> UI connections
        const uiLayer = layers.find(l => l.type === 'ui');
        if (stateLayer && uiLayer) {
            stateLayer.components.forEach(stateComponent => {
                connections.push({
                    from: `State.${stateComponent}`,
                    to: 'UI',
                    dataType: 'props',
                    method: 'render'
                });
            });
        }
        return connections;
    }
    identifyCriticalPaths(connections, layers) {
        const criticalPaths = [];
        // Authentication flow
        if (this.hasAuthComponents(layers)) {
            criticalPaths.push({
                name: 'Authentication',
                steps: ['Login Form', 'API Auth', 'Session Storage', 'Protected Routes'],
                importance: 'high'
            });
        }
        // Data CRUD operations
        const dbLayer = layers.find(l => l.type === 'database');
        if (dbLayer && dbLayer.components.length > 0) {
            criticalPaths.push({
                name: 'Data Operations',
                steps: ['UI Form', 'Validation', 'API Request', 'Database Operation', 'Response'],
                importance: 'high'
            });
        }
        // Page rendering
        criticalPaths.push({
            name: 'Page Rendering',
            steps: ['Route Request', 'Data Fetching', 'Component Render', 'Client Hydration'],
            importance: 'medium'
        });
        return criticalPaths;
    }
    hasAuthComponents(layers) {
        return layers.some(layer => layer.components.some(c => c.toLowerCase().includes('auth') ||
            c.toLowerCase().includes('login') ||
            c.toLowerCase().includes('user')));
    }
}
exports.DataFlowMapper = DataFlowMapper;
