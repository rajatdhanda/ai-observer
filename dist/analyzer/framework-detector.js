"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.FrameworkDetector = void 0;
var fs = require("fs");
var path = require("path");
var FrameworkDetector = /** @class */ (function () {
    function FrameworkDetector() {
    }
    FrameworkDetector.prototype.detect = function (projectPath) {
        return __awaiter(this, void 0, void 0, function () {
            var packageJsonPath, packageJson, deps, framework;
            return __generator(this, function (_a) {
                packageJsonPath = path.join(projectPath, 'package.json');
                if (!fs.existsSync(packageJsonPath)) {
                    throw new Error('No package.json found in project');
                }
                packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
                deps = __assign(__assign({}, packageJson.dependencies), packageJson.devDependencies);
                framework = this.identifyFramework(deps);
                return [2 /*return*/, {
                        name: framework.name,
                        version: framework.version,
                        type: framework.type,
                        dependencies: packageJson.dependencies || {},
                        scripts: packageJson.scripts || {}
                    }];
            });
        });
    };
    FrameworkDetector.prototype.identifyFramework = function (deps) {
        // Next.js detection
        if (deps['next']) {
            return {
                name: 'Next.js',
                version: deps['next'],
                type: 'fullstack'
            };
        }
        // React detection
        if (deps['react'] && !deps['next']) {
            if (deps['react-native']) {
                return {
                    name: 'React Native',
                    version: deps['react-native'],
                    type: 'frontend'
                };
            }
            return {
                name: 'React',
                version: deps['react'],
                type: 'frontend'
            };
        }
        // Vue detection
        if (deps['vue']) {
            if (deps['nuxt']) {
                return {
                    name: 'Nuxt.js',
                    version: deps['nuxt'],
                    type: 'fullstack'
                };
            }
            return {
                name: 'Vue.js',
                version: deps['vue'],
                type: 'frontend'
            };
        }
        // Angular detection
        if (deps['@angular/core']) {
            return {
                name: 'Angular',
                version: deps['@angular/core'],
                type: 'frontend'
            };
        }
        // Express detection
        if (deps['express']) {
            return {
                name: 'Express.js',
                version: deps['express'],
                type: 'backend'
            };
        }
        // NestJS detection
        if (deps['@nestjs/core']) {
            return {
                name: 'NestJS',
                version: deps['@nestjs/core'],
                type: 'backend'
            };
        }
        // Svelte detection
        if (deps['svelte']) {
            if (deps['@sveltejs/kit']) {
                return {
                    name: 'SvelteKit',
                    version: deps['@sveltejs/kit'],
                    type: 'fullstack'
                };
            }
            return {
                name: 'Svelte',
                version: deps['svelte'],
                type: 'frontend'
            };
        }
        // Default Node.js project
        return {
            name: 'Node.js',
            version: process.version,
            type: 'backend'
        };
    };
    return FrameworkDetector;
}());
exports.FrameworkDetector = FrameworkDetector;
