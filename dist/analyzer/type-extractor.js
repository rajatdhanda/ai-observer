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
exports.TypeExtractor = void 0;
var fs = require("fs");
var path = require("path");
var ts = require("typescript");
var TypeExtractor = /** @class */ (function () {
    function TypeExtractor() {
    }
    TypeExtractor.prototype.extract = function (projectPath) {
        return __awaiter(this, void 0, void 0, function () {
            var typeFiles, interfaces, types, enums, _i, typeFiles_1, file, content, sourceFile;
            return __generator(this, function (_a) {
                typeFiles = this.findTypeFiles(projectPath);
                interfaces = [];
                types = [];
                enums = [];
                for (_i = 0, typeFiles_1 = typeFiles; _i < typeFiles_1.length; _i++) {
                    file = typeFiles_1[_i];
                    content = fs.readFileSync(file, 'utf-8');
                    sourceFile = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true);
                    this.extractFromFile(sourceFile, file, interfaces, types, enums);
                }
                return [2 /*return*/, {
                        interfaces: interfaces,
                        types: types,
                        enums: enums,
                        totalCount: interfaces.length + types.length + enums.length,
                        files: typeFiles.map(function (f) { return path.relative(projectPath, f); })
                    }];
            });
        });
    };
    TypeExtractor.prototype.findTypeFiles = function (projectPath) {
        var typeFiles = [];
        var extensions = ['.ts', '.tsx'];
        var excludeDirs = ['node_modules', '.next', 'dist', 'build', '.git'];
        var walkDir = function (dir) {
            var files = fs.readdirSync(dir);
            var _loop_1 = function (file) {
                var filePath = path.join(dir, file);
                var stat = fs.statSync(filePath);
                if (stat.isDirectory()) {
                    if (!excludeDirs.includes(file)) {
                        walkDir(filePath);
                    }
                }
                else if (extensions.some(function (ext) { return file.endsWith(ext); })) {
                    typeFiles.push(filePath);
                }
            };
            for (var _i = 0, files_1 = files; _i < files_1.length; _i++) {
                var file = files_1[_i];
                _loop_1(file);
            }
        };
        walkDir(projectPath);
        return typeFiles;
    };
    TypeExtractor.prototype.extractFromFile = function (sourceFile, filePath, interfaces, types, enums) {
        var _this = this;
        var visit = function (node) {
            if (ts.isInterfaceDeclaration(node)) {
                interfaces.push(_this.extractInterface(node, filePath));
            }
            else if (ts.isTypeAliasDeclaration(node)) {
                types.push(_this.extractType(node, filePath));
            }
            else if (ts.isEnumDeclaration(node)) {
                enums.push(_this.extractEnum(node, filePath));
            }
            ts.forEachChild(node, visit);
        };
        visit(sourceFile);
    };
    TypeExtractor.prototype.extractInterface = function (node, filePath) {
        var properties = [];
        node.members.forEach(function (member) {
            if (ts.isPropertySignature(member) && member.name) {
                var name_1 = member.name.getText();
                var type = member.type ? member.type.getText() : 'any';
                var required = !member.questionToken;
                properties.push({ name: name_1, type: type, required: required });
            }
        });
        return {
            name: node.name.text,
            filePath: filePath,
            properties: properties,
            category: this.categorizeType(node.name.text, filePath)
        };
    };
    TypeExtractor.prototype.extractType = function (node, filePath) {
        return {
            name: node.name.text,
            filePath: filePath,
            category: this.categorizeType(node.name.text, filePath)
        };
    };
    TypeExtractor.prototype.extractEnum = function (node, filePath) {
        var properties = [];
        node.members.forEach(function (member) {
            if (member.name) {
                var name_2 = member.name.getText();
                var value = member.initializer ? member.initializer.getText() : '';
                properties.push({
                    name: name_2,
                    type: 'enum_member',
                    required: true,
                    description: value
                });
            }
        });
        return {
            name: node.name.text,
            filePath: filePath,
            properties: properties,
            category: 'utility'
        };
    };
    TypeExtractor.prototype.categorizeType = function (name, filePath) {
        var lowerPath = filePath.toLowerCase();
        var lowerName = name.toLowerCase();
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
    };
    return TypeExtractor;
}());
exports.TypeExtractor = TypeExtractor;
