/**
 * Universal Contract Validator
 * Works with ANY folder structure, ANY database, ANY framework
 * Inspired by Postman's approach to API testing
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import * as ts from 'typescript';

interface Contract {
  schema: Record<string, any>;
  rules?: string[];
  examples?: Record<string, any>;
  boundaries?: string[];
  naming?: {
    database?: string;
    hook?: string;
    component?: string;
  };
}

interface ValidationResult {
  entity: string;
  location: string;
  type: 'error' | 'warning';
  message: string;
  expected: string;
  actual: string;
  suggestion: string;
}

export class ContractValidator {
  private contracts: Record<string, Contract> = {};
  private results: ValidationResult[] = [];
  private projectPath: string;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
    this.loadContracts();
  }

  /**
   * Load contracts from yaml/json file
   * Searches for contracts.yaml, contracts.json, or .contracts
   */
  private loadContracts() {
    const possiblePaths = [
      // Support both singular and plural forms
      path.join(this.projectPath, 'src', 'contract', 'contract.yaml'),
      path.join(this.projectPath, 'src', 'contract', 'contracts.yaml'),
      path.join(this.projectPath, 'src', 'contracts', 'contract.yaml'),
      path.join(this.projectPath, 'src', 'contracts', 'contracts.yaml'),
      path.join(this.projectPath, 'contract', 'contract.yaml'),
      path.join(this.projectPath, 'contract', 'contracts.yaml'),
      path.join(this.projectPath, 'contracts', 'contracts.yaml'),
      path.join(this.projectPath, 'contracts', 'contracts.json'),
      path.join(this.projectPath, '.contracts.yaml'),
      path.join(this.projectPath, '.contracts.json'),
      path.join(this.projectPath, 'contract.yaml'),
      path.join(this.projectPath, 'contracts.yaml'),
      path.join(this.projectPath, 'contracts.json'),
    ];

    for (const contractPath of possiblePaths) {
      if (fs.existsSync(contractPath)) {
        const content = fs.readFileSync(contractPath, 'utf-8');
        const data = contractPath.endsWith('.yaml') 
          ? yaml.load(content) as any
          : JSON.parse(content);
        
        this.contracts = data.contracts || {};
        console.log(`📋 Loaded contracts from ${contractPath}`);
        console.log(`   Found ${Object.keys(this.contracts).length} contracts`);
        return;
      }
    }

    console.log('⚠️  No contracts file found. Create contracts.yaml to define contracts.');
  }

  /**
   * Main validation - scans entire project for contract violations
   */
  async validate(): Promise<{
    score: number;
    violations: ValidationResult[];
    summary: string;
  }> {
    this.results = [];

    if (Object.keys(this.contracts).length === 0) {
      return {
        score: 0,
        violations: [],
        summary: 'No contracts defined'
      };
    }

    // Scan for all relevant files (no specific structure required!)
    const files = this.findAllFiles(this.projectPath);
    
    for (const file of files) {
      await this.validateFile(file);
    }

    // Calculate compliance score
    const score = this.calculateScore();

    return {
      score,
      violations: this.results,
      summary: this.generateSummary()
    };
  }

  /**
   * Find all code files - works with ANY structure
   */
  private findAllFiles(dir: string): string[] {
    const files: string[] = [];
    const items = fs.readdirSync(dir, { withFileTypes: true });

    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      
      // Skip node_modules and hidden directories
      if (item.name.startsWith('.') || item.name === 'node_modules') {
        continue;
      }

      if (item.isDirectory()) {
        files.push(...this.findAllFiles(fullPath));
      } else if (this.isRelevantFile(item.name)) {
        files.push(fullPath);
      }
    }

    return files;
  }

  private isRelevantFile(filename: string): boolean {
    const extensions = ['.ts', '.tsx', '.js', '.jsx', '.sql', '.prisma'];
    return extensions.some(ext => filename.endsWith(ext));
  }

  /**
   * Validate a single file against all contracts
   */
  private async validateFile(filePath: string) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const filename = path.basename(filePath);

    // Check each contract
    for (const [entityName, contract] of Object.entries(this.contracts)) {
      // Smart detection - does this file relate to this entity?
      if (this.fileRelatedToEntity(filePath, content, entityName)) {
        this.validateAgainstContract(filePath, content, entityName, contract);
      }
    }
  }

  /**
   * Smart detection - figure out if file is related to an entity
   * Works with ANY naming convention
   */
  private fileRelatedToEntity(filePath: string, content: string, entityName: string): boolean {
    const lowerEntity = entityName.toLowerCase();
    const variations = [
      lowerEntity,
      lowerEntity + 's',  // plural
      lowerEntity.slice(0, -1),  // singular if entity is plural
    ];

    // Check filename
    const filename = path.basename(filePath).toLowerCase();
    if (variations.some(v => filename.includes(v))) {
      return true;
    }

    // Check content for entity references
    if (variations.some(v => content.toLowerCase().includes(v))) {
      return true;
    }

    // Check for specific patterns
    if (content.includes(`use${entityName}`) || 
        content.includes(`${entityName}Tab`) ||
        content.includes(`${entityName}Component`)) {
      return true;
    }

    return false;
  }

  /**
   * Validate file content against a specific contract
   */
  private validateAgainstContract(
    filePath: string, 
    content: string, 
    entityName: string, 
    contract: Contract
  ) {
    const schema = contract.schema;
    const fields = Object.keys(schema);

    // Check for wrong field names
    for (const correctField of fields) {
      const violations = this.findFieldViolations(content, correctField, entityName);
      
      for (const violation of violations) {
        this.results.push({
          entity: entityName,
          location: `${filePath}:${violation.line}`,
          type: 'error',
          message: `Contract violation: Using '${violation.used}' instead of '${correctField}'`,
          expected: correctField,
          actual: violation.used,
          suggestion: `Replace '${violation.used}' with '${correctField}' as defined in contract`
        });
      }
    }

    // Check hook returns
    if (content.includes(`use${entityName}`)) {
      this.validateHookReturn(filePath, content, entityName, contract);
    }

    // Check component usage
    if (content.includes(`${entityName}Tab`) || content.includes(`${entityName}Component`)) {
      this.validateComponentUsage(filePath, content, entityName, contract);
    }
  }

  /**
   * Find common field name violations
   */
  private findFieldViolations(content: string, correctField: string, entityName: string): any[] {
    const violations = [];
    const lines = content.split('\n');
    const reportedLines = new Set(); // Track lines already reported

    // Common wrong variations
    const wrongVariations = this.getWrongVariations(correctField);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip if we already reported this line for this field
      const lineKey = `${i}-${correctField}`;
      if (reportedLines.has(lineKey)) continue;
      
      for (const wrong of wrongVariations) {
        // Use word boundary regex to avoid substring matches
        const wordBoundaryPattern = new RegExp(`\\b${wrong}\\b`);
        if (wordBoundaryPattern.test(line) && !line.includes(correctField)) {
          // Make sure it's actually for this entity
          if (line.toLowerCase().includes(entityName.toLowerCase()) ||
              lines[Math.max(0, i-5)].toLowerCase().includes(entityName.toLowerCase()) ||
              lines[Math.min(lines.length-1, i+5)].toLowerCase().includes(entityName.toLowerCase())) {
            violations.push({
              line: i + 1,
              used: wrong
            });
            reportedLines.add(lineKey); // Mark this line as reported
            break; // Only report once per line
          }
        }
      }
    }

    return violations;
  }

  /**
   * Get common wrong variations of a field name
   */
  private getWrongVariations(correctField: string): string[] {
    const variations = [];

    // If camelCase, try snake_case
    if (correctField.includes('Id')) {
      variations.push(correctField.replace('Id', '_id'));
    }
    if (/[A-Z]/.test(correctField)) {
      variations.push(
        correctField.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '')
      );
    }

    // Common mistakes
    if (correctField === 'userId') {
      variations.push('user_id', 'customerId', 'customer_id', 'uid');
    }
    if (correctField === 'totalAmount') {
      variations.push('total_amount', 'amount', 'total', 'price');
    }
    if (correctField === 'createdAt') {
      variations.push('created_at', 'created', 'timestamp', 'date');
    }

    return variations;
  }

  /**
   * Validate hook returns correct shape
   */
  private validateHookReturn(filePath: string, content: string, entityName: string, contract: Contract) {
    // Look for return statement
    const returnMatch = content.match(/return\s*{([^}]+)}/);
    if (returnMatch) {
      const returnContent = returnMatch[1];
      const schema = contract.schema;
      
      // Check if returns array of entity
      if (!returnContent.includes(entityName) && !returnContent.includes('data') && !returnContent.includes('items')) {
        this.results.push({
          entity: entityName,
          location: filePath,
          type: 'warning',
          message: `Hook may not be returning ${entityName} data`,
          expected: `${entityName}[] or { ${entityName.toLowerCase()}s: ${entityName}[] }`,
          actual: 'Unknown return type',
          suggestion: `Ensure hook returns ${entityName} array with contract fields`
        });
      }
    }
  }

  /**
   * Validate component uses correct fields
   */
  private validateComponentUsage(filePath: string, content: string, entityName: string, contract: Contract) {
    const schema = contract.schema;
    
    // Check for field access patterns
    for (const field of Object.keys(schema)) {
      const wrongVariations = this.getWrongVariations(field);
      
      for (const wrong of wrongVariations) {
        // Look for patterns like order.customer_id or item['total_amount']
        const patterns = [
          `\\.${wrong}`,
          `\\['${wrong}'\\]`,
          `\\["${wrong}"\\]`
        ];
        
        for (const pattern of patterns) {
          if (new RegExp(pattern).test(content)) {
            this.results.push({
              entity: entityName,
              location: filePath,
              type: 'error',
              message: `Component using wrong field name`,
              expected: field,
              actual: wrong,
              suggestion: `Change ${wrong} to ${field} per contract`
            });
          }
        }
      }
    }
  }

  /**
   * Calculate compliance score
   */
  private calculateScore(): number {
    if (this.results.length === 0) {
      return 100;
    }

    const errors = this.results.filter(r => r.type === 'error').length;
    const warnings = this.results.filter(r => r.type === 'warning').length;

    let score = 100;
    score -= errors * 10;
    score -= warnings * 5;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Generate summary report
   */
  private generateSummary(): string {
    const errors = this.results.filter(r => r.type === 'error');
    const warnings = this.results.filter(r => r.type === 'warning');

    let summary = `Contract Compliance Report\n`;
    summary += `==========================\n\n`;
    summary += `Contracts Defined: ${Object.keys(this.contracts).length}\n`;
    summary += `Violations Found: ${this.results.length}\n`;
    summary += `  - Errors: ${errors.length}\n`;
    summary += `  - Warnings: ${warnings.length}\n\n`;

    if (errors.length > 0) {
      summary += `Critical Issues:\n`;
      errors.slice(0, 5).forEach(e => {
        summary += `  ❌ ${e.message}\n`;
        summary += `     Location: ${e.location}\n`;
        summary += `     Fix: ${e.suggestion}\n\n`;
      });
    }

    return summary;
  }
}