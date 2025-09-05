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
exports.CTAValidator = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class CTAValidator {
    projectPath;
    issues = [];
    // CTA text patterns that indicate actionable elements
    ctaKeywords = [
        'View All', 'See All', 'Show More', 'Load More',
        'Learn More', 'Read More', 'Find Out More',
        'Get Started', 'Start Now', 'Begin', 'Try Now',
        'Sign Up', 'Sign In', 'Log In', 'Register',
        'Download', 'Upload', 'Submit', 'Save',
        'Click Here', 'Tap Here', 'Press Here',
        'Coming Soon', 'Available Soon', 'Launching Soon',
        'Contact Us', 'Get in Touch', 'Reach Out',
        'Shop Now', 'Buy Now', 'Order Now', 'Purchase',
        'Browse', 'Explore', 'Discover',
        'Continue', 'Next', 'Previous', 'Back',
        'Apply Now', 'Join Now', 'Subscribe',
        'Watch Video', 'Play Video', 'View Gallery'
    ];
    constructor(projectPath) {
        this.projectPath = projectPath;
    }
    async validate() {
        this.issues = [];
        await this.scanDirectory(this.projectPath);
        return {
            issues: this.issues,
            stats: this.generateStats()
        };
    }
    async scanDirectory(dir) {
        const items = fs.readdirSync(dir, { withFileTypes: true });
        for (const item of items) {
            const fullPath = path.join(dir, item.name);
            // Skip node_modules, .next, dist, etc.
            if (this.shouldSkipDirectory(item.name)) {
                continue;
            }
            if (item.isDirectory()) {
                await this.scanDirectory(fullPath);
            }
            else if (this.isReactFile(item.name)) {
                await this.analyzeFile(fullPath);
            }
        }
    }
    shouldSkipDirectory(name) {
        const skipDirs = ['node_modules', '.next', 'dist', '.git', 'build', 'coverage', '.observer'];
        return skipDirs.includes(name) || name.startsWith('.');
    }
    isReactFile(name) {
        return name.endsWith('.tsx') || name.endsWith('.jsx') ||
            (name.endsWith('.ts') && !name.endsWith('.d.ts')) ||
            (name.endsWith('.js') && !name.includes('.min.'));
    }
    async analyzeFile(filePath) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');
        lines.forEach((line, index) => {
            const lineNumber = index + 1;
            // Check for buttons without onClick
            if (/<button(?![^>]*onClick)/.test(line) && !line.includes('type="submit"')) {
                this.addIssue(filePath, lineNumber, 'missing_handler', 'button', this.extractText(line, 'button'), 'critical', 'Button element without onClick handler', 'Add an onClick handler or use a Link component if this is navigation');
            }
            // Check for Link components without href
            if (/<Link(?![^>]*href)/.test(line)) {
                this.addIssue(filePath, lineNumber, 'broken_link', 'Link', this.extractText(line, 'Link'), 'critical', 'Link component without href attribute', 'Add href attribute to make this link functional');
            }
            // Check for forms without onSubmit
            if (/<form(?![^>]*onSubmit)/.test(line)) {
                this.addIssue(filePath, lineNumber, 'missing_handler', 'form', 'Form element', 'warning', 'Form without onSubmit handler', 'Add onSubmit handler to handle form submission');
            }
            // Check for orphaned CTA text
            this.checkOrphanedCTAText(line, filePath, lineNumber);
        });
    }
    checkOrphanedCTAText(line, filePath, lineNumber) {
        // Skip if line contains button, Link, or anchor tags
        if (/<(button|Link|a)\s/i.test(line)) {
            return;
        }
        // Check each CTA keyword
        for (const keyword of this.ctaKeywords) {
            const regex = new RegExp(`>\\s*${keyword}\\s*<`, 'i');
            if (regex.test(line)) {
                // Found CTA text not in a clickable element
                const elementType = this.detectElementType(line);
                if (elementType && !['button', 'a', 'Link'].includes(elementType)) {
                    const severity = keyword.includes('Soon') ? 'info' : 'warning';
                    const issueType = keyword.includes('Soon') ? 'placeholder' : 'orphaned_text';
                    this.addIssue(filePath, lineNumber, issueType, elementType, keyword, severity, `"${keyword}" appears to be a CTA but is not clickable`, `Wrap "${keyword}" in a button or Link component with appropriate handler`);
                }
            }
        }
    }
    detectElementType(line) {
        const match = line.match(/<(\w+)[\s>]/);
        return match ? match[1] : null;
    }
    extractText(line, tag) {
        const regex = new RegExp(`<${tag}[^>]*>([^<]*)<\/${tag}>`, 'i');
        const match = line.match(regex);
        if (match && match[1]) {
            return match[1].trim().substring(0, 50);
        }
        return tag + ' element';
    }
    addIssue(file, line, type, element, text, severity, message, suggestion) {
        this.issues.push({
            file: file.replace(this.projectPath, ''),
            line,
            type,
            element,
            text,
            severity,
            message,
            suggestion
        });
    }
    generateStats() {
        const stats = {
            total: this.issues.length,
            byType: {},
            bySeverity: {},
            topFiles: []
        };
        // Count by type
        this.issues.forEach(issue => {
            stats.byType[issue.type] = (stats.byType[issue.type] || 0) + 1;
            stats.bySeverity[issue.severity] = (stats.bySeverity[issue.severity] || 0) + 1;
        });
        // Top files with issues
        const fileCount = {};
        this.issues.forEach(issue => {
            fileCount[issue.file] = (fileCount[issue.file] || 0) + 1;
        });
        stats.topFiles = Object.entries(fileCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([file, count]) => ({ file, count }));
        return stats;
    }
}
exports.CTAValidator = CTAValidator;
