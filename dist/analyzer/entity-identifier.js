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
exports.EntityIdentifier = void 0;
var EntityIdentifier = /** @class */ (function () {
    function EntityIdentifier() {
    }
    EntityIdentifier.prototype.identify = function (types, dataFlow) {
        return __awaiter(this, void 0, void 0, function () {
            var entities, dbTypes, _i, dbTypes_1, type, entity, modelTypes, _loop_1, this_1, _a, modelTypes_1, type;
            var _this = this;
            return __generator(this, function (_b) {
                entities = [];
                dbTypes = types.interfaces.filter(function (t) { return t.category === 'database'; });
                for (_i = 0, dbTypes_1 = dbTypes; _i < dbTypes_1.length; _i++) {
                    type = dbTypes_1[_i];
                    entity = this.createEntity(type, types);
                    if (entity) {
                        entities.push(entity);
                    }
                }
                modelTypes = types.interfaces.filter(function (t) {
                    return _this.looksLikeEntity(t.name) && t.category !== 'database';
                });
                _loop_1 = function (type) {
                    var entity = this_1.createEntity(type, types);
                    if (entity && !entities.find(function (e) { return e.name === entity.name; })) {
                        entities.push(entity);
                    }
                };
                this_1 = this;
                for (_a = 0, modelTypes_1 = modelTypes; _a < modelTypes_1.length; _a++) {
                    type = modelTypes_1[_a];
                    _loop_1(type);
                }
                // Establish relationships between entities
                this.establishRelationships(entities, types);
                // Identify operations for each entity
                this.identifyOperations(entities, dataFlow);
                return [2 /*return*/, entities];
            });
        });
    };
    EntityIdentifier.prototype.looksLikeEntity = function (name) {
        // Common entity patterns
        var entityPatterns = [
            'User', 'Profile', 'Account',
            'Product', 'Item', 'Article',
            'Order', 'Cart', 'Purchase',
            'Post', 'Comment', 'Message',
            'Category', 'Tag', 'Group',
            'Payment', 'Transaction', 'Invoice',
            'Customer', 'Client', 'Vendor',
            'Project', 'Task', 'Todo',
            'Document', 'File', 'Media',
            'Session', 'Token', 'Auth'
        ];
        return entityPatterns.some(function (pattern) {
            return name.toLowerCase().includes(pattern.toLowerCase());
        });
    };
    EntityIdentifier.prototype.createEntity = function (type, types) {
        var _this = this;
        if (!type.properties || type.properties.length === 0) {
            return null;
        }
        return {
            name: type.name,
            type: this.determineEntityType(type.name),
            properties: type.properties.map(function (p) { return ({
                name: p.name,
                type: _this.normalizeType(p.type),
                required: p.required,
                description: p.description
            }); }),
            relationships: [],
            operations: []
        };
    };
    EntityIdentifier.prototype.determineEntityType = function (name) {
        var nameLower = name.toLowerCase();
        if (nameLower.includes('user') || nameLower.includes('account') || nameLower.includes('profile')) {
            return 'user';
        }
        if (nameLower.includes('product') || nameLower.includes('item')) {
            return 'product';
        }
        if (nameLower.includes('order') || nameLower.includes('cart') || nameLower.includes('purchase')) {
            return 'transaction';
        }
        if (nameLower.includes('post') || nameLower.includes('article') || nameLower.includes('comment')) {
            return 'content';
        }
        if (nameLower.includes('category') || nameLower.includes('tag')) {
            return 'taxonomy';
        }
        return 'general';
    };
    EntityIdentifier.prototype.normalizeType = function (type) {
        // Simplify complex TypeScript types
        if (type.includes('|')) {
            return 'union';
        }
        if (type.includes('[]')) {
            return 'array';
        }
        if (type.includes('<')) {
            return type.split('<')[0];
        }
        return type;
    };
    EntityIdentifier.prototype.establishRelationships = function (entities, types) {
        for (var _i = 0, entities_1 = entities; _i < entities_1.length; _i++) {
            var entity = entities_1[_i];
            var _loop_2 = function (prop) {
                // Check for foreign key patterns
                if (prop.name.endsWith('_id') || prop.name.endsWith('Id')) {
                    var relatedEntityName_1 = this_2.extractEntityFromForeignKey(prop.name);
                    var relatedEntity = entities.find(function (e) {
                        return e.name.toLowerCase() === relatedEntityName_1.toLowerCase();
                    });
                    if (relatedEntity) {
                        entity.relationships.push({
                            type: 'belongsTo',
                            entity: relatedEntity.name,
                            foreign_key: prop.name
                        });
                    }
                }
                // Check for array relationships
                if (prop.type === 'array') {
                    var relatedEntityName_2 = this_2.extractEntityFromArrayType(prop.name);
                    var relatedEntity = entities.find(function (e) {
                        return e.name.toLowerCase() === relatedEntityName_2.toLowerCase();
                    });
                    if (relatedEntity) {
                        entity.relationships.push({
                            type: 'hasMany',
                            entity: relatedEntity.name
                        });
                    }
                }
            };
            var this_2 = this;
            for (var _a = 0, _b = entity.properties; _a < _b.length; _a++) {
                var prop = _b[_a];
                _loop_2(prop);
            }
        }
        var _loop_3 = function (entity) {
            var _loop_4 = function (rel) {
                if (rel.type === 'belongsTo') {
                    var relatedEntity = entities.find(function (e) { return e.name === rel.entity; });
                    if (relatedEntity) {
                        var inverseExists = relatedEntity.relationships.some(function (r) {
                            return r.entity === entity.name && r.type === 'hasMany';
                        });
                        if (!inverseExists) {
                            relatedEntity.relationships.push({
                                type: 'hasMany',
                                entity: entity.name
                            });
                        }
                    }
                }
            };
            for (var _d = 0, _e = entity.relationships; _d < _e.length; _d++) {
                var rel = _e[_d];
                _loop_4(rel);
            }
        };
        // Add inverse relationships
        for (var _c = 0, entities_2 = entities; _c < entities_2.length; _c++) {
            var entity = entities_2[_c];
            _loop_3(entity);
        }
    };
    EntityIdentifier.prototype.extractEntityFromForeignKey = function (propName) {
        // Remove _id or Id suffix
        var entityName = propName.replace(/_id$/i, '').replace(/Id$/i, '');
        // Convert to PascalCase
        entityName = entityName.charAt(0).toUpperCase() + entityName.slice(1);
        // Handle special cases
        if (entityName === 'Professional')
            return 'Professional';
        if (entityName === 'User')
            return 'User';
        if (entityName === 'Post')
            return 'Post';
        if (entityName === 'Product')
            return 'Product';
        if (entityName === 'Order')
            return 'Order';
        return entityName;
    };
    EntityIdentifier.prototype.extractEntityFromArrayType = function (propName) {
        // Handle plural to singular
        if (propName.endsWith('s')) {
            return propName.slice(0, -1);
        }
        if (propName.endsWith('ies')) {
            return propName.slice(0, -3) + 'y';
        }
        return propName;
    };
    EntityIdentifier.prototype.identifyOperations = function (entities, dataFlow) {
        var _a;
        var _loop_5 = function (entity) {
            var operations = [];
            // Standard CRUD operations
            operations.push("create".concat(entity.name));
            operations.push("get".concat(entity.name));
            operations.push("update".concat(entity.name));
            operations.push("delete".concat(entity.name));
            operations.push("list".concat(entity.name, "s"));
            // Entity-specific operations
            if (entity.type === 'user') {
                operations.push('authenticate', 'authorize', 'resetPassword');
            }
            if (entity.type === 'transaction') {
                operations.push('processPayment', 'refund', 'calculateTotal');
            }
            if (entity.type === 'content') {
                operations.push('publish', 'archive', 'share');
            }
            // Check data flow for actual operations
            var apiComponents = ((_a = dataFlow.layers.find(function (l) { return l.type === 'api'; })) === null || _a === void 0 ? void 0 : _a.components) || [];
            var relevantApis = apiComponents.filter(function (api) {
                return api.toLowerCase().includes(entity.name.toLowerCase());
            });
            if (relevantApis.length > 0) {
                operations.push.apply(operations, relevantApis.map(function (api) { return "api:".concat(api); }));
            }
            entity.operations = __spreadArray([], new Set(operations), true);
        };
        for (var _i = 0, entities_3 = entities; _i < entities_3.length; _i++) {
            var entity = entities_3[_i];
            _loop_5(entity);
        }
    };
    return EntityIdentifier;
}());
exports.EntityIdentifier = EntityIdentifier;
