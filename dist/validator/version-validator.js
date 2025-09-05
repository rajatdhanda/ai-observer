"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VersionValidator = void 0;
var fs = require("fs");
var path = require("path");
var crypto = require("crypto");
var VersionValidator = /** @class */ (function () {
    function VersionValidator(projectPath) {
        this.schemaHashes = new Map();
        this.violations = [];
        this.projectPath = projectPath;
        this.schemasPath = path.join(projectPath, 'contracts', 'schemas');
        this.changelogPath = path.join(projectPath, 'contracts', 'CONTRACTS_CHANGELOG.md');
        // Load stored hashes if they exist
        this.loadStoredHashes();
    }
    VersionValidator.prototype.validate = function () {
        this.violations = [];
        var schemas = this.scanSchemas();
        // Check for version violations
        this.checkVersioning(schemas);
        this.checkBreakingChanges(schemas);
        this.checkDeprecations(schemas);
        this.checkChangelog(schemas);
        var versionedCount = schemas.filter(function (s) { return s.version !== 'unknown'; }).length;
        var coverage = schemas.length > 0
            ? Math.round((versionedCount / schemas.length) * 100)
            : 0;
        return {
            violations: this.violations,
            schemas: schemas,
            coverage: coverage
        };
    };
    VersionValidator.prototype.scanSchemas = function () {
        var schemas = [];
        if (!fs.existsSync(this.schemasPath)) {
            return schemas;
        }
        var files = fs.readdirSync(this.schemasPath);
        for (var _i = 0, files_1 = files; _i < files_1.length; _i++) {
            var file = files_1[_i];
            if (!file.endsWith('.schema.ts'))
                continue;
            var filePath = path.join(this.schemasPath, file);
            var content = fs.readFileSync(filePath, 'utf-8');
            var hash = this.getContentHash(content);
            // Extract version from filename or content
            var version = this.extractVersion(file, content);
            var name_1 = this.extractSchemaName(file, content);
            schemas.push({
                name: name_1,
                version: version,
                filePath: filePath,
                hash: hash,
                deprecationDate: this.extractDeprecationDate(content)
            });
        }
        return schemas;
    };
    VersionValidator.prototype.extractVersion = function (filename, content) {
        // Check filename for version (e.g., professional.v1.schema.ts)
        var filenameMatch = filename.match(/\.v(\d+(?:\.\d+)?)\./);
        if (filenameMatch) {
            return "v".concat(filenameMatch[1]);
        }
        // Check content for version export (e.g., export const ProfessionalV2Schema)
        var contentMatch = content.match(/export\s+const\s+\w+V(\d+)(?:Schema|Contract)/);
        if (contentMatch) {
            return "v".concat(contentMatch[1]);
        }
        return 'unknown';
    };
    VersionValidator.prototype.extractSchemaName = function (filename, content) {
        // Extract from filename
        var nameMatch = filename.match(/^([^.]+)/);
        if (nameMatch) {
            return nameMatch[1].charAt(0).toUpperCase() + nameMatch[1].slice(1);
        }
        return 'Unknown';
    };
    VersionValidator.prototype.extractDeprecationDate = function (content) {
        var match = content.match(/DEPRECATION_DATE\s*=\s*['"`]([^'"`]+)['"`]/);
        return match ? match[1] : undefined;
    };
    VersionValidator.prototype.checkVersioning = function (schemas) {
        // Group schemas by name
        var grouped = new Map();
        for (var _i = 0, schemas_1 = schemas; _i < schemas_1.length; _i++) {
            var schema = schemas_1[_i];
            var baseName = schema.name.replace(/V\d+$/, '');
            if (!grouped.has(baseName)) {
                grouped.set(baseName, []);
            }
            grouped.get(baseName).push(schema);
        }
        // Check each group
        for (var _a = 0, grouped_1 = grouped; _a < grouped_1.length; _a++) {
            var _b = grouped_1[_a], name_2 = _b[0], versions = _b[1];
            // Check if there's an unversioned schema
            var unversioned = versions.find(function (v) { return v.version === 'unknown'; });
            if (unversioned) {
                this.violations.push({
                    schema: name_2,
                    issue: 'Schema not versioned',
                    severity: 'warning',
                    suggestion: "Rename to ".concat(name_2.toLowerCase(), ".v1.schema.ts")
                });
            }
            // Check for multiple versions without deprecation
            if (versions.length > 1) {
                var activeVersions = versions.filter(function (v) { return !v.deprecationDate; });
                if (activeVersions.length > 1) {
                    this.violations.push({
                        schema: name_2,
                        issue: 'Multiple active versions without deprecation dates',
                        severity: 'warning',
                        suggestion: 'Set DEPRECATION_DATE for older versions'
                    });
                }
            }
        }
    };
    VersionValidator.prototype.checkBreakingChanges = function (schemas) {
        for (var _i = 0, schemas_2 = schemas; _i < schemas_2.length; _i++) {
            var schema = schemas_2[_i];
            var storedHash = this.schemaHashes.get(schema.filePath);
            if (storedHash && storedHash !== schema.hash) {
                // Schema changed - check if it's a breaking change
                if (this.isBreakingChange(schema.filePath)) {
                    // Check if version was bumped
                    var oldVersion = this.getStoredVersion(schema.filePath);
                    if (oldVersion === schema.version) {
                        this.violations.push({
                            schema: schema.name,
                            issue: 'Breaking change without version bump',
                            severity: 'error',
                            suggestion: "Create ".concat(schema.name.toLowerCase(), ".v").concat(this.getNextVersion(schema.version), ".schema.ts")
                        });
                    }
                }
            }
            // Store current hash
            this.schemaHashes.set(schema.filePath, schema.hash);
        }
        // Save hashes for next run
        this.saveStoredHashes();
    };
    VersionValidator.prototype.checkDeprecations = function (schemas) {
        var now = new Date();
        for (var _i = 0, schemas_3 = schemas; _i < schemas_3.length; _i++) {
            var schema = schemas_3[_i];
            if (schema.deprecationDate) {
                var deprecationDate = new Date(schema.deprecationDate);
                if (deprecationDate < now) {
                    this.violations.push({
                        schema: schema.name,
                        issue: "Schema deprecated since ".concat(schema.deprecationDate),
                        severity: 'warning',
                        suggestion: 'Remove deprecated version or extend deprecation date'
                    });
                }
                else {
                    var daysUntilDeprecation = Math.ceil((deprecationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                    if (daysUntilDeprecation < 7) {
                        this.violations.push({
                            schema: schema.name,
                            issue: "Schema deprecating in ".concat(daysUntilDeprecation, " days"),
                            severity: 'warning',
                            suggestion: 'Ensure all consumers have migrated'
                        });
                    }
                }
            }
        }
    };
    VersionValidator.prototype.checkChangelog = function (schemas) {
        if (!fs.existsSync(this.changelogPath)) {
            this.violations.push({
                schema: 'All',
                issue: 'CONTRACTS_CHANGELOG.md not found',
                severity: 'error',
                suggestion: 'Create CONTRACTS_CHANGELOG.md to track schema changes'
            });
            return;
        }
        var changelog = fs.readFileSync(this.changelogPath, 'utf-8');
        // Check if recent changes are documented
        for (var _i = 0, schemas_4 = schemas; _i < schemas_4.length; _i++) {
            var schema = schemas_4[_i];
            if (schema.version !== 'unknown' && schema.version !== 'v1') {
                var versionPattern = new RegExp("".concat(schema.name, ".*V").concat(schema.version.substring(1)), 'i');
                if (!versionPattern.test(changelog)) {
                    this.violations.push({
                        schema: schema.name,
                        issue: "Version ".concat(schema.version, " not documented in changelog"),
                        severity: 'warning',
                        suggestion: "Add ".concat(schema.name, " ").concat(schema.version, " changes to CONTRACTS_CHANGELOG.md")
                    });
                }
            }
        }
    };
    VersionValidator.prototype.isBreakingChange = function (filePath) {
        // Simple heuristic: check if required fields were added or types changed
        // In a real implementation, you'd parse the AST to detect actual breaking changes
        try {
            var content_1 = fs.readFileSync(filePath, 'utf-8');
            // Check for common breaking change patterns
            var breakingPatterns = [
                /\srequired:/, // New required field
                /\.min\(\d+\)/, // New minimum constraint
                /\.max\(\d+\)/, // New maximum constraint
                /z\.enum\(/, // Enum changes
                /BREAKING/i, // Explicit breaking change comment
            ];
            return breakingPatterns.some(function (pattern) { return pattern.test(content_1); });
        }
        catch (_a) {
            return false;
        }
    };
    VersionValidator.prototype.getStoredVersion = function (filePath) {
        // In a real implementation, this would read from a metadata file
        var filename = path.basename(filePath);
        var match = filename.match(/\.v(\d+(?:\.\d+)?)\./);
        return match ? "v".concat(match[1]) : 'v1';
    };
    VersionValidator.prototype.getNextVersion = function (currentVersion) {
        if (currentVersion === 'unknown')
            return '2';
        var versionNum = parseInt(currentVersion.replace('v', ''));
        return String(versionNum + 1);
    };
    VersionValidator.prototype.getContentHash = function (content) {
        // Remove comments and whitespace for more stable hashing
        var normalized = content
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .replace(/\/\/.*/g, '')
            .replace(/\s+/g, ' ')
            .trim();
        return crypto.createHash('md5').update(normalized).digest('hex');
    };
    VersionValidator.prototype.loadStoredHashes = function () {
        var hashFile = path.join(this.projectPath, '.observer', 'schema-hashes.json');
        if (fs.existsSync(hashFile)) {
            try {
                var data = JSON.parse(fs.readFileSync(hashFile, 'utf-8'));
                this.schemaHashes = new Map(Object.entries(data));
            }
            catch (_a) {
                // Ignore errors
            }
        }
    };
    VersionValidator.prototype.saveStoredHashes = function () {
        var hashFile = path.join(this.projectPath, '.observer', 'schema-hashes.json');
        var dir = path.dirname(hashFile);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        var data = Object.fromEntries(this.schemaHashes);
        fs.writeFileSync(hashFile, JSON.stringify(data, null, 2));
    };
    VersionValidator.prototype.generateReport = function () {
        var results = this.validate();
        var report = '# Contract Version Validation Report\n\n';
        report += "## Coverage: ".concat(results.coverage, "% of schemas properly versioned\n\n");
        if (results.violations.length > 0) {
            report += '## Violations\n\n';
            var errors = results.violations.filter(function (v) { return v.severity === 'error'; });
            var warnings = results.violations.filter(function (v) { return v.severity === 'warning'; });
            if (errors.length > 0) {
                report += '### 🔴 Errors (Must Fix)\n\n';
                for (var _i = 0, errors_1 = errors; _i < errors_1.length; _i++) {
                    var error = errors_1[_i];
                    report += "- **".concat(error.schema, "**: ").concat(error.issue, "\n");
                    report += "  \uD83D\uDCA1 ".concat(error.suggestion, "\n\n");
                }
            }
            if (warnings.length > 0) {
                report += '### ⚠️ Warnings\n\n';
                for (var _a = 0, warnings_1 = warnings; _a < warnings_1.length; _a++) {
                    var warning = warnings_1[_a];
                    report += "- **".concat(warning.schema, "**: ").concat(warning.issue, "\n");
                    report += "  \uD83D\uDCA1 ".concat(warning.suggestion, "\n\n");
                }
            }
        }
        report += '## Schema Versions\n\n';
        report += '| Schema | Version | Status |\n';
        report += '|--------|---------|--------|\n';
        for (var _b = 0, _c = results.schemas; _b < _c.length; _b++) {
            var schema = _c[_b];
            var status_1 = schema.deprecationDate
                ? "Deprecated ".concat(schema.deprecationDate)
                : 'Active';
            report += "| ".concat(schema.name, " | ").concat(schema.version, " | ").concat(status_1, " |\n");
        }
        return report;
    };
    return VersionValidator;
}());
exports.VersionValidator = VersionValidator;
