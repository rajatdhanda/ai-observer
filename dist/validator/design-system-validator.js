"use strict";
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
exports.DesignSystemValidator = void 0;
var fs = require("fs");
var path = require("path");
var DesignSystemValidator = /** @class */ (function () {
    function DesignSystemValidator(projectPath) {
        this.violations = [];
        // Components that MUST come from design system
        this.dsComponents = [
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
        this.allowedDSPaths = [];
        this.detectedDSPath = '';
        // Banned direct UI library imports
        this.bannedImports = [
            'radix-ui',
            '@headlessui',
            '@mui/material',
            'antd',
            'chakra-ui',
            'react-bootstrap'
        ];
        this.projectPath = projectPath;
        this.detectDesignSystem();
    }
    DesignSystemValidator.prototype.detectDesignSystem = function () {
        // Auto-detect where the design system components are located
        var possiblePaths = [
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
        for (var _i = 0, possiblePaths_1 = possiblePaths; _i < possiblePaths_1.length; _i++) {
            var possiblePath = possiblePaths_1[_i];
            var fullPath = path.join(this.projectPath, possiblePath);
            if (fs.existsSync(fullPath)) {
                this.detectedDSPath = possiblePath;
                // Add various import formats for this path
                var basePath = possiblePath.replace(/^src\//, '');
                this.allowedDSPaths.push("@/".concat(basePath), "./".concat(basePath), "../".concat(basePath), "~/".concat(basePath), possiblePath);
                console.log("\u2705 Detected design system at: ".concat(possiblePath));
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
    };
    DesignSystemValidator.prototype.validate = function () {
        this.violations = [];
        var files = this.getSourceFiles();
        for (var _i = 0, files_1 = files; _i < files_1.length; _i++) {
            var file = files_1[_i];
            this.validateFile(file);
        }
        var summary = {
            imports: this.violations.filter(function (v) { return v.type === 'import'; }).length,
            tokens: this.violations.filter(function (v) { return v.type === 'token'; }).length,
            a11y: this.violations.filter(function (v) { return v.type === 'a11y'; }).length,
            total: this.violations.length
        };
        // Score calculation (100 - percentage of violations)
        var maxExpectedViolations = files.length * 3; // Expect max 3 violations per file
        var score = Math.max(0, Math.round(100 - (summary.total / maxExpectedViolations) * 100));
        return {
            violations: this.violations,
            score: score,
            summary: summary,
            designSystemPath: this.detectedDSPath || 'Not detected'
        };
    };
    DesignSystemValidator.prototype.validateFile = function (filePath) {
        var content = fs.readFileSync(filePath, 'utf-8');
        var lines = content.split('\n');
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
    };
    DesignSystemValidator.prototype.checkImportGuard = function (filePath, content, lines) {
        // Check for banned direct UI library imports
        for (var _i = 0, _a = this.bannedImports; _i < _a.length; _i++) {
            var banned = _a[_i];
            if (content.includes("from '".concat(banned)) || content.includes("from \"".concat(banned))) {
                var lineNum = this.findLineNumber(lines, banned);
                this.violations.push({
                    type: 'import',
                    severity: 'error',
                    file: filePath,
                    line: lineNum,
                    message: "Direct import from ".concat(banned, " not allowed"),
                    suggestion: "Import from your design system instead: @/components/ui"
                });
            }
        }
        // Check for raw HTML elements that should use DS components
        var rawElements = [
            { tag: '<button', component: 'Button' },
            { tag: '<input', component: 'Input' },
            { tag: '<select', component: 'Select' },
            { tag: '<textarea', component: 'Textarea' },
            { tag: '<dialog', component: 'Dialog' }
        ];
        for (var _b = 0, rawElements_1 = rawElements; _b < rawElements_1.length; _b++) {
            var element = rawElements_1[_b];
            // Skip if it's inside a DS component definition
            if (content.includes("export.*".concat(element.component)) ||
                content.includes("function ".concat(element.component))) {
                continue;
            }
            var regex = new RegExp(element.tag + '[\\s>]', 'gi');
            var matches = content.match(regex);
            if (matches) {
                var lineNum = this.findLineNumber(lines, element.tag);
                this.violations.push({
                    type: 'import',
                    severity: 'warning',
                    file: filePath,
                    line: lineNum,
                    message: "Raw HTML ".concat(element.tag, " found - use DS ").concat(element.component, " instead"),
                    suggestion: "Import and use <".concat(element.component, "> from @/components/ui")
                });
            }
        }
    };
    DesignSystemValidator.prototype.checkTokenGuard = function (filePath, content, lines) {
        // Check for hardcoded colors
        var hexColors = /#[0-9a-fA-F]{3,6}(?:[^0-9a-fA-F]|$)/g;
        var rgbColors = /rgb\([^)]+\)/g;
        var colorMatches = __spreadArray(__spreadArray([], Array.from(content.matchAll(hexColors)), true), Array.from(content.matchAll(rgbColors)), true);
        for (var _i = 0, colorMatches_1 = colorMatches; _i < colorMatches_1.length; _i++) {
            var match = colorMatches_1[_i];
            // Skip if it's in a comment or import
            var lineContent = lines[this.getLineIndex(content, match.index || 0)];
            if ((lineContent === null || lineContent === void 0 ? void 0 : lineContent.includes('//')) || (lineContent === null || lineContent === void 0 ? void 0 : lineContent.includes('import'))) {
                continue;
            }
            this.violations.push({
                type: 'token',
                severity: 'error',
                file: filePath,
                line: this.getLineIndex(content, match.index || 0) + 1,
                message: "Hardcoded color \"".concat(match[0].trim(), "\" found"),
                suggestion: "Use design tokens: text-primary, bg-surface, border-muted, etc."
            });
        }
        // Check for arbitrary Tailwind values
        var arbitraryValues = /(?:text|bg|border|p|m|w|h)-\[[^\]]+\]/g;
        var arbitraryMatches = content.matchAll(arbitraryValues);
        for (var _a = 0, arbitraryMatches_1 = arbitraryMatches; _a < arbitraryMatches_1.length; _a++) {
            var match = arbitraryMatches_1[_a];
            this.violations.push({
                type: 'token',
                severity: 'warning',
                file: filePath,
                line: this.getLineIndex(content, match.index || 0) + 1,
                message: "Arbitrary Tailwind value \"".concat(match[0], "\" found"),
                suggestion: "Use predefined scale: text-sm/base/lg, p-2/4/6, etc."
            });
        }
        // Check for inline styles
        var inlineStyles = /style\s*=\s*{[^}]+}/g;
        var styleMatches = content.matchAll(inlineStyles);
        for (var _b = 0, styleMatches_1 = styleMatches; _b < styleMatches_1.length; _b++) {
            var match = styleMatches_1[_b];
            // Check if it contains hardcoded values
            if (/\d+px|#[0-9a-fA-F]{3,6}/.test(match[0])) {
                this.violations.push({
                    type: 'token',
                    severity: 'warning',
                    file: filePath,
                    line: this.getLineIndex(content, match.index || 0) + 1,
                    message: "Inline styles with hardcoded values",
                    suggestion: "Use className with design tokens or extract to CSS"
                });
            }
        }
    };
    DesignSystemValidator.prototype.checkComponentUsage = function (filePath, content, lines) {
        // Check for invalid component props
        var buttonUsage = /<Button[^>]*variant\s*=\s*["']([^"']+)["']/g;
        var buttonMatches = content.matchAll(buttonUsage);
        var validVariants = ['primary', 'secondary', 'ghost', 'outline', 'destructive'];
        for (var _i = 0, buttonMatches_1 = buttonMatches; _i < buttonMatches_1.length; _i++) {
            var match = buttonMatches_1[_i];
            var variant = match[1];
            if (!validVariants.includes(variant)) {
                this.violations.push({
                    type: 'component',
                    severity: 'error',
                    file: filePath,
                    line: this.getLineIndex(content, match.index || 0) + 1,
                    message: "Invalid Button variant=\"".concat(variant, "\""),
                    suggestion: "Use one of: ".concat(validVariants.join(', '))
                });
            }
        }
        // Check for missing size props where expected
        var sizeableComponents = ['Button', 'Input', 'Badge', 'Card'];
        for (var _a = 0, sizeableComponents_1 = sizeableComponents; _a < sizeableComponents_1.length; _a++) {
            var comp = sizeableComponents_1[_a];
            var regex = new RegExp("<".concat(comp, "(?![^>]*size=)[^>]*>"), 'g');
            var matches = content.matchAll(regex);
            for (var _b = 0, matches_1 = matches; _b < matches_1.length; _b++) {
                var match = matches_1[_b];
                // Only warn if it's not using default size
                if (!match[0].includes('...') && !match[0].includes('spread')) {
                    this.violations.push({
                        type: 'component',
                        severity: 'warning',
                        file: filePath,
                        line: this.getLineIndex(content, match.index || 0) + 1,
                        message: "".concat(comp, " missing explicit size prop"),
                        suggestion: "Add size=\"sm|md|lg\" for consistency"
                    });
                }
            }
        }
    };
    DesignSystemValidator.prototype.checkA11yGuard = function (filePath, content, lines) {
        // Check for images without alt
        var imgWithoutAlt = /<img(?![^>]*alt\s*=)[^>]*>/g;
        var imgMatches = content.matchAll(imgWithoutAlt);
        for (var _i = 0, imgMatches_1 = imgMatches; _i < imgMatches_1.length; _i++) {
            var match = imgMatches_1[_i];
            this.violations.push({
                type: 'a11y',
                severity: 'error',
                file: filePath,
                line: this.getLineIndex(content, match.index || 0) + 1,
                message: "Image missing alt attribute",
                suggestion: "Add alt=\"\" for decorative or alt=\"description\" for informative images"
            });
        }
        // Check for form inputs without labels
        var inputWithoutLabel = /<(?:input|select|textarea)(?![^>]*aria-label)[^>]*>/g;
        var inputMatches = content.matchAll(inputWithoutLabel);
        for (var _a = 0, inputMatches_1 = inputMatches; _a < inputMatches_1.length; _a++) {
            var match = inputMatches_1[_a];
            // Check if there's a label nearby
            var nearbyContent = content.substring(Math.max(0, (match.index || 0) - 200), Math.min(content.length, (match.index || 0) + 200));
            if (!nearbyContent.includes('<label') && !nearbyContent.includes('Label')) {
                this.violations.push({
                    type: 'a11y',
                    severity: 'error',
                    file: filePath,
                    line: this.getLineIndex(content, match.index || 0) + 1,
                    message: "Form input without label",
                    suggestion: "Add <Label> or aria-label attribute"
                });
            }
        }
        // Check for click handlers on non-interactive elements
        var clickOnDiv = /<div[^>]*onClick[^>]*>/g;
        var divMatches = content.matchAll(clickOnDiv);
        for (var _b = 0, divMatches_1 = divMatches; _b < divMatches_1.length; _b++) {
            var match = divMatches_1[_b];
            // Check if it has role="button" or tabIndex
            if (!match[0].includes('role=') && !match[0].includes('tabIndex')) {
                this.violations.push({
                    type: 'a11y',
                    severity: 'warning',
                    file: filePath,
                    line: this.getLineIndex(content, match.index || 0) + 1,
                    message: "onClick on div without interactive role",
                    suggestion: "Add role=\"button\" tabIndex={0} or use <Button>"
                });
            }
        }
        // Check for missing aria-label on icon-only buttons
        var iconButton = /<(?:Button|IconButton)[^>]*>[\s]*<(?:Icon|svg)[^>]*>[\s]*<\/(?:Button|IconButton)>/g;
        var iconButtonMatches = content.matchAll(iconButton);
        for (var _c = 0, iconButtonMatches_1 = iconButtonMatches; _c < iconButtonMatches_1.length; _c++) {
            var match = iconButtonMatches_1[_c];
            if (!match[0].includes('aria-label')) {
                this.violations.push({
                    type: 'a11y',
                    severity: 'error',
                    file: filePath,
                    line: this.getLineIndex(content, match.index || 0) + 1,
                    message: "Icon-only button missing aria-label",
                    suggestion: "Add aria-label=\"action description\" for screen readers"
                });
            }
        }
    };
    DesignSystemValidator.prototype.getSourceFiles = function () {
        var files = [];
        var scanDir = function (dir) {
            try {
                var items = fs.readdirSync(dir);
                for (var _i = 0, items_1 = items; _i < items_1.length; _i++) {
                    var item = items_1[_i];
                    var fullPath = path.join(dir, item);
                    // Skip node_modules and build directories
                    if (item === 'node_modules' || item === '.next' || item === 'dist' || item === 'build') {
                        continue;
                    }
                    var stat = fs.statSync(fullPath);
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
        var srcPath = path.join(this.projectPath, 'src');
        if (fs.existsSync(srcPath)) {
            scanDir(srcPath);
        }
        var appPath = path.join(this.projectPath, 'app');
        if (fs.existsSync(appPath)) {
            scanDir(appPath);
        }
        return files;
    };
    DesignSystemValidator.prototype.findLineNumber = function (lines, searchStr) {
        for (var i = 0; i < lines.length; i++) {
            if (lines[i].includes(searchStr)) {
                return i + 1;
            }
        }
        return 1;
    };
    DesignSystemValidator.prototype.getLineIndex = function (content, charIndex) {
        return content.substring(0, charIndex).split('\n').length - 1;
    };
    DesignSystemValidator.prototype.generateReport = function () {
        var results = this.validate();
        var report = '# Design System Validation Report\n\n';
        report += "## Score: ".concat(results.score, "/100\n\n");
        report += "### Summary\n";
        report += "- Import violations: ".concat(results.summary.imports, "\n");
        report += "- Token violations: ".concat(results.summary.tokens, "\n");
        report += "- A11y violations: ".concat(results.summary.a11y, "\n");
        report += "- **Total violations: ".concat(results.summary.total, "**\n\n");
        if (results.violations.length > 0) {
            report += '## Violations by Type\n\n';
            var byType = this.groupByType(results.violations);
            for (var _i = 0, _a = Object.entries(byType); _i < _a.length; _i++) {
                var _b = _a[_i], type = _b[0], violations = _b[1];
                report += "### ".concat(type.toUpperCase(), " (").concat(violations.length, " issues)\n\n");
                for (var _c = 0, _d = violations.slice(0, 10); _c < _d.length; _c++) { // Show first 10
                    var violation = _d[_c];
                    var severity = violation.severity === 'error' ? '🔴' : '⚠️';
                    report += "".concat(severity, " **").concat(path.relative(this.projectPath, violation.file), ":").concat(violation.line, "**\n");
                    report += "   ".concat(violation.message, "\n");
                    report += "   \uD83D\uDCA1 ".concat(violation.suggestion, "\n\n");
                }
                if (violations.length > 10) {
                    report += "   ... and ".concat(violations.length - 10, " more\n\n");
                }
            }
        }
        report += '## Recommendations\n\n';
        report += '1. **Import Guard**: Use components from @/components/ui\n';
        report += '2. **Token Guard**: Use design tokens, not hardcoded values\n';
        report += '3. **Component Props**: Follow DS prop contracts\n';
        report += '4. **Accessibility**: Add alt, labels, and ARIA attributes\n';
        return report;
    };
    DesignSystemValidator.prototype.groupByType = function (violations) {
        var grouped = {};
        for (var _i = 0, violations_1 = violations; _i < violations_1.length; _i++) {
            var violation = violations_1[_i];
            if (!grouped[violation.type]) {
                grouped[violation.type] = [];
            }
            grouped[violation.type].push(violation);
        }
        return grouped;
    };
    return DesignSystemValidator;
}());
exports.DesignSystemValidator = DesignSystemValidator;
