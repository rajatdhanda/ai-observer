import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

interface SchemaVersion {
  name: string;
  version: string;
  filePath: string;
  hash: string;
  hasBreakingChanges?: boolean;
  deprecationDate?: string;
}

interface VersionViolation {
  schema: string;
  issue: string;
  severity: 'error' | 'warning';
  suggestion: string;
}

export class VersionValidator {
  private projectPath: string;
  private schemasPath: string;
  private changelogPath: string;
  private schemaHashes: Map<string, string> = new Map();
  private violations: VersionViolation[] = [];

  constructor(projectPath: string) {
    this.projectPath = projectPath;
    this.schemasPath = path.join(projectPath, 'contracts', 'schemas');
    this.changelogPath = path.join(projectPath, 'contracts', 'CONTRACTS_CHANGELOG.md');
    
    // Load stored hashes if they exist
    this.loadStoredHashes();
  }

  public validate(): {
    violations: VersionViolation[];
    schemas: SchemaVersion[];
    coverage: number;
  } {
    this.violations = [];
    const schemas = this.scanSchemas();
    
    // Check for version violations
    this.checkVersioning(schemas);
    this.checkBreakingChanges(schemas);
    this.checkDeprecations(schemas);
    this.checkChangelog(schemas);
    
    const versionedCount = schemas.filter(s => s.version !== 'unknown').length;
    const coverage = schemas.length > 0 
      ? Math.round((versionedCount / schemas.length) * 100)
      : 0;
    
    return {
      violations: this.violations,
      schemas,
      coverage
    };
  }

  private scanSchemas(): SchemaVersion[] {
    const schemas: SchemaVersion[] = [];
    
    if (!fs.existsSync(this.schemasPath)) {
      return schemas;
    }
    
    const files = fs.readdirSync(this.schemasPath);
    
    for (const file of files) {
      if (!file.endsWith('.schema.ts')) continue;
      
      const filePath = path.join(this.schemasPath, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const hash = this.getContentHash(content);
      
      // Extract version from filename or content
      const version = this.extractVersion(file, content);
      const name = this.extractSchemaName(file, content);
      
      schemas.push({
        name,
        version,
        filePath,
        hash,
        deprecationDate: this.extractDeprecationDate(content)
      });
    }
    
    return schemas;
  }

  private extractVersion(filename: string, content: string): string {
    // Check filename for version (e.g., professional.v1.schema.ts)
    const filenameMatch = filename.match(/\.v(\d+(?:\.\d+)?)\./);
    if (filenameMatch) {
      return `v${filenameMatch[1]}`;
    }
    
    // Check content for version export (e.g., export const ProfessionalV2Schema)
    const contentMatch = content.match(/export\s+const\s+\w+V(\d+)(?:Schema|Contract)/);
    if (contentMatch) {
      return `v${contentMatch[1]}`;
    }
    
    return 'unknown';
  }

  private extractSchemaName(filename: string, content: string): string {
    // Extract from filename
    const nameMatch = filename.match(/^([^.]+)/);
    if (nameMatch) {
      return nameMatch[1].charAt(0).toUpperCase() + nameMatch[1].slice(1);
    }
    
    return 'Unknown';
  }

  private extractDeprecationDate(content: string): string | undefined {
    const match = content.match(/DEPRECATION_DATE\s*=\s*['"`]([^'"`]+)['"`]/);
    return match ? match[1] : undefined;
  }

  private checkVersioning(schemas: SchemaVersion[]) {
    // Group schemas by name
    const grouped = new Map<string, SchemaVersion[]>();
    
    for (const schema of schemas) {
      const baseName = schema.name.replace(/V\d+$/, '');
      if (!grouped.has(baseName)) {
        grouped.set(baseName, []);
      }
      grouped.get(baseName)!.push(schema);
    }
    
    // Check each group
    for (const [name, versions] of grouped) {
      // Check if there's an unversioned schema
      const unversioned = versions.find(v => v.version === 'unknown');
      if (unversioned) {
        this.violations.push({
          schema: name,
          issue: 'Schema not versioned',
          severity: 'warning',
          suggestion: `Rename to ${name.toLowerCase()}.v1.schema.ts`
        });
      }
      
      // Check for multiple versions without deprecation
      if (versions.length > 1) {
        const activeVersions = versions.filter(v => !v.deprecationDate);
        if (activeVersions.length > 1) {
          this.violations.push({
            schema: name,
            issue: 'Multiple active versions without deprecation dates',
            severity: 'warning',
            suggestion: 'Set DEPRECATION_DATE for older versions'
          });
        }
      }
    }
  }

  private checkBreakingChanges(schemas: SchemaVersion[]) {
    for (const schema of schemas) {
      const storedHash = this.schemaHashes.get(schema.filePath);
      
      if (storedHash && storedHash !== schema.hash) {
        // Schema changed - check if it's a breaking change
        if (this.isBreakingChange(schema.filePath)) {
          // Check if version was bumped
          const oldVersion = this.getStoredVersion(schema.filePath);
          
          if (oldVersion === schema.version) {
            this.violations.push({
              schema: schema.name,
              issue: 'Breaking change without version bump',
              severity: 'error',
              suggestion: `Create ${schema.name.toLowerCase()}.v${this.getNextVersion(schema.version)}.schema.ts`
            });
          }
        }
      }
      
      // Store current hash
      this.schemaHashes.set(schema.filePath, schema.hash);
    }
    
    // Save hashes for next run
    this.saveStoredHashes();
  }

  private checkDeprecations(schemas: SchemaVersion[]) {
    const now = new Date();
    
    for (const schema of schemas) {
      if (schema.deprecationDate) {
        const deprecationDate = new Date(schema.deprecationDate);
        
        if (deprecationDate < now) {
          this.violations.push({
            schema: schema.name,
            issue: `Schema deprecated since ${schema.deprecationDate}`,
            severity: 'warning',
            suggestion: 'Remove deprecated version or extend deprecation date'
          });
        } else {
          const daysUntilDeprecation = Math.ceil(
            (deprecationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );
          
          if (daysUntilDeprecation < 7) {
            this.violations.push({
              schema: schema.name,
              issue: `Schema deprecating in ${daysUntilDeprecation} days`,
              severity: 'warning',
              suggestion: 'Ensure all consumers have migrated'
            });
          }
        }
      }
    }
  }

  private checkChangelog(schemas: SchemaVersion[]) {
    if (!fs.existsSync(this.changelogPath)) {
      this.violations.push({
        schema: 'All',
        issue: 'CONTRACTS_CHANGELOG.md not found',
        severity: 'error',
        suggestion: 'Create CONTRACTS_CHANGELOG.md to track schema changes'
      });
      return;
    }
    
    const changelog = fs.readFileSync(this.changelogPath, 'utf-8');
    
    // Check if recent changes are documented
    for (const schema of schemas) {
      if (schema.version !== 'unknown' && schema.version !== 'v1') {
        const versionPattern = new RegExp(`${schema.name}.*V${schema.version.substring(1)}`, 'i');
        
        if (!versionPattern.test(changelog)) {
          this.violations.push({
            schema: schema.name,
            issue: `Version ${schema.version} not documented in changelog`,
            severity: 'warning',
            suggestion: `Add ${schema.name} ${schema.version} changes to CONTRACTS_CHANGELOG.md`
          });
        }
      }
    }
  }

  private isBreakingChange(filePath: string): boolean {
    // Simple heuristic: check if required fields were added or types changed
    // In a real implementation, you'd parse the AST to detect actual breaking changes
    
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Check for common breaking change patterns
      const breakingPatterns = [
        /\srequired:/,  // New required field
        /\.min\(\d+\)/,  // New minimum constraint
        /\.max\(\d+\)/,  // New maximum constraint
        /z\.enum\(/,     // Enum changes
        /BREAKING/i,     // Explicit breaking change comment
      ];
      
      return breakingPatterns.some(pattern => pattern.test(content));
    } catch {
      return false;
    }
  }

  private getStoredVersion(filePath: string): string {
    // In a real implementation, this would read from a metadata file
    const filename = path.basename(filePath);
    const match = filename.match(/\.v(\d+(?:\.\d+)?)\./);
    return match ? `v${match[1]}` : 'v1';
  }

  private getNextVersion(currentVersion: string): string {
    if (currentVersion === 'unknown') return '2';
    
    const versionNum = parseInt(currentVersion.replace('v', ''));
    return String(versionNum + 1);
  }

  private getContentHash(content: string): string {
    // Remove comments and whitespace for more stable hashing
    const normalized = content
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    return crypto.createHash('md5').update(normalized).digest('hex');
  }

  private loadStoredHashes() {
    const hashFile = path.join(this.projectPath, '.observer', 'schema-hashes.json');
    
    if (fs.existsSync(hashFile)) {
      try {
        const data = JSON.parse(fs.readFileSync(hashFile, 'utf-8'));
        this.schemaHashes = new Map(Object.entries(data));
      } catch {
        // Ignore errors
      }
    }
  }

  private saveStoredHashes() {
    const hashFile = path.join(this.projectPath, '.observer', 'schema-hashes.json');
    const dir = path.dirname(hashFile);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    const data = Object.fromEntries(this.schemaHashes);
    fs.writeFileSync(hashFile, JSON.stringify(data, null, 2));
  }

  public generateReport(): string {
    const results = this.validate();
    
    let report = '# Contract Version Validation Report\n\n';
    report += `## Coverage: ${results.coverage}% of schemas properly versioned\n\n`;
    
    if (results.violations.length > 0) {
      report += '## Violations\n\n';
      
      const errors = results.violations.filter(v => v.severity === 'error');
      const warnings = results.violations.filter(v => v.severity === 'warning');
      
      if (errors.length > 0) {
        report += '### 🔴 Errors (Must Fix)\n\n';
        for (const error of errors) {
          report += `- **${error.schema}**: ${error.issue}\n`;
          report += `  💡 ${error.suggestion}\n\n`;
        }
      }
      
      if (warnings.length > 0) {
        report += '### ⚠️ Warnings\n\n';
        for (const warning of warnings) {
          report += `- **${warning.schema}**: ${warning.issue}\n`;
          report += `  💡 ${warning.suggestion}\n\n`;
        }
      }
    }
    
    report += '## Schema Versions\n\n';
    report += '| Schema | Version | Status |\n';
    report += '|--------|---------|--------|\n';
    
    for (const schema of results.schemas) {
      const status = schema.deprecationDate 
        ? `Deprecated ${schema.deprecationDate}`
        : 'Active';
      report += `| ${schema.name} | ${schema.version} | ${status} |\n`;
    }
    
    return report;
  }
}