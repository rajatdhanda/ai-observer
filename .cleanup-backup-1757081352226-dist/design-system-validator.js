"use strict";
/**
 * Design System Validator
 * Detects violations of design system rules to prevent UI bloat
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DesignSystemValidator = void 0;
const fs = require("fs");
const path = require("path");
class DesignSystemValidator {
    constructor(projectPath) {
        this.violations = [];
        this.projectPath = projectPath;
        // Default rules - can be customized per project
        this.rules = {
            colors: {
                allowed: [
                    // Grayscale
                    '#000000', '#ffffff',
                    '#f9fafb', '#f3f4f6', '#e5e7eb', '#d1d5db', '#9ca3af', '#6b7280', '#4b5563', '#374151', '#1f2937', '#111827',
                    // Brand colors (should come from theme)
                    '#e7dbfc', '#6c4bf4', '#5a3ed8',
                    '#fbbf24', '#f59e0b', '#d97706',
                    '#10b981', '#059669',
                    '#ef4444', '#dc2626'
                ],
                cssVariables: [
                    '--primary', '--secondary', '--accent',
                    '--background', '--foreground',
                    '--muted', '--muted-foreground',
                    '--border', '--input',
                    '--success', '--warning', '--error'
                ]
            },
            spacing: {
                unit: 4, // 4px grid
                allowed: [
                    '0', '1px', '2px', '4px', '8px', '12px', '16px', '20px', '24px',
                    '32px', '40px', '48px', '56px', '64px', '80px', '96px', '128px'
                ]
            },
            typography: {
                fontFamilies: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
                fontSizes: ['12px', '14px', '16px', '18px', '20px', '24px', '32px', '48px']
            },
            animations: {
                durations: ['150ms', '200ms', '300ms', '500ms', '700ms'],
                easings: ['ease', 'ease-in', 'ease-out', 'ease-in-out', 'cubic-bezier']
            }
        };
    }
    validate() {
        this.violations = [];
        const files = this.getStyleFiles();
        for (const file of files) {
            this.validateFile(file);
        }
        return this.violations;
    }
    validateFile(filePath) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');
        const ext = path.extname(filePath);
        if (ext === '.css' || ext === '.scss') {
            this.validateCSSFile(filePath, lines);
        }
        else if (ext === '.tsx' || ext === '.jsx') {
            this.validateComponentFile(filePath, lines);
        }
    }
    validateCSSFile(filePath, lines) {
        lines.forEach((line, index) => {
            // Check for hardcoded colors
            this.checkHardcodedColors(filePath, line, index + 1);
            // Check for non-standard spacing
            this.checkSpacing(filePath, line, index + 1);
            // Check for hardcoded fonts
            this.checkFonts(filePath, line, index + 1);
            // Check for non-standard animations
            this.checkAnimations(filePath, line, index + 1);
        });
    }
    validateComponentFile(filePath, lines) {
        lines.forEach((line, index) => {
            // Check for inline styles
            if (line.includes('style=') && line.includes('{')) {
                this.checkInlineStyles(filePath, line, index + 1);
            }
            // Check for hardcoded className values
            if (line.includes('className=') && !line.includes('cn(') && !line.includes('clsx(')) {
                this.checkHardcodedClasses(filePath, line, index + 1);
            }
            // Check for Tailwind arbitrary values
            if (line.match(/\[([\d]+px|[\d]+rem|#[0-9a-fA-F]{6})\]/)) {
                this.checkTailwindArbitraryValues(filePath, line, index + 1);
            }
        });
    }
    checkHardcodedColors(filePath, line, lineNumber) {
        // Regex for hex colors
        const hexRegex = /#([0-9a-fA-F]{3}){1,2}\b/g;
        const rgbRegex = /rgb\([\d\s,]+\)/g;
        let match;
        while ((match = hexRegex.exec(line)) !== null) {
            const color = match[0];
            if (!this.rules.colors.allowed.includes(color.toLowerCase())) {
                this.violations.push({
                    file: this.getRelativePath(filePath),
                    line: lineNumber,
                    type: 'color',
                    message: `Hardcoded color '${color}' not in design system`,
                    value: color,
                    suggestion: `Use a CSS variable like 'var(--primary)' or add to theme`
                });
            }
        }
        while ((match = rgbRegex.exec(line)) !== null) {
            this.violations.push({
                file: this.getRelativePath(filePath),
                line: lineNumber,
                type: 'color',
                message: `RGB color '${match[0]}' should use design system`,
                value: match[0],
                suggestion: `Convert to hex and add to theme, or use existing variable`
            });
        }
    }
    checkSpacing(filePath, line, lineNumber) {
        // Check padding, margin, gap values
        const spacingRegex = /(padding|margin|gap|top|left|right|bottom):\s*([\d]+px)/g;
        let match;
        while ((match = spacingRegex.exec(line)) !== null) {
            const value = match[2];
            if (!this.rules.spacing.allowed.includes(value)) {
                const pixels = parseInt(value);
                const nearestValid = this.findNearestSpacing(pixels);
                this.violations.push({
                    file: this.getRelativePath(filePath),
                    line: lineNumber,
                    type: 'spacing',
                    message: `Non-standard spacing '${value}' (not on ${this.rules.spacing.unit}px grid)`,
                    value: value,
                    suggestion: `Use '${nearestValid}' instead`
                });
            }
        }
    }
    checkFonts(filePath, line, lineNumber) {
        const fontFamilyRegex = /font-family:\s*([^;]+);/g;
        const fontSizeRegex = /font-size:\s*([\d]+px)/g;
        let match;
        while ((match = fontFamilyRegex.exec(line)) !== null) {
            const fonts = match[1].split(',').map(f => f.trim().replace(/['"]/g, ''));
            const invalidFonts = fonts.filter(f => !this.rules.typography.fontFamilies.some(allowed => f.toLowerCase().includes(allowed.toLowerCase())));
            if (invalidFonts.length > 0) {
                this.violations.push({
                    file: this.getRelativePath(filePath),
                    line: lineNumber,
                    type: 'font',
                    message: `Non-standard font '${invalidFonts.join(', ')}'`,
                    value: match[1],
                    suggestion: `Use system fonts: ${this.rules.typography.fontFamilies.join(', ')}`
                });
            }
        }
        while ((match = fontSizeRegex.exec(line)) !== null) {
            const size = match[1];
            if (!this.rules.typography.fontSizes.includes(size)) {
                this.violations.push({
                    file: this.getRelativePath(filePath),
                    line: lineNumber,
                    type: 'font',
                    message: `Non-standard font size '${size}'`,
                    value: size,
                    suggestion: `Use standard sizes: ${this.rules.typography.fontSizes.join(', ')}`
                });
            }
        }
    }
    checkAnimations(filePath, line, lineNumber) {
        const durationRegex = /(transition-duration|animation-duration):\s*([\d]+ms)/g;
        let match;
        while ((match = durationRegex.exec(line)) !== null) {
            const duration = match[2];
            if (!this.rules.animations.durations.includes(duration)) {
                this.violations.push({
                    file: this.getRelativePath(filePath),
                    line: lineNumber,
                    type: 'animation',
                    message: `Non-standard animation duration '${duration}'`,
                    value: duration,
                    suggestion: `Use standard durations: ${this.rules.animations.durations.join(', ')}`
                });
            }
        }
    }
    checkInlineStyles(filePath, line, lineNumber) {
        // Extract style object
        const styleMatch = line.match(/style=\{\{([^}]+)\}\}/);
        if (styleMatch) {
            const styles = styleMatch[1];
            // Check for hardcoded colors in inline styles
            if (styles.match(/#[0-9a-fA-F]{3,6}|rgb/)) {
                this.violations.push({
                    file: this.getRelativePath(filePath),
                    line: lineNumber,
                    type: 'color',
                    message: 'Inline style with hardcoded color',
                    value: styles.substring(0, 50) + '...',
                    suggestion: 'Move to CSS class or use theme variables'
                });
            }
            // Check for hardcoded spacing
            if (styles.match(/\d+px/)) {
                this.violations.push({
                    file: this.getRelativePath(filePath),
                    line: lineNumber,
                    type: 'spacing',
                    message: 'Inline style with hardcoded spacing',
                    value: styles.substring(0, 50) + '...',
                    suggestion: 'Use Tailwind classes or CSS variables'
                });
            }
        }
    }
    checkHardcodedClasses(filePath, line, lineNumber) {
        // Check for multiple hardcoded classes without utility function
        const classMatch = line.match(/className="([^"]+)"/);
        if (classMatch && classMatch[1].split(' ').length > 3) {
            this.violations.push({
                file: this.getRelativePath(filePath),
                line: lineNumber,
                type: 'component',
                message: 'Complex className without cn() or clsx() utility',
                value: classMatch[1].substring(0, 50) + '...',
                suggestion: 'Use cn() or clsx() for conditional classes'
            });
        }
    }
    checkTailwindArbitraryValues(filePath, line, lineNumber) {
        const arbitraryMatch = line.match(/\[([\d]+px|[\d]+rem|#[0-9a-fA-F]{6})\]/);
        if (arbitraryMatch) {
            this.violations.push({
                file: this.getRelativePath(filePath),
                line: lineNumber,
                type: 'component',
                message: `Tailwind arbitrary value '[${arbitraryMatch[1]}]'`,
                value: arbitraryMatch[1],
                suggestion: 'Use standard Tailwind classes or extend theme config'
            });
        }
    }
    findNearestSpacing(pixels) {
        const allowed = this.rules.spacing.allowed
            .map(s => parseInt(s))
            .filter(n => !isNaN(n))
            .sort((a, b) => a - b);
        let nearest = allowed[0];
        let minDiff = Math.abs(pixels - allowed[0]);
        for (const value of allowed) {
            const diff = Math.abs(pixels - value);
            if (diff < minDiff) {
                minDiff = diff;
                nearest = value;
            }
        }
        return `${nearest}px`;
    }
    getStyleFiles() {
        const files = [];
        const scanDir = (dir) => {
            if (!fs.existsSync(dir))
                return;
            const items = fs.readdirSync(dir);
            for (const item of items) {
                const fullPath = path.join(dir, item);
                const stat = fs.statSync(fullPath);
                if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
                    scanDir(fullPath);
                }
                else if (stat.isFile()) {
                    const ext = path.extname(item);
                    if (['.css', '.scss', '.tsx', '.jsx'].includes(ext)) {
                        files.push(fullPath);
                    }
                }
            }
        };
        scanDir(this.projectPath);
        return files;
    }
    getRelativePath(filePath) {
        return path.relative(this.projectPath, filePath);
    }
    generateReport() {
        const grouped = new Map();
        for (const violation of this.violations) {
            const key = violation.type;
            if (!grouped.has(key)) {
                grouped.set(key, []);
            }
            grouped.get(key).push(violation);
        }
        let report = '# Design System Validation Report\n\n';
        report += `Total violations: ${this.violations.length}\n\n`;
        for (const [type, violations] of grouped) {
            report += `## ${type.charAt(0).toUpperCase() + type.slice(1)} Violations (${violations.length})\n\n`;
            for (const v of violations) {
                report += `- **${v.file}:${v.line}**\n`;
                report += `  ${v.message}\n`;
                report += `  Value: \`${v.value}\`\n`;
                report += `  ${v.suggestion}\n\n`;
            }
        }
        return report;
    }
}
exports.DesignSystemValidator = DesignSystemValidator;
