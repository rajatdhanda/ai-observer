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
exports.DesignSystemValidator = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class DesignSystemValidator {
    projectPath;
    violations = [];
    // Components that MUST come from design system
    dsComponents = [
        'Button',
        'Input',
        'Select',
        'Dialog',
        'Modal',
        'Card',
        'Badge',
        'Alert',
        'Tabs',
        'Dropdown',
        'Checkbox',
        'Radio',
        'Switch',
        'Textarea',
        'Toast'
    ];
    // Auto-detected design system paths (will be populated in constructor)
    allowedDSPaths = [];
    detectedDSPath = '';
    // Banned direct UI library imports
    bannedImports = [
        'radix-ui',
        '@headlessui',
        '@mui/material',
        'antd',
        'chakra-ui',
        'react-bootstrap'
    ];
    constructor(projectPath) {
        this.projectPath = projectPath;
        this.detectDesignSystem();
    }
    detectDesignSystem() {
        // Auto-detect where the design system components are located
        const possiblePaths = [
            'src/components/ui',
            'src/components/design-system',
            'src/components/ds',
            'src/ui',
            'components/ui',
            'components/design-system',
            'app/components/ui',
            'lib/components'
        ];
        // Check which paths exist
        for (const possiblePath of possiblePaths) {
            const fullPath = path.join(this.projectPath, possiblePath);
            if (fs.existsSync(fullPath)) {
                this.detectedDSPath = possiblePath;
                // Add various import formats for this path
                const basePath = possiblePath.replace(/^src\//, '');
                this.allowedDSPaths.push(`@/${basePath}`, `./${basePath}`, `../${basePath}`, `~/${basePath}`, possiblePath);
                console.log(`✅ Detected design system at: ${possiblePath}`);
                break;
            }
        }
        // If no design system found, use common patterns
        if (this.allowedDSPaths.length === 0) {
            console.log('⚠️  No design system folder detected, using common patterns');
            this.allowedDSPaths = [
                '@/components',
                './components',
                '../components'
            ];
        }
    }
    validate() {
        this.violations = [];
        const files = this.getSourceFiles();
        for (const file of files) {
            this.validateFile(file);
        }
        const summary = {
            imports: this.violations.filter(v => v.type === 'import').length,
            tokens: this.violations.filter(v => v.type === 'token').length,
            a11y: this.violations.filter(v => v.type === 'a11y').length,
            total: this.violations.length
        };
        // Score calculation (100 - percentage of violations)
        const maxExpectedViolations = files.length * 3; // Expect max 3 violations per file
        const score = Math.max(0, Math.round(100 - (summary.total / maxExpectedViolations) * 100));
        return {
            violations: this.violations,
            score,
            summary,
            designSystemPath: this.detectedDSPath || 'Not detected'
        };
    }
    validateFile(filePath) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');
        // Skip if it's a design system file itself
        if (filePath.includes('/components/ui/') || filePath.includes('/design-system/')) {
            return;
        }
        // 1. Import Guard - Check for raw HTML instead of DS components
        this.checkImportGuard(filePath, content, lines);
        // 2. Token Guard - Check for hardcoded values
        this.checkTokenGuard(filePath, content, lines);
        // 3. Component Usage - Check for correct DS usage
        this.checkComponentUsage(filePath, content, lines);
        // 4. A11y Guard - Basic accessibility checks
        this.checkA11yGuard(filePath, content, lines);
    }
    checkImportGuard(filePath, content, lines) {
        // Check for banned direct UI library imports
        for (const banned of this.bannedImports) {
            if (content.includes(`from '${banned}`) || content.includes(`from "${banned}`)) {
                const lineNum = this.findLineNumber(lines, banned);
                this.violations.push({
                    type: 'import',
                    severity: 'error',
                    file: filePath,
                    line: lineNum,
                    message: `Direct import from ${banned} not allowed`,
                    suggestion: `Import from your design system instead: @/components/ui`
                });
            }
        }
        // Check for raw HTML elements that should use DS components
        const rawElements = [
            { tag: '<button', component: 'Button' },
            { tag: '<input', component: 'Input' },
            { tag: '<select', component: 'Select' },
            { tag: '<textarea', component: 'Textarea' },
            { tag: '<dialog', component: 'Dialog' }
        ];
        for (const element of rawElements) {
            // Skip if it's inside a DS component definition
            if (content.includes(`export.*${element.component}`) ||
                content.includes(`function ${element.component}`)) {
                continue;
            }
            const regex = new RegExp(element.tag + '[\\s>]', 'gi');
            const matches = content.match(regex);
            if (matches) {
                const lineNum = this.findLineNumber(lines, element.tag);
                this.violations.push({
                    type: 'import',
                    severity: 'warning',
                    file: filePath,
                    line: lineNum,
                    message: `Raw HTML ${element.tag} found - use DS ${element.component} instead`,
                    suggestion: `Import and use <${element.component}> from @/components/ui`
                });
            }
        }
    }
    checkTokenGuard(filePath, content, lines) {
        // Check for hardcoded colors
        const hexColors = /#[0-9a-fA-F]{3,6}(?:[^0-9a-fA-F]|$)/g;
        const rgbColors = /rgb\([^)]+\)/g;
        const colorMatches = [
            ...Array.from(content.matchAll(hexColors)),
            ...Array.from(content.matchAll(rgbColors))
        ];
        for (const match of colorMatches) {
            // Skip if it's in a comment or import
            const lineContent = lines[this.getLineIndex(content, match.index || 0)];
            if (lineContent?.includes('//') || lineContent?.includes('import')) {
                continue;
            }
            this.violations.push({
                type: 'token',
                severity: 'error',
                file: filePath,
                line: this.getLineIndex(content, match.index || 0) + 1,
                message: `Hardcoded color "${match[0].trim()}" found`,
                suggestion: `Use design tokens: text-primary, bg-surface, border-muted, etc.`
            });
        }
        // Check for arbitrary Tailwind values
        const arbitraryValues = /(?:text|bg|border|p|m|w|h)-\[[^\]]+\]/g;
        const arbitraryMatches = content.matchAll(arbitraryValues);
        for (const match of arbitraryMatches) {
            this.violations.push({
                type: 'token',
                severity: 'warning',
                file: filePath,
                line: this.getLineIndex(content, match.index || 0) + 1,
                message: `Arbitrary Tailwind value "${match[0]}" found`,
                suggestion: `Use predefined scale: text-sm/base/lg, p-2/4/6, etc.`
            });
        }
        // Check for inline styles
        const inlineStyles = /style\s*=\s*{[^}]+}/g;
        const styleMatches = content.matchAll(inlineStyles);
        for (const match of styleMatches) {
            // Check if it contains hardcoded values
            if (/\d+px|#[0-9a-fA-F]{3,6}/.test(match[0])) {
                this.violations.push({
                    type: 'token',
                    severity: 'warning',
                    file: filePath,
                    line: this.getLineIndex(content, match.index || 0) + 1,
                    message: `Inline styles with hardcoded values`,
                    suggestion: `Use className with design tokens or extract to CSS`
                });
            }
        }
    }
    checkComponentUsage(filePath, content, lines) {
        // Check for invalid component props
        const buttonUsage = /<Button[^>]*variant\s*=\s*["']([^"']+)["']/g;
        const buttonMatches = content.matchAll(buttonUsage);
        const validVariants = ['primary', 'secondary', 'ghost', 'outline', 'destructive'];
        for (const match of buttonMatches) {
            const variant = match[1];
            if (!validVariants.includes(variant)) {
                this.violations.push({
                    type: 'component',
                    severity: 'error',
                    file: filePath,
                    line: this.getLineIndex(content, match.index || 0) + 1,
                    message: `Invalid Button variant="${variant}"`,
                    suggestion: `Use one of: ${validVariants.join(', ')}`
                });
            }
        }
        // Check for missing size props where expected
        const sizeableComponents = ['Button', 'Input', 'Badge', 'Card'];
        for (const comp of sizeableComponents) {
            const regex = new RegExp(`<${comp}(?![^>]*size=)[^>]*>`, 'g');
            const matches = content.matchAll(regex);
            for (const match of matches) {
                // Only warn if it's not using default size
                if (!match[0].includes('...') && !match[0].includes('spread')) {
                    this.violations.push({
                        type: 'component',
                        severity: 'warning',
                        file: filePath,
                        line: this.getLineIndex(content, match.index || 0) + 1,
                        message: `${comp} missing explicit size prop`,
                        suggestion: `Add size="sm|md|lg" for consistency`
                    });
                }
            }
        }
    }
    checkA11yGuard(filePath, content, lines) {
        // Check for images without alt
        const imgWithoutAlt = /<img(?![^>]*alt\s*=)[^>]*>/g;
        const imgMatches = content.matchAll(imgWithoutAlt);
        for (const match of imgMatches) {
            this.violations.push({
                type: 'a11y',
                severity: 'error',
                file: filePath,
                line: this.getLineIndex(content, match.index || 0) + 1,
                message: `Image missing alt attribute`,
                suggestion: `Add alt="" for decorative or alt="description" for informative images`
            });
        }
        // Check for form inputs without labels
        const inputWithoutLabel = /<(?:input|select|textarea)(?![^>]*aria-label)[^>]*>/g;
        const inputMatches = content.matchAll(inputWithoutLabel);
        for (const match of inputMatches) {
            // Check if there's a label nearby
            const nearbyContent = content.substring(Math.max(0, (match.index || 0) - 200), Math.min(content.length, (match.index || 0) + 200));
            if (!nearbyContent.includes('<label') && !nearbyContent.includes('Label')) {
                this.violations.push({
                    type: 'a11y',
                    severity: 'error',
                    file: filePath,
                    line: this.getLineIndex(content, match.index || 0) + 1,
                    message: `Form input without label`,
                    suggestion: `Add <Label> or aria-label attribute`
                });
            }
        }
        // Check for click handlers on non-interactive elements
        const clickOnDiv = /<div[^>]*onClick[^>]*>/g;
        const divMatches = content.matchAll(clickOnDiv);
        for (const match of divMatches) {
            // Check if it has role="button" or tabIndex
            if (!match[0].includes('role=') && !match[0].includes('tabIndex')) {
                this.violations.push({
                    type: 'a11y',
                    severity: 'warning',
                    file: filePath,
                    line: this.getLineIndex(content, match.index || 0) + 1,
                    message: `onClick on div without interactive role`,
                    suggestion: `Add role="button" tabIndex={0} or use <Button>`
                });
            }
        }
        // Check for missing aria-label on icon-only buttons
        const iconButton = /<(?:Button|IconButton)[^>]*>[\s]*<(?:Icon|svg)[^>]*>[\s]*<\/(?:Button|IconButton)>/g;
        const iconButtonMatches = content.matchAll(iconButton);
        for (const match of iconButtonMatches) {
            if (!match[0].includes('aria-label')) {
                this.violations.push({
                    type: 'a11y',
                    severity: 'error',
                    file: filePath,
                    line: this.getLineIndex(content, match.index || 0) + 1,
                    message: `Icon-only button missing aria-label`,
                    suggestion: `Add aria-label="action description" for screen readers`
                });
            }
        }
    }
    getSourceFiles() {
        const files = [];
        const scanDir = (dir) => {
            try {
                const items = fs.readdirSync(dir);
                for (const item of items) {
                    const fullPath = path.join(dir, item);
                    // Skip node_modules and build directories
                    if (item === 'node_modules' || item === '.next' || item === 'dist' || item === 'build') {
                        continue;
                    }
                    const stat = fs.statSync(fullPath);
                    if (stat.isDirectory()) {
                        scanDir(fullPath);
                    }
                    else if (item.endsWith('.tsx') || item.endsWith('.jsx')) {
                        files.push(fullPath);
                    }
                }
            }
            catch (error) {
                // Skip directories we can't read
            }
        };
        // Focus on src/app and src/components
        const srcPath = path.join(this.projectPath, 'src');
        if (fs.existsSync(srcPath)) {
            scanDir(srcPath);
        }
        const appPath = path.join(this.projectPath, 'app');
        if (fs.existsSync(appPath)) {
            scanDir(appPath);
        }
        return files;
    }
    findLineNumber(lines, searchStr) {
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes(searchStr)) {
                return i + 1;
            }
        }
        return 1;
    }
    getLineIndex(content, charIndex) {
        return content.substring(0, charIndex).split('\n').length - 1;
    }
    generateReport() {
        const results = this.validate();
        let report = '# Design System Validation Report\n\n';
        report += `## Score: ${results.score}/100\n\n`;
        report += `### Summary\n`;
        report += `- Import violations: ${results.summary.imports}\n`;
        report += `- Token violations: ${results.summary.tokens}\n`;
        report += `- A11y violations: ${results.summary.a11y}\n`;
        report += `- **Total violations: ${results.summary.total}**\n\n`;
        if (results.violations.length > 0) {
            report += '## Violations by Type\n\n';
            const byType = this.groupByType(results.violations);
            for (const [type, violations] of Object.entries(byType)) {
                report += `### ${type.toUpperCase()} (${violations.length} issues)\n\n`;
                for (const violation of violations.slice(0, 10)) { // Show first 10
                    const severity = violation.severity === 'error' ? '🔴' : '⚠️';
                    report += `${severity} **${path.relative(this.projectPath, violation.file)}:${violation.line}**\n`;
                    report += `   ${violation.message}\n`;
                    report += `   💡 ${violation.suggestion}\n\n`;
                }
                if (violations.length > 10) {
                    report += `   ... and ${violations.length - 10} more\n\n`;
                }
            }
        }
        report += '## Recommendations\n\n';
        report += '1. **Import Guard**: Use components from @/components/ui\n';
        report += '2. **Token Guard**: Use design tokens, not hardcoded values\n';
        report += '3. **Component Props**: Follow DS prop contracts\n';
        report += '4. **Accessibility**: Add alt, labels, and ARIA attributes\n';
        return report;
    }
    groupByType(violations) {
        const grouped = {};
        for (const violation of violations) {
            if (!grouped[violation.type]) {
                grouped[violation.type] = [];
            }
            grouped[violation.type].push(violation);
        }
        return grouped;
    }
}
exports.DesignSystemValidator = DesignSystemValidator;
