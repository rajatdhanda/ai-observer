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
exports.DataFlowMapper = void 0;
var fs = require("fs");
var path = require("path");
var DataFlowMapper = /** @class */ (function () {
    function DataFlowMapper() {
    }
    DataFlowMapper.prototype.map = function (projectPath, types) {
        return __awaiter(this, void 0, void 0, function () {
            var layers, connections, criticalPaths;
            return __generator(this, function (_a) {
                layers = this.identifyLayers(projectPath, types);
                connections = this.findConnections(projectPath, layers);
                criticalPaths = this.identifyCriticalPaths(connections, layers);
                return [2 /*return*/, {
                        layers: layers,
                        connections: connections,
                        criticalPaths: criticalPaths
                    }];
            });
        });
    };
    DataFlowMapper.prototype.identifyLayers = function (projectPath, types) {
        var layers = [];
        // Database layer
        var databaseComponents = types.interfaces
            .filter(function (i) { return i.category === 'database'; })
            .map(function (i) { return i.name; });
        if (databaseComponents.length > 0) {
            layers.push({
                name: 'Database',
                type: 'database',
                components: databaseComponents
            });
        }
        // API layer
        var apiComponents = this.findApiRoutes(projectPath);
        if (apiComponents.length > 0) {
            layers.push({
                name: 'API',
                type: 'api',
                components: apiComponents
            });
        }
        // State layer
        var stateComponents = this.findStateManagement(projectPath);
        if (stateComponents.length > 0) {
            layers.push({
                name: 'State Management',
                type: 'state',
                components: stateComponents
            });
        }
        // UI layer
        var uiComponents = this.findUIComponents(projectPath);
        layers.push({
            name: 'UI Components',
            type: 'ui',
            components: uiComponents
        });
        return layers;
    };
    DataFlowMapper.prototype.findApiRoutes = function (projectPath) {
        var apiRoutes = [];
        var apiDir = path.join(projectPath, 'src', 'app', 'api');
        var pagesApiDir = path.join(projectPath, 'pages', 'api');
        // Check Next.js App Router API routes
        if (fs.existsSync(apiDir)) {
            this.walkApiDir(apiDir, apiRoutes);
        }
        // Check Next.js Pages Router API routes
        if (fs.existsSync(pagesApiDir)) {
            this.walkApiDir(pagesApiDir, apiRoutes);
        }
        // Check for Express-style routes
        var routesDir = path.join(projectPath, 'routes');
        if (fs.existsSync(routesDir)) {
            this.walkApiDir(routesDir, apiRoutes);
        }
        return apiRoutes;
    };
    DataFlowMapper.prototype.walkApiDir = function (dir, routes) {
        var files = fs.readdirSync(dir);
        for (var _i = 0, files_1 = files; _i < files_1.length; _i++) {
            var file = files_1[_i];
            var filePath = path.join(dir, file);
            var stat = fs.statSync(filePath);
            if (stat.isDirectory()) {
                this.walkApiDir(filePath, routes);
            }
            else if (file.endsWith('.ts') || file.endsWith('.js')) {
                var routeName = this.extractRouteName(filePath);
                if (routeName) {
                    routes.push(routeName);
                }
            }
        }
    };
    DataFlowMapper.prototype.extractRouteName = function (filePath) {
        var parts = filePath.split(path.sep);
        var apiIndex = parts.findIndex(function (p) { return p === 'api' || p === 'routes'; });
        if (apiIndex !== -1) {
            var routeParts = parts.slice(apiIndex + 1);
            var routeName = routeParts
                .join('/')
                .replace(/\.(ts|js|tsx|jsx)$/, '')
                .replace(/\/route$/, '')
                .replace(/\/index$/, '');
            return "/".concat(routeName);
        }
        return '';
    };
    DataFlowMapper.prototype.findStateManagement = function (projectPath) {
        var stateComponents = [];
        var storeDir = path.join(projectPath, 'src', 'store');
        var hooksDir = path.join(projectPath, 'src', 'hooks');
        var contextDir = path.join(projectPath, 'src', 'context');
        // Check for Redux/Zustand stores
        if (fs.existsSync(storeDir)) {
            stateComponents.push.apply(stateComponents, this.getComponentNames(storeDir));
        }
        // Check for custom hooks
        if (fs.existsSync(hooksDir)) {
            stateComponents.push.apply(stateComponents, this.getComponentNames(hooksDir));
        }
        // Check for React Context
        if (fs.existsSync(contextDir)) {
            stateComponents.push.apply(stateComponents, this.getComponentNames(contextDir));
        }
        return stateComponents;
    };
    DataFlowMapper.prototype.findUIComponents = function (projectPath) {
        var components = [];
        var componentsDir = path.join(projectPath, 'src', 'components');
        var appDir = path.join(projectPath, 'src', 'app');
        var pagesDir = path.join(projectPath, 'pages');
        if (fs.existsSync(componentsDir)) {
            components.push.apply(components, this.getComponentNames(componentsDir));
        }
        if (fs.existsSync(appDir)) {
            components.push.apply(components, this.getPageComponents(appDir));
        }
        if (fs.existsSync(pagesDir)) {
            components.push.apply(components, this.getPageComponents(pagesDir));
        }
        return components;
    };
    DataFlowMapper.prototype.getComponentNames = function (dir) {
        var components = [];
        var files = fs.readdirSync(dir);
        for (var _i = 0, files_2 = files; _i < files_2.length; _i++) {
            var file = files_2[_i];
            var filePath = path.join(dir, file);
            var stat = fs.statSync(filePath);
            if (stat.isDirectory()) {
                components.push.apply(components, this.getComponentNames(filePath));
            }
            else if (file.match(/\.(tsx?|jsx?)$/)) {
                var name_1 = file.replace(/\.(tsx?|jsx?)$/, '');
                if (name_1 !== 'index') {
                    components.push(name_1);
                }
            }
        }
        return components;
    };
    DataFlowMapper.prototype.getPageComponents = function (dir) {
        var pages = [];
        var files = fs.readdirSync(dir);
        for (var _i = 0, files_3 = files; _i < files_3.length; _i++) {
            var file = files_3[_i];
            var filePath = path.join(dir, file);
            var stat = fs.statSync(filePath);
            if (stat.isDirectory() && !file.startsWith('_') && !file.startsWith('.')) {
                pages.push.apply(pages, this.getPageComponents(filePath));
            }
            else if (file === 'page.tsx' || file === 'page.jsx' || file === 'page.ts' || file === 'page.js') {
                var pageName = path.relative(dir, path.dirname(filePath)) || 'Home';
                pages.push(pageName);
            }
        }
        return pages;
    };
    DataFlowMapper.prototype.findConnections = function (projectPath, layers) {
        var connections = [];
        // Database -> API connections
        var dbLayer = layers.find(function (l) { return l.type === 'database'; });
        var apiLayer = layers.find(function (l) { return l.type === 'api'; });
        if (dbLayer && apiLayer) {
            dbLayer.components.forEach(function (dbComponent) {
                connections.push({
                    from: "Database.".concat(dbComponent),
                    to: 'API',
                    dataType: dbComponent,
                    method: 'query'
                });
            });
        }
        // API -> State connections
        var stateLayer = layers.find(function (l) { return l.type === 'state'; });
        if (apiLayer && stateLayer) {
            stateLayer.components.forEach(function (stateComponent) {
                if (stateComponent.startsWith('use')) {
                    connections.push({
                        from: 'API',
                        to: "State.".concat(stateComponent),
                        dataType: 'response',
                        method: 'fetch'
                    });
                }
            });
        }
        // State -> UI connections
        var uiLayer = layers.find(function (l) { return l.type === 'ui'; });
        if (stateLayer && uiLayer) {
            stateLayer.components.forEach(function (stateComponent) {
                connections.push({
                    from: "State.".concat(stateComponent),
                    to: 'UI',
                    dataType: 'props',
                    method: 'render'
                });
            });
        }
        return connections;
    };
    DataFlowMapper.prototype.identifyCriticalPaths = function (connections, layers) {
        var criticalPaths = [];
        // Authentication flow
        if (this.hasAuthComponents(layers)) {
            criticalPaths.push({
                name: 'Authentication',
                steps: ['Login Form', 'API Auth', 'Session Storage', 'Protected Routes'],
                importance: 'high'
            });
        }
        // Data CRUD operations
        var dbLayer = layers.find(function (l) { return l.type === 'database'; });
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
    };
    DataFlowMapper.prototype.hasAuthComponents = function (layers) {
        return layers.some(function (layer) {
            return layer.components.some(function (c) {
                return c.toLowerCase().includes('auth') ||
                    c.toLowerCase().includes('login') ||
                    c.toLowerCase().includes('user');
            });
        });
    };
    return DataFlowMapper;
}());
exports.DataFlowMapper = DataFlowMapper;
