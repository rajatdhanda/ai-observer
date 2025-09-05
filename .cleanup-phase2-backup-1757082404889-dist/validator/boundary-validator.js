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
exports.BoundaryValidator = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class BoundaryValidator {
    projectPath;
    boundaries = [];
    // Define all boundary types that need validation
    boundaryPatterns = {
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
    constructor(projectPath) {
        this.projectPath = projectPath;
    }
    analyze() {
        this.boundaries = [];
        this.scanProject();
        const validated = this.boundaries.filter(b => b.hasValidation).length;
        const coverage = this.boundaries.length > 0
            ? Math.round((validated / this.boundaries.length) * 100)
            : 0;
        const critical = this.boundaries.filter(b => !b.hasValidation &&
            ['webhook', 'queue', 'thirdParty', 'dbWrite'].some(type => b.boundary.includes(type)));
        return {
            boundaries: this.boundaries,
            coverage,
            critical
        };
    }
    scanProject() {
        const files = this.getTypeScriptFiles(this.projectPath);
        for (const file of files) {
            this.analyzeFile(file);
        }
    }
    analyzeFile(filePath) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');
        // Check each boundary type
        for (const [boundaryType, pattern] of Object.entries(this.boundaryPatterns)) {
            const matches = content.matchAll(pattern);
            for (const match of matches) {
                const lineNumber = this.getLineNumber(content, match.index || 0);
                const hasValidation = this.checkForValidation(content, match.index || 0, boundaryType);
                this.boundaries.push({
                    boundary: boundaryType,
                    location: `${filePath}:${lineNumber}`,
                    hasValidation,
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
    }
    checkWebhookHandlers(filePath, content) {
        // Check for common webhook patterns
        const webhookPatterns = [
            /app\.post\(['"`]\/webhook/gi,
            /router\.post\(['"`]\/webhook/gi,
            /export.*function.*webhook/gi,
            /stripe\.webhooks\.constructEvent/gi
        ];
        for (const pattern of webhookPatterns) {
            const matches = content.matchAll(pattern);
            for (const match of matches) {
                const lineNumber = this.getLineNumber(content, match.index || 0);
                const hasValidation = this.checkForWebhookValidation(content, match.index || 0);
                if (!hasValidation) {
                    this.boundaries.push({
                        boundary: 'webhook',
                        location: `${filePath}:${lineNumber}`,
                        hasValidation: false,
                        issue: 'Webhook payload not validated with schema'
                    });
                }
            }
        }
    }
    checkQueueHandlers(filePath, content) {
        // Check for queue message handlers
        const queuePatterns = [
            /\.consume\(/gi,
            /\.receive\(/gi,
            /\.on\(['"`]message['"`]/gi,
            /sqs\.receiveMessage/gi,
            /kafka\.consumer/gi
        ];
        for (const pattern of queuePatterns) {
            const matches = content.matchAll(pattern);
            for (const match of matches) {
                const lineNumber = this.getLineNumber(content, match.index || 0);
                const hasValidation = this.checkForQueueValidation(content, match.index || 0);
                if (!hasValidation) {
                    this.boundaries.push({
                        boundary: 'queue',
                        location: `${filePath}:${lineNumber}`,
                        hasValidation: false,
                        issue: 'Queue message not validated with schema'
                    });
                }
            }
        }
    }
    checkThirdPartyAdapters(filePath, content) {
        // Check for third-party API calls
        const apiPatterns = [
            /axios\.(get|post|put|delete)/gi,
            /fetch\(['"`]http/gi,
            /got\.(get|post|put|delete)/gi
        ];
        for (const pattern of apiPatterns) {
            const matches = content.matchAll(pattern);
            for (const match of matches) {
                const lineNumber = this.getLineNumber(content, match.index || 0);
                const hasValidation = this.checkForResponseValidation(content, match.index || 0);
                if (!hasValidation) {
                    this.boundaries.push({
                        boundary: 'thirdParty',
                        location: `${filePath}:${lineNumber}`,
                        hasValidation: false,
                        issue: 'Third-party API response not validated'
                    });
                }
            }
        }
    }
    checkForValidation(content, position, boundaryType) {
        // Check for validation within 10 lines
        const nearbyContent = content.substring(position, position + 500);
        const validationPatterns = [
            /\.parse\(/,
            /\.safeParse\(/,
            /\.validate\(/,
            /\.assert\(/,
            /Schema\./,
            /Contract\./,
            /validate[A-Z]/,
            /zod/i
        ];
        return validationPatterns.some(pattern => pattern.test(nearbyContent));
    }
    checkForWebhookValidation(content, position) {
        const nearbyContent = content.substring(position, position + 1000);
        // Check for webhook-specific validation
        return /(?:webhook|payload|body).*(?:parse|validate|verify|Schema)/i.test(nearbyContent);
    }
    checkForQueueValidation(content, position) {
        const nearbyContent = content.substring(position, position + 1000);
        // Check for message validation
        return /(?:message|payload|body).*(?:parse|validate|Schema)/i.test(nearbyContent);
    }
    checkForResponseValidation(content, position) {
        const nearbyContent = content.substring(position, position + 1000);
        // Check for response validation
        return /(?:response|data|result).*(?:parse|validate|Schema)/i.test(nearbyContent);
    }
    getValidationType(content, position) {
        const nearbyContent = content.substring(position, position + 200);
        if (/\.parse\(/.test(nearbyContent))
            return 'parse';
        if (/\.safeParse\(/.test(nearbyContent))
            return 'safeParse';
        if (/\.validate\(/.test(nearbyContent))
            return 'validate';
        if (/Schema\./.test(nearbyContent))
            return 'Schema';
        return 'unknown';
    }
    getIssueDescription(boundaryType) {
        const descriptions = {
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
    }
    getLineNumber(content, index) {
        return content.substring(0, index).split('\n').length;
    }
    getTypeScriptFiles(dir) {
        const files = [];
        const scanDir = (currentDir) => {
            try {
                const items = fs.readdirSync(currentDir);
                for (const item of items) {
                    const fullPath = path.join(currentDir, item);
                    // Skip node_modules and other non-source directories
                    if (item === 'node_modules' || item.startsWith('.'))
                        continue;
                    const stat = fs.statSync(fullPath);
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
    }
    generateReport() {
        const results = this.analyze();
        let report = '# Boundary Validation Report\n\n';
        report += `## Coverage: ${results.coverage}%\n\n`;
        report += `Total Boundaries: ${results.boundaries.length}\n`;
        report += `Validated: ${results.boundaries.filter(b => b.hasValidation).length}\n`;
        report += `Unvalidated: ${results.boundaries.filter(b => !b.hasValidation).length}\n\n`;
        if (results.critical.length > 0) {
            report += '## 🔴 CRITICAL - Unvalidated Boundaries\n\n';
            for (const boundary of results.critical) {
                report += `- **${boundary.boundary}** at ${boundary.location}\n`;
                report += `  Issue: ${boundary.issue}\n\n`;
            }
        }
        report += '## All Boundaries\n\n';
        const grouped = this.groupByType(results.boundaries);
        for (const [type, boundaries] of Object.entries(grouped)) {
            const validated = boundaries.filter(b => b.hasValidation).length;
            const percentage = Math.round((validated / boundaries.length) * 100);
            report += `### ${type} (${percentage}% validated)\n`;
            for (const boundary of boundaries) {
                const status = boundary.hasValidation ? '✅' : '❌';
                report += `${status} ${boundary.location}\n`;
                if (!boundary.hasValidation && boundary.issue) {
                    report += `   ⚠️  ${boundary.issue}\n`;
                }
            }
            report += '\n';
        }
        return report;
    }
    groupByType(boundaries) {
        const grouped = {};
        for (const boundary of boundaries) {
            if (!grouped[boundary.boundary]) {
                grouped[boundary.boundary] = [];
            }
            grouped[boundary.boundary].push(boundary);
        }
        return grouped;
    }
}
exports.BoundaryValidator = BoundaryValidator;
