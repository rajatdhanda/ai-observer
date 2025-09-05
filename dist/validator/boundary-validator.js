"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BoundaryValidator = void 0;
var fs = require("fs");
var path = require("path");
var BoundaryValidator = /** @class */ (function () {
    function BoundaryValidator(projectPath) {
        this.boundaries = [];
        // Define all boundary types that need validation
        this.boundaryPatterns = {
            // Database boundaries
            dbRead: /(?:supabase|prisma|db|knex|sql).*(?:select|find|get|query)/gi,
            dbWrite: /(?:supabase|prisma|db|knex|sql).*(?:insert|update|delete|upsert|create)/gi,
            // API boundaries  
            apiRequest: /(?:req\.body|request\.body|req\.params|req\.query)/gi,
            apiResponse: /(?:res\.json|res\.send|response\.json|return.*Response)/gi,
            // Hook boundaries
            hookReturn: /(?:return\s*{[\s\S]*?})\s*(?:from.*use[A-Z])/gi,
            // Webhook boundaries
            webhook: /(?:webhook|stripe|paypal|slack|discord).*(?:payload|body|data)/gi,
            // Message queue boundaries
            queue: /(?:queue|sqs|rabbitmq|kafka|pubsub|redis).*(?:send|publish|consume|receive)/gi,
            // Third-party API boundaries
            thirdParty: /(?:axios|fetch|got|request).*(?:get|post|put|delete)\s*\(/gi,
            // WebSocket boundaries
            websocket: /(?:socket|ws|io).*(?:emit|send|on|message)/gi,
            // File upload boundaries
            fileUpload: /(?:multer|upload|file|formData).*(?:single|array|fields)/gi,
            // GraphQL boundaries
            graphql: /(?:query|mutation|subscription|resolver)/gi,
            // Event boundaries
            events: /(?:eventEmitter|emit|on|addEventListener)/gi
        };
        this.projectPath = projectPath;
    }
    BoundaryValidator.prototype.analyze = function () {
        this.boundaries = [];
        this.scanProject();
        var validated = this.boundaries.filter(function (b) { return b.hasValidation; }).length;
        var coverage = this.boundaries.length > 0
            ? Math.round((validated / this.boundaries.length) * 100)
            : 0;
        var critical = this.boundaries.filter(function (b) {
            return !b.hasValidation &&
                ['webhook', 'queue', 'thirdParty', 'dbWrite'].some(function (type) {
                    return b.boundary.includes(type);
                });
        });
        return {
            boundaries: this.boundaries,
            coverage: coverage,
            critical: critical
        };
    };
    BoundaryValidator.prototype.scanProject = function () {
        var files = this.getTypeScriptFiles(this.projectPath);
        for (var _i = 0, files_1 = files; _i < files_1.length; _i++) {
            var file = files_1[_i];
            this.analyzeFile(file);
        }
    };
    BoundaryValidator.prototype.analyzeFile = function (filePath) {
        var content = fs.readFileSync(filePath, 'utf-8');
        var lines = content.split('\n');
        // Check each boundary type
        for (var _i = 0, _a = Object.entries(this.boundaryPatterns); _i < _a.length; _i++) {
            var _b = _a[_i], boundaryType = _b[0], pattern = _b[1];
            var matches = content.matchAll(pattern);
            for (var _c = 0, matches_1 = matches; _c < matches_1.length; _c++) {
                var match = matches_1[_c];
                var lineNumber = this.getLineNumber(content, match.index || 0);
                var hasValidation = this.checkForValidation(content, match.index || 0, boundaryType);
                this.boundaries.push({
                    boundary: boundaryType,
                    location: "".concat(filePath, ":").concat(lineNumber),
                    hasValidation: hasValidation,
                    validationType: hasValidation ? this.getValidationType(content, match.index || 0) : undefined,
                    issue: !hasValidation ? this.getIssueDescription(boundaryType) : undefined
                });
            }
        }
        // Special check for webhook handlers
        this.checkWebhookHandlers(filePath, content);
        // Special check for queue handlers
        this.checkQueueHandlers(filePath, content);
        // Special check for third-party adapters
        this.checkThirdPartyAdapters(filePath, content);
    };
    BoundaryValidator.prototype.checkWebhookHandlers = function (filePath, content) {
        // Check for common webhook patterns
        var webhookPatterns = [
            /app\.post\(['"`]\/webhook/gi,
            /router\.post\(['"`]\/webhook/gi,
            /export.*function.*webhook/gi,
            /stripe\.webhooks\.constructEvent/gi
        ];
        for (var _i = 0, webhookPatterns_1 = webhookPatterns; _i < webhookPatterns_1.length; _i++) {
            var pattern = webhookPatterns_1[_i];
            var matches = content.matchAll(pattern);
            for (var _a = 0, matches_2 = matches; _a < matches_2.length; _a++) {
                var match = matches_2[_a];
                var lineNumber = this.getLineNumber(content, match.index || 0);
                var hasValidation = this.checkForWebhookValidation(content, match.index || 0);
                if (!hasValidation) {
                    this.boundaries.push({
                        boundary: 'webhook',
                        location: "".concat(filePath, ":").concat(lineNumber),
                        hasValidation: false,
                        issue: 'Webhook payload not validated with schema'
                    });
                }
            }
        }
    };
    BoundaryValidator.prototype.checkQueueHandlers = function (filePath, content) {
        // Check for queue message handlers
        var queuePatterns = [
            /\.consume\(/gi,
            /\.receive\(/gi,
            /\.on\(['"`]message['"`]/gi,
            /sqs\.receiveMessage/gi,
            /kafka\.consumer/gi
        ];
        for (var _i = 0, queuePatterns_1 = queuePatterns; _i < queuePatterns_1.length; _i++) {
            var pattern = queuePatterns_1[_i];
            var matches = content.matchAll(pattern);
            for (var _a = 0, matches_3 = matches; _a < matches_3.length; _a++) {
                var match = matches_3[_a];
                var lineNumber = this.getLineNumber(content, match.index || 0);
                var hasValidation = this.checkForQueueValidation(content, match.index || 0);
                if (!hasValidation) {
                    this.boundaries.push({
                        boundary: 'queue',
                        location: "".concat(filePath, ":").concat(lineNumber),
                        hasValidation: false,
                        issue: 'Queue message not validated with schema'
                    });
                }
            }
        }
    };
    BoundaryValidator.prototype.checkThirdPartyAdapters = function (filePath, content) {
        // Check for third-party API calls
        var apiPatterns = [
            /axios\.(get|post|put|delete)/gi,
            /fetch\(['"`]http/gi,
            /got\.(get|post|put|delete)/gi
        ];
        for (var _i = 0, apiPatterns_1 = apiPatterns; _i < apiPatterns_1.length; _i++) {
            var pattern = apiPatterns_1[_i];
            var matches = content.matchAll(pattern);
            for (var _a = 0, matches_4 = matches; _a < matches_4.length; _a++) {
                var match = matches_4[_a];
                var lineNumber = this.getLineNumber(content, match.index || 0);
                var hasValidation = this.checkForResponseValidation(content, match.index || 0);
                if (!hasValidation) {
                    this.boundaries.push({
                        boundary: 'thirdParty',
                        location: "".concat(filePath, ":").concat(lineNumber),
                        hasValidation: false,
                        issue: 'Third-party API response not validated'
                    });
                }
            }
        }
    };
    BoundaryValidator.prototype.checkForValidation = function (content, position, boundaryType) {
        // Check for validation within 10 lines
        var nearbyContent = content.substring(position, position + 500);
        var validationPatterns = [
            /\.parse\(/,
            /\.safeParse\(/,
            /\.validate\(/,
            /\.assert\(/,
            /Schema\./,
            /Contract\./,
            /validate[A-Z]/,
            /zod/i
        ];
        return validationPatterns.some(function (pattern) { return pattern.test(nearbyContent); });
    };
    BoundaryValidator.prototype.checkForWebhookValidation = function (content, position) {
        var nearbyContent = content.substring(position, position + 1000);
        // Check for webhook-specific validation
        return /(?:webhook|payload|body).*(?:parse|validate|verify|Schema)/i.test(nearbyContent);
    };
    BoundaryValidator.prototype.checkForQueueValidation = function (content, position) {
        var nearbyContent = content.substring(position, position + 1000);
        // Check for message validation
        return /(?:message|payload|body).*(?:parse|validate|Schema)/i.test(nearbyContent);
    };
    BoundaryValidator.prototype.checkForResponseValidation = function (content, position) {
        var nearbyContent = content.substring(position, position + 1000);
        // Check for response validation
        return /(?:response|data|result).*(?:parse|validate|Schema)/i.test(nearbyContent);
    };
    BoundaryValidator.prototype.getValidationType = function (content, position) {
        var nearbyContent = content.substring(position, position + 200);
        if (/\.parse\(/.test(nearbyContent))
            return 'parse';
        if (/\.safeParse\(/.test(nearbyContent))
            return 'safeParse';
        if (/\.validate\(/.test(nearbyContent))
            return 'validate';
        if (/Schema\./.test(nearbyContent))
            return 'Schema';
        return 'unknown';
    };
    BoundaryValidator.prototype.getIssueDescription = function (boundaryType) {
        var descriptions = {
            dbRead: 'Database read not validated - use Schema.parse()',
            dbWrite: 'Database write not validated - validate before insert',
            apiRequest: 'API request not validated - use RequestSchema.parse()',
            apiResponse: 'API response not validated - use ResponseSchema.parse()',
            hookReturn: 'Hook return not validated',
            webhook: 'Webhook payload not validated - CRITICAL security risk',
            queue: 'Queue message not validated - could cause processing failures',
            thirdParty: 'Third-party API response not validated - could break on API changes',
            websocket: 'WebSocket message not validated',
            fileUpload: 'File upload not validated',
            graphql: 'GraphQL resolver not validated',
            events: 'Event payload not validated'
        };
        return descriptions[boundaryType] || 'Boundary not validated';
    };
    BoundaryValidator.prototype.getLineNumber = function (content, index) {
        return content.substring(0, index).split('\n').length;
    };
    BoundaryValidator.prototype.getTypeScriptFiles = function (dir) {
        var files = [];
        var scanDir = function (currentDir) {
            try {
                var items = fs.readdirSync(currentDir);
                for (var _i = 0, items_1 = items; _i < items_1.length; _i++) {
                    var item = items_1[_i];
                    var fullPath = path.join(currentDir, item);
                    // Skip node_modules and other non-source directories
                    if (item === 'node_modules' || item.startsWith('.'))
                        continue;
                    var stat = fs.statSync(fullPath);
                    if (stat.isDirectory()) {
                        scanDir(fullPath);
                    }
                    else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
                        files.push(fullPath);
                    }
                }
            }
            catch (error) {
                // Skip directories we can't read
            }
        };
        scanDir(dir);
        return files;
    };
    BoundaryValidator.prototype.generateReport = function () {
        var results = this.analyze();
        var report = '# Boundary Validation Report\n\n';
        report += "## Coverage: ".concat(results.coverage, "%\n\n");
        report += "Total Boundaries: ".concat(results.boundaries.length, "\n");
        report += "Validated: ".concat(results.boundaries.filter(function (b) { return b.hasValidation; }).length, "\n");
        report += "Unvalidated: ".concat(results.boundaries.filter(function (b) { return !b.hasValidation; }).length, "\n\n");
        if (results.critical.length > 0) {
            report += '## 🔴 CRITICAL - Unvalidated Boundaries\n\n';
            for (var _i = 0, _a = results.critical; _i < _a.length; _i++) {
                var boundary = _a[_i];
                report += "- **".concat(boundary.boundary, "** at ").concat(boundary.location, "\n");
                report += "  Issue: ".concat(boundary.issue, "\n\n");
            }
        }
        report += '## All Boundaries\n\n';
        var grouped = this.groupByType(results.boundaries);
        for (var _b = 0, _c = Object.entries(grouped); _b < _c.length; _b++) {
            var _d = _c[_b], type = _d[0], boundaries = _d[1];
            var validated = boundaries.filter(function (b) { return b.hasValidation; }).length;
            var percentage = Math.round((validated / boundaries.length) * 100);
            report += "### ".concat(type, " (").concat(percentage, "% validated)\n");
            for (var _e = 0, boundaries_1 = boundaries; _e < boundaries_1.length; _e++) {
                var boundary = boundaries_1[_e];
                var status_1 = boundary.hasValidation ? '✅' : '❌';
                report += "".concat(status_1, " ").concat(boundary.location, "\n");
                if (!boundary.hasValidation && boundary.issue) {
                    report += "   \u26A0\uFE0F  ".concat(boundary.issue, "\n");
                }
            }
            report += '\n';
        }
        return report;
    };
    BoundaryValidator.prototype.groupByType = function (boundaries) {
        var grouped = {};
        for (var _i = 0, boundaries_2 = boundaries; _i < boundaries_2.length; _i++) {
            var boundary = boundaries_2[_i];
            if (!grouped[boundary.boundary]) {
                grouped[boundary.boundary] = [];
            }
            grouped[boundary.boundary].push(boundary);
        }
        return grouped;
    };
    return BoundaryValidator;
}());
exports.BoundaryValidator = BoundaryValidator;
